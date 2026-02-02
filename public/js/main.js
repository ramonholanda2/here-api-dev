// public/js/main.js
import { state, hydrateEmployeeFieldFromQuery } from './config.js';
import { loadCustomers } from './init.js';
import { optimizeRoute, clearRoute } from './routing.js';
import { openFormRoute, saveRoute, closeFormRoute, clearFormRoute } from './form-route.js';
import {
  enablePolygonSelection,
  clearPolygonSelection,
  selectClientsInPolygon
} from './polygon.js';
import { setupFiltersToggle } from './filters-toggle.js';
import { applyFiltersAndRender } from './filters.js';

document.addEventListener('DOMContentLoaded', () => {
  //hydrateEmployeeFieldFromQuery();
  setupFiltersToggle();

  loadCustomers();

  document.getElementById('btnClearRoute')?.addEventListener('click', () => clearRoute(state));
  document.getElementById('btnOptimizeRoute')?.addEventListener('click', () => optimizeRoute(state));
  document.getElementById('btnOpenFormRoute')?.addEventListener('click', () => openFormRoute(state));
  document.getElementById('btnSelectArea')?.addEventListener('click', () => enablePolygonSelection(state));

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
  ['f_nome','f_status','f_estado','f_cidade','f_cnpj','f_idsap','f_regiao','f_equipe','f_pin']
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