const readXlsxFile = require("read-excel-file/node");
const axios = require("axios");
const e = require("express");
const depots = { 2: "Tyazo Depot", 3: "Kayove Depot", 4: "LHS" };

// Read Data From External Inputs
async function readExcelFile(file, depotId) {
  let data = [];
  try {
    if (file == undefined) {
      // return res.status(400).send("Please upload an excellent file!");
      console.log("Please upload an excellent file!");
      // console.log("Please upload an excellent file");
    }
    let path = __basedir + "uploads/" + file.filename;
    data = readXlsxFile(path, { sheet: parseInt(depotId) })
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
async function readInternalData(startDate, endDate, scope) {
  try {
    let data = axios.get("https://dev-api.ox.rw/api/v1/reports/json/revenue", {
      params: {
        startDate: startDate,
        endDate: endDate,
        scope: scope,
      },
    });
    let result = data.then((res) => {
      let payload = res.data.payload;
      let reconciliations = [];
      payload.forEach((row) => {
        let reconciliation = {
          id: row.momoRefCode,
          date: row.orderDate,
          paidDate: row.paidDate,
          names: row.clientNames,
          amount: row.amount,
          depotId: row.depot,
          orderId: row.orderId,
          transactionId: row.transactionId,
        };
        reconciliations.push(reconciliation);
      });
      return reconciliations;
    });
    return result;
  } catch (error) {
    // throw error;
    console.log(error.response.data);
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

function groupByField(data, field) {
  try {
    return data.reduce((rv, x) => {
      (rv[x[field]] = rv[x[field]] || []).push(x);
      return rv;
    }, {});
  } catch (error) {
    throw error;
  }
}

function groupById(data) {
  try {
    data.forEach((element, value) => {});
  } catch (error) {
    throw console.error();
  }
}

exports.reconciliationByYearMonth = async (req, res) => {
  if (req.file == undefined) {
    return res.status(400).send("Please upload an excellent file!");
  }
  try {
    const dataFromExcel = await readExcelFile(req.file, req.body.depotId);
    const dataFromInternal = await readInternalData(
      req.body.startDate,
      req.body.endDate,
      req.body.scope
    );

    let groupedFieldData = groupByField(dataFromInternal, "orderId");

    const resultsValuesFromInternal = Object.values(groupedFieldData);

    let totalSums = [];
    for (let index = 0; index < resultsValuesFromInternal.length; index++) {
      const element = resultsValuesFromInternal[index];

      let sum = 0;
      let referenceId = [];
      let id = null;
      let date = null;
      let depot = null;
      let names = null;
      element.forEach((element1) => {
        if (element1.id != null) {
          id = element1.orderId;
          referenceId.push(element1.id);
          sum += element1.amount;
          date = element1.date;
          depot = element1.depotId;
          names = element1.names;
        }
      });
      if (depot == depots[req.body.depotId]) {
        totalSums.push({ id, sum, date, depot, names, referenceId });
      }
    }

    let mismatched = [];
    let matched = [];

    totalSums.forEach((element) => {
      let externalSum = 0;
      dataFromExcel.forEach((element1) => {
        if (element.referenceId.includes(element1.id.toString())) {
          externalSum += element1.amount;
        }
      });
      if (element.sum == externalSum) {
        matched.push(element);
      } else {
        mismatched.push(element);
      }
    });

    //   Group data by Year and Month
    const groupedData = await groupByYearAndMonth(matched);
    let result = [];

    groupedData.forEach((element) => {
      let date = null;
      let totalAmountByMonth = 0;

      element.forEach((data) => {
        // console.log(data);
        var YYYY = new Date(data.date).getFullYear();
        var MM = new Date(data.date).getMonth() + 1;

        date = `${YYYY}-${MM.toString().padStart(2, "0")}`;
        totalAmountByMonth += data.sum;
      });

      result.push({
        date,
        amount: totalAmountByMonth.toLocaleString() + " Rwf",
      });
    });

    return res.json({
      result: result,
      matchedData: groupedData,
      mismatchedData: mismatched,
    });
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
    const dataFromExcel = await readExcelFile(req.file, req.body.depotId);
    const dataFromInternal = await readInternalData(
      req.body.startDate,
      req.body.endDate,
      req.body.scope
    );

    let rawData = [];
    let rawDataSum = 0;
    let idsFromInternal = [];

    //   Loop from internal data to extract id where id is not null and is MoMo ref
    dataFromInternal.forEach((element) => {
      // Split MoMoRef into array where we can have multiple MoMoRef
      const id = element.id ? element.id.toString().split(",") : "";
      if (id != "") {
        id.forEach((data) => {
          if (!idsFromInternal.map((u) => u.id).includes(data.trim())) {
            idsFromInternal.push({
              id: data.trim(),
              date: element.date,
            });
          }
        });
      }
    });

    // if MoMoRef is available, check similarity to external data
    idsFromInternal.forEach((element) => {
      dataFromExcel.find((data) => {
        if (element.id == data.id) {
          rawData.push({
            id: element.id,
            amount: data.amount,
            date: element.date,
            names: data.names,
          });
          rawDataSum += data.amount ? data.amount : 0;
        }
      });
    });

    var idsInternal = [];
    // Data from external not reflected in internal
    // Data frm internal without momo reference
    let totalAmountUnpaid = 0;
    let dataUnpaid = [];
    dataFromInternal.forEach((element1) => {
      if (element1.id != null && element1.depotId == depots[req.body.depotId]) {
        totalAmountUnpaid += element1.unpaidAmount;
        dataUnpaid.push(element1);
      }
      // Split MoMoRef into array where we can have multiple MoMoRef
      const id = element1.id ? element1.id.toString().split(",") : "";
      if (id) {
        id.forEach((element) => {
          idsInternal.push(parseInt(element));
        });
      }
    });

    // Data from External that doesn't reflect in internal
    let totalAmountPaid = 0;
    let dataPaid = [];
    let totalAmountUnrecorded = 0;
    let dataUnrecorded = [];
    dataFromExcel.forEach((element) => {
      totalAmountPaid += element.amount;
      dataPaid.push(element);
      if (!idsInternal.includes(element.id)) {
        totalAmountUnrecorded += element.amount;
        dataUnrecorded.push(element);
      }
    });

    const groupedData = await groupByReference(rawData);
    let rawResult = [];

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
        totalAmountPerReferenceId = data.amount;

        rawResult.push({
          reference_id: referenceId,
          date: orderDate,
          client: clientName,
          amount: totalAmountPerReferenceId.toLocaleString() + " Rwf",
        });
      });
    });

    return res.json({
      raw_result: { sum: rawDataSum, data: rawResult },
      unpaid_result: { sum: totalAmountUnpaid, data: dataUnpaid },
      paid_result: { sum: totalAmountPaid, data: dataPaid },
      unrecorded_result: { sum: totalAmountUnrecorded, data: dataUnrecorded },
    });
  } catch (error) {
    throw error;
  }
};
