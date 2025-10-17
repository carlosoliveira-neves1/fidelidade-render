const express = require('express');
const pool = require('../db');
const { auth } = require('../middleware/auth');
const router = express.Router();

/**
 * Relatório geral: total de clientes, visitas e resgates
 */
router.get('/geral', auth('ADMIN'), async (_req, res) => {
  try {
    const { rows: clientes } = await pool.query('SELECT COUNT(*) AS total FROM clients');
    const { rows: visitas } = await pool.query('SELECT COUNT(*) AS total FROM visits');
    const { rows: resgates } = await pool.query('SELECT COUNT(*) AS total FROM redemptions');

    res.json({
      clientes: parseInt(clientes[0].total),
      visitas: parseInt(visitas[0].total),
      resgates: parseInt(resgates[0].total),
    });
  } catch (err) {
    console.error('Erro ao gerar relatório geral:', err);
    res.status(500).json({ error: 'Erro ao gerar relatório geral' });
  }
});

/**
 * Relatório por loja
 */
router.get('/por-loja', auth('ADMIN'), async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.name AS loja,
             COUNT(DISTINCT c.id) AS clientes,
             COUNT(DISTINCT v.id) AS visitas,
             COUNT(DISTINCT r.id) AS resgates
      FROM stores s
      LEFT JOIN clients c ON c.store_id = s.id
      LEFT JOIN visits v ON v.store_id = s.id
      LEFT JOIN redemptions r ON r.store_id = s.id
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao gerar relatório por loja:', err);
    res.status(500).json({ error: 'Erro ao gerar relatório por loja' });
  }
});

module.exports = router;
