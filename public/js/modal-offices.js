import { showToast } from "./util.js";

export function renderOfficeRow(office, selectable = false) {
  const tr = document.createElement("tr");

  if (selectable) {
    tr.innerHTML = `
      <td><input type="checkbox" value="${office.OrgUnitID}" /></td>
      <td>${office.OrgUnitID}</td>
      <td>${office.Name}</td>
    `;
  } else {
    tr.innerHTML = `
      <td></td>
      <td>${office.OrgUnitID}</td>
      <td>${office.Name}</td>
    `;
  }

  return tr;
}

export async function openOfficesModal(isReadOnly, offices) {
  const modal = document.getElementById("officesModal");
  modal.classList.add("active");

  const title = document.getElementById("officesModalTitle");
  const tableBody = document.querySelector("#officesTable tbody");
  const btnSearch = document.getElementById("btnSearchOffices");

  tableBody.innerHTML = "";

  if (isReadOnly) {
    title.textContent = "Escritórios vinculados";
    offices.forEach(office => tableBody.appendChild(renderOfficeRow(office, false)));
    btnSearch.style.display = "none";
  } else {
    title.textContent = "Selecionar escritórios";
    offices.forEach(office => tableBody.appendChild(renderOfficeRow(office, true)));
    btnSearch.style.display = "inline-block";

    limitSelection(2)
  }
}

export function closeOfficesModal() {
  document.getElementById("officesModal").classList.remove("active");
}

function limitSelection(max = 2) {
  const checkboxes = document.querySelectorAll("#officesTable input[type='checkbox']");
  
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const selectedCount = document.querySelectorAll("#officesTable input[type='checkbox']:checked").length;
      
      if (selectedCount > max) {
        cb.checked = false;
        showToast(`Limite máximo de ${max} escritórios.`, 'error', 2000);
      }
    });
  });
}

export function getSelectedOffices() {
  const checked = document.querySelectorAll("#officesTable input[type='checkbox']:checked");
  return Array.from(checked).map(cb => {
    const row = cb.closest("tr");
    return {
      OrgUnitID: cb.value,
      Name: row.cells[2].textContent.trim()
    };
  });
}