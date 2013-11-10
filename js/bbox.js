var map, sidebar = null;


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


var FormatSniffer = (function () {  // execute immediately

    'use strict';

    /*
    **
    **  constructor
    **
    */
    var FormatSniffer = function( options ) {

        options || ( options = {} );

        if( !this || !( this instanceof FormatSniffer ) ){
            return new FormatSniffer(options);
        }


        this.regExes = {
            ogrinfoExtent : /Extent\:\s\((.*)\)/ ,
            bbox :  /^\(([\s|\-|0-9]*\.[0-9]*,[\s|\-|0-9]*\.[0-9]*,[\s|\-|0-9]*\.[0-9]*,[\s|\-|0-9]*\.[0-9]*)\)$/
        };
        this.data = options.data || ""; 
        this.parse_type = null; 
    };

    /*
    **
    **  functions
    **
    */
    FormatSniffer.prototype.sniff = function () {
        return this._sniffFormat(); 
    };

    FormatSniffer.prototype._is_ogrinfo = function() {
        var match = this.regExes.ogrinfoExtent.exec( this.data.trim() );
        var extent = [];
        if( match ) {
            var pairs = match[1].split( ") - (" );
            for( var indx = 0; indx < pairs.length; indx ++ ){
                var coords = pairs[ indx ].trim().split(",");
                extent = ( extent.concat(  [ parseFloat(coords[0].trim()), parseFloat(coords[1].trim()) ] ) );
            }
        } 
        this.parse_type = "ogrinfo";
        return extent;
    };

    FormatSniffer.prototype._is_normal_bbox = function() {
        var match = this.regExes.bbox.exec( this.data.trim() );
        var extent = [];
        if( match ) {
            var bbox = match[1].split( "," );
            for( var indx = 0; indx < bbox.length; indx ++ ){
                var coord = bbox[ indx ].trim();
                extent = ( extent.concat(  [ parseFloat(coord) ] ) );
            }
        }
        this.parse_type = "bbox";
        return extent;
    };

    FormatSniffer.prototype._is_geojson = function() {
        try {
            // try JSON
            var json = JSON.parse( this.data );

            // try GeoJSON
            var parsed_data = new L.geoJson( json )

        } catch ( err ) {

            return null;

        }

        // check for multipart, unsupported for now
        parsed_data.getLayers().forEach( function( lyr, indx ){

            if( /multi/i.test( lyr.feature.geometry.type ) ) {
                throw new Error( "Multipart GeoJson is not supported yet" );
            }

        });

        this.parse_type = "geojson";
        return parsed_data;
    };

    FormatSniffer.prototype._is_wkt = function() {
        if( this.data === "" ){
            throw new Error( "empty -- nothing to parse" );
        } 

        try {
            var parsed_data = new Wkt.Wkt( this.data );
        } catch ( err ) {
            return null;
        }

        // check for multipart, unsupported for now
        if ( /multi/i.test( parsed_data.type ) ){
            throw new Error( "Multipart WKT is not supported yet" );
        }

        this.parse_type = "wkt";
        return parsed_data;
    };

    FormatSniffer.prototype._sniffFormat = function () {
        
        var parsed_data = null;
        var fail = false;
        try {
            var next = true;

            // try ogrinfo
            parsed_data = this._is_ogrinfo()
            if ( parsed_data.length > 0 ){
               next = false; 
            }

            // try normal bbox 
            if ( next ) {
                parsed_data = this._is_normal_bbox();
                if ( parsed_data.length > 0 ) next = false; 
            }

            // try GeoJSON
            if ( next ) {
                parsed_data = this._is_geojson();
                if ( parsed_data )  next = false;
            }

            // try WKT
            if ( next ) {
                parsed_data = this._is_wkt();
                if ( parsed_data ) next = false;
            }

            // no matches, throw error
            if ( next ) {
                fail = true;
                throw {
                    "name" :  "NoTypeMatchError" ,
                    "message" : "The data is not a recognized format:\n \
                    1. ogrinfo extent output\n \
                    2. bbox as (xMin,yMin,xMax,yMax )\n \
                    3. GeoJSON\n \
                    4. WKT\n\n "
                }
            }
           

        } catch(err) {

            alert( "Your paste is not parsable:\n"  + err.message  );
            fail = true;

        }

        // delegate to format handler
        if ( !fail ){

            this._formatHandler[ this.parse_type ].call( this, parsed_data );

        } 
        
        return ( fail ? false : true );
    };


    /*
    **  an object with functions as property names.
    **  if we need to add another format
    **  we can do so here as a property name
    **  to enforce reusability
    **
    **  to add different formats as L.FeatureGroup layer 
    **  so they work with L.Draw edit and delete options
    **  we fake passing event information
    **  and triggering draw:created for L.Draw
    */
    FormatSniffer.prototype._formatHandler = {


            // coerce event objects to work with L.Draw types
            coerce : function ( lyr, type_obj ) {

                    var event_obj = {
                        layer : lyr,
                        layerType : null,
                    } 

                    // coerce to L.Draw types
                    if ( /point/i.test( type_obj ) ){
                        event_obj.layerType = "marker";
                    }
                    else if( /linestring/i.test( type_obj ) ){
                        event_obj.layerType = "polyline";
                    }
                    else if ( /polygon/i.test( type_obj ) ){
                        event_obj.layerType = "polygon";
                    }
    
                    return event_obj;

            } ,


            get_leaflet_bounds : function( data ) {
                    /*
                    **  data comes in a extent ( xMin,yMin,xMax,yMax )
                    **  we need to swap lat/lng positions
                    **  because leaflet likes it hard
                    */
                    var sw = [ data[1], data[0] ];
                    var ne = [ data[3], data[2] ];
                    return new L.LatLngBounds( sw, ne );
            } ,

            wkt : function( data ) {

                    var lyr = data.construct[data.type].call( data );
                    var evt = this._formatHandler.coerce( lyr, data.type );

                    // call L.Draw.Feature.prototype._fireCreatedEvent
                    map.fire( 'draw:created', evt );

            } ,

            geojson : function( geojson_layer ) {

                    var all_layers = geojson_layer.getLayers();
                    for( var indx = 0; indx < all_layers.length; indx++ ) { 
                        var lyr = all_layers[indx];

                        var geom_type = lyr.feature.geometry.type;
                        var evt = this._formatHandler.coerce( lyr, geom_type );

                        // call L.Draw.Feature.prototype._fireCreatedEvent
                        map.fire( 'draw:created', evt );

                    }
            } ,

            ogrinfo : function( data ) {
                    var lBounds = this._formatHandler.get_leaflet_bounds( data );
                    // create a rectangle layer
                    var lyr = new L.Rectangle( lBounds );    
                    var evt = this._formatHandler.coerce( lyr, 'polygon' );

                    // call L.Draw.Feature.prototype._fireCreatedEvent
                    map.fire( 'draw:created', evt );
            } ,

            bbox : function( data ) {
                    var lBounds = this._formatHandler.get_leaflet_bounds( data );
                    // create a rectangle layer
                    var lyr = new L.Rectangle( lBounds );    
                    var evt = this._formatHandler.coerce( lyr, 'polygon' );

                    // call L.Draw.Feature.prototype._fireCreatedEvent
                    map.fire( 'draw:created', evt );
            }
        

    };

    return FormatSniffer; // return class def

})(); // end FormatSniffer


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
        var sniffer = FormatSniffer( { data :  $('.leaflet-sidebar textarea').val() } );
        var is_valid = sniffer.sniff();
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

