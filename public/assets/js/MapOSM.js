let map = null;
let marcador = null;

function loadMap() {
  // Asuncion - Paraguay.
  const longitud = -57.6309129;
  const latitud = -25.2961407;

  const zoom = 10;
  const minZoom = 6;
  const maxZoom = 18;

  map = new L.map("map", {
    center: [latitud, longitud],
    zoom: zoom,
    minZoom: minZoom,
    maxZoom: maxZoom,
    fullscreenControl: true,
    scrollWheelZoom: false,
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

  marcador.on("dragend", function (e) {
    const marker = e.target;
    const position = marker.getLatLng();
    const lat = position.lat;
    const lng = position.lng;
    const lat_lng = new L.LatLng(lat, lng);

    marker.setLatLng(lat_lng, {
      draggable: "true",
    });
    map.panTo(lat_lng);

    document.getElementById("user_lat").value = lat;
    document.getElementById("user_lng").value = lng;

    fetchData();
  });

  agregarBuscador();
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
  const URL = "https://nominatim.openstreetmap.org/reverse";
  const latitude = document.getElementById("user_lat").value;
  const longitude = document.getElementById("user_lng").value;
  const zoom = 18;
  const params = new URLSearchParams({
    format: "json",
    addressdetails: 1,
    zoom,
    lat: latitude,
    lon: longitude,
  });
  try {
    const response = await fetch(`${URL}?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    setForm(data);
  } catch (error) {
    console.error(error);
  }
};

const setForm = (data) => {
  const { address, lat, lon } = data || {};
  const {
    road = "",
    neighbourhood = address?.neighbourhood ||
      address?.suburb ||
      address?.quarter ||
      "",
    city = address?.city || address?.town || address?.village || "",
    state = address?.state || "",
    country = address?.country || "",
  } = address || {};
  const coordinates = [lat, lon].filter(Boolean).join(", ");

  document.getElementById("inputCalle").value = road;
  document.getElementById("inputBarrio").value = neighbourhood;
  document.getElementById("inputCiudad").value = city;
  document.getElementById("inputDepartamento").value = state;
  document.getElementById("inputPais").value = country;
  document.getElementById("inputCoordenadas").value = coordinates;
};
