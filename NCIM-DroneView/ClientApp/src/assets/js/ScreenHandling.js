var markers = [
    { 'title': 'Dutch Embassy', 'description': 'target: Dutch Embassy', 'lat': '50.842937', 'lng': '4.384947' },
];

window.onload = function () {
    var isBusy = false;
    var path = new google.maps.MVCArray();
    var latlngbounds = new google.maps.LatLngBounds();
    var position = [parseFloat("50.842937"), parseFloat("4.384947")];
    var mapOptions = {
        zoom: 16,
        center: new google.maps.LatLng(position[0], position[1]),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
    // Setting Marker after map init
    var latlng = new google.maps.LatLng(position[0], position[1]);
    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: "Test Marker"
    });
    //marker.animateTo(latlng, { easing: 'linear', duration: 1000 });
    function LoadCoordinates() {
        var infoWindow = new google.maps.InfoWindow();
        var lat_lng = new Array();
        for (i = 0; i < markers.length; i++) {
            var data = markers[i]
            var myLatlng = new google.maps.LatLng(data.lat, data.lng);
            lat_lng.push(myLatlng);
            var marker = new google.maps.Marker({
                position: myLatlng,
                map: map,
                title: data.title
            });
            latlngbounds.extend(marker.position);
            (function (marker, data) {
                google.maps.event.addListener(marker, "click", function (e) {
                    infoWindow.setContent(data.description);
                    infoWindow.open(map, marker);
                });
            })(marker, data);
        }
        map.setCenter(latlngbounds.getCenter());
        map.fitBounds(latlngbounds);
        path = new google.maps.MVCArray();
        var service = new google.maps.DirectionsService();
        var poly = new google.maps.Polyline({
            map: map,
            strokeColor: '#4986E7'
        });
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
                    travelMode: google.maps.DirectionsTravelMode.DRIVING
                }, function (result, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                        for (var i = 0, len = result.routes[0].overview_path.length; i < len; i++) {
                            path.push(result.routes[0].overview_path[i]);
                            /*
                            var RouteMarker = new google.maps.Marker({
                                position: { lat: result.routes[0].overview_path[i].lat(), lng: result.routes[0].overview_path[i].lng() },
                                map: map
                            });
                            latlngbounds.extend(RouteMarker.position);
                            */
                        }
                    }
                });
            }
        }
    }

    var numDeltas = 60;
    var delay = 10; //milliseconds
    var i = 0;
    var deltaLat = 0.00000;
    var deltaLng = 0.00000;
    var isBusy = false;

    function Move(mapsPath) {
        
        position[0] = parseFloat(mapsPath.getArray()[0].lat()).toFixed(5);
        position[1] = parseFloat(mapsPath.getArray()[0].lng()).toFixed(5);
        var latlng = new google.maps.LatLng(position[0], position[1]);
        doStuff(latlng);

        var len = mapsPath.getArray().length;
        var latlngArray = new Array(len);
        for (var i = 0; i < len; i++) {
            var newPosition = [parseFloat(mapsPath.getArray()[0].lat()).toFixed(5), parseFloat(mapsPath.getArray()[0].lng()).toFixed(5)];
            latlngArray[i] = newPosition;
        }
        function waitForIt() {
            console.log("ARRAY Length: " + len );
            var i = 0;
            while (i < len) {
                console.log("CHECK isBusy: " + isBusy);
                if (isBusy == true) {
                    console.log("TIMEOUT: ");
                    setTimeout(function () { waitForIt() }, 100);
                }
                else {
                    var latlng = new google.maps.LatLng(parseFloat(mapsPath.getArray()[i].lat()).toFixed(5), parseFloat(mapsPath.getArray()[i].lng()).toFixed(5));
                    console.log("NEW: " + latlng);
                    doStuff(latlng);
                    i++;
                }
            }
        }
        waitForIt();

        function doStuff(latlng) {
            marker.animateTo(latlng, { easing: 'linear', duration: 1000 });
        }


        
        console.log("Done Moving: " + position[0] + "," + position[1]);
    }



    function sleep(miliseconds) {
        return new Promise((resolve) => setTimeout(resolve, miliseconds));
    }

    document.getElementById("move").onclick = function () {
        Move(path);
    }

    document.getElementById("plot").onclick = function () {
        markers = [
            { 'description': 'Start', 'lat': document.getElementById("latStart").value, 'lng': document.getElementById("lngStart").value }, // NCIM
            { 'description': 'End', 'lat': document.getElementById("latEnd").value, 'lng': document.getElementById("lngEnd").value }
        ];
        LoadCoordinates();
    }

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
        isBusy = true;
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
        if (options.easing != 'linear') {
            if (typeof jQuery == 'undefined' || !jQuery.easing[options.easing]) {
                throw '"' + options.easing + '" easing function doesn\'t exist. Include jQuery and/or the jQuery easing plugin and use the right function name.';
                return;
            }
        }

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
                var mapbounds = this.map.getBounds();
                mapbounds.extend(newPoint);
                this.map.fitBounds(mapbounds);
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
            if (options.easing !== 'linear') {
                easingDurationRatio = jQuery.easing[options.easing](durationRatio, ellapsedTime, 0, 1, options.duration);
            }

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

        isBusy = false;
        console.log("isBusy: " + newPosition + ' DONE!');
    }

}