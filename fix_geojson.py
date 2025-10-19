#!/usr/bin/env python3
"""
Fix Malaysia GeoJSON data for proper map rendering.
This script ensures the GeoJSON has the right structure and field names.
"""

import json
import requests
import geopandas as gpd

def fix_malaysia_geojson():
    """Download and fix the Malaysia GeoJSON data"""
    
    # URL for the Malaysia GeoJSON data
    geojson_url = "https://raw.githubusercontent.com/wantedWaffleInUni/dv2/main/geoBoundaries-MYS-ADM1.geojson"
    
    print("Downloading and processing Malaysia GeoJSON...")
    
    try:
        # Load the GeoJSON
        gdf = gpd.read_file(geojson_url)
        print(f"Loaded {len(gdf)} features")
        
        # Print current structure
        print("\nCurrent columns:", list(gdf.columns))
        print("First feature properties:")
        for col in gdf.columns:
            if col != 'geometry':
                print(f"  {col}: {gdf.iloc[0][col]}")
        
        # Standardize field names
        print("\nStandardizing field names...")
        
        # Map common field names to standardized ones
        field_mapping = {
            'shapeName': 'state_name',
            'NAME_1': 'state_name', 
            'name': 'state_name',
            'shapeISO': 'state_iso',
            'ISO_A1': 'state_iso',
            'ADM1_PCODE': 'state_iso'
        }
        
        # Rename columns
        for old_name, new_name in field_mapping.items():
            if old_name in gdf.columns:
                gdf[new_name] = gdf[old_name]
                print(f"  Mapped {old_name} -> {new_name}")
        
        # Ensure we have state_name
        if 'state_name' not in gdf.columns:
            print("Warning: No state name field found!")
            # Try to use the first text field
            text_cols = gdf.select_dtypes(include=['object']).columns
            if len(text_cols) > 0:
                gdf['state_name'] = gdf[text_cols[0]]
                print(f"Using {text_cols[0]} as state_name")
        
        # Ensure we have state_iso
        if 'state_iso' not in gdf.columns:
            print("Warning: No ISO field found!")
            gdf['state_iso'] = None
        
        # Clean up state names
        gdf['state_name'] = gdf['state_name'].str.strip()
        
        # Sort by state name for consistent ordering
        gdf = gdf.sort_values('state_name')
        
        print(f"\nProcessed {len(gdf)} features")
        print("State names:", gdf['state_name'].tolist())
        
        # Save the fixed GeoJSON
        output_file = "malaysia_states_fixed.geojson"
        gdf.to_file(output_file, driver="GeoJSON")
        print(f"\nSaved fixed GeoJSON to: {output_file}")
        
        # Create a minimal version with just the fields we need
        minimal_gdf = gdf[['state_name', 'state_iso', 'geometry']].copy()
        minimal_file = "malaysia_states_minimal.geojson"
        minimal_gdf.to_file(minimal_file, driver="GeoJSON")
        print(f"Saved minimal GeoJSON to: {minimal_file}")
        
        # Create a state mapping file
        state_mapping = {}
        for _, row in gdf.iterrows():
            state_mapping[row['state_name']] = row['state_iso']
        
        with open("state_iso_mapping.json", "w") as f:
            json.dump(state_mapping, f, indent=2)
        print(f"Saved state mapping to: state_iso_mapping.json")
        
        return gdf
        
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    print("Malaysia GeoJSON Fixer")
    print("=" * 30)
    
    gdf = fix_malaysia_geojson()
    
    if gdf is not None:
        print("\n✅ Processing complete!")
        print("\nFiles created:")
        print("- malaysia_states_fixed.geojson")
        print("- malaysia_states_minimal.geojson") 
        print("- state_iso_mapping.json")
        
        print("\nNext steps:")
        print("1. Upload these files to your repository")
        print("2. Update your app.js to use malaysia_states_fixed.geojson")
        print("3. Use state_iso_mapping.json for consistent state matching")
    else:
        print("❌ Processing failed!")
