// public/js/list.js
import { statusColors } from './config.js';
import { addMarker } from './markers.js';
import { getSelectedClients } from './customers.js';
import { drawRoute, clearRoute } from './routing.js';

/**
 * Renderiza a lista (e adiciona marcadores) dos clientes recebidos.
 * @param {object} state
 * @param {Array<object>} customers - lista já filtrada
 */
export function renderCustomerList(state, customers) {
  const clientList = document.getElementById("clientList");
  clientList.innerHTML = ''; // limpa a área antes de recriar

  const gridContainer = document.createElement("div");
  gridContainer.className = "clients-grid";

  customers.forEach((customer, index) => {
    const color = statusColors[customer.status] || "red";
    addMarker(state, { lat: customer.LatitudeMeasure, lng: customer.LongitudeMeasure }, color, customer.CustomerName, customer.CustomerInternalID);

    const item = document.createElement("div");
    item.className = "client-item";

    const header = document.createElement("div");
    header.className = "client-header";

    const number = document.createElement("div");
    number.className = "client-number";
    number.textContent = `${index + 1}.`;

    const name = document.createElement("div");
    name.className = "client-name";
    name.textContent = customer.CustomerName;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "client-checkbox";
    checkbox.dataset.id = customer.CustomerInternalID;

    const statusDot = document.createElement("div");
    statusDot.className = `client-status status-${customer.status}`;

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

    item.addEventListener('click', (e) => {
      if (e.target !== checkbox) checkbox.click();
    });

    header.appendChild(number);
    header.appendChild(name);
    header.appendChild(checkbox);
    item.appendChild(header);
    item.appendChild(address);
    item.appendChild(statusDot);
    gridContainer.appendChild(item);
  });

  clientList.appendChild(gridContainer);
}
``