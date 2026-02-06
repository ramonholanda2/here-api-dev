// public/js/filters.js
import { state } from './config.js';
import { renderCustomerList } from './list.js';
import { clearMarkers, updateMarkerVisibility } from './markers.js';

const LS_KEY = 'clientes_filtros_v1';

const fieldMap = {
  nome: ['CustomerName'],
  statusCliente: ['StatusAtividade_KUT'],
  estado: ['CustomerPostalAddress.0.RegionCode', 'RegionCode'],
  cidade: ['CustomerPostalAddress.0.CityName', 'CityName'],
  cnpj: ['zCNPJ_KUT'],
  idSap: ['CustomerInternalID'],
  regiao: ['SalesOfficeName'],
  equipeVendas: ['SalesGroup'],
};

function norm(v) {
  return (v ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Pega valor do primeiro campo existente no objeto, entre várias opções */
function getFirst(obj, keys = []) {
  for (const k of keys) {
    if (obj && obj[k] != null && obj[k] !== '') return obj[k];
  }
  return '';
}

export function getFiltersFromUI() {
  return {
    nome: document.getElementById('f_nome')?.value?.trim() || '',
    statusCliente: document.getElementById('f_status')?.value || '',
    estado: document.getElementById('f_estado')?.value?.trim() || '',
    cidade: document.getElementById('f_cidade')?.value?.trim() || '',
    cnpj: document.getElementById('f_cnpj')?.value?.trim() || '',
    idSap: document.getElementById('f_idsap')?.value?.trim() || '',
    regiao: document.getElementById('f_regiao')?.value?.trim() || '',
    equipeVendas: document.getElementById('f_equipe')?.value?.trim() || '',
    pin: document.getElementById('f_pin')?.value || '',
  };
}


export function filterCustomers(all, filters) {
  const f = {
    nome: norm(filters.nome),
    statusCliente: norm(filters.statusCliente),
    estado: norm(filters.estado),
    cidade: norm(filters.cidade),
    cnpj: filters.cnpj?.replace(/\D/g, ''),
    idSap: norm(filters.idSap),
    regiao: norm(filters.regiao),
    equipeVendas: norm(filters.equipeVendas),
    pin: norm(filters.pin),
  };


  return all.filter(customer => {
    if (f.nome) {
      const nome = norm(getFirst(customer, fieldMap.nome));
      if (!nome.includes(f.nome)) return false;
    }

    // status (equals, mas tolerante)
    if (f.statusCliente) {
      const status = norm(getFirst(customer, fieldMap.statusCliente));
      if (!status || !status.includes(f.statusCliente)) return false;
    }


    if (f.estado) {
      const estadoRaw =
        customer.CustomerPostalAddress?.[0]?.RegionCode ||
        customer.RegionCode ||
        '';

      const estado = norm(estadoRaw) || norm(customer.FormattedPostalAddressDescription || '');

      if (!estado.includes(f.estado)) return false;
    }

    // ===== CIDADE =====
    if (f.cidade) {
      const cidadeRaw =
        customer.CustomerPostalAddress?.[0]?.CityName ||
        customer.CityName ||
        '';

      const cidade = norm(cidadeRaw) || norm(customer.FormattedPostalAddressDescription || '');

      if (!cidade.includes(f.cidade)) return false;
    }

    // cnpj (contains somente dígitos)
    if (f.cnpj) {
      const raw = getFirst(customer, fieldMap.cnpj).toString();
      const onlyDigits = raw.replace(/\D/g, '');
      if (!onlyDigits.includes(f.cnpj)) return false;
    }

    // id SAP (contains)
    if (f.idSap) {
      const id = norm(getFirst(customer, fieldMap.idSap));
      if (!id.includes(f.idSap)) return false;
    }

    // região (contains)
    if (f.regiao) {
      const regiao = norm(getFirst(customer, fieldMap.regiao));
      if (!regiao.includes(f.regiao)) return false;
    }

    // equipe de vendas (contains)
    if (f.equipeVendas) {
      const equipe = norm(getFirst(customer, fieldMap.equipeVendas));
      if (!equipe.includes(f.equipeVendas)) return false;
    }

    return true;
  });
}

/** Aplica filtros atuais da UI, salva e re-renderiza */


export function getCustomersFiltered() {
  return filterCustomers(state.allCustomers, getFiltersFromUI());
}

export function applyFiltersAndRender() {
  const filters = getFiltersFromUI();
  //localStorage.setItem('clientes_filtros_v1', JSON.stringify(filters));

  // clientes filtrados
  const filtered = filterCustomers(state.allCustomers, filters);
  const filteredIds = new Set(filtered.map(c => String(c.CustomerInternalID)));

  updateMarkerVisibility(state, filtered);

  // mostrar/esconder itens existentes sem recriar DOM
  document.querySelectorAll('.client-item').forEach(item => {
    const checkbox = item.querySelector('.client-checkbox');
    const id = checkbox?.dataset.id;

    if (filteredIds.has(id)) {
      item.style.display = "";
    } else {
      item.style.display = "none"; // esconde mas NÃO mexe no checked
    }
  });

  // atualiza contador
  const info = document.querySelector('.header-info');
  if (info) info.textContent = `Mostrando ${filtered.length} de ${state.allCustomers.length}`;
}



export function renderCustomers() {
  let saved = {};
  /* try { saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch {}
  setFiltersToUI(saved); */

  const filtered = filterCustomers(state.allCustomers, saved);

  if (state.map) clearMarkers(state);
  renderCustomerList(state, filtered);

  const info = document.querySelector('.header-info');
  if (info) info.textContent = `Mostrando ${filtered.length} de ${state.allCustomers.length}`;
}
