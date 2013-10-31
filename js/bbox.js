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

    var bounds = new L.Rectangle(map.getBounds(),{fill:false});
    map.addLayer(bounds)

    map.on('draw:created', function (e) {
        drawnItems.addLayer(e.layer);
        bounds.setBounds(drawnItems.getBounds())
        $('#boxbounds').val(bounds.getBounds().toBBoxString());
    });
    
    map.on('draw:deleted', function (e) {
        e.layers.eachLayer(function (l) {
            drawnItems.removeLayer(l);
        });
        bounds.setBounds(drawnItems.getBounds())
        $('#boxbounds').val(bounds.getBounds().toBBoxString());
    });
    
    map.on('draw:edited', function (e) {
        bounds.setBounds(drawnItems.getBounds())
        $('#boxbounds').val(bounds.getBounds().toBBoxString());
    });
    
    $('#zoomlevel').val(map.getZoom().toString());
    $('#mapbounds').val(map.getBounds().toBBoxString());
    $('#boxbounds').val(bounds.getBounds().toBBoxString());

    map.on('mousemove', function(e) {
        $('#mousepos').val(e.latlng.toString());
        $('#mapbounds').val(map.getBounds().toBBoxString());
    });
    map.on('zoomend', function(e) {
        $('#zoomlevel').val(map.getZoom().toString());
    });

    var clip = new ZeroClipboard( $("boxboundsbtn"), {
        moviePath: "/swf/ZeroClipboard.swf"
    });
    
    clip.on( "load", function(client) {
        client.on( "complete", function(client, args) {
            // `this` is the element that was clicked
            //this.style.display = "none";
            alert("Copied text to clipboard: " + args.text );
        });
    });
    
});

