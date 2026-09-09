// ═══════════════════════════════════════════════════════════════
// NAVIGATION + مسیریابی مرورگر (پشتیبانی از دکمه بازگشت/جلو)
// File: assets/js/navigation.js
//
// این فایل هم در index.html و هم در admin.html بارگذاری می‌شود.
// تشخیص اینکه در کدام صفحه هستیم از روی location.pathname انجام
// می‌شود (نه از روی وجود عناصر DOM)، چون این کد پیش از پردازش کامل
// <body> اجرا می‌شود.
// ═══════════════════════════════════════════════════════════════

function _isAdminHtmlPage() {
  try { return /admin\.html(?:$|[?#])/i.test(location.pathname); }
  catch (e) { return false; }
}

// آدرس (هش) درست را بر اساس وضعیت فعلی برنامه محاسبه می‌کند
function computeCanonicalHash() {
  try {
    if (typeof state === 'undefined') return null;

    if (_isAdminHtmlPage()) {
      // در پنل مدیریت، فقط وقتی که لاگین موفق شده مسیر را همگام کن
      // (تا پیش از ورود، هش صفحه دستکاری نشود)
      if (!state.isAdmin) return null;
      const tab = state.adminTab || 'dashboard';
      return '#/admin/' + tab;
    }

    return '#/' + (state.page || 'home');
  } catch (e) {
    return null;
  }
}

// بعد از هر رندر واقعی صدا زده می‌شود تا آدرس نوار مرورگر با وضعیت
// فعلی برنامه هماهنگ شود. از history.pushState استفاده می‌شود
// (نه location.hash) تا رویداد popstate/hashchange دوباره تریگر
// نشود و حلقه بی‌نهایت رخ ندهد.
function syncHistoryWithState() {
  const target = computeCanonicalHash();
  if (!target) return;
  try {
    if (location.hash !== target) {
      history.pushState({ __appNav: true, hash: target }, '', target);
    }
  } catch (e) {}
}

// وقتی کاربر دکمه بازگشت/جلو مرورگر را می‌زند (یا هش به هر شکلی
// تغییر می‌کند)، وضعیت برنامه را از روی آدرس فعلی بازسازی می‌کند
function applyHashToState() {
  try {
    if (typeof state === 'undefined') return;
    const raw = location.hash.replace(/^#\/?/, '');
    if (!raw) return;

    const parts = raw.split('/').filter(Boolean);

    if (parts[0] === 'admin') {
      if (!_isAdminHtmlPage()) return; // فقط در admin.html معنا دارد
      const tab = parts[1] || 'dashboard';
      if (state.adminTab !== tab) {
        state.adminTab = tab;
        if (typeof render === 'function') render();
      }
      return;
    }

    const page = parts[0];
    if (page && page !== state.page) {
      state.prevPage = state.page;
      state.page = page;
      if (typeof render === 'function') render();
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
    }
  } catch (e) {}
}

// ───────── goTo مشترک بین سایت اصلی و پنل مدیریت ─────────
function goTo(page, data = null) {
  state.prevPage = state.page;
  state.page = page;
  state.mobileMenuOpen = false;

  if (data && page === 'product') {
    state.selectedProduct = data;
  }

  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // هماهنگ‌سازی آدرس با تاخیر کوتاه، بعد از اینکه رندر واقعی انجام شد
  // (doRender در functions.js نیز syncHistoryWithState را صدا می‌زند؛
  // این فراخوانی برای اطمینان بیشتر و واکنش سریع‌تر است)
  setTimeout(syncHistoryWithState, 0);
}

// اعمال فوری صفحه از روی هش آدرس، پیش از اولین رندر واقعی
// (چون render() با requestAnimationFrame به تاخیر می‌افتد، این فراخوانی
// همزمان تضمین می‌کند state.page درست باشد پیش از نقاشی اول صفحه)
applyHashToState();

window.addEventListener('popstate', applyHashToState);
window.addEventListener('hashchange', applyHashToState);

window.goTo = goTo;
window.syncHistoryWithState = syncHistoryWithState;
window.applyHashToState = applyHashToState;
