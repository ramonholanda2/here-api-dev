// js/customers.js
export function getSelectedClients(state) {
  const checkboxes = document.querySelectorAll('.client-checkbox');
  return Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => state.allCustomers.find(c => c.CustomerInternalID == cb.dataset.id));
}

