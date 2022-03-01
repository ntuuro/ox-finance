const readXlsxFile = require("read-excel-file/node");
const axios = require("axios");

// Read Data From External Inputs
async function readExcelFile(file) {
  let data = [];

  try {
    data = readXlsxFile(file, { sheet: 2 })
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

        return filteredExternalData;
      })
      .catch((err) => {
        console.log(err);
      });

    return data;
  } catch (error) {
    throw error;
  }
}

// Read Data From Internal Database
async function readInternalData(file) {
  try {
    data = readXlsxFile(file, { sheet: 4 })
      .then((rows) => {
        rows.shift();
        let reconciliations = [];
        rows.forEach((row) => {
          let reconciliation = {
            id: row[6],
            date: row[0],
            names: row[2],
            amount: row[4],
          };
          reconciliations.push(reconciliation);
        });

        return reconciliations;
      })
      .catch((err) => {
        console.log(err);
      });

    return data;
  } catch (error) {
    throw error;
  }
}

// Do Not Touch: Group Raw Data By Year And Month
async function groupByYearAndMonth(data) {
  try {
    var ref = {};
    var res = data.reduce(function (arr, o) {
      var YYYY = new Date(o.date).getFullYear();
      var MM = new Date(o.date).getMonth() + 1;

      let date = `${YYYY}-${MM.toString().padStart(2, "0")}`;
      if (!(date in ref)) {
        ref[date] = arr.length;
        arr.push([]);
      }
      arr[ref[date]].push(o);

      return arr;
    }, []);

    return res;
  } catch (error) {
    throw error;
  }
}

exports.reconciliationByYearMonth = async (req, res) => {
  try {
    const dataFromExcel = await readExcelFile(`${req.body.data}`);
    const dataFromInternal = await readInternalData(`${req.body.data}`);

    let rawData = [];

    //   Loop from internal data to extract id where id is not null and is MoMo ref
    dataFromInternal.forEach((element) => {
      // Split MoMoRef into array where we can have multiple MoMoRef
      const id = element.id ? element.id.toString().split(",") : "";

      // if MoMoRef is available, check similarity to external data
      if (id) {
        id.forEach((element1) => {
          dataFromExcel.find((data) => {
            if (element1 == data.id) {
              rawData.push({
                id: element.id,
                amount: element.amount,
                date: element.date,
              });
            }
          });
        });
      }
    });

    //   Group data by Year and Month
    const groupedData = await groupByYearAndMonth(rawData);
    let result = [];

    groupedData.forEach((element) => {
      let date = null;
      let totalAmountByMonth = 0;

      element.forEach((data) => {
        var YYYY = new Date(data.date).getFullYear();
        var MM = new Date(data.date).getMonth() + 1;

        date = `${YYYY}-${MM.toString().padStart(2, "0")}`;
        totalAmountByMonth += data.amount;
      });

      result.push({
        date,
        amount: totalAmountByMonth.toLocaleString() + " Rwf",
      });
    });

    return res.json(result);
  } catch (error) {
    throw error;
  }
};

async function groupByReference(data) {
  try {
    var ref = {};
    var res = data.reduce(function (arr, o) {
      let referenceId = o.id;
      if (!(referenceId in ref)) {
        ref[referenceId] = arr.length;
        arr.push([]);
      }
      arr[ref[referenceId]].push(o);

      return arr;
    }, []);

    return res;
  } catch (error) {
    throw error;
  }
}

exports.reconciliationByReference = async (req, res) => {
  try {
    const dataFromExcel = await readExcelFile(`${req.body.data}`);
    const dataFromInternal = await readInternalData(`${req.body.data}`);

    let rawData = [];

    //   Loop from internal data to extract id where id is not null and is MoMo ref
    dataFromInternal.forEach((element) => {
      // Split MoMoRef into array where we can have multiple MoMoRef
      const id = element.id ? element.id.toString().split(",") : "";

      // if MoMoRef is available, check similarity to external data
      if (id) {
        id.forEach((element1) => {
          dataFromExcel.find((data) => {
            if (element1 == data.id) {
              rawData.push({
                id: element.id,
                names: element.names,
                amount: element.amount,
                date: element.date,
              });
            }
          });
        });
      }
    });

    const groupedData = await groupByReference(rawData);
    let result = [];

    groupedData.forEach((element) => {
      let referenceId = null;
      let orderDate = null;
      let clientName = null;
      let totalAmountPerReferenceId = 0;

      element.forEach((data) => {
        var YYYY = new Date(data.date).getFullYear();
        var MM = new Date(data.date).getMonth() + 1;
        var DD = new Date(data.date).getDate();

        referenceId = data.id;
        orderDate = `${YYYY}-${MM.toString().padStart(
          2,
          "0"
        )}-${DD.toString().padStart(2, "0")}`;
        clientName = data.names;
        totalAmountPerReferenceId += data.amount;
      });

      result.push({
        reference_id: referenceId,
        date: orderDate,
        client: clientName,
        amount: totalAmountPerReferenceId.toLocaleString() + " Rwf",
      });
    });

    return res.json(result);
  } catch (error) {
    throw error;
  }
};
