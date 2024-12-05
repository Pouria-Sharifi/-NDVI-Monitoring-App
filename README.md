NDVI Monitoring App
Overview
The NDVI Monitoring App is an interactive tool built on Google Earth Engine (GEE) for monitoring vegetation health and trends using satellite imagery. It leverages data from Sentinel-2, Landsat 8, and Landsat 9 to compute NDVI, allowing users to analyze vegetation dynamics over time for specific areas of interest.

Features
Dynamic AOI Selection:
Draw an area of interest (AOI) on the map for custom analysis.
Monthly NDVI Calculation:
Computes NDVI values for each month of the selected year using multi-satellite data.
Point-Based NDVI Comparison:
Add points interactively to compare NDVI trends at specific locations.
Data Visualization:
Visualize NDVI trends over time for AOIs and points using interactive charts.
Export Functionality:
Download the NDVI map as a GeoTIFF for further analysis.
How It Works
Input Data:

Sentinel-2: COPERNICUS/S2_SR_HARMONIZED
Landsat 8: LANDSAT/LC08/C02/T1_L2
Landsat 9: LANDSAT/LC09/C02/T1_L2
Data is filtered by the selected year and clipped to the user-defined AOI.
Processing:

NDVI is calculated using the formula:
NDVI= 
NIR+RED / NIR−RED
​
 
Aggregated into monthly values for trend analysis.
Visualization:

NDVI trends are displayed in interactive charts within the app.
Export:

Users can download the processed NDVI map for their AOI as a GeoTIFF file.
How to Use
Draw AOI:
Use the "Draw AOI" button to select the area you want to analyze.
Select Year:
Choose the year for analysis using the dropdown.
Add Points:
Click on the map to add points for NDVI comparison.
Run Analysis:
Click "Run Analysis" to compute NDVI and display trends.
Export Results:
Use the export link in the panel to download the NDVI map.
Applications
Agriculture:
Monitor crop health and identify stress conditions.
Environmental Studies:
Analyze land cover changes and vegetation trends.
Urban Planning:
Track vegetation dynamics in peri-urban areas and monitor green spaces.
Future Enhancements
Additional Vegetation Indices:
Incorporate EVI, SAVI, and NDWI for more detailed vegetation analysis.
Machine Learning Integration:
Use supervised classification for automated crop type detection.
Temporal Analysis:
Add support for multi-year NDVI trend analysis.
Getting Started
Clone the repository and open the script in the Google Earth Engine Code Editor.
Make sure you have access to Earth Engine and necessary datasets.
License
This project is open-source and licensed under the MIT License.

Author
Developed by Pouria Sharifi
