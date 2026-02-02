// public/js/init.js
import { apiKey, state } from './config.js';
import { renderCustomers } from './filters.js';

export async function loadCustomers() {
  try {
    const params = new URLSearchParams(window.location.search);
    const employeeID = params.get('employeeID');

    // 👉 Se tiver employeeID na URL, usamos; senão, tentamos buscar tudo.
    const url = employeeID
      ? `/api/clientes?employeeID=${encodeURIComponent(employeeID)}`
      : `/api/clientes`;

    console.log('[loadCustomers] GET', url);
    const { data } = await axios.get(url);

    // 👉 Seja tolerante ao formato (array direto, ou { results: [...] }, etc)
    const list =
      Array.isArray(data) ? data
      : Array.isArray(data?.results) ? data.results
      : Array.isArray(data?.items) ? data.items
      : [];

    if (!list.length) {
      console.warn('[loadCustomers] Nenhum cliente retornado ou formato inesperado:', data);
    }

    console.log('[loadCustomers] clientes', list);

    state.allCustomers = list;
    initApp();
  } catch (err) {
    console.error('Erro ao carregar clientes:', err);
    const clientList = document.getElementById("clientList");
    if (clientList) clientList.innerText = "Erro ao carregar clientes.";
  }
}

export function initApp() {
  const clientList = document.getElementById("clientList");
  if (clientList) {
    clientList.innerHTML = "";
    document.querySelector('.loading')?.classList.remove('loading');
  }

  state.platform = new H.service.Platform({ apikey: apiKey });
  const defaultLayers = state.platform.createDefaultLayers();

  state.map = new H.Map(
    document.getElementById("mapContainer"),
    defaultLayers.vector.normal.map,
    {
      center: { lat: -24.5, lng: -52 },
      zoom: 5,
      pixelRatio: window.devicePixelRatio || 1
    }
  );

  window.addEventListener("resize", () => state.map.getViewPort().resize());
  new H.mapevents.Behavior(new H.mapevents.MapEvents(state.map));
  state.ui = H.ui.UI.createDefault(state.map, defaultLayers);

  state.ui.removeControl('mapsettings');
  const ms = new H.ui.MapSettingsControl({
    baseLayers: [
      { label: 'normal', layer: defaultLayers.vector.normal.map },
      { label: 'satellite', layer: defaultLayers.raster.satellite.map },
      { label: 'terrain', layer: defaultLayers.raster.terrain.map }
    ],
    layers: []
  });
  state.ui.addControl('customized', ms);

  state.router = state.platform.getRoutingService(null, 8);

  renderCustomers();
}