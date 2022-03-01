// const { findAll } = require("../controllers/controller.js");
const {
  getExternalReport,
  getInternalReport,
} = require("../controllers/report.controller");

const {
  reconciliationByYearMonth,
  reconciliationByReference,
} = require("../controllers/reconciliation.controller");

module.exports = (app) => {
  var router = require("express").Router();

  //   get all data
  // router.get("/reconcile", findAll);

  // Get External Data Report
  router.get("/getExternalReport", getExternalReport);

  router.get("/getInternalReport", getInternalReport);

  router.post("/reconcialiation/by-year-month", reconciliationByYearMonth);

  router.post("/reconcialiation/by-reference", reconciliationByReference);

  app.use("/v1/api/", router);
};
