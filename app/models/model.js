const pool = require("./db.js");
const readXlsxFile = require("read-excel-file/node");

// Constructor
const Reconcile = function (reconcile) {
  this.id = reconcile.id;
  this.clientNames = reconcile.clientNames;
  this.momoRef = reconcile.momoRef;
  this.orderValue = reconcile.orderValue;
  this.orderDate = reconcile.orderDate;
  this.paidValue = reconcile.paidValue;
  this.paidDate = reconcile.paidDate;
  this.status = reconcile.status;
  this.belongsTo = reconcile.belongsTo;
};

Reconcile.getAll = (result) => {
  pool.query("SELECT * FROM reconciliation ORDER BY id ASC", (err, res) => {
    if (err) {
      console.log("Error: ", err);
      result(null, err);
      return;
    }

    console.log("Data: ", res);
    result(null, res);
  });
};

Reconcile.uploadExcel = async (req, res) => {
  try {
    if (req.file == undefined) {
      // ret
      return res.status(400).send("Please upload an excel");
    }
    let path = __basedir + "/uploads/" + req.file.filename;
    readXlsxFile(path).then((rows) => {
      rows.shit();
      let reconciliations = [];
      rows.forReach((row) => {
        let reconciliation = {
          id: row[0],
          clientNames: row[1],
          momoRef: row[2],
          orderValue: row[3],
          orderDate: row[4],
          paidValue: row[5],
          paidDate: row[6],
          status: row[7],
          belongsTo: row[8],
        };
        reconciliations.push(reconciliation);
      });
      Reconcile.bulkCreate(reconciliations)
        .then(() => {
          res.status(200).send({
            message: "File uploaded successfully: " + req.file.originalname,
          });
        })
        .catch((err) => {
          res.status(500).send({
            message: "Import failed",
            error: err.message,
          });
        });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Could not upload the file: " + req.file.originalname,
    });
  }
};

module.exports = Reconcile;
