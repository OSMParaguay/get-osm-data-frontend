let map = null;
let marcador = null;

function loadMap() {
  // Asuncion - Paraguay.
  const longitud = -57.6309129;
  const latitud = -25.2961407;

  const zoom = 10;
  const minZoom = 0;
  const maxZoom = 18;

  map = new L.map("map", {
    center: [latitud, longitud],
    zoom: zoom,
    minZoom: minZoom,
    maxZoom: maxZoom,
    fullscreenControl: true,
    scrollWheelZoom: true,
    fullscreenControlOptions: {
      position: "topleft",
    },
  });

  // Humanitarian Style.
  const url = "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
  L.tileLayer(url, {
    maxZoom: 18,
    attribution:
      'Data \u00a9 <a href="http://www.openstreetmap.org/copyright">' +
      "OpenStreetMap Contributors </a> Tiles \u00a9 HOT",
  }).addTo(map);

  marcador = new L.marker([latitud, longitud], {
    id: "ubicacion",
    draggable: "true",
  });
  map.addLayer(marcador);

  const updateMarkerPosition = (marker, latLng) => {
    marker.setLatLng(latLng, { draggable: true });
    map.panTo(latLng);
    document.getElementById("user_lat").value = latLng.lat;
    document.getElementById("user_lng").value = latLng.lng;
    fetchData();
  };

  marcador.on("dragend", function (e) {
    const position = e.target.getLatLng();
    updateMarkerPosition(e.target, position);
  });

  map.on("click", function (e) {
    const latLng = e.latlng;
    updateMarkerPosition(marcador, latLng);
  });

  map.on('locationfound', function (e) {
    const position = e.latlng;
    locateControl.stop()
    updateMarkerPosition(marcador, position);
  });

  agregarBuscador();

  const locateControl = L.control.locate();
  locateControl.addTo(map);
}

const agregarBuscador = () => {
  const geocoderOptions = {
    geocodingQueryParams: {
      countrycodes: "PY",
    },
  };
  const geocoder = L.Control.Geocoder.nominatim(geocoderOptions);
  const geocoderControl = L.Control.geocoder({
    defaultMarkGeocode: false,
    position: "topleft",
    query: "Pilar",
    placeholder: "Buscar...",
    geocoder,
  });

  geocoderControl.on("markgeocode", (event) => {
    const center = event.geocode.center;
    marcador.setLatLng(center);
    map.setView(center, 18);
  });

  geocoderControl.addTo(map);
};

const fetchData = async () => {
  const URL = "http://localhost:4000/api/location/v1/reverse";
  const latitude = document.getElementById("user_lat").value;
  const longitude = document.getElementById("user_lng").value;

  try {
    const response = await fetch(`${URL}/${longitude}/${latitude}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(`Server error!`);
    }

    const { data } = json;
    setForm(data);
  } catch (error) {
    console.error(error);
  }
};

const setForm = (data) => {
  const { osm_id, osm_type, address = {}, lat, lon } = data || {};
  const { road = "", neighbourhood, city, state, country } = address;
  const coordinates = [lat, lon].filter(Boolean).join(", ");

  document.getElementById("road").value = road;
  document.getElementById("neighbourhood").value =
    neighbourhood || address.suburb || address.quarter || "";
  document.getElementById("city").value =
    city || address.city || address.town || address.village || "";
  document.getElementById("state").value = state || address.state || "";
  document.getElementById("country").value = country || address.country || "";
  document.getElementById("coordinates").value = coordinates;
  document.getElementById("osmId").value = osm_id;
  document.getElementById("osmType").value = osm_type;

  const link = document.getElementById("osmLinkEdition");
  link.href = createLinkOSM(osm_id, osm_type);
  link.style.display = link.href ? "inline" : "none";
};

const createLinkOSM = (osm_id, osm_type) => {
  const validTypes = ["way", "relation", "node"];
  const url = "https://www.openstreetmap.org/edit?";

  if (validTypes.includes(osm_type)) {
    return `${url}${osm_type}=${osm_id}`;
  }

  return null;
};
