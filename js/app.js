(function(global) {
  'use strict';

  var googleMaps,
      window = global.window,
      localStorage = window.localStorage,
      ko,
      searchBox,
      searchBoxElem = global.document.querySelector('#search-box'),
      vmInfowindow, // viewmodel
      vmSidebar,    // viewmodel
      sidebarEle = global.document.querySelector('.sidebar'),
      getInfo,
      nm_config = {
        nm_markers: [
          {
            place_id: 'ChIJmQJIxlVYwokRLgeuocVOGVU',
            name: 'Times Square',
            formatted_address: 'Manhattan, NY 10036, USA',
            latlng: {lat: 40.758895, lng: -73.985131}
          },
          {
            place_id: 'ChIJL7WWqfhYwokRrQkOaP3SOa4',
            name: 'Sake Bar Hagi',
            formatted_address: '152 W 49th St, New York, NY 10019, USA',
            latlng: {lat: 40.7586101, lng: -73.9782093}
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
            place_id: 'ChIJqaiomQBZwokRTHOaUG7fUTs',
            name: 'New York Public Library - Stephen A. Schwarzman Building',
            formatted_address: '476 5th Ave, New York, NY 10018, USA',
            latlng: {lat: 40.7531823, lng: -73.982253}
          }
        ]
      };
  global.addEventListener('load', init);

  function init() {
    // If the localStorage contain the nm_config,
    // retrive the nm_config.places. If not, use
    // the default nm_config.places.
    var defaultPlaces;
    if(localStorage.nm_markers) {
      defaultPlaces = JSON.parse(localStorage.nm_markers);
    } else {
      defaultPlaces = nm_config.nm_markers;
    }

    // initialization
    googleMaps = global.googleMaps;
    ko = global.ko;
    searchBox = googleMaps.searchBox;
    getInfoService = global.getInfoService;


    // create the sidebar viewmodel
    vmSidebar = new VMSidebar();
    vmSidebar.checkIfLargeWindow();

    // create the infowindow viewmodel
    vmInfowindow = new VMInfowindow();


    // add default places
    defaultPlaces.forEach(function(place) {
      vmSidebar.addMarker(place);
    });

    // add click event listener to googleMap

    ko.applyBindings(vmSidebar, sidebarEle);
  }

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

    self.largeWindow = ko.observable();

    self.expanded = ko.observable(true);

    // cause to toogle expended class on sidebar
    self.toggleSidebar = function(){
      self.expanded(!self.expanded());
    };

    // Store the markers to the localStorage.
    self.storeMarkersToLocalStorage = function() {
      var nm_markers = [];
      self.markers().forEach(function(marker) {
        nm_markers.push({
          place_id: marker.id(),
          name: marker.name(),
          formatted_address: marker.formatted_address,
          latlng: {lat: marker.location.lat(), lng: marker.location.lng()}
        });
      });

      localStorage.nm_markers = JSON.stringify(nm_markers);
    };

    // fit the map to show all visible markers
    self.showAllMarkers = function() {
      googleMaps.fitToAllMarkers();
    };

    // Set the self.largeWindow based on the window size
    self.checkIfLargeWindow = function() {
      if(window.innerWidth > 767) {
        self.largeWindow(true);
      } else {
        self.largeWindow(false);
      }
    };

    // call googleMaps to center the map to the place
    self.listItemClicked = function(place) {
      var id = place.id();
      if(!self.largeWindow()) {
        self.toggleSidebar();
      }
      googleMaps.setCenter({id: id});
      googleMaps.triggerMarkerClick(id);
    };

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

    // Add listener to places_changed event to get the search result
    searchBox.addListener('places_changed', function() {
      // Clean searchBox
      searchBoxElem.value = '';
      // Check if small window. If so, close the sidebar
      if(!self.largeWindow()) {
        self.toggleSidebar();
      }
      var places = searchBox.getPlaces();
      if( places.length === 0) {
        return;
      }

      // If there are multiple places, only add the first one,
      // since this one is the closet one to our neighborhood.
      self.addMarker(places[0]);

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
        // Store the markers to the localStorage
        self.storeMarkersToLocalStorage();
        // Add a new marker on the google map
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
      // Store the markers to the localStorage
      self.storeMarkersToLocalStorage();
      // Remove the marker from the google map markers
      googleMaps.removeMarker(place.id());
    };

    // Highlight the marker by change the icon the highlited icon
    self.highlightMarker = function(marker) {
      googleMaps.changeIcon(marker.id(), 'highlighted');
    };
    // Default he marker by change the icon to the original icon
    self.defaultMarker = function(marker) {
      googleMaps.changeIcon(marker.id(), 'original');
    };

    function markerClickCallback(marker) {
      var id = marker.id();
      var contentString = '<div class="info-window">' +
                            '<div class="info-header">' +
                              '<h2 class="info-title" data-bind="text: placeName">' + '</h2>' +
                              '<div class="info-nav">'+
                                '<ul class="info-btns-list">'+
                                  '<li>'+'<a href="#" data-bind="click: function(){getMoreInfo(\'google\');}, css: {"active", sourceType() === "google"}">' + 'google' + '</a>'+'</li>'+
                                  '<li>'+'<a href="#" data-bind="click: function(){getMoreInfo(\'flickr\');}">' + 'flickr' + '</a>'+'</li>'+
                                  '<li>'+'<a href="#" data-bind="click: function(){getMoreInfo(\'wiki\')}">' + 'wiki' + '</a>'+'</li>'+
                                '</ul>'+
                              '</div>'+
                            '</div>' +
                            '<div class="info-content" data-bind="html: contentString">'+'</div>'+
                          '</div>';

      // change the marker to original icon;
      self.defaultMarker(marker);
      // bounce marker
      googleMaps.bounceMarker({id: id});
      // populate infowindow
      googleMaps.setInfowindowContent(contentString);
      googleMaps.openInfowindow({id: id});
      // bind infowindow viewmodel to the infowindow
      vmInfowindow.setPlace(marker);
      ko.applyBindings(vmInfowindow, document.querySelector('.info-window'));

    }


    window.addEventListener('resize', self.checkIfLargeWindow);
  }

  // Viewmodel for the infowindow
  function VMInfowindow() {
    var self = this;
    self.placeName = ko.observable();
    self.place_id = ko.observable();
    self.sourceType = ko.observable();

    self.location = {
      lat: ko.observable(),
      lng: ko.observable()
    };

    self.contentString = ko.observable('');
    self.setPlace = function(marker){
      self.placeName(marker.name());
      self.place_id(marker.id());
      self.location.lat(marker.location.lat());
      self.location.lng(marker.location.lng());
      // clear previous content
      clearContent();
      // self.getMoreInfo('google');
    };

    self.getMoreInfo = function(type) {
      if(self.sourceType() === type) {
        return;
      }
      self.sourceType(type);
      switch(type) {
        case 'flickr':
          self.contentString('<div><img class="loading-icon" src="images/flickr-loader.gif" alt="loading"></div>');
          getInfoService.getFlickrInfo(populateFlickr, {name: self.placeName(),lat:self.location.lat(), lng:self.location.lng()});
          break;
        case 'wiki':
          self.contentString('<div><img class="loading-icon" src="images/ajax-loader.gif" alt="loading"></div>');
          getInfoService.getWikiInfo(populateWiki, {lat:self.location.lat(), lng:self.location.lng()});
          break;
        case 'google':
          self.contentString('<div><img class="loading-icon" src="images/ajax-loader.gif" alt="loading"></div>');
          googleMaps.placeService.getDetails({placeId: self.place_id()}, populateGoogle);
          break;
        default:
          console.log('unknow info type');
      }
    };

    function populateGoogle(place, status) {
      var contentString = '';
      if (status == google.maps.places.PlacesServiceStatus.OK) {
          if(place.photos) {
            var url = place.photos[0].getUrl({'maxWidth': 200});
            contentString += '<div><img class="google-info-photo" src="'+url+'"></div>';
          }
          if(place.formatted_address){
            contentString += formateGoogleInfoLine('marker', place.formatted_address);
          }
          if(place.geometry) {
            console.log('('+place.geometry.location.lat()+', '+place.geometry.location.lng()+')');
            contentString += formateGoogleInfoLine('location', '('+place.geometry.location.lat().toFixed(3)+', '+place.geometry.location.lng().toFixed(3)+')');
          }
          if(place.opening_hours) {

            if(place.opening_hours.open_now) {
              contentString += formateGoogleInfoLine('time', 'OPEN NOW');
            } else {
              contentString += formateGoogleInfoLine('time', 'NOT OPEN');
            }
          }
          if(place.formatted_phone_number) {
            contentString += formateGoogleInfoLine('phone', place.formatted_phone_number);
          }
          if(place.website) {
            contentString += formateGoogleInfoLine('website', place.website);
          }
          contentString += '<footer class="additional-info-credit">' +
                            'Results provided by <cite><a href="https://developers.google.com/maps/web/">Google Maps API</a></cite>.' +
                            '</footer>';

      } else {
        contentString = '<div class="ajax-error">Something bad happended.</div>';
      }

      self.contentString(contentString);
    }

    function formateGoogleInfoLine(icon, text) {
      var icons = {
        'phone': '<i class="fa fa-phone" aria-hidden="true"></i>',
        'time': '<i class="fa fa-clock-o" aria-hidden="true"></i>',
        'marker': '<i class="fa fa-map-marker" aria-hidden="true"></i>',
        'location': '<i class="fa fa-location-arrow" aria-hidden="true"></i>',
        'website': '<i class="fa fa-globe" aria-hidden="true"></i>'
      };

      var contentString = '<div class="google-info-line">' +
                      '<span class="google-info-icon">' +
                        icons[icon] +
                      '</span>' +
                      '<span class="google-info-text">' + text +  '</span>' +
                      '</div>';
      return contentString;
    }
    function populateFlickr(infos) {
      var contentString;
      if(!infos){
        // request failed
        contentString = '<div class="ajax-error">Something bad happended.</div>';
      } else {
        contentString = infos.map(function(info) {
          // escape the title to prevent XSS attact
          var title = escapeHtml(info.title);
          return '<div class="flickr-item">' +
                    '<h3 class="flickr-item-header">' + title + '</h3>' +
                    '<a target="_blank" href="' +info.siteUrl+ '"' + 'title="' + title + '">' +
                    '<img class="flickr-item-img" src="' + info.sourceUrl + '" alt="' + title + '" >' +
                    '</a>' +
                 '</div>';
        }).join('');
        contentString += '<footer class="additional-info-credit">' +
                          'Disclaimer: <q cite="https://www.flickr.com/services/api/tos/">This product uses the Flickr API but is not endorsed or certified by Flickr.</q>' +
                          '</footer>';
      }
      self.contentString(contentString);
    }

    function populateWiki(infos) {
      console.log(infos);
      var contentString;
      if(!infos){
        // request failed
        contentString = '<div class="ajax-error">Something bad happended.</div>';
      } else {
        contentString = infos.map(function(info) {
          // escape the title to prevent XSS attact
          var title = escapeHtml(info.title),
              description = escapeHtml(info.description);
          return '<div class="wiki-item">' +
                    '<h3 class="wiki-item-header">' +

                    (info.siteUrl ?
                      '<a target="_blank" href="' +info.siteUrl+ '"' + 'title="' + title + '">' +
                      title + '</a>' : title
                    ) +

                    '</h3>' +

                    (info.thumbnail ?
                    '<img class="wiki-item-img" src="' + info.thumbnail.source + '" alt="' + title + '" >' : ''
                    ) +

                    (info.description ?
                    '<div class="wiki-item-description">' + description + '</div>' : ''
                    ) +
                 '</div>';
        }).join('');
        contentString += '<footer class="additional-info-credit">' +
                          'Results provided by <cite><a href="https://www.wikipedia.org/">Wikipedia</a></cite>.' +
                          '</footer>';
      }
      self.contentString(contentString);
    }
    function clearContent() {
      self.contentString('');
    }

  }

  function escapeHtml(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
  }


}
)(self);
