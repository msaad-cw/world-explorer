let ALL = [];
const byCode = {};

const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
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

function render() {
  const q = searchEl.value.trim().toLowerCase();
  const region = regionEl.value;
  const list = ALL.filter((c) => {
    const matchesQ =
      !q ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.capital && c.capital.toLowerCase().includes(q));
    const matchesR = !region || c.region === region;
    return matchesQ && matchesR;
  });

  statusEl.textContent = `${list.length} ${list.length === 1 ? "country" : "countries"}`;
  grid.innerHTML = list
    .map(
      (c) => `
    <div class="card" data-code="${c.cca3}">
      <img loading="lazy" src="${c.flag || ""}" alt="Flag of ${c.name || ""}" />
      <div class="body">
        <h3>${c.name || "Unknown"}</h3>
        <div class="meta">
          <div>Capital: ${c.capital || "—"}</div>
          <div>Population: ${fmt(c.population)}</div>
          <div>Region: ${c.region || "—"}</div>
        </div>
      </div>
    </div>`
    )
    .join("");
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

searchEl.addEventListener("input", render);
regionEl.addEventListener("change", render);

load();
