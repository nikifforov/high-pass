document.addEventListener('DOMContentLoaded', function() {

  //project tab
  document.querySelectorAll('.tab-btn').forEach(function(tabBtn) {
    tabBtn.addEventListener('click', function(event) {
      const path = event.currentTarget.dataset.path

      document.querySelectorAll('.project__wrapper').forEach(function(catalogMain) {
        catalogMain.classList.remove('grid-active')
      })
      document.querySelector(`[data-target="${path}"]`).classList.add('grid-active')

      document.querySelectorAll('.tab-btn').forEach(function(removeActive) {
        removeActive.classList.remove('active')
      })
      document.querySelector(`[data-path="${path}"]`).classList.add('active')
    })
  })

  // Валидатор формы
  new JustValidate('.about__form', {
    rules: {
      email: {
        required: false,
        email: true
      },
    },
    messages: {
      email: 'Недопустимый формат'
    }
  })

    // Валидатор формы
    // new JustValidate('.contacts__form', {
    //   rules: {
    //     name: {
    //       required: true,
    //       minLength: 2,
    //       maxLength: 30
    //     },
    //     email: {
    //       required: true,
    //       email: true
    //     },
    //     text: {
    //       required: true,
    //       minLength: 5,
    //       maxLength: 300
    //     }
    //   },
    //   messages: {
    //     name: 'Как Вас зовут?',
    //     email: 'Недопустимый формат',
    //     text: 'Оставьте комментарий',
    //   }
    // })

  // скролл по странице
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });

  // скролл по странице
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });

  //services tab
  document.querySelectorAll('.services__tab-btn').forEach(function(tabBtn) {
    tabBtn.addEventListener('click', function(event) {
      const path = event.currentTarget.dataset.path

      document.querySelectorAll('.services__tabs-wrapper').forEach(function(catalogMain) {
        catalogMain.classList.remove('services-active')
      })
      document.querySelector(`[data-target="${path}"]`).classList.add('services-active')

      document.querySelectorAll('.services__tab-btn').forEach(function(removeActive) {
        removeActive.classList.remove('active-btn')
      })
      document.querySelector(`[data-path="${path}"]`).classList.add('active-btn')
    })
  });

  // Карта
  var myMap;

  ymaps.ready(init);
  
  function init () {
      myMap = new ymaps.Map('map', {
          center: [55.761512, 37.624462],
          zoom: 14
          },
      );
          // Метка по адресу
      var myPlacemark = new ymaps.Placemark([55.769383, 37.638521], {}, {
          iconLayout: 'default#image',
          iconImageHref: 'images/map.svg',
          iconImageSize: [12, 12],
          iconImageOffset: [0, 0]
      });
      myMap.geoObjects.add(myPlacemark); 
      // Удаление не нужных модулей с карты
      myMap.controls.remove('searchControl');
      myMap.controls.remove('trafficControl');
      myMap.controls.remove('fullscreenControl');
      myMap.controls.remove('typeSelector');
      myMap.controls.remove('zoomControl');
      myMap.controls.remove('geolocationControl');
      myMap.controls.remove('rulerControl');
      
      // var zoomControl = new ymaps.control.ZoomControl({
      //     options: {
      //         size: "small",
      //         position: {
      //             top: 350,
      //             right: 10,
      //         }
      //     },
      // });
      // myMap.controls.add(zoomControl);
  
      // var geolocationControl = new ymaps.control.GeolocationControl({
      //     options: {
      //         position: {
      //             top: 416,
      //             right: 10,
      //         }
      //     },
      // });
      // myMap.controls.add(geolocationControl);
  };

  // Закрытие модального окна на карте
  document.querySelector('.contacts__address-btn').addEventListener('click', function() {
    document.querySelector('.contacts__address').classList.remove('contacts__address-active')
  });
})





    


