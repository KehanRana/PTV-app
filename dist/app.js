const routes = [
  {
    id: "pakenham",
    name: "Pakenham",
    from: "City ↔ East Pakenham",
    mode: "train",
    number: "PKM",
    score: 94.2,
    median: 1.8,
    p90: 7.2,
    n: 24816,
  },
  {
    id: "cranbourne",
    name: "Cranbourne",
    from: "City ↔ Cranbourne",
    mode: "train",
    number: "CRB",
    score: 92.7,
    median: 2.1,
    p90: 8.4,
    n: 21742,
  },
  {
    id: "19",
    name: "Route 19",
    from: "North Coburg ↔ Flinders Street",
    mode: "tram",
    number: "19",
    score: 89.4,
    median: 2.6,
    p90: 9.1,
    n: 18723,
  },
  {
    id: "601",
    name: "Route 601",
    from: "Huntingdale ↔ Monash University",
    mode: "bus",
    number: "601",
    score: 91.8,
    median: 2.3,
    p90: 8.2,
    n: 12456,
  },
  {
    id: "903",
    name: "Route 903",
    from: "Altona ↔ Mordialloc",
    mode: "bus",
    number: "903",
    score: 83.6,
    median: 4.2,
    p90: 12.6,
    n: 15308,
  },
  {
    id: "glen-waverley",
    name: "Glen Waverley",
    from: "City ↔ Glen Waverley",
    mode: "train",
    number: "GWY",
    score: 95.1,
    median: 1.4,
    p90: 6.3,
    n: 19340,
  },
  {
    id: "86",
    name: "Route 86",
    from: "Bundoora RMIT ↔ Waterfront City",
    mode: "tram",
    number: "86",
    score: 87.8,
    median: 3.1,
    p90: 10.8,
    n: 16280,
  },
  {
    id: "733",
    name: "Route 733",
    from: "Box Hill ↔ Oakleigh",
    mode: "bus",
    number: "733",
    score: 88.6,
    median: 2.9,
    p90: 9.8,
    n: 178,
  },
];

const stops = [
  {
    id: "clayton",
    name: "Clayton Station",
    area: "Clayton · Zone 2",
    route: "pakenham",
  },
  {
    id: "huntingdale",
    name: "Huntingdale Station",
    area: "Huntingdale · Zone 2",
    route: "601",
  },
  {
    id: "monash",
    name: "Monash University",
    area: "Clayton campus · Zone 2",
    route: "601",
  },
  {
    id: "flinders",
    name: "Flinders Street Station",
    area: "Melbourne CBD · Zone 1",
    route: "pakenham",
  },
  {
    id: "coburg",
    name: "North Coburg",
    area: "Coburg North · Zone 1",
    route: "19",
  },
];

const params = new URLSearchParams(location.search);
let state = {
  view: params.get("view") || "overview",
  mode: params.get("mode") || "all",
  period: params.get("period") || "30",
  day: params.get("day") || "all",
  route: params.get("route") || "pakenham",
  hour: params.get("hour") || "all",
  stop: params.get("stop") || "clayton",
  compare: (params.get("compare") || "pakenham,cranbourne,601")
    .split(",")
    .slice(0, 4),
};

let saved = [];
try {
  saved = JSON.parse(localStorage.getItem("ontrack:saved:v1") || "[]");
  if (!Array.isArray(saved)) saved = [];
} catch {}
let query = "";
const main = document.querySelector("#main");
const titles = {
  overview: "Overview",
  routes: "Route explorer",
  detail: "Route explorer",
  compare: "Compare routes",
  stops: "Stop explorer",
  saved: "Saved routes",
  method: "How we measure",
  health: "System status",
};

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );

function stats(r) {
  let shift =
    (state.day === "weekdays" ? -1.4 : state.day === "weekends" ? 2.1 : 0) +
    (state.period === "7" ? 1.2 : state.period === "90" ? -0.7 : 0) +
    (state.hour === "peak" ? -4.2 : state.hour === "offpeak" ? 2.4 : 0);
  return {
    ...r,
    score: Math.min(99, r.score + shift),
    median: Math.max(0.3, r.median - shift * 0.12),
    p90: Math.max(2, r.p90 - shift * 0.25),
    n: Math.round(
      ((r.n * Number(state.period)) / 30) *
        (state.day === "all" ? 1 : state.day === "weekdays" ? 0.71 : 0.29) *
        (state.hour === "all" ? 1 : 0.3)
    ),
  };
}
function current() {
  return stats(routes.find((r) => r.id === state.route) || routes[0]);
}
function range() {
  let start = new Date("2026-10-21T12:00:00Z");
  start.setUTCDate(start.getUTCDate() - Number(state.period) + 1);
  return `${start.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "Australia/Melbourne",
  })} – 21 Oct 2026`;
}
function options(items, value) {
  return items
    .map(
      ([v, l]) =>
        `<option value="${v}" ${v === value ? "selected" : ""}>${l}</option>`
    )
    .join("");
}
function filters() {
  return `<div class="filters"><select aria-label="Time window" data-filter="hour">${options(
    [
      ["all", "◷  All hours"],
      ["peak", "Peak hours · 7–9, 16–18"],
      ["offpeak", "Off-peak hours"],
    ],
    state.hour
  )}</select><select aria-label="Day type" data-filter="day">${options(
    [
      ["all", "All days"],
      ["weekdays", "Weekdays"],
      ["weekends", "Weekends"],
    ],
    state.day
  )}</select><select aria-label="Date range" data-filter="period">${options(
    [
      ["7", "▦  Last 7 days"],
      ["30", "▦  Last 30 days"],
      ["90", "▦  Last 90 days"],
    ],
    state.period
  )}</select></div>`;
}
function tabs() {
  return `<div class="tabs" role="group" aria-label="Transport mode">${[
    ["all", "All modes"],
    ["train", "▤  Train"],
    ["tram", "▥  Tram"],
    ["bus", "▣  Bus"],
  ]
    .map(
      ([v, l]) =>
        `<button data-mode="${v}" class="${
          state.mode === v ? "active" : ""
        }" aria-pressed="${state.mode === v}">${l}</button>`
    )
    .join("")}</div>`;
}
function intro(
  title,
  sub,
  eyebrow = "YOUR COMMUTE, WITH CONTEXT",
  action = true
) {
  return `<div class="eyebrow">${eyebrow}</div><div class="title-row"><div><h1>${title}</h1><p class="subtitle">${sub}</p></div>${
    action
      ? '<button class="btn" data-action="export">↧ <span>Export data</span></button>'
      : ""
  }</div>`;
}
function spark(color = "#74956a") {
  return `<svg class="spark" viewBox="0 0 80 35" aria-hidden="true"><path d="M0 30L9 26 18 28 27 15 37 20 46 12 56 16 65 6 78 4V35H0Z" fill="${color}" opacity=".08"/><path d="M0 30L9 26 18 28 27 15 37 20 46 12 56 16 65 6 78 4" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;
}
function stat(label, value, unit, foot, icon = "◷") {
  return `<div class="stat"><div class="stat-label">${label}<span>${icon}</span></div><div class="stat-value">${value}<em>${unit}</em></div><div class="stat-foot">${foot}</div>${spark()}</div>`;
}
function note() {
  return `<div class="notice"><span></span> Illustrative demo data · ${range()} · Melbourne local time · Not live transport information</div>`;
}
function badge(r) {
  return `<span class="route-badge ${r.mode}">${r.number}</span>`;
}
function table(data, search = true) {
  return `<div class="card"><div class="card-head"><div><h2>${
    state.view === "saved"
      ? "Your saved routes"
      : state.view === "routes"
      ? "Explore routes"
      : "Your next journey, a little clearer"
  }</h2><div class="card-desc">${
    state.view === "routes"
      ? "Find a route and explore its reliability."
      : "A snapshot of routes across Melbourne."
  }</div></div>${
    search
      ? '<label class="search"><input aria-label="Search routes" id="route-search" placeholder="Search a route or number" value="' +
        esc(query) +
        '"></label>'
      : ""
  }</div><div style="overflow:auto"><table><thead><tr><th>Route</th><th>On time</th><th>Typical delay</th><th aria-label="Save"></th><th aria-label="Open"></th></tr></thead><tbody id="route-rows">${rows(
    data
  )}</tbody></table></div><div class="table-foot"><span id="route-total">${
    data.length
  } routes · ${range()}</span><button class="text-link" data-view="routes">Explore all routes ↗</button></div></div>`;
}
function rows(data) {
  return data.length
    ? data
        .map((raw) => {
          const r = stats(raw);
          return `<tr><td><div class="route-name">${badge(
            r
          )}<div><button class="route-title" data-route="${r.id}">${
            r.name
          }</button><span class="route-sub">${r.from}${
            r.n < 200 ? " · Low confidence" : ""
          }</span></div></div></td><td><span class="pill ${
            r.score < 90 ? "warn" : ""
          }">${r.score.toFixed(1)}%</span></td><td>${r.median.toFixed(
            1
          )} <span style="color:#9ca38f">min</span></td><td><button aria-label="${
            saved.includes(r.id) ? "Unsave" : "Save"
          } ${r.name}" class="star ${
            saved.includes(r.id) ? "saved" : ""
          }" data-save="${r.id}">${
            saved.includes(r.id) ? "★" : "☆"
          }</button></td><td><button class="text-link" aria-label="Open ${
            r.name
          }" data-route="${r.id}">↗</button></td></tr>`;
        })
        .join("")
    : '<tr><td colspan="5" class="empty">No routes found. Try another name or mode.</td></tr>';
}
function filtered() {
  return routes.filter(
    (r) =>
      (state.mode === "all" || r.mode === state.mode) &&
      (state.view !== "saved" || saved.includes(r.id)) &&
      `${r.name} ${r.from} ${r.number}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );
}
function chart() {
  let lines = [
    { c: "#7394af", base: 93 },
    { c: "#79976a", base: 88 },
    { c: "#c8aa72", base: 85 },
  ].filter(
    (_, i) => state.mode === "all" || ["train", "tram", "bus"][i] === state.mode
  );
  return `<div class="card"><div class="card-head"><div><h2>A pulse on the network</h2><div class="card-desc">On-time performance over the last ${
    state.period
  } days</div></div><span class="pill">Daily trend</span></div><div class="chart"><svg viewBox="0 0 600 175" role="img" aria-label="Illustrative daily on-time performance, train around 94 percent, tram around 89 percent, bus around 86 percent">${[
    100, 90, 80, 70,
  ]
    .map(
      (v, i) =>
        `<text x="0" y="${
          19 + i * 39
        }" fill="#9ba48f" font-size="9">${v}%</text><line x1="35" y1="${
          15 + i * 39
        }" x2="590" y2="${
          15 + i * 39
        }" stroke="#e9ede3" stroke-dasharray="3 4"/>`
    )
    .join("")}${lines
    .map((l, j) => {
      let pts = Array.from(
        { length: 30 },
        (_, i) =>
          `${35 + i * 19},${
            15 +
            (100 - l.base) * 3.9 +
            Math.sin(i * 2.2 + j) * 10 +
            Math.cos(i * 0.8) * 6
          }`
      ).join(" ");
      return `<polyline points="${pts}" fill="none" stroke="${l.c}" stroke-width="2" stroke-linejoin="round"/>`;
    })
    .join("")}${[
    "22 Sep",
    "27 Sep",
    "2 Oct",
    "7 Oct",
    "12 Oct",
    "17 Oct",
    "21 Oct",
  ]
    .map(
      (t, i) =>
        `<text x="${35 + i * 88}" y="165" fill="#9ba48f" font-size="9">${
          state.period === "30"
            ? t
            : i === 0
            ? range().split(" – ")[0]
            : i === 6
            ? "21 Oct"
            : ""
        }</text>`
    )
    .join(
      ""
    )}</svg></div><div class="chart-legend"><span><i style="background:#7394af"></i>Metro train</span><span><i style="background:#79976a"></i>Tram</span><span><i style="background:#c8aa72"></i>Bus</span></div><div class="insight">↗ &nbsp; <b>A steadier ride.</b> Explore the routes and travel times behind these demo trends.</div></div>`;
}

function overview() {
  const rs = filtered().map(stats);
  const avg = rs.reduce((s, r) => s + r.score, 0) / (rs.length || 1);
  return (
    intro(
      "A better commute starts here.",
      "Less guesswork. More confidence. See how Melbourne’s public transport really performs."
    ) +
    `<div class="toolbar">${tabs()}${filters()}</div><div class="stat-grid">${stat(
      "Network on-time rate",
      avg.toFixed(1),
      "%",
      "<b>↗ Network overview</b> Selected window",
      "◎"
    )}${stat(
      "Typical delay",
      "2.4",
      " min",
      "Median across observed services"
    )}${stat(
      "90th percentile delay",
      "8.6",
      " min",
      "1 in 10 services ran later than this"
    )}${stat(
      "Services observed",
      state.period === "30"
        ? "142,806"
        : Math.round((142806 * Number(state.period)) / 30).toLocaleString(),
      "",
      "Illustrative sample · all modes",
      "▤"
    )}</div><div class="dashboard-grid">${chart()}<div class="card"><div class="card-head"><div><h2>Three modes. One network.</h2><div class="card-desc">How each way of getting there compares</div></div><span style="color:#a6af9b">◉</span></div><div class="network">${[
      ["train", "Metro train", "16 routes", "94.1", "#7894b3"],
      ["tram", "Tram", "24 routes", "88.7", "#829a6b"],
      ["bus", "Bus", "354 routes", "85.3", "#c6a46d"],
    ]
      .map(
        ([m, n, c, v, col]) =>
          `<div class="mode-row"><div class="mode-icon ${m}">▤</div><div><strong>${n}</strong><small>${c} monitored</small><div class="bar"><span style="width:${v}%;background:${col}"></span></div></div><b>${v}<span style="font-size:11px;color:#9ba58d">%</span></b></div>`
      )
      .join(
        ""
      )}<div class="coverage"><span>Illustrative network coverage</span><span>394 routes</span></div></div></div></div><div class="lower">${table(
      filtered().slice(0, 5)
    )}<div><div class="card tip"><div class="eyebrow">SMALL CHANGES, BETTER JOURNEYS</div><h2>Your departure time<br>can make a difference.</h2><p>Find the more reliable hours on your route. A little flexibility can go a long way.</p><button class="btn" data-route="pakenham">Find your best time ↗</button><span class="tip-art" aria-hidden="true">◷</span></div><div class="data-note"><b>ⓘ &nbsp; Built on data. Open about the details.</b>We infer arrivals from realtime predictions. Understand what the numbers can—and can’t—tell you.<br><button class="text-link" data-view="method" style="margin-top:8px">How we measure ↗</button></div></div></div>${note()}`
  );
}

function detail() {
  const r = current();
  return (
    intro(
      `${r.name} <span style="font-size:14px;color:#8b987c;font-weight:500">${r.from}</span>`,
      "A closer look at your route, from the usual delay to the times worth planning around.",
      "ROUTE RELIABILITY"
    ) +
    `<div class="toolbar"><div style="display:flex;gap:8px"><button class="btn" data-view="routes">← All routes</button><button class="btn" data-save="${
      r.id
    }">${
      saved.includes(r.id) ? "★ Saved" : "☆ Save route"
    }</button><button class="btn" data-action="share">↗ Share view</button></div>${filters()}</div><div class="stat-grid">${stat(
      "On-time services",
      r.score.toFixed(1),
      "%",
      `${r.n.toLocaleString()} observations${
        r.n < 200 ? " · Low confidence" : ""
      }`
    )}${stat(
      "Typical delay",
      r.median.toFixed(1),
      " min",
      "Median observed delay"
    )}${stat(
      "90th percentile delay",
      r.p90.toFixed(1),
      " min",
      "1 in 10 trips exceeded this delay"
    )}${stat(
      "Cancellation rate",
      "1.2",
      "%",
      "Cancelled trips excluded from delays"
    )}</div><div class="card"><div class="card-head"><div><h2>Find your better time to travel</h2><div class="card-desc">On-time percentage by day and hour · Tap a cell to see the details</div></div><span class="pill">${
      r.n < 200 ? "Low confidence" : "Hourly view"
    }</span></div><div class="heatmap"><div class="heat-grid"><div></div>${Array.from(
      { length: 18 },
      (_, i) => `<div class="heat-label">${i + 5}</div>`
    ).join("")}${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      .map(
        (d, di) =>
          `<div class="heat-label">${d}</div>${Array.from(
            { length: 18 },
            (_, hi) => {
              let empty = di === 6 && hi === 0;
              let p = Math.min(
                99,
                Math.max(
                  60,
                  Math.round(
                    r.score +
                      Math.sin(hi * 0.8 + di) * 5 -
                      ([2, 3, 11, 12].includes(hi) ? 10 : 0)
                  )
                )
              );
              return `<button class="heat-cell" style="background:${
                empty
                  ? "#f0f1eb"
                  : p > 94
                  ? "#b1caa0"
                  : p > 88
                  ? "#cbdab0"
                  : p > 82
                  ? "#e1deac"
                  : "#e3c39e"
              }" aria-label="${d} ${hi + 5}:00, ${
                empty ? "no data" : p + " percent on time"
              }" data-cell="${di},${hi},${p},${empty}">${
                empty ? "–" : ""
              }</button>`;
            }
          ).join("")}`
      )
      .join(
        ""
      )}</div><div class="heat-legend">Less reliable &nbsp; <span style="color:#d2b68f">■</span> <span style="color:#e1deac">■</span> <span style="color:#cbdab0">■</span> <span style="color:#b1caa0">■</span> &nbsp; More reliable &nbsp; · &nbsp; – No usable observations</div></div><div class="heat-detail" id="heat-detail" aria-live="polite">Select a day and hour to see on-time performance, delay and sample size.</div></div><div class="card prose"><h2>Leave a little room for the unexpected.</h2><p>For the selected window, 1 in 10 observed trips ran more than <b>${r.p90.toFixed(
      1
    )} minutes late</b>. This is a 90th percentile estimate, not the maximum delay or a guarantee. ${
      r.n < 200
        ? "This window has fewer than 200 observations; treat these estimates with caution."
        : ""
    }</p><p>Coverage: ${range()} · ${r.n.toLocaleString()} samples · Cancelled services and missing observations are excluded from delay statistics.</p></div>${note()}`
  );
}

function compare() {
  return (
    intro(
      "Same journey. A clearer choice.",
      "Compare routes using the same dates, days and hours.",
      "ROUTE COMPARISON"
    ) +
    `<div class="toolbar"><span class="subtitle">Choose up to four routes</span>${filters()}</div><div class="compare-grid">${state.compare
      .map((id, i) => {
        let r = stats(routes.find((x) => x.id === id) || routes[0]);
        return `<div class="card compare-card"><select aria-label="Comparison route ${
          i + 1
        }" data-compare="${i}">${options(
          routes.map((r) => [r.id, r.name + " · " + r.mode]),
          r.id
        )}</select><div class="route-name">${badge(r)}<h2>${
          r.name
        }</h2></div><p class="subtitle">${
          r.from
        }</p><div class="compare-metric">On-time performance<b>${r.score.toFixed(
          1
        )}%</b></div><div class="compare-metric">Typical delay<b>${r.median.toFixed(
          1
        )} <small>min</small></b></div><div class="compare-metric">90th percentile delay<b>${r.p90.toFixed(
          1
        )} <small>min</small></b></div><p class="subtitle">${r.n.toLocaleString()} samples${
          r.n < 200 ? " · Low confidence" : ""
        }<br>${range()}</p><button class="btn section-space" data-route="${
          r.id
        }">Explore route ↗</button></div>`;
      })
      .join(
        ""
      )}</div><button class="btn section-space" data-action="add-compare" ${
      state.compare.length >= 4 ? "disabled" : ""
    }>＋ Add another route</button>${note()}`
  );
}

function stopView() {
  const s = stops.find((x) => x.id === state.stop) || stops[0];
  const rs = routes.filter((r) =>
    s.id === "clayton"
      ? ["pakenham", "cranbourne", "733", "903"].includes(r.id)
      : s.id === "monash"
      ? ["601", "733"].includes(r.id)
      : r.id === s.route
  );
  return (
    intro(
      "Know what to expect where you wait.",
      "Explore reliability at Melbourne stations and stops.",
      "STOP EXPLORER"
    ) +
    `<div class="toolbar"><select aria-label="Choose a stop" data-filter="stop">${options(
      stops.map((s) => [s.id, s.name + " · " + s.area]),
      s.id
    )}</select>${filters()}</div><div class="card prose"><div class="eyebrow">⌾ ${
      s.area
    }</div><h2>${
      s.name
    }</h2><p>Routes serving this stop in the demo dataset. Figures below currently illustrate route-wide reliability, rather than measured stop-level arrivals.</p></div><div class="section-space">${table(
      rs,
      false
    )}</div>${note()}`
  );
}

function method() {
  return (
    intro(
      "Good decisions start with honest data.",
      "What we measure, how we measure it, and where the limits are.",
      "OUR METHODOLOGY",
      false
    ) +
    `<article class="card prose"><h2>This is a demo workspace</h2><p>All figures, trends and sample counts currently shown are synthetic examples. No historical collection has started, and the system is not connected to Victorian GTFS-Realtime feeds. Dates are fixed to a demonstration ending 21 October 2026. Do not use these examples to plan a time-critical trip.</p><h2>What does “on time” mean?</h2><p>The proposed default is an arrival at least 60 seconds before the scheduled time and less than 360 seconds after it. This is a configurable project definition; it has not yet been verified against official punctuality definitions for each mode.</p><h2>How arrivals will be estimated</h2><p>The planned ingester captures trip updates and vehicle positions every 30 seconds. An observed arrival is inferred from the last usable prediction received before the scheduled stop time. This is an estimate derived from a prediction, not a confirmed physical arrival. Late feed delivery, timetable mismatches and short-turned trips can affect accuracy.</p><h2>Typical delays and the 90th percentile</h2><p>Typical delay is the median. The 90th percentile is the delay exceeded by 1 in 10 observations. It is not the worst possible delay. Cancelled trips and skipped stops are recorded separately and excluded from delay statistics. Cancellation rate uses scheduled services as its denominator.</p><h2>Missing data and confidence</h2><p>Services without usable updates are marked “no data,” never on time. Collection outages must be recorded and affected windows excluded from results. A minimum of 200 observations is proposed for confidence; smaller samples are flagged. There are no real collection gaps to report because collection has not started.</p><h2>Time, coverage and attribution</h2><p>Production timestamps will be stored in UTC and displayed in Australia/Melbourne, including daylight saving and GTFS service times after midnight. The intended data source is the Victorian Department of Transport and Planning, attributed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. This independent app is not affiliated with PTV.</p></article>`
  );
}

function health() {
  return (
    intro(
      "A healthy pipeline. Numbers you can trust.",
      "Feed monitoring will appear here when ingestion is connected.",
      "SYSTEM STATUS",
      false
    ) +
    `<div class="card prose"><h2>◌ Ingestion not connected</h2><p>This workspace uses synthetic data. No feeds have been polled and no successful collection time is available. Live monitoring, alert delivery, storage retention and database backups require deployment of the data pipeline.</p></div><div class="health-grid">${[
      "Metro train",
      "Tram",
      "Bus",
    ]
      .map(
        (m) =>
          `<div class="card health-card"><h2>${m}</h2><p>Trip updates: Not configured<br>Vehicle positions: Not configured<br>Last successful poll: —<br>Poll duration: —<br>Entities per poll: —<br>Errors / database latency: —</p><span class="pill warn">Awaiting API credentials</span></div>`
      )
      .join(
        ""
      )}</div><div class="card prose"><h2>Planned operating rules</h2><p>Poll every 30 seconds with a persistent rate limiter and retry backoff. Raise a stale-feed alert after 5 minutes without a successful poll. Retain raw partitions for 7 days and retain derived arrivals and statistics. Hosting budget and per-mode rate limits must be established before enabling collection.</p></div>`
  );
}

function render() {
  if (!titles[state.view]) state.view = "overview";
  document.querySelector("#crumb").textContent = titles[state.view];
  document
    .querySelectorAll("nav [data-view]")
    .forEach((b) =>
      b.classList.toggle(
        "active",
        b.dataset.view === state.view ||
          (state.view === "detail" && b.dataset.view === "routes")
      )
    );
  document.querySelector("#saved-count").textContent = saved.length;
  main.innerHTML =
    state.view === "overview"
      ? overview()
      : state.view === "detail"
      ? detail()
      : state.view === "compare"
      ? compare()
      : state.view === "stops"
      ? stopView()
      : state.view === "method"
      ? method()
      : state.view === "health"
      ? health()
      : intro(
          state.view === "saved"
            ? "Your regulars, all in one place."
            : "Find your route. Know your odds.",
          state.view === "saved"
            ? "Saved on this browser, ready whenever you are."
            : "Search Melbourne train, tram and bus routes.",
          "ROUTE EXPLORER"
        ) +
        `<div class="toolbar">${tabs()}${filters()}</div>${table(
          filtered()
        )}${note()}`;
  const p = new URLSearchParams();
  Object.entries(state).forEach(([k, v]) =>
    p.set(k, Array.isArray(v) ? v.join(",") : v)
  );
  history.replaceState(null, "", "?" + p);
}

function toast(msg) {
  let el = document.querySelector("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove("show"), 3500);
}

function navigate(view) {
  state.view = view;
  query = "";
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.view) navigate(b.dataset.view);
  if (b.dataset.route) {
    state.route = b.dataset.route;
    navigate("detail");
  }
  if (b.dataset.mode) {
    state.mode = b.dataset.mode;
    render();
  }
  if (b.dataset.save) {
    const id = b.dataset.save;
    saved = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
    try {
      localStorage.setItem("ontrack:saved:v1", JSON.stringify(saved));
    } catch {
      toast("Browser storage unavailable; saved for this session.");
    }
    render();
  }
  if (b.dataset.cell) {
    const [di, hi, p, empty] = b.dataset.cell.split(",");
    let n = Math.max(1, Math.round(current().n / 126));
    document.querySelector("#heat-detail").textContent =
      empty === "true"
        ? `${
            [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ][di]
          } ${
            Number(hi) + 5
          }:00 · No usable observations. This hour is excluded.`
        : `${
            [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ][di]
          } ${Number(hi) + 5}:00 · ${p}% on time · ${current().median.toFixed(
            1
          )} min typical delay · ${n} samples${
            n < 200 ? " · Low confidence" : ""
          } · Demo data`;
  }
  if (b.dataset.action === "add-compare" && state.compare.length < 4) {
    state.compare.push(routes.find((r) => !state.compare.includes(r.id)).id);
    render();
  }
  if (b.dataset.action === "share") {
    try {
      await navigator.clipboard.writeText(location.href);
      toast("Link copied. Your route and filters are included.");
    } catch {
      toast("Your address bar contains the shareable view link.");
    }
  }
  if (b.dataset.action === "export") {
    const data =
      state.view === "detail"
        ? [current()]
        : state.view === "compare"
        ? state.compare.map((id) =>
            stats(routes.find((r) => r.id === id) || routes[0])
          )
        : filtered().map(stats);
    const csv = [
      "route,mode,on_time_percent,median_delay_minutes,p90_delay_minutes,samples,period_days,day_type,hours,date_range,data_type",
      ...data.map((r) =>
        [
          r.name,
          r.mode,
          r.score.toFixed(1),
          r.median.toFixed(1),
          r.p90.toFixed(1),
          r.n,
          state.period,
          state.day,
          state.hour,
          range(),
          "synthetic demo",
        ].join(",")
      ),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "ontrack-demo-reliability.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Demo statistics exported as CSV.");
  }
});
document.addEventListener("change", (e) => {
  if (e.target.dataset.filter) {
    state[e.target.dataset.filter] = e.target.value;
    render();
  }
  if (e.target.dataset.compare !== undefined) {
    state.compare[Number(e.target.dataset.compare)] = e.target.value;
    render();
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "route-search") {
    query = e.target.value;
    const data = filtered();
    document.querySelector("#route-rows").innerHTML = rows(
      state.view === "overview" ? data.slice(0, 5) : data
    );
    document.querySelector("#route-total").textContent = `${
      data.length
    } routes · ${range()}`;
  }
});
render();
