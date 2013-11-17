var TEST_DATA = require("./testdata.json");
var Bbox = require("../bbox");

(function( definition ) { // execute immeidately
	
    /*
    **
    **  // TEST_DATA is held as attr ref
    **  example run syntax fromm console --> BBOX_T().setup(); // that's it
    **
    */

	if ( typeof module !== 'undefined' &&
	     typeof module.exports !== 'undefined' ) {
		module.exports = definition();
	}
	else if ( typeof window === "object" ) {
		window.BBOX_T = definition();
	}

})( function() {
	'use strict';
	
	/*
	**
	**  constructor
	**
	*/
	var TestRunner = function( options ) {
		options || ( options = {} );

		if( !this || !(this instanceof TestRunner )){
			return new TestRunner( options );
		}

		this.test_url = options.url || "";

        this.test_data = TEST_DATA;

	};

	/*
	** 
	**  functions
	**
	*/
	TestRunner.prototype.setup = function() {

	    this.run_this_mother( this.test_data );

	};
	
	TestRunner.prototype.single_setup = function() {
		this.get_layer_count();
	};

	TestRunner.prototype.tear_down = function() {
		if( this._draw_delete_handler ){
			this._draw_delete_handler.off('draw:deleted');
		}
	};

	TestRunner.prototype.run_this_mother = function( json_data ) {
		for( var key in json_data ){
			console.log( "[ RUNNING ]: test " + json_data[key]['type'] + "->" + "simple=" + json_data[key]['simple'] );
			var data = json_data[key]['data']; 	
			if( json_data[key]['type'] === 'geojson' ) {
				data = JSON.stringify( data );
			}
			
			/*
			**  run different tests
			**  the context here is jQuery, so change
			**  to reference the instance
			*/
			this.single_setup();

			this.test_parsing( data, json_data );
			this.test_add2map( json_data );
			this.test_deletable( json_data );

			this.tear_down();
		}
	};

	TestRunner.prototype.test_deletable = function(identifier){ // TODO: this needs work
		var toolbar = null;
		// get the right toolbar, depending on attributes
		for( var key in Bbox.drawControl._toolbars ){
			var tbar = Bbox.drawControl._toolbars[key];
			if ( !(tbar instanceof L.EditToolbar ) ){ 
				continue;	
			}

			toolbar = tbar; // set the right one;
		}

		// create delete handler that makes sure things are deleted
	    	this._draw_delete_handler = map.on('draw:deleted', function (e) {
			try {
				e.layers.eachLayer(function (l) {
				    Bbox.drawnItems.removeLayer(l);
				});
				console.warn( "[ PASSED ]: test_deletable" );
			}
			catch ( err ) {
				console.error( "[ DELETE TEST FAIL ]: ", err.message, identifier );
			}
		});


        // loop through this toolbars featureGroup, delete layers
        if ( !toolbar._activeMode ) {
            toolbar._modes['remove'].button.click(); // enable deletable
        }
        for( var indx in toolbar.options['featureGroup']._layers ) {
            try {
                var lyr = toolbar.options['featureGroup']._layers[indx];
                lyr.fire( 'click' ); // triggers delete
            }
            catch ( err ){
                console.error( "[ DELETE TEST FAIL ]: ", err.message, identifier );
            }
        }
        // WTF?
        $('a[title="Save changes."]')[0].click();  // disable deletable

	};

	TestRunner.prototype.test_add2map = function(identifier){
		var current_num = Object.keys( map._layers ).length;
		if( current_num <= this.num_layers_before_parse ){
			console.error( "[ ADD2MAP TEST FAIL ]: ", identifier );
		}
		else {
			console.warn( "[ PASSED ]: test_add2map" );
		}
	};

	TestRunner.prototype.get_layer_count = function(){
		this.num_layers_before_parse = Object.keys( map._layers ).length;
	};

	TestRunner.prototype.test_parsing = function( data, identifier ){
		var is_valid = FormatSniffer( { data : data } ).sniff();
		if ( !is_valid ) {
			console.error( "[ PARSE TEST FAIL ]: ", identifier );
		}
		else {
			console.warn( "[ PASSED ]: test_parsing" );
		}
	};

	return TestRunner; // return class def

});
