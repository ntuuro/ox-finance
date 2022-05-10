"use strict";

var express = require("express");

var bodyParser = require("body-parser");

var cors = require("cors");

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
})); // Setting up corsOptions

var corsOptions = {
  origin: "http://localhost:3000"
};
app.use(cors(corsOptions)); // Defing global directory

global.__basedir = __dirname + "/"; // parse requests of content-type - application/json

app.use(express.json()); // parse requests of content-type - application/x-www-form-urlencoded

app.use(express.urlencoded({
  extended: true
})); // Index route

app.get("/", function (req, res) {
  res.json({
    message: "OX API Retrieved"
  });
});

require("./app/routes/routes.js")(app); // set port, listen for requests


var PORT = process.env.PORT || 8080;
app.listen(PORT, function () {
  console.log("Server is running on port ".concat(PORT, "."));
});
//# sourceMappingURL=server.js.map