const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SEED_FILE = path.join(DATA_DIR, 'seed.json');
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads', 'feedbacks');

function loadEnv() {
  const envPath = path.join(ROOT_DIR, '.env');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'dambc123';
const AUTH_SECRET = process.env.AUTH_SECRET || crypto.createHash('sha256').update(`bcd:${ADMIN_PASSWORD}`).digest('hex');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon'
};

const IMAGE_EXTENSIONS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.gif']);
const ALLOWED_CATEGORIES = new Set(['Lục Hào', 'Tử Vi']);

function ensureDataSetup() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    if (fs.existsSync(SEED_FILE)) {
      fs.copyFileSync(SEED_FILE, DATA_FILE);
    } else {
      const fallback = {
        profile: {
          name: 'Bùi Công Đam',
          sealText: 'CÔNG ĐAM',
          tagline: 'Nghiệm Lý Lục Hào & Tử Vi',
          bio: 'Sổ tay lưu trữ thông tin cá nhân, các ca luận giải thực tế và phản hồi (feedback) trên các hội nhóm Lục Hào & Tử Vi.',
          philosophy: 'Lấy thực chứng làm gốc, giữ lại những gì đã được thời gian kiểm nghiệm.',
          contact: { facebook: '', zalo: '', email: '', note: '' }
        },
        feedbacks: [],
        articles: []
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(fallback, null, 2), 'utf8');
    }
  }
}

function readData() {
  ensureDataSetup();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  return {
    profile: parsed.profile || {},
    feedbacks: Array.isArray(parsed.feedbacks) ? parsed.feedbacks : [],
    articles: Array.isArray(parsed.articles) ? parsed.articles : []
  };
}

function writeData(data) {
  ensureDataSetup();
  const tmpFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpFile, DATA_FILE);
}

function normalizeCategory(value) {
  return ALLOWED_CATEGORIES.has(value) ? value : 'Lục Hào';
}

function getStorageStats() {
  ensureDataSetup();
  const entries = fs.readdirSync(UPLOAD_DIR, { withFileTypes: true });
  let imageCount = 0;
  let totalBytes = 0;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;
    imageCount += 1;
    totalBytes += fs.statSync(path.join(UPLOAD_DIR, entry.name)).size;
  }
  return {
    imageCount,
    totalBytes,
    totalMB: Number((totalBytes / (1024 * 1024)).toFixed(2))
  };
}

function syncFeedbackFolder() {
  const data = readData();
  const existingUrls = new Set(data.feedbacks.map((item) => item.imageUrl));
  const entries = fs.readdirSync(UPLOAD_DIR, { withFileTypes: true });
  let addedCount = 0;

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;
    const urlPath = `/uploads/feedbacks/${entry.name}`;
    if (existingUrls.has(urlPath)) continue;

    const stat = fs.statSync(path.join(UPLOAD_DIR, entry.name));
    const dateStr = stat.mtime.toISOString().slice(0, 10);
    const baseLabel = path.basename(entry.name, ext).replace(/[-_]+/g, ' ').trim();

    data.feedbacks.unshift({
      id: `fb-${crypto.randomUUID().slice(0, 8)}`,
      category: baseLabel.toLowerCase().includes('tu vi') || baseLabel.toLowerCase().includes('tuvi') ? 'Tử Vi' : 'Lục Hào',
      topic: 'Đồng bộ từ thư mục',
      title: `Feedback lưu trữ (${entry.name})`,
      note: 'Ảnh được thêm trực tiếp vào thư mục uploads/feedbacks. Bạn có thể cập nhật lại tiêu đề và ghi chú nghiệm lý trong trang Quản trị.',
      imageUrl: urlPath,
      date: dateStr,
      source: 'Hội nhóm',
      featured: false
    });
    addedCount += 1;
  }

  if (addedCount > 0) {
    writeData(data);
  }
  return { addedCount, totalFeedbacks: data.feedbacks.length };
}

function createToken() {
  const payload = {
    role: 'admin',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [encoded, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return payload.role === 'admin' && typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function checkPassword(inputPassword) {
  if (typeof inputPassword !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(inputPassword).digest();
  const hashB = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function getBearerToken(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return '';
  return auth.slice(7).trim();
}

function requireAdmin(req, res) {
  const token = getBearerToken(req);
  if (!verifyToken(token)) {
    sendJson(res, 401, { error: 'Phiên đăng nhập hết hạn hoặc chưa hợp lệ. Vui lòng đăng nhập lại.' });
    return false;
  }
  return true;
}

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(body);
}

function readJsonBody(req, maxBytes = 15 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(Object.assign(new Error('Dữ liệu gửi lên vượt quá giới hạn cho phép.'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(Object.assign(new Error('Dữ liệu JSON không hợp lệ.'), { statusCode: 400 }));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

function saveBase64Image(imageData, fileNameHint = '') {
  const match = /^data:(image\/(?:webp|png|jpeg|jpg|gif));base64,([A-Za-z0-9+/=]+)$/i.exec(imageData || '');
  if (!match) {
    throw Object.assign(new Error('Định dạng ảnh không hợp lệ (chỉ hỗ trợ WebP, PNG, JPG, GIF).'), { statusCode: 400 });
  }
  const mime = match[1].toLowerCase();
  const extMap = {
    'image/webp': '.webp',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/gif': '.gif'
  };
  const ext = extMap[mime] || '.webp';
  const safeSlug = String(fileNameHint || 'feedback')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'feedback';

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  const fileName = `${timestamp}-${safeSlug}-${randomSuffix}${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  const buffer = Buffer.from(match[2], 'base64');
  fs.writeFileSync(filePath, buffer);
  return {
    fileName,
    imageUrl: `/uploads/feedbacks/${fileName}`,
    bytes: buffer.length
  };
}

function serveStaticFile(res, baseDir, relativePath, cacheControl = 'public, max-age=3600') {
  const safeRel = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.resolve(baseDir, safeRel);
  const resolvedBase = path.resolve(baseDir);

  if (!fullPath.startsWith(resolvedBase + path.sep) && fullPath !== resolvedBase) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': cacheControl
  });
  fs.createReadStream(fullPath).pipe(res);
}

function sortByDateDesc(items) {
  return [...items].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

async function handleApi(req, res, pathname) {
  if (pathname === '/api/health' && req.method === 'GET') {
    return sendJson(res, 200, { ok: true, time: new Date().toISOString() });
  }

  if (pathname === '/api/data' && req.method === 'GET') {
    const data = readData();
    return sendJson(res, 200, {
      profile: data.profile,
      feedbacks: sortByDateDesc(data.feedbacks),
      articles: sortByDateDesc(data.articles),
      storageStats: getStorageStats()
    });
  }

  if (pathname === '/api/login' && req.method === 'POST') {
    const body = await readJsonBody(req, 1024 * 64);
    if (!checkPassword(body.password)) {
      return sendJson(res, 401, { error: 'Mật khẩu quản trị không đúng.' });
    }
    return sendJson(res, 200, { token: createToken() });
  }

  if (pathname === '/api/verify-auth' && req.method === 'GET') {
    const valid = verifyToken(getBearerToken(req));
    return sendJson(res, valid ? 200 : 401, { authenticated: valid });
  }

  if (pathname === '/api/profile' && req.method === 'PUT') {
    if (!requireAdmin(req, res)) return;
    const body = await readJsonBody(req);
    const data = readData();
    data.profile = {
      ...data.profile,
      name: String(body.name || data.profile.name || 'Bùi Công Đam').trim(),
      sealText: String(body.sealText || data.profile.sealText || 'CÔNG ĐAM').trim().slice(0, 16),
      tagline: String(body.tagline || data.profile.tagline || '').trim(),
      bio: String(body.bio || '').trim(),
      philosophy: String(body.philosophy || '').trim(),
      contact: {
        facebook: String(body.contact?.facebook || '').trim(),
        zalo: String(body.contact?.zalo || '').trim(),
        email: String(body.contact?.email || '').trim(),
        note: String(body.contact?.note || '').trim()
      }
    };
    writeData(data);
    return sendJson(res, 200, { profile: data.profile });
  }

  if (pathname === '/api/feedbacks' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const body = await readJsonBody(req, 15 * 1024 * 1024);
    if (!body.imageData) {
      return sendJson(res, 400, { error: 'Vui lòng chọn hoặc dán (Ctrl+V) ảnh feedback.' });
    }
    const saved = saveBase64Image(body.imageData, body.topic || body.category || 'feedback');
    const data = readData();
    const newItem = {
      id: `fb-${crypto.randomUUID().slice(0, 8)}`,
      category: normalizeCategory(body.category),
      topic: String(body.topic || 'Nghiệm lý').trim(),
      title: String(body.title || 'Phản hồi luận giải thực tế').trim(),
      note: String(body.note || '').trim(),
      imageUrl: saved.imageUrl,
      date: /^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : new Date().toISOString().slice(0, 10),
      source: String(body.source || 'Hội nhóm').trim(),
      featured: Boolean(body.featured)
    };
    data.feedbacks.unshift(newItem);
    writeData(data);
    return sendJson(res, 201, { feedback: newItem, savedBytes: saved.bytes, storageStats: getStorageStats() });
  }

  const fbMatch = /^\/api\/feedbacks\/([a-zA-Z0-9_-]+)$/.exec(pathname);
  if (fbMatch) {
    if (!requireAdmin(req, res)) return;
    const id = fbMatch[1];
    const data = readData();
    const idx = data.feedbacks.findIndex((item) => item.id === id);
    if (idx === -1) {
      return sendJson(res, 404, { error: 'Không tìm thấy feedback.' });
    }

    if (req.method === 'PUT') {
      const body = await readJsonBody(req);
      const current = data.feedbacks[idx];
      data.feedbacks[idx] = {
        ...current,
        category: body.category ? normalizeCategory(body.category) : current.category,
        topic: body.topic !== undefined ? String(body.topic).trim() : current.topic,
        title: body.title !== undefined ? String(body.title).trim() : current.title,
        note: body.note !== undefined ? String(body.note).trim() : current.note,
        source: body.source !== undefined ? String(body.source).trim() : current.source,
        date: /^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : current.date,
        featured: body.featured !== undefined ? Boolean(body.featured) : current.featured
      };
      writeData(data);
      return sendJson(res, 200, { feedback: data.feedbacks[idx] });
    }

    if (req.method === 'DELETE') {
      const [removed] = data.feedbacks.splice(idx, 1);
      writeData(data);
      if (removed.imageUrl && removed.imageUrl.startsWith('/uploads/feedbacks/')) {
        const fileName = path.basename(removed.imageUrl);
        const target = path.join(UPLOAD_DIR, fileName);
        if (fs.existsSync(target)) {
          fs.unlinkSync(target);
        }
      }
      return sendJson(res, 200, { deletedId: id, storageStats: getStorageStats() });
    }
  }

  if (pathname === '/api/articles' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const body = await readJsonBody(req);
    if (!String(body.title || '').trim() || !String(body.content || '').trim()) {
      return sendJson(res, 400, { error: 'Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.' });
    }
    const data = readData();
    const article = {
      id: `art-${crypto.randomUUID().slice(0, 8)}`,
      category: normalizeCategory(body.category),
      title: String(body.title).trim(),
      summary: String(body.summary || '').trim(),
      content: String(body.content).trim(),
      date: /^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : new Date().toISOString().slice(0, 10),
      readTime: String(body.readTime || '4 phút đọc').trim()
    };
    data.articles.unshift(article);
    writeData(data);
    return sendJson(res, 201, { article });
  }

  const artMatch = /^\/api\/articles\/([a-zA-Z0-9_-]+)$/.exec(pathname);
  if (artMatch) {
    if (!requireAdmin(req, res)) return;
    const id = artMatch[1];
    const data = readData();
    const idx = data.articles.findIndex((item) => item.id === id);
    if (idx === -1) {
      return sendJson(res, 404, { error: 'Không tìm thấy bài viết.' });
    }

    if (req.method === 'PUT') {
      const body = await readJsonBody(req);
      const current = data.articles[idx];
      data.articles[idx] = {
        ...current,
        category: body.category ? normalizeCategory(body.category) : current.category,
        title: body.title !== undefined ? String(body.title).trim() : current.title,
        summary: body.summary !== undefined ? String(body.summary).trim() : current.summary,
        content: body.content !== undefined ? String(body.content).trim() : current.content,
        date: /^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : current.date,
        readTime: body.readTime !== undefined ? String(body.readTime).trim() : current.readTime
      };
      writeData(data);
      return sendJson(res, 200, { article: data.articles[idx] });
    }

    if (req.method === 'DELETE') {
      data.articles.splice(idx, 1);
      writeData(data);
      return sendJson(res, 200, { deletedId: id });
    }
  }

  if (pathname === '/api/sync-folder' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const result = syncFeedbackFolder();
    const data = readData();
    return sendJson(res, 200, {
      ...result,
      feedbacks: sortByDateDesc(data.feedbacks),
      storageStats: getStorageStats()
    });
  }

  if (pathname === '/api/backup' && req.method === 'GET') {
    if (!requireAdmin(req, res)) return;
    const data = readData();
    const files = {};
    const entries = fs.readdirSync(UPLOAD_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) continue;
      files[entry.name] = fs.readFileSync(path.join(UPLOAD_DIR, entry.name)).toString('base64');
    }
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
      files
    };
    const fileName = `bui-cong-dam-backup-${new Date().toISOString().slice(0, 10)}.json`;
    return sendJson(res, 200, backup, {
      'Content-Disposition': `attachment; filename="${fileName}"`
    });
  }

  if (pathname === '/api/restore' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const body = await readJsonBody(req, 60 * 1024 * 1024);
    if (!body || !body.data || typeof body.data !== 'object') {
      return sendJson(res, 400, { error: 'File sao lưu không đúng định dạng.' });
    }
    ensureDataSetup();

    const files = body.files && typeof body.files === 'object' ? body.files : {};
    let restoredFiles = 0;
    for (const [rawName, base64Content] of Object.entries(files)) {
      const safeName = path.basename(rawName);
      const ext = path.extname(safeName).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext) || typeof base64Content !== 'string') continue;
      fs.writeFileSync(path.join(UPLOAD_DIR, safeName), Buffer.from(base64Content, 'base64'));
      restoredFiles += 1;
    }

    const restoredData = {
      profile: body.data.profile || {},
      feedbacks: Array.isArray(body.data.feedbacks) ? body.data.feedbacks : [],
      articles: Array.isArray(body.data.articles) ? body.data.articles : []
    };
    writeData(restoredData);

    return sendJson(res, 200, {
      restoredFiles,
      feedbackCount: restoredData.feedbacks.length,
      articleCount: restoredData.articles.length,
      storageStats: getStorageStats()
    });
  }

  return sendJson(res, 404, { error: 'API endpoint không tồn tại.' });
}

ensureDataSetup();
syncFeedbackFolder();

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(reqUrl.pathname);

    if (pathname.startsWith('/api/')) {
      await handleApi(req, res, pathname);
      return;
    }

    if (pathname === '/' || pathname === '/index.html') {
      return serveStaticFile(res, PUBLIC_DIR, 'index.html', 'no-cache');
    }

    if (pathname === '/admin' || pathname === '/admin/') {
      return serveStaticFile(res, PUBLIC_DIR, 'admin.html', 'no-cache');
    }

    if (pathname.startsWith('/uploads/feedbacks/')) {
      const rel = pathname.slice('/uploads/feedbacks/'.length);
      return serveStaticFile(res, UPLOAD_DIR, rel, 'public, max-age=86400');
    }

    return serveStaticFile(res, PUBLIC_DIR, pathname.replace(/^\/+/, ''));
  } catch (err) {
    const status = err.statusCode || 500;
    console.error('[Server Error]', err);
    if (!res.headersSent) {
      sendJson(res, status, { error: err.message || 'Lỗi máy chủ nội bộ.' });
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Blog Bùi Công Đam đang chạy tại http://0.0.0.0:${PORT}`);
  console.log(`Trang quản trị: /admin`);
});
