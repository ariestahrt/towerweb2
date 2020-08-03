var transform = ol.proj.getTransform('EPSG:3857', 'EPSG:4326');

var coordinates;
// {{x,y}}
var wp = [];

function saveCoordinates(){
    console.log(`geometry.getCoordinates :`);
    // console.log(coordinates);

    coordinates.forEach(element => {
        // console.log(element[0]);
        // console.log(element[1]);

        var converted = ol.proj.transform([element[0], element[1]], 'EPSG:3857', 'EPSG:4326');
        // console.log(converted);

        wp.push(converted);
    });;
}

var styleFunction = function(feature) {
    var geometry = feature.getGeometry();
    coordinates = geometry.getCoordinates();

    var styles = [
        // linestring
        new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#ffcc33',
                width: 2,
            }),
        })
    ];

    console.log("GEOMETRY: ");
    console.log(geometry);

    geometry.forEachSegment(function(start, end) {
        console.log(`END[0] : ${end[0]}`);
        console.log(`START[0] : ${start[0]}`);
        console.log(`END[1] : ${end[1]}`);
        console.log(`START[1] : ${start[1]}`);

        var dx = end[0] - start[0];
        var dy = end[1] - start[1];
        
        var rotation = Math.atan2(dy, dx);
        // arrows
        styles.push(
            new ol.style.Style({
                geometry: new ol.geom.Point(end),
                image: new ol.style.Icon({
                    src: 'static/images/arrow.png',
                    anchor: [0.75, 0.5],
                    rotateWithView: true,
                    rotation: -rotation,
                }),
            })
        );
    });

    return styles;
};

var source = new ol.source.Vector();
var vector = vector = new ol.layer.Vector({
    source: source,
    style: styleFunction,
});

// interaction
var drawInteraction = new ol.interaction.Draw({
  source: source,
  type: 'LineString',
})

var raster = new ol.layer.Tile({
    source: new ol.source.BingMaps({
        key: 'AnGHr16zmRWug0WA8mJKrMg5g6W4GejzGPBdP-wQ4Gqqw-yHNqsHmYPYh1VUOR1q',
        imagerySet: 'AerialWithLabels',
        // imagerySet: 'Road',
    })
});

var map = new ol.Map({
    target: 'map',
    renderer: 'canvas', // Force the renderer to be used
    layers: [raster, vector],
    view: new ol.View({
        center: ol.proj.transform([-122.3020636, 37.8732388], 'EPSG:4326', 'EPSG:3857'),
        zoom: 18
    })
});

// Create an image layer
var FUDGE = 0.0005;
var OFFSETX = 0.0001;
var OFFSETY = -0.0002;

function addImage(lat, lon, src) {
    var imageLayer = new ol.layer.Image({
        // opacity: 0.75,
        source: new ol.source.ImageStatic({
            attributions: [],
            url: src,
            // imageSize: [691, 541],
            projection: map.getView().getProjection(),
            imageExtent: ol.extent.applyTransform([lon - OFFSETX, lat - OFFSETY, lon - OFFSETX - FUDGE, lat - OFFSETY - FUDGE], ol.proj.getTransform("EPSG:4326", "EPSG:3857"))
        })
    });

    map.addLayer(imageLayer);
}

var overlayContent = document.createElement('div');
overlayContent.style.position = 'relative';
overlayContent.style.height = '80px';
overlayContent.style.width = '80px';
overlayContent.innerHTML = '' +
    '<div style="background: rgba(0, 220, 255, 1); opacity: 0.2; width: 100%; height: 100%; border-radius: 50%; position: absolute; top: 0; left: 0; box-sizing: border-box; border: 2px solid rgb(0, 100, 150);"></div>' +
    '<div style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; -webkit-transform: rotate(45deg);" class="heading"><div style="width: 0; height: 0; border-width: 10px; border-style: solid; border-color: red transparent transparent red; position: absolute; top: 0; left: 0;"></div></div>' +
    '<img src="static/images/solo.png" height="50" style="z-index: 100; position: absolute; top: 50%; left: 50%; margin-left: -43px; margin-top: -20px;">';

var overlay = new ol.Overlay({
    element: overlayContent,
    position: ol.proj.transform([0, 0], 'EPSG:4326', 'EPSG:3857'),
    positioning: 'center-center'
});

// var iconFeature = new ol.Overlay({
//   element = 
//   geometry: new ol.geom.Point(ol.proj.transform([0, 0], 'EPSG:4326', 'EPSG:3857')),
//   name: 'Solo',
// });

// iconFeature.setStyle(new ol.style.Style({
//   image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
//     anchor: [0.5, 46],
//     anchorXUnits: 'fraction',
//     anchorYUnits: 'pixels',
//     opacity: 1,
//     src: 'static/images/solo.png',
//     scale: .15,
//   }))
// }));

// var vectorLayer = new ol.layer.Vector({
//   source: new ol.source.Vector({
//     features: [ iconFeature ]
//   }),
// });

// map.addLayer(vectorLayer)

map.addOverlay(overlay);

// map.on('dblclick', function(evt) {
//   var coord = transform(evt.coordinate);
//   $.ajax({
//     method: 'PUT',
//     url: '/api/location',
//     contentType : 'application/json',
//     data: JSON.stringify({ lat: coord[1], lon: coord[0] }),
//   })
//   .done(function( msg ) {
//     console.log('sent data')
//   });
// });

$('#header-arm').on('click', function() {
    var altitude = prompt("Takeoff Altitude", 10);

    console.log(altitude);
    $.ajax({
            method: 'PUT',
            url: '/api/arm',
            contentType: 'application/json',
            data: JSON.stringify({
                arm: true,
                alt: altitude
            }),
        })
        .done(function(msg) {
            console.log('sent arming message')
        });
})

$('#header-mode-loiter').on('click', function() {
    $.ajax({
            method: 'PUT',
            url: '/api/mode',
            contentType: 'application/json',
            data: JSON.stringify({
                mode: 'LOITER'
            }),
        })
        .done(function(msg) {
            console.log('sent mode change')
        });
})

$('#header-mode-stabilize').on('click', function() {
    $.ajax({
            method: 'PUT',
            url: '/api/mode',
            contentType: 'application/json',
            data: JSON.stringify({
                mode: 'STABILIZE'
            }),
        })
        .done(function(msg) {
            console.log('sent mode change')
        });
})

$('#test-goto').on('click', function() {
    var i;
    var max = wp.length / 2;
    for (i = 0; i < max; i++) {
        wp.pop();
    }

    $.ajax({
            method: 'PUT',
            url: '/api/goto',
            contentType: 'application/json',
            data: JSON.stringify({
                waypoints: wp
            }),
        })
        .done(function(msg) {
            console.log('sent waypoints')
        });
})

$('#log-wp').on('click', function() {
    console.table(wp);
})

// Add drawing
$('#button-add-interaction').on('click', function() {
  if(document.getElementById("button-add-interaction").innerHTML == "Add interaction"){
    document.getElementById('button-add-interaction').innerHTML = "Done";
    map.addInteraction(drawInteraction);
  }else{
    document.getElementById('button-add-interaction').innerHTML = "Add interaction";
    saveCoordinates();
    map.removeInteraction(drawInteraction);
  }
})

var globmsg = null;

var source = new EventSource('/api/sse/state');
source.onmessage = function(event) {
    // console.log(event.data);
    var msg = JSON.parse(event.data);
    if (!globmsg) {
        console.log('FIRST', msg);
        $('body').removeClass('disabled')
        map.getView().setCenter(ol.proj.transform([msg.lon, msg.lat], 'EPSG:4326', 'EPSG:3857'));
    }
    globmsg = msg;

    $('#header-state').html('<b>Armed:</b> ' + msg.armed + '<br><b>Mode:</b> ' + msg.mode + '<br><b>Altitude:</b> ' + msg.alt.toFixed(2))
    $('#header-arm').prop('disabled', msg.armed);

    overlay.setPosition(ol.proj.transform([msg.lon, msg.lat], 'EPSG:4326', 'EPSG:3857'));
    $(overlay.getElement()).find('.heading').css('-webkit-transform', 'rotate(' + ((msg.heading) + 45) + 'deg)')

    if (document.getElementById('toggle-centermap').checked) {
        map.getView().setCenter(ol.proj.transform([msg.lon, msg.lat], 'EPSG:4326', 'EPSG:3857'));
    }
};

// Get clicked coordinate

map.on('click', function(evt) {
    console.info(evt.pixel);
    console.info(map.getPixelFromCoordinate(evt.coordinate));
    console.info(ol.proj.toLonLat(evt.coordinate));

    console.info(evt);
    var coords = ol.proj.toLonLat(evt.coordinate);
    
    var lat = coords[1];
    var lon = coords[0];
    var locTxt = "<b>Latitude</b>: " + lat + " <b>Longitude</b>: " + lon;
    // coords is a div in HTML below the map to display
    document.getElementById('coordinate-ping').innerHTML = locTxt;
});
