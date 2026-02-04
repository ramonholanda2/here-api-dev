// public/js/main.js
import { state, hydrateEmployeeFieldFromQuery } from './config.js';
import { loadCustomers } from './init.js';
import { optimizeRoute, clearRoute } from './routing.js';
import { openFormRoute, saveRoute, closeFormRoute, clearFormRoute } from './form-route.js';
import {
  enablePolygonSelection,
  clearPolygonSelection,
  selectClientsInPolygon,
  hidePolygonActions,
  hidePolygonInstructions

} from './polygon.js';
import { setupFiltersToggle } from './filters-toggle.js';
import { applyFiltersAndRender } from './filters.js';

document.addEventListener('DOMContentLoaded', () => {
  //hydrateEmployeeFieldFromQuery();
  setupFiltersToggle();

  loadCustomers();

  document.getElementById('btnClearRoute')?.addEventListener('click', () => clearRoute(state));
  document.getElementById('btnOpenFormRoute')?.addEventListener('click', () => {
    openFormRoute(state)
    hidePolygonActions(); 
    hidePolygonInstructions();

  });
  document.getElementById('btnSelectArea')?.addEventListener('click', () => enablePolygonSelection(state, 'triangle'));
  document.getElementById('btnSelectCircle')?.addEventListener('click', () => enablePolygonSelection(state, 'circle'));
  document.getElementById('btnSelectSquare')?.addEventListener('click', () => enablePolygonSelection(state, 'square'));

  var toggleSelectArea = false;

  const btnSelectShape = document.getElementById('btnSelectShape');
  const shapeMenu = document.getElementById('shapeMenu');
  const actionBar = document.querySelector('.action-bar');

  btnSelectShape?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSelectArea = !toggleSelectArea;
    toggleShapeMenu(btnSelectShape, shapeMenu, toggleSelectArea);
  });

  document.addEventListener('click', () => toggleShapeMenu(btnSelectShape, shapeMenu, false));

  function toggleShapeMenu(anchorBtn, menuEl, show) {
    if (!anchorBtn || !menuEl) return;
    if (!show) {
      menuEl.classList.add('hidden');
      return;
    }
    const btnRect = anchorBtn.getBoundingClientRect();
    const barRect = actionBar.getBoundingClientRect();

    menuEl.style.top = `${(btnRect.bottom - barRect.top) + 8}px`;
    menuEl.style.left = `${(btnRect.left - barRect.left)}px`;
    menuEl.classList.remove('hidden');

    // acessibilidade: foca o 1º item
    menuEl.querySelector('.shape-option')?.focus();
  }




  // Modal
  document.getElementById('btnSaveForm')?.addEventListener('click', () => saveRoute(state));
  const cancel = () => { closeFormRoute(); clearFormRoute(); };
  document.getElementById('btnCancelForm')?.addEventListener('click', cancel);
  document.getElementById('btnCloseForm')?.addEventListener('click', cancel);

  // Eventos custom do polígono
  document.addEventListener('polygon:clear', () => clearPolygonSelection(state));
  document.addEventListener('polygon:selectClients', () => selectClientsInPolygon(state));

  // 👉 Filtros: evita submit e aplica em memória
  const form = document.getElementById('filtersPanel');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    applyFiltersAndRender(); // lê UI, salva local, filtra e renderiza
  });

  // (Opcional) reatividade imediata ao digitar/alterar:
  ['f_nome', 'f_status', 'f_estado', 'f_cidade', 'f_cnpj', 'f_idsap', 'f_regiao', 'f_equipe', 'f_pin']
    .forEach(id => {
      const el = document.getElementById(id);
      el?.addEventListener('change', applyFiltersAndRender);
      if (el?.tagName === 'INPUT') {
        el.addEventListener('keyup', (ev) => {
          if (ev.key === 'Enter') applyFiltersAndRender();
        });
      }
    });
});