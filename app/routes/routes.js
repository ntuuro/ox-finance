// const { findAll } = require("../controllers/controller.js");

const {
  getExternalReport,
  getInternalReport,
  upload,
} = require("../controllers/report.controller");

const {
  reconciliationByYearMonth,
  reconciliationByReference,
} = require("../controllers/reconciliation.controller");

const uploadFile = require("../middlewares/upload");

module.exports = (app) => {
  var router = require("express").Router();

  // Get External Data Report
  router.get("/getExternalReport", getExternalReport);

  router.get("/getInternalReport", getInternalReport);

  router.post("/upload", uploadFile.single("file"), upload);

  router.post(
    "/reconcialiation/by-year-month",
    uploadFile.single("file"),
    reconciliationByYearMonth
  );

  router.post(
    "/reconcialiation/by-reference",
    uploadFile.single("file"),
    reconciliationByReference
  );

  app.use("/v1/api/", router);
};
