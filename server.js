const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// ========== قاعدة البيانات (sql.js) ==========
let db;
const initSqlJs = require('sql.js');
const fs = require('fs');
const dbPath = path.join(__dirname, 'database', 'syria.db');
let saveTimeout;

function all(sql, params = []) {
    const stmt = db.prepare(sql); stmt.bind(params);
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free(); return results;
}
function get(sql, params = []) {
    const stmt = db.prepare(sql); stmt.bind(params);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free(); return row;
}
function run(sql, params = []) {
    db.run(sql, params);
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => fs.writeFileSync(dbPath, Buffer.from(db.export())), 300);
}
function saveNow() { fs.writeFileSync(dbPath, Buffer.from(db.export())); }

// تحميل قاعدة البيانات عند بدء السيرفر
(async function initDB() {
    const SQL = await initSqlJs();
    const filebuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(filebuffer);
    db.run('PRAGMA foreign_keys = ON');
    console.log('✅ Database loaded');
})();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res) => { res.set('Cache-Control', 'no-store'); }
}));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// ========== رفع الصور ==========
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });
app.post('/api/upload-icon', upload.single('icon'), (req, res) => {
    if (!req.file) return res.json({ success: false });
    res.json({ success: true, image_url: '/uploads/' + req.file.filename });
});

// ========== API ==========
app.get('/api', (req, res) => {
    res.json({ name: 'سوريا الإلكترونية', version: '7.0', status: 'running' });
});

app.get('/api/regions', (req, res) => {
    const { admin_level_id, parent_id } = req.query;
    let query = 'SELECT * FROM regions WHERE is_active = 1'; const params = [];
    if (admin_level_id) { query += ' AND admin_level_id = ?'; params.push(admin_level_id); }
    else if (!parent_id) { query += ' AND admin_level_id = 1'; }
    if (parent_id) { query += ' AND parent_id = ?'; params.push(parent_id); }
    query += ' ORDER BY sort_order, name_ar';
    res.json({ success: true, data: all(query, params) });
});

app.get('/api/regions/:id', (req, res) => {
    const r = get('SELECT * FROM regions WHERE id = ?', [req.params.id]);
    if (!r) return res.status(404).json({ success: false });
    res.json({ success: true, data: r });
});

app.put('/api/regions/:id', (req, res) => {
    const { name_ar, population, image_url } = req.body;
    run('UPDATE regions SET name_ar=?, population=?, image_url=? WHERE id=?', [name_ar, population, image_url, req.params.id]);
    saveNow(); res.json({ success: true });
});

app.get('/api/businesses', (req, res) => {
    const { region_id, sub_category_id, search, limit = 50 } = req.query;
    let query = `SELECT b.*, r.name_ar as region_name FROM businesses b LEFT JOIN regions r ON b.region_id = r.id WHERE b.is_active = 1`; const params = [];
    if (region_id) { query += ' AND b.region_id = ?'; params.push(region_id); }
    if (sub_category_id) { query += ' AND b.sub_category_id = ?'; params.push(sub_category_id); }
    if (search) { query += ' AND b.name_ar LIKE ?'; params.push(`%${search}%`); }
    query += ' ORDER BY b.is_featured DESC, b.average_rating DESC LIMIT ?'; params.push(parseInt(limit));
    res.json({ success: true, data: all(query, params) });
});

app.get('/api/businesses/:id', (req, res) => {
    const b = get(`SELECT b.*, r.name_ar as region_name FROM businesses b LEFT JOIN regions r ON b.region_id = r.id WHERE b.id = ?`, [req.params.id]);
    if (!b) return res.status(404).json({ success: false });
    const menu = all('SELECT * FROM menu_items WHERE business_id = ? AND is_available = 1', [req.params.id]);
    res.json({ success: true, data: { ...b, menu } });
});

app.post('/api/businesses/register', (req, res) => {
    const { name_ar, phone, password, sub_category_id, region_id, logo } = req.body;
    if (!name_ar || !phone || !password || !sub_category_id || !region_id) return res.json({ success: false, message: 'حقول ناقصة' });
    const password_hash = crypto.createHash('sha256').update(password).digest('hex');
    run(`INSERT INTO businesses (region_id, sub_category_id, name_ar, phone, owner_phone, password_hash, logo, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [region_id, sub_category_id, name_ar, phone, phone, password_hash, logo || '']);
    saveNow(); res.json({ success: true, message: 'تمت الإضافة' });
});

app.put('/api/businesses/:id', (req, res) => {
    const { name_ar, phone, sub_category_id, region_id, logo } = req.body;
    if (logo) { run('UPDATE businesses SET name_ar=?, phone=?, sub_category_id=?, region_id=?, logo=? WHERE id=?', [name_ar, phone, sub_category_id, region_id, logo, req.params.id]); }
    else { run('UPDATE businesses SET name_ar=?, phone=?, sub_category_id=?, region_id=? WHERE id=?', [name_ar, phone, sub_category_id, region_id, req.params.id]); }
    saveNow(); res.json({ success: true, message: 'تم التحديث' });
});

app.delete('/api/businesses/:id', (req, res) => {
    run('UPDATE businesses SET is_active = 0 WHERE id = ?', [req.params.id]);
    saveNow(); res.json({ success: true, message: 'تم الحذف' });
});

app.get('/api/home-icons', (req, res) => {
    res.json({ success: true, data: all('SELECT * FROM home_icons WHERE is_active = 1 ORDER BY sort_order') });
});

app.post('/api/home-icons', (req, res) => {
    const { name_ar, icon_emoji, icon_color, link_url, image_url } = req.body;
    run('INSERT INTO home_icons (name_ar, icon_emoji, icon_color, link_url, image_url) VALUES (?, ?, ?, ?, ?)',
        [name_ar, icon_emoji || '', icon_color || '#007A3D', link_url || '/', image_url || '']);
    saveNow(); res.json({ success: true });
});

app.delete('/api/home-icons/:id', (req, res) => {
    run('UPDATE home_icons SET is_active = 0 WHERE id = ?', [req.params.id]);
    saveNow(); res.json({ success: true });
});

app.get('/api/drivers/nearby', (req, res) => {
    res.json({ success: true, data: all('SELECT * FROM drivers WHERE is_active = 1') });
});

app.post('/api/drivers/register', (req, res) => {
    const { name, phone, vehicle_type, vehicle_plate, vehicle_color } = req.body;
    if (!name || !phone) return res.json({ success: false, message: 'حقول ناقصة' });
    run('INSERT INTO drivers (name, phone, vehicle_type, vehicle_plate, vehicle_color, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        [name, phone, vehicle_type || 'motorcycle', vehicle_plate || '', vehicle_color || '']);
    saveNow(); res.json({ success: true, message: 'تمت الإضافة' });
});

app.get('/api/drivers/:id', (req, res) => {
    const d = get('SELECT * FROM drivers WHERE id = ?', [req.params.id]);
    if (!d) return res.json({ success: false });
    res.json({ success: true, data: d });
});

app.delete('/api/drivers/:id', (req, res) => {
    run('UPDATE drivers SET is_active = 0 WHERE id = ?', [req.params.id]);
    saveNow(); res.json({ success: true });
});

app.get('/api/craftsmen', (req, res) => {
    const { trade, region } = req.query;
    let query = 'SELECT * FROM craftsmen WHERE is_active = 1'; const params = [];
    if (trade) { query += ' AND trade = ?'; params.push(trade); }
    if (region) { query += ' AND regions LIKE ?'; params.push(`%${region}%`); }
    res.json({ success: true, data: all(query, params) });
});

app.post('/api/craftsmen/register', (req, res) => {
    const { name_ar, phone, phone2, trade, description_ar, regions } = req.body;
    if (!name_ar || !phone || !trade) return res.json({ success: false, message: 'حقول ناقصة' });
    run('INSERT INTO craftsmen (name_ar, phone, phone2, trade, description_ar, regions) VALUES (?, ?, ?, ?, ?, ?)',
        [name_ar, phone, phone2 || '', trade, description_ar || '', regions || '']);
    saveNow(); res.json({ success: true });
});

app.put('/api/craftsmen/:id', (req, res) => {
    const { name_ar, phone, trade } = req.body;
    run('UPDATE craftsmen SET name_ar=?, phone=?, trade=? WHERE id=?', [name_ar, phone, trade, req.params.id]);
    saveNow(); res.json({ success: true });
});

app.delete('/api/craftsmen/:id', (req, res) => {
    run('UPDATE craftsmen SET is_active = 0 WHERE id = ?', [req.params.id]);
    saveNow(); res.json({ success: true });
});

app.post('/api/login', (req, res) => {
    const { code, password } = req.body;
    if (!code || !password) return res.json({ success: false, message: 'الكود وكلمة المرور مطلوبان' });
    const password_hash = crypto.createHash('sha256').update(password).digest('hex');
    const user = get('SELECT * FROM users WHERE username = ? AND password_hash = ?', [code, password_hash]);
    if (user) return res.json({ success: true, user: { ...user, role: 'super' }, redirect: '/admin.html' });
    const business = get('SELECT * FROM businesses WHERE owner_phone = ? AND password_hash = ?', [code, password_hash]);
    if (business) return res.json({ success: true, user: { ...business, role: 'business_owner' }, redirect: '/business-dash.html?id=' + business.id });
    res.json({ success: false, message: 'بيانات غير صحيحة' });
});

app.get('/api/stats', (req, res) => {
    const tb = get('SELECT COUNT(*) as count FROM businesses WHERE is_active = 1');
    const tp = get('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
    res.json({ success: true, data: { totalBusinesses: tb?.count || 0, totalProducts: tp?.count || 0 } });
});

// ========== بدء السيرفر ==========
(async function() {
    const SQL = await initSqlJs();
    const filebuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(filebuffer);
    db.run('PRAGMA foreign_keys = ON');
    console.log('✅ Database loaded');

console.log('Database path:', dbPath);
console.log('Database exists:', fs.existsSync(dbPath));
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server: http://0.0.0.0:${PORT}`);
        console.log(`🇸🇾 Syria Platform v7.0 LIVE!`);
    });
})();
