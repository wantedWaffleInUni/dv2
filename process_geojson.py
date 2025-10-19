#!/usr/bin/env python3
"""
Process GeoJSON data to ensure proper order and format for Malaysia forest map visualization.
This script will clean and optimize the GeoJSON data for better rendering.
"""

import geopandas as gpd
import json
import requests
from shapely.geometry import shape
import topojson as tp

def download_and_process_geojson():
    """Download and process the Malaysia GeoJSON data"""
    
    # URL for the Malaysia GeoJSON data
    geojson_url = "https://raw.githubusercontent.com/wantedWaffleInUni/dv2/main/geoBoundaries-MYS-ADM1.geojson"
    
    print("Downloading GeoJSON data...")
    try:
        # Download the GeoJSON data
        response = requests.get(geojson_url)
        response.raise_for_status()
        
        # Load as GeoDataFrame
        gdf = gpd.read_file(geojson_url)
        print(f"Loaded {len(gdf)} features")
        
        # Print the structure of the first feature
        print("\nFirst feature properties:")
        print(gdf.iloc[0].to_dict())
        
        # Check available property fields
        print(f"\nAvailable property fields: {list(gdf.columns)}")
        
        # Clean and standardize the data
        print("\nProcessing data...")
        
        # Ensure we have the right coordinate reference system
        if gdf.crs is None:
            gdf.crs = "EPSG:4326"
        
        # Convert to WGS84 if needed
        gdf = gdf.to_crs("EPSG:4326")
        
        # Add standardized field names for easier joining
        if 'shapeName' in gdf.columns:
            gdf['state_name'] = gdf['shapeName']
        elif 'NAME_1' in gdf.columns:
            gdf['state_name'] = gdf['NAME_1']
        
        # Add ISO codes if available
        if 'shapeISO' in gdf.columns:
            gdf['state_iso'] = gdf['shapeISO']
        elif 'ISO_A1' in gdf.columns:
            gdf['state_iso'] = gdf['ISO_A1']
        elif 'ADM1_PCODE' in gdf.columns:
            gdf['state_iso'] = gdf['ADM1_PCODE']
        
        # Sort by state name for consistent ordering
        gdf = gdf.sort_values('state_name', ascending=True)
        
        print(f"\nProcessed {len(gdf)} features")
        print("State names:", gdf['state_name'].tolist())
        
        # Save as optimized GeoJSON
        output_file = "malaysia_states_processed.geojson"
        gdf.to_file(output_file, driver="GeoJSON")
        print(f"\nSaved processed GeoJSON to: {output_file}")
        
        # Also create a TopoJSON version for better performance
        print("\nCreating TopoJSON version...")
        topo = tp.Topology(gdf)
        topo_file = "malaysia_states_processed.topojson"
        topo.to_json(topo_file)
        print(f"Saved TopoJSON to: {topo_file}")
        
        # Create a simplified version for web use
        print("\nCreating simplified version...")
        gdf_simplified = gdf.copy()
        # Simplify geometries to reduce file size
        gdf_simplified.geometry = gdf_simplified.geometry.simplify(tolerance=0.001)
        
        simplified_file = "malaysia_states_simplified.geojson"
        gdf_simplified.to_file(simplified_file, driver="GeoJSON")
        print(f"Saved simplified GeoJSON to: {simplified_file}")
        
        return gdf
        
    except Exception as e:
        print(f"Error processing GeoJSON: {e}")
        return None

def create_state_mapping():
    """Create a mapping between state names and ISO codes"""
    
    # Malaysia state mappings
    state_mappings = {
        "Johor": "MY-01",
        "Kedah": "MY-02", 
        "Kelantan": "MY-03",
        "Melaka": "MY-04",
        "Negeri Sembilan": "MY-05",
        "Pahang": "MY-06",
        "Pulau Pinang": "MY-07",
        "Perak": "MY-08",
        "Perlis": "MY-09",
        "Selangor": "MY-10",
        "Terengganu": "MY-11",
        "Sabah": "MY-12",
        "Sarawak": "MY-13",
        "W.P. Kuala Lumpur": "MY-14",
        "W.P. Labuan": "MY-15",
        "W.P. Putrajaya": "MY-16"
    }
    
    # Save mapping as JSON
    with open("state_mapping.json", "w") as f:
        json.dump(state_mappings, f, indent=2)
    
    print("Created state mapping file: state_mapping.json")
    return state_mappings

if __name__ == "__main__":
    print("Malaysia GeoJSON Processing Script")
    print("=" * 40)
    
    # Process the GeoJSON data
    gdf = download_and_process_geojson()
    
    if gdf is not None:
        # Create state mapping
        create_state_mapping()
        
        print("\nProcessing complete!")
        print("\nFiles created:")
        print("- malaysia_states_processed.geojson (full data)")
        print("- malaysia_states_processed.topojson (topology)")
        print("- malaysia_states_simplified.geojson (simplified)")
        print("- state_mapping.json (state name to ISO mapping)")
        
        print("\nNext steps:")
        print("1. Upload the processed files to your repository")
        print("2. Update your app.js to use the new GeoJSON file")
        print("3. Use the state_mapping.json for consistent state name matching")
    else:
        print("Processing failed. Please check the error messages above.")
