(function(global){
  'use strict';
  // object that includes Google Maps related functionalities
  var googleMaps = global.googleMaps || {};

  googleMaps.markers =[];
  googleMaps.addMarker = addMarker;
  googleMaps.removeMarker = removeMarker;
  googleMaps.showMarkers = showMarkers;
  googleMaps.fitToAllMarkers = fitToAllMarkers;
  googleMaps.addMarkerClickListener = addMarkerClickListener;
  googleMaps.openInfowindow = openInfowindow;
  googleMaps.setInfowindowContent = setInfowindowContent;
  googleMaps.setCenter = setCenter;
  googleMaps.bounceMarker = bounceMarker;
  googleMaps.triggerMarkerClick = triggerMarkerClick;
  googleMaps.changeIcon = changeIcon;


  var ko,
      window = global.window,
      Marker,
      LatLngBounds,
      searchBox,
      map,
      infowindow,
      markers = googleMaps.markers,
      icons = {
        original: 'images/red-icon.png',
        highlighted: 'images/yellow-icon.png'
      };

  window.addEventListener('load', init);

  function init(){
    Marker = googleMaps.Marker;
    LatLngBounds = googleMaps.LatLngBounds;
    searchBox = googleMaps.searchBox;
    map = googleMaps.map;
    infowindow = googleMaps.infowindow;

    // when the infowindow is close, clear the associated marker
    infowindow.addListener('closeclick', function(){
      infowindow.marker = null;
    });

    // when map is clicked, close the infowindow if it is open
    map.addListener('click', function(){
      infowindow.close();
    });

    // when map bounds changes, bias searchBox to the new map bounds
    map.addListener('bounds_changed', boundSearchboxToMap);
  }
  /************ Map  **************/
  // center the map to the given marker, id or latlng
  // option must have marker, id, or latlng property
  function setCenter(option) {
    var marker, position;
    if(option.marker) {
      marker = option.marker;
    } else if(option.id) {
      marker = findMarkerById(option.id);
    } else if(option.latlng) {
      position = option.latlng;
    }
    // if marker exists, center map to the marker
    if(marker) {
      map.panTo(marker.getPosition());
    } else if(position) {
      map.panTo(position);
    }

  }

  // fit the map to show all visible markers
  function fitToAllMarkers() {
    var bounds = new LatLngBounds();
    markers.forEach(function(marker) {
      if(marker.getMap()){
        bounds.extend(marker.getPosition());
      }
    });
    map.fitBounds(bounds);
  }

  // bounce the marker for 1second
  // options {id: id, marker: marker}
  function bounceMarker(options) {
    var marker,
        duration = 1.4;  // Seconds.
    if(options.id) {
      marker = findMarkerById(options.id);
    } else if(options.marker){
      marker = options.marker;
    }

    // if marker exists, bounce the marker
    if(marker) {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      window.setTimeout(end, duration * 1000);
    }
    
    function end() {
      marker.setAnimation(null);
    }
  }

  function boundSearchboxToMap() {
    searchBox.setBounds(map.getBounds());
  }

  /************ end of Map  **************/

  /************ Marker **************/
  // add marker to the array
  function addMarker(marker){
    var m = new Marker({
        position: {lat: marker.location.lat(), lng: marker.location.lng()},
        map: map,
        icon: icons.original,
        animation: google.maps.Animation.DROP
      });
    m.id = marker.id();
    markers.push(m);

    // Center the map to the new marker
    setCenter({marker: m});
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

  // hide the marker with id (place_id) but not remove it
  function hideMarker(id) {
    markers.forEach(function(marker) {
      if(marker.id === id) {
        marker.setMap(null);
      }
    });
  }

  // ids can be undefined, string('', 'xx'), array(length=0, length!=0)
  function showMarkers(ids) {
    if(!ids) {
      // if ids is undefined, or empty string
      // show all markers
      markers.forEach(function(marker) {
        marker.setMap(map);
      });
    } else { // show markers with `ids`
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

  // trigger the click event of the marker with `id`
  function triggerMarkerClick(id) {
    var marker = findMarkerById(id);
    if(marker){
      googleMaps.triggerEvent(marker, 'click');
    }
  }

  // change the icon of the marker with `id`
  function changeIcon(id, type) {
    var marker = findMarkerById(id);
    // If the marker with `id` exist and the type of icons is valid,
    // change the icon.
    if(marker && icons[type]) {
      marker.setIcon(icons[type]);
    }
  }
  /************ end of Marker  **************/

  /************ infowindow **************/
  // Options must contain marker or id
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

  // Set the content of the infowindow
  function setInfowindowContent(content) {
    infowindow.setContent(content);
  }
  /************ end of infowindow **************/


})(self);
