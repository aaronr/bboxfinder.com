var map = null;

$(function() {
    map = L.mapbox.map('map', 'examples.map-9ijuk24y')
        .setView([48, -122], 5);

    // Initialize the FeatureGroup to store editable layers
    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    
    // Initialize the draw control and pass it the FeatureGroup of editable layers
    var drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems
        }
    });
    map.addControl(drawControl);

    map.on('draw:created', function (e) {
        drawnItems.addLayer(e.layer);
    });
    
    $('#zoomlevel').val(map.getZoom().toString());
    $('#mapbounds').val(map.getBounds().toBBoxString());

    map.on('mousemove', function(e) {
        $('#mousepos').val(e.latlng.toString());
        $('#mapbounds').val(map.getBounds().toBBoxString());
    });
    map.on('zoomend', function(e) {
        $('#zoomlevel').val(map.getZoom().toString());
    });

});

