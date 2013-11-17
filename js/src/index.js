window.L = require('leaflet');
window.L.mapbox = require('mapbox.js'); // this includes leaflet source as part of the import
window.proj4 = require('proj4');
window.L.Proj = require('proj4leaflet');
window.L.control.sidebar = require('./leaflet_sidebar/leaflet.sidebar.js');
window.Wkt = require('./wkt/wkt.parser.js');
window.Bbox = require('./bbox');
window.BBOX_T = require('./test/test.runner.js');

// kick it off
$( document ).on( 'ready', function() {

    Bbox.onload_callback();

});

