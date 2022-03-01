const Pool = require("pg").Pool;
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "oxdb",
  password: "123login",
  port: 5432,
});

const reconcile = (request, response) => {
  pool.query(
    "SELECT * FROM reconciliation ORDER BY id ASC",
    (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results.rows);
    }
  );
};

module.exports = {
  reconcile,
};
