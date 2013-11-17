// global dep leaflet
// global dep Wkt

(function( def ) { // execute immediately


    if ( typeof module !== 'undefined' && 
         typeof module.exports !== 'undefined' ) {

        module.exports = def(); // return class def

    }


})(function () { // def

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
            bbox :  /^\(([\s|\-|0-9]*\.[0-9]*,[\s|\-|0-9]*\.[0-9]*,[\s|\-|0-9]*\.[0-9]*,[\s|\-|0-9]*\.[0-9|\s]*)\)$/
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
/* 
**  sorry, this block needs to be left aligned
**  to make the alert more readable
**  which means, we probably shouldn't use alerts
*/ 
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

            this._formatHandler[ this.parse_type ].call( this._formatHandler, parsed_data );

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

        reduce_layers : function( lyr ) {
            var lyr_parts = []; 
                if (  typeof lyr[ 'getLayers' ] === 'undefined' ) {  
            return [ lyr ];
            } 
            else {
            var all_layers = lyr.getLayers();
            for( var i = 0; i < all_layers.length; i++ ){
                lyr_parts = lyr_parts.concat( this.reduce_layers( all_layers[i] ) );    
            }
            }
            return lyr_parts;
        } ,

            get_leaflet_bounds : function( data ) {
                    /*
                    **  data comes in an extent ( xMin,yMin,xMax,yMax )
                    **  we need to swap lat/lng positions
                    **  because leaflet likes it hard
                    */
                    var sw = [ data[1], data[0] ];
                    var ne = [ data[3], data[2] ];
                    return new L.LatLngBounds( sw, ne );
            } ,

            wkt : function( data ) {

                    var wkt_layer = data.construct[data.type].call( data );
                    var all_layers = this.reduce_layers( wkt_layer );
                    for( var indx = 0; indx < all_layers.length; indx++ ) { 
                        var lyr = all_layers[indx];
                        var evt = this.coerce( lyr, data.type );

                        // call L.Draw.Feature.prototype._fireCreatedEvent
                        map.fire( 'draw:created', evt );
                    }

            } ,

            geojson : function( geojson_layer ) {

                    var all_layers = this.reduce_layers( geojson_layer );
                    for( var indx = 0; indx < all_layers.length; indx++ ) { 
                        var lyr = all_layers[indx];

                        var geom_type = geojson_layer.getLayers()[0].feature.geometry.type;
                        var evt = this.coerce( lyr, geom_type );

                        // call L.Draw.Feature.prototype._fireCreatedEvent
                        map.fire( 'draw:created', evt );
                    }
            } ,

            ogrinfo : function( data ) {
                    var lBounds = this.get_leaflet_bounds( data );
                    // create a rectangle layer
                    var lyr = new L.Rectangle( lBounds );    
                    var evt = this.coerce( lyr, 'polygon' );

                    // call L.Draw.Feature.prototype._fireCreatedEvent
                    map.fire( 'draw:created', evt );
            } ,

            bbox : function( data ) {
                    var lBounds = this.get_leaflet_bounds( data );
                    // create a rectangle layer
                    var lyr = new L.Rectangle( lBounds );    
                    var evt = this.coerce( lyr, 'polygon' );

                    // call L.Draw.Feature.prototype._fireCreatedEvent
                    map.fire( 'draw:created', evt );
            }
        

    };

    return FormatSniffer; // return class def

}); // end FormatSniffer

