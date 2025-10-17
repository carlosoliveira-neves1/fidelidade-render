const express = require('express');
const pool = require('../db');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth(), async (_req, res) => {
  const { rows } = await pool.query('SELECT id, name, meta_visitas FROM stores ORDER BY name ASC');
  res.json(rows);
});

router.post('/', auth('ADMIN'), async (req, res) => {
  const { name, meta_visitas = null } = req.body;
  if (!name) return res.status(400).json({ error: 'name é obrigatório' });
  const { rows } = await pool.query(
    'INSERT INTO stores (name, meta_visitas) VALUES ($1,$2) RETURNING id, name, meta_visitas',
    [name, meta_visitas]
  );
  res.status(201).json(rows[0]);
});

module.exports = router;
