import { applyFiltersAndRender, getCustomersFiltered } from "./filters.js";
import { updateMarkerVisibility } from "./markers.js";

// js/customers.js
export function getSelectedClients(state) {
  const checkboxes = document.querySelectorAll('.client-checkbox');
  return Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => state.allCustomers.find(c => c.CustomerInternalID == cb.dataset.id));
}

export function deselectAllCustomers(state) {
  const checkboxes = document.querySelectorAll('.client-checkbox');

  checkboxes.forEach(cb => {
    cb.checked = false;
    cb.closest('.client-item').classList.remove('selected');
  });

   const filtered = getCustomersFiltered(state);
  updateMarkerVisibility(state, filtered);
  state.showOnlySelected = false

  document.getElementById("btnToggleSelected").textContent = "Clientes Selecionados";


  applyFiltersAndRender(false);
}