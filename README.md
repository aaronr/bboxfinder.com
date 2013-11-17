bboxfinder.com
==============

Helper page for finding bbox values from a map to help with interaction with tools like gdal, leaflet, openlayers, etc.



### Dependency Description

0. We have dependencies that *cannot* be installed with npm that have to be put in global client scope. These include:

    jQuery
    jQuery-ui

1. We have dependencies that *cannot* be installed with npm, but they can be imported ( required ) in browserify framework because we wrote them that way. These include:

    bbox // main app
    leaflet.sidebar.js
    format_sniffer
    wkt
    tests

2. We have dependencies that *can* be installed with npm, but they do not support being imported ( required ) in with browserify framework because the author was not thinking. This includes:

    leaflet-draw

3. We have dependencies that can be installed with npm AND they can be imported ( required ) in nodejs framework

    zeroclipboard

4. Non-require libraries such as:
    `jQuery.v1.9.1 and jQueryUI.v.1.10.3` will be built to js/dist/<env>/libs.js in minified form

5. NodeJS required libraries ( including our app modules) will be built to js/dist/<env>/site.js in both minified and src form depending on <env>

6. The Makefile shows the workflow logic


### Installing NodeJS and Running Dev Server

0. Install npm  ( package manager for node )

1. Install n ( version manage for node ). This will let you upgrade node once your version is out of date. Details -> http://davidwalsh.name/upgrade-nodejs

2. Install node dependencies `npm install`. This will look at the package.json file for dependencies to download

3. Run `make`  to build the js/dist/<env>/files

4. Make sure to edit index.html and add the appropriate <env> ( prod or dev ) path for files depending if you want minified or source in the browser

5. Run Python server dev server: `./serve.sh`

6. If you want to --watch your development files while developing ( those in js/src/ ), then run `./watcher.sh` and it will rebuild on every add/remove or file edit


