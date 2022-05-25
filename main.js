mapboxgl.accessToken = 'pk.eyJ1Ijoidm9sdHVzeWEiLCJhIjoiLWhKZzhqWSJ9.X9CseVENK_v1Z9oF4T6Rkg'; // <-- PUT YOUR MAPBOX ACCESSTOKEN
var map = new mapboxgl.Map({
    container: 'map', // container id 
    style: 'mapbox://styles/voltusya/cl26ccksv000114pc1gg63jsf', // YOUR TURN: choose a style: https://docs.mapbox.com/api/maps/#styles
    center: [37.625, 55.751], // starting position [lng, lat]
    zoom: 5, // starting zoom
    maxZoom: 10
});

map.scrollZoom.disable();
map.addControl(new mapboxgl.NavigationControl({
        showCompass: false
    }),
'bottom-right');

document.addEventListener('DOMContentLoaded', function () {

    fetch('https://docs.google.com/spreadsheets/d/1DmxeJff1bqYY-VgeRuyr9fmfNldNcNfIaCQEjT9j7Yc/gviz/tq?tqx=out:csv&sheet=Лист1')  // for testing (latfield: 'lat', lonfield: 'lon')
        .then(response => response.text())
        .then(csvData => makeMap(csvData));



    function makeMap(csvData) {
        csv2geojson.csv2geojson(csvData, {
            latfield: 'lat',
            lonfield: 'lon',
            delimiter: ','
        }, function (err, data) {  // Callback after data loaded and transformed
            map.on('load', function () {
                // console.log(data)
                map.addSource('vacancies', {
                    type: 'geojson',
                    data: data,
                    cluster: true,
                    clusterRadius: 20 // Radius of each cluster when clustering points (defaults to 50)
                });

                // Add the the layer to the map
                // Clusters
                map.addLayer({
                    'id': 'clusters',
                    'source': 'vacancies',
                    'type': 'circle',
                    'paint': {
                        'circle-color': '#fae67f',
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#FFFFFF',
                        'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            10,
                            3,
                            20,
                            6,
                            30
                        ]
                    }
                });

                // Cluster labels
                map.addLayer({
                    id: 'cluster-count-labels',
                    type: 'symbol',
                    source: 'vacancies',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': '{point_count_abbreviated}',
                        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                        'text-size': 12
                    }
                });

                // When a click event occurs on a feature in the clusters layer, open a modal
                map.on('click', 'clusters', function (e) {
                    // console.log(e)
                    // DOCS: https://docs.mapbox.com/mapbox-gl-js/api/sources/#geojsonsource#getclusterleaves
                    const features = map.queryRenderedFeatures(e.point, {
                        layers: ['clusters']
                    });
                    console.log(features)
                    if (!features[0].properties.cluster_id) {  // if point is not within a cluster it has no cluster_id
                        var unclusteredFeature = features[0]
                        // console.log(clusteredFeatures)
                        document.getElementById("inside-modal").innerHTML = `<a href="${unclusteredFeature.properties["Ссылка на сайте Картетики"]}" target="_blank" class="list-group-item py-3 lh-tight">
                            <div class="d-flex w-100 align-items-center justify-content-between">
                                ${unclusteredFeature.properties.Вакансия}
                            </div>
                            <div class="col-10 mb-1 small text-muted">${unclusteredFeature.properties.Работодатель}</div>
                            <div class="col-10 mb-1 small text-muted">Подробнее</div>
                        </a>`
                    } else {
                        const clusterId = features[0].properties.cluster_id;
                        const pointCount = features[0].properties.point_count;
                        const clusterSource = map.getSource('vacancies');


                        clusterSource.getClusterLeaves(clusterId, pointCount, 0, (error, clusteredFeatures) => {
                            // console.log(clusteredFeatures)
                            document.getElementById("inside-modal").innerHTML = ""
                            clusteredFeatures.forEach(feature => {
                                document.getElementById("inside-modal").innerHTML +=
                                    `<a href="${feature.properties["Ссылка на сайте Картетики"]}" target="_blank" class="list-group-item py-3 lh-tight">
                                        <div class="d-flex w-100 align-items-center justify-content-between">
                                            ${feature.properties.Вакансия}
                                        </div>
                                        <div class="col-10 mb-1 small text-muted">${feature.properties.Работодатель}</div>
                                        <div class="col-10 mb-1 small text-muted">Подробнее</div>
                                    </a>`
                            });
                        });
                    }

                    modalInteractive.show()
                });

                // Change the cursor to a pointer when the mouse is over the places layer.
                map.on('mouseenter', 'clusters', function () {
                    map.getCanvas().style.cursor = 'pointer';
                });

                // Change it back to a pointer when it leaves.
                map.on('mouseleave', 'clusters', function () {
                    map.getCanvas().style.cursor = '';
                });

                // List
                // DOCS: https://getbootstrap.com/docs/5.0/examples/sidebars/
                document.getElementById("list").innerHTML = data.features.map(
                    feature =>
                        `<a href="#" class="list-group-item py-3 lh-tight" data-coords="${feature.geometry.coordinates}" onclick="map.flyTo({center: this.getAttribute('data-coords').split(','),zoom: 10})">
                            <div class="d-flex w-100 align-items-center justify-content-between">
                                ${feature.properties.Вакансия}
                            </div>
                            <div class="col-10 mb-1 small text-muted">${feature.properties.Работодатель}</div>
                        </a>`
                ).join("")



                // Modal
                var modalInteractive = new bootstrap.Modal(document.getElementById("popup-modal"), {
                    keyboard: false
                })
            });

        });
    };
}, false);


