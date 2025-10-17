const express = require('express');
const pool = require('../db');
const { auth } = require('../middleware/auth');
const router = express.Router();

/**
 * Lista últimas visitas
 */
router.get('/', auth(), async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT v.id, v.client_id, c.name AS client_name, v.store_id, s.name AS store_name, v.created_at
      FROM visits v
      JOIN clients c ON c.id = v.client_id
      JOIN stores s ON s.id = v.store_id
      ORDER BY v.created_at DESC
      LIMIT 200
    `);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar visitas:', err);
    res.status(500).json({ error: 'Erro ao listar visitas' });
  }
});

/**
 * Registrar nova visita
 */
router.post('/', auth(), async (req, res) => {
  try {
    const { client_id, store_id } = req.body;
    if (!client_id || !store_id) {
      return res.status(400).json({ error: 'Campos obrigatórios: client_id e store_id' });
    }

    const { rows } = await pool.query(
      `INSERT INTO visits (client_id, store_id)
       VALUES ($1, $2)
       RETURNING *`,
      [client_id, store_id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao registrar visita:', err);
    res.status(500).json({ error: 'Erro ao registrar visita' });
  }
});

module.exports = router;
