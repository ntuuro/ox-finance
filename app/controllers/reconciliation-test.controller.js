const readXlsxFile = require("read-excel-file/node");
const axios = require("axios");

exports.reconciliation = (req, res) => {
  function getExternal(callBack) {
    // Get file and tab to read
    let file = "./recon.xlsx";
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
        callBack({ result: filteredExternalData });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  getExternal(function (resultsObject) {
    let externalData = resultsObject.result;

    axios
      .get("https://dev-api.ox.rw/api/v1/reports/json/revenue", {
        params: {
          startDate: "2021-01-28",
          endDate: "2022-02-28",
          scope: "REVENUE",
        },
      })
      .then((response) => {
        // let internalData = response.data.payload;
        // console.log("response.data.payload");
        // console.log(internalData[0].orderDate);
        // console.log("externalData");
        // console.log(externalData[0].id);
        // const intersection = internalData.filter((id) =>
        //   externalData.includes(id)
        // );
        // console.log(intersection);
      })
      .catch((error) => {
        console.log(error);
      });
  });
};
