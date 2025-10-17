const express = require('express');
const pool = require('../db');
const { auth } = require('../middleware/auth');
const router = express.Router();

/**
 * Lista de resgates
 */
router.get('/', auth(), async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.id, r.client_id, c.name AS client_name, r.gift_name, r.created_at, s.name AS store_name
      FROM redemptions r
      JOIN clients c ON c.id = r.client_id
      JOIN stores s ON s.id = r.store_id
      ORDER BY r.created_at DESC
      LIMIT 200
    `);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar redemptions:', err);
    res.status(500).json({ error: 'Erro ao listar resgates' });
  }
});

/**
 * Registrar novo resgate
 */
router.post('/', auth(), async (req, res) => {
  try {
    const { client_id, store_id, gift_name } = req.body;
    if (!client_id || !store_id || !gift_name) {
      return res.status(400).json({ error: 'Campos obrigatórios: client_id, store_id, gift_name' });
    }

    const { rows } = await pool.query(
      `INSERT INTO redemptions (client_id, store_id, gift_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [client_id, store_id, gift_name]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao registrar resgate:', err);
    res.status(500).json({ error: 'Erro ao registrar resgate' });
  }
});

module.exports = router;
