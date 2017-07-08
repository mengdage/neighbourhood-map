(function(global) {
  'use strict';

  var googleMaps,
      ko,
      searchBox,
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
    this.id = ko.observable(place.place_id);
    this.name = ko.observable(place.name);
    this.formatted_address = ko.observable(place.formatted_address);
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
        console.log(place.name+" "+place.place_id+" "+place.geometry.location.lat()+" "+place.geometry.location.lng());
        self.addMarker(place);
      });
    });

    // add a new marker from the `place` and push the marker into the markers array
    self.addMarker = function (place) {
        self.markers.push(new MMarker(place));
        // TODO: add a new marker on the google map
        googleMaps.addMarker(place);
    };

    // remove the marker with the given id
    self.removeMarker = function(place) {
      var id = place.id();
      self.markers.remove(function(marker) {
        return marker.id() === id;
      });
      // TODO: remove the marker from the google map markers
      googleMaps.removeMarker(place.id());
    };
  }


  function init() {
    // initialization
    googleMaps = global.googleMaps;
    ko = global.ko;
    searchBox = googleMaps.searchBox;

    // create the sidebar viewmodel
    var vmSidebar = new VMSidebar(),
        defaultPlaces = config.places;
    // add default places
    defaultPlaces.forEach(function(place) {
      vmSidebar.addMarker(place);
    });

    ko.applyBindings(vmSidebar, sidebarEle);
  }
}
)(self);
