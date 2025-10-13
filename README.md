# MY Forest Conservation (Vega-Lite)
## Run
A static server is enough (e.g., `npx serve .`).

## Fill these datasets
- prf_state_latest.csv (from data.gov.my forest_reserve_state)
- prf_state_history.csv (historical PRF by region/state)
- gfw_loss_state.csv (GFW export per state)
- mys_states.geojson (state boundaries with `properties.code` matching `state_code`)
- Optional: wdpa_malaysia.geojson, kba_sites.geojson, air_quality_monthly.csv

## Next charts to add
- map_fires_points.vl.json using NASA FIRMS (7/30/90 day toggles)
- smallmult_air_quality.vl.json
- map_protected_overlays.vl.json (WDPA + KBA)