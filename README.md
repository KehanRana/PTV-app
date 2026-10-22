# OnTrack · Melbourne transit reliability

Responsive, dependency-free interactive prototype based on the requirements draft of 21 October 2026.

## Run

`npm run dev` then open http://localhost:5173. Requires Python 3. `npm run check` validates JavaScript syntax with Node.

## Implemented

Network overview, train/tram/bus filters, route search and detail, hourly heatmap, date/day/hour filters, comparisons (up to four routes), stop explorer, browser-local saved routes, shareable URL state, CSV export, methodology and honest unconfigured feed status. Responsive layouts and keyboard-accessible controls. Data is deterministic synthetic demo data, clearly labeled throughout.

## Production work remaining

This is a frontend prototype, not the complete production MVP. No real data is collected. Add a server-side feed collector and database before publishing reliability claims. API credentials must remain server-side; never embed them in browser files.

1. Verify Victorian feed endpoints, mode rate limits, terms and punctuality definitions against current official documentation.
2. Import versioned static GTFS, then collect all three modes every 30 seconds using persistent rate limiting, retry backoff, malformed-entity isolation and update deduplication.
3. Store UTC timestamps and daily raw partitions; expire raw records after configurable retention (7 days). Resolve observed arrivals, skipped stops, cancellations and no-data states.
4. Aggregate hourly route/stop statistics with coverage and sample counts. Implement cached rate-limited APIs with OpenAPI, nearby-stop queries and recomputation support.
5. Replace synthetic frontend selectors with API responses. Stop-level metrics and network charts currently illustrate the design and are not empirical.
6. Add tests for arrival resolution, percentile/cancellation denominators, DST/after-midnight trips, restart-safe throttling and retention.
7. Deploy ingestion separately from this static UI; configure feed health metrics, five-minute stale-feed alerts, backups and a tested restore, automated CI/deployment and an agreed hosting budget.

No API keys or secrets are required by this prototype. The independent app is not affiliated with PTV. Planned data attribution is Victorian Department of Transport and Planning, CC BY 4.0.
