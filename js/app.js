(function(global) {
  'use strict';

  var googleMaps,
      window = global.window,
      localStorage = window.localStorage,
      navigator = window.navigator,
      ko,
      searchBox,
      vmInfowindow, // viewmodel object
      vmSidebar,    // viewmodel object
      sidebarEle = global.document.querySelector('.sidebar'),
      // default configuration
      nmConfigUrl = 'js/nm_config.json';

  global.appInit = appInit;
  // // initialization when window loaded
  // window.addEventListener('load', init);

  // Initialize the app.
  // The main tasks are
  //  - instantiate viewmodels: vmSidebar, vmInfowindow
  //  - bind the vmSidebar to the sidbar element
  function appInit(status) {

    var defaultPlaces;

    ko = global.ko;
    vmSidebar = new VMSidebar();
    ko.applyBindings(vmSidebar, sidebarEle);

    if(status === 'failure') {
      vmSidebar.setState('fail');
      return;
    }

    // initialization
    googleMaps = global.googleMaps;
    searchBox = googleMaps.searchBox;
    getInfoService = global.getInfoService;
    // create the infowindow viewmodel
    vmInfowindow = new VMInfowindow();
    vmSidebar.checkIfLargeWindow();

    // If the localStorage contain the nm_markers,
    // retrive the nm_markers.
    // If not, make a ajax request to retrive the nm_config.json,
    // and add the default palces to the map.
    if(localStorage.nm_markers) {
      defaultPlaces = JSON.parse(localStorage.nm_markers);
      loadDefaultPlaces(defaultPlaces, vmSidebar);

      setTimeout(function(){vmSidebar.setState('done');}, 2000);
    } else {
      $.getJSON(nmConfigUrl)
        .done(function(res) {
          loadDefaultPlaces(res.places, vmSidebar);

        })
        .fail(function(jqXHR, textStatus, error) {
          vmSidebar.setState('loadDefaultIssue');
          console.error(textStatus);
        })
        .always(function(){

          setTimeout(function(){vmSidebar.setState('done');}, 2000);
        });
    }
  }

  function loadDefaultPlaces(places, vmSidebar) {
    if(places) {
      places.forEach(function(place) {
          vmSidebar.addMarker(place);
      });
      vmSidebar.setState('loadDefaultSuccess');
    }
  }

  // Store the infomation of a marker
  function MMarker(place) {
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

    self.state = ko.observable('pendding');
    // The filter keyword
    self.filter = ko.observable('');
    // indicate if it's a large window (innerwidth > 767px)
    self.largeWindow = ko.observable();
    // indicate if the sidebar should be expanded
    self.expanded = ko.observable(true);
    // indicate if the loading page should be hidden
    self.hideLoading = ko.observable(false);
    // The error message that is shown on the loading page
    self.loadingErrMsg = ko.observable();
    // The info message that is shown on the loading page
    self.loadingInfoMsg = ko.observable();
    // Words the user input to search for a place
    self.searchInput = ko.observable('');
    // Store all the markers
    self.markers = ko.observableArray([]);
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
    // set the state of the viewmodel
    self.setState = function(state) {
      if(state === 'fail') {
        self.state(state);
        self.loadingErrMsg('This page didn\'t load Google Maps correctly.');
        // return self;
      } else if (state === 'loadDefaultSuccess') {
        self.loadingInfoMsg('The default places loaded correctly.');
      } else if(state=== 'loadDefaultIssue') {
        self.loadingErrMsg('The default places aren\'t loaded correctly.');
      } else if(state === 'done') {
        // Add listener to places_changed event to get the search result
        searchBox.addListener('places_changed', function() {
          // Clean searchBox
          self.searchInput('');
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
        // When the window size changes, check if the window is large
        window.addEventListener('resize', self.checkIfLargeWindow);
        self.hideLoading(true);
        self.loadingErrMsg('');
        self.loadingInfoMsg('');
      }
    };

    // cause to toogle "expanded" class on the sidebar
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

    // Cause the map to center on the user's current location
    self.fitCurrentLocation = function() {
      if(navigator && navigator.geolocation) {
        self.loadingInfoMsg('find current location...');
        self.hideLoading(false);
        navigator.geolocation.getCurrentPosition(function(position) {
          centerMap({
            latlng: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          });
        self.hideLoading(true);
        });
      }

    };

    // center the map to the given marker, id or latlng
    // option must have marker, id, or latlng property
    function centerMap(option) {
      googleMaps.setCenter(option);
    }

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
      centerMap({id: id});
      googleMaps.triggerMarkerClick(id);
    };

    // When the filteredMarkers changes, change the markers on the map as well
    self.filteredMarkers.subscribe(function(newFilteredMarkers) {
      var ids = newFilteredMarkers.map(function(marker) {
        return marker.id();
      });
      googleMaps.showMarkers(ids);
    });




    // add a new marker from the `place` and push the marker into the markers array
    self.addMarker = function (place) {
      // Only add a new marker if a new place
      var id = place.place_id,
          marker;
      if(self.findMarker(id) === -1) {
        marker = new MMarker(place);
        self.markers.push(marker);
        // Store the markers to the localStorage
        self.storeMarkersToLocalStorage();
        // Add a new marker on the google map
        googleMaps.addMarker(marker);
        googleMaps.addMarkerClickListener(id, function(){
          markerClickCallback(marker);});
      } else {
        console.warn(place.name+" "+place.place_id+" already exist.");
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

    // When a marker is clicked, bounce the marker,
    // create content, set the content of the infowindow,
    // set the place of the vmInfowindow, bind the vmInfowindow to the infowindow.
    function markerClickCallback(marker) {
      var id = marker.id();
      var contentString = '<div class="info-window">' +
                            '<div class="info-header">' +
                              '<h2 class="info-title" data-bind="text: placeName">' + '</h2>' +
                              '<div class="info-nav">'+
                                '<ul class="info-btns-list">'+
                                  '<li>'+'<a href="#" data-bind="click: function(){getMoreInfo(\'google\');}, css: {active: sourceType() === \'google\'}">' + 'google' + '</a>'+'</li>'+
                                  '<li>'+'<a href="#" data-bind="click: function(){getMoreInfo(\'flickr\');}, css: {active: sourceType() === \'flickr\'}">' + 'flickr' + '</a>'+'</li>'+
                                  '<li>'+'<a href="#" data-bind="click: function(){getMoreInfo(\'wiki\')}, css: {active: sourceType() === \'wiki\'}">' + 'wiki' + '</a>'+'</li>'+
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


  }

  // Viewmodel for the infowindow
  function VMInfowindow() {
    var self = this;
    self.placeName = ko.observable(); // name of the place
    self.place_id = ko.observable();  // place_id of the place
    self.sourceType = ko.observable(''); // source type of the current info (google, flickr, wiki)

    // location of the place
    self.location = {
      lat: ko.observable(),
      lng: ko.observable()
    };

    // info content that is shown in the infowindow
    self.contentString = ko.observable('');

    // Set the place where the infowindow is about
    self.setPlace = function(marker){
      self.placeName(marker.name());
      self.place_id(marker.id());
      self.location.lat(marker.location.lat());
      self.location.lng(marker.location.lng());
      // clear previous content
      clearContent();
      // reset sourceType
      self.sourceType('');
      // get info from google
      self.getMoreInfo('google');
    };

    // get info from `type` (google, flickr, wiki)
    self.getMoreInfo = function(type) {
      // if the `type` info is already the current info, do nothng
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
          console.warn('unknow info type');
      }
    };

    // callback function for the googleMaps.placeService.getDetails
    // place is the info object
    // status indicates the status of the request
    function populateGoogle(place, status) {
      var contentString = '';
      if (status == google.maps.places.PlacesServiceStatus.OK) {
      // Set the content from the `place`, if status is OK
          if(place.photos) {
            var url = place.photos[0].getUrl({'maxWidth': 200});
            contentString += '<div><img class="google-info-photo" src="'+url+'"></div>';
          }
          if(place.formatted_address){
            contentString += formateGoogleInfoLine('marker', place.formatted_address);
          }
          if(place.geometry) {
            // console.log('('+place.geometry.location.lat()+', '+place.geometry.location.lng()+')');
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
      // otherwise, indicates some error message
        contentString = '<div class="ajax-error">Something bad happended.</div>';
      }

      self.contentString(contentString);
    }

    // Helper function
    // Return an html element string according to the `icon` and `text`
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

    // Callback function for the flickr request
    // infos = [{title:xxx, sourceUrl: xxx, siteUrl: xxx}]
    //       or = null
    function populateFlickr(infos) {
      var contentString;
      if(!infos){
        // request failed, show some error message
        contentString = '<div class="ajax-error">Something bad happended.</div>';
      } else {
        contentString = infos.map(function(info) {
          // escape the title to prevent XSS attact
          var title = escapeHTML(info.title);
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

    // callback for the wiki request
    // infos = [{siteUrl: xxx, thumbnail: xxx, title: xxx, description: xxx}]
    function populateWiki(infos) {
      // console.log(infos);
      var contentString;
      if(!infos){
        // request failed
        contentString = '<div class="ajax-error">Something bad happended.</div>';
      } else {
        contentString = infos.map(function(info) {
          // escape the title to prevent XSS attact
          var title = info.title ? escapeHTML(info.title) : '';
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
                    '<div class="wiki-item-description">' + info.description + '</div>' : ''
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

  // escape text to prevent XSS
  // Thanks to http://shebang.brandonmintern.com/foolproof-html-escaping-in-javascript/
  var ESC_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  function escapeHTML(s, forAttribute) {
      return s.replace(forAttribute ? /[&<>'"]/g : /[&<>]/g, function(c) {
          return ESC_MAP[c];
      });
  }


}
)(self);
