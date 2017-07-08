(function(global){
  'use strict';
  // Google Maps related functionalities
  var googleMaps = global.googleMaps || {};
  googleMaps.markers =[];
  googleMaps.addMarker = addMarker;
  googleMaps.removeMarker = removeMarker;
  // googleMaps.hideMarker = hideMarker;
  // googleMaps.showMarker = showMarker;
  googleMaps.showMarkers = showMarkers;

  var ko,
      Marker,
      map,
      markers = googleMaps.markers;

  global.addEventListener('load', init);
  function init(){
    Marker = googleMaps.Marker;
    map = googleMaps.map;
  }

  // add marker to the array
  function addMarker(place){
    console.log('add Marker ' + place.place_id + " to the map");
    var latlng = place.latlng || place.geometry.location;
    var m = new Marker({
      position: latlng,
      map: map,
      animation: google.maps.Animation.DROP
    });
    m.id = place.place_id;
    markers.push(m);
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


})(self);
