const Reconcile = require("../models/model.js");

exports.findAll = (req, res) => {
  Reconcile.getAll((err, data) => {
    if (err)
      res.status(500).send({
        message: err.message || "Error occurred while retrieving data.",
      });
    else res.send({ data: data.rows, message: "Data Retrieved Successfully" });
  });
};

exports.uploadExcel = (req, res) => {
  Reconcile.uploadExcel((err, data) => {
    if (err)
      res.status(500).send({
        message: err.message || "Error uploading a file",
      });
    else
      res
        .status(201)
        .send({ data: data.rows, message: "Data uploaded successfully" });
  });
};

// exports.getReconciliation = (req, res) => {
//   Reconcile.findAll()
//     .then((data) => {
//       res.send(data);
//     })
//     .catch((err) => {
//       res.status(500).send({
//         message:
//           err.message || "Some error occurred while retrieving tutorials.",
//       });
//     });
// };
