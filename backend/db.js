// db.js
const { Pool } = require("pg");
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,        // ✅ Increased connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // ✅ Increased timeout for slower networks
  ssl: { rejectUnauthorized: false } // required for Supabase
});

pool.on("error", (err) => {
  console.error("Unexpected PG Pool error:", err.message);
});

module.exports = pool;
