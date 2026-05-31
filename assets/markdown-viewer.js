(function () {
  const contentEl = document.getElementById("markdown-content");
  const titleEl = document.getElementById("markdown-title");
  const pathEl = document.getElementById("markdown-path");
  const rawLinkEl = document.getElementById("raw-markdown-link");
  const params = new URLSearchParams(window.location.search);
  const file = params.get("file") || "";

  function isSafePath(value) {
    return (
      value &&
      !value.startsWith("/") &&
      !isExternalUrl(value) &&
      !value.split("/").includes("..")
    );
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function slugify(value) {
    return value
      .toLowerCase()
      .replace(/<[^>]+>/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  function splitOnce(value, separator) {
    const index = value.indexOf(separator);
    if (index === -1) return [value, ""];
    return [value.slice(0, index), value.slice(index + separator.length)];
  }

  function isExternalUrl(target) {
    return /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("//");
  }

  function isSafeExternalUrl(target) {
    return /^(https?:|mailto:)/i.test(target);
  }

  function viewerUrlFor(target) {
    if (!target || target.startsWith("#")) {
      return target;
    }
    if (isExternalUrl(target)) return isSafeExternalUrl(target) ? target : "#";
    const cleanTarget = target.trim().replace(/^<|>$/g, "");
    const [pathPart, hashPart] = splitOnce(cleanTarget, "#");
    const base = file.includes("/") ? file.slice(0, file.lastIndexOf("/") + 1) : "";
    const resolved = resolveRelativePath(base, pathPart);
    const hasExtension = /\/[^/]+\.[^/]+$/.test(`/${resolved}`);
    const markdownPath =
      resolved.endsWith(".md") ? resolved : !hasExtension ? `${resolved.replace(/\/?$/, "/")}README.md` : "";

    if (!markdownPath) {
      return `${resolved}${hashPart ? `#${hashPart}` : ""}`;
    }
    return `md-viewer.html?file=${encodeURIComponent(markdownPath)}${hashPart ? `#${hashPart}` : ""}`;
  }

  function assetUrlFor(target) {
    if (!target || target.startsWith("#")) {
      return target;
    }
    if (isExternalUrl(target)) return isSafeExternalUrl(target) ? target : "";
    const cleanTarget = target.trim().replace(/^<|>$/g, "");
    const [pathPart, hashPart] = splitOnce(cleanTarget, "#");
    const base = file.includes("/") ? file.slice(0, file.lastIndexOf("/") + 1) : "";
    const resolved = resolveRelativePath(base, pathPart);
    return `${resolved}${hashPart ? `#${hashPart}` : ""}`;
  }

  function resolveRelativePath(base, target) {
    const stack = [];
    `${base}${target}`.split("/").forEach((part) => {
      if (!part || part === ".") return;
      if (part === "..") {
        stack.pop();
      } else {
        stack.push(part);
      }
    });
    return stack.join("/");
  }

  function inlineMarkdown(value) {
    const placeholders = [];
    const stash = (html) => {
      const token = `\u0000${placeholders.length}\u0000`;
      placeholders.push(html);
      return token;
    };

    let text = String(value);
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, href) => {
      const cleanHref = href.trim().replace(/^<|>$/g, "");
      return stash(`<img src="${escapeHtml(assetUrlFor(cleanHref))}" alt="${escapeHtml(alt)}">`);
    });
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => {
      const cleanHref = href.trim().replace(/^<|>$/g, "");
      return stash(`<a href="${escapeHtml(viewerUrlFor(cleanHref))}">${inlineMarkdown(label)}</a>`);
    });
    text = escapeHtml(text);
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    placeholders.forEach((html, index) => {
      text = text.replaceAll(`\u0000${index}\u0000`, html);
    });
    return text;
  }

  function splitTableRow(line) {
    const trimmed = line.trim().replace(/^\||\|$/g, "");
    const cells = [];
    let cell = "";
    let escaped = false;
    for (const char of trimmed) {
      if (escaped) {
        cell += char;
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "|") {
        cells.push(cell);
        cell = "";
      } else {
        cell += char;
      }
    }
    cells.push(cell);
    return cells;
  }

  function isTableSeparator(line) {
    return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  }

  function renderTable(lines) {
    const rows = lines.map(splitTableRow);
    const head = rows.shift() || [];
    rows.shift();
    const body = rows
      .map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell.trim())}</td>`).join("")}</tr>`)
      .join("");
    return `<div class="markdown-table-wrap"><table><thead><tr>${head
      .map((cell) => `<th>${inlineMarkdown(cell.trim())}</th>`)
      .join("")}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function renderMarkdown(markdown) {
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    const html = [];
    let paragraph = [];
    let list = [];
    let orderedList = [];
    let table = [];
    let code = [];
    let inCode = false;

    const flushParagraph = () => {
      if (paragraph.length) {
        html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
        paragraph = [];
      }
    };
    const flushList = () => {
      if (list.length) {
        html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
        list = [];
      }
    };
    const flushOrderedList = () => {
      if (orderedList.length) {
        html.push(`<ol>${orderedList.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ol>`);
        orderedList = [];
      }
    };
    const flushTable = () => {
      if (table.length) {
        html.push(renderTable(table));
        table = [];
      }
    };

    const flushBlocks = () => {
      flushParagraph();
      flushList();
      flushOrderedList();
      flushTable();
    };

    lines.forEach((line, index) => {
      if (line.startsWith("```")) {
        if (inCode) {
          html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
          code = [];
          inCode = false;
        } else {
          flushBlocks();
          inCode = true;
        }
        return;
      }
      if (inCode) {
        code.push(line);
        return;
      }
      if (!line.trim()) {
        flushBlocks();
        return;
      }
      if (/^\|.+\|$/.test(line) && (table.length || isTableSeparator(lines[index + 1] || ""))) {
        flushParagraph();
        flushList();
        flushOrderedList();
        table.push(line);
        return;
      }
      flushTable();
      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        flushOrderedList();
        const level = heading[1].length;
        const text = inlineMarkdown(heading[2].trim());
        const id = slugify(heading[2]);
        html.push(`<h${level} id="${id}">${text}</h${level}>`);
        return;
      }
      const listItem = line.match(/^\s*[-*]\s+(.+)$/);
      if (listItem) {
        flushParagraph();
        flushOrderedList();
        list.push(listItem[1].trim());
        return;
      }
      const orderedListItem = line.match(/^\s*\d+\.\s+(.+)$/);
      if (orderedListItem) {
        flushParagraph();
        flushList();
        orderedList.push(orderedListItem[1].trim());
        return;
      }
      const quote = line.match(/^>\s?(.*)$/);
      if (quote) {
        flushParagraph();
        flushList();
        flushOrderedList();
        html.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
        return;
      }
      paragraph.push(line.trim());
    });

    flushParagraph();
    flushList();
    flushOrderedList();
    flushTable();
    if (inCode) {
      html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
    }
    return html.join("\n");
  }

  async function load() {
    if (!isSafePath(file)) {
      titleEl.textContent = "Markdown file not selected";
      contentEl.innerHTML = '<p class="empty">Open this viewer with a safe <code>?file=path/to/file.md</code> query.</p>';
      return;
    }
    rawLinkEl.href = file;
    pathEl.textContent = file;
    try {
      const response = await fetch(file, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const firstHeading = text.match(/^#\s+(.+)$/m);
      titleEl.textContent = firstHeading ? firstHeading[1].replace(/[*_`]/g, "") : file.split("/").pop();
      contentEl.innerHTML = renderMarkdown(text);
    } catch (error) {
      titleEl.textContent = "Could not load Markdown";
      contentEl.innerHTML = `<p class="empty">Unable to load <code>${escapeHtml(file)}</code>: ${escapeHtml(error.message)}</p>`;
    }
  }

  load();
})();
