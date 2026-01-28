const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8180;
const axios = require('axios')
const cors = require('cors');
const { getCustomers, getEmployeeInfo } = require('./services/services');
require('dotenv').config();


app.use(cors());
app.use(express.json());

app.use("/public", cors(), express.static(path.join(__dirname, 'public')));

app.get('/', cors(), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const ENV = process.env;
console.log(ENV.NODE_ENV);


app.post('/api/rotas', async (req, res, next) => {
  try {
    const URL = `https://${ENV.SALES_CLOUD_ENV}.crm.ondemand.com/sap/c4c/odata/v1/c4codataapi/RouteCollection`;

    const csrfResp = await axios.get(URL + "?$top=1", {
      headers: {
        'Authorization': 'Basic TkFUSEFOQS5TRUlERUw6Rm9ydGxldkAyMDI1Rm9ydGxldkAyMDI1LiEhLg==',
        "x-csrf-token": "fetch"
      }
    });

    const csrfToken = csrfResp.headers['x-csrf-token'];
    const cookies = csrfResp.headers['set-cookie'];

    await axios.post(URL, req.body, {
      headers: {
        'Content-Type': "application/json",
        'Authorization': 'Basic TkFUSEFOQS5TRUlERUw6Rm9ydGxldkAyMDI1Rm9ydGxldkAyMDI1LiEhLg==',
        'x-csrf-token': csrfToken,
        'Cookie': cookies?.join('; ')
      }
    });

    return res.status(201).json({ sucesso: true });

  } catch (err) {
    next(err);
  }
});


app.get('/api/clientes', async (req, res, next) => {
  try { 

    var customers = await getCustomers(req.query);

    return res.json(customers);

  } catch (error) {
    next(error);
  }
});


app.get('/api/empregado', async (req, res, next) => {
  try {

    const employeeData = await getEmployeeInfo(req.query.employeeID);
 
    return res.status(200).json(employeeData);

  } catch (error) {
    next(error);
  }
});


// =============================
// MIDDLEWARE GLOBAL DE ERROS
// =============================
app.use((err, req, res, next) => {
  console.error("ERRO CAPTURADO:", err?.response?.data || err);

  if (err.response) {
    return res.status(err.response.status || 500).json({
      error: true,
      origin: "SAP",
      details: err.response.data
    });
  }

  return res.status(500).json({
    error: true,
    message: "Erro interno no servidor",
    details: err.message
  });
});


app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});