import 'dotenv/config';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
const dataDir = path.join(__dirname, 'data');
const uploadDir = path.join(dataDir, 'uploads');
const storePath = path.join(dataDir, 'store.json');

fs.mkdirSync(uploadDir, { recursive: true });

function emptyStore() {
  return {
    settings: { wallpaper: null, updatedAt: new Date().toISOString() },
    banners: [],
    devices: []
  };
}

function readStore() {
  try {
    return JSON.parse(fs.readFileSync(storePath, 'utf8'));
  } catch {
    return emptyStore();
  }
}

function writeStore(store) {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
}

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

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/device/register', (req, res) => {
  const deviceId = String(req.body.deviceId || '').trim();
  if (!deviceId) return res.status(400).json({ error: 'deviceId obrigatorio' });

  const store = readStore();
  let device = store.devices.find((item) => item.deviceId === deviceId);
  if (!device) {
    let code = activationCode();
    while (store.devices.some((item) => item.activationCode === code)) code = activationCode();
    device = {
      id: nextId(store.devices),
      deviceId,
      activationCode: code,
      label: null,
      active: false,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    store.devices.push(device);
  }

  device.lastSeen = new Date().toISOString();
  writeStore(store);
  res.json({
    active: Boolean(device.active),
    activationCode: device.activationCode,
    label: device.label || null
  });
});

app.get('/api/launcher/config', (req, res) => {
  const deviceId = String(req.query.deviceId || '').trim();
  const store = readStore();
  const device = store.devices.find((item) => item.deviceId === deviceId);
  if (!device || !device.active) {
    return res.status(403).json({
      active: false,
      activationCode: device?.activationCode || null
    });
  }

  device.lastSeen = new Date().toISOString();
  writeStore(store);
  res.json({
    active: true,
    wallpaper: assetUrl(req, store.settings.wallpaper),
    banners: store.banners
      .slice()
      .sort((a, b) => (a.position || 0) - (b.position || 0) || (b.id || 0) - (a.id || 0))
      .map((item) => ({ title: item.title, image: assetUrl(req, item.image) }))
  });
});

app.get('/api/admin/overview', auth, (req, res) => {
  const store = readStore();
  res.json({
    wallpaper: assetUrl(req, store.settings.wallpaper),
    banners: store.banners
      .slice()
      .sort((a, b) => (a.position || 0) - (b.position || 0) || (b.id || 0) - (a.id || 0))
      .map((item) => ({ ...item, imageUrl: assetUrl(req, item.image) })),
    devices: store.devices
      .slice()
      .sort((a, b) => Number(a.active) - Number(b.active) || String(b.lastSeen).localeCompare(String(a.lastSeen)))
      .map((item) => ({
        id: item.id,
        code: item.activationCode,
        label: item.label,
        active: Boolean(item.active),
        lastSeen: item.lastSeen,
        createdAt: item.createdAt
      }))
  });
});

app.post('/api/admin/wallpaper', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Imagem obrigatoria' });
  const store = readStore();
  store.settings.wallpaper = req.file.filename;
  store.settings.updatedAt = new Date().toISOString();
  writeStore(store);
  res.json({ ok: true, wallpaper: assetUrl(req, req.file.filename) });
});

app.post('/api/admin/banners', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Imagem obrigatoria' });
  const store = readStore();
  store.banners.push({
    id: nextId(store.banners),
    title: String(req.body.title || 'Banner').trim(),
    image: req.file.filename,
    position: Number.parseInt(req.body.position || '0', 10) || 0,
    createdAt: new Date().toISOString()
  });
  writeStore(store);
  res.json({ ok: true });
});

app.delete('/api/admin/banners/:id', auth, (req, res) => {
  const store = readStore();
  store.banners = store.banners.filter((item) => String(item.id) !== String(req.params.id));
  writeStore(store);
  res.json({ ok: true });
});

app.post('/api/admin/devices/activate', auth, (req, res) => {
  const code = String(req.body.code || '').trim();
  const label = String(req.body.label || '').trim() || null;
  const store = readStore();
  const device = store.devices.find((item) => item.activationCode === code);
  if (!device) return res.status(404).json({ error: 'Codigo nao encontrado' });
  device.active = true;
  if (label) device.label = label;
  writeStore(store);
  res.json({ ok: true });
});

app.post('/api/admin/devices/:id/deactivate', auth, (req, res) => {
  const store = readStore();
  const device = store.devices.find((item) => String(item.id) === String(req.params.id));
  if (device) device.active = false;
  writeStore(store);
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`TV Launcher panel running on port ${port}`);
});
