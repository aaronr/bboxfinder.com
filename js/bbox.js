var map, sidebar = null;

/*
**
**  create a lightBox instance
**  really b/c we need a singleton
**
*/
var lightBox = (function(){
    "use strict";

    var LightBox = function(options){

        options || (options={});
    
        this.cWidth = null;
        this.cHeight = null;

    };
    

    LightBox.prototype.startLightBox = function() {

        $("#ocontainer")
            .before('<div class="overlay"></div>')

        $(".overlay")
            .animate({"opacity":"0.6"}, 200, "linear");

        $(".ocontainer")
            .css( "display", "inherit" );

        // use width and height to dynamically position
        if( !(this.cWidth) && !(this.cHeight) ){
            this.cWidth = $(".ocontainer textarea").width();
            this.cHeight = $(".ocontainer textarea").height();
        }

        $(".ocontainer")
            .css({
                "top":        "50%",
                "left":        "50%",
                "width":      this.cWidth + 20,
                "height":     this.cHeight + 20,
                "margin-top": -(this.cHeight/2), // the middle position
                "margin-left":-(this.cWidth/2)
            })
            .animate({"opacity":"1"}, 200, "linear");

        
        $("#map .leaflet-tile-loaded").addClass( "blurred" );
    };

    LightBox.prototype.endLightBox = function(){

        $('.ocontainer').css("display", "none" );
        $('#map .leaflet-tile-loaded').removeClass('blurred');
        $('#map .leaflet-tile-loaded').addClass('unblurred');
        setTimeout( function(){
            $('#map .leaflet-tile-loaded').removeClass('unblurred');
        },7000);
        $('.overlay').remove();

    };

    return new LightBox();

})(); // create it right away

/*
**
**  override L.Rectangle 
**  to fire an event after setting
**
**  the base parent object L.Path
**  includes the L.Mixin.Events
**
**  ensures bbox box is always
**  the topmost SVG feature
**
*/
L.Rectangle.prototype.setBounds = function (latLngBounds) {

    this.setLatLngs(this._boundsToLatLngs(latLngBounds));
    this.fire( 'bounds-set' );
}


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


function addGeoJson() {

    var data = $('.leaflet-sidebar textarea').val();

    // QC as JSON
    try{
        data = JSON.parse( data );
    } catch(err){
        if( /unexpected token/i.test(err.message) ){
            alert( "That's not parsable JSON dude!" );
        }
        else {
            alert( "Something doesn't smell right about that JSON" );
        }
        return false;
    }

    // create geojson layer
    try {
        var gjson_layer = new L.geoJson( data );
    }
    catch( err ){
        alert( "Yuck. Leaflet puked up your geojson with this error:\n" + err.message );
        return false;
    }

    /*
    ** 
    **  QC feature layer count to make
    **  sure someone is not trying to bomb
    **  the system
    **
    */
    if ( gjson_layer.getLayers().length >= 50 ) {
        alert( "Try adding geojson with < 50 features dingus" );
        return false;
    }

    /* 
    **  add it as L.FeatureGroup layer 
    **  to work with L.Draw
    **  edit and delete options
    **  by faking event information
    **  and triggering draw:created
    */
    gjson_layer.getLayers().forEach( function( lyr, indx ){

        // create payload event object to pass to L.FeatureGroup
        var event_obj = {
            layer : lyr ,
            layerType : null,
            geojson: true
        };

        // sniff the feature.geometry type and coerce to L.Draw types
        var geom_type = lyr.feature.geometry.type;

        if ( geom_type === "Point" || 
                geom_type === "MultiPoint" ){

            event_obj.layerType = "marker";

        }
        else if ( geom_type === "LineString" || 
                    geom_type === "MultiLineString" ){

            event_obj.layerType = "polyline";

        }
        else if ( geom_type === "Polygon" ||
                    geom_type === "MultiPolygon" ){

            event_obj.layerType = "polygon";

        }

        // call L.Draw.Feature.prototype._fireCreatedEvent
        map.fire( 'draw:created', event_obj );

    });

    return true;
    
}


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

    /* 
    **
    **  make sure all textarea inputs
    **  are selected once they are clicked
    **  because some people might not 
    **  have flash enabled or installed
    **  and yes...
    **  there's a fucking Flash movie floating 
    **  on top of your DOM
    **
    */
    $('input[type="textarea"]').on( 'click', function( evt ) { this.select() } );

    map = L.mapbox.map('map', 'examples.map-9ijuk24y')
        .setView([48, -122], 5);

    sidebar = L.control.sidebar('sidebar', {
        position: 'right'
    });
    
    map.addControl(sidebar);

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

    /*
    **
    **  create bounds layer
    **  and default it at first
    **  to draw on null island
    **  so it's not seen onload
    **
    */
    var bounds = new L.Rectangle(new L.LatLngBounds([0.0,0.0],[0.0,0.0]),
        {
            fill : false,
            opacity : 1.0,
            color : '#000'
        }
    );
    bounds.on('bounds-set', function( e ) {
        // move it to the end of the parent
        var parent = e.target._container.parentElement;
        $( parent ).append( e.target._container ); 
    });
    map.addLayer(bounds)

    map.on('draw:created', function (e) {
        drawnItems.addLayer(e.layer);
        bounds.setBounds(drawnItems.getBounds())
        $('#boxbounds').val(formatBounds(bounds.getBounds(),'4326','gdal'));
        $('#boxboundsmerc').val(formatBounds(bounds.getBounds(),'3857','gdal'));
        if (!e.geojson &&
            !((drawnItems.getLayers().length == 1) && (drawnItems.getLayers()[0] instanceof L.Marker))) {
            map.fitBounds(bounds.getBounds());
        } else {
            if ((drawnItems.getLayers().length == 1) && (drawnItems.getLayers()[0] instanceof L.Marker)) {
                map.panTo(drawnItems.getLayers()[0].getLatLng());
            }
        }
    });
    
    map.on('draw:deleted', function (e) {
        e.layers.eachLayer(function (l) {
            drawnItems.removeLayer(l);
        });
        if (drawnItems.getLayers().length > 0 &&
            !((drawnItems.getLayers().length == 1) && (drawnItems.getLayers()[0] instanceof L.Marker))) {
            bounds.setBounds(drawnItems.getBounds())
            $('#boxbounds').val(formatBounds(bounds.getBounds(),'4326','gdal'));
            $('#boxboundsmerc').val(formatBounds(bounds.getBounds(),'3857','gdal'));
            map.fitBounds(bounds.getBounds());
        } else {
            bounds.setBounds(new L.LatLngBounds([0.0,0.0],[0.0,0.0]));
            $('#boxbounds').val(formatBounds(bounds.getBounds(),'4326','gdal'));
            $('#boxboundsmerc').val(formatBounds(bounds.getBounds(),'3857','gdal'));
            if (drawnItems.getLayers().length == 1) {
                map.panTo(drawnItems.getLayers()[0].getLatLng());
            }
        }
    });
    
    map.on('draw:edited', function (e) {
        bounds.setBounds(drawnItems.getBounds())
        $('#boxbounds').val(formatBounds(bounds.getBounds(),'4326','gdal'));
        $('#boxboundsmerc').val(formatBounds(bounds.getBounds(),'3857','gdal'));
        map.fitBounds(bounds.getBounds());
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

    var zeroFeedback = function( target ){

        $(target).append( "<span id='zfeedback'>&nbsp;Copied!&nbsp;</span>" );

        $('#zfeedback').css({
             "background-color" : "#C7C700" ,
             "font-stye" : "bold" ,
             "border-radius" : "15px" ,
             "padding" : "5px" ,
             "box-shadow" : "0px 2px 20px #000"
        });

        $(target)
            .animate( { opacity : 0 , top : "-=100" }, 500 );

        setTimeout( function(){
            $(target).css( "opacity", 1.0 );
            $(target).css( "background-color", "" );
            $('#zfeedback').remove();
        }, 700 );

    }

    var boxboundclip = new ZeroClipboard( $("#boxboundsbtn"), {
        moviePath: "/swf/ZeroClipboard.swf"
    });
    
    boxboundclip.on( "load", function(client) {
        client.on( "complete", function(client, args) {
            zeroFeedback( client.htmlBridge );
        });
    });

    var boxboundmercclip = new ZeroClipboard( $("#boxboundsmercbtn"), {
        moviePath: "/swf/ZeroClipboard.swf"
    });
    
    boxboundmercclip.on( "load", function(client) {
        client.on( "complete", function(client, args) {
            zeroFeedback( client.htmlBridge );
        });
    });

    var mapboundclip = new ZeroClipboard( $("#mapboundsbtn"), {
        moviePath: "/swf/ZeroClipboard.swf"
    });
    
    mapboundclip.on( "load", function(client) {
        client.on( "complete", function(client, args) {
            zeroFeedback( client.htmlBridge );
        });
    });

    var mapboundmercclip = new ZeroClipboard( $("#mapboundsmercbtn"), {
        moviePath: "/swf/ZeroClipboard.swf"
    });
    
    mapboundmercclip.on( "load", function(client) {
        client.on( "complete", function(client, args) {
            zeroFeedback( client.htmlBridge );
        });
    });

    var centerclip = new ZeroClipboard( $("#centerbtn"), {
        moviePath: "/swf/ZeroClipboard.swf"
    });
    
    centerclip.on( "load", function(client) {
        client.on( "complete", function(client, args) {
            zeroFeedback( client.htmlBridge );
        });
    });

    var centermercclip = new ZeroClipboard( $("#centermercbtn"), {
        moviePath: "/swf/ZeroClipboard.swf"
    });
    
    centermercclip.on( "load", function(client) {
        client.on( "complete", function(client, args) {
            zeroFeedback( client.htmlBridge );
        });
    });

    // handle create-geojson click events
    $('#create-geojson').on( 'click' , function(){
        sidebar.show();
    });

    $('button#add').on( 'click', function(evt){
        var is_valid = addGeoJson();
        if (is_valid) {
            sidebar.hide();
            map.fitBounds(bounds.getBounds());
        }
    });
    $('button#clear').on( 'click', function(evt){
        $('.leaflet-sidebar textarea').val('');
    });

    // Add in a layer to overlay the tile bounds of the google grid
    var tiles = new L.tileLayer('/images/tile.png', {});
    addLayer(tiles, 'Tile Grid', 10, false)

    
});

