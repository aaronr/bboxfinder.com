bboxfinder.com
==============

Helper page for finding bbox values from a map to help with interaction with tools like gdal, leaflet, openlayers, etc.



### Dependency Description

0. We have dependencies that can be installed with npm, but they do not support being imported ( required ) in nodejs framework and need to be in global client scope

    leaflet
    leaflet-draw
    mapbox.js
    proj4leaflet

1. We have dependencies that can be installed with npm AND they can be imported ( required ) in nodejs framework

    proj4 
    zeroclipboard

2. We have dependencies that cannot be installed with npm, but they can be imported ( required ) in nodejs framework because we wrote them that way ( Bbox )

    bbox
    tests
    format_sniffer

3. We have dependencies that cannot be installed with npm that have to be put in global client scope ( jQuery )

    jQuery
    jQuery-ui
    leaflet-sidebar
    wkt.parser ( only be cause it requires leaflet and feels better like this )
    

4. Non-require libraries such as:
    `jQuery.v1.9.1 and jQueryUI.v.1.10.3` and  `Leaflet, Leaflet-draw and Leaflet-sidebar' will be built to public/dist/libs.js in minified form

5. Node require libraries ( including our app modules) will be built to public/dist/site.js in minified/uglified form

6. The Makefile shows the workflow

7. forever.js can be used in --watch mode for development




### Lay of the JS Land

NodeJS modules located in node_modules include the code that helps us run node as a server, the command-line tools, dependecies
( such as Leaflet ) that we will include in our cleint-side code. Look at package.json to see what these are


Our application bbox site code is stored in require-type modules in js/src. js/src/index.js which loads
all the requirements we need for the application in one fell swoop.




### Installing NodeJS and running development 

1. You can still use Python server since all libraries
