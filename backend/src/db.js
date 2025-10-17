// backend/src/db.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  // o schema é configurado por 'SET search_path' após conectar (se fizer isso no seu código)
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }   // <- importante no Render/Locaweb
    : false,
});

module.exports = { pool };
