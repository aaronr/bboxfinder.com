BROWSERIFY = node_modules/.bin/browserify
UGLIFY = node_modules/.bin/uglifyjs
LIBS = $(shell find js/libs -type f -name '*.js')

all:  dev/lib.js dev/site.js dev/leaflet-draw.js prod/lib.js prod/site.js

development: dev/site.js dev/leaflet-draw.js prod/site.js

#
#
#  SOURCE BUILD
#
#

dev/lib.js:
	cat js/libs/jquery-1.9.1.min.js \
		js/libs/jquery-ui-1.10.3.custom.min.js > js/dist/dev/lib.js

dev/site.js:
	$(BROWSERIFY) -e js/src/index.js -o js/dist/dev/site.js

#  leaflet-draw from npm does not use require() WTF?, so append it here
dev/leaflet-draw.js:
	cat node_modules/leaflet-draw/dist/leaflet.draw-src.js >> js/dist/dev/site.js


#
#
#  MINIFIED BUILD 
#
#
prod/lib.js: dev/lib.js
	$(UGLIFY) js/dist/dev/lib.js > js/dist/prod/lib.js

prod/site.js: dev/site.js
	$(UGLIFY) js/dist/dev/site.js > js/dist/prod/site.js

clean:
	rm -f js/dist/dev/* 
	rm -f js/dist/prod/*

