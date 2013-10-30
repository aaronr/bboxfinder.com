var map = null;

$(function() {
    map = L.mapbox.map('map', 'examples.map-9ijuk24y')
        .setView([48, -122], 5);
    $('#zoomlevel').val(map.getZoom().toString());

    map.on('mousemove', function(e) {
        $('#mousepos').val(e.latlng.toString());
    });
    map.on('zoomend', function(e) {
        $('#zoomlevel').val(map.getZoom().toString());
    });

});

