// public/js/list.js
import { statusColors } from './config.js';
import { addMarker, centerMapInMarker } from './markers.js';
import { getSelectedClients } from './customers.js';
import { drawRoute, clearRoute } from './routing.js';
import { createClusterLayer } from './clusters.js';

/**
 * Renderiza a lista (e adiciona marcadores) dos clientes recebidos.
 * @param {object} state
 * @param {Array<object>} customers - lista já filtrada
 */
export function renderCustomerList(state, customers) {
  const clientList = document.getElementById("clientList");
  clientList.innerHTML = '';

  const gridContainer = document.createElement("div");
  gridContainer.className = "clients-grid";

  customers.forEach((customer, index) => {
    const color = statusColors[customer.Z_Classificao_KUT] || "green";
    //addMarker(state, { lat: customer.LatitudeMeasure, lng: customer.LongitudeMeasure }, color, customer.CustomerName, customer.CustomerInternalID);

    const item = document.createElement("div");
    item.className = "client-item";

    const header = document.createElement("div");
    header.className = "client-header";

    const location = document.createElement("span");
    location.className = "client-location";

    const name = document.createElement("div");
    name.className = "client-name";
    name.textContent = `${customer.CustomerName} - ${customer.CustomerInternalID}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "client-checkbox";
    checkbox.dataset.id = customer.CustomerInternalID;

    const statusDot = document.createElement("div");
    statusDot.className = `client-status status-${color}`;

    const address = document.createElement("div");
    address.className = "client-address";
    address.textContent = customer.FormattedPostalAddressDescription;

    checkbox.addEventListener("change", (e) => {
      item.classList.toggle('selected', e.target.checked);
      const selected = getSelectedClients(state);
      if (selected.length >= 2) {
        //drawRoute(state, selected);
      } else if (state.routeLine) {
        clearRoute(state);
      }
    });

    checkbox.addEventListener('click', (e) => {
      if (e.target !== checkbox) checkbox.click();
    });

    location.addEventListener('click', (e) => {
      var locationData =
      {
        position: { lat: customer.LatitudeMeasure, lng: customer.LongitudeMeasure },
        zoom: 18,
        tilt: 0,
        heading: 180
      }

      centerMapInMarker(locationData)
    })

    header.appendChild(location);
    header.appendChild(name);
    header.appendChild(checkbox);
    item.appendChild(header);
    item.appendChild(address);
    item.appendChild(statusDot);
    gridContainer.appendChild(item);
  });

  clientList.appendChild(gridContainer);

  if (state.clusterLayer) {
    state.map.removeLayer(state.clusterLayer);
  }

  if (customers.length > 0) {

    console.log('createClusterLayer', customers, state)
    
    state.clusterLayer = createClusterLayer(customers, state);
    state.map.addLayer(state.clusterLayer);
  }
}
``