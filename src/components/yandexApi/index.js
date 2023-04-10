import { mkad_coords } from './mkad-coords'
export default function init() {
  let address = '';
  let myPlacemark,
    myMap = new ymaps.Map('map', {
      center: [55.753994, 37.622093],
      zoom: 9
    }, {
      searchControlProvider: 'yandex#search'
    });
  let mkad_polygon = new ymaps.Polygon(mkad_coords);
  myMap.geoObjects.add(mkad_polygon);
  
  myMap.events.add('click', function (e) {
    let coords = e.get('coords');

    if (myPlacemark) {
      myPlacemark.geometry.setCoordinates(coords);
    }
    else {
      myPlacemark = createPlacemark(coords);
      myMap.geoObjects.add(myPlacemark);
      myPlacemark.events.add('dragend', function () {
        getAddress(myPlacemark.geometry.getCoordinates());
      });
    }
    getAddress(coords);
  });

  function createPlacemark(coords) {
    return new ymaps.Placemark(coords, {
      iconCaption: 'поиск...'
    }, {
      preset: 'islands#violetDotIconWithCaption',
      draggable: true
    });
  }

  function getAddress(coords) {
    
    myPlacemark.properties.set('iconCaption', 'поиск...');
    ymaps.geocode(coords).then(function (res) {
      let firstGeoObject = res.geoObjects.get(0);
      
      
      myPlacemark.properties
        .set({
          iconCaption: [
            firstGeoObject.getLocalities().length ? firstGeoObject.getLocalities() : firstGeoObject.getAdministrativeAreas(),
            firstGeoObject.getThoroughfare() || firstGeoObject.getPremise()
          ].filter(Boolean).join(', '),
          balloonContent: firstGeoObject.getAddressLine()
          
        });
        
      findDistance();

    });
  }

  function findDistance() {
    let arPlacemark = [];
    console.log(mkad_coords[0].length)
    for (let i = 0; i < mkad_coords[0].length; i++) {
      
      arPlacemark[i] = new ymaps.Placemark(mkad_coords[0][i]);
    }
    let result = ymaps.geoQuery(arPlacemark).addToMap(myMap).setOptions('visible', false);
    let closestObj = result.getClosestTo(myPlacemark);
    let closestPlacemark = new ymaps.Placemark(closestObj.geometry.getCoordinates(), {
      balloonContentHeader: 'Расстояние',
      balloonContentBody: 'body'
    }, {
      iconLayout: 'default#image',

    });
    myMap.geoObjects.removeAll();
    myMap.geoObjects.add(closestPlacemark);
    ymaps.route([
      myPlacemark.geometry.getCoordinates(),
      closestObj.geometry.getCoordinates()
    ]).then(function (route) {
      myMap.geoObjects.add(route);
      let routeDistance = Math.round(route.getLength() / 1000);
      let distanceLine = new ymaps.Polyline([
        myPlacemark.geometry.getCoordinates(),
        closestObj.geometry.getCoordinates()
      ]);
      myMap.geoObjects.add(distanceLine);

      let airDistance = Math.round(ymaps.coordSystem.geo.getDistance(
        closestObj.geometry.getCoordinates(), myPlacemark.geometry.getCoordinates()) / 1000);
      address = myPlacemark.properties._data.balloonContent;
      console.log(`адрес: ${address}`);
      console.log(`маршрут: ${routeDistance}км`);
      console.log(`расстояние по прямой: ${airDistance}км`);
      closestPlacemark.properties.set(
        'balloonContentBody', `маршрут ${routeDistance}км,
         по воздуху ${airDistance}км`);
      closestPlacemark.balloon.open();
    })
  }
}
