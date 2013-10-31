var map = null;

function addLayer(layer, name, zIndex, on) {
    if (on) {
        layer.setZIndex(zIndex).addTo(map);;
    } else {
        layer.setZIndex(zIndex);
    }
    // Create a simple layer switcher that toggles layers on and off.
    var ui = document.getElementById('map-ui');
    var item = document.createElement('li');
    var link = document.createElement('a');
    link.href = '#';
    if (on) {
        link.className = 'active';
    } else {
        link.className = '';
    }
    link.innerHTML = name;
    link.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (map.hasLayer(layer)) {
            map.removeLayer(layer);
            this.className = '';
        } else {
            map.addLayer(layer);
            this.className = 'active';
        }
    };
    item.appendChild(link);
    ui.appendChild(item);
};

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

    var boxboundclip = new ZeroClipboard( $("#boxboundsbtn"), {
        moviePath: "/swf/ZeroClipboard.swf"
    });
    
    boxboundclip.on( "load", function(client) {
        client.on( "complete", function(client, args) {
            //empty
        });
    });
    var mapboundclip = new ZeroClipboard( $("#mapboundsbtn"), {
        moviePath: "/swf/ZeroClipboard.swf"
    });
    
    mapboundclip.on( "load", function(client) {
        client.on( "complete", function(client, args) {
            //empty
        });
    });
    var mouseposclip = new ZeroClipboard( $("#mouseposbtn"), {
        moviePath: "/swf/ZeroClipboard.swf"
    });
    
    mouseposclip.on( "load", function(client) {
        client.on( "complete", function(client, args) {
            //empty
        });
    });
    var zoomlevelclip = new ZeroClipboard( $("#zoomlevelbtn"), {
        moviePath: "/swf/ZeroClipboard.swf"
    });
    
    zoomlevelclip.on( "load", function(client) {
        client.on( "complete", function(client, args) {
            //empty
        });
    });

    // Add in a layer to overlay the tile bounds of the google grid
    var tiles = new L.tileLayer('/images/tile.png', {});
    addLayer(tiles, 'Tile Grid', 10, false)

    
});

