// js/config.js
export const apiKey = 'cn1jsr6t-Av8fGyDYWosAqeKHK7HsEAMCVG5PWs0ILQ';


export const statusColors = {
  "CRESCENDO": "green",
  "ESTAVEL": "yellow",
  "QUEDA": "red",
  "INATIVO": "gray",
  "SEMVARIACAO": "gray",
};

export const state = {
  salesCloudURL: null,
  allCustomers: [],
  showOnlySelected: false,
  isShowPolygonActions: false,
  map: null,
  platform: null,
  ui: null,
  router: null,
  markers: [],
  clusterLayer: null,
  routeLine: null,
  currentRoute: null,
  // Seleção poligonal
  polygonSelectionMode: false,
  selectionShape: "",
  currentPolygon: null,
  polygonGroup: null,
  polygonPoints: [],
};

