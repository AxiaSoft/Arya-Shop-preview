// ═══════════════════════════════════════════════════════════════
// AryaDB — IndexedDB Database Layer
// قابلیت: ذخیره محلی واقعی + sync با PHP/MySQL backend
// File: assets/js/arya_db.js
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const DB_NAME    = 'AryaStoreDB';
  const DB_VERSION = 1;

  // جداول دیتابیس
  const STORES = {
    products: { keyPath: 'id', indexes: ['category', 'created_at'] },
    orders:   { keyPath: 'id', indexes: ['user_phone', 'status', 'created_at'] },
    users:    { keyPath: 'id', indexes: ['email', 'phone'] },
    tickets:  { keyPath: 'id', indexes: ['user_phone', 'status'] },
    categories: { keyPath: 'id', indexes: [] },
    reviews:  { keyPath: 'id', indexes: ['product_id', 'status'] },
    admins:   { keyPath: 'id', indexes: ['email', 'phone'] },
    settings: { keyPath: 'key', indexes: [] },
  };

  // ── همگام‌سازی با سرور (Arya_api.js) — در صورت نبود config، فقط محلی ──
  const SERVER_SYNC_TABLES = ['products', 'categories', 'orders', 'reviews'];
  function serverOn() { return !!(window.AryaServer && AryaServer.isConfigured()); }

  let db = null;
  let _ready = false;
  const _queue = [];

  // ──────────────────────────────────────────
  // INIT
  // ──────────────────────────────────────────
  function init() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('[AryaDB] IndexedDB not supported, using localStorage fallback');
        _ready = true;
        resolve();
        return;
      }

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const idb = e.target.result;
        Object.entries(STORES).forEach(([name, cfg]) => {
          if (!idb.objectStoreNames.contains(name)) {
            const store = idb.createObjectStore(name, { keyPath: cfg.keyPath });
            cfg.indexes.forEach(idx => store.createIndex(idx, idx, { unique: false }));
          }
        });
      };

      req.onsuccess = (e) => {
        db = e.target.result;
        _ready = true;
        console.log('[AryaDB] IndexedDB ready ✅');
        _queue.forEach(fn => fn());
        _queue.length = 0;
        resolve();
        // Sync state to DB on startup
        _syncStateToDb();
      };

      req.onerror = (e) => {
        console.error('[AryaDB] Error:', e.target.error);
        _ready = true;
        resolve(); // fallback gracefully
      };
    });
  }

  // ──────────────────────────────────────────
  // CRUD OPERATIONS
  // ──────────────────────────────────────────
  function upsert(storeName, record) {
    if (!db) return Promise.resolve(null);
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(record);
        req.onsuccess = () => resolve(record);
        req.onerror = () => resolve(null);
      } catch(e) { resolve(null); }
    });
  }

  function getAll(storeName) {
    if (!db) return Promise.resolve([]);
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch(e) { resolve([]); }
    });
  }

  function getById(storeName, id) {
    if (!db) return Promise.resolve(null);
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch(e) { resolve(null); }
    });
  }

  function remove(storeName, id) {
    if (!db) return Promise.resolve(false);
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch(e) { resolve(false); }
    });
  }

  function clearStore(storeName) {
    if (!db) return Promise.resolve();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).clear();
        tx.oncomplete = resolve;
      } catch(e) { resolve(); }
    });
  }

  // ──────────────────────────────────────────
  // SYNC: state → IndexedDB
  // ──────────────────────────────────────────
  async function _syncStateToDb() {
    if (!db || typeof state === 'undefined') return;

    // Products
    if (Array.isArray(state.products)) {
      for (const p of state.products) await upsert('products', _cleanRecord(p));
    }
    // Orders
    if (Array.isArray(state.orders)) {
      for (const o of state.orders) {
        const rec = { ...o, items: JSON.stringify(Array.isArray(o.items) ? o.items : []) };
        await upsert('orders', _cleanRecord(rec));
      }
    }
    // Categories
    if (Array.isArray(state.categories)) {
      for (const c of state.categories) await upsert('categories', _cleanRecord(c));
    }
    // Users
    if (state.user) {
      const u = { ...state.user };
      delete u.passwordHash;
      u.addresses = JSON.stringify(u.addresses || []);
      await upsert('users', _cleanRecord(u));
    }
    // Tickets
    if (Array.isArray(state.tickets)) {
      for (const t of state.tickets) {
        const rec = { ...t, messages: JSON.stringify(Array.isArray(t.messages) ? t.messages : []) };
        await upsert('tickets', _cleanRecord(rec));
      }
    }
    // Reviews
    if (Array.isArray(state.reviews)) {
      for (const r of state.reviews) await upsert('reviews', _cleanRecord(r));
    }
  }

  function _cleanRecord(obj) {
    if (!obj) return obj;
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'undefined') clean[k] = null;
      else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        clean[k] = JSON.stringify(v);
      } else clean[k] = v;
    }
    return clean;
  }

  // ──────────────────────────────────────────
  // SYNC: IndexedDB → state (on load)
  // ──────────────────────────────────────────
  function _mapServerProduct(p) {
    if (typeof p.images === 'string') { try { p.images = JSON.parse(p.images); } catch { p.images = []; } }
    if (typeof p.videos === 'string') { try { p.videos = JSON.parse(p.videos); } catch { p.videos = []; } }
    return p;
  }

  // در حالت سرور: محصولات/دسته‌ها/نظرات از سرور (مرجع) و کش در IndexedDB
  async function loadFromServer() {
    const isAdminPage = /admin\.html/.test(location.pathname) || location.hash.includes('admin');
    const wanted = [['products'], ['categories'], ['reviews']];
    if (isAdminPage) wanted.push(['orders']);
    for (const [table] of wanted) {
      try {
        const r = await AryaServer.crud.getAll(table, isAdminPage && table === 'reviews' ? { include_all: 1 } : {});
        if (r && r.ok && Array.isArray(r.data)) {
          const rows = r.data.map(x => ({ ...x }));
          if (typeof getAll === 'function' && db) {
            await Promise.all(rows.map(row => upsert(table, row).catch(() => {})));
          }
          if (table === 'products') state.products = rows.map(_mapServerProduct).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          if (table === 'categories') state.categories = rows;
          if (table === 'reviews') state.reviews = rows;
          if (table === 'orders') state.orders = rows.map(o => {
            if (typeof o.items === 'string') { try { o.items = JSON.parse(o.items); } catch { o.items = []; } }
            return o;
          }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
      } catch (e) { console.warn('[AryaDB] server load failed for', table, e); }
    }
  }

  async function loadToState() {
    if (typeof state === 'undefined') return;
    try { await AryaServer.ready; } catch (e) {}
    if (typeof AryaServer !== 'undefined' && AryaServer.isConfigured()) {
      await loadFromServer();
      if (typeof render === 'function') render();
      return;
    }
    if (!db) return;

    const [products, orders, categories, tickets, reviews] = await Promise.all([
      getAll('products'),
      getAll('orders'),
      getAll('categories'),
      getAll('tickets'),
      getAll('reviews'),
    ]);

    if (products.length > 0) {
      state.products = products.map(p => {
        if (typeof p.images === 'string') { try { p.images = JSON.parse(p.images); } catch { p.images = []; } }
        if (typeof p.videos === 'string') { try { p.videos = JSON.parse(p.videos); } catch { p.videos = []; } }
        return p;
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    if (orders.length > 0) {
      state.orders = orders.map(o => {
        if (typeof o.items === 'string') { try { o.items = JSON.parse(o.items); } catch { o.items = []; } }
        return o;
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    if (categories.length > 0) state.categories = categories;

    if (tickets.length > 0) {
      state.tickets = tickets.map(t => {
        if (typeof t.messages === 'string') { try { t.messages = JSON.parse(t.messages); } catch { t.messages = []; } }
        return t;
      });
    }

    if (reviews.length > 0) state.reviews = reviews;

    console.log('[AryaDB] State loaded from IndexedDB');
    if (typeof render === 'function') render();
  }

  // ──────────────────────────────────────────
  // AUTO-HOOK: intercept state mutations
  // ──────────────────────────────────────────
  function hookStateChanges() {
    if (typeof state === 'undefined') return;

    // Override createProduct
    const origCreate = window.createProduct;
    if (origCreate) {
      window.createProduct = function(product) {
        const result = origCreate(product);
        if (result && db) upsert('products', _cleanRecord(result));
        return result;
      };
    }

    // Override updateProduct
    const origUpdate = window.updateProduct;
    if (origUpdate) {
      window.updateProduct = function(id, updates) {
        const result = origUpdate(id, updates);
        if (result && db) upsert('products', _cleanRecord(result));
        return result;
      };
    }

    // Override deleteProduct
    const origDelete = window.deleteProduct;
    if (origDelete) {
      window.deleteProduct = function(id) {
        const result = origDelete(id);
        if (result && db) remove('products', id);
        return result;
      };
    }

    // Override createOrder
    const origOrder = window.createOrder;
    if (origOrder) {
      window.createOrder = function(order) {
        const result = origOrder(order);
        if (result && db) {
          const rec = { ...result, items: JSON.stringify(Array.isArray(result.items) ? result.items : []) };
          upsert('orders', _cleanRecord(rec));
        }
        return result;
      };
    }

    // Override updateOrder
    const origUpdateOrder = window.updateOrder;
    if (origUpdateOrder) {
      window.updateOrder = function(id, updates) {
        const result = origUpdateOrder(id, updates);
        if (result && db) {
          const rec = { ...result, items: JSON.stringify(Array.isArray(result.items) ? result.items : []) };
          upsert('orders', _cleanRecord(rec));
        }
        return result;
      };
    }

    // Override deleteOrder
    const origDelOrder = window.deleteOrder;
    if (origDelOrder) {
      window.deleteOrder = function(id) {
        const result = origDelOrder(id);
        if (result && db) remove('orders', id);
        return result;
      };
    }

    console.log('[AryaDB] State hooks installed ✅');
  }

  // ──────────────────────────────────────────
  // EXPORT TO SQL (برای phpMyAdmin)
  // ──────────────────────────────────────────
  async function exportToSQL() {
    const now = new Date().toISOString().replace('T',' ').slice(0,19);
    let sql = `-- AryaStore Database Export\n-- Generated: ${now}\n-- Import this file in phpMyAdmin\n\n`;
    sql += `SET NAMES utf8mb4;\nSET time_zone = '+00:00';\n\n`;

    // Products
    sql += _tableSQL('products', [
      'id VARCHAR(64) PRIMARY KEY',
      'title VARCHAR(500)',
      'category VARCHAR(64)',
      'price DECIMAL(18,0)',
      'original_price DECIMAL(18,0)',
      'stock INT DEFAULT 0',
      'description TEXT',
      'image TEXT',
      'images LONGTEXT',
      'article LONGTEXT',
      'videos LONGTEXT',
      'slug VARCHAR(255)',
      'seo_title VARCHAR(500)',
      'seo_description TEXT',
      'rating DECIMAL(3,1) DEFAULT 0',
      'sales INT DEFAULT 0',
      'created_at DATETIME',
    ]);
    const products = await getAll('products');
    sql += _insertSQL('products', products, ['id','title','category','price','original_price','stock','description','image','images','article','videos','slug','seo_title','seo_description','rating','sales','created_at']);

    // Orders
    sql += _tableSQL('orders', [
      'id VARCHAR(64) PRIMARY KEY',
      'user_name VARCHAR(255)',
      'user_phone VARCHAR(20)',
      'address TEXT',
      'delivery_slot VARCHAR(100)',
      'items LONGTEXT',
      'total DECIMAL(18,0)',
      'status VARCHAR(50) DEFAULT "pending"',
      'created_at DATETIME',
    ]);
    const orders = await getAll('orders');
    sql += _insertSQL('orders', orders, ['id','user_name','user_phone','address','delivery_slot','items','total','status','created_at']);

    // Users
    sql += _tableSQL('users', [
      'id VARCHAR(64) PRIMARY KEY',
      'name VARCHAR(255)',
      'email VARCHAR(255) UNIQUE',
      'phone VARCHAR(20) UNIQUE',
      'national_id VARCHAR(20)',
      'addresses LONGTEXT',
      'avatar LONGTEXT',
      'created_at DATETIME',
    ]);
    const users = await getAll('users');
    sql += _insertSQL('users', users, ['id','name','email','phone','nationalId','addresses','avatar','createdAt']);

    // Categories
    sql += _tableSQL('categories', [
      'id VARCHAR(64) PRIMARY KEY',
      'title VARCHAR(255)',
      'icon VARCHAR(50)',
    ]);
    const cats = await getAll('categories');
    sql += _insertSQL('categories', cats, ['id','title','icon']);

    // Tickets
    sql += _tableSQL('tickets', [
      'id VARCHAR(64) PRIMARY KEY',
      'user_phone VARCHAR(20)',
      'user_name VARCHAR(255)',
      'subject VARCHAR(500)',
      'status VARCHAR(50) DEFAULT "open"',
      'priority VARCHAR(20) DEFAULT "normal"',
      'messages LONGTEXT',
      'created_at DATETIME',
    ]);
    const tickets = await getAll('tickets');
    sql += _insertSQL('tickets', tickets, ['id','user_phone','user_name','subject','status','priority','messages','created_at']);

    // Admins
    sql += _tableSQL('admins', [
      'id VARCHAR(64) PRIMARY KEY',
      'name VARCHAR(255)',
      'email VARCHAR(255) UNIQUE',
      'phone VARCHAR(20)',
      'role VARCHAR(50) DEFAULT "admin"',
      'created_at DATETIME',
    ]);
    // Get admins from admin auth storage
    try {
      const adminUsers = JSON.parse(localStorage.getItem('arya_admin_users_v1') || '[]');
      const cleanAdmins = adminUsers.map(a => {
        const c = {...a}; delete c.passwordHash; return c;
      });
      sql += _insertSQL('admins', cleanAdmins, ['id','name','email','phone','role']);
    } catch(e) {}

    return sql;
  }

  function _tableSQL(name, cols) {
    return `-- Table: ${name}\nCREATE TABLE IF NOT EXISTS \`${name}\` (\n  ${cols.join(',\n  ')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
  }

  function _insertSQL(table, rows, fields) {
    if (!rows || rows.length === 0) return `-- No data for ${table}\n\n`;
    let sql = `INSERT INTO \`${table}\` (\`${fields.join('`,`')}\`) VALUES\n`;
    const vals = rows.map(row => {
      const parts = fields.map(f => {
        const v = row[f];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'number') return v;
        if (typeof v === 'boolean') return v ? 1 : 0;
        return `'${String(v).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n').replace(/\r/g,'')}'`;
      });
      return `(${parts.join(',')})`;
    });
    sql += vals.join(',\n') + ';\n\n';
    return sql;
  }

  // ──────────────────────────────────────────
  // EXPORT TO JSON
  // ──────────────────────────────────────────
  async function exportToJSON() {
    const data = {};
    for (const name of Object.keys(STORES)) {
      data[name] = await getAll(name);
    }
    return JSON.stringify(data, null, 2);
  }

  // ──────────────────────────────────────────
  // DOWNLOAD HELPERS
  // ──────────────────────────────────────────
  async function downloadSQL() {
    const sql = await exportToSQL();
    _download(sql, `arya_db_${_dateStr()}.sql`, 'application/sql');
  }

  async function downloadJSON() {
    const json = await exportToJSON();
    _download(json, `arya_db_${_dateStr()}.json`, 'application/json');
  }

  function _download(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function _dateStr() {
    return new Date().toISOString().slice(0,10);
  }

  // ──────────────────────────────────────────
  // PHP BACKEND SYNC (اختیاری - با سرور PHP)
  // ──────────────────────────────────────────
  async function syncToBackend(table, action, record) {
    // اکشن‌های عمومی CRUD روی سرور (فقط در حالت پیکربندی‌شده)
    if (!serverOn()) return { skipped: true };
    try {
      if (action === 'upsert') return await AryaServer.crud.upsert(table, _cleanRecord({ ...record }));
      if (action === 'delete') return await AryaServer.crud.remove(table, record && record.id ? record.id : record);
    } catch (e) { console.warn('[AryaDB] sync failed:', e); return { ok: false, msg: String(e) }; }
    return { skipped: true };
  }

  // ──────────────────────────────────────────
  // DB STATS (for admin panel)
  // ──────────────────────────────────────────
  async function getStats() {
    if (serverOn()) {
      try {
        const r = await AryaServer.crud.stats();
        if (r && r.ok && r.data && r.data.counts) return { ...r.data.counts };
      } catch (e) {}
    }
    const stats = {};
    for (const name of Object.keys(STORES)) {
      const rows = await getAll(name);
      stats[name] = rows.length;
    }
    return stats;
  }

  // ──────────────────────────────────────────
  // PUBLIC API
  // ──────────────────────────────────────────
  async function upsertS(table, record) {
    const r = await upsert(table, record);
    if (serverOn() && SERVER_SYNC_TABLES.includes(table)) {
      try { await syncToBackend(table, 'upsert', record); } catch (e) {}
    }
    return r;
  }
  async function removeS(table, id) {
    const r = await remove(table, id);
    if (serverOn() && SERVER_SYNC_TABLES.includes(table)) {
      try { await syncToBackend(table, 'delete', { id }); } catch (e) {}
    }
    return r;
  }

  window.AryaDB = {
    init,
    upsert: upsertS,
    getAll,
    getById,
    remove: removeS,
    clearStore,
    loadToState,
    syncState: _syncStateToDb,
    downloadSQL,
    downloadJSON,
    exportToSQL,
    exportToJSON,
    getStats,
    hookStateChanges,
    isReady: () => _ready,
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init().then(hookStateChanges));
  } else {
    init().then(hookStateChanges);
  }

})();