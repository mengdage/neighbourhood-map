(function(global) {
  'use strict';

  global.getInfoService = {
    getFlickrInfo: getFlickrInfo,
    getWikiInfo: getWikiInfo
  };

  // Get resource from Flickr about the `place`(lat, lng).
  // The `callback` is called with the result.
  // If successful, the result will be an array of informations (title, sourceUrl, siteUrl);
  // If failed, the result will be null.
  function getFlickrInfo(callback, place) {
    var endpoint = 'https://api.flickr.com/services/rest/',
        photoSourceUrl = 'https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_m.jpg', // url to the photo
        photoUrl = 'https://www.flickr.com/photos/{user-id}/{photo-id}'; // url to the photo on flickr

    // check callback is a function
    if(typeof callback !== 'function') {
      return;
    }
    // check place has been passed and has lat and lng
    if(!place || !place.lat || !place.lng) {
      console.warn('Insufficient information. Make sure pass in a object with lat and lng as the second param');
      return;
    }
    var infos;
    $.get({
      url: endpoint,
      data:{
        api_key: 'd290d164ee1e850fc0e893a9d0a83d45',
        method: 'flickr.photos.search',
        format: 'json',
        content_type: 1,
        radius: 5,
        text: place.name,
        lat: place.lat,
        lon: place.lng,
        nojsoncallback: 1,
        per_page: 10

      },
      dataType: 'json'
    })
      .done(function(data) {
        var content,
            photos, // the photos array return from Flickr search api
            sourceUrl, // photo source url for one photo
            siteUrl, // url to the photo on Flick
            // params needed to construct a source URL to a photo
            farmId,
            serverId,
            id,
            owner,
            secret;
        infos = [];
        if(!data.photos) {
          content = '<p>not found!</p>';
        } else {
          photos = data.photos.photo;
          photos.forEach(function(photo) {
            farmId = photo.farm;
            serverId = photo.server;
            id = photo.id;
            secret = photo.secret;
            owner = photo.owner;
            // construct a valid source URL to a photo
            // https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_m.jpg
            sourceUrl = photoSourceUrl.replace('{farm-id}', farmId)
                                      .replace('{server-id}', serverId)
                                      .replace('{id}', id)
                                      .replace('{secret}', secret);
            // Construct a url to a photo on flickr
            // https://www.flickr.com/photos/{user-id}/{photo-id}
            siteUrl = photoUrl.replace('{user-id}', owner)
                              .replace('{photo-id}', id);

            infos.push({
              title: photo.title,
              sourceUrl: sourceUrl,
              siteUrl: siteUrl
            });
          });
        }
      })
      .fail(function(jqXHR, textStatus, error) {
        console.error(textStatus);
        // When failed, just set the result to null so that the callback is called with null
        infos = null;
      })
      .always(function(){
        callback(infos);
      });
  }

  // Get resource from wikipedia bout the `place`(lat, lng).
  // The `callback` is called with the result.
  // If successful, the result will be an array of informations
  // (siteUrl, thumbnail, title, description);
  // If failed, the result will be null.
  function getWikiInfo(callback, place) {
    // check callback is a function
    if(typeof callback !== 'function') {
      console.warn('callback is not a function');
      return;
    }
    var endPoint = 'https://en.wikipedia.org/w/api.php',
        results;

    $.ajax({
      url: endPoint,
      dataType: 'jsonp',
      data: {
        action: 'query',
        format: 'json',
        prop: 'coordinates|pageimages|pageterms|info',
        generator: 'geosearch',
        formatversion: 2,
        colimit: 5,
        piprop: 'thumbnail',
        pithumbsize: 144,
        pilimit: 5,
        wbptterms: 'description',
        inprop: 'url',
        ggscoord: place.lat+'|'+place.lng,
        ggsradius: 10000,
        ggslimit: 5
      }
    })
    .done(function(data) {
      if(data.query && data.query.pages) {
        results = data.query.pages
                  .map(function(page) {
                    return {
                      siteUrl: page.fullurl,
                      thumbnail: page.thumbnail,
                      title: page.title,
                      description: page.terms ? page.terms.description : undefined
                    };
                  });
      }
    })
    .fail(function() {
      // When failed, just set the result to null so that the callback is called with null
      results = null;
    })
    .always(function() {
      callback(results);
    });
  }
})(self);
