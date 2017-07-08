(function(global) {
  'use strict';

  global.getInfo = {
    flickrInfo: flickrInfo
  };

  // place: {lat: 123, lng: 123}
  function flickrInfo(callback, place) {
    var endpoint = 'https://api.flickr.com/services/rest/',
        photoSourceUrl = 'https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_m.jpg';

    // check callback is a function
    if(typeof callback !== 'function') {
      console.warn('callback is not a function');
      return;
    }
    // check place has been passed and has lat and lng
    if(!place || !place.lat || !place.lng) {
      console.log(place);
      console.warn('Insufficient information. Make sure pass in a object with lat and lng as the second param');
      return;
    }

    $.get({
      url: endpoint,
      data:{
        api_key: 'd290d164ee1e850fc0e893a9d0a83d45',
        method: 'flickr.photos.search',
        format: 'json',
        content_type: 1,
        radius: 5,
        lat: place.lat,
        lon: place.lng,
        nojsoncallback: 1,
        per_page: 10

      },
      dataType: 'json'
    })
      .done(function(data) {
        console.log(data);
        var content,
            photos, // the photos array return from Flickr search api
            sourceUrl, // photo source url for one photo
            // params needed to construct a source URL to a photo
            farmId,
            serverId,
            id,
            secret,
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
            // construct a valid source URL to a photo
            // https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_m.jpg
            sourceUrl = photoSourceUrl.replace('{farm-id}', farmId)
                                      .replace('{server-id}', serverId)
                                      .replace('{id}', id)
                                      .replace('{secret}', secret);

            infos.push({
              title: photo.title,
              sourceUrl: sourceUrl
            });
          });
        }
        callback(infos);
      });
  }

})(self);
