// World Explorer — zero-dependency Node.js server (uses only built-in modules).
// Serves the static frontend and proxies the free REST Countries API with caching.

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
// Only these files are ever served statically (keeps server source private).
const STATIC_FILES = new Set(["index.html", "styles.css", "app.js"]);

const API = "https://restcountries.com/v3.1";
const FIELDS =
  "name,cca2,cca3,capital,region,subregion,population,area,languages,currencies,flags,latlng,borders,timezones,tld,maps,car";

// Simple in-memory cache so we don't hammer the upstream API
const cache = new Map();
const TTL = 1000 * 60 * 30; // 30 minutes

async function cachedFetch(url) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.time < TTL) return hit.data;

  const res = await fetch(url, { headers: { "User-Agent": "world-explorer" } });
  if (!res.ok) {
    const err = new Error(`Upstream responded ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  cache.set(url, { time: Date.now(), data });
  return data;
}

function slim(c) {
  return {
    name: c.name && c.name.common,
    official: c.name && c.name.official,
    cca2: c.cca2,
    cca3: c.cca3,
    capital: (c.capital && c.capital[0]) || null,
    region: c.region,
    subregion: c.subregion,
    population: c.population,
    area: c.area,
    languages: c.languages ? Object.values(c.languages) : [],
    currencies: c.currencies
      ? Object.entries(c.currencies).map(([code, v]) => ({
          code,
          name: v.name,
          symbol: v.symbol,
        }))
      : [],
    flag: (c.flags && (c.flags.svg || c.flags.png)) || null,
    flagAlt: (c.flags && c.flags.alt) || "",
    latlng: c.latlng || [],
    borders: c.borders || [],
    timezones: c.timezones || [],
    tld: c.tld || [],
    maps: (c.maps && c.maps.googleMaps) || null,
    driving: (c.car && c.car.side) || null,
  };
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=300",
  });
  res.end(body);
}

function serveStatic(req, res) {
  let name = decodeURIComponent(req.url.split("?")[0]).replace(/^\//, "");
  if (name === "") name = "index.html";
  // Serve only allowlisted static assets — never source files.
  if (!STATIC_FILES.has(name)) {
    res.writeHead(404);
    return res.end("Not found");
  }
  const filePath = path.join(__dirname, name);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split("?")[0];

  if (url === "/healthz") {
    return sendJson(res, 200, { ok: true });
  }

  if (url === "/api/countries") {
    try {
      const data = await cachedFetch(`${API}/all?fields=${FIELDS}`);
      const list = data
        .map(slim)
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      return sendJson(res, 200, list);
    } catch (e) {
      return sendJson(res, e.status || 500, { error: "Could not load countries." });
    }
  }

  const m = url.match(/^\/api\/country\/([A-Za-z]{2,3})$/);
  if (m) {
    try {
      const data = await cachedFetch(`${API}/alpha/${encodeURIComponent(m[1])}?fields=${FIELDS}`);
      const country = Array.isArray(data) ? data[0] : data;
      return sendJson(res, 200, slim(country));
    } catch (e) {
      return sendJson(res, e.status || 500, { error: "Country not found." });
    }
  }

  // Fall back to static files
  serveStatic(req, res);
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`World Explorer running on port ${PORT}`);
  });
}

module.exports = { slim, server };
