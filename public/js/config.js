// js/config.js
export const apiKey = 'cn1jsr6t-Av8fGyDYWosAqeKHK7HsEAMCVG5PWs0ILQ';

export const statusColors = {
  "101": "green",
  "111": "yellow",
  "121": "orange",
  "131": "gray",
  "141": "black",
  "151": "purple"
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
  selectionShape: "",
  currentPolygon: null,
  polygonGroup: null,
  polygonPoints: [],
};

export function hydrateEmployeeFieldFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const employeeID = params.get("employeeID");
  const input = document.getElementById("f_employee");
  if (employeeID && input) input.value = employeeID;
}