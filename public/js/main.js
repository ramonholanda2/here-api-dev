// public/js/main.js
import { state } from './config.js';
import { getSalesOffices, initApp, loadCustomers } from './init.js';
import { optimizeRoute, clearRoute } from './routing.js';
import { openFormRoute, saveRoute, closeFormRoute, clearFormRoute, renderEmployeesTable } from './form-route.js';
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
import { deselectAllCustomers, getSelectedClients } from './customers.js';
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

    title.innerText = 'Clientes selecionados';

    cancel();
  });
  document.getElementById('btnCloseForm')?.addEventListener('click', e => {
    const title = document.getElementById('section-title');

    title.innerText = 'Clientes selecionados';

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

  const tbodyCustomers = document.querySelector("#tableCustomers tbody");

  tbodyCustomers.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".remove-selected-client");
    if (!btn) return;

    const id = btn.dataset.id;

    const tr = btn.closest("tr");
    if (tr) tr.remove();

    const checkbox = document.querySelector(`.client-checkbox[data-id="${id}"]`);
    if (checkbox) {
      checkbox.checked = false;
      checkbox.closest(".client-item")?.classList.remove("selected");
    }

    const customersSelected = getSelectedClients(state);
    const tableTitle = document.getElementById('section-title');
    if (tableTitle) {
      tableTitle.innerHTML = `(${customersSelected.length}) Clientes selecionados`;
    }

    if (customersSelected.length === 0) {
      showToast('Selecione pelo menos um cliente para criar uma rota.', 'error', 5000);
      closeFormRoute();
    }
  });


  document.getElementById("routeOwner")?.addEventListener("click", async () => {
    const modal = document.getElementById("employeesModal");
    const tbody = document.querySelector("#employeesTable tbody");

    modal.classList.remove("hidden");
    tbody.innerHTML = `<tr><td colspan="2">Carregando...</td></tr>`;

    try {
      const { data } = await axios.get("/api/empregados");

      window._allEmployees = data;

      renderEmployeesTable(data);

    } catch (e) {
      console.log(e);
      tbody.innerHTML = `<tr><td colspan="2">Erro ao carregar empregados</td></tr>`;
    }
  });

  document.addEventListener("click", ev => {
    const btn = ev.target.closest(".select-employee");
    if (!btn) return;

    document.getElementById("routeOwner").dataset.id = btn.dataset.id;
    document.getElementById("routeOwnerName").textContent = btn.dataset.name;

    document.getElementById("employeesModal").classList.add("hidden");
  });

  document.querySelectorAll(".closeEmployeesModal").forEach(el => {
    el.addEventListener("click", () => {
      document.getElementById("employeesModal").classList.add("hidden");
    });
  });


  document.getElementById("employeeSearch")?.addEventListener("input", ev => {
    const term = ev.target.value.toLowerCase().trim();

    const filtered = window._allEmployees.filter(emp =>
      emp.BusinessPartnerFormattedName.toLowerCase().includes(term)
    );

    renderEmployeesTable(filtered);
  });
});