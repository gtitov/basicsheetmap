mapboxgl.accessToken = 'pk.eyJ1IjoiZ2hlcm1hbnQiLCJhIjoiY2pncDUwcnRmNDQ4ZjJ4czdjZXMzaHZpNyJ9.3rFyYRRtvLUngHm027HZ7A'; //Mapbox token 
var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/streets-v11', // YOUR TURN: choose a style: https://docs.mapbox.com/api/maps/#styles
    center: [57.411, 37.785], // starting position [lng, lat]
    zoom: 7,// starting zoom
    // transformRequest: transformRequest
});

document.addEventListener('DOMContentLoaded', function () {
    fetch('https://docs.google.com/spreadsheets/d/1TFTTbV7ppvEDRZtQOTzGK7vWPim30UqUzs3iJEY_E2Q/gviz/tq?tqx=out:csv&sheet=Sheet1')
        .then(response => response.text())
        .then(csvData => makeGeoJSON(csvData));



    function makeGeoJSON(csvData) {
        csv2geojson.csv2geojson(csvData, {
            latfield: 'Latitude',
            lonfield: 'Longitude',
            delimiter: ','
        }, function (err, data) {
            map.on('load', function () {

                //Add the the layer to the map
                map.addLayer({
                    'id': 'csvData',
                    'type': 'circle',
                    'source': {
                        'type': 'geojson',
                        'data': data
                    },
                    'paint': {
                        'circle-radius': 5,
                        'circle-color': "purple"
                    }
                });


                // When a click event occurs on a feature in the csvData layer, open a popup at the
                // location of the feature, with description HTML from its properties.
                map.on('click', 'csvData', function (e) {
                    var coordinates = e.features[0].geometry.coordinates.slice();

                    //set popup text
                    //You can adjust the values of the popup to match the headers of your CSV.
                    // For example: e.features[0].properties.Name is retrieving information from the field Name in the original CSV.
                    var properties = e.features[0].properties

                    //handle multiple images
                    var images = properties.Image.split(";")
                    var slides = images.length > 1 ? '<div class="splide"><div class="splide__track"><ul class="splide__list">' + images.map(image => `<li class="splide__slide"><img src="${image}"></li>`).join("") + '</ul></div></div>' : `<img src="${images[0]}">`

                    var description =
                        `<h3>${properties.Title}</h3>
                        ${slides}
                        <p>${properties.Description}</p>`

                    // Ensure that if the map is zoomed out such that multiple
                    // copies of the feature are visible, the popup appears
                    // over the copy being pointed to.
                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }

                    //add Popup to map

                    new mapboxgl.Popup()
                        .setLngLat(coordinates)
                        .setHTML(description)
                        .addTo(map);
                        
                    //init gallery after it rendered if there is a need for one
                    if (images.length > 1) new Splide( '.splide' ).mount()
                });

                // Change the cursor to a pointer when the mouse is over the places layer.
                map.on('mouseenter', 'csvData', function () {
                    map.getCanvas().style.cursor = 'pointer';
                });

                // Change it back to a pointer when it leaves.
                map.on('mouseleave', 'places', function () {
                    map.getCanvas().style.cursor = '';
                });
            });

        });
    };
}, false);