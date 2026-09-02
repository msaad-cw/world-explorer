let ALL = [];
const byCode = {};

const PAGE_SIZE = 24;
let page = 1;

const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
const pagerEl = document.getElementById("pager");
const searchEl = document.getElementById("search");
const regionEl = document.getElementById("region");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");

const fmt = (n) => (n == null ? "—" : n.toLocaleString("en-US"));

async function load() {
  try {
    const res = await fetch("/api/countries");
    if (!res.ok) throw new Error();
    ALL = await res.json();
    ALL.forEach((c) => (byCode[c.cca3] = c));
    statusEl.textContent = `${ALL.length} countries`;
    render();
  } catch {
    statusEl.textContent = "Could not load country data. Try reloading.";
  }
}

function currentList() {
  const q = searchEl.value.trim().toLowerCase();
  const region = regionEl.value;
  return ALL.filter((c) => {
    const matchesQ =
      !q ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.capital && c.capital.toLowerCase().includes(q));
    const matchesR = !region || c.region === region;
    return matchesQ && matchesR;
  });
}

function render() {
  const list = currentList();
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > pages) page = pages;
  if (page < 1) page = 1;

  const start = (page - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const slice = list.slice(start, end);

  statusEl.textContent = total
    ? `Showing ${start + 1}–${end} of ${total} ${total === 1 ? "country" : "countries"}`
    : "No countries match your search.";

  grid.innerHTML = slice
    .map(
      (c) => `
    <div class="card" data-code="${c.cca3}">
      <div class="flag-wrap"><img loading="lazy" src="${c.flag || ""}" alt="Flag of ${c.name || ""}" /></div>
      <div class="body">
        <h3>${c.name || "Unknown"}</h3>
        ${c.region ? `<span class="badge">${c.region}</span>` : ""}
        <div class="meta">
          <div><span>Capital</span>${c.capital || "—"}</div>
          <div><span>Population</span>${fmt(c.population)}</div>
        </div>
      </div>
    </div>`
    )
    .join("");

  renderPager(pages);
}

function renderPager(pages) {
  if (pages <= 1) {
    pagerEl.innerHTML = "";
    return;
  }
  // Build a compact window of page numbers around the current page.
  const nums = new Set([1, pages, page, page - 1, page + 1]);
  const sorted = [...nums].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);

  let html = `<button class="pg" data-page="${page - 1}" ${page === 1 ? "disabled" : ""}>‹ Prev</button>`;
  let prev = 0;
  for (const n of sorted) {
    if (n - prev > 1) html += `<span class="pg-gap">…</span>`;
    html += `<button class="pg ${n === page ? "active" : ""}" data-page="${n}">${n}</button>`;
    prev = n;
  }
  html += `<button class="pg" data-page="${page + 1}" ${page === pages ? "disabled" : ""}>Next ›</button>`;
  pagerEl.innerHTML = html;
}

function goToPage(n) {
  page = n;
  render();
  document.getElementById("grid").scrollIntoView({ behavior: "smooth", block: "start" });
}

function openCountry(code) {
  const c = byCode[code];
  if (!c) return;
  const languages = c.languages.length ? c.languages.join(", ") : "—";
  const currencies = c.currencies.length
    ? c.currencies.map((x) => `${x.name} (${x.symbol || x.code})`).join(", ")
    : "—";
  const borders = c.borders.length
    ? c.borders
        .map((b) => `<span class="chip" data-code="${b}">${byCode[b]?.name || b}</span>`)
        .join("")
    : "<span class='meta'>None (island or isolated)</span>";

  modalBody.innerHTML = `
    <div class="modal-body-inner">
      <img class="modal-flag" src="${c.flag || ""}" alt="Flag of ${c.name || ""}" />
      <h2 style="margin:0">${c.name || ""}</h2>
      <div class="meta">${c.official || ""}</div>
      <div class="detail-grid">
        <div><span class="label">Capital</span>${c.capital || "—"}</div>
        <div><span class="label">Region</span>${c.region || "—"}${c.subregion ? " · " + c.subregion : ""}</div>
        <div><span class="label">Population</span>${fmt(c.population)}</div>
        <div><span class="label">Area</span>${fmt(c.area)} km²</div>
        <div><span class="label">Languages</span>${languages}</div>
        <div><span class="label">Currencies</span>${currencies}</div>
        <div><span class="label">Timezones</span>${c.timezones.join(", ") || "—"}</div>
        <div><span class="label">Top-level domain</span>${c.tld.join(", ") || "—"}</div>
      </div>
      <div style="margin-top:16px">
        <span class="label">Neighbors</span>
        <div class="chips">${borders}</div>
      </div>
      ${c.maps ? `<a class="maplink" href="${c.maps}" target="_blank" rel="noopener">Open in Google Maps →</a>` : ""}
    </div>`;
  modal.classList.remove("hidden");
}

grid.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card) openCountry(card.dataset.code);
});
modalBody.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (chip && chip.dataset.code) openCountry(chip.dataset.code);
});
document.getElementById("modal-close").addEventListener("click", () => modal.classList.add("hidden"));
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.add("hidden");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") modal.classList.add("hidden");
});

pagerEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button.pg");
  if (btn && !btn.disabled) goToPage(Number(btn.dataset.page));
});

searchEl.addEventListener("input", () => {
  page = 1;
  render();
});
regionEl.addEventListener("change", () => {
  page = 1;
  render();
});

load();
