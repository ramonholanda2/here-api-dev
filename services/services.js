
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const ENV = process.env;

async function getEmployeeInfo(employeeID) {
    try {
        console.log(employeeID)
        const url = `https://${ENV.SALES_CLOUD_ENV}.crm.ondemand.com/sap/c4c/odata/v1/c4codataapi/BusinessUserCollection?$filter=EmployeeID eq '${employeeID}'&$format=json`;
        console.log(url)
        const response = await axios.get(url, {
            headers: {
                'Authorization': 'Basic TkFUSEFOQS5TRUlERUw6Rm9ydGxldkAyMDI1Rm9ydGxldkAyMDI1LiEhLg==',
            }
        });


        const data = response.data.d.results.map(empregado => ({
            id: empregado.UserID,
            name: empregado.BusinessPartnerFormattedName,
            BusinessPartnerID: empregado.BusinessPartnerID
        }));
        return data[0];

    } catch (error) {
        throw new Error('Erro ao obter informações do empregado:', error);
    }
}


const AUTH_HEADER = {
  'Authorization': 'Basic TkFUSEFOQS5TRUlERUw6Rm9ydGxldkAyMDI1Rm9ydGxldkAyMDI1LiEhLg=='
};

const SALES_ARRANGEMENT_ORGUNIT_FIELD = 'OrganisationalUnitID';


async function getCustomers(queryOptions) {
  try {

    const orgUnitIds = await findOrganisationalUnitEmployees(queryOptions.employeeID);

    if (!orgUnitIds.length) {
      return []; 
    }

    const customers = await findCustomersBySalesOffice(orgUnitIds);

    return customers;

  } catch (err) {
    console.error('getCustomers error:', err?.response?.data || err);
    return { erro: true, mensagem: 'Falha ao buscar clientes por Sales Office.', detalhes: err?.message };
  }
}


async function findOrganisationalUnitEmployees(businessPartnerId) {
  const base = `https://${ENV.SALES_CLOUD_ENV}.crm.ondemand.com/sap/c4c/odata/cust/v1/organisational_unit_employee/OrganisationalUnitEmployeeAssignmentCollection`;
  const url = `${base}?$format=json&$filter=EmployeeID eq '${businessPartnerId}'`;

  try {
    const resp = await axios.get(url, { headers: AUTH_HEADER });

    const results = resp?.data?.d?.results || [];
    
    // Extrai e deduplica os IDs de unidade
    const ids = Array.from(
      new Set(
        results
          .map(r => r.OrgUnitID)
          .filter(Boolean)
      )
    );
    return ids;
  } catch (err) {
    console.error('findOrganisationalUnitEmployees error:', err?.response?.data || err);
    return [];
  }
}


async function findCustomersBySalesOffice(orgUnitIds = []) {
  if (!orgUnitIds.length) return [];

  const base = `https://${ENV.SALES_CLOUD_ENV}.crm.ondemand.com/sap/c4c/odata/cust/v1/customers_by_salesoffice/SalesArrangementCollection`;

  const filterOrgQuery = orgUnitIds
    .map(id => `SalesOfficeID eq '${String(id).replace(/'/g, "''")}'`)
    .join(' or ');

  const url = `${base}?$expand=CustomerPostalAddress&$format=json&$filter=${encodeURI(filterOrgQuery)}`;

  console.log(url);

  try {
    const resp = await axios.get(url, { headers: AUTH_HEADER });
    const results = resp?.data?.d?.results || [];

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

async function createRoute(routeBody){
   const URL = `https://${ENV.SALES_CLOUD_ENV}.crm.ondemand.com/sap/c4c/odata/v1/c4codataapi/RouteCollection`;

    const csrfResp = await axios.get(URL + "?$top=1", {
      headers: {
        'Authorization': 'Basic TkFUSEFOQS5TRUlERUw6Rm9ydGxldkAyMDI1Rm9ydGxldkAyMDI1LiEhLg==',
        "x-csrf-token": "fetch"
      }
    });

    const csrfToken = csrfResp.headers['x-csrf-token'];
    const cookies = csrfResp.headers['set-cookie'];

    const responseCreateRoute = await axios.post(URL, routeBody, {
      headers: {
        'Content-Type': "application/json",
        'Authorization': 'Basic TkFUSEFOQS5TRUlERUw6Rm9ydGxldkAyMDI1Rm9ydGxldkAyMDI1LiEhLg==',
        'x-csrf-token': csrfToken,
        'Cookie': cookies?.join('; ')
      }
    });
    const routeCreated = responseCreateRoute?.data?.d?.results
    console.log(routeCreated)
    return routeCreated;
}

 
export {
    getEmployeeInfo,
    getCustomers,
    createRoute
}