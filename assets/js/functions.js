// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS (نسخه به‌روز شده)
// File: assets/js/utility functions.js
// ═══════════════════════════════════════════════════════════════

const utils = {
  // Numbers
  formatNumberFa: (n = 0) => new Intl.NumberFormat('fa-IR').format(n || 0),

  // Price
  formatPrice: (price) => {
    const p = Number.isFinite(price) ? price : 0;
    return `${new Intl.NumberFormat('fa-IR').format(p)} تومان`;
  },
  formatPriceShort: (price) => {
    const p = Number.isFinite(price) ? price : 0;
    if (p >= 1_000_000) return `${utils.formatNumberFa(Math.floor(p / 1_000_000))} میلیون`;
    if (p >= 1_000) return `${utils.formatNumberFa(Math.floor(p / 1_000))} هزار`;
    return utils.formatNumberFa(p);
  },

  // Date & time
  formatDate: (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
        .format(new Date(dateStr));
    } catch { return '-'; }
  },
  formatDateTime: (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }).format(new Date(dateStr));
    } catch { return '-'; }
  },
  formatTime: (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' })
        .format(new Date(dateStr));
    } catch { return ''; }
  },

  // IDs & tokens
  generateId: () => Date.now().toString(36) + Math.random().toString(36).substring(2, 10),
  generateOtp: () => String(Math.floor(100000 + Math.random() * 900000)), // کد ۶ رقمی

  // Phone (Iran)
  normalizePhone: (phone = '') => phone.replace(/\D/g, '').replace(/^(\+?98|0098)/, '0'),
  isValidPhone: (phone) => /^09[0-9]{9}$/.test(utils.normalizePhone(phone)),

  // Order status info
  getStatusInfo: (status) => {
    const statuses = {
      pending: { label: 'در انتظار تایید', badge: 'badge-pending', icon: 'clock' },
      processing: { label: 'در حال پردازش', badge: 'badge-processing', icon: 'settings' },
      shipped: { label: 'ارسال شده', badge: 'badge-shipped', icon: 'truck' },
      delivered: { label: 'تحویل داده شده', badge: 'badge-delivered', icon: 'check' }
    };
    return statuses[status] || statuses.pending;
  },

  // Discount
  calculateDiscount: (original, current) => {
    const o = Number(original);
    const c = Number(current);
    if (!Number.isFinite(o) || o <= 0) return 0;
    if (!Number.isFinite(c) || c <= 0) return 0;
    if (c >= o) return 0;
    return Math.round(((o - c) / o) * 100);
  },

  // Totals (cart/order)
  calculateTotals: (items = [], shipping = 0) => {
    const subtotal = items.reduce((sum, it) => sum + (Number(it.price) * Number(it.qty || 1)), 0);
    const total = subtotal + (Number(shipping) || 0);
    return { subtotal, shipping: Number(shipping) || 0, total };
  },

  // Stars
  renderStars: (rating = 0, size = 'text-sm') => {
    const r = Math.max(0, Math.min(5, Number(rating) || 0));
    const full = Math.floor(r);
    const half = r - full >= 0.5;
    let html = '';
    for (let i = 0; i < 5; i++) {
      if (i < full) html += `<span class="star ${size}">★</span>`;
      else if (i === full && half) html += `<span class="star-half ${size}">⯨</span>`;
      else html += `<span class="star-empty ${size}">☆</span>`;
    }
    return html;
  },

  // Async & timing
  debounce: (func, wait) => {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },
  throttle: (func, wait) => {
    let last = 0, timer;
    return function (...args) {
      const now = Date.now();
      const remaining = wait - (now - last);
      if (remaining <= 0) {
        clearTimeout(timer);
        last = now;
        func.apply(this, args);
      } else if (!timer) {
        timer = setTimeout(() => {
          last = Date.now();
          timer = null;
          func.apply(this, args);
        }, remaining);
      }
    };
  },

  // Storage helpers
  safeJSONParse: (str, fallback = null) => {
    try { return JSON.parse(str); } catch { return fallback; }
  },
  saveLocal: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  loadLocal: (key, fallback = null) => {
    try { return utils.safeJSONParse(localStorage.getItem(key), fallback); } catch { return fallback; }
  },

  // Strings
  clamp: (val, min, max) => Math.min(max, Math.max(min, val)),
  pluralFa: (n, singular, plural) => (Number(n) === 1 ? singular : plural),
  slugify: (text) => String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-'),

  // Objects
  mergeDeep: (target, source) => {
    if (typeof target !== 'object' || target === null) return source;
    if (typeof source !== 'object' || source === null) return source;
    const out = Array.isArray(target) ? [...target] : { ...target };
    for (const key of Object.keys(source)) {
      const val = source[key];
      out[key] = (typeof val === 'object' && val !== null)
        ? utils.mergeDeep(out[key], val)
        : val;
    }
    return out;
  },

  // Images (avatar/product)
  readImageAsDataUrl: (file) => new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  }),
  validateImageFile: (file, { maxSizeMB = 5, types = ['image/jpeg', 'image/png', 'image/webp'] } = {}) => {
    if (!file) return { ok: false, error: 'No file' };
    const okType = types.includes(file.type);
    const okSize = file.size <= maxSizeMB * 1024 * 1024;
    return { ok: okType && okSize, error: okType ? (okSize ? null : 'حجم فایل بالا است') : 'نوع فایل نامعتبر' };
  },

  // ========== توابع جدید برای مدیریت گالری تصاویر ==========
  
  // استخراج همه تصاویر محصول
  extractAllProductImages: (product) => {
    if (!product) return [];
    
    const allImages = [];
    const seen = new Set();

    // فیلدهای تکی
    const singleFields = [
      product.main_image,
      product.image,
      product.mainImage,
      product.thumbnail,
      product.cover,
      product.featured_image,
      product.primary_image
    ];

    singleFields.forEach(img => {
      if (img && typeof img === 'string' && img.trim() && !seen.has(img)) {
        allImages.push(img.trim());
        seen.add(img);
      }
    });

    // آرایه‌ها
    const arrayFields = ['images', 'gallery', 'pictures', 'media', 'main_image_list'];
    arrayFields.forEach(field => {
      if (Array.isArray(product[field])) {
        product[field].forEach(img => {
          if (img && typeof img === 'string' && img.trim() && !seen.has(img)) {
            allImages.push(img.trim());
            seen.add(img);
          }
        });
      }
    });

    return allImages;
  },

  // نرمال‌سازی URL تصویر
  normalizeImageUrl: (url) => {
    if (!url || typeof url !== 'string') return '';
    
    url = url.trim();
    
    // اگر دیتا URL است
    if (url.startsWith('data:image/')) return url;
    
    // اگر URL کامل است
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    
    // اگر آدرس نسبی است
    if (url.startsWith('/')) return url;
    if (url.startsWith('./')) return url.substring(1);
    if (url.startsWith('../')) return url;
    
    // اگر هیچ کدام نیست، به عنوان آدرس نسبی در نظر بگیر
    return '/' + url;
  },

  // بررسی معتبر بودن تصویر
  isValidImage: (url) => {
    if (!url || typeof url !== 'string') return false;
    
    url = url.trim().toLowerCase();
    
    // دیتا URL
    if (url.startsWith('data:image/')) return true;
    
    // فرمت‌های معتبر
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    const hasValidExtension = validExtensions.some(ext => url.includes(ext));
    
    // پروتکل معتبر
    const hasValidProtocol = url.startsWith('http://') || 
                             url.startsWith('https://') || 
                             url.startsWith('/') || 
                             url.startsWith('./') || 
                             url.startsWith('../');
    
    return hasValidExtension && hasValidProtocol;
  },

  // Notifications
  pushNotification: (msg, type = 'info') => {
    const note = { id: utils.generateId(), msg, type, at: new Date().toISOString() };
    state.notifications = [note, ...state.notifications].slice(0, 50);
    render?.();
    return note;
  },

  // Smooth scroll top
  scrollTop: (behavior = 'smooth') => window.scrollTo({ top: 0, behavior })
};

// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION FUNCTIONS
// File: assets/js/authentication functions.js
// ═══════════════════════════════════════════════════════════════

// ریست وضعیت ورود
function resetLoginState() {
  if (state.otpInterval) {
    clearInterval(state.otpInterval);
    state.otpInterval = null;
  }
  state.loginStep = 'phone';
  state.loginPhone = '';
  state.generatedOtp = '';
  state.otpTimer = 0;
}

// شروع شمارش معکوس
function startOtpCountdown(seconds = 120) {
  state.otpTimer = seconds;
  if (state.otpInterval) clearInterval(state.otpInterval);
  state.otpInterval = setInterval(() => {
    state.otpTimer--;
    if (state.otpTimer <= 0) {
      clearInterval(state.otpInterval);
      state.otpInterval = null;
    }
    updateOtpTimerDisplay();
  }, 1000);
}

// ارسال کد OTP
function sendOtp(phone) {
  if (!utils.isValidPhone(phone)) {
    toast('شماره موبایل نامعتبر است', 'error');
    return;
  }

  // جلوگیری از ارسال دوباره در زمان شمارش
  if (state.loginStep === 'otp' && state.otpTimer > 0) {
    toast('لطفاً تا پایان شمارش معکوس صبر کنید', 'warning');
    return;
  }

  state.loginPhone = phone;
  state.generatedOtp = utils.generateOtp();
  state.loginStep = 'otp';
  startOtpCountdown(120);

  toast(`کد تایید برای شماره ${phone} ارسال شد`, 'info');
  render();
}

// نمایش شمارش معکوس
function updateOtpTimerDisplay() {
  const timerEl = document.getElementById('otp-timer-display');
  if (timerEl) {
    if (state.otpTimer > 0) {
      timerEl.innerHTML = `<span class="text-white/40">${Math.floor(state.otpTimer / 60)}:${String(state.otpTimer % 60).padStart(2, '0')}</span>`;
    } else {
      timerEl.innerHTML = `<button type="button" onclick="resendOtp()" class="text-blue-400 hover:text-blue-300 transition-colors">ارسال مجدد کد</button>`;
    }
  }
}

// ارسال مجدد کد
function resendOtp() {
  if (state.otpTimer > 0) return;

  state.generatedOtp = utils.generateOtp();
  startOtpCountdown(120);

  toast(`کد جدید برای شماره ${state.loginPhone} ارسال شد`, 'info');
  render();
}

// تایید کد OTP
function verifyOtp(code) {
  if (code !== state.generatedOtp) {
    toast('کد تایید اشتباه است', 'error');
    return;
  }

  if (state.otpInterval) {
    clearInterval(state.otpInterval);
    state.otpInterval = null;
  }

  // نکته امنیتی: ورود به پنل مدیریت دیگر از این مسیر (OTP در سایت اصلی) ممکن نیست.
  // پنل مدیریت فقط از طریق آدرس admin.html و سیستم ورود اختصاصی آن در دسترس است.
  state.user = { phone: state.loginPhone, name: 'کاربر' };
  state.isAdmin = false;
  // r46 — ادغام خودکار لیست علاقه‌مندی میهمان در لیست کاربر
  try { if (typeof wlSync === 'function') wlSync(); } catch (e) {}
  goTo('home');
  toast('ورود موفق بود');

  resetLoginState();
  render(); // مهم: بعد از ورود دوباره رندر بشه
}

// تغییر شماره موبایل
function changePhoneNumber() {
  resetLoginState();
  render();
}

// خروج از حساب — یکپارچه با نسخهٔ کامل (سرور + AppState) — همه‌جا با مودال تایید
function logout() {
  if (typeof window.logoutUser === 'function') { window.logoutUser(); return; }
  state.confirmModal = {
    type: 'logout',
    title: 'خروج از حساب کاربری',
    message: 'با خروج، از حساب خود خارج می‌شوید. سبد خرید و علاقه‌مندی‌های شما ذخیره می‌مانند و با ورود دوباره بازمی‌گردند.',
    icon: (typeof aryIcon === 'function' ? '<span class="inline-flex text-rose-300">' + aryIcon('logout', 'w-12 h-12') + '</span>' : ''),
    confirmText: 'بله، خروج',
    confirmClass: 'btn-danger',
    onConfirm: () => {
      try { if (window.AryaServer && AryaServer.isConfigured && AryaServer.isConfigured()) AryaServer.logout().catch(() => {}); } catch (e) {}
      state.user = null; state.currentUser = null; state.isAdmin = false;
      try { if (window.AppState) AppState.set({ user: null, currentUser: null, isAdmin: false, loggedIn: false }); } catch (e) {}
      try { if (typeof wlSync === 'function') wlSync(); } catch (e) {}
      state.confirmModal = null;
      goTo('home');
      toast('از حساب خارج شدید', 'info');
      render();
    }
  };
  render();
}

// ═══════════════════════════════════════════════════════════════
// MAIN RENDER FUNCTION (FINAL)
// File: assets/js/main render function.js
// ═══════════════════════════════════════════════════════════════

(function () {
  // ---------- Global login restore (before any render) ----------
  // با استفاده از sessionStorage (که فقط در طول عمر همین تب زنده می‌ماند)
  // تشخیص می‌دهیم که آیا این «رفرش صفحه» است (کاربر باید لاگین بماند) یا
  // «باز شدن یک تب/مرورگر جدید بعد از بسته شدن قبلی» است (کاربر باید
  // به‌صورت خودکار خارج شود).
  const TAB_SESSION_KEY = 'arya_tab_session_active';

  (function restoreLoginGlobal() {
    const saved = (window.AppState ? AppState.get() : {}) || {};
    let tabIsContinuing = false;
    try { tabIsContinuing = sessionStorage.getItem(TAB_SESSION_KEY) === '1'; } catch (e) {}

    if (tabIsContinuing && saved.loggedIn === true && saved.currentUser) {
      // رفرش همان تب — کاربر لاگین باقی می‌ماند
      state.currentUser = saved.currentUser;
      state.user        = saved.user;
      state.isAdmin     = saved.isAdmin || false;
    } else {
      // تب/مرورگر جدید (قبلی بسته شده بود) — خروج خودکار
      state.currentUser = null;
      state.user        = null;
      state.isAdmin     = false;
      if (!tabIsContinuing && window.AppState) {
        AppState.set({ loggedIn: false, currentUser: null, user: null, isAdmin: false });
      }
    }

    try { sessionStorage.setItem(TAB_SESSION_KEY, '1'); } catch (e) {}
  })();

  // ---------- Mount points ----------
  const MOUNT = {
    app: '#app'
  };

  // ---------- Internal state for renderer ----------
  let isScheduled = false;
  let lastHTML = '';
  let lastPage = null;

  // ---------- Safe runner ----------
  function safe(fn, fallback = '') {
    try { return fn(); } catch (err) {
      console.error('[Render Error]', err);
      return `
        <div class="max-w-lg mx-auto p-6 glass rounded-2xl mt-8">
          <span class="inline-flex text-amber-300 mb-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:2.2rem;height:2.2rem;vertical-align:-0.15em" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></span>
          <h2 class="font-bold mb-2">خطا در رندر صفحه</h2>
          <p class="text-white/70 text-sm">لطفاً دوباره تلاش کنید یا صفحه را رفرش کنید.</p>
        </div>
      `;
    }
  }

  // ---------- Compose whole page ----------
  function composePage() {
    const mainHTML = safe(() => {
      // If article editor screen is active, render it first
      if (state.currentScreen === "article-editor") {
        return renderArticleEditor();
      }

      if (state.isAdmin && state.page === 'admin') {
        return renderAdminPanel();
      }
      switch (state.page) {
        case 'home':    return renderHomePage();
        case 'shop':    return renderShopPage();
        case 'product': return renderProductPage();
        case 'cart':    return renderCartPage();
        case 'checkout':return renderCheckoutPage();
        case 'login':   return renderLoginPage();
        case 'profile': return renderProfilePage();
        case 'blog':    return typeof renderBlogPage === 'function' ? renderBlogPage() : renderHomePage();
        case 'article': return typeof renderArticlePage === 'function' ? renderArticlePage() : renderBlogPage();
        default:        return (state.page && typeof renderNotFoundPage === 'function') ? renderNotFoundPage() : renderHomePage();
      }
    });

    // فرم محصول دیگر پاپ‌آپ نیست: با پرچم productFormPage در خودِ تب محصولات رندر می‌شود
    const overlays = [
      state.confirmModal ? safe(() => renderConfirmModal()) : '',
      state.videoPlayer  ? safe(() => renderVideoPlayerModal()) : ''
    ].join('');

    return mainHTML + overlays;
  }

  // ---------- DOM writer with optional view transitions ----------
  function writeHTML(root, html) {
    const supportsViewTransition =
      document.startViewTransition &&
      document.documentElement.classList.contains('view-transition');

    if (supportsViewTransition && lastPage !== state.page) {
      document.startViewTransition(() => {
        root.innerHTML = html;
      });
    } else {
      root.innerHTML = html;
    }
  }

  // ---------- حفظ اسکرول افقی بندهای کشیدنی + فوکوس فیلد (با هر رندر برنگردد) ----------
  const KEEP_SCROLL_SEL = '.ary-hscroll, [data-keep-scroll], .overflow-x-auto';
  function captureKeepState(root) {
    const snaps = [];
    try {
      const els = root.querySelectorAll(KEEP_SCROLL_SEL);
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (!el.scrollLeft && el.scrollTop !== undefined && !el.scrollTop) continue;
        const key = el.id || el.getAttribute('data-keep-scroll') || (el.className && String(el.className).slice(0, 80)) || '';
        snaps.push({ key: key, i: i, left: el.scrollLeft, top: el.scrollTop });
      }
    } catch (e) {}
    let focus = null;
    try {
      const ae = document.activeElement;
      if (ae && ae.id && root.contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) {
        focus = {
          id: ae.id,
          start: (() => { try { return ae.selectionStart; } catch (e) { return null; } })(),
          end: (() => { try { return ae.selectionEnd; } catch (e) { return null; } })()
        };
      }
    } catch (e) {}
    const winY = window.scrollY || 0;
    return { snaps: snaps, focus: focus, winY: winY };
  }
  function restoreKeepState(root, keep) {
    if (!keep) return;
    const apply = () => {
      try {
        const els = root.querySelectorAll(KEEP_SCROLL_SEL);
        keep.snaps.forEach(sn => {
          let el = null;
          const simpleKey = sn.key && sn.key.indexOf(' ') === -1 && sn.key.indexOf('.') === -1 && sn.key.length < 60;
          if (simpleKey) el = document.getElementById(sn.key) || root.querySelector('[data-keep-scroll="' + sn.key + '"]');
          if (!el) {
            const cand = els[sn.i];
            if (cand && sn.left > 1 && cand.scrollWidth - cand.clientWidth >= 12) el = cand; // فقط همان‌جا که واقعاً افقی اسکرول‌شدنی است
          }
          if (!el) return;
          const hScrollable = el.scrollWidth - el.clientWidth >= 12;
          if (hScrollable) el.style.scrollSnapType = 'none';     // اسنپ را لحظه‌ای خاموش کن تا پرش ریز ایجاد نشود
          const prevBehavior = el.style.scrollBehavior;
          el.style.scrollBehavior = 'auto';
          if (sn.left > 1 && Math.abs(el.scrollLeft - sn.left) > 1) el.scrollLeft = sn.left;
          if (sn.top > 1 && el.scrollHeight - el.clientHeight >= 8 && Math.abs(el.scrollTop - sn.top) > 1) el.scrollTop = sn.top;
          requestAnimationFrame(() => {
            el.style.scrollSnapType = '';
            el.style.scrollBehavior = prevBehavior || '';
          });
        });
      } catch (e) {}
      if (keep.focus && keep.focus.id) {
        const nf = document.getElementById(keep.focus.id);
        if (nf && root.contains(nf)) {
          nf.focus({ preventScroll: true });
          try { if (keep.focus.start != null) nf.setSelectionRange(keep.focus.start, keep.focus.end); } catch (e) {}
        }
      }
      if (Math.abs(window.scrollY - keep.winY) > 2) {
        try { window.scrollTo({ top: keep.winY, behavior: 'auto' }); } catch (e) {}
      }
    };
    apply(); // هم‌فریم با رندر — بدون پرش دید
  }

  // ---------- Core render (batched with rAF) ----------
  function doRender() {
    isScheduled = false;

    const appEl = document.querySelector(MOUNT.app);
    if (!appEl) {
      console.warn('[Render] mount element not found:', MOUNT.app);
      return;
    }

    const html = composePage();

    if (html === lastHTML) return;

    const samePage = lastPage === state.page;
    const keep = samePage ? captureKeepState(appEl) : null;

    writeHTML(appEl, html);
    if (keep) restoreKeepState(appEl, keep);
    lastHTML = html;
    lastPage = state.page;

    // رویداد عمومی پس از هر رندر (نشانک چت، مانت نقشهٔ آدرس و…)
    try { document.dispatchEvent(new CustomEvent('ary:rendered', { detail: state.page })); } catch (e) {}

    // هماهنگ‌سازی آدرس نوار مرورگر با وضعیت فعلی (برای پشتیبانی از
    // دکمه بازگشت/جلو در هر دو سایت اصلی و پنل مدیریت)
    if (typeof window.syncHistoryWithState === 'function') {
      window.syncHistoryWithState();
    }

    if (state.prevPage !== state.page && lastHTML !== '') {
      // رندر اول صفحه: اسکرول را دست نزن تا بازیابی طبیعی مرورگر (رفرش) حفظ شود
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
    }
  }

  // ---------- Public render (schedule) ----------
  function render() {
    if (isScheduled) return;
    isScheduled = true;
    requestAnimationFrame(doRender);
  }

  // ---------- Expose ----------
  window.render = render;

  // ---------- Initial render ----------
  render();

  // ---------- Optional: subscribe to AppState ----------
  if (window.AppState && typeof window.AppState.subscribe === 'function') {
    window.AppState.subscribe(() => render());
  }

  // ---------- Enable view transitions from CSS flag ----------
  try {
    if (CSS && CSS.supports && CSS.supports('view-transition-name: x')) {
      document.documentElement.classList.add('view-transition');
    }
  } catch {}
})();

// ═══════════════════════════════════════════════════════════════
// CART FUNCTIONS
// File: assets/js/cart functions.js
// ═══════════════════════════════════════════════════════════════
function syncCartState() {
  // هر تغییر سبد باید از AppState بگذرد تا در localStorage ذخیره شود
  // (در غیر این صورت با رفرش، آیتم‌های حذف‌شده برمی‌گردند یا افزودنی‌ها می‌پرند)
  if (window.AppState) {
    AppState.set({ cart: (state.cart || []).map(it => ({ ...it })) });
  } else if (typeof render === 'function') {
    render();
  }
}

function addToCart(product) {
  if (!product) return;
  
  const existingIndex = state.cart.findIndex(item => item.id === product.id);
  
  if (existingIndex >= 0) {
    if (state.cart[existingIndex].qty < (product.stock || 99)) {
      state.cart[existingIndex].qty++;
      toast('تعداد محصول افزایش یافت');
    } else {
      toast('موجودی انبار کافی نیست', 'warning');
      return;
    }
  } else {
    if ((product.stock || 0) <= 0) {
      toast('این محصول موجود نیست', 'warning');
      return;
    }
    
    state.cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      original_price: product.original_price,
      image: product.image,
      qty: 1
    });
    toast('به سبد خرید اضافه شد');
  }

  syncCartState();
}

function updateCartQuantity(productId, newQty) {
  const index = state.cart.findIndex(item => item.id === productId);
  
  if (index >= 0) {
    if (newQty <= 0) {
      state.cart.splice(index, 1);
      toast('محصول از سبد حذف شد', 'info');
    } else {
      const product = state.products.find(p => p.id === productId);
      if (product && newQty > (product.stock || 99)) {
        toast('موجودی انبار کافی نیست', 'warning');
        return;
      }
      state.cart[index].qty = newQty;
    }
    syncCartState();
  }
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(item => item.id !== productId);
  toast('محصول از سبد حذف شد', 'info');
  syncCartState();
}

// ════════════════════════════════════════════════════════════════
// ARYA COUPONS — موتور کدهای تخفیف (سایت و پنل مشترک‌اند)
// scope: all | category | products | shipping — type: percent | fixed | shipping
// ════════════════════════════════════════════════════════════════
function _couponNorm(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ''); }
function aryCoupons() { return Array.isArray(state.coupons) ? state.coupons : []; }
function aryCouponFind(code) { const c = _couponNorm(code); if (!c) return null; return aryCoupons().find(x => _couponNorm(x.code) === c) || null; }
function aryCouponScopeSubtotal(c) {
  if (!c) return 0;
  if (c.scope === 'category') return state.cart.reduce((s, it) => { const pc = it.category != null ? it.category : ((state.products.find(p => String(p.id) === String(it.id)) || {}).category || ''); return s + (String(pc) === String(c.categoryId) ? it.price * it.qty : 0); }, 0);
  if (c.scope === 'products') { const ids = (c.productIds || []).map(String); return state.cart.reduce((s, it) => s + (ids.includes(String(it.id)) ? it.price * it.qty : 0), 0); }
  return getCartTotal();
}
function aryCouponCheck(c) {
  if (!c || c.active === false) return { ok: false, msg: 'کد تخفیف فعال نیست' };
  const now = Date.now();
  if (c.expires_at && now > new Date(c.expires_at).getTime()) return { ok: false, msg: 'تاریخ انقضای کد گذشته است' };
  if (c.starts_at && now < new Date(c.starts_at).getTime()) return { ok: false, msg: 'کد هنوز شروع نشده است' };
  if (c.max_uses && Number(c.used || 0) >= Number(c.max_uses)) return { ok: false, msg: 'ظرفیت استفاده از کد تکمیل شده است' };
  return { ok: true };
}
function aryCouponCompute(code) {
  const c = aryCouponFind(code);
  if (!c) return { ok: false, msg: 'کد تخفیف نامعتبر است' };
  const chk = aryCouponCheck(c); if (!chk.ok) return chk;
  const base = aryCouponScopeSubtotal(c);
  if (c.type !== 'shipping' && c.scope !== 'shipping' && !(base > 0)) return { ok: false, msg: c.scope === 'category' ? 'محصولی از دستهٔ مشمول این کد در سبد نیست' : (c.scope === 'products' ? 'محصول(های) مشمول این کد در سبد نیستند' : 'سبد خالی است') };
  const min = Number(c.min_cart || 0);
  if (min && getCartTotal() < min) return { ok: false, msg: 'برای این کد، مجموع سبد باید حداقل ' + (window.utils && utils.formatPrice ? utils.formatPrice(min) : min) + ' باشد' };
  let discount = 0, freeShip = false;
  if (c.type === 'percent') { discount = Math.round(base * (Math.min(95, Math.max(1, Number(c.value) || 0)) / 100)); if (Number(c.max_discount) > 0) discount = Math.min(discount, Number(c.max_discount)); }
  else if (c.type === 'fixed') discount = Math.min(Number(c.value) || 0, base > 0 ? base : (Number(c.value) || 0));
  if (c.type === 'shipping' || (c.scope === 'shipping' && !discount)) freeShip = true;
  if (!discount && !freeShip) return { ok: false, msg: 'این کد برای سبد فعلی تخفیفی ندارد' };
  return { ok: true, code: c.code, discount: discount, freeShip: freeShip, scope: c.scope, base: base };
}
function aryApplyCoupon(code) {
  const r = aryCouponCompute(code);
  if (!r.ok) { if (window.toast) toast(r.msg, 'warning'); return r; }
  state.appliedCoupon = { code: r.code, discount: r.discount, freeShip: r.freeShip, scope: r.scope };
  try { if (window.AppState) AppState.set({ appliedCoupon: state.appliedCoupon }); else if (window.render) render(); } catch (e) { if (window.render) render(); }
  if (window.toast) toast('کد تخفیف «' + r.code + '» اعمال شد' + (r.discount ? ' — ' + utils.formatPrice(r.discount) + ' تومان تخفیف' : '') + (r.freeShip ? ' — ارسال رایگان!' : ''), 'success', 4200);
  return r;
}
function aryClearCoupon() {
  state.appliedCoupon = null;
  try { if (window.AppState) AppState.set({ appliedCoupon: null }); else if (window.render) render(); } catch (e) { if (window.render) render(); }
}
// ── محتوای قابل‌ویرایش صفحهٔ اصلی (state.home + state.aboutBlocks) ──
window.ARYA_ABOUT_DEFAULTS = [
  { id: 'about1', title: 'اصالت کالا، خط قرمز ما', text: 'تمام محصولات از تأمین‌کنندهٔ رسمی و با گارانتی اصالت عرضه می‌شوند؛ هر کالایی که اصل نباشد، بدون قید و شرط پس گرفته می‌شود.', image: 'about1.jpg', stat_n: '۱۲+', stat_l: 'سال تجربه' },
  { id: 'about2', title: 'ارسال سریع و شفاف', text: 'بسته‌بندی حرفه‌ای، کد رهگیری آنی و بازهٔ زمانی مشخص برای تحویل — وضعیت سفارش را در هر لحظه در پنل کاربری ببینید.', image: 'about2.jpg', stat_n: '۲۴س', stat_l: 'تحویل در تهران' },
  { id: 'about3', title: 'پشتیبانی، تا بعد از خرید', text: 'تیم پشتیبانی آریا از انتخاب کالا تا پس از تحویل کنار شماست؛ ثبت تیکت، مرجوعی ۷ روزه و پاسخ کمتر از یک ساعت در ساعات کاری.', image: 'about3.jpg', stat_n: '۹۲٪', stat_l: 'رضایت مشتری' }
];
function aryHome() {
  var CFG = (typeof config !== 'undefined') ? config : (window.config || {}); var d = { hero: { badge: '', title: CFG.hero_title || '', sub: CFG.hero_subtitle || '', cta: 'شروع خرید', ctaPage: 'shop', image: '', overlay: null }, deals_title: 'شگفت‌انگیزهای امروز', deals_sub: '', about_title: 'معرفی مجموعه' };
  var h = (typeof state !== 'undefined' && state.home) || {};
  var hero = Object.assign({}, d.hero);
  if (h.hero) { Object.keys(h.hero).forEach(function (k) { if (h.hero[k] !== '' && h.hero[k] != null || k === 'image' || k === 'badge') hero[k] = h.hero[k]; }); }
  if (h.hero && h.hero.overlay === '') hero.overlay = null;
  if (h.hero && h.hero.image === '') hero.image = '';
  return { hero: hero, deals_title: h.deals_title || d.deals_title, deals_sub: h.deals_sub != null ? h.deals_sub : d.deals_sub, about_title: h.about_title || d.about_title, about_blocks: (Array.isArray(state.aboutBlocks) && state.aboutBlocks.length) ? state.aboutBlocks : window.ARYA_ABOUT_DEFAULTS };
}
window.aryHome = aryHome;

function aryCartPricing() {
  const subtotal = getCartTotal();
  const cfg = (typeof aryShopCfg === 'function') ? aryShopCfg() : { base_cost: 0, free_over: 1e15 };
  let shipping = subtotal >= Number(cfg.free_over || 0) ? 0 : Number(cfg.base_cost || 0);
  let discount = 0, couponCode = '';
  const ap = state.appliedCoupon;
  if (ap) {
    const c = aryCouponFind(ap.code);
    const chk = c ? aryCouponCheck(c) : { ok: false };
    if (chk.ok && c) {
      const re = aryCouponCompute(ap.code);
      if (re.ok) { discount = re.discount || 0; if (re.freeShip) shipping = 0; couponCode = ap.code; }
      else if (window.toast) toast('کد تخفیف دیگر معتبر نیست و حذف شد', 'warning');
      state.appliedCoupon = couponCode ? state.appliedCoupon : null;
    } else state.appliedCoupon = null;
  }
  const total = Math.max(0, subtotal - discount) + shipping;
  return { subtotal, shipping, discount, total, couponCode };
}
window.aryApplyCoupon = aryApplyCoupon; window.aryClearCoupon = aryClearCoupon; window.aryCartPricing = aryCartPricing;
window.aryCouponFind = aryCouponFind; window.aryCouponCheck = aryCouponCheck; window.aryCouponCompute = aryCouponCompute; window.aryCouponScopeSubtotal = aryCouponScopeSubtotal;

function getCartTotal() {
  return state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function getCartOriginalTotal() {
  return state.cart.reduce((sum, item) => {
    const originalPrice = item.original_price || item.price;
    return sum + (originalPrice * item.qty);
  }, 0);
}

function getCartCount() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

function getCartDiscount() {
  const original = getCartOriginalTotal();
  const current = getCartTotal();
  return original - current;
}

// ═══ r40: پاک‌سازی امنیتی HTML محتوا (بلاگ، مقالهٔ محصول، توضیحات) ═══
window.arySanitizeHtml = function (html) {
  const raw = String(html == null ? '' : html); if (!raw) return '';
  try {
    const doc = new DOMParser().parseFromString('<body id="ary-san-root">' + raw + '</body>', 'text/html');
    const root = doc.getElementById('ary-san-root'); if (!root) return '';
    root.querySelectorAll('script,style,iframe,object,embed,form,input,button,link,meta,base,svg,math,animate,animatetransform').forEach(function (n) { n.remove(); });
    const ALLOW = 'A B STRONG I EM U BR P H2 H3 H4 H5 UL OL LI BLOCKQUOTE FIGCAPTION FIGURE SPAN DIV TABLE THEAD TBODY TR TD TH IMG HR CODE PRE SMALL SUB SUP MARK'.split(' ');
    const urlOk = function (u) { u = String(u || '').trim().toLowerCase(); if (!u) return false; if (u.indexOf('javascript:') === 0 || u.indexOf('vbscript:') === 0 || u.indexOf('data:text/html') === 0) return false; return /^(https?:|mailto:|tel:|\/|\.\/|#)/.test(u) || /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(u); };
    (function walk(parent) {
      Array.prototype.slice.call(parent.children).forEach(function (el) {
        if (ALLOW.indexOf(el.tagName) === -1) { el.replaceWith(doc.createTextNode(el.textContent || '')); return; }
        Array.prototype.slice.call(el.attributes).forEach(function (at) {
          const n = at.name.toLowerCase(), v = at.value;
          const keep = (n === 'href' && el.tagName === 'A' && urlOk(v)) || (n === 'src' && el.tagName === 'IMG' && urlOk(v)) || (n === 'alt') || (n === 'class' && /^(ary|align|img|text)/.test(v)) || (n === 'colspan' || n === 'rowspan');
          if (!keep) el.removeAttribute(at.name);
        });
        if (el.tagName === 'A') { el.setAttribute('rel', 'noopener noreferrer nofollow'); if (!el.getAttribute('target')) { } else el.setAttribute('target', '_blank'); }
        if (el.tagName === 'IMG') { el.setAttribute('loading', 'lazy'); el.setAttribute('decoding', 'async'); }
        walk(el);
      });
    })(root);
    return root.innerHTML;
  } catch (e) {
    return String(raw)
      .replace(/<\s*\/?>\s*(script|style|iframe|object|embed|form|link|meta|base)[^>]*>/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/(javascript:|vbscript:)\s*/gi, '$1_blocked:');
  }
};
