# Shardeum Ancillaries III

## Reports by Severity

<details>

<summary>Critical</summary>

* \#39626 \[W\&A-Critical] Malicious Validator Can Overwrite Any Cycle Data
* \#39872 \[W\&A-Critical] Bypass Receipt Signing Validation
* \#39893 \[W\&A-Critical] Malicious Validator Can Modify \`txId\` in Global Transactions
* \#39434 \[W\&A-Critical] Improper serialization can create an out-of-memory (OOM) issue on the archive server.
* \#39980 \[W\&A-Critical] Malicious validator can inject its own cycle record into connected archiver
* \#40004 \[W\&A-Critical] Multiple vulnerabilities in signature verification during receipt processing on the archiver server
* \#39829 \[W\&A-Critical] DOS archiver via data subscription channel due to broken safeStringfy

</details>

<details>

<summary>Medium</summary>

* \#39820 \[W\&A-Medium] Blocking all users from interacting with particular contracts/protocols via JSON-RPC server
* \#39284 \[W\&A-Medium] Arbitrarily set any archiver config and remotely turning it off
* \#39910 \[W\&A-Medium] Numerous replay attacks (with arbitrary data) to protected endpoints are possible
* \#39942 \[W\&A-Medium] Archiver is still vulnerable to replay attack to \`/set-config\`

</details>

<details>

<summary>Low</summary>

* \#39993 \[W\&A-Low] node-fetch without response limit
* \#39623 \[W\&A-Low] Blocking the victim's account address from sending transactions via JSON-RPC
* \#39814 \[W\&A-Low] Prevent new validators from joining the network by a DOS of the archiver

</details>

<details>

<summary>Insight</summary>

* \#39109 \[W\&A-Insight] syncStateDataGlobals will not work, effectively DoS'ing nodes
* \#39944 \[W\&A-Insight] Incorrect Default Configuration Leading to Dead Code
* \#39360 \[W\&A-Insight] getRandomActiveNodes may return inconsistent results

</details>

## Reports by Type

<details>

<summary>Websites &#x26; Applications</summary>

* \#39993 \[W\&A-Low] node-fetch without response limit
* \#39820 \[W\&A-Medium] Blocking all users from interacting with particular contracts/protocols via JSON-RPC server
* \#39626 \[W\&A-Critical] Malicious Validator Can Overwrite Any Cycle Data
* \#39623 \[W\&A-Low] Blocking the victim's account address from sending transactions via JSON-RPC
* \#39109 \[W\&A-Insight] syncStateDataGlobals will not work, effectively DoS'ing nodes
* \#39284 \[W\&A-Medium] Arbitrarily set any archiver config and remotely turning it off
* \#39814 \[W\&A-Low] Prevent new validators from joining the network by a DOS of the archiver
* \#39872 \[W\&A-Critical] Bypass Receipt Signing Validation
* \#39893 \[W\&A-Critical] Malicious Validator Can Modify \`txId\` in Global Transactions
* \#39910 \[W\&A-Medium] Numerous replay attacks (with arbitrary data) to protected endpoints are possible
* \#39944 \[W\&A-Insight] Incorrect Default Configuration Leading to Dead Code
* \#39434 \[W\&A-Critical] Improper serialization can create an out-of-memory (OOM) issue on the archive server.
* \#39980 \[W\&A-Critical] Malicious validator can inject its own cycle record into connected archiver
* \#39942 \[W\&A-Medium] Archiver is still vulnerable to replay attack to \`/set-config\`
* \#40004 \[W\&A-Critical] Multiple vulnerabilities in signature verification during receipt processing on the archiver server
* \#39829 \[W\&A-Critical] DOS archiver via data subscription channel due to broken safeStringfy
* \#39360 \[W\&A-Insight] getRandomActiveNodes may return inconsistent results

</details>
