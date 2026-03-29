import { applyFiltersAndRender, getCustomersFiltered } from "./filters.js";

// js/customers.js
export function getSelectedClients(state) {
  return Array.from(state.selectedCustomers.values());
}

export function deselectAllCustomers(state) {
  state.selectedCustomers.clear();
  const checkboxes = document.querySelectorAll('.client-checkbox');

  checkboxes.forEach(cb => {
    cb.checked = false;
    cb.closest('.client-item').classList.remove('selected');
  });

  state.showOnlySelected = false

  document.getElementById("btnToggleSelected").textContent = "Clientes Selecionados";


  applyFiltersAndRender(false);
}