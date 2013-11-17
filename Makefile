BROWSERIFY = node_modules/.bin/browserify
UGLIFY = node_modules/.bin/uglifyjs
LIBS = $(shell find js/libs -type f -name '*.js')

all:  dev/lib.js dev/site.js prod/lib.js prod/site.js

#
#  unminified
#
dev/lib.js:
	cat js/libs/jquery-1.9.1.min.js \
		js/libs/jquery-ui-1.10.3.custom.min.js \
		node_modules/leaflet/dist/leaflet-src.js \
		node_modules/leaflet-draw/dist/leaflet.draw-src.js \
		node_modules/proj4leaflet/src/proj4leaflet.js \
		node_modules/mapbox.js/mapbox.js \
		js/libs/wkt.parser.js \
		js/libs/leaflet.sidebar.js > js/dist/dev/lib.js


dev/site.js:
	$(BROWSERIFY) -e js/src/index.js -o js/dist/dev/site.js


#
#  minified
#
prod/lib.js: dev/lib.js
	$(UGLIFY) js/dist/dev/lib.js > js/dist/prod/lib.js

prod/site.js: dev/site.js
	$(UGLIFY) js/dist/dev/site.js > js/dist/prod/site.js

clean:
	rm -f js/dist/dev/* 
	rm -f js/dist/prod/*

