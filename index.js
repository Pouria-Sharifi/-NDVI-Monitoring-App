/*******************************************************
 * NDVI Monitoring App
 * 
 * Description:
 * This app allows users to monitor vegetation health 
 * using NDVI, based on Sentinel-2 and Landsat imagery. 
 * It supports dynamic AOI selection, monthly NDVI 
 * trends, point-based comparisons, and GeoTIFF export.
 * 
 * Features:
 * - Draw AOI dynamically.
 * - Compute and visualize monthly NDVI trends.
 * - Add comparison points interactively.
 * - Export NDVI map as GeoTIFF.
 * 
 * Author: Pouria Sharifi
 * *****************************************************/

// Initialize the main UI panel
var controlPanel = ui.Panel();
controlPanel.style().set({
  width: '350px',
  padding: '10px',
  position: 'top-left'
});
ui.root.add(controlPanel);

// Add app title
controlPanel.add(ui.Label({
  value: 'NDVI Monitoring App',
  style: {fontSize: '22px', fontWeight: 'bold', margin: '10px 0'}
}));

// Add instructions
controlPanel.add(ui.Label('1. Draw AOI.'));
controlPanel.add(ui.Label('2. Select Start Year.'));
controlPanel.add(ui.Label('3. Add Points for NDVI Comparison.'));
controlPanel.add(ui.Label('4. Run Analysis and Export Results.'));

// Placeholder variables
var userAOI = null; // Area of Interest
var startYear = 2022; // Default start year
var points = ee.FeatureCollection([]); // Collection of user-drawn points
var pointCounter = 0; // Counter for naming points

// Draw AOI Button
var drawAOIButton = ui.Button({
  label: 'Draw AOI',
  onClick: function() {
    Map.drawingTools().setShape('rectangle');
    Map.drawingTools().setLinked(true);
    Map.drawingTools().draw();
    ui.alert('Draw a rectangle on the map to define your AOI.');
  }
});
controlPanel.add(drawAOIButton);

// Start Year Dropdown
var yearDropdown = ui.Select({
  items: ['2020', '2021', '2022', '2023', '2024'], // Available years
  placeholder: 'Select Start Year',
  value: '2022',
  onChange: function(value) {
    startYear = parseInt(value, 10);
  }
});
controlPanel.add(ui.Label('Start Year:'));
controlPanel.add(yearDropdown);

// Add Points Button
var addPointButton = ui.Button({
  label: 'Add Points for NDVI Comparison',
  onClick: function() {
    Map.onClick(function(coords) {
      pointCounter += 1; // Increment point counter
      var pointName = 'Point ' + pointCounter; // Assign a name to the point
      var point = ee.Geometry.Point([coords.lon, coords.lat]);
      var feature = ee.Feature(point, {name: pointName}); // Add point name as property
      points = points.merge(ee.FeatureCollection([feature]));
      Map.addLayer(point, {color: 'red'}, pointName);
      ui.alert('Point added! Total points: ' + pointCounter);
    });
    ui.alert('Click on the map to add points for NDVI comparison.');
  }
});
controlPanel.add(addPointButton);

// Run Analysis Button
var runAnalysisButton = ui.Button({
  label: 'Run Analysis',
  onClick: function() {
    if (Map.drawingTools().layers().length() === 0) {
      ui.alert('Please draw an AOI before running the analysis.');
      return;
    }

    // Get the AOI
    var layer = Map.drawingTools().layers().get(0);
    userAOI = layer.getEeObject();

    performNDVIAnalysis(userAOI, startYear, points);
  }
});
controlPanel.add(runAnalysisButton);

/**
 * Perform NDVI analysis for the selected AOI and year.
 */
function performNDVIAnalysis(aoi, year, points) {
  Map.clear();
  Map.centerObject(aoi);

  // Define the time range for analysis
  var startDate = ee.Date.fromYMD(year, 1, 1);
  var endDate = startDate.advance(1, 'year');

  // Load and process Sentinel-2 and Landsat data
  var landsat8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
    .filterDate(startDate, endDate)
    .filterBounds(aoi)
    .map(processLandsat);

  var landsat9 = ee.ImageCollection("LANDSAT/LC09/C02/T1_L2")
    .filterDate(startDate, endDate)
    .filterBounds(aoi)
    .map(processLandsat);

  var sentinel2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterDate(startDate, endDate)
    .filterBounds(aoi)
    .map(processSentinel);

  // Merge all collections and compute monthly NDVI
  var ndviCollection = landsat8.merge(landsat9).merge(sentinel2).sort('system:time_start');
  var monthlyNDVI = computeMonthlyNDVI(ndviCollection);

  // Display NDVI on map
  var ndviImage = monthlyNDVI.toBands().clip(aoi);
  Map.addLayer(ndviImage, {}, 'Monthly NDVI');

  // NDVI Chart for AOI
  var aoiChart = ui.Chart.image.series(monthlyNDVI, aoi, ee.Reducer.mean(), 30, 'system:time_start')
    .setOptions({
      title: 'NDVI Trends Over Time (AOI)',
      hAxis: {title: 'Month'},
      vAxis: {title: 'NDVI'},
      legend: {position: 'none'}
    });
  controlPanel.add(ui.Label('NDVI Trends Over Time (AOI):', {fontWeight: 'bold'}));
  controlPanel.add(aoiChart);

  // NDVI Charts for Points
  if (points.size().getInfo() > 0) {
    var pointsChart = ui.Chart.image.seriesByRegion(
      monthlyNDVI,
      points,
      ee.Reducer.mean(),
      'ndvi',
      30,
      'system:time_start',
      'name' // Use the "name" property for legend labels
    ).setOptions({
      title: 'NDVI Comparison for Points',
      hAxis: {title: 'Month'},
      vAxis: {title: 'NDVI'},
      legend: {position: 'right'}
    });
    controlPanel.add(ui.Label('NDVI Comparison for Points:', {fontWeight: 'bold'}));
    controlPanel.add(pointsChart);
  }

  // Generate export URL
  generateExportURL(ndviImage, aoi);
}

/**
 * Generate export URL for NDVI map.
 */
function generateExportURL(ndviImage, aoi) {
  var ndviExportUrl = ndviImage.getDownloadURL({
    format: 'GeoTIFF',
    scale: 30,
    region: aoi
  });

  // Display export link in the panel
  controlPanel.add(ui.Label('Export NDVI Map as GeoTIFF:', {fontWeight: 'bold'}));
  controlPanel.add(ui.Label(ndviExportUrl, {color: 'blue'}).setUrl(ndviExportUrl));
}

/**
 * Process Landsat data to compute NDVI with calibration.
 */
function processLandsat(img) {
  var multBand = ee.Image.constant(ee.Number(img.get('REFLECTANCE_MULT_BAND_4')));
  var addBand = ee.Image.constant(ee.Number(img.get('REFLECTANCE_ADD_BAND_4')));
  var reflectance = img.select('SR_B[2-5]').multiply(multBand).add(addBand);
  var ndvi = reflectance.normalizedDifference(['SR_B5', 'SR_B4']).rename('ndvi');
  return ndvi.copyProperties(img, img.propertyNames());
}

/**
 * Process Sentinel-2 data to compute NDVI.
 */
function processSentinel(img) {
  var reflectance = img.select('B.*').multiply(0.0001);
  var ndvi = reflectance.normalizedDifference(['B8', 'B4']).rename('ndvi');
  return ndvi.copyProperties(img, img.propertyNames());
}

/**
 * Compute monthly NDVI by aggregating data.
 */
function computeMonthlyNDVI(collection) {
  var months = ee.List.sequence(1, 12);
  return ee.ImageCollection(months.map(function(month) {
    var filtered = collection.filter(ee.Filter.calendarRange(month, month, 'month')).median();
    var date = ee.Date.fromYMD(startYear + 1, month, 1);
    return filtered.set('system:time_start', date.millis()).set('system:index', date.format('YYYY-MM'));
  }));
}
