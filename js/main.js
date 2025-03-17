//Definir la projecció EPSG:25831
proj4.defs("EPSG:25831", "+proj=utm +zone=31 +datum=ETRS89 +units=m +no_defs");
register(proj4);

//Capes
const mylayers = [
  new ol.layer.Group({
    'title': 'Mapes base',
    layers: [
      //Primera capa base (OSM)
	   new ol.layer.Tile({
        title: 'Base ortofoto (ICGC)', //Títol de la capa
        type: 'base', //Tipus de capa
        opacity: 0.5,
        visible: false,
        source: new ol.source.TileWMS({
          url: 'https://geoserveis.icgc.cat/servei/catalunya/mapa-base/wms?LAYERS=orto', //URL del servei WMS de l'ICGC
          params: {
            'FORMAT': 'image/png',
            'VERSION': '1.3.0',
            'SRS': 'EPSG:3857' //Sistema de coordenades
          },
          attributions: [
            '© <a href="https://www.icgc.cat/">Institut Cartogràfic i Geològic de Catalunya (ICGC)</a>',
            'Ortofoto de Catalunya de l’Institut Cartogràfic i Geològic de Catalunya (ICGC), sota una llicència CC BY 4.0.',
            '© <a href="https://catnet-ip.icgc.cat/SBC/Account/ReadTermsOfUse">Condicions d\'ús de l\'ICGC</a>'
          ]
        })
	   }),
      //Segona capa base (ICGC)
      new ol.layer.Tile({
        title: 'Base topogràfica (OSM)',
        type: 'base', //Tipus de capa
	opacity: 0.5,
        source: new ol.source.OSM()
      }),
    ]
  }),
];

//Definició de la constiable extent (extensió del mapa) i la constiable map, que allotjarà el nostre mapa
const extent = [
-10985.229990461823, 4922300.423114612, //Cantonada esquerre inferior
398176.8700029906, 5307510.564674153 //Cantonada dreta superior
];

const map = new ol.Map({
  target: 'map',
  layers: mylayers, //Les capes han estat definides anteriorment
  view: new ol.View({
    center: [195266.7433148799, 5115018.312157585], //EPSG:3857
    zoom: 8,
	extent: extent
  }),
  
//S'afegeix el control OverviewMap extenent els controls per defecte
   controls: defaultControls().extend([
      new ol.control.OverviewMap({
	   layers: [
         new TileLayer({
           source: new ol.source.OSM()
         })
       ]
      })
   ])
})

//Definició del control LayerSwitcher
const layerSwitcher = new ol.control.LayerSwitcher({
  tipLabel: 'Llegenda',
});

//Addició del control al mapa
map.addControl(layerSwitcher);

//Eliminar el botó de col·lapse si existeix
window.onload = function() {
  //Trobar el botó de col·lapse per títol i eliminar-lo
  const collapseButton = document.querySelector('.layer-switcher button[title="Collapse legend"]');
  if (collapseButton) {
    collapseButton.remove(); //Eliminar completament el botó
  }
};

//El mostrem desplegat
layerSwitcher.showPanel();

//Afegim la selecció d'entitats
const selectInteraction = new Select();

//Addició de la capa 'limits_comarcals' al visor
const limits_comarcals = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: () => `
            https://geoserveis.icgc.cat/servei/catalunya/divisions-administratives/wfs?
            service=WFS&
            version=2.0.0&
            request=GetFeature&
            typeName=divisions_administratives_wfs:divisions_administratives_comarques_5000&
            outputFormat=geojson&
            srsname=EPSG:25831
        `.replace(/\s+/g, ''),
        format: new GeoJSON(),
        strategy: olLoadingstrategy.bbox
    }),
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'black',
            width: 0.25
        }),
        fill: new ol.style.Fill({
            color: 'rgba(0, 0, 0, 0)'
        })
    })
});

map.addLayer(limits_comarcals);

//Addició de la capa 'estacions_automatiques_catalunya' al visor
const estacions_automatiques_catalunya = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: './geojson/estacions_automatiques_catalunya.geojson',
        format: new ol.format.GeoJSON()
    }),
    style: new ol.style.Style({
        image: new ol.style.Circle({ 
            radius: 6, 
            fill: new ol.style.Fill({
                color: 'cornflowerblue' 
            }),
            stroke: new ol.style.Stroke({
                color: 'white', 
                width: 2
            })
        })
    })
});

map.addLayer(estacions_automatiques_catalunya);

//Definició de l'estil de les entitats seleccionades
   const selectStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
        color: 'red'
        })
    });

    //Definició de la interacció
    selectInteraction = new ol.interaction.Select({
        condition: ol.events.condition.click,
        layers: [estacions_automatiques_catalunya],
        style: selectStyle
    });

    // Afegim la interacció al mapa
    map.addInteraction(selectInteraction);
		
    //Afegir a la interacció una escolta d'events de tipus “select”
    //per que executi la funció corresponent
    selectInteraction.on('select', function (evt) {
        //Amagar temporalment el pop-up
        amagarPopup();
        //Si es selecciona una entitat
        if (evt.selected.length) {
            //Obtenir les dades de l'entitat seleccionada
            const feature = evt.selected[0];
            //Mostra les dades al pop-up
            mostrarAtributs(feature);
        }
    });
	
//Creació del pop-up
const popup_form = new ol.Overlay({
  element: document.getElementById('popup_container'),
  position: undefined
})

map.addOverlay(popup_form);

function amagarPopup() {
  posicionarPopup(undefined);
}

function posicionarPopup(posicio) {
  const popup = document.getElementById('popup_container');
  if (posicio) {
    popup.style.display = 'block';  //Mostrar el pop-up
    popup_form.setPosition(posicio);
  } else {
    popup.style.display = 'none';  //Amagar el pop-up
  }
}

function mostrarAtributs(feature) {
  const geometry = feature.getGeometry();
  const coordinates = geometry.getCoordinates();
  
  //Obtenir el formulari amb les propietats de l'objecte feature
  const formulari = document.forms['popup_form'];
  document.getElementById('INDICATIVO').innerText = feature.get('INDICATIVO');
  document.getElementById('NOMBRE').innerText = feature.get('NOMBRE');
  document.getElementById('PROVINCIA').innerText = feature.get('PROVINCIA');
  document.getElementById('ALTITUD').innerText = feature.get('ALTITUD');
  document.getElementById('TIPO').innerText = feature.get('TIPO');

  //Posicionar l'overlay sobre l'EMA seleccionada
  posicionarPopup(coordinates);
}

//Captura l'event 'clic' al botó amb id = tancar_formulari i executa la funció tancar_formulari()
document.getElementById ("tancar_formulari").addEventListener ("click", tancar_formulari, false);

function tancar_formulari() {
  //Amaga el contenidor HTML
  amagarPopup();
  //Elimina la selecció del camí forestal
  eliminarSeleccio();
}

function eliminarSeleccio() {
  selectInteraction.getFeatures().clear();
}
