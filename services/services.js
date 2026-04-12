
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
      BusinessPartnerID: employee.BusinessPartnerID,
      EmployeeID: employee.EmployeeID
    }));
    return data[0];

  } catch (error) {
    throw new Error('Erro ao obter informações do empregado:', error);
  }
}

async function getCustomers(queryOptions) {
  console.log('queryOptions', queryOptions);
  try {
    let customers = [];

    if (queryOptions.employeeID) {
      const orgUnitIds = await findOrganisationalUnitEmployees(queryOptions.employeeID);

      if (!orgUnitIds.length) {
        return { erro: true, mensagem: `Nenhuma Sales Office encontrada para o empregado ${queryOptions.employeeID}.` };
      }

      customers = await findCustomersBySalesOffice(orgUnitIds);
    }

    if (queryOptions.salesOfficesIDs) {
      const orgUnitIds = queryOptions.salesOfficesIDs.split(',');
      console.log('orgUnitIds', orgUnitIds);
      customers = await findCustomersBySalesOffice(orgUnitIds);
    }

    return customers;

  } catch (err) {
    console.error('getCustomers error:', err);
    return { erro: true, mensagem: 'Falha ao buscar clientes por Sales Office.', detalhes: err?.message };
  }
}


async function getSalesOffices(queryOptions) {

  if (queryOptions.employeeID) {
    const response = await findOrganisationalUnitEmployees(queryOptions.employeeID, true);
    if (response.length > 0) {
      return { haveOfficesByEmployee: true, offices: response };
    }
  }

  const pathAllOffices = "/sap/c4c/odata/v1/c4codataapi/OrganisationalUnitFunctionsCollection"
    + "?$filter=SalesOfficeIndicator eq true and OrganisationalUnit/LifeCycleStatusCode eq '2'"
    + "&$expand=OrganisationalUnit,OrganisationalUnit/OrganisationalUnitNameAndAddress&$select=OrganisationalUnitID,OrganisationalUnit/OrganisationalUnitNameAndAddress/Name"
    + "&$format=json";

  console.log('pathAllOffices', pathAllOffices);

  const destination = await getDestination({ destinationName: "SALES_CLOUD" });
  const allOffices = await executeHttpRequest(
    destination,
    { method: "GET", url: pathAllOffices }
  );

  const results = allOffices?.data?.d?.results || [];

  const salesOffices = results.map(office => ({ OrgUnitID: office.OrganisationalUnitID, Name: office.OrganisationalUnit.OrganisationalUnitNameAndAddress[0].Name }));

  return { haveOfficesByEmployee: false, offices: salesOffices };
}

async function findOrganisationalUnitEmployees(businessPartnerId, onlyAndNamesIDs = false) {

  const base = `/sap/c4c/odata/cust/v1/organisational_unit_employee/OrganisationalUnitEmployeeAssignmentCollection`;
  const url = `${base}?$format=json&$filter=EmployeeID eq '${businessPartnerId}'`;

  try {
    const destination = await getDestination({ destinationName: "SALES_CLOUD" });
    const response = await executeHttpRequest(destination, { method: "GET", url });

    const results = response?.data?.d?.results || [];
    console.log('findOrganisationalUnitEmployees', results);

    if (onlyAndNamesIDs) {
      const uniqueMap = new Map();
      results.forEach(office => {
        if (office.OrgUnitID) {
          if (!uniqueMap.has(office.OrgUnitID)) {
            uniqueMap.set(office.OrgUnitID, {
              OrgUnitID: office.OrgUnitID,
              Name: office.Name
            });
          }
        }
      });

      return Array.from(uniqueMap.values());
    }

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

  const base = process.env.CUSTOMER_ODATA_PATH;
  if (!base) return [];

  const filterOrgQuery = orgUnitIds
    .map(id => `CSALES_OFFICE_UUID eq '${String(id).replace(/'/g, "''")}'`)
    .join(' or ');

  const url = `${base}?$format=json&$filter=${encodeURI(filterOrgQuery)}&$top=99999`;

  console.log(url);

  try {
    const destination = await getDestination({ destinationName: "SALES_CLOUD" });
    const response = await executeHttpRequest(
      destination,
      { method: "GET", url: url }
    );

    const payload = response?.data?.d?.results || [];
    const customersWithLocation = payload.filter(item => Number.parseFloat(item.CLATITUDE_MEASURE) != 0.0 && Number.parseFloat(item.CLONGITUDE_MEASURE) != 0.0);
    const results = mapResponsePayload(customersWithLocation);


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


function mapResponsePayload(results) {
  const payload = [];

  for (const item of results) {
    const base = {
      CustomerInternalID: item.CBP_UUID,
      CustomerName: item.TBP_UUID,
      FormattedPostalAddressDescription: item.CFRMTD_PSTL_ADDR,
      zCNPJ_KUT: item.Cs1ANs020182A49D8C624,
      LatitudeMeasure: item.CLATITUDE_MEASURE,
      LongitudeMeasure: item.CLONGITUDE_MEASURE,
      SalesGroupName: item.TSALES_GROUP_UUID,
      SalesGroupID: item.CSALES_GROUP_UUID,
      SalesOfficeName: item.TSALES_OFFICE_UUID,
      SalesOfficeID: item.CSALES_OFFICE_UUID,
      Z_Classificao_KUT: item.CVARIATUSROOT47DABF57C1EE435F,

      CustomerPostalAddress: [
        {
          StreetName: item.CSTREET_NAME,
          StreetPostalCode: item.CSTREET_POSTAL,
          RegionCode: item.CREGION_CODE,
          CountryCode: item.CCOUNTRY_CODE,
          CityName: item.CCITY_NAME
        }
      ]

    };

    payload.push(base);
  }

  return payload;
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
    {
      method: "POST",
      url: url,
      headers: {
        "x-csrf-token": csrfToken,
        "Content-Type": "application/json",
        "Cookie": cookies?.join('; ')
      },
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

async function getRedirectSalesCloudURL() {
  const destination = await getDestination({ destinationName: "SALES_CLOUD" });
  return `${destination.url}`
}

async function getAllEmployees() {

  const url = `/sap/c4c/odata/v1/c4codataapi/EmployeeCollection?$select=EmployeeID,BusinessPartnerFormattedName&$format=json`;
  const destination = await getDestination({ destinationName: "SALES_CLOUD" });
  const response = await executeHttpRequest(
    destination,
    { method: "GET", url: url }
  );
  const employees = response?.data?.d?.results || [];
  return employees
}


export {
  getEmployeeInfo,
  getCustomers,
  createRoute,
  getRedirectUrl,
  getSalesOffices,
  getRedirectSalesCloudURL,
  getAllEmployees
}