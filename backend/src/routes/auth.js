import { Router } from 'express'; import bcrypt from 'bcryptjs'; import jwt from 'jsonwebtoken'; import { pool } from '../db.js'; import { auth } from '../middleware/auth.js';
const router = Router();
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username e senha são obrigatórios' });
  const { rows } = await pool.query('SELECT id, username, name, password_hash, role, store_id FROM users WHERE username=$1 LIMIT 1', [username]);
  const u = rows[0]; if (!u) return res.status(401).json({ error: 'Credenciais inválidas' });
  const ok = await bcrypt.compare(password, u.password_hash); if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });
  const token = jwt.sign({ id:u.id, username:u.username, name:u.name, role:u.role, store_id:u.store_id }, process.env.JWT_SECRET, { expiresIn:'10h' });
  res.json({ token, user: { id:u.id, username:u.username, name:u.name, role:u.role, store_id:u.store_id } });
});
router.get('/me', auth(), (req,res)=>res.json({ user: req.user }));
export default router;