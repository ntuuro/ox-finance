const readXlsxFile = require("read-excel-file/node");
const axios = require("axios");
const e = require("express");
// const depots = { 2: "Tyazo Depot", 3: "Kayove Depot", 4: "LHS" };

// Read Data From External Inputs
async function readExcelFile(file) {
  let data = [];
  try {
    if (file == undefined) {
      // return res.status(400).send("Please upload an excellent file!");
      console.log("Please upload an excellent file!");
      // console.log("Please upload an excellent file");
    }
    let path = __basedir + "uploads/" + file.filename;
    data = readXlsxFile(path, { sheet: 6 })
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
          (recon) => recon.type?.toLowerCase() == "debit"
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
    let data = axios.get("https://api.ox.rw/api/v1/reports/json/revenue", {
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
  try {
    const dataFromExcel = await readExcelFile(req.file);
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
          // if (!idsFromInternal.map((u) => u.id).includes(data.trim())) {
          idsFromInternal.push({
            id: data.trim(),
            date: element.date,
            transactionId: element.transactionId,
            iAmount: element.amount,
          });
          // }
        });
      }
    });

    // if MoMoRef is available, check similarity to external data
    idsFromInternal.forEach((element) => {
      dataFromExcel.find((data) => {
        if (element.id == data.id) {
          rawData.push({
            id: element.id,
            // amount: data.amount,
            date: element.date,
            names: data.names,
            transactionId: element.transactionId,
            iAmount: element.iAmount,
          });
          rawDataSum += element.iAmount ? element.iAmount : 0;
        }
      });
    });

    const groupedData = await groupByYearAndMonth(rawData);
    let rawResult = [];

    for (let i = 0; i < groupedData.length; i++) {
      let tempTotal = 0;
      for (let j = 0; j < groupedData[i].length; j++) {
        tempTotal += groupedData[i][j].iAmount;
      }
      rawResult.push({
        totalAmount: tempTotal,
        data: groupedData[i],
      });
    }
    // console.log(groupedData);
    // groupedData.forEach((element) => {
    //

    // let referenceId = null;
    // let orderDate = null;
    // let clientName = null;
    // let totalAmountPerReferenceId = 0;

    // element.forEach((data) => {
    //   var YYYY = new Date(data.date).getFullYear();
    //   var MM = new Date(data.date).getMonth() + 1;
    //   var DD = new Date(data.date).getDate();

    //   referenceId = data.id;
    //   orderDate = `${YYYY}-${MM.toString().padStart(
    //     2,
    //     "0"
    //   )}-${DD.toString().padStart(2, "0")}`;
    //   clientName = data.names;
    //   totalAmountPerReferenceId = data.amount;

    //   rawResult.push({
    //     reference_id: referenceId,
    //     date: orderDate,
    //     client: clientName,
    //     amount: totalAmountPerReferenceId.toLocaleString() + " Rwf",
    //   });
    // });
    // });

    return res.json({
      rawResult,
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
    const dataFromExcel = await readExcelFile(req.file);
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
      if (element1.id != null) {
        totalAmountUnpaid += element1.amount;
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
// Method to groupBy date raneg
exports.reconciliationByDateRange = async (req, res) => {
  try {
    const dataFromExcel = await readExcelFile(req.file);
    const dataFromInternal = await readInternalData(
      req.body.startDate,
      req.body.endDate,
      req.body.scope
    );

    let rawData = [];
    let rawDataSum = 0;
    let idsFromInternal = [];

    // for (let index = 0; index < req.body.startDate.length; index++) {
    //   Loop from internal data to extract id where id is not null and is MoMo ref
    dataFromInternal.forEach((element) => {
      // Split MoMoRef into array where we can have multiple MoMoRef
      const id = element.id ? element.id.toString().split(",") : "";
      if (id != "") {
        console.log(element.date);
        if (
          element.date >= req.body.startDate &&
          element.date <= req.body.endDate
        ) {
          id.forEach((data) => {
            // if (!idsFromInternal.map((u) => u.id).includes(data.trim())) {
            idsFromInternal.push({
              id: data.trim(),
              date: element.date,
              transactionId: element.transactionId,
              iAmount: element.amount,
            });
            // }
          });
        }
      }
    });
    // }
    // if MoMoRef is available, check similarity to external data
    idsFromInternal.forEach((element) => {
      dataFromExcel.find((data) => {
        if (element.id == data.id) {
          rawData.push({
            id: element.id,
            // amount: data.amount,
            date: element.date,
            names: data.names,
            transactionId: element.transactionId,
            iAmount: element.iAmount,
          });
          rawDataSum += element.iAmount ? element.iAmount : 0;
        }
      });
    });

    const groupedData = await groupByYearAndMonth(rawData);
    let rawResultDateRange = [];

    for (let i = 0; i < groupedData.length; i++) {
      let tempTotal = 0;
      for (let j = 0; j < groupedData[i].length; j++) {
        tempTotal += groupedData[i][j].iAmount;
      }
      rawResultDateRange.push({
        totalAmount: tempTotal,
        data: groupedData[i],
      });
    }
    return res.json({
      rawResultDateRange,
    });
  } catch (error) {
    throw error;
  }
};
