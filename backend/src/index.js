// backend/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const visitRoutes = require('./routes/visits');
const redemptionRoutes = require('./routes/redemptions');
const reportRoutes = require('./routes/reports');
const storeRoutes = require('./routes/stores');
const importExportRoutes = require('./routes/import_export');

const app = express();

/** ---------- CORS ---------- **/
const allowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // permitir ferramentas sem Origin (ex.: PowerShell/cURL/Postman)
    if (!origin) return callback(null, true);
    if (allowed.length === 0) return callback(null, true); // sem restrição definida
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

/** ---------- Healthcheck ---------- **/
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

/** ---------- API Routes ---------- **/
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/redemptions', redemptionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/import-export', importExportRoutes);

/** ---------- 404 ---------- **/
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

/** ---------- Error Handler ---------- **/
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err?.message || err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});

/** ---------- Start Server ---------- **/
const PORT = process.env.PORT || 3001;      // Render injeta PORT automaticamente
const HOST = process.env.HOST || '0.0.0.0'; // manter 0.0.0.0 para containers

app.listen(PORT, HOST, () => {
  console.log(`✅ Servidor rodando em http://${HOST}:${PORT}`);
});

module.exports = app;
