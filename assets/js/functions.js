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
      pending: { label: 'در انتظار تایید', badge: 'badge-pending', icon: '⏳' },
      processing: { label: 'در حال پردازش', badge: 'badge-processing', icon: '⚙️' },
      shipped: { label: 'ارسال شده', badge: 'badge-shipped', icon: '🚚' },
      delivered: { label: 'تحویل داده شده', badge: 'badge-delivered', icon: '✅' }
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
      timerEl.innerHTML = `<button type="button" onclick="resendOtp()" class="text-violet-400 hover:text-violet-300 transition-colors">ارسال مجدد کد</button>`;
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
  goTo('home');
  toast('🎉 ورود موفقیت‌آمیز!');

  resetLoginState();
  render(); // مهم: بعد از ورود دوباره رندر بشه
}

// تغییر شماره موبایل
function changePhoneNumber() {
  resetLoginState();
  render();
}

// خروج از حساب
function logout() {
  state.confirmModal = {
    type: 'logout',
    title: 'خروج از حساب کاربری',
    message: 'آیا مطمئن هستید که می‌خواهید از حساب خود خارج شوید؟',
    icon: '🚪',
    confirmText: 'خروج',
    confirmClass: 'btn-danger',
    onConfirm: () => {
      state.user = null;
      state.isAdmin = false;
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
          <div class="text-4xl mb-3">⚠️</div>
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
        default:        return renderHomePage();
      }
    });

    const overlays = [
      state.confirmModal ? safe(() => renderConfirmModal()) : '',
      state.editProduct  ? safe(() => renderProductModal()) : '',
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

    writeHTML(appEl, html);
    lastHTML = html;
    lastPage = state.page;

    // هماهنگ‌سازی آدرس نوار مرورگر با وضعیت فعلی (برای پشتیبانی از
    // دکمه بازگشت/جلو در هر دو سایت اصلی و پنل مدیریت)
    if (typeof window.syncHistoryWithState === 'function') {
      window.syncHistoryWithState();
    }

    if (state.prevPage !== state.page) {
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
    toast('به سبد خرید اضافه شد 🛒');
  }
  
  render();
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
    render();
  }
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(item => item.id !== productId);
  toast('محصول از سبد حذف شد', 'info');
  render();
}

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