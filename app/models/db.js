const Pool = require("pg").Pool;
const dbConfig = require("../config/db.config");

const pool = new Pool({
  user: dbConfig.USER,
  host: dbConfig.HOST,
  database: dbConfig.DB,
  password: dbConfig.PASS,
  port: dbConfig.PORT,
});

module.exports = pool;
