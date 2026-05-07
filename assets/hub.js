(function () {
  const category = document.body.dataset.hub;
  const gridEl = document.getElementById("hub-grid");
  const emptyEl = document.getElementById("hub-empty");
  const syncedEl = document.getElementById("hub-synced");
  const countEl = document.getElementById("hub-count");

  const formatNumber = (n) => new Intl.NumberFormat("en-US").format(n || 0);

  function formatBytes(value) {
    let size = Number(value || 0);
    const units = ["bytes", "KB", "MB", "GB"];
    for (const unit of units) {
      if (size < 1024 || unit === "GB") {
        return unit === "bytes" ? `${size} bytes` : `${size.toFixed(1)} ${unit}`;
      }
      size /= 1024;
    }
    return `${value || 0} bytes`;
  }

  function formatTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(d);
  }

  function card(entry) {
    const art = document.createElement("article");
    art.className = "hub-card";
    art.setAttribute("role", "listitem");
    art.setAttribute("data-name", entry.name || "");

    const href = entry.browse_url || entry.dest || "#";
    const title = document.createElement("h3");
    const a = document.createElement("a");
    a.href = href;
    a.textContent = entry.name || "unnamed";
    title.appendChild(a);

    const desc = document.createElement("p");
    desc.className = "hub-card-desc";
    desc.textContent = entry.description || "";

    const meta = document.createElement("div");
    meta.className = "hub-card-meta";
    meta.innerHTML = `<span>${formatNumber(entry.files)} files</span><span>${formatBytes(entry.bytes)}</span>`;

    const row = document.createElement("div");
    row.className = "hub-card-actions";
    const open = document.createElement("a");
    open.className = "button primary compact";
    open.href = href;
    open.textContent = "Open entry point";
    row.appendChild(open);

    art.appendChild(title);
    art.appendChild(desc);
    art.appendChild(meta);
    art.appendChild(row);
    return art;
  }

  if (!category || !gridEl) return;

  fetch("../MANIFEST.json", { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((manifest) => {
      const entries = Object.values(manifest.sources || {})
        .filter((e) => e.category === category)
        .sort((a, b) => `${a.name}`.localeCompare(`${b.name}`));

      if (syncedEl) syncedEl.textContent = formatTime(manifest.generated_at);
      if (countEl) countEl.textContent = formatNumber(entries.length);

      gridEl.innerHTML = "";
      if (!entries.length) {
        emptyEl?.classList.remove("hidden");
        return;
      }
      emptyEl?.classList.add("hidden");
      entries.forEach((e) => gridEl.appendChild(card(e)));
    })
    .catch(() => {
      if (syncedEl) syncedEl.textContent = "unavailable";
      if (countEl) countEl.textContent = "—";
      gridEl.innerHTML = "";
      if (emptyEl) {
        emptyEl.textContent = "Could not load ../MANIFEST.json. Open this site from the repo root on GitHub Pages.";
        emptyEl.classList.remove("hidden");
      }
    });
})();
