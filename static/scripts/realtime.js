// ---

var PointerInteraction = ol.interaction.Pointer;
var Feature = ol.Feature;
var Point = ol.geom.Point;
var VectorLayer = ol.layer.Vector;
var VectorSource = ol.source.Vector;

var Icon = ol.style.Icon;
var Fill = ol.style.Fill;
var Stroke = ol.style.Stroke;
var Style = ol.style.Style;

var drawMission = false;
var missionPoints = [];

var savedMissionPoints = [];

// ----

// --- Add row function --- //

function InsertRow(lon, lat){
  var markup = "<tr><td><input type=\"checkbox\" name=\"record\"></td><td></td><td></td><td></td><td></td><td></td><td><input type=\"text\" class=\"lat-textbox\" value=\""+lat+"\" placeholder=\"\" oninput=\"latChanged(this)\"></td><td><input type=\"text\" class=\"lon-textbox\" value=\""+lon+"\" placeholder=\"\" oninput=\"lonChanged(this)\"></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>";
  $("table tbody").append(markup);
}
// --- End of Add row function --- //


// -- DRAG FEATURE -- //

var Drag = /*@__PURE__*/ (function(PointerInteraction) {
  function Drag() {
    PointerInteraction.call(this, {
      handleDownEvent: handleDownEvent,
      handleDragEvent: handleDragEvent,
      handleMoveEvent: handleMoveEvent,
      handleUpEvent: handleUpEvent,
    });

    /**
      * @type {import("../src/ol/coordinate.js").Coordinate}
      * @private
      */
    this.coordinate_ = null;

    /**
      * @type {string|undefined}
      * @private
      */
    this.cursor_ = 'pointer';

    /**
      * @type {Feature}
      * @private
      */
    this.feature_ = null;

    /**
      * @type {string|undefined}
      * @private
      */
    this.previousCursor_ = undefined;

    /**
      * @type {int}
      * @private
      */
     this.featureIndex_ = null;
  }

  if (PointerInteraction) Drag.__proto__ = PointerInteraction;
  Drag.prototype = Object.create(PointerInteraction && PointerInteraction.prototype);
  Drag.prototype.constructor = Drag;

  return Drag;
}(PointerInteraction));

function handleDownEvent(evt) {
  console.log("handleDownEvent");
  var map = evt.map;

  var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
    return feature;
  });

  if (feature) {
    this.coordinate_ = evt.coordinate;
    this.feature_ = feature;
    
    // Identify feature
    console.log("Feature : ");
    console.log(this.feature_);
  
    var featureKeys = JSON.parse(JSON.stringify(this.feature_));
    var i;

    for(i=0; i<savedMissionPoints.length; i++){
      if(savedMissionPoints[i][0] == featureKeys.ol_uid){
        this.featureIndex_ = i;
        console.log("featureIndex_ = " + this.featureIndex_);
      }
    }
  }
  return !!feature;
}

/**
  * @param {import("../src/ol/MapBrowserEvent.js").default} evt Map browser event.
  */
function handleDragEvent(evt) {
  console.log("handleDragEvent");

  var deltaX = evt.coordinate[0] - this.coordinate_[0];
  var deltaY = evt.coordinate[1] - this.coordinate_[1];

  var geometry = this.feature_.getGeometry();
  geometry.translate(deltaX, deltaY);

  this.coordinate_[0] = evt.coordinate[0];
  this.coordinate_[1] = evt.coordinate[1];

  var converted = convertToLonLat(geometry.getCoordinates()[0], geometry.getCoordinates()[1]);
  
  drawMissionLine();

  if(this.featureIndex_ != null){
    savedMissionPoints[this.featureIndex_] = [savedMissionPoints[this.featureIndex_][0], converted[0], converted[1]];
    UpdateTable(this.featureIndex_, converted[0], converted[1]);
  }

}

/**
  * @param {import("../src/ol/MapBrowserEvent.js").default} evt Event.
  */
function handleMoveEvent(evt) {
  // console.log("handleMoveEvent");
  if (this.cursor_) {


    var coords = ol.proj.toLonLat(evt.coordinate);

    var lat = coords[1];
    var lon = coords[0];
  
    document.getElementById('coordinate-ping').innerHTML = "<b>Latitude</b>: " + lat + " <b>Longitude</b>: " + lon;;

    var map = evt.map;
    var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
      return feature;
    });
    var element = evt.map.getTargetElement();
    if (feature) {
      if (element.style.cursor != this.cursor_) {
        this.previousCursor_ = element.style.cursor;
        element.style.cursor = this.cursor_;
      }
    } else if (this.previousCursor_ !== undefined) {
      element.style.cursor = this.previousCursor_;
      this.previousCursor_ = undefined;
    }
  }
}

/**
  * @return {boolean} `false` to stop the drag sequence.
  */
function handleUpEvent() {
  console.log("handleUpEvent");
  this.coordinate_ = null;
  this.feature_ = null;
  this.featureIndex_ = null;
  return false;
}

// -- END OF DRAG FEATURE -- //

// -- YELLOW POINT LAYER -- //

var PLSource = new ol.source.Vector({ features: [] });

var PointLayer = new ol.layer.Vector({
  source: PLSource,
  style: new Style({
    image: new Icon({
      anchor: [0.5, 46],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      opacity: 0.95,
      src: 'static/images/point.png',
    }),
    stroke: new Stroke({
      width: 3,
      color: [255, 0, 0, 1],
    }),
    fill: new Fill({
      color: [0, 0, 255, 0.6],
    }),
  }),
});

// -- END OF YELLOW POINT LAYER -- //

// -- GREEN POINT HOME LAYER -- //

var PointHomeFeature = new Feature(new Point(ol.proj.transform([149.16522721779103, -35.363376928881884], 'EPSG:4326', 'EPSG:3857')));
var PointHomeLayerSource = new ol.source.Vector({ features: [PointHomeFeature] });

var PointHomeLayer = new ol.layer.Vector({
  source: PointHomeLayerSource,
  style: new Style({
    image: new Icon({
      anchor: [0.5, 46],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      opacity: 0.95,
      src: 'static/images/home.png',
    }),
    stroke: new Stroke({
      width: 3,
      color: [255, 0, 0, 1],
    }),
    fill: new Fill({
      color: [0, 0, 255, 0.6],
    }),
  }),
})

// -- END OF GREEN POINT HOME LAYER -- //


// -- PUSH PointLayer source -- //

function addPointLayerSource(lon, lat){
  var newFeature = new Feature(new Point(ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857')));
  // console.log(JSON.parse(JSON.stringify(newFeature)).ol_uid);
  PLSource.addFeature(newFeature);

  savedMissionPoints.push([JSON.parse(JSON.stringify(newFeature)).ol_uid, lon, lat]);
  // return JSON.parse(JSON.stringify(newFeature)).ol_uid;
}

// -- END OF PUSH PointLayer source -- //

// -- DRAW LINE FROM ADD-MISSION BUTTON
var missionvectorLineSource = new ol.source.Vector({});
var missionvectorLineLayer = new ol.layer.Vector({
  source: missionvectorLineSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: '#00FF00',
      weight: 4
    }),
    stroke: new ol.style.Stroke({
      color: '#00FF00',
      width: 2
    })
  })
});

// -- TRANSFORM FUNCTION -- //

function convertToLonLat(x, y){
  return ol.proj.transform([x, y], 'EPSG:3857', 'EPSG:4326');
}

function convertFromLongLat(long, lat) {
  return ol.proj.transform([long, lat], 'EPSG:4326', 'EPSG:3857')
}

// -- TRANSFORM FUNCTION -- //

function drawMissionLine(){
  // console.log("drawMissionLine");
  var missionPoints_ = [];

  savedMissionPoints.forEach(function(item){
    missionPoints_.push([item[1], item[2]]);
  });

  // Push home point in front
  var convertedHomePoints = ol.proj.transform([PointHomeFeature.getGeometry().getCoordinates()[0], PointHomeFeature.getGeometry().getCoordinates()[1]], 'EPSG:3857', 'EPSG:4326');
  missionPoints_.unshift([convertedHomePoints[0], convertedHomePoints[1]]);
  // then push home point in back
  missionPoints_.push([convertedHomePoints[0], convertedHomePoints[1]]);

  for (var i = 0; i < missionPoints_.length; i++) {
    missionPoints_[i] = ol.proj.transform(missionPoints_[i], 'EPSG:4326', 'EPSG:3857');
  }
  
  var missionfeatureLine = new ol.Feature({
    geometry: new ol.geom.LineString(missionPoints_)
  });

  missionvectorLineSource.clear();
  missionvectorLineSource.addFeature(missionfeatureLine);  
}

// -- DRAW LINE FROM ADD-MISSION BUTTON

// -- REALTIME TABLE LON-LAT

function UpdateTable(rowIndex, lon, lat){
  var lattextbox = document.getElementsByClassName("lat-textbox");
  var lontextbox = document.getElementsByClassName("lon-textbox");
  // console.log(lattextbox);
  lattextbox[rowIndex].value = lat;
  lontextbox[rowIndex].value = lon;
  // alert(lattextbox[0].value);
}

// -- END OF REALTIME TABLE LON-LAT

// -- INPUT LON-LAT TEXTCHANGED -- //

function latChanged(input){

  var index = input.parentElement.parentElement.rowIndex - 1;
  var ol_uid = savedMissionPoints[index][0];

  var lat=input.value;
  var lon=savedMissionPoints[index][1];

  savedMissionPoints[index] = [ol_uid, lon, lat];

  var coordinates = convertFromLongLat(lon,lat);

  PLSource.forEachFeature(function(feature){

    var featureKeys = JSON.parse(JSON.stringify(feature));

    if(ol_uid == featureKeys.ol_uid){
      feature.getGeometry().setCoordinates(coordinates);
    }
  });

  drawMissionLine();
}

function lonChanged(input){

  var index = input.parentElement.parentElement.rowIndex - 1;
  var ol_uid = savedMissionPoints[index][0];

  var lat=savedMissionPoints[index][2];
  var lon=input.value;

  savedMissionPoints[index] = [ol_uid, lon, lon];

  var coordinates = convertFromLongLat(lon,lat);

  PLSource.forEachFeature(function(feature){

    var featureKeys = JSON.parse(JSON.stringify(feature));

    if(ol_uid == featureKeys.ol_uid){
      feature.getGeometry().setCoordinates(coordinates);
    }
  });

  drawMissionLine();
}


// -- END OF INPUT LON-LAT TEXTCHANGED -- //

// Raster = BingMap
var raster = new ol.layer.Tile({
  source: new ol.source.BingMaps({
    key: 'AnGHr16zmRWug0WA8mJKrMg5g6W4GejzGPBdP-wQ4Gqqw-yHNqsHmYPYh1VUOR1q',
    imagerySet: 'AerialWithLabels',
    // imagerySet: 'Road',
  })
});

// -- THE MAP

var map = new ol.Map({
  interactions: ol.interaction.defaults().extend([new Drag()]),
  target: 'map',
  renderer: 'canvas', // Force the renderer to be used
  layers: [raster, missionvectorLineLayer, PointLayer, PointHomeLayer],
  view: new ol.View({
    center: ol.proj.transform([-122.3020636, 37.8732388], 'EPSG:4326', 'EPSG:3857'),
    zoom: 18
  })
});

// -- END OF THE MAP

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

// -- VEHICLE OVERLAY -- //

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

// map.addOverlay(overlay);

// -- END OF VEHICLE OVERLAY -- //


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
  alert("Under Maintenance");

  // $.ajax({
  //     method: 'PUT',
  //     url: '/api/goto',
  //     contentType: 'application/json',
  //     data: JSON.stringify({
  //       waypoints: wp
  //     }),
  //   })
  //   .done(function(msg) {
  //     console.log('sent waypoints')
  //   });
});

function createMission() {
  var text = "QGC WPL 110\n";
  // HOME POINT
  var convertedHomePoints = ol.proj.transform([PointHomeFeature.getGeometry().getCoordinates()[0], PointHomeFeature.getGeometry().getCoordinates()[1]], 'EPSG:3857', 'EPSG:4326');
  text += "0\t1\t0\t16\t0\t0\t0\t0\t"+convertedHomePoints[1]+"\t"+convertedHomePoints[0]+"\t583.989990\t1\n";

  var missionPoints_ = [];

  PLSource.forEachFeature(function(feature){
    var convertedWpoints = ol.proj.transform([feature.getGeometry().getCoordinates()[0], feature.getGeometry().getCoordinates()[1]], 'EPSG:3857', 'EPSG:4326');
    missionPoints_.unshift([convertedWpoints[0], convertedWpoints[1]]);
  });

  var index = 1;
  missionPoints_.forEach(element => {
    console.log(element[0]); // Longitude
    console.log(element[1]); // Latitude
    text += index + "\t0\t3\t16\t0.00000000\t0.00000000\t0.00000000\t0.00000000\t" + element[1] + "\t" + element[0] + "\t100.000000\t1\n";
    index++;
  });
  return text;
}

$('#button-save-mission').on('click', function() {
  // alert("Saving");
  var text = createMission();

  var element = document.createElement('a');
  var file = new Blob([text], {
    type: 'text/json'
  });
  element.href = URL.createObjectURL(file);
  element.download = "waypoints.txt";

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
})

// Debug anything
$('#button-debug').on('click', function() {

  // PLSource.forEachFeature(function(feature){
  //   console.info(feature);
  // });

  // PLSource.forEachFeature(function(feature){
  //   // var converted = ol.proj.transform([feature.getGeometry().getCoordinates()[0], feature.getGeometry().getCoordinates()[1]], 'EPSG:3857', 'EPSG:4326');
  //   // console.log(converted);
    
  //   var coords = convertFromLongLat(149.16316459905855,-35.363702841261755);

  //   feature.getGeometry().setCoordinates(coords);
  //   // console.log(feature);
  //   return;
  // });

  // addPointLayerSource();
})


// Add Mission
$('#button-add-mission').on('click', function() {
  if (document.getElementById("button-add-mission").innerHTML == "Add Mission") {
    document.getElementById('button-add-mission').innerHTML = "Done";

    missionPoints = [];
    var convertedHomePoints = ol.proj.transform([PointHomeFeature.getGeometry().getCoordinates()[0], PointHomeFeature.getGeometry().getCoordinates()[1]], 'EPSG:3857', 'EPSG:4326');
    missionPoints.push([convertedHomePoints[0], convertedHomePoints[1]]);

    drawMission = true;

  } else {
    document.getElementById('button-add-mission').innerHTML = "Add Mission";
    var convertedHomePoints = ol.proj.transform([PointHomeFeature.getGeometry().getCoordinates()[0], PointHomeFeature.getGeometry().getCoordinates()[1]], 'EPSG:3857', 'EPSG:4326');
    missionPoints.push([convertedHomePoints[0], convertedHomePoints[1]]);
    
    drawMission = false;
  }
});

// Add Row
$(".add-row").click(function(){
  var lon = savedMissionPoints[savedMissionPoints.length -1][1];
  var lat = savedMissionPoints[savedMissionPoints.length -1][2];

  addPointLayerSource(lon,lat);  
  InsertRow(lon, lat);
  drawMissionLine();

});

// Delete Row
// Find and remove selected table rows
$(".delete-row").click(function(){
  var i=0;

  var listIndexToRemove = [];
  $("table tbody").find('input[name="record"]').each(function(){
    if($(this).is(":checked")){
      // console.log(i);
      listIndexToRemove.push(i);
      $(this).parents("tr").remove();
    }
    i++;
  });

  for(i=0; i<listIndexToRemove.length; i++){
    savedMissionPoints.splice(listIndexToRemove[i]-i,1);
  }

  console.table(savedMissionPoints);

  var duplicate_savedMissionPoints = savedMissionPoints;

  savedMissionPoints = [];
  PLSource.clear();
  
  for(i=0; i<duplicate_savedMissionPoints.length; i++){
    addPointLayerSource(duplicate_savedMissionPoints[i][1], duplicate_savedMissionPoints[i][2]);
  }

  drawMissionLine();
});

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
  // console.info(evt.pixel);
  // console.info(map.getPixelFromCoordinate(evt.coordinate));
  // console.info(ol.proj.toLonLat(evt.coordinate));

  // console.info(evt);
  var coords = ol.proj.toLonLat(evt.coordinate);

  var lat = coords[1];
  var lon = coords[0];

  if(drawMission == true){
    addPointLayerSource(lon,lat);  
    InsertRow(lon, lat);

    drawMissionLine();
  }

  var locTxt = "<b>Latitude</b>: " + lat + " <b>Longitude</b>: " + lon;
  // coords is a div in HTML below the map to display
  document.getElementById('coordinate-ping').innerHTML = locTxt;
});
