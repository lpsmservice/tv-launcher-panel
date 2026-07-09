import 'dotenv/config';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import multer from 'multer';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
const dataDir = path.join(__dirname, 'data');
const uploadDir = path.join(dataDir, 'uploads');
const dbPath = path.join(dataDir, 'launcher.db');

fs.mkdirSync(uploadDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    wallpaper TEXT,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    image TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL UNIQUE,
    activation_code TEXT NOT NULL UNIQUE,
    label TEXT,
    active INTEGER NOT NULL DEFAULT 0,
    last_seen TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  INSERT OR IGNORE INTO settings (id, wallpaper, updated_at)
  VALUES (1, NULL, datetime('now'));
`);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    }
  }),
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\/(png|jpeg|jpg|webp)$/i.test(file.mimetype));
  },
  limits: { fileSize: 8 * 1024 * 1024 }
});

function baseUrl(req) {
  const configured = process.env.PUBLIC_BASE_URL;
  return (configured || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

function assetUrl(req, file) {
  return file ? `${baseUrl(req)}/uploads/${file}` : null;
}

function auth(req, res, next) {
  const token = req.get('x-admin-password') || req.query.password;
  if (token !== adminPassword) return res.status(401).json({ error: 'Senha invalida' });
  next();
}

function activationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/device/register', (req, res) => {
  const deviceId = String(req.body.deviceId || '').trim();
  if (!deviceId) return res.status(400).json({ error: 'deviceId obrigatorio' });

  const existing = db.prepare('SELECT * FROM devices WHERE device_id = ?').get(deviceId);
  if (existing) {
    db.prepare('UPDATE devices SET last_seen = datetime("now") WHERE device_id = ?').run(deviceId);
    return res.json({
      active: Boolean(existing.active),
      activationCode: existing.activation_code,
      label: existing.label || null
    });
  }

  let code = activationCode();
  while (db.prepare('SELECT id FROM devices WHERE activation_code = ?').get(code)) code = activationCode();
  db.prepare(`
    INSERT INTO devices (device_id, activation_code, active, last_seen, created_at)
    VALUES (?, ?, 0, datetime('now'), datetime('now'))
  `).run(deviceId, code);
  res.json({ active: false, activationCode: code, label: null });
});

app.get('/api/launcher/config', (req, res) => {
  const deviceId = String(req.query.deviceId || '').trim();
  const device = db.prepare('SELECT * FROM devices WHERE device_id = ?').get(deviceId);
  if (!device || !device.active) {
    return res.status(403).json({
      active: false,
      activationCode: device?.activation_code || null
    });
  }

  db.prepare('UPDATE devices SET last_seen = datetime("now") WHERE device_id = ?').run(deviceId);
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const banners = db.prepare('SELECT title, image FROM banners ORDER BY position ASC, id DESC').all();
  res.json({
    active: true,
    wallpaper: assetUrl(req, settings.wallpaper),
    banners: banners.map((item) => ({ title: item.title, image: assetUrl(req, item.image) }))
  });
});

app.get('/api/admin/overview', auth, (req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const banners = db.prepare('SELECT * FROM banners ORDER BY position ASC, id DESC').all();
  const devices = db.prepare('SELECT * FROM devices ORDER BY active ASC, last_seen DESC').all();
  res.json({
    wallpaper: assetUrl(req, settings.wallpaper),
    banners: banners.map((item) => ({ ...item, imageUrl: assetUrl(req, item.image) })),
    devices: devices.map((item) => ({
      id: item.id,
      code: item.activation_code,
      label: item.label,
      active: Boolean(item.active),
      lastSeen: item.last_seen,
      createdAt: item.created_at
    }))
  });
});

app.post('/api/admin/wallpaper', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Imagem obrigatoria' });
  db.prepare('UPDATE settings SET wallpaper = ?, updated_at = datetime("now") WHERE id = 1').run(req.file.filename);
  res.json({ ok: true, wallpaper: assetUrl(req, req.file.filename) });
});

app.post('/api/admin/banners', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Imagem obrigatoria' });
  const title = String(req.body.title || 'Banner').trim();
  const position = Number.parseInt(req.body.position || '0', 10) || 0;
  db.prepare(`
    INSERT INTO banners (title, image, position, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(title, req.file.filename, position);
  res.json({ ok: true });
});

app.delete('/api/admin/banners/:id', auth, (req, res) => {
  db.prepare('DELETE FROM banners WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/admin/devices/activate', auth, (req, res) => {
  const code = String(req.body.code || '').trim();
  const label = String(req.body.label || '').trim() || null;
  const result = db.prepare('UPDATE devices SET active = 1, label = COALESCE(?, label) WHERE activation_code = ?')
    .run(label, code);
  if (!result.changes) return res.status(404).json({ error: 'Codigo nao encontrado' });
  res.json({ ok: true });
});

app.post('/api/admin/devices/:id/deactivate', auth, (req, res) => {
  db.prepare('UPDATE devices SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`TV Launcher panel running on port ${port}`);
});
