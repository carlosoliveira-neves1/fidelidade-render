const express = require('express');
const multer = require('multer');
const pool = require('../db');
const { auth } = require('../middleware/auth');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

/**
 * Importar lista de clientes (CSV)
 */
router.post('/clientes/import', auth('ADMIN'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo CSV é obrigatório' });
    const content = req.file.buffer.toString('utf8');
    const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
    let count = 0;

    for (const line of lines.slice(1)) {
      const [name, cpf, phone, email, store_id] = line.split(';').map(s => s.trim());
      if (!name) continue;
      await pool.query(
        `INSERT INTO clients (name, cpf, phone, email, store_id)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (cpf) DO NOTHING`,
        [name, cpf, phone, email, store_id || null]
      );
      count++;
    }

    res.json({ imported: count });
  } catch (err) {
    console.error('Erro ao importar clientes:', err);
    res.status(500).json({ error: 'Erro ao importar clientes' });
  }
});

/**
 * Exportar clientes em CSV
 */
router.get('/clientes/export', auth('ADMIN'), async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, cpf, phone, email, store_id, created_at FROM clients ORDER BY id ASC'
    );

    const header = 'id;name;cpf;phone;email;store_id;created_at\n';
    const csv = header + rows.map(r => Object.values(r).join(';')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="clientes.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Erro ao exportar clientes:', err);
    res.status(500).json({ error: 'Erro ao exportar clientes' });
  }
});

module.exports = router;
