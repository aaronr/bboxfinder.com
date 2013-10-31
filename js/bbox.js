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

function formatBounds(bounds, proj, tool) {
    var formattedBounds = '';
    var southwest = bounds.getSouthWest();
    var northeast = bounds.getNorthEast();
    var xmin = 0;
    var xmin = 0;
    var xmin = 0;
    var xmin = 0;   
    if (proj == '4326') {
        xmin = southwest.lng.toFixed(6);
        ymin = southwest.lat.toFixed(6);
        xmax = northeast.lng.toFixed(6);
        ymax = northeast.lat.toFixed(6);
    } else {
        southwest = L.CRS.EPSG3857.project(southwest)
        northeast = L.CRS.EPSG3857.project(northeast)
        xmin = southwest.x.toFixed(4);
        ymin = southwest.y.toFixed(4);
        xmax = northeast.x.toFixed(4);
        ymax = northeast.y.toFixed(4);
    }
    if (tool === 'gdal') {
        formattedBounds = xmin+','+ymin+','+xmax+','+ymax;
    } else {
        formattedBounds = xmin+' '+ymin+' '+xmax+' '+ymax;
    }
    return formattedBounds
}

function formatPoint(point, proj, tool) {
    var formattedPoint = '';
    if (proj == '4326') {
        x = point.lng.toFixed(6);
        y = point.lat.toFixed(6);
    } else {
        point = L.CRS.EPSG3857.project(point)
        x = point.x.toFixed(4);
        y = point.y.toFixed(4);
    }
    if (tool === 'gdal') {
        formattedBounds = x+','+y;
    } else {
        formattedBounds = x+' '+y;
    }
    return formattedBounds
}

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
        $('#boxbounds').val(formatBounds(bounds.getBounds(),'4326','gdal'));
        $('#boxboundsmerc').val(formatBounds(bounds.getBounds(),'3857','gdal'));
    });
    
    map.on('draw:deleted', function (e) {
        e.layers.eachLayer(function (l) {
            drawnItems.removeLayer(l);
        });
        bounds.setBounds(drawnItems.getBounds())
        $('#boxbounds').val(formatBounds(bounds.getBounds(),'4326','gdal'));
        $('#boxboundsmerc').val(formatBounds(bounds.getBounds(),'3857','gdal'));
    });
    
    map.on('draw:edited', function (e) {
        bounds.setBounds(drawnItems.getBounds())
        $('#boxbounds').val(formatBounds(bounds.getBounds(),'4326','gdal'));
        $('#boxboundsmerc').val(formatBounds(bounds.getBounds(),'3857','gdal'));
    });
    
    $('#zoomlevel').val(map.getZoom().toString());
    $('#mapbounds').val(formatBounds(map.getBounds(),'4326','gdal'));
    $('#mapboundsmerc').val(formatBounds(map.getBounds(),'3857','gdal'));
    $('#center').val(formatPoint(map.getCenter(),'4326','gdal'));
    $('#centermerc').val(formatPoint(map.getCenter(),'3857','gdal'));
    $('#boxbounds').val(formatBounds(bounds.getBounds(),'4326','gdal'));
    $('#boxboundsmerc').val(formatBounds(bounds.getBounds(),'3857','gdal'));

    map.on('mousemove', function(e) {
        $('#mousepos').val(formatPoint(e.latlng,'4326','gdal'));
        $('#mouseposmerc').val(formatPoint(e.latlng,'3857','gdal'));
        $('#mapbounds').val(formatBounds(map.getBounds(),'4326','gdal'));
        $('#mapboundsmerc').val(formatBounds(map.getBounds(),'3857','gdal'));
        $('#center').val(formatPoint(map.getCenter(),'4326','gdal'));
        $('#centermerc').val(formatPoint(map.getCenter(),'3857','gdal'));
    });
    map.on('zoomend', function(e) {
        $('#zoomlevel').val(map.getZoom().toString());
        $('#mapbounds').val(formatBounds(map.getBounds(),'4326','gdal'));
        $('#mapboundsmerc').val(formatBounds(map.getBounds(),'3857','gdal'));
    });

    var boxboundclip = new ZeroClipboard( $("#boxboundsbtn"), {
        moviePath: "/swf/ZeroClipboard.swf"
    });
    
    boxboundclip.on( "load", function(client) {
        client.on( "complete", function(client, args) {
            //empty
        });
    });

    var boxboundmercclip = new ZeroClipboard( $("#boxboundsmercbtn"), {
        moviePath: "/swf/ZeroClipboard.swf"
    });
    
    boxboundmercclip.on( "load", function(client) {
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

    var mapboundmercclip = new ZeroClipboard( $("#mapboundsmercbtn"), {
        moviePath: "/swf/ZeroClipboard.swf"
    });
    
    mapboundmercclip.on( "load", function(client) {
        client.on( "complete", function(client, args) {
            //empty
        });
    });

    var centerclip = new ZeroClipboard( $("#centerbtn"), {
        moviePath: "/swf/ZeroClipboard.swf"
    });
    
    centerclip.on( "load", function(client) {
        client.on( "complete", function(client, args) {
            //empty
        });
    });

    var centermercclip = new ZeroClipboard( $("#centermercbtn"), {
        moviePath: "/swf/ZeroClipboard.swf"
    });
    
    centermercclip.on( "load", function(client) {
        client.on( "complete", function(client, args) {
            //empty
        });
    });

    // Add in a layer to overlay the tile bounds of the google grid
    var tiles = new L.tileLayer('/images/tile.png', {});
    addLayer(tiles, 'Tile Grid', 10, false)

    
});

