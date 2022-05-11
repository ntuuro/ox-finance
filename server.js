const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Setting up corsOptions
var corsOptions = {
  origin: "https://dev-finance.ox.rw",
};

app.use(cors(corsOptions));

// Defing global directory
global.__basedir = __dirname + "/";

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Index route
app.get("/", (req, res) => {
  res.json({ message: "OX API Retrieved" });
});

require("./app/routes/routes.js")(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
