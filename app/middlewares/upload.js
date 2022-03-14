const multer = require("multer");
let root = require("path").resolve("./");
const excelFilter = (req, file, cb) => {
  if (
    file.mimetype.includes("excel") ||
    file.mimetype.includes("spreadsheetml")
  ) {
    cb(null, true);
  } else {
    cb("Only excel file allowed", false);
  }
};

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, root + "/app/uploads/");
  },
  filename: (req, file, cb) => {
    console.log(file.originalname);
    cb(null, `${Date.now()}-ox-delivers-${file.originalname}`);
  },
});

var uploadFile = multer({ storage: storage, fileFilter: excelFilter });

module.exports = uploadFile;
