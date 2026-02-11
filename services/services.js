
import { getDestination } from "@sap-cloud-sdk/connectivity"
import { executeHttpRequest } from "@sap-cloud-sdk/http-client"


async function getEmployeeInfo(employeeID) {

  try {
    const destination = await getDestination({ destinationName: "SALES_CLOUD" });

    const response = await executeHttpRequest(
      destination,
      { method: "GET", url: `/sap/c4c/odata/v1/c4codataapi/BusinessUserCollection?$filter=EmployeeID eq '${employeeID}'&$format=json` }
    );

    const data = response.data.d.results.map(employee => ({
      id: employee.UserID,
      name: employee.BusinessPartnerFormattedName,
      BusinessPartnerID: employee.BusinessPartnerID
    }));
    return data[0];

  } catch (error) {
    throw new Error('Erro ao obter informações do empregado:', error);
  }
}

async function getCustomers(queryOptions) {
  try {


    const orgUnitIds = await findOrganisationalUnitEmployees(queryOptions.employeeID);

    if (!orgUnitIds.length) {
      return [];
    }

    const customers = await findCustomersBySalesOffice(orgUnitIds);

    return customers;

  } catch (err) {
    console.error('getCustomers error:', err);
    return { erro: true, mensagem: 'Falha ao buscar clientes por Sales Office.', detalhes: err?.message };
  }
}


async function findOrganisationalUnitEmployees(businessPartnerId) {

  const base = `/sap/c4c/odata/cust/v1/organisational_unit_employee/OrganisationalUnitEmployeeAssignmentCollection`;
  const url = `${base}?$format=json&$filter=EmployeeID eq '${businessPartnerId}'`;

  console.log("get customers url: ", url);

  try {
    console.log("tentando buscar destination");
    const destination = await getDestination({ destinationName: "SALES_CLOUD" });
    console.log(destination);
    const response = await executeHttpRequest(
      destination,
      { method: "GET", url: url }
    );

    const results = response?.data?.d?.results || [];

    const ids = Array.from(
      new Set(
        results
          .map(r => r.OrgUnitID)
          .filter(Boolean)
      )
    );
    return ids;
  } catch (err) {
    console.error('findOrganisationalUnitEmployees error:', err);
    throw new Error(err);
  }
}


async function findCustomersBySalesOffice(orgUnitIds = []) {
  if (!orgUnitIds.length) return [];

  const base = `/sap/c4c/odata/cust/v1/customers_by_salesoffice/SalesArrangementCollection`;

  const filterOrgQuery = orgUnitIds
    .map(id => `SalesOfficeID eq '${String(id).replace(/'/g, "''")}'`)
    .join(' or ');

  const url = `${base}?$expand=CustomerPostalAddress&$format=json&$filter=${encodeURI(filterOrgQuery)}`;

  console.log(url);

  try {
    const destination = await getDestination({ destinationName: "SALES_CLOUD" });
    const response = await executeHttpRequest(
      destination,
      { method: "GET", url: url }
    );

    const results = response?.data?.d?.results || [];

    const byCustomer = new Map();

    for (const item of results) {
      const key = item.CustomerInternalID;
      if (!key) continue;

      if (!byCustomer.has(key)) {
        byCustomer.set(key, {
          ...item,
          salesOffices: item.SalesOfficeID ? [item.SalesOfficeID] : []
        });
      } else {
        const acc = byCustomer.get(key);

        if (item.SalesOfficeID && !acc.salesOffices.includes(item.SalesOfficeID)) {
          acc.salesOffices.push(item.SalesOfficeID);
        }
      }
    }

    // Resultado final deduplicado
    return Array.from(byCustomer.values());

  } catch (err) {
    console.error('findCustomersBySalesOffice error:', err?.response?.data || err);
    return [];
  }
}

async function createRoute(routeBody) {

  const url = `/sap/c4c/odata/v1/c4codataapi/RouteCollection`;

  const destination = await getDestination({ destinationName: "SALES_CLOUD" });
  const csrfResp = await executeHttpRequest(
    destination,
    { method: "GET", url: `${url}?$top=1`, headers: { "x-csrf-token": "fetch" } }
  );

  const csrfToken = csrfResp.headers['x-csrf-token'];
  const cookies = csrfResp.headers['set-cookie'];


  const responseCreateRoute = await executeHttpRequest(
    destination,
    { method: "POST", 
      url: url, 
      headers: { 
        "x-csrf-token": csrfToken, 
        "Content-Type": "application/json", 
        "Cookie": cookies?.join('; ') }, 
        data: routeBody 
      }
  );

  const routeCreated = responseCreateRoute?.data?.d?.results
  return routeCreated;
}

async function getRedirectUrl(routeUUID) {
  const target = `/sap/byd/nav?bo=ROUTE_TT&nav_mode=TI&param.Key=${routeUUID}`;
  const destination = await getDestination({ destinationName: "SALES_CLOUD" });
  return `${destination.url}${target}`
}


export {
  getEmployeeInfo,
  getCustomers,
  createRoute,
  getRedirectUrl
}