// public/js/main.js
import { state } from './config.js';
import { getSalesOffices, initApp, loadCustomers } from './init.js';
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
import { closeOfficesModal, getSelectedOffices, openOfficesModal } from './modal-offices.js';

document.addEventListener('DOMContentLoaded', async () => {
  setupFiltersToggle();

  await initApp()

  await getSalesOffices().then((salesOffices) => {
    const btnOffices = document.getElementById("btnOffices");

    if (!salesOffices.haveOfficesByEmployee) {
      showToast('Nenhum escritório vinculado ao usuário, por favor selecione e tente novamente.', 'error', 5000);
    }

    btnOffices.textContent = salesOffices.haveOfficesByEmployee
      ? "Ver Escritórios"
      : "Selecionar Escritórios";

    btnOffices.onclick = () => openOfficesModal(salesOffices.haveOfficesByEmployee, salesOffices.offices);

  }).catch((error) => {
    console.log('error', error)
  });

  await loadCustomers().then(() => {
    renderCustomers()
  });

  document.getElementById('btnClearRoute')?.addEventListener('click', () => clearRoute(state));
  document.getElementById('btnOpenFormRoute')?.addEventListener('click', () => {
    openFormRoute(state);
    hidePolygonActions();
    hidePolygonInstructions();
  });
  const closeModalOffices = document.getElementsByClassName('closeModal');
  Array.from(closeModalOffices).forEach(item => {
    item.addEventListener('click', () => {
      closeOfficesModal();
    });
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
      btnSaveForm.disabled = true;
      setTimeout(() => {
        btnSaveForm.disabled = false;
      }, 1500);
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
    const title = document.getElementById('section-title');

    title.innerText = 'Clientes';

    cancel();
  });
  document.getElementById('btnCloseForm')?.addEventListener('click', e => {
    const title = document.getElementById('section-title');

    title.innerText = 'Clientes';

    if (state.isShowPolygonActions == true) showPolygonActions()
    cancel();
  });

  document.addEventListener('polygon:clear', () => clearPolygonSelection(state));
  document.addEventListener('polygon:selectClients', () => selectClientsInPolygon(state));

  const form = document.getElementById('filtersPanel');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    applyFiltersAndRender(state);
  });

  console.log('state.allCustomers', state.allCustomers.length)

  document.getElementById("btnToggleSelected").onclick = () => {
    toggleShowSelected(state);

    document.getElementById("btnToggleSelected").textContent = state.showOnlySelected ? "Mostrar todos" : "Clientes Selecionados";
  };


  document.getElementById("btnSearchOffices").onclick = async () => {
    const loader = document.getElementById("officesLoading");
    loader.classList.remove("hidden");

    try {
      const selectedOffices = getSelectedOffices();
      const officeIds = selectedOffices.map(office => office.OrgUnitID);

      await loadCustomers({ salesOfficesIDs: officeIds.join(',') }).then(renderCustomers);

      closeOfficesModal();

    } finally {
      loader.classList.add("hidden");
    }
  };

  const filterBTN = document.getElementById("applyFiltersBtn");
  filterBTN?.addEventListener("click", () => {
    applyFiltersAndRender(state.showOnlySelected);
  });
});