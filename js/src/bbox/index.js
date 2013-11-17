window.ZeroClipboard = require('zeroclipboard');
window.FormatSniffer = require('../format_sniffer/sniffer.js');

(function( def ) { // execute immediately

    if( typeof module !== 'undefined' &&
        typeof module.exports !== 'undefined' ){
        module.exports = def(); // class instance returned
    }
    else if ( typeof window !== 'undefined' ){
        window.Bbox = def(); // class instance returned
    }



})( function() { // def

    var BboxClass = function( options ) {
        
        options || ( options = {} );
        if( !this || !( this instanceof BboxClass ) ){
            return new BboxClass( options );
        }

        // this is exposed in window.map
        // this.map

        this.rsidebar = null;
        this.lsidebar = null;
        this.drawControl = null; 
        this.drawnItems = null;

        // Where we keep the big list of proj defs from the server
        this.proj4defs = null;

        // Where we keep the proj objects we are using in this session
        // with a hack so we can keep this as a nodejs module for now
        if ( typeof L !== 'undefined' ) {
            this.projdefs = {"4326":L.CRS.EPSG4326, "3857":L.CRS.EPSG3857};
        }

        this.currentproj = "3857";

    };

    BboxClass.prototype.addLayer = function(layer, name, zIndex, on) {
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


    BboxClass.prototype.formatBounds = function(bounds, proj, tool) {
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
            var proj_to_use = null;
            if (typeof(Bbox.projdefs[proj]) !== 'undefined') {
                // we have it already, then grab it and use it...
                proj_to_use = Bbox.projdefs[proj];
            } else {
                // We have not used this one yet... make it and store it...
                Bbox.projdefs[proj] = new L.Proj.CRS(proj, Bbox.proj4defs[proj][1]);
                proj_to_use = Bbox.projdefs[proj];
            }
            southwest = proj_to_use.project(southwest)
            northeast = proj_to_use.project(northeast)
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
    };

    BboxClass.prototype.formatPoint = function(point, proj, tool) {
        var formattedPoint = '';
        if (proj == '4326') {
            x = point.lng.toFixed(6);
            y = point.lat.toFixed(6);
        } else {
            var proj_to_use = null;
            if (typeof(Bbox.projdefs[proj]) !== 'undefined') {
                // we have it already, then grab it and use it...
                proj_to_use = Bbox.projdefs[proj];
            } else {
                // We have not used this one yet... make it and store it...
                Bbox.projdefs[proj] = new L.Proj.CRS(proj, Bbox.proj4defs[proj][1]);
                proj_to_use = Bbox.projdefs[proj];
            }
            point = proj_to_use.project(point)
            x = point.x.toFixed(4);
            y = point.y.toFixed(4);
        }
        if (tool === 'gdal') {
            formattedBounds = x+','+y;
        } else {
            formattedBounds = x+' '+y;
        }
        return formattedBounds
    };

    BboxClass.prototype.onload_callback = function() {

        // Have to init the projection input box as it is used to format the initial values
        $( "#projection" ).val(Bbox.currentproj);

        // set globally
        window.map = L.mapbox.map('map', 'reprojected.g9on3k93').setView([0, 0], 3);

        Bbox.rsidebar = L.control.sidebar('rsidebar', {
            position: 'right'
        });
        
        map.addControl(Bbox.rsidebar);

        Bbox.lsidebar = L.control.sidebar('lsidebar', {
            position: 'left'
        });
        
        map.addControl(Bbox.lsidebar);

        // Add in a crosshair for the map
        var crosshairIcon = L.icon({
            iconUrl: 'images/crosshair.png',
            iconSize:     [20, 20], // size of the icon
            iconAnchor:   [10, 10], // point of the icon which will correspond to marker's location
        });
        crosshair = new L.marker(map.getCenter(), {icon: crosshairIcon, clickable:false});
        crosshair.addTo(map);
        
        // Initialize the FeatureGroup to store editable layers
        Bbox.drawnItems = new L.FeatureGroup();
        map.addLayer(Bbox.drawnItems);
        
        // Initialize the draw control and pass it the FeatureGroup of editable layers
        Bbox.drawControl = new L.Control.Draw({
            edit: {
                featureGroup: Bbox.drawnItems
            }
        });
        map.addControl(Bbox.drawControl);

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
            Bbox.drawnItems.addLayer(e.layer);
            bounds.setBounds(Bbox.drawnItems.getBounds())
            $('#boxbounds').text(Bbox.formatBounds(bounds.getBounds(),'4326','gdal'));
            $('#boxboundsmerc').text(Bbox.formatBounds(bounds.getBounds(),Bbox.currentproj,'gdal'));
            if (!e.geojson &&
                !((Bbox.drawnItems.getLayers().length == 1) && (Bbox.drawnItems.getLayers()[0] instanceof L.Marker))) {
                map.fitBounds(bounds.getBounds());
            } else {
                if ((Bbox.drawnItems.getLayers().length == 1) && (Bbox.drawnItems.getLayers()[0] instanceof L.Marker)) {
                    map.panTo(Bbox.drawnItems.getLayers()[0].getLatLng());
                }
            }
        });
        
        map.on('draw:deleted', function (e) {
            e.layers.eachLayer(function (l) {
                Bbox.drawnItems.removeLayer(l);
            });
            if (Bbox.drawnItems.getLayers().length > 0 &&
                !((Bbox.drawnItems.getLayers().length == 1) && (Bbox.drawnItems.getLayers()[0] instanceof L.Marker))) {
                bounds.setBounds(Bbox.drawnItems.getBounds())
                $('#boxbounds').text(Bbox.formatBounds(bounds.getBounds(),'4326','gdal'));
                $('#boxboundsmerc').text(Bbox.formatBounds(bounds.getBounds(),Bbox.currentproj,'gdal'));
                map.fitBounds(bounds.getBounds());
            } else {
                bounds.setBounds(new L.LatLngBounds([0.0,0.0],[0.0,0.0]));
                $('#boxbounds').text(Bbox.formatBounds(bounds.getBounds(),'4326','gdal'));
                $('#boxboundsmerc').text(Bbox.formatBounds(bounds.getBounds(),Bbox.currentproj,'gdal'));
                if (Bbox.drawnItems.getLayers().length == 1) {
                    map.panTo(Bbox.drawnItems.getLayers()[0].getLatLng());
                }
            }
        });
        
        map.on('draw:edited', function (e) {
            bounds.setBounds(Bbox.drawnItems.getBounds())
            $('#boxbounds').text(Bbox.formatBounds(bounds.getBounds(),'4326','gdal'));
            $('#boxboundsmerc').text(Bbox.formatBounds(bounds.getBounds(),Bbox.currentproj,'gdal'));
            map.fitBounds(bounds.getBounds());
        });
        
        $('#zoomlevel').text(map.getZoom().toString());
        $('#mapbounds').text(Bbox.formatBounds(map.getBounds(),'4326','gdal'));
        $('#mapboundsmerc').text(Bbox.formatBounds(map.getBounds(),Bbox.currentproj,'gdal'));
        $('#center').text(Bbox.formatPoint(map.getCenter(),'4326','gdal'));
        $('#centermerc').text(Bbox.formatPoint(map.getCenter(),Bbox.currentproj,'gdal'));
        $('#boxbounds').text(Bbox.formatBounds(bounds.getBounds(),'4326','gdal'));
        $('#boxboundsmerc').text(Bbox.formatBounds(bounds.getBounds(),Bbox.currentproj,'gdal'));
        $('#mousepos').text(Bbox.formatPoint(new L.LatLng(0, 0),'4326','gdal'));
        $('#mouseposmerc').text(Bbox.formatPoint(new L.LatLng(0, 0),Bbox.currentproj,'gdal'));

        map.on('move', function(e) {
            crosshair.setLatLng(map.getCenter());
        });

        map.on('mousemove', function(e) {
            $('#mousepos').text(Bbox.formatPoint(e.latlng,'4326','gdal'));
            $('#mouseposmerc').text(Bbox.formatPoint(e.latlng,Bbox.currentproj,'gdal'));
            $('#mapbounds').text(Bbox.formatBounds(map.getBounds(),'4326','gdal'));
            $('#mapboundsmerc').text(Bbox.formatBounds(map.getBounds(),Bbox.currentproj,'gdal'));
            $('#center').text(Bbox.formatPoint(map.getCenter(),'4326','gdal'));
            $('#centermerc').text(Bbox.formatPoint(map.getCenter(),Bbox.currentproj,'gdal'));
        });
        map.on('zoomend', function(e) {
            $('#zoomlevel').text(map.getZoom().toString());
            $('#mapbounds').text(Bbox.formatBounds(map.getBounds(),'4326','gdal'));
            $('#mapboundsmerc').text(Bbox.formatBounds(map.getBounds(),Bbox.currentproj,'gdal'));
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
            Bbox.rsidebar.show();
        });

        // handle geolocation click events
        $('#geolocation').on( 'click' , function(){
            map.locate({setView: true, maxZoom: 8});
        });

        $('button#add').on( 'click', function(evt){
            var sniffer = FormatSniffer( { data :  $('.leaflet-sidebar textarea').val() } );
            var is_valid = sniffer.sniff();
            if (is_valid) {
                Bbox.rsidebar.hide();
                map.fitBounds(bounds.getBounds());
            }
        });
        $('button#clear').on( 'click', function(evt){
            $('.leaflet-sidebar textarea').val('');
        });

        // Add in a layer to overlay the tile bounds of the google grid
        var tiles = new L.tileLayer('/images/tile.png', {});
        Bbox.addLayer(tiles, 'Tile Grid', 10, false)

        // Test getting the proj strings
        $.getJSON( "proj/proj4defs.json").done(function( data ) {
            Bbox.proj4defs = data;
            var autocompdata = [];
            $.each( data, function( key, val ) {
                autocompdata.push({label:key+'-'+val[0],value:key})
            });
            $( "#projection" ).autocomplete({
                source: autocompdata,
                minLength: 3,
                select: function( event, ui ) {
                    // Update all the proj windows
                    $('#projlabel').text('EPSG:'+ ui.item.value +' - ' + Bbox.proj4defs[ui.item.value][0]);
                    Bbox.currentproj = ui.item.value;
                    $('#boxboundsmerc').text(Bbox.formatBounds(bounds.getBounds(),Bbox.currentproj,'gdal'));
                    $('#mouseposmerc').text(Bbox.formatPoint(new L.LatLng(0, 0),Bbox.currentproj,'gdal'));
                    $('#mapboundsmerc').text(Bbox.formatBounds(map.getBounds(),Bbox.currentproj,'gdal'));
                    $('#centermerc').text(Bbox.formatPoint(map.getCenter(),Bbox.currentproj,'gdal'));
                }
            }).val('3857');
            // Set labels for output... left always 4326, right is proj selection
            $('#wgslabel').text('EPSG:4326 - ' + Bbox.proj4defs['4326'][0]);
            $('#projlabel').text('EPSG:3857 - ' + Bbox.proj4defs['3857'][0]);
        }).fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ", " + error;
            console.log( "Request Failed: " + err );
        });
    };

    return new BboxClass();

});

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
if( typeof L !== 'undefined' ){
    L.Rectangle.prototype.setBounds = function (latLngBounds) {

        this.setLatLngs(this._boundsToLatLngs(latLngBounds));
        this.fire( 'bounds-set' );
    }
}
