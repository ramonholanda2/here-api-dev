// public/js/main.js
import { state, hydrateEmployeeFieldFromQuery } from './config.js';
import { initApp, loadCustomers } from './init.js';
import { optimizeRoute, clearRoute } from './routing.js';
import { openFormRoute, saveRoute, closeFormRoute, clearFormRoute } from './form-route.js';
import {
  enablePolygonSelection,
  clearPolygonSelection,
  selectClientsInPolygon,
  hidePolygonActions,
  hidePolygonInstructions,
  showPolygonActions
} from './polygon.js';
import { setupFiltersToggle } from './filters-toggle.js';
import { applyFiltersAndRender, renderCustomers, toggleShowSelected } from './filters.js';
import { validateRouteForm } from './route-form-validate.js';
import { showToast } from './util.js';
import { deselectAllCustomers } from './customers.js';

document.addEventListener('DOMContentLoaded', async () => {
  //hydrateEmployeeFieldFromQuery();
  setupFiltersToggle();

  initApp()

  await loadCustomers().then(() => {
    renderCustomers()
  });

  document.getElementById('btnClearRoute')?.addEventListener('click', () => clearRoute(state));
  document.getElementById('btnOpenFormRoute')?.addEventListener('click', () => {
    openFormRoute(state);
    hidePolygonActions();
    hidePolygonInstructions();
  });

  document.getElementById('btnSelectArea')?.addEventListener('click', () => enablePolygonSelection(state, 'triangle'));
  document.getElementById('btnSelectCircle')?.addEventListener('click', () => enablePolygonSelection(state, 'circle'));
  document.getElementById('btnSelectSquare')?.addEventListener('click', () => enablePolygonSelection(state, 'square'));

  let toggleSelectArea = false;

  const btnSelectShape = document.getElementById('btnSelectShape');
  const shapeMenu = document.getElementById('shapeMenu');
  const actionBar = document.querySelector('.action-bar');

  btnSelectShape?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSelectArea = !toggleSelectArea;
    toggleShapeMenu(btnSelectShape, shapeMenu, toggleSelectArea);
  });


  document.getElementById("btnDeselectAll").onclick = () => {
    deselectAllCustomers(state);
  };


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

    menuEl.querySelector('.shape-option')?.focus();
  }

  const btnSaveForm = document.getElementById('btnSaveForm');
  btnSaveForm?.addEventListener('click', (e) => {
    const { valid, errors } = validateRouteForm();
    if (!valid) {
      e.preventDefault();
      errors.forEach(err => showToast(err, 'error'));
      return;
    }

    btnSaveForm.disabled = true;

    saveRoute(state);

    setTimeout(() => {
      btnSaveForm.disabled = false;
    }, 1500);


  });

  const cancel = () => { closeFormRoute(); clearFormRoute(); };
  document.getElementById('btnCancelForm')?.addEventListener('click', e => {
    if (state.isShowPolygonActions == true) showPolygonActions()
      console.log('state.showPolygonActions', state.isShowPolygonActions)
    cancel();
  });
  document.getElementById('btnCloseForm')?.addEventListener('click', e => {
    console.log('state.showPolygonActions', state.isShowPolygonActions)
    if (state.isShowPolygonActions == true) showPolygonActions()
    cancel();
  });

  document.addEventListener('polygon:clear', () => clearPolygonSelection(state));
  document.addEventListener('polygon:selectClients', () => selectClientsInPolygon(state));

  const form = document.getElementById('filtersPanel');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    applyFiltersAndRender(state); // lê UI, salva local, filtra e renderiza
  });

  console.log('state.allCustomers', state.allCustomers.length)

  document.getElementById("btnToggleSelected").onclick = () => {
    toggleShowSelected(state);

    document.getElementById("btnToggleSelected").textContent = state.showOnlySelected ? "Mostrar todos" : "Clientes Selecionados";
  };


  if (state.allCustomers.length === 0) {
    const stateTown = document.getElementById("f_estado");
    const status = document.getElementById("f_status");

    let stateTownValue = "";
    let statusValue = "";
    let debounceTimer = null;

    const tryLoad = () => {
      clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        const validUF = stateTownValue.length === 2;
        const validStatus = statusValue != "";

        if (validUF && validStatus) {
          state.allCustomers = [];
          state.allCustomersFiltered = [];
          state.markers = [];
          loadCustomers({
            stateTown: stateTownValue,
            status: statusValue
          }).then(renderCustomers);
        }
      }, 350); // evita spam de chamadas
    };

    stateTown?.addEventListener("change", () => {
      if (stateTown.value.length === 2) {
        stateTownValue = stateTown.value;
        tryLoad();
      }
    });

    status?.addEventListener("input", () => {
      if (status.value) {
        statusValue = status.value;
        tryLoad();
      }
    });
  }


  let listFieldsName = ['f_nome', 'f_status', 'f_cidade', 'f_cnpj', 'f_idsap', 'f_regiao', 'f_equipe', 'f_pin'];

  if (state.allCustomers.length != 0) listFieldsName.push('f_estado');

  console.log('listFieldsName', listFieldsName);
  listFieldsName.forEach(id => {
    const el = document.getElementById(id);
    el?.addEventListener('change', ev => applyFiltersAndRender(state.showOnlySelected));
    if (el?.tagName === 'INPUT') {
      el.addEventListener('keyup', (ev) => {
        if (ev.key === 'Enter') applyFiltersAndRender(state.showOnlySelected);
      });
    }
  });
});