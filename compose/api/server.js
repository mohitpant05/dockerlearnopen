const express = require("express");
const mysql = require("mysql2/promise");

const app = express();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "docker_lab",
  waitForConnections: true,
  connectionLimit: 10
});

app.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS db_time");

    res.json({
      message: "Node.js connected to MySQL!",
      databaseTime: rows[0].db_time
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database unavailable" });
  }
});

app.listen(3000, "0.0.0.0", () => {
  console.log("API listening on port 3000");
});
