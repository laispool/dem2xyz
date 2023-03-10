///////////////////////////////////////////////////////////
///// Laís Pool  (lais.pool@gmail.com)                /////                       
///// Florianopolis, 16/01/2023                       /////             
///// Code Editor - Earth Engine                      /////                           
///// Laís Pool  (lais.pool@gmail.com)                /////                        
///// Florianopolis, 16/01/2023                       /////              
///// Code Editor - Earth Engine                      /////                             
///// A code to extract XYZ (points) from Digital     /////
///// Elevation Model (raster)                        /////
///////////////////////////////////////////////////////////

var geometry = ee.Geometry.Polygon(
          [[[-48.660896246505814,-26.084579298751073],
            [-48.660896246505814,-26.297054554428385],
            [-48.43335920357083,-26.297054554428385],
            [-48.43335920357083,-26.084579298751073],
            [-48.660896246505814,-26.084579298751073]]]);
//you can create your own with https://geojson.io/#map=2/0/20
Map.addLayer(geometry, {color: 'black'},'Geometry',false); //add the geometry created in black and disable it

var elevation = ee.Image('projects/ee-laispool-sr/assets/DEM2021').rename('elevation'); //imports the image
//you have to firstly import your own image to the assets section on Earth Engine

Map.addLayer(elevation, {palette: ['darkblue','blue','cyan'], min:-30, max:0}, 'DEM');
Map.centerObject(elevation,10);
print('Elevation: ', elevation);

var projection = elevation.projection(); //extract the projection information from the image
print(projection);
print('Geometry', geometry);

var elevationSamples = elevation.sample({
    //region: geometry,
    projection: elevation.projection(),
    scale: elevation.projection().nominalScale(),
    geometries: true,
    factor:0.001 //subsample number in case is to large to process, chose a number between (0,1]
});

Map.addLayer(elevationSamples, {}, 'Points extracted');
print('Samples calculated', elevationSamples.getInfo());

// Add three properties to the output table: 
// 'z= Elevation', 'x=Longitude UTM 22S', and 'y = Latitude UTM 22S'.

var latlon2utm = elevationSamples.map(function(feature) {
  return feature.transform('EPSG: 32722'); //tranform the Coordinate Reference System of the geometry property 
});
print('UTM', latlon2utm);

var elevationSamplesUTM = latlon2utm.map(function(feature) {
    var geom = feature.geometry().coordinates();
    return ee.Feature(null, {
        'X': ee.Number(geom.get(0)),
        'Y': ee.Number(geom.get(1)),
        'Z': ee.Number(feature.get('elevation')).multiply(-1), //in case your data is already in positive values, erase the multiply part
    });
});
print('Coordinates added as colums', elevationSamplesUTM.getInfo());
var list = elevationSamplesUTM.toList(elevationSamplesUTM.size());
print('First of the list', list.get(0)); 

// Export as CSV.
Export.table.toDrive({
    collection: elevationSamplesUTM,
    description: 'XYZ_16022021', //you can change the name to your own data date
    fileFormat: 'CSV'
});

Export.table.toDrive({
  collection: ee.FeatureCollection(geometry),
  description:'geometry_2021', //you can change the name to your own data date
  fileFormat: 'KML'
});
