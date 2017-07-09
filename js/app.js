(function(global) {
  'use strict';

  var googleMaps,
      ko,
      searchBox,
      vmInfowindow, // viewmodel
      vmSidebar,    // viewmodel
      sidebarEle = global.document.querySelector('.sidebar'),
      getInfo,
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
      var id = place.place_id,
          marker;
      if(self.findMarker(id) === -1) {
        console.log(place.name+" "+id+" added.");
        marker = new MMarker(place);
        self.markers.push(marker);
        // Add a new marker on the google map
        // TODO:
        googleMaps.addMarker(marker);
        googleMaps.addMarkerClickListener(id, function(){
          markerClickCallback(marker);});
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

    function markerClickCallback(marker) {
      var id = marker.id();
      var contentString = '<div class="info-window">' +
                            '<h2 class="info-header" data-bind="text: placeName">' + '</h2>' +
                            '<p class="info-address">Address: '+'<span data-bind="text: placeAddress">' +'</span>'+'</p>' +
                            '<div class="info-row">'+
                              '<ul class="info-btns-list">'+
                                '<li>'+'<a href="#" data-bind="click: function(){getMoreInfo(\'flickr\');}">' + 'flickr' + '</a>'+'</li>'+
                                '<li>'+'<a href="#" data-bind="click: function(){getMoreInfo(\'wiki\')}">' + 'wiki' + '</a>'+'</li>'+
                              '</ul>'+
                            '</div>'+
                            '<div data-bind="html: contentString">'+'</div>'+
                          '</div>';

      googleMaps.setInfowindowContent(contentString);
      googleMaps.openInfowindow({id: id});
      vmInfowindow.setPlace(marker);

      ko.applyBindings(vmInfowindow, document.querySelector('.info-window'));

    }
  }

  // Viewmodel for the infowindow
  function VMInfowindow() {
    var self = this;
    self.placeName = ko.observable();
    self.placeAddress = ko.observable();
    self.infos = ko.observableArray();
    self.location = {
      lat: ko.observable(),
      lng: ko.observable()
    };

    self.contentString = ko.observable('<h3>Hello, I\'m VMInfowindow</h3>');
    self.setPlace = function(marker){
      self.placeName(marker.name());
      self.placeAddress(marker.formatted_address());
      self.location.lat(marker.location.lat());
      self.location.lng(marker.location.lng());
      // clear previous content
      clearContent();
    };

    self.getMoreInfo = function(type) {
      switch(type) {
        case 'flickr':
          self.contentString('<div><img class="loading-icon" src="images/flickr-loader.gif" alt="loading"></div>');
          getInfoService.getFlickrInfo(populateFlickr, {name: self.placeName(),lat:self.location.lat(), lng:self.location.lng()});
          break;
        case 'wiki':
          self.contentString('<div><img class="loading-icon" src="images/flickr-loader.gif" alt="loading"></div>');
          getInfoService.getWikiInfo(populateWiki, {lat:self.location.lat(), lng:self.location.lng()});
          break;
        default:
          console.log('unknow info type');
      }
    };

    function populateFlickr(infos) {
      var contentString;
      if(!infos){
        // request failed
        contentString = '<p>Something bad happended.</p>';
      } else {
        contentString = infos.map(function(info) {
          // escape the title to prevent XSS attact
          var title = escapeHtml(info.title);
          return '<div class="flickr-item">' +
                    '<h2 class="flickr-item-header">' + title + '</h2>' +
                    '<a target="_blank" href="' +info.siteUrl+ '"' + 'title="' + title + '">' +
                    '<img class="flickr-item-img" src="' + info.sourceUrl + '" alt="' + title + '" >' +
                    '</a>' +
                 '</div>';
        }).join('');
      }
      self.contentString(contentString);
    }

    function populateWiki(infos) {
      console.log(infos);
      var contentString;
      if(!infos){
        // request failed
        contentString = '<p>Something bad happended.</p>';
      } else {
        contentString = infos.map(function(info) {
          // escape the title to prevent XSS attact
          var title = escapeHtml(info.title),
              description = escapeHtml(info.description);
          return '<div class="wiki-item">' +
                    '<h2 class="wiki-item-header">' +

                    (info.siteUrl ?
                      '<a target="_blank" href="' +info.siteUrl+ '"' + 'title="' + title + '">' +
                      title + '</a>' : title
                    ) +

                    '</h2>' +

                    (info.thumbnail ?
                    '<img class="flickr-item-img" src="' + info.thumbnail.source + '" alt="' + title + '" >' : ''
                    ) +

                    (info.description ?
                    '<p>' + description + '</p>' : ''
                    ) +
                 '</div>';
        }).join('');
      }
      self.contentString(contentString);
    }
    function clearContent() {
      self.contentString('<h3>Hello, I\'m VMInfowindow</h3>');
    }

  }

  function escapeHtml(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
  }

  function init() {

    var defaultPlaces = config.places;
    // initialization
    googleMaps = global.googleMaps;
    ko = global.ko;
    searchBox = googleMaps.searchBox;
    getInfoService = global.getInfoService;

    // create the sidebar viewmodel
    vmSidebar = new VMSidebar();
    vmInfowindow = new VMInfowindow();


    // add default places
    defaultPlaces.forEach(function(place) {
      vmSidebar.addMarker(place);
    });

    // add click event listener to googleMap

    ko.applyBindings(vmSidebar, sidebarEle);
  }
}
)(self);
