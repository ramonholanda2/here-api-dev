// js/config.js
export const apiKey = 'cn1jsr6t-Av8fGyDYWosAqeKHK7HsEAMCVG5PWs0ILQ';

export const statusColors = {
  verde: "green",
  vermelho: "red",
  azul: "ltblue",
  cinza: "gray"
};

export const state = {
  allCustomers: [],
  map: null,
  platform: null,
  ui: null,
  router: null,
  markers: [],
  routeLine: null,
  currentRoute: null,
  // Seleção poligonal
  polygonSelectionMode: false,
  currentPolygon: null,
  polygonGroup: null,
  trianglePoints: [],
  
  selectedCustomerIDs: new Set(),

  markerCustomerById  : new Map(),
  markersGroup : null

};

export function hydrateEmployeeFieldFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const employeeID = params.get("employeeID");
  const input = document.getElementById("f_employee");
  if (employeeID && input) input.value = employeeID;
}