import { renderVega } from "../components/VegaChart.js";
import { kpiCard } from "../components/KpiCard.js";
import { renderTable } from "../components/Table.js";
import { loadCSV, loadJSON } from "../utils/fetcher.js";
import { joinByKey, pct, formatNum } from "../utils/transforms.js";

async function boot(){
  console.log("🚀 App starting...");
  
  try {
    const meta = await fetch("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/config/meta.json").then(r=>r.json());
    document.getElementById("last-updated").textContent = `Last updated: ${meta.lastUpdated}`;
    console.log("✅ Meta loaded:", meta);
  } catch (error) {
    console.error("❌ Error loading meta:", error);
  }

  console.log("📊 Loading data...");
  
  let prf, prfTable, shapes, history, loss, aq;
  
  try {
    prf = await loadCSV("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/public/data/prf_state_latest.csv");
    console.log("✅ PRF data loaded:", prf.length, "records");
  } catch (error) {
    console.error("❌ Error loading PRF data:", error);
  }
  
  try {
    prfTable = await loadCSV("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/public/data/prf_state_table.csv");
    console.log("✅ PRF Table data loaded:", prfTable.length, "records");
  } catch (error) {
    console.error("❌ Error loading PRF Table data:", error);
  }
  
  // Shapes no longer needed here; the map spec reads TopoJSON directly
  
  try {
    history = await loadCSV("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/public/data/prf_state_history.csv");
    console.log("✅ History data loaded:", history.length, "records");
  } catch (error) {
    console.error("❌ Error loading history data:", error);
  }
  
  try {
    loss = await loadCSV("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/public/data/gfw_loss_state.csv");
    console.log("✅ Loss data loaded:", loss.length, "records");
  } catch (error) {
    console.error("❌ Error loading loss data:", error);
  }
  
  try {
    aq = await loadCSV("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/public/data/air_quality_monthly.csv");
    console.log("✅ Air quality data loaded:", aq.length, "records");
  } catch (error) {
    console.error("❌ Error loading air quality data:", error);
  }

  // Build alias map for names used in PRF table joins (kept for table)
  const aliases = {
    "W.P. Kuala Lumpur": "Kuala Lumpur",
    "W.P. Labuan": "Labuan",
    "W.P. Putrajaya": "Putrajaya",
    "Pulau Pinang": "Penang",
  };
  const prfWithISO = prf.map(r => ({
    ...r,
    shapeISO: String(r.state_code ?? '').trim(),      // must match GeoJSON exactly
    prf_ha: Number(r.prf_ha),
    prf_pct: Number(r.prf_pct),
    lon: Number(r.lon ?? r.label_lon ?? r.centroid_lon ?? r.lng ?? r.longitude),
    lat: Number(r.lat ?? r.label_lat ?? r.centroid_lat ?? r.latitude)
  }));

  const prfTableWithISO = prfTable.map(r => ({
    ...r,
    // PRF table already contains state names; ISO mapping not required for table rendering
    shapeISO: String(r.state_code || "").trim() || null
  }));

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

  renderTable("#state-rank", rows, [
    {key:"state", label:"State"},
    {key:"prf_ha", label:"PRF (ha)"},
    {key:"prf_pct", label:"PRF % of land"}
  ]);

  // Render charts
  const mapSpec = await fetch("src/specs/map_prf_overview.vl.json").then(r=>r.json());
  mapSpec.datasets = { prf: prfWithISO };
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

// Add error handling for the boot function
boot().catch(error => {
  console.error("💥 Fatal error in boot function:", error);
});

console.log("🔧 Script loaded, boot function called");

