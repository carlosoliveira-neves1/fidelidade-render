const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username e password são obrigatórios' });
    }

    const { rows } = await pool.query(
      'SELECT id, username, password_hash, role, lock_loja, store_id FROM users WHERE username = $1 LIMIT 1',
      [username]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign(
      { sub: user.id, role: user.role, store_id: user.store_id },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role, store_id: user.store_id }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao autenticar' });
  }
});

module.exports = router;
