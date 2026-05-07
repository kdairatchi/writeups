const totals = {
  reports: document.getElementById("reports-total"),
  writeups: document.getElementById("writeups-total"),
  all: document.getElementById("all-total"),
};

const generatedAtEl = document.getElementById("generated-at");
const listEl = document.getElementById("library-list");
const emptyEl = document.getElementById("library-empty");
const searchEl = document.getElementById("library-search");
const sourceLists = {
  reports: document.getElementById("reports-sources"),
  writeups: document.getElementById("writeups-sources"),
  methodology: document.getElementById("methodology-sources"),
};

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(value || 0);
const formatBytes = (value) => {
  let size = Number(value || 0);
  const units = ["bytes", "KB", "MB", "GB"];
  for (const unit of units) {
    if (size < 1024 || unit === units[units.length - 1]) {
      return unit === "bytes" ? `${size} bytes` : `${size.toFixed(1)} ${unit}`;
    }
    size /= 1024;
  }
  return `${value || 0} bytes`;
};
const fileLabel = (value) => {
  const count = Number(value || 0);
  return `${formatNumber(count)} file${count === 1 ? "" : "s"}`;
};

function mapCoreSection(entry) {
  if (entry.category === "reports") {
    return "Reports";
  }
  if (entry.name === "medium-feed") {
    return "Medium Feed / Search";
  }
  if (entry.name === "methodology") {
    return "Methodology / Search";
  }
  return "Writeups";
}

function createListItem(entry) {
  const item = document.createElement("article");
  item.className = "library-item";
  item.setAttribute("role", "listitem");

  const link = entry.dest || "";
  const tags = [
    mapCoreSection(entry),
    fileLabel(entry.files),
    formatBytes(entry.bytes),
  ];

  const heading = document.createElement("h3");
  const anchor = document.createElement("a");
  anchor.href = link;
  anchor.textContent = entry.name || "unnamed";
  heading.appendChild(anchor);

  const description = document.createElement("p");
  description.textContent = entry.description || "No description provided.";

  const tagWrap = document.createElement("div");
  tagWrap.className = "tags";
  tags.forEach((tag) => {
    const chip = document.createElement("span");
    chip.className = "tag";
    chip.textContent = tag;
    tagWrap.appendChild(chip);
  });

  item.appendChild(heading);
  item.appendChild(description);
  item.appendChild(tagWrap);
  return item;
}

function createMiniLink(entry) {
  const anchor = document.createElement("a");
  anchor.href = entry.dest || "#";
  anchor.className = "mini-link";
  const name = document.createElement("strong");
  name.textContent = entry.name || "unnamed";
  const meta = document.createElement("span");
  meta.textContent = `${fileLabel(entry.files)} · ${formatBytes(entry.bytes)}`;
  anchor.appendChild(name);
  anchor.appendChild(meta);
  return anchor;
}

function renderSourceBreakdown(entries) {
  Object.values(sourceLists).forEach((element) => {
    element.innerHTML = "";
  });

  entries.forEach((entry) => {
    if (entry.category === "reports") {
      sourceLists.reports.appendChild(createMiniLink(entry));
    } else if (entry.name === "medium-feed" || entry.name === "methodology") {
      sourceLists.methodology.appendChild(createMiniLink(entry));
    } else {
      sourceLists.writeups.appendChild(createMiniLink(entry));
    }
  });
}

function renderList(entries) {
  listEl.innerHTML = "";
  if (!entries.length) {
    emptyEl.classList.remove("hidden");
    return;
  }
  emptyEl.classList.add("hidden");
  entries.forEach((entry) => listEl.appendChild(createListItem(entry)));
}

async function loadManifest() {
  try {
    const response = await fetch("MANIFEST.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest = await response.json();

    totals.reports.textContent = formatNumber(manifest?.totals?.reports);
    totals.writeups.textContent = formatNumber(manifest?.totals?.writeups);
    totals.all.textContent = formatNumber(manifest?.totals?.all);
    generatedAtEl.textContent = `Last indexed: ${manifest.generated_at || "-"}`;

    const entries = Object.values(manifest.sources || {}).sort((a, b) => {
      const aCategory = `${a.category || ""}-${a.name || ""}`;
      const bCategory = `${b.category || ""}-${b.name || ""}`;
      return aCategory.localeCompare(bCategory);
    });

    renderList(entries);
    renderSourceBreakdown(entries);
    searchEl.addEventListener("input", () => {
      const term = searchEl.value.trim().toLowerCase();
      if (!term) {
        renderList(entries);
        return;
      }
      const filtered = entries.filter((entry) => {
        const haystack = [
          entry.name,
          entry.category,
          entry.description,
          entry.dest,
          mapCoreSection(entry),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      });
      renderList(filtered);
    });
  } catch (error) {
    generatedAtEl.textContent = `Last indexed: unavailable (${error.message})`;
    listEl.innerHTML = '<p class="empty">Unable to load MANIFEST.json. Run sync_library.py to regenerate metadata.</p>';
  }
}

loadManifest();
