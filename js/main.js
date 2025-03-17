// Definir la projecció EPSG:25831
proj4.defs("EPSG:25831", "+proj=utm +zone=31 +datum=ETRS89 +units=m +no_defs");
ol.proj.proj4.register(proj4);

// Capes
const mylayers = [
  new ol.layer.Group({
    title: 'Mapes base',
    layers: [
      new ol.layer.Tile({
        title: 'Base ortofoto (ICGC)',
        type: 'base',
        opacity: 0.5,
        visible: false,
        source: new ol.source.TileWMS({
          url: 'https://geoserveis.icgc.cat/servei/catalunya/mapa-base/wms?LAYERS=orto',
          params: {
            'FORMAT': 'image/png',
            'VERSION': '1.3.0',
            'CRS': 'EPSG:3857'
          },
          attributions: new ol.Attribution({
            html: '© <a href="https://www.icgc.cat/">Institut Cartogràfic i Geològic de Catalunya (ICGC)</a>, sota llicència <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>'
          })
        })
      }),
      new ol.layer.Tile({
        title: 'Base topogràfica (OSM)',
        type: 'base',
        opacity: 0.5,
        source: new ol.source.OSM()
      }),
    ]
  }),
];

// Definició de l'extensió del mapa
const extent = [
  -10985.229990461823, 4922300.423114612,
  398176.8700029906, 5307510.564674153
];

// Creació del mapa
const map = new ol.Map({
  target: 'map',
  layers: mylayers,
  view: new ol.View({
    center: [195266.7433148799, 5115018.312157585],
    zoom: 8,
    extent: extent
  }),
  controls: ol.control.defaults.defaults().extend([
    new ol.control.OverviewMap({
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM()
        })
      ]
    })
  ])
});

//Definició del control LayerSwitcher
const layerSwitcher = new LayerSwitcher({
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


// Capa de límits comarcals
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
    format: new ol.format.GeoJSON(),
    strategy: ol.loadingstrategy.bbox
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

// Capa d'estacions automàtiques
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

// Interacció de selecció
const selectStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'red'
  })
});

const selectInteraction = new ol.interaction.Select({
  condition: ol.events.condition.click,
  layers: [estacions_automatiques_catalunya],
  style: selectStyle
});

map.addInteraction(selectInteraction);

// Creació del pop-up
const popup_form = new ol.Overlay({
  element: document.getElementById('popup_container'),
  position: undefined
});
map.addOverlay(popup_form);

function amagarPopup() {
  posicionarPopup(undefined);
}

function posicionarPopup(posicio) {
  const popup = document.getElementById('popup_container');
  if (posicio) {
    popup.style.display = 'block';
    popup_form.setPosition(posicio);
  } else {
    popup.style.display = 'none';
  }
}

function mostrarAtributs(feature) {
  const geometry = feature.getGeometry();
  const coordinates = geometry.getCoordinates();

  document.getElementById('INDICATIVO').innerText = feature.get('INDICATIVO');
  document.getElementById('NOMBRE').innerText = feature.get('NOMBRE');
  document.getElementById('PROVINCIA').innerText = feature.get('PROVINCIA');
  document.getElementById('ALTITUD').innerText = feature.get('ALTITUD');
  document.getElementById('TIPO').innerText = feature.get('TIPO');

  posicionarPopup(coordinates);
}

selectInteraction.on('select', function (evt) {
  amagarPopup();
  if (evt.selected.length) {
    const feature = evt.selected[0];
    mostrarAtributs(feature);
  }
});

document.getElementById("tancar_formulari").addEventListener("click", tancar_formulari, false);

function tancar_formulari() {
  amagarPopup();
  eliminarSeleccio();
}

function eliminarSeleccio() {
  selectInteraction.getFeatures().clear();
}
