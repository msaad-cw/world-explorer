# 🌍 World Explorer

A fast, dependency-light Node.js app for exploring every country on Earth — population, capital, currencies, languages, flags, neighbors, timezones and more. Data comes live from the free [REST Countries API](https://restcountries.com) (no API key required), with server-side caching so it stays snappy.

Built to deploy in one click on **Cloudways Velocity** via GitHub.

## Features

- Searchable, filterable grid of all ~250 countries
- Click any country for a detail view with neighbors you can jump between
- Server-side 30-minute cache to avoid rate limits
- No database, no API keys, no build step — just `npm install && npm start`

## Tech

- Node.js 18+ (uses the built-in `fetch`)
- Express for static hosting + a thin API proxy
- Vanilla HTML/CSS/JS frontend (no framework, no bundler)

## Run locally

```bash
npm install
npm start
# open http://localhost:3000
```

The server listens on `process.env.PORT` (falls back to 3000), so it works on any host.

## Deploy on Cloudways Velocity

1. Push this repo to GitHub (already done if Claude set it up for you).
2. In Cloudways Velocity, create a new app and connect this GitHub repository.
3. Velocity detects Node.js from `package.json`. Confirm:
   - **Install command:** `npm install`
   - **Start command:** `npm start`
4. Deploy. Velocity injects `PORT`; the app binds to it automatically.

The included `velocity.json` provides these settings so deployment is truly one-click.

## Endpoints

- `GET /` — the web UI
- `GET /api/countries` — slim list of all countries
- `GET /api/country/:code` — detail by 3-letter country code (e.g. `USA`)
- `GET /healthz` — health check

## License

MIT
