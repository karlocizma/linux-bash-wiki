const elements = {
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  riskFilter: document.getElementById("riskFilter"),
  sortFilter: document.getElementById("sortFilter"),
  scriptGrid: document.getElementById("scriptGrid"),
  scriptDetail: document.getElementById("scriptDetail"),
  resultsCount: document.getElementById("resultsCount"),
  statusMessage: document.getElementById("statusMessage")
};

const state = {
  scripts: [],
  selectedId: null
};

const riskOrder = {
  low: 0,
  medium: 1,
  high: 2
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  loadScripts();
});

function bindEvents() {
  elements.searchInput.addEventListener("input", render);
  elements.categoryFilter.addEventListener("change", render);
  elements.riskFilter.addEventListener("change", render);
  elements.sortFilter.addEventListener("change", render);
}

async function loadScripts() {
  try {
    const response = await fetch("data/scripts.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load scripts.json: ${response.status}`);
    }

    const payload = await response.json();
    state.scripts = Array.isArray(payload.scripts) ? payload.scripts : [];
    populateCategoryFilter();

    if (state.scripts.length > 0) {
      state.selectedId = state.scripts[0].id;
    }

    render();
  } catch (error) {
    elements.resultsCount.textContent = "Unable to load scripts.";
    elements.scriptGrid.innerHTML = "<p class=\"small-note\">Could not load script data. Check data/scripts.json.</p>";
    setStatus(error.message, true);
  }
}

function populateCategoryFilter() {
  const categories = [...new Set(state.scripts.map((script) => script.category))].sort((a, b) => a.localeCompare(b));
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.categoryFilter.appendChild(option);
  }
}

function render() {
  const filtered = getFilteredScripts();
  elements.resultsCount.textContent = `${filtered.length} script${filtered.length === 1 ? "" : "s"} found`;

  if (!filtered.some((script) => script.id === state.selectedId)) {
    state.selectedId = filtered.length ? filtered[0].id : null;
  }

  renderGrid(filtered);
  renderDetail();
}

function getFilteredScripts() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const selectedCategory = elements.categoryFilter.value;
  const selectedRisk = elements.riskFilter.value;
  const selectedSort = elements.sortFilter.value;

  const filtered = state.scripts.filter((script) => {
    const inCategory = selectedCategory === "all" || script.category === selectedCategory;
    const inRisk = selectedRisk === "all" || script.risk === selectedRisk;
    const haystack = [
      script.title,
      script.summary,
      script.category,
      ...(script.tags || [])
    ]
      .join(" ")
      .toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return inCategory && inRisk && matchesQuery;
  });

  filtered.sort((a, b) => sortScripts(a, b, selectedSort));
  return filtered;
}

function sortScripts(a, b, selectedSort) {
  if (selectedSort === "risk") {
    return riskOrder[a.risk] - riskOrder[b.risk] || a.title.localeCompare(b.title);
  }
  if (selectedSort === "category") {
    return a.category.localeCompare(b.category) || a.title.localeCompare(b.title);
  }
  return a.title.localeCompare(b.title);
}

function renderGrid(scripts) {
  elements.scriptGrid.innerHTML = "";

  if (!scripts.length) {
    elements.scriptGrid.innerHTML = "<p class=\"small-note\">No scripts match your filters.</p>";
    return;
  }

  for (const script of scripts) {
    elements.scriptGrid.appendChild(createCard(script));
  }
}

function createCard(script) {
  const card = document.createElement("article");
  card.className = "script-card";
  if (script.id === state.selectedId) {
    card.classList.add("selected");
  }

  const title = document.createElement("h3");
  title.textContent = script.title;

  const summary = document.createElement("p");
  summary.className = "small-note";
  summary.textContent = script.summary;

  const meta = document.createElement("div");
  meta.className = "card-meta";
  meta.appendChild(createBadge(script.category));
  meta.appendChild(createBadge(`Risk: ${capitalize(script.risk)}`, `risk-${script.risk}`));
  meta.appendChild(createBadge(script.requires_sudo ? "Needs sudo" : "No sudo"));

  const tags = document.createElement("p");
  tags.className = "tags";
  tags.textContent = `Tags: ${(script.tags || []).join(", ")}`;

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const viewBtn = document.createElement("button");
  viewBtn.type = "button";
  viewBtn.className = "secondary";
  viewBtn.textContent = "Open";
  viewBtn.addEventListener("click", () => {
    state.selectedId = script.id;
    render();
  });

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.textContent = "Copy Script";
  copyBtn.addEventListener("click", () => copyScript(script));

  const downloadBtn = document.createElement("button");
  downloadBtn.type = "button";
  downloadBtn.className = "secondary";
  downloadBtn.textContent = "Download";
  downloadBtn.addEventListener("click", () => downloadScript(script));

  actions.appendChild(viewBtn);
  actions.appendChild(copyBtn);
  actions.appendChild(downloadBtn);

  card.appendChild(title);
  card.appendChild(summary);
  card.appendChild(meta);
  card.appendChild(tags);
  card.appendChild(actions);
  return card;
}

function renderDetail() {
  const script = state.scripts.find((item) => item.id === state.selectedId);
  if (!script) {
    elements.scriptDetail.innerHTML = "<h3>No script selected</h3><p>Choose a script to view details.</p>";
    return;
  }

  const scriptText = script.script_lines.join("\n");
  elements.scriptDetail.innerHTML = `
    <div class="detail-header">
      <h3>${escapeHtml(script.title)}</h3>
      <p class="small-note">${escapeHtml(script.summary)}</p>
      <div class="detail-meta">
        <span class="badge">${escapeHtml(script.category)}</span>
        <span class="badge risk-${escapeHtml(script.risk)}">Risk: ${escapeHtml(capitalize(script.risk))}</span>
        <span class="badge">${script.requires_sudo ? "Needs sudo" : "No sudo"}</span>
        <span class="badge">File: ${escapeHtml(script.filename)}</span>
      </div>
    </div>
    <div class="detail-actions">
      <button id="copyDetailBtn" type="button">Copy Script</button>
      <button id="downloadDetailBtn" type="button" class="secondary">Download Script</button>
    </div>
    <h4>Prerequisites</h4>
    <ul>${listToHtml(script.prerequisites)}</ul>
    <h4>How to use</h4>
    <ol>${listToHtml(script.steps)}</ol>
    <h4>Expected output</h4>
    <ul>${listToHtml(script.expected_output)}</ul>
    <h4>Rollback / recovery</h4>
    <p>${escapeHtml(script.rollback || "Not specified.")}</p>
    <h4>Notes</h4>
    <ul>${listToHtml(script.notes)}</ul>
    <h4>Bash script</h4>
    <pre><code>${escapeHtml(scriptText)}</code></pre>
  `;

  document.getElementById("copyDetailBtn").addEventListener("click", () => copyScript(script));
  document.getElementById("downloadDetailBtn").addEventListener("click", () => downloadScript(script));
}

function createBadge(text, extraClass = "") {
  const badge = document.createElement("span");
  badge.className = `badge ${extraClass}`.trim();
  badge.textContent = text;
  return badge;
}

async function copyScript(script) {
  const fullScript = `${script.script_lines.join("\n")}\n`;
  const copied = await copyText(fullScript);
  if (copied) {
    setStatus(`Copied ${script.filename} to clipboard.`);
  } else {
    setStatus("Copy failed in this browser. Open details and copy manually.", true);
  }
}

function downloadScript(script) {
  const fullScript = `${script.script_lines.join("\n")}\n`;
  const blob = new Blob([fullScript], { type: "text/x-shellscript" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = script.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  setStatus(`Downloaded ${script.filename}.`);
}

async function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      return fallbackCopy(text);
    }
  }
  return fallbackCopy(text);
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

function listToHtml(items) {
  if (!Array.isArray(items) || !items.length) {
    return "<li>Not specified.</li>";
  }
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function setStatus(message, isError = false) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.classList.toggle("error", isError);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
