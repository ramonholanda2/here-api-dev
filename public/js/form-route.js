// js/form-route.js
import { getSelectedClients } from './customers.js';
import { clearRoute } from './routing.js';

export async function openFormRoute(state) {
  const customers = getSelectedClients(state);
  if (customers.length === 0) {
    alert("Selecione pelo menos um cliente para criar a rota.");
    return;
  }

  document.getElementById("FormRoute").classList.remove("hidden");

  const params = new URLSearchParams(window.location.search);
  const employeeID = params.get("employeeID");
  const { data } = await axios.get(`/api/empregado?employeeID=${employeeID}`);

  const organizerInput = document.getElementById('routeOrganizer');
  const ownerInput = document.getElementById('routeOwner');
  if (!organizerInput || !ownerInput) return;

  organizerInput.value = data?.name || '';
  ownerInput.value = data?.name || '';

  const tbody = document.querySelector("#tableCustomers tbody");
  tbody.innerHTML = "";

  customers.forEach(customer => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${customer.CustomerInternalID}</td><td>${customer.CustomerName}</td><td>${customer.FormattedPostalAddressDescription}</td>`;
    tbody.appendChild(tr);
  });
}

export function closeFormRoute() {
  document.getElementById("FormRoute").classList.add("hidden");
}

export async function saveRoute(state) {


  const nameRoute = document.getElementById('routeName').value.trim();
  const initialDate = document.getElementById('routeDate').value;
  const typeVisit = document.getElementById('routeTypeVisit')
  const typeVisitDesc = typeVisit.options[typeVisit.selectedIndex].text;

  const notes = document.getElementById('routeNotes').value.trim();

  var notesObject = {};
  if (notes) notesObject = { RouteNotes: [{ TypeCode: "10002", Text: notes }] };

  const daysWeekCheckboxes = document.querySelectorAll('.days-week input[type="checkbox"]');
  const daysSelected = Array.from(daysWeekCheckboxes)
    .map((checkbox, index) => checkbox.checked ? getNameDay(index) : null)
    .filter(Boolean);

  function getNameDay(index) {
    const days = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    return days[index];
  }

  const selectedCustomers = getSelectedClients(state);
  const timestampMs = new Date(initialDate).getTime();
  const startDateFormatted = `/Date(${timestampMs})/`;

  const daysWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const excludeDays = {};
  daysWeek.forEach((day, index) => {
    excludeDays[`Exclude${day}Indicator`] = daysSelected.includes(getNameDay(index));
  });

  const routeAccounts = selectedCustomers.map(customer => ({
    AccountID: customer.CustomerInternalID,
    Duration: "PT1H",
    StartTime: "PT08H00M00S",
    EndTime: "PT09H00M00S",
    PreparationTime: "PT1H",
    VisitTypeCode: typeVisit.value
  }));


  const params = new URLSearchParams(window.location.search);
  const employeeID = params.get("employeeID");

  const payload = {
    Name: nameRoute || "Nova Rota",
    RouteTypeCode: "2",
    StartDate: startDateFormatted,
    ...excludeDays,
    DefaultStartTime: "PT08H00M00S",
    DefaultPreparationTime: "PT1H",
    DefaultDuration: "PT1H",
    Status: "2",
    ProcessingStatus: "1",
    VisitTypeCode: typeVisit.value,
    OwnerPartyID: employeeID,
    OrganizerPartyID: employeeID,
    RouteAccount: routeAccounts,
    Z_TipoVisita_KUT: `${typeVisit.value} - ${typeVisitDesc}`,
    ...notesObject
  };

  try {
    await axios.post('/api/rotas', payload)
      .then(async (route) => {
        alert("Rota salva com sucesso!")
        const url = `/api/rotas/redirecionar/${route.data.ObjectID}`;
        const response = await axios.get(url)
        const linkRouteCreated = decodeURIComponent(response.data);
        console.log(linkRouteCreated)
        window.open(linkRouteCreated, '_blank')?.focus();
      })
    closeFormRoute();
    clearFormRoute();
    clearRoute(state);
  } catch (err) {
    console.error(err);
    alert("Erro ao salvar rota.", err);
  }
}

export function clearFormRoute() {
  document.getElementById('routeName').value = '';
  document.getElementById('routeDate').value = '';
  document.getElementById('routeTypeVisit').value = '';
  document.getElementById('routeNotes').value = '';
  document.querySelectorAll('.days-week input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.querySelector('#tableCustomers tbody').innerHTML = '';
}
``