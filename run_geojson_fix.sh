#!/bin/bash

echo "Malaysia GeoJSON Processing"
echo "=========================="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Install required packages
echo "Installing required Python packages..."
pip3 install -r requirements.txt

# Run the GeoJSON fixer
echo "Running GeoJSON processing..."
python3 fix_geojson.py

echo "Done! Check the generated files."
