var markers = [
  { 'title': 'Dutch Embassy', 'description': 'target: Dutch Embassy', 'lat': '50.842937', 'lng': '4.384947' },
];

window.onload = function () {
  var imported = document.createElement('script');
  imported.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDAaA-fCvLZrjPWEREb9SN4YVxjKWhpYkU&callback=initMap";
  document.head.appendChild(imported);

  document.getElementById("StartBtn").onclick = function () {
    geocodeAddressStart(geocoder, map);
  }

  document.getElementById("EndBtn").onclick = function () {
    geocodeAddressEnd(geocoder, map);
  }

  document.getElementById("move").onclick = function () {
    Move(path);
  }

  document.getElementById("plot").onclick = function () {
    markers = [
      { 'description': 'Start', 'lat': document.getElementById("latStart").value, 'lng': document.getElementById("lngStart").value },
      { 'description': 'End', 'lat': document.getElementById("latEnd").value, 'lng': document.getElementById("lngEnd").value }
    ];
    LoadCoordinates();
  }
}

var path;
var position;
var mapOptions;
var map;
var latlng;
var AnimateMarker;
var StartMarker;
var EndMarker;
var poly;
var geocoder;

function initMap() {
  path = new google.maps.MVCArray();
  //var position = [parseFloat("50.842937"), parseFloat("4.384947")];
  position = [parseFloat("52.07651"), parseFloat("4.39459")];
  mapOptions = {
    zoom: 16,
    center: new google.maps.LatLng(position[0], position[1]),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
  // Setting Marker after map init
  latlng = new google.maps.LatLng(position[0], position[1]);
  AnimateMarker = new google.maps.Marker({
    position: latlng,
    map: map,
  });
  StartMarker = new google.maps.Marker({
    position: latlng,
    map: map,
  });
  EndMarker = new google.maps.Marker({
    position: latlng,
    map: map,
  });
  poly = new google.maps.Polyline({
    map: map,
    strokeColor: '#4986E7'
  });
  geocoder = new google.maps.Geocoder();

  // Animated Marker Movement. Robert Gerlach 2012-2013 https://github.com/combatwombat/marker-animate
  // MIT license
  //
  // params:
  // newPosition        - the new Position as google.maps.LatLng()
  // options            - optional options object (optional)
  // options.duration   - animation duration in ms (default 1000)
  // options.easing     - easing function from jQuery and/or the jQuery easing plugin (default 'linear')
  // options.complete   - callback function. Gets called, after the animation has finished
  // options.pan     - can be 'center', 'inbounds', or null. center keeps marker centered, in bounds keeps it in bounds (default null)
  google.maps.Marker.prototype.animateTo = function (newPosition, options) {
    console.log("isBusy: " + newPosition);
    defaultOptions = {
      duration: 1000,
      easing: 'linear',
      complete: null,
      pan: null
    }
    options = options || {};

    // complete missing options
    for (key in defaultOptions) {
      options[key] = options[key] || defaultOptions[key];
    }

    // throw exception if easing function doesn't exist
    //if (options.easing != 'linear') {
    //    if (typeof jQuery == 'undefined' || !jQuery.easing[options.easing]) {
    //        throw '"' + options.easing + '" easing function doesn\'t exist. Include jQuery and/or the jQuery easing plugin and use the right function name.';
    //        return;
    //    }
    //}

    // make sure the pan option is valid
    if (options.pan !== null) {
      if (options.pan !== 'center' && options.pan !== 'inbounds') {
        return;
      }
    }

    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

    // save current position. prefixed to avoid name collisions. separate for lat/lng to avoid calling lat()/lng() in every frame
    this.AT_startPosition_lat = this.getPosition().lat();
    this.AT_startPosition_lng = this.getPosition().lng();
    var newPosition_lat = newPosition.lat();
    var newPosition_lng = newPosition.lng();
    var newPoint = new google.maps.LatLng(newPosition.lat(), newPosition.lng());

    if (options.pan === 'center') {
      this.map.setCenter(newPoint);
    }

    if (options.pan === 'inbounds') {
      if (!this.map.getBounds().contains(newPoint)) {
        this.map.setCenter(newPoint);
        //var mapbounds = this.map.getBounds();
        //mapbounds.extend(newPoint);
        //this.map.fitBounds(mapbounds);
      }
    }

    // crossing the 180° meridian and going the long way around the earth?
    if (Math.abs(newPosition_lng - this.AT_startPosition_lng) > 180) {
      if (newPosition_lng > this.AT_startPosition_lng) {
        newPosition_lng -= 360;
      } else {
        newPosition_lng += 360;
      }
    }

    var animateStep = function (marker, startTime) {
      var ellapsedTime = (new Date()).getTime() - startTime;
      var durationRatio = ellapsedTime / options.duration; // 0 - 1
      var easingDurationRatio = durationRatio;

      // use jQuery easing if it's not linear
      //if (options.easing !== 'linear') {
      //    easingDurationRatio = jQuery.easing[options.easing](durationRatio, ellapsedTime, 0, 1, options.duration);
      //}
      console.log("durationratio: " + durationRatio);
      if (durationRatio < 1) {
        var deltaPosition = new google.maps.LatLng(marker.AT_startPosition_lat + (newPosition_lat - marker.AT_startPosition_lat) * easingDurationRatio,
          marker.AT_startPosition_lng + (newPosition_lng - marker.AT_startPosition_lng) * easingDurationRatio);
        marker.setPosition(deltaPosition);

        // use requestAnimationFrame if it exists on this browser. If not, use setTimeout with ~60 fps
        if (window.requestAnimationFrame) {
          marker.AT_animationHandler = window.requestAnimationFrame(function () {
            animateStep(marker, startTime)
          });
        } else {
          marker.AT_animationHandler = setTimeout(function () {
            animateStep(marker, startTime)
          }, 17);
        }

      } else {
        marker.setPosition(newPosition);

        if (typeof options.complete === 'function') {
          options.complete();
        }
      }
    }

    // stop possibly running animation
    if (window.cancelAnimationFrame) {
      window.cancelAnimationFrame(this.AT_animationHandler);
    } else {
      clearTimeout(this.AT_animationHandler);
    }
    animateStep(this, (new Date()).getTime());

    console.log("isBusy: " + newPosition + ' DONE!');
  }
}

function LoadCoordinates() {
  var infoWindow = new google.maps.InfoWindow();
  var latlngbounds = new google.maps.LatLngBounds();
  var lat_lng = new Array();
  for (i = 0; i < markers.length; i++) {
    var data = markers[i];

    if (i == 0) {
      var myLatlng = new google.maps.LatLng(data.lat, data.lng);
      StartMarker.setPosition(myLatlng);
      latlngbounds.extend(StartMarker.position);
      lat_lng.push(StartMarker.position);
    }
    if (i == markers.length - 1) {
      var myLatlng = new google.maps.LatLng(data.lat, data.lng);
      EndMarker.setPosition(myLatlng);
      latlngbounds.extend(EndMarker.position);
      lat_lng.push(EndMarker.position);
    }
  }
  map.setCenter(latlngbounds.getCenter());
  map.fitBounds(latlngbounds);
  //poly.setMap(null);
  path = new google.maps.MVCArray();
  var service = new google.maps.DirectionsService();
  // Computing route
  for (var i = 0; i < lat_lng.length; i++) {
    if ((i + 1) < lat_lng.length) {
      var src = lat_lng[i];
      var des = lat_lng[i + 1];
      path.push(src);
      poly.setPath(path);
      service.route({
        origin: src,
        destination: des,
        travelMode: google.maps.DirectionsTravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC
      }, function (result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          //var calcDistance = 0;
          for (var i = 0, len = result.routes[0].overview_path.length; i < len; i++) {
            path.push(result.routes[0].overview_path[i]);

            //calcDistance += result.routes[0].overview_path[i].distance;
            /*
            var RouteMarker = new google.maps.Marker({
                position: { lat: result.routes[0].overview_path[i].lat(), lng: result.routes[0].overview_path[i].lng() },
                map: map
            });
            latlngbounds.extend(RouteMarker.position);
            */
          }
          var totalDistance = 0;
          var totalDuration = 0;
          var legs = result.routes[0].legs;
          for (var i = 0; i < legs.length; ++i) {
            totalDistance += legs[i].distance.value;
            totalDuration += legs[i].duration.value;
          }
          var durationNew = document.createElement("label");
          durationNew.id = "duration";
          durationNew.innerText = (totalDuration / 3600) + ' tijd';
          var durationOld = document.getElementById("duration");
          var parentDiv = durationOld.parentNode;
          // replace existing node distanceOld with the new element
          parentDiv.replaceChild(durationNew, durationOld);

          var distanceNew = document.createElement("label");
          distanceNew.id = "distance";
          distanceNew.innerText = (totalDistance / 1000) + ' km';
          var distanceOld = document.getElementById("distance");
          var parentDiv = distanceOld.parentNode;
          // replace existing node distanceOld with the new element
          parentDiv.replaceChild(distanceNew, distanceOld);
        }
      });
    }
  }
}

var i = 0;
var sleepTime = 40;

async function Move(mapsPath) {
  document.getElementById("move").disabled = true;
  position[0] = parseFloat(mapsPath.getArray()[0].lat()).toFixed(5);
  position[1] = parseFloat(mapsPath.getArray()[0].lng()).toFixed(5);
  var latlng = new google.maps.LatLng(position[0], position[1]);
  //AnimateMarker.setPosition(newPosition);
  AnimateMarker.animateTo(latlng, { easing: 'linear', duration: 0 });

  function sleep(ms) {
    console.log("sleep");
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  var len = mapsPath.getArray().length;
  var latlngArray = new Array(len);
  for (var i = 0; i < len; i++) {
    var inputPan = "";
    if (document.getElementById("chkCenter").checked) {
      inputPan = "center";
    }
    if (document.getElementById("chkInbounds").checked) {
      inputPan = "inbounds";
    }
    var inputDuration = 40; //document.getElementById("speedBar").value;
    //console.log("" + document.getElementById("speedBar").value);
    var options = {
      duration: inputDuration,
      easing: 'linear',
      complete: null,
      pan: inputPan
    }
    var latlng = new google.maps.LatLng(parseFloat(mapsPath.getArray()[i].lat()).toFixed(5), parseFloat(mapsPath.getArray()[i].lng()).toFixed(5));
    AnimateMarker.animateTo(latlng, { easing: 'linear', duration: inputDuration, pan: inputPan });
    //AnimateMarker.animateTo(latlng, options);
    await sleep(sleepTime);
  }

  console.log("Done Moving: " + position[0] + "," + position[1]);
  document.getElementById("move").disabled = false;
}

function geocodeAddressStart(geocoder, resultsMap) {
  var address = document.getElementById('AddressStart').value;
  geocoder.geocode({ 'address': address }, function (results, status) {
    if (status === 'OK') {
      resultsMap.setCenter(results[0].geometry.location);
      StartMarker.setPosition(results[0].geometry.location);
      document.getElementById('latStart').value = results[0].geometry.location.lat();
      document.getElementById('lngStart').value = results[0].geometry.location.lng();
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

function geocodeAddressEnd(geocoder, resultsMap) {
  var address = document.getElementById('AddressEnd').value;
  geocoder.geocode({ 'address': address }, function (results, status) {
    if (status === 'OK') {
      resultsMap.setCenter(results[0].geometry.location);
      EndMarker.setPosition(results[0].geometry.location);
      document.getElementById('latEnd').value = results[0].geometry.location.lat();
      document.getElementById('lngEnd').value = results[0].geometry.location.lng();
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

function sleep(miliseconds) {
  return new Promise((resolve) => setTimeout(resolve, miliseconds));
}
