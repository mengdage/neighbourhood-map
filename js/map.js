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
  googleMaps.setCenter = setCenter;
  googleMaps.bounceMarker = bounceMarker;
  googleMaps.triggerMarkerClick = triggerMarkerClick;

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

    // style the infowindow when the dom is ready
    // infowindow.addListener('domready', styleInfowindow);

    // when map is clicked, close the infowindow if it is open
    map.addListener('click', function(){
      infowindow.close();
    });



    // map.addListener('bounds_changed', centerMap);
  }
  /************ Map  **************/

  // center the map to the given marker
  function setCenter(option) {
    var marker;
    if(option.marker) {
      marker = option.marker;
    } else if(option.id) {
      marker = findMarkerById(option.id);
    }
    // if marker exists, center map to the marker
    if(marker) {
      console.log('center map to ' + marker.getPosition());
      map.panTo(marker.getPosition());
      // bounceMarker({marker: marker});
    }

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
      function end() {
        marker.setAnimation(null);
      }
    }
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

  function triggerMarkerClick(id) {
    var marker = findMarkerById(id);
    if(marker){
      googleMaps.triggerEvent(marker, 'click');
    }
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

  // *
  // START INFOWINDOW CUSTOMIZE.
  // From Miguel Marnoto's codepen
  // https://codepen.io/Marnoto/pen/xboPmG
  // *
  function styleInfowindow() {
    // Reference to the DIV that wraps the bottom of infowindow
    var iwOuter = $('.gm-style-iw');

    /* Since this div is in a position prior to .gm-div style-iw.
     * We use jQuery and create a iwBackground variable,
     * and took advantage of the existing reference .gm-style-iw for the previous div with .prev().
    */
    var iwBackground  = iwOuter.prev(),
        iwArrowShadow = iwBackground.children(':nth-child(1)'),
        iwBgShadow    = iwBackground.children(':nth-child(2)'),
        iwArrow       = iwBackground.children(':nth-child(3)'),
        iwBgContent   = iwBackground.children(':nth-child(4)'),
        iwCloseBtn    = iwOuter.next(); //div that groups the close button elements.

    // iwOuter.css({'top': '0', 'left': '0', 'width': '15rem !important'});
    // Removes background shadow DIV
    iwBgShadow.css({'display' : 'none'});

    // Removes white background DIV
    iwBgContent.css({'display': 'none'});

    // // Moves the infowindow.
    iwOuter.parent().css({'width': '15rem !important'});
    // // Moves the arrow.
    // iwArrowShadow.attr('style', function(i,s){ return s + 'left: 36px !important;'});
    // iwArrow.attr('style', function(i,s){ return s + 'left: 36px !important;'});

  //   iwOuter.children(':nth-child(1)')
  //           .css({'max-width': '15rem !important'});
    // Changes the desired tail shadow color.
    iwArrow.find('div').children()
           .css({'box-shadow': 'rgba(72, 181, 233, 0.6) 0px 1px 6px', 'z-index' : '1'});
  //
    // Apply the desired effect to the close button
    iwCloseBtn.css({
      'width': '20px',
      'height': '20px',
      'opacity': '1',
      'right': '44px',
      'top': '8px',
      'border': '4px solid #48b5e9',
      'border-radius': '13px',
      'box-shadow': '0 0 5px #3990B9'});
  //
  //   // If the content of infowindow not exceed the set maximum height, then the gradient is removed.
  //   if($('.iw-content').height() < 140){
  //     $('.iw-bottom-gradient').css({display: 'none'});
  //   }
  //
  //   // The API automatically applies 0.7 opacity to the button after the mouseout event. This function reverses this event to the desired value.
  //   iwCloseBtn.mouseout(function(){
  //     $(this).css({opacity: '1'});
  //   });
   }
  /************ end of infowindow **************/


})(self);
