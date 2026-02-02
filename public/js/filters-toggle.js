// js/filters-toggle.js
const STORAGE_KEY = 'filtersCollapsed';
export function setupFiltersToggle() {
  const btn = document.getElementById('toggleFiltersBtn');
  const fields = document.getElementById('filtersFields');
  if (!btn || !fields) return;

  const collapsedInit = localStorage.getItem(STORAGE_KEY) === 'true';
  applyState(collapsedInit);

  btn.addEventListener('click', () => {
    const willCollapse = !fields.classList.contains('is-collapsed');
    applyState(willCollapse);
    localStorage.setItem(STORAGE_KEY, String(willCollapse));
  });

  function applyState(collapsed) {
    if (collapsed) {
      fields.classList.add('is-collapsed');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerText = '⬇️ Mostrar filtros';
    } else {
      fields.classList.remove('is-collapsed');
      btn.setAttribute('aria-expanded', 'true');
      btn.innerText = '⬆️ Ocultar filtros';
    }
  }
}