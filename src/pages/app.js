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
  
  try {
    shapes = await loadJSON("https://cdn.jsdelivr.net/gh/wantedWaffleInUni/dv2@main/malaysia_states_fixed.geojson");
    console.log("✅ Shapes data loaded:", shapes.features?.length, "features");
  } catch (error) {
    console.error("❌ Error loading shapes data:", error);
  }
  
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
    shapeISO: String(r.state_code ?? '').trim(),      // must match GeoJSON exactly
    prf_ha: Number(r.prf_ha),
    prf_pct: Number(r.prf_pct)
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
  
  console.log('prfTable length:', prfTable.length);
  console.log('prfTableWithISO length:', prfTableWithISO.length);
  console.log('Table rows length:', rows.length);
  console.log('Table rows:', rows);
  console.log('prfTable data:', prfTable);
  
  // Debug the data joining
  console.log('🔍 Debugging data joining:');
  console.log('GeoJSON first feature properties:', shapes.features?.[0]?.properties);
  console.log('PRF first record:', prfWithISO[0]);
  console.log('Available GeoJSON fields:', Object.keys(shapes.features?.[0]?.properties || {}));
  console.log('Available PRF fields:', Object.keys(prfWithISO[0] || {}));
  
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

// Add error handling for the boot function
boot().catch(error => {
  console.error("💥 Fatal error in boot function:", error);
});

console.log("🔧 Script loaded, boot function called");

