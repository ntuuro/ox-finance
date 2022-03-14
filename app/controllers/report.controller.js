const readXlsxFile = require("read-excel-file/node");
const axios = require("axios");

const getExternalReport = (req, res) => {
  // Get file and tab to read
  let file = `${req.data}`;
  readXlsxFile(file, { sheet: 2 })
    .then((rows) => {
      rows.shift();
      let reconciliations = [];
      rows.forEach((row) => {
        let reconciliation = {
          id: row[0],
          date: row[2],
          type: row[4],
          names: row[9],
          amount: row[16],
          balance: row[30],
          status: row[3],
        };
        reconciliations.push(reconciliation);
      });
      const filteredExternalData = reconciliations.filter(
        (recon) => recon.type?.toLowerCase() == "payment"
      );
      res.status(201).send({
        payload: filteredExternalData,
        message: "External report uploaded successfully",
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

const getInternalReport = (req, res) => {
  axios
    .get("https://dev-api.ox.rw/api/v1/reports/json/revenue", {
      params: {
        startDate: "2020-02-28",
        endDate: "2022-02-28",
        scope: "REVENUE",
      },
    })
    .then((response) => {
      console.log(response.data.payload);
      res.status(201).send({
        payload: response.data.payload,
        message: response.data.message,
      });
    })
    .catch((error) => {
      console.log(error);
    });
};

const upload = async (req, res) => {
  console.log(req.file);
  try {
    if (req.file == undefined) {
      return res.status(400).send("Please upload an excellent file!");
    }
    let path = __basedir + "uploads/" + req.file.filename;

    readXlsxFile(path, { sheet: 2 }).then((rows) => {
      rows.shift();
      let reconciliations = [];
      rows.forEach((row) => {
        let reconciliation = {
          id: row[0],
          date: row[2],
          type: row[4],
          names: row[9],
          amount: row[16],
          balance: row[30],
          status: row[3],
        };
        reconciliations.push(reconciliation);
      });
      const filteredExternalData = reconciliations.filter(
        (recon) => recon.type?.toLowerCase() == "payment"
      );
      res.status(201).send({
        payload: filteredExternalData,
        message: "External report uploaded successfully",
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: "Could not upload the file: " + req.file,
    });
  }
};

module.exports = {
  upload,
  getExternalReport,
  getInternalReport,
};
