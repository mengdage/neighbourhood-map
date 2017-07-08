(function(global) {
  'use strict';

  var googleMaps,
      ko,
      searchBox,
      vmInfowindow, // viewmodel
      vmSidebar,    // viewmodel
      sidebarEle = global.document.querySelector('.sidebar'),
      config = {
        places: [
          {
            place_id: 'ChIJmQJIxlVYwokRLgeuocVOGVU',
            name: 'Times Square',
            formatted_address: 'Manhattan, NY 10036, USA',
            latlng: {lat: 40.758895, lng: -73.985131}
          },
          {
            place_id: 'ChIJKxDbe_lYwokRVf__s8CPn-o',
            name: 'The Museum of Modern Art',
            formatted_address: '11 W 53rd St, New York, NY 10019, USA',
            latlng: {lat: 40.7614327, lng: -73.977621}
          },
          {
            place_id: 'ChIJvbGg56pZwokRp_E3JbivnLQ',
            name: 'Bryant Park',
            formatted_address: 'New York, NY 10018, USA',
            latlng: {lat: 40.7535965, lng: -73.983232}
          },
          {
            place_id: 'ChIJtcaxrqlZwokRfwmmibzPsTU',
            name: 'Empire State Building',
            formatted_address: 'Empire State Building, 350 5th Ave, New York, NY 10118, USA',
            latlng: {lat: 40.7485413, lng: -73.985757}
          },
          {
            place_id: 'ChIJdwzvuv5YwokRxXayiC0JYHo',
            name: 'Rockefeller Center',
            formatted_address: 'Rockefeller Center, New York, NY, USA',
            latlng: {lat: 40.7586101, lng: -73.9782093}
          }
        ]
      };
  global.addEventListener('load', init);

  // Store the new marker
  function MMarker(place) {
    // TODO: create observable properties
    var lat = place.latlng ? place.latlng.lat : place.geometry.location.lat(),
        lng = place.latlng ? place.latlng.lng : place.geometry.location.lng();
    this.id = ko.observable(place.place_id);
    this.name = ko.observable(place.name);
    this.formatted_address = ko.observable(place.formatted_address);
    this.location = {
      lat: ko.observable(lat),
      lng: ko.observable(lng)
    };
  }

  // Viewmodel for the sidebar
  function VMSidebar() {
    var self = this;
    // Store all the markers
    self.markers = ko.observableArray([]);
    // The filter keyword
    self.filter = ko.observable('');

    // The result marker array filtered by `filter`
    self.filteredMarkers = ko.computed(function(){
      if(!self.filter()){
        // if no filter, return the original array
        return self.markers();
      } else {
        return ko.utils.arrayFilter(self.markers(), function(marker) {
          var match = new RegExp(self.filter(), 'i');
          return (marker.name().search(match) !== -1);
        });
      }
    });

    // When the filteredMarkers changes, change the markers on the map as well
    self.filteredMarkers.subscribe(function(newFilteredMarkers) {
      var ids = newFilteredMarkers.map(function(marker) {
        return marker.id();
      });
      googleMaps.showMarkers(ids);
    });

    // add listener to places_changed event to get the search result
    searchBox.addListener('places_changed', function() {
      // debugger;
      var places = searchBox.getPlaces();
      if( places.length === 0) {
        return;
      }

      places.forEach(function(place) {
        self.addMarker(place);
      });
    });

    // add a new marker from the `place` and push the marker into the markers array
    self.addMarker = function (place) {
      // Only add a new marker if a new place
      var id = place.place_id;
      if(self.findMarker(id) === -1) {
        console.log(place.name+" "+id+" added.");
        self.markers.push(new MMarker(place));
        // Add a new marker on the google map
        googleMaps.addMarker(place);
        googleMaps.addMarkerClickListener(id, function(){markerClickCallback(place);});
      } else {
        console.log(place.name+" "+place.place_id+" already exist.");
      }
    };

    // return the index of marker with `id`
    self.findMarker = function(id) {
      var i, max;
      for(i = 0, max = self.markers().length; i < max; i+=1){
        if(self.markers()[i].id() === id) {
          return i;
        }
      }
      return -1;
    };

    // remove the marker with the given id
    self.removeMarker = function(place) {
      var id = place.id();
      self.markers.remove(function(marker) {
        return marker.id() === id;
      });
      // Remove the marker from the google map markers
      googleMaps.removeMarker(place.id());
    };

    function markerClickCallback(place) {
      var id = place.place_id;
      var contentString = '<div class="infowindow">' +
                            '<h2 class="info-header" data-bind="text: placeName">' + '</h2>' +
                            '<p class="info-address">Address: '+'<span data-bind="text: placeAddress">' +'</span>'+'</p>' +
                            '<div class="info-row">'+
                              '<ul class="info-btns-list">'+
                                '<li>'+'<a href="#">' + 'hello' + '</a>'+'</li>'+
                                '<li>'+'<a href="#">' + 'world' + '</a>'+'</li>'+
                              '</ul>'+
                            '</div>'+
                            '<div data-bind="html: contentString">'+'</div>'+
                          '</div>';

      googleMaps.setInfowindowContent(contentString);
      googleMaps.openInfowindow(id);
      vmInfowindow.setPlace(place);
      ko.applyBindings(vmInfowindow, document.querySelector('.infowindow'));

    }
  }

  // Viewmodel for the infowindow
  function VMInfowindow() {
    this.placeName = ko.observable();
    this.placeAddress = ko.observable();

    this.contentString = ko.observable('<h3>Hello, I\'m VMInfowindow</h3>');
    this.setPlace = function(place){
      this.placeName(place.name);
      this.placeAddress(place.formatted_address);
    };


  }

  function init() {

    var defaultPlaces = config.places;
    // initialization
    googleMaps = global.googleMaps;
    ko = global.ko;
    searchBox = googleMaps.searchBox;

    // create the sidebar viewmodel
    vmSidebar = new VMSidebar();
    vmInfowindow = new VMInfowindow();


    // add default places
    defaultPlaces.forEach(function(place) {
      vmSidebar.addMarker(place);
    });

    ko.applyBindings(vmSidebar, sidebarEle);
  }
}
)(self);
