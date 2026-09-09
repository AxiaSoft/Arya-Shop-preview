// ═══════════════════════════════════════════════════════════════
// AryaServer — کلاینت رسمی API بک‌اند (Db.php)
// - وضعیت سرور، توکن CSRF، retry خودکار، و helperهای CRUD/احراز هویت
// - اگر سرور پیکربندی نباشد همه‌ی فراخوان‌ها null برمی‌گردانند و
//   اپ به حالت محلی (دموی IndexedDB) ادامه می‌دهد.
// ═══════════════════════════════════════════════════════════════
window.AryaServer = (function () {
  const BASE = 'Db.php';
  let status = null;          // پاسخ action=status
  let csrf = null;
  const listeners = [];

  function url(action, params) {
    const qs = new URLSearchParams();
    qs.set('action', action);
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    return BASE + '?' + qs.toString();
  }

  async function rawCall(action, opts = {}) {
    const { params, body, method } = opts;
    const m = method || (body ? 'POST' : 'GET');
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (m !== 'GET' && m !== 'HEAD') {
      if (csrf) headers['X-CSRF-Token'] = csrf;
    }
    const res = await fetch(url(action, params), {
      method: m, headers, credentials: 'same-origin',
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch (e) { data = { ok: false, msg: 'پاسخ نامعتبر سرور' }; }
    return { http: res.status, ...data };
  }

  // فراخوان با retry یک‌باره روی خطای CSRF
  async function call(action, opts = {}) {
    let r = await rawCall(action, opts);
    if (r.ok && r.data && r.data.csrf) csrf = r.data.csrf; // همگام‌سازی خودکار توکن
    if (!r.ok && r.http === 403 && /CSRF/i.test(String(r.msg || ''))) {
      await refreshCsrf();
      r = await rawCall(action, opts);
    }
    if (!r.ok && r.http === 401 && /expired|انقض|نامعتبر نشسته/i.test(String(r.msg || ''))) {
      notify({ type: 'session_expired' });
    }
    return r;
  }

  async function refreshCsrf() {
    try {
      const r = await rawCall('csrf');
      if (r.ok && r.data && r.data.csrf) csrf = r.data.csrf;
    } catch (e) { /* offline */ }
    return csrf;
  }

  function notify(ev) { listeners.forEach(fn => { try { fn(ev); } catch (e) {} }); }
  function on(fn) { listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; }

  async function boot() {
    try {
      const r = await rawCall('status');
      status = (r && r.ok && r.data) ? r.data : null;
    } catch (e) { status = null; }
    if (status && status.configured) await refreshCsrf();
    return status;
  }

  const ready = boot(); // پرامیس — مصرف‌کننده‌ها: await AryaServer.ready / AryaServer.ready.then(...)

  function isConfigured() { return !!(status && status.configured); }
  function demoMode() { return !!(status && status.demo_mode); }
  function getStatus() { return status; }

  // ── CRUD با پلن ذخیره در سرور ──
  const crud = {
    getAll: (table, params) => call('getAll', { params: { table, ...(params || {}) } }),
    getById: (table, id, params) => call('getById', { params: { table, id, ...(params || {}) } }),
    upsert: (table, record) => call('upsert', { params: { table }, body: { record } }),
    remove: (table, id) => call('delete', { params: { table }, body: { id } }),
    import: (table, records) => call('import', { params: { table }, body: { records } }),
    stats: () => call('stats'),
  };

  // ── اکشن‌های احراز هویت/محتوا ──
  const api = {
    ready, isConfigured, demoMode, getStatus, refreshCsrf, on, recheck: boot,
    call, url: (a, p) => url(a, p),
    crud,
    // مدیر
    adminSession: () => call('admin_session'),
    adminLogin1: (identifier, password) => call('admin_login_step1', { body: { identifier, password } }),
    adminLogin2: (otp) => call('admin_login_step2', { body: { otp } }),
    adminLogin3: (pw) => call('admin_login_step3', { body: { two_factor_password: pw } }),
    adminLogout: () => call('admin_logout'),
    // کاربر
    me: () => call('user_session'),
    register: (rec) => call('user_register', { body: rec }),
    login1: (identifier, password) => call('user_login_step1', { body: { identifier, password } }),
    login2: (otp) => call('user_login_step2', { body: { otp } }),
    logout: () => call('user_logout'),
    reset1: (identifier) => call('user_reset_step1', { body: { identifier } }),
    reset2: (otp, password) => call('user_reset_step2', { body: { otp, password } }),
    update: (rec) => call('user_update', { body: rec }),
    changePassword: (oldPw, newPw) => call('user_change_password', { body: { old_password: oldPw, new_password: newPw } }),
    removeAccount: () => call('user_delete', { body: {} }),
    // محتوا
    createReview: (rec) => call('review_create', { body: rec }),
    voteReview: (id, kind) => call('review_vote', { body: { id, kind } }),
    createTicket: (rec) => call('ticket_create', { body: rec }),
    replyTicket: (rec) => call('ticket_reply', { body: rec }),
  };
  return api;
})();
