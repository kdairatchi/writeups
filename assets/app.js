const totals = {
  reports: document.getElementById("reports-total"),
  writeups: document.getElementById("writeups-total"),
  all: document.getElementById("all-total"),
};

const generatedAtEl = document.getElementById("generated-at");
const listEl = document.getElementById("library-list");
const emptyEl = document.getElementById("library-empty");
const searchEl = document.getElementById("library-search");
const summaryEl = document.getElementById("library-summary");
const syncStatusEl = document.getElementById("sync-status");
const heroTotalFilesEl = document.getElementById("hero-total-files");
const filterEls = Array.from(document.querySelectorAll(".filter-chip"));
const expandedReadEls = Array.from(document.querySelectorAll(".expanded-read"));
const readVisibleEl = document.getElementById("read-visible");
const readCategoryEl = document.getElementById("read-category");
const stopReadingEl = document.getElementById("stop-reading");
const voiceTestEl = document.getElementById("voice-test");
const voiceRateEl = document.getElementById("voice-rate");
const voicePitchEl = document.getElementById("voice-pitch");
const voiceVolumeEl = document.getElementById("voice-volume");
const voiceRateValEl = document.getElementById("voice-rate-val");
const voicePitchValEl = document.getElementById("voice-pitch-val");
const voiceVolumeValEl = document.getElementById("voice-volume-val");
const voiceSelectEl = document.getElementById("voice-select");
const voiceStatusEl = document.getElementById("voice-status");
const sourceLists = {
  reports: document.getElementById("reports-sources"),
  writeups: document.getElementById("writeups-sources"),
  methodology: document.getElementById("methodology-sources"),
};
const expandedLists = {
  reports: document.getElementById("reports-expanded"),
  writeups: document.getElementById("writeups-expanded"),
  methodology: document.getElementById("methodology-expanded"),
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

/** Resolves a GitHub Pages-safe URL and renders Markdown through the local viewer. */
function browseEntryUrl(entry) {
  if (entry.browse_url) return pageUrlFor(entry.browse_url);
  const dest = entry.dest || "";
  if (dest.endsWith(".md")) return pageUrlFor(dest);
  if (entry.name === "methodology") return `${dest}/index.html`;
  if (dest) return pageUrlFor(`${dest}/README.md`);
  return "#";
}

function pageUrlFor(path) {
  if (!path || !path.endsWith(".md")) return path;
  return `md-viewer.html?file=${encodeURIComponent(path)}`;
}

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

function createListItem(entry, index) {
  const item = document.createElement("article");
  item.className = "library-item";
  item.setAttribute("role", "listitem");
  item.style.setProperty("--stagger", String(Math.min(index ?? 0, 14)));

  const href = browseEntryUrl(entry);
  const tags = [mapCoreSection(entry), fileLabel(entry.files), formatBytes(entry.bytes)];

  const heading = document.createElement("h3");
  const anchor = document.createElement("a");
  anchor.href = href;
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

  const openRow = document.createElement("div");
  openRow.className = "library-item-actions";
  const openBtn = document.createElement("a");
  openBtn.className = "library-open-link";
  openBtn.href = href;
  openBtn.textContent = "Open";
  openRow.appendChild(openBtn);

  item.appendChild(heading);
  item.appendChild(description);
  item.appendChild(tagWrap);
  item.appendChild(openRow);
  return item;
}

function formatTimestamp(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function createMiniLink(entry) {
  const anchor = document.createElement("a");
  anchor.href = browseEntryUrl(entry);
  anchor.className = "mini-link";
  const name = document.createElement("strong");
  name.textContent = entry.name || "unnamed";
  const meta = document.createElement("span");
  meta.textContent = `${fileLabel(entry.files)} · ${formatBytes(entry.bytes)}`;
  anchor.appendChild(name);
  anchor.appendChild(meta);
  return anchor;
}

function createExpandedItem(entry) {
  const wrapper = document.createElement("article");
  wrapper.className = "expanded-item";

  const title = document.createElement("strong");
  const link = document.createElement("a");
  const href = browseEntryUrl(entry);
  link.href = href;
  link.textContent = entry.name || "unnamed";
  title.appendChild(link);

  const description = document.createElement("p");
  description.textContent = entry.description || "No description provided.";

  const meta = document.createElement("p");
  meta.className = "expanded-meta";
  meta.textContent = `${mapCoreSection(entry)} · ${fileLabel(entry.files)} · ${formatBytes(entry.bytes)}`;

  const destLine = document.createElement("p");
  destLine.className = "expanded-dest";
  const destLabel = document.createElement("span");
  destLabel.textContent = "Open: ";
  const destA = document.createElement("a");
  destA.href = href;
  destA.textContent = href;
  destLine.appendChild(destLabel);
  destLine.appendChild(destA);

  wrapper.appendChild(title);
  wrapper.appendChild(description);
  wrapper.appendChild(meta);
  wrapper.appendChild(destLine);
  return wrapper;
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

function renderExpandedCategories(entries) {
  Object.values(expandedLists).forEach((element) => {
    element.innerHTML = "";
  });

  entries.forEach((entry) => {
    if (entry.category === "reports") {
      expandedLists.reports.appendChild(createExpandedItem(entry));
    } else if (entry.name === "medium-feed" || entry.name === "methodology") {
      expandedLists.methodology.appendChild(createExpandedItem(entry));
    } else {
      expandedLists.writeups.appendChild(createExpandedItem(entry));
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
  entries.forEach((entry, index) => listEl.appendChild(createListItem(entry, index)));
}

function filterEntries(entries, activeFilter, term) {
  return entries.filter((entry) => {
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "reports" && entry.category === "reports") ||
      (activeFilter === "writeups" &&
        entry.category === "writeups" &&
        entry.name !== "medium-feed" &&
        entry.name !== "methodology") ||
      (activeFilter === "methodology" &&
        (entry.name === "medium-feed" || entry.name === "methodology"));

    if (!matchesFilter) return false;
    if (!term) return true;

    const openUrl = browseEntryUrl(entry);
    const haystack = [
      entry.name,
      entry.category,
      entry.description,
      entry.dest,
      entry.browse_url,
      openUrl,
      mapCoreSection(entry),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
}

function updateSummary(entries, activeFilter, term) {
  const filterLabel = {
    all: "all sources",
    reports: "reports",
    writeups: "writeups",
    methodology: "Medium / methodology",
  }[activeFilter];

  const searchLabel = term ? ` matching "${term}"` : "";
  summaryEl.textContent = `${formatNumber(entries.length)} entries in ${filterLabel}${searchLabel}`;
}

function getEntriesByFilter(entries, activeFilter) {
  return filterEntries(entries, activeFilter, "");
}

function buildSpeechText(entries, label) {
  const intro = `${label}. ${entries.length} entries available.`;
  const lines = entries.map((entry, index) => {
    const url = browseEntryUrl(entry);
    return `${index + 1}. ${entry.name}. ${entry.description || "No description provided"}. ${fileLabel(entry.files)}. Open ${url}.`;
  });
  return [intro, ...lines].join(" ");
}

function bindVoiceLabel(rangeEl, valEl, fmt) {
  if (!rangeEl || !valEl) return;
  const sync = () => {
    valEl.textContent = fmt(rangeEl.value);
  };
  rangeEl.addEventListener("input", sync);
  sync();
}

function getSelectedVoice() {
  if (!voiceSelectEl || !voiceSelectEl.value) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.voiceURI === voiceSelectEl.value) || null;
}

function populateVoiceList() {
  if (!voiceSelectEl || !("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const list = preferred.length ? preferred : voices;
  const current = voiceSelectEl.value;
  voiceSelectEl.innerHTML = '<option value="">Default (system)</option>';
  list
    .slice()
    .sort((a, b) => `${a.name}`.localeCompare(`${b.name}`))
    .forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v.voiceURI;
      opt.textContent = `${v.name} (${v.lang})`;
      voiceSelectEl.appendChild(opt);
    });
  if (current && [...voiceSelectEl.options].some((o) => o.value === current)) {
    voiceSelectEl.value = current;
  }
}

function speakText(text) {
  if (!voiceStatusEl) return;
  if (!("speechSynthesis" in window)) {
    voiceStatusEl.textContent = "Speech synthesis is not available in this browser";
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = Number(voiceRateEl?.value || 1);
  utterance.pitch = Number(voicePitchEl?.value || 1);
  utterance.volume = Number(voiceVolumeEl?.value ?? 1);
  const v = getSelectedVoice();
  if (v) {
    utterance.voice = v;
  }
  utterance.onstart = () => {
    voiceStatusEl.textContent = "Speech playing";
  };
  utterance.onend = () => {
    voiceStatusEl.textContent = "Speech complete";
  };
  utterance.onerror = () => {
    voiceStatusEl.textContent = "Speech error";
  };
  window.speechSynthesis.speak(utterance);
}

function wireVoiceChrome() {
  bindVoiceLabel(voiceRateEl, voiceRateValEl, (v) => Number(v).toFixed(2));
  bindVoiceLabel(voicePitchEl, voicePitchValEl, (v) => Number(v).toFixed(2));
  bindVoiceLabel(voiceVolumeEl, voiceVolumeValEl, (v) => `${Math.round(Number(v) * 100)}%`);

  if ("speechSynthesis" in window) {
    populateVoiceList();
    window.speechSynthesis.addEventListener("voiceschanged", populateVoiceList);
  }

  voiceTestEl?.addEventListener("click", () => {
    speakText("Bug bounty library voice check. Filters and manifest entries use working open links.");
  });
}

async function loadManifest() {
  wireVoiceChrome();
  try {
    const response = await fetch("MANIFEST.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest = await response.json();

    totals.reports.textContent = formatNumber(manifest?.totals?.reports);
    totals.writeups.textContent = formatNumber(manifest?.totals?.writeups);
    totals.all.textContent = formatNumber(manifest?.totals?.all);
    generatedAtEl.textContent = `Last indexed: ${manifest.generated_at || "-"}`;
    syncStatusEl.textContent = formatTimestamp(manifest.generated_at);
    heroTotalFilesEl.textContent = fileLabel(manifest?.totals?.all);

    const entries = Object.values(manifest.sources || {}).sort((a, b) => {
      const aCategory = `${a.category || ""}-${a.name || ""}`;
      const bCategory = `${b.category || ""}-${b.name || ""}`;
      return aCategory.localeCompare(bCategory);
    });

    renderSourceBreakdown(entries);
    renderExpandedCategories(entries);
    let activeFilter = "all";

    const applyFilters = () => {
      const term = searchEl.value.trim().toLowerCase();
      const filtered = filterEntries(entries, activeFilter, term);
      renderList(filtered);
      updateSummary(filtered, activeFilter, term);
    };

    renderList(entries);
    updateSummary(entries, activeFilter, "");

    searchEl.addEventListener("input", applyFilters);
    filterEls.forEach((element) => {
      element.addEventListener("click", () => {
        activeFilter = element.dataset.filter || "all";
        filterEls.forEach((chip) => {
          chip.classList.toggle("active", chip === element);
        });
        applyFilters();
      });
    });

    readVisibleEl.addEventListener("click", () => {
      const term = searchEl.value.trim().toLowerCase();
      const filtered = filterEntries(entries, activeFilter, term);
      speakText(buildSpeechText(filtered, "Visible library results"));
    });

    readCategoryEl.addEventListener("click", () => {
      const filtered = getEntriesByFilter(entries, activeFilter);
      const label = {
        all: "All library categories",
        reports: "Reports category",
        writeups: "Writeups category",
        methodology: "Medium and methodology category",
      }[activeFilter];
      speakText(buildSpeechText(filtered, label));
    });

    stopReadingEl.addEventListener("click", () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (voiceStatusEl) voiceStatusEl.textContent = "Speech stopped";
    });

    expandedReadEls.forEach((element) => {
      element.addEventListener("click", () => {
        const target = element.dataset.expandedTarget || "";
        const labelMap = {
          "reports-expanded": "Reports category",
          "writeups-expanded": "Writeups category",
          "methodology-expanded": "Medium and methodology category",
        };
        const filterMap = {
          "reports-expanded": "reports",
          "writeups-expanded": "writeups",
          "methodology-expanded": "methodology",
        };
        speakText(
          buildSpeechText(
            getEntriesByFilter(entries, filterMap[target]),
            labelMap[target]
          )
        );
      });
    });
  } catch (error) {
    generatedAtEl.textContent = `Last indexed: unavailable (${error.message})`;
    syncStatusEl.textContent = "manifest unavailable";
    heroTotalFilesEl.textContent = "-";
    summaryEl.textContent = "Unable to load library entries";
    if (voiceStatusEl) voiceStatusEl.textContent = "Speech unavailable until manifest loads";
    listEl.innerHTML = '<p class="empty">Unable to load MANIFEST.json. Run sync_library.py to regenerate metadata.</p>';
  }
}

loadManifest();
