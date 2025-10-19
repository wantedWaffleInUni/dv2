import { renderVega } from "../components/VegaChart.js";
import { kpiCard } from "../components/KpiCard.js";
import { renderTable } from "../components/Table.js";
import { loadCSV, loadJSON } from "../utils/fetcher.js";
import { joinByKey, pct, formatNum } from "../utils/transforms.js";

async function boot(){
  const meta = await fetch("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/config/meta.json").then(r=>r.json());
  document.getElementById("last-updated").textContent = `Last updated: ${meta.lastUpdated}`;

  const prf = await loadCSV("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/public/data/prf_state_latest.csv");
  const shapes = await loadJSON("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/public/data/mys_states.geojson");
  const history = await loadCSV("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/public/data/prf_state_history.csv");
  const loss = await loadCSV("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/public/data/gfw_loss_state.csv");
  const aq = await loadCSV("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/public/data/air_quality_monthly.csv");

  // Build a map: shapeName -> shapeISO from the GeoJSON
  // app.js (after loading shapes & prf)
// In app.js, update the isoByName mapping:
  const isoByName = Object.fromEntries(
    (shapes.features || []).map(f => [
      f.properties?.shapeName, 
      f.properties?.shapeISO || f.properties?.ISO_A1 || f.properties?.ADM1_PCODE
    ])
  );
  const aliases = {
    "W.P. Kuala Lumpur": "Kuala Lumpur",
    "W.P. Labuan": "Labuan",
    "W.P. Putrajaya": "Putrajaya",
    "Pulau Pinang": "Penang",
  };
  const prfWithISO = prf.map(r => ({
    ...r,
    shapeISO: isoByName[aliases[r.state] || r.state] || null
  }));


  console.log('geo feature sample', shapes.features?.[0]?.properties);
  console.log('prf sample', prfWithISO[0]);
  // In app.js, after line 34, add:
  console.log('GeoJSON properties:', shapes.features?.[0]?.properties);
  console.log('Available property keys:', Object.keys(shapes.features?.[0]?.properties || {}));

  // KPIs (naive placeholders)
  const totalPRF = prfWithISO.reduce((s,r)=>s+Number(r.prf_ha||0),0);
  const kpiRoot = document.getElementById("kpis");
  [ {label:"Total PRF (ha)", value: formatNum(Math.round(totalPRF))},
    {label:"States", value: prfWithISO.length}
  ].map(kpiCard).forEach(el=>kpiRoot.appendChild(el));

  // Ranks table - Top 3 states only
  const rows = prfWithISO.map(r=>({
    state: r.state,
    prf_ha: Number(r.prf_ha||0),
    prf_pct: (Number(r.prf_pct)||0).toFixed(1)+"%"
  })).sort((a,b)=>b.prf_ha-a.prf_ha).slice(0, 3).map(r=>({
    state: r.state,
    prf_ha: formatNum(r.prf_ha),
    prf_pct: r.prf_pct
  }));
  
  console.log('Top 3 states:', rows);
  renderTable("#state-rank", rows, [
    {key:"state", label:"State"},
    {key:"prf_ha", label:"PRF (ha)"},
    {key:"prf_pct", label:"PRF % of land"}
  ]);

  // Render charts
  const mapSpec = await fetch("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/src/specs/map_prf_overview.vl.json").then(r=>r.json());
  mapSpec.datasets = {
    states: shapes.features || [],
    prf: prfWithISO
  };
  await renderVega("#map-prf", mapSpec);

  const lineSpec = await fetch("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/src/specs/lines_prf_history.vl.json").then(r=>r.json());
  lineSpec.datasets = { history };
  await renderVega("#line-prf-history", lineSpec);

  const barsSpec = await fetch("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/src/specs/bars_loss_by_year.vl.json").then(r=>r.json());
  barsSpec.datasets = { loss };
  await renderVega("#bars-loss", barsSpec);

  // Air quality small multiples
  const aqSpec = await fetch("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/src/specs/smallmult_air_quality.vl.json").then(r=>r.json());
  aqSpec.datasets = { aq };
  await renderVega("#smallmult-air", aqSpec);
}
boot();

