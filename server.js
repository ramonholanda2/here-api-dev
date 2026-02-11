const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;
const cors = require('cors');
const { getCustomers, getEmployeeInfo, createRoute, getRedirectUrl } = require('./services/services');

const hasVcap = !!process.env.VCAP_SERVICES;
console.log("Is Env CF: ", hasVcap)

if (!hasVcap) {
  require('@sap/xsenv').loadEnv();
}

app.use(cors());
app.use(express.json());

app.use("/public", cors(), express.static(path.join(__dirname, 'public')));

app.get('/', cors(), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/rotas', async (req, res, next) => {
  try {
    const routeCreated = await createRoute(req.body);
    return res.status(201).json(routeCreated);

  } catch (err) {
    next(err);
  }
});

app.get('/api/rotas/redirecionar/:routeUUID', async (req, res, next) => {
  try {
    const routeUUID = req.params.routeUUID;
    const redirectUrl = await getRedirectUrl(routeUUID);
    return res.send(encodeURIComponent(redirectUrl));
  } catch (error) {
    next(error);
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