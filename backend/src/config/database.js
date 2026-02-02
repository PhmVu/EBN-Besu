const { Pool } = require("pg");
const { db } = require("./env");

const pool = new Pool({
  host: db.host,
  port: db.port,
  database: db.name,
  user: db.user,
  password: db.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on("connect", () => {
  console.log("Database connected successfully");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

module.exports = pool;
