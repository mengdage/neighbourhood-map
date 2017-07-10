(function(global){
  'use strict';
  // Google Maps related functionalities
  var googleMaps = global.googleMaps || {};
  googleMaps.markers =[];
  googleMaps.addMarker = addMarker;
  googleMaps.removeMarker = removeMarker;
  googleMaps.showMarkers = showMarkers;
  googleMaps.addMarkerClickListener = addMarkerClickListener;
  googleMaps.openInfowindow = openInfowindow;
  googleMaps.setInfowindowContent = setInfowindowContent;

  var ko,
      Marker,
      LatLngBounds,
      map,
      infowindow,
      markers = googleMaps.markers,
      bounds;

  global.addEventListener('load', init);
  function init(){
    Marker = googleMaps.Marker;
    LatLngBounds = googleMaps.LatLngBounds;
    map = googleMaps.map;
    infowindow = googleMaps.infowindow;
    // bounds = new LatLngBounds();

    // when the infowindow is close, clear the associated marker
    infowindow.addListener('closeclick', function(){
      infowindow.marker = null;
    });

    // when map is clicked, close the infowindow if it is open
    map.addListener('click', function(){
      infowindow.close();
    });

    // map.addListener('bounds_changed', centerMap);
  }
  /************ Map  **************/

  // center the map to the given marker
  function setCenter(marker) {
    map.panTo(marker.getPosition());
  }

  function centerMap() {
    console.log('recenter the map');
    var bounds = new LatLngBounds();
    markers.forEach(function(marker) {
      bounds.extend(marker.getPosition());
    });
    map.fitBounds(bounds);
  }

  /************ end of Map  **************/

  /************ Marker **************/
  // add marker to the array
  function addMarker(marker){
    console.log('add Marker ' + marker.id() + " to the map");

    var m = new Marker({
      position: {lat: marker.location.lat(), lng: marker.location.lng()},
      map: map,
      animation: google.maps.Animation.DROP
    });
    m.id = marker.id();
    markers.push(m);

    // Center the map to the new marker
    setCenter(m);
  }

  // add click event listener to the marker with 'markerId'
  function addMarkerClickListener(markerId, fn) {
    // Get the marker with `markerId`
    var marker = findMarkerById(markerId);
    if(marker === null) {
      return;
    }
    marker.addListener('click', fn);
  }

  // remove the marker with id (place_id) from the array
  function removeMarker(id) {
    markers = markers.filter(function(marker) {
      var match = marker.id === id;
      if(match) {
        marker.setMap(null);
      }
      return !match;
    });
  }

  // hide the marker with id (place_id) but not remove
  function hideMarker(id) {
    markers.forEach(function(marker) {
      if(marker.id === id) {
        marker.setMap(null);
      }
    });
  }

  // show the marker with id (place_id)
  function showMarker(id) {
    markers.forEach(function(marker) {
      if(marker.id === id) {
        marker.setMap(map);
      }
    });
  }

  // ids can be undefined, string('', 'xx'), array(length=0, length!=0)
  function showMarkers(ids) {
    console.log(ids);
    if(!ids) {
      // if ids is undefined, or empty string
      // show all markers
      markers.forEach(function(marker) {
        marker.setMap(map);
      });
    } else {
      if(typeof ids === 'string') {
        ids = [ids];
      }
      markers.forEach(function(marker) {
        if(ids.indexOf(marker.id) !== -1){
          // the marker.id is in the `ids`, show the marker
          marker.setMap(map);
        } else {
          // the marker.id is not in the `ids`, hide the marker
          marker.setMap(null);
        }
      });
    }
  }

  // return the marker with `id`
  // return null if not find
  function findMarkerById(id) {
    var i, max;
    for(i = 0, max = markers.length; i < max; i+=1) {
      if(markers[i].id === id) {
        return markers[i];
      }
    }
    return null;
  }
  /************ end of Marker  **************/

  /************ infowindow **************/
  // options must contain marker or id
  function openInfowindow(options) {
    var marker;
    if(options.id){
      marker = findMarkerById(options.id);
    } else {
      marker = options.marker;
    }
    if(options.content) {
      setInfowindowContent(content);
    }

    infowindow.open(map, marker);
  }
  function setInfowindowContent(content) {
    infowindow.setContent(content);
  }
  /************ end of infowindow **************/


})(self);
