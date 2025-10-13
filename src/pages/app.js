import { renderVega } from "../components/VegaChart.js";
import { kpiCard } from "../components/KpiCard.js";
import { renderTable } from "../components/Table.js";
import { loadCSV, loadJSON } from "../utils/fetcher.js";
import { joinByKey, pct, formatNum } from "../utils/transforms.js";

async function boot(){
  const meta = await fetch("/config/meta.json").then(r=>r.json());
  document.getElementById("last-updated").textContent = `Last updated: ${meta.lastUpdated}`;

  const prf = await loadCSV("/public/data/prf_state_latest.csv");
  const shapes = await loadJSON("/public/data/mys_states.geojson");
  const history = await loadCSV("/public/data/prf_state_history.csv");
  const loss = await loadCSV("/public/data/gfw_loss_state.csv");

  // KPIs (naive placeholders)
  const totalPRF = prf.reduce((s,r)=>s+Number(r.prf_ha||0),0);
  const kpiRoot = document.getElementById("kpis");
  [ {label:"Total PRF (ha)", value: formatNum(Math.round(totalPRF))},
    {label:"States", value: prf.length}
  ].map(kpiCard).forEach(el=>kpiRoot.appendChild(el));

  // Ranks table
  const rows = prf.map(r=>({
    state: r.state,
    prf_ha: formatNum(r.prf_ha),
    prf_pct: (Number(r.prf_pct)||0).toFixed(1)+"%"
  })).sort((a,b)=>Number(b.prf_ha.replace(/,/g,""))-Number(a.prf_ha.replace(/,/g,"")));
  renderTable("#state-rank", rows, [
    {key:"state", label:"State"},
    {key:"prf_ha", label:"PRF (ha)"},
    {key:"prf_pct", label:"PRF % of land"}
  ]);

  // Render charts
  const mapSpec = await fetch("/src/specs/map_prf_overview.vl.json").then(r=>r.json());
  mapSpec.data = [
    { name:"states", values: shapes },
    { name:"prf", values: prf }
  ];
  await renderVega("#map-prf", mapSpec);

  const lineSpec = await fetch("/src/specs/lines_prf_history.vl.json").then(r=>r.json());
  lineSpec.data = [{ name:"history", values: history }];
  await renderVega("#line-prf-history", lineSpec);

  const barsSpec = await fetch("/src/specs/bars_loss_by_year.vl.json").then(r=>r.json());
  barsSpec.data = [{ name:"loss", values: loss }];
  await renderVega("#bars-loss", barsSpec);
}
boot();

