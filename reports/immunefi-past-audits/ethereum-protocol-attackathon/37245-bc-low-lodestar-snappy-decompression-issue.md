# #37245 \[BC-Low] lodestar snappy decompression issue

**Submitted on Nov 29th 2024 at 22:10:57 UTC by @gln for** [**Attackathon | Ethereum Protocol**](https://immunefi.com/audit-competition/ethereum-protocol-attackathon)

* **Report ID:** #37245
* **Report Type:** Blockchain/DLT
* **Report severity:** Low
* **Target:** https://github.com/chainsafe/lodestar
* **Impacts:**
  * Unintended permanent chain split affecting greater than or equal to 25% of the network, requiring hard fork (network partition requiring hard fork)

## Description

## Brief/Intro

Lodestar client may fail to decode snappy framing compressed messages.

## Vulnerability Details

In Req/Resp protocol the message are encoded by using ssz\_snappy encoding,\
which is basically snappy framing compression over ssz encoded message.

It's mentioned here - https://github.com/ethereum/consensus-specs/blob/dev/specs/phase0/p2p-interface.md

```
The token of the negotiated protocol ID specifies the type of encoding to be used for the req/resp interaction. Only one value is possible at this time:

ssz_snappy: The contents are first SSZ-encoded and then compressed with Snappy frames compression. For objects containing a single field, only the field is SSZ-encoded not a container with a single field. For example, the BeaconBlocksByRoot request is an SSZ-encoded list of Root's. This encoding type MUST be supported by all clients.
```

In snappy framing format there a few types of chunks.

We are interested in so called reserved skippable chunks.\
These are chunks with chunk type in range \[0x80, 0xfd]

Let's see how rust snappy handles them https://github.com/BurntSushi/rust-snappy/blob/master/src/read.rs#L137

```
impl<R: io::Read> io::Read for FrameDecoder<R> {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
 		   ... 
           ...
  		    let len = len64 as usize;
            match ty {
                Err(b) if 0x02 <= b && b <= 0x7F => {
                    // Spec says that chunk types 0x02-0x7F are reserved and
                    // conformant decoders must return an error.
                    fail!(Error::UnsupportedChunkType { byte: b });
                }
                Err(b) if 0x80 <= b && b <= 0xFD => {
                    // Spec says that chunk types 0x80-0xFD are reserved but
                    // skippable.
                    self.r.read_exact(&mut self.src[0..len])?;
                }
```

Similar code can be found in golang implementation - https://github.com/golang/snappy/blob/master/decode.go#L221

```
func (r *Reader) fill() error {
	...
	if chunkType <= 0x7f {
			// Section 4.5. Reserved unskippable chunks (chunk types 0x02-0x7f).
			r.err = ErrUnsupported
			return r.err
		}
		// Section 4.4 Padding (chunk type 0xfe).
		// Section 4.6. Reserved skippable chunks (chunk types 0x80-0xfd).
		if !r.readFull(r.buf[:chunkLen], false) {
			return r.err
		}
```

Now let's see how lodestar handles such chunks https://github.com/ChainSafe/lodestar/blob/unstable/packages/reqresp/src/encodingStrategies/sszSnappy/snappyFrames/uncompress.ts#L17

```
uncompress(chunk: Uint8ArrayList): Uint8ArrayList | null {
    this.buffer.append(chunk);
    const result = new Uint8ArrayList();
    while (this.buffer.length > 0) {
      if (this.buffer.length < 4) break;

      const type = getChunkType(this.buffer.get(0));
      const frameSize = getFrameSize(this.buffer, 1);

      if (this.buffer.length - 4 < frameSize) {
        break;
      }

      const data = this.buffer.subarray(4, 4 + frameSize);
      this.buffer.consume(4 + frameSize);

      if (!this.state.foundIdentifier && type !== ChunkType.IDENTIFIER) {
        throw "malformed input: must begin with an identifier";
      }

      if (type === ChunkType.IDENTIFIER) {
        if (!Buffer.prototype.equals.call(data, IDENTIFIER)) {
          throw "malformed input: bad identifier";
        }
        this.state.foundIdentifier = true;
        continue;
      }

      if (type === ChunkType.COMPRESSED) {
        result.append(uncompress(data.subarray(4)));
      }
      if (type === ChunkType.UNCOMPRESSED) {
        result.append(data.subarray(4));
      }
    }
    if (result.length === 0) {
      return null;
    }
    return result;
  }

 function getChunkType(value: number): ChunkType {
  switch (value) {
    case ChunkType.IDENTIFIER:
      return ChunkType.IDENTIFIER;
    case ChunkType.COMPRESSED:
      return ChunkType.COMPRESSED;
    case ChunkType.UNCOMPRESSED:
      return ChunkType.UNCOMPRESSED;
    case ChunkType.PADDING:
      return ChunkType.PADDING;
    default:
      throw new Error("Unsupported snappy chunk type");
  }

```

As you can see, lodestar does not recognize such chunks.

If it sees such chunk, function getChunkType() throws an exception and decoding fails.

## Impact Details

Faulty nodes may trigger chain stall by sending messages which lodestar fails to parse, while other clients will be able to handle.

## Link to Proof of Concept

https://gist.github.com/gln7/bdde7f4e0bdf9d47bf810a015796867a

## Proof of Concept

## Proof of Concept

How to reproduce:

1. get archive (via provided gist link), decode and unpack it:

```
$ base64 -d poc.txt > poc.tgz
$ tar zxf poc.tgz
```

2. run dec1.go to verify that our snappy file decompressed successfully

```
$ go run dec1.go

reading 1.snappy...
read 124 bytes, err <nil>

```

3. run dec1.mjs to verify that lodestar fails to decode such file

```
checking chunk type=255
checking chunk type=1
got uncompressed chunk..
checking chunk type=129
file:///../poc/dec1.mjs:74
            throw new Error("Unsupported snappy chunk type");

```
