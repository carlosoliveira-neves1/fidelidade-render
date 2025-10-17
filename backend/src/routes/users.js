const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth('ADMIN'), async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, username, role, store_id FROM users ORDER BY id ASC');
  res.json(rows);
});

module.exports = router;
