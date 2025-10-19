import { renderVega } from "../components/VegaChart.js";
import { kpiCard } from "../components/KpiCard.js";
import { renderTable } from "../components/Table.js";
import { loadCSV, loadJSON } from "../utils/fetcher.js";
import { joinByKey, pct, formatNum } from "../utils/transforms.js";

async function boot(){
  const meta = await fetch("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/config/meta.json").then(r=>r.json());
  document.getElementById("last-updated").textContent = `Last updated: ${meta.lastUpdated}`;

  const prf = await loadCSV("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/public/data/prf_state_latest.csv");
  const prfTable = await loadCSV("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/public/data/prf_state_table.csv");
  const shapes = await loadJSON("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/malaysia_states_fixed.geojson");
  const history = await loadCSV("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/public/data/prf_state_history.csv");
  const loss = await loadCSV("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/public/data/gfw_loss_state.csv");
  const aq = await loadCSV("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/public/data/air_quality_monthly.csv");

  // Build a map: state_name -> state_iso from the GeoJSON
  const isoByName = Object.fromEntries(
    (shapes.features || []).map(f => [
      f.properties?.state_name, 
      f.properties?.state_iso
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

  const prfTableWithISO = prfTable.map(r => ({
    ...r,
    shapeISO: isoByName[aliases[r.state] || r.state] || null
  }));


  console.log('geo feature sample', shapes.features?.[0]?.properties);
  console.log('prf sample', prfWithISO[0]);
  console.log('prfTable sample', prfTable[0]);
  console.log('prfTable length:', prfTable.length);
  console.log('prfTableWithISO length:', prfTableWithISO.length);
  console.log('GeoJSON properties:', shapes.features?.[0]?.properties);
  console.log('Available property keys:', Object.keys(shapes.features?.[0]?.properties || {}));
  console.log('shapes.features length:', shapes.features?.length);
  console.log('prfWithISO length:', prfWithISO.length);
  console.log('prfWithISO with shapeISO:', prfWithISO.filter(r => r.shapeISO));

  // KPIs (naive placeholders)
  const totalPRF = prfWithISO.reduce((s,r)=>s+Number(r.prf_ha||0),0);
  const kpiRoot = document.getElementById("kpis");
  [ {label:"Total PRF (ha)", value: formatNum(Math.round(totalPRF))},
    {label:"States", value: prfWithISO.length}
  ].map(kpiCard).forEach(el=>kpiRoot.appendChild(el));

  // Ranks table - Top 5 states by PRF area
  const rows = prfTableWithISO.map(r=>({
    state: r.state,
    prf_ha: formatNum(r.prf_ha),
    prf_pct: (Number(r.prf_pct)||0).toFixed(1)+"%"
  }))
  .sort((a,b)=>Number(b.prf_ha.replace(/,/g,""))-Number(a.prf_ha.replace(/,/g,"")))
  .slice(0, 5); // Show only top 5
  
  console.log('Table rows length:', rows.length);
  console.log('Table rows:', rows);
  
  renderTable("#state-rank", rows, [
    {key:"state", label:"State"},
    {key:"prf_ha", label:"PRF (ha)"},
    {key:"prf_pct", label:"PRF % of land"}
  ]);

  // Render charts
  const mapSpec = await fetch("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/src/specs/map_prf_overview.vl.json").then(r=>r.json());
  mapSpec.datasets = {
    states: shapes.features || [],
    prf: prf
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

