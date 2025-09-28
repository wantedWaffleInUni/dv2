import geopandas as gpd

# Load the GeoJSON file
gdf = gpd.read_file("malaysia.json")

# Convert LineString to Polygon
gdf['geometry'] = gdf['geometry'].apply(lambda geom: geom if geom.geom_type == 'Polygon' else geom.buffer(0))

# Save the updated GeoJSON
gdf.to_file("malaysia_fixed.geojson", driver="GeoJSON")