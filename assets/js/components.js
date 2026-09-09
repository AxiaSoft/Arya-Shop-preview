// ═══════════════════════════════════════════════════════════════
// HEADER COMPONENT
// File: assets/js/header component.js
// ═══════════════════════════════════════════════════════════════
(function () {
  function ensureHeaderStyles() {
    if (document.getElementById('gpt5-header-styles')) return;
    const css = `
      .gpt5-drawer {
        background:
          radial-gradient(900px 500px at 95% 5%, rgba(86,125,255,0.22) 0%, rgba(0,0,0,0) 40%),
          radial-gradient(700px 500px at 10% 95%, rgba(0,210,255,0.16) 0%, rgba(0,0,0,0) 45%),
          linear-gradient(180deg, rgba(16,18,24,0.92) 0%, rgba(16,18,24,0.88) 55%, rgba(16,18,24,0.95) 100%);
        backdrop-filter: blur(26px) saturate(160%);
        border-left: 1px solid rgba(255,255,255,0.12);
        box-shadow: -14px 0 36px rgba(0,0,0,0.45);
        color:#fff;
      }
      .gpt5-drawer-link {
        width:100%; text-align:right; color:rgba(255,255,255,0.95);
        padding:10px 12px; border-radius:12px; border:1px solid transparent;
        transition: background 160ms ease, border-color 160ms ease;
      }
      .gpt5-drawer-link:hover { background: rgba(255,255,255,0.10); }
      .gpt5-drawer-link:active { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.14); }

      .gpt5-dd {
        overflow:hidden;
        max-height:0;
        opacity:0;
        margin-top:0;
        transition:max-height 260ms ease, opacity 260ms ease, margin-top 260ms ease;
      }
      .gpt5-dd.open {
        max-height:1000px;
        opacity:1;
        margin-top:6px;
      }
      .gpt5-dd-inner {
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.06);
        border-radius: 14px; padding: 6px;
      }
      .gpt5-dd-item {
        width:100%; text-align:right; color:rgba(255,255,255,0.92);
        padding:9px 10px; border-radius:10px; transition: background 160ms ease;
      }
      .gpt5-dd-item:hover { background: rgba(255,255,255,0.10); }
      .gpt5-dd-item:active { background: rgba(255,255,255,0.18); }

      /* SEARCH FLOATING BAR */
      .gpt5-search-wrap {
        position: relative;
        height: 0;
        overflow: visible;
        z-index: 40;
      }
      .gpt5-search-shell {
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        display: flex;
        justify-content: center;
        pointer-events: none;
        transform: translateY(-18px);
        opacity: 0;
        transition:
          transform 260ms cubic-bezier(0.4,0,0.2,1),
          opacity 220ms ease;
      }
      .gpt5-search-shell.open {
        transform: translateY(8px);
        opacity: 1;
        pointer-events: auto;
      }
      .gpt5-search {
        background: rgba(20,20,24,0.9);
        border: 1px solid rgba(255,255,255,0.14);
        backdrop-filter: blur(20px) saturate(140%);
        box-shadow: 0 18px 40px rgba(0,0,0,0.45);
        color: #fff;
        border-radius: 18px;
        padding: 10px 12px;
        width: 100%;
        max-width: 720px;
      }
      .gpt5-search-inner {
        position: relative;
      }
      .gpt5-search-input {
        width:100%;
        color:#fff;
        background: rgba(255,255,255,0.08);
        border:1px solid rgba(255,255,255,0.14);
        border-radius:12px;
        padding:12px 46px 12px 104px;
        outline:none;
        transition: all 0.22s ease;
        font-size: 0.92rem;
      }
      .gpt5-search-input::placeholder { color: rgba(255,255,255,0.55); }
      .gpt5-search-input:hover {
        background: rgba(255,255,255,0.12);
        border-color: rgba(255,255,255,0.22);
      }
      .gpt5-search-input:focus {
        border-color:#5cd2f6;
        box-shadow:0 0 0 3px rgba(92,210,246,0.35);
        background: rgba(255,255,255,0.10);
      }
      .gpt5-search-icon {
        position:absolute;
        right:14px;
        top:50%;
        transform:translateY(-50%);
        font-size:1.2rem;
        color:rgba(255,255,255,0.75);
      }
      .gpt5-search-btn {
        position:absolute;
        left:10px;
        top:50%;
        transform:translateY(-50%);
        padding:9px 16px;
        border-radius:11px;
        background: linear-gradient(135deg,#2a8dff,#005aff);
        box-shadow: 0 4px 14px rgba(37,99,235,0.55);
        font-size:0.85rem;
        font-weight:600;
        transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
        white-space: nowrap;
      }
      .gpt5-search-btn:hover {
        background: linear-gradient(135deg,#3b82f6,#2563eb);
        box-shadow: 0 7px 20px rgba(37,99,235,0.65);
        transform: translateY(-50%) translateY(-1px);
      }
      .gpt5-search-btn:active {
        box-shadow: 0 3px 10px rgba(37,99,235,0.5);
        transform: translateY(-50%) translateY(0);
      }

      .gpt5-badge {
        position:absolute; top:-6px; right:-6px; min-width:20px; height:20px; padding:0 4px;
        font-size:12px; line-height:20px; color:#fff; text-align:center; border-radius:999px;
        background: linear-gradient(180deg,#ff4d8d,#ff2f6f); box-shadow: 0 6px 16px rgba(255,70,130,0.45);
      }

      /* MOBILE MENU (بدون رندر، فقط کلاس) */
      .mobile-menu {
        position:fixed;
        inset:0;
        z-index:60;
        display:flex;
        pointer-events:none;
        opacity:0;
        transition:opacity 220ms ease;
      }
      .mobile-menu.open {
        pointer-events:auto;
        opacity:1;
      }

      @media (max-width:640px){
        .gpt5-search-input{
          padding-left: 96px;
          font-size: 0.85rem;
        }
        .gpt5-search-btn{
          padding:8px 14px;
          font-size:0.8rem;
        }
      }

      @media (max-width:480px){ .gpt5-drawer-w{width:86vw;} }
      @media (min-width:481px) and (max-width:768px){ .gpt5-drawer-w{width:72vw;} }
      @media (min-width:769px){ .gpt5-drawer-w{width:58vw;} }
    `;
    const style = document.createElement('style');
    style.id = 'gpt5-header-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function navigate(page) {
    goTo(page);
    setTimeout(() => {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
    }, 0);
  }

  // فقط کلاس منو را عوض می‌کند، بدون render
  function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    if (!menu) return;
    menu.classList.toggle('open');
  }

  // فقط کلاس دسته‌بندی سایدبار را عوض می‌کند، بدون render
  function toggleSidebarCategories() {
    const cats = document.getElementById('mobileCats');
    if (!cats) return;
    cats.classList.toggle('open');
  }

  // فقط کلاس نوار سرچ را عوض می‌کند، بدون render
  function toggleSearchBar() {
    const shell = document.querySelector('.gpt5-search-shell');
    const btn = document.getElementById('searchToggleBtn');
    if (!shell) return;
    shell.classList.toggle('open');
    if (btn) btn.textContent = shell.classList.contains('open') ? '✕' : '🔍';
  }

  function applySearch() {
    const input = document.getElementById('header-search');
    if (!input) return;
    state.productFilter.search = input.value || '';
    navigate('shop');
  }

  function handleSearchKey(e) {
    if (e.key === 'Enter') applySearch();
  }

  function renderHeader() {
    ensureHeaderStyles();

    const cartCount = typeof getCartCount === 'function'
      ? getCartCount()
      : (state.cart?.length || 0);

    const headerHTML = `
      <header class="glass-dark sticky top-0 z-50 border-b border-white/5">
        <div class="max-w-7xl mx-auto px-4 lg:px-8">
          <div class="flex items-center justify-between h-16 lg:h-20 relative">
            
            <!-- Logo -->
            <button onclick="navigate('home')" class="flex items-center gap-3 group" type="button">
              <img src="assets/img/logo/logo.png" alt="Logo" class="w-10 h-10 object-contain">
              <span class="font-black text-lg lg:text-xl gradient-text hidden sm:block">${config.store_name}</span>
            </button>
            
            <!-- Desktop Navigation -->
            <nav class="hidden lg:flex items-center gap-8">
              <button onclick="navigate('home')" class="text-white/80 hover:text-white text-sm font-medium transition-colors ${state.page==='home'?'text-white':''}" type="button">خانه</button>
              <button onclick="navigate('shop')" class="text-white/80 hover:text-white text-sm font-medium transition-colors ${state.page==='shop'?'text-white':''}" type="button">فروشگاه</button>
              
              <!-- Categories Dropdown -->
              <div class="relative group">
                <button class="text-white/80 text-sm font-medium flex items-center gap-1.5 glass-dark px-3 py-2 rounded-xl" type="button">
                  دسته‌بندی‌ها
                  <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                <div class="absolute top-full right-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  <div class="rounded-2xl p-3 min-w-[260px] shadow-2xl bg-gray-900/95 border border-white/15">
                    ${(state.categories || []).map(cat => `
                      <button onclick="state.productFilter.category='${cat.id}'; navigate('shop')" class="w-full text-right px-4 py-2.5 rounded-xl text-sm hover:bg-white/10 flex items-center gap-3 transition-colors" type="button">
                        <span class="text-lg">${cat.icon||''}</span>
                        <span>${cat.title}</span>
                      </button>
                    `).join('')}
                  </div>
                </div>
              </div>
            </nav>
            
            <!-- Actions -->
            <div class="flex items-center gap-2 lg:gap-4">
              <!-- Search toggle -->
              <button
                id="searchToggleBtn"
                onclick="toggleSearchBar()"
                class="p-2.5 lg:p-3 glass rounded-xl hover:bg-white/10"
                aria-label="جستجو"
                type="button"
              >
                🔍
              </button>

              <!-- Cart -->
              <button onclick="navigate('cart')" class="relative p-2.5 lg:p-3 glass rounded-xl hover:bg-white/10" aria-label="سبد خرید" type="button">
                🛒
                ${cartCount>0?`<span class="absolute -top-1 -right-1 gpt5-badge">${cartCount>99?'99+':cartCount}</span>`:''}
              </button>

              <!-- Profile / Admin -->
              ${state.user?`
                <button onclick="navigate('profile')" class="p-2.5 lg:p-3 glass rounded-xl hover:bg-white/10" aria-label="پروفایل" type="button">👤</button>

                <button onclick="logout()" class="hidden lg:flex items-center gap-2 px-5 py-2.5 glass rounded-xl text-rose-400 hover:bg-rose-500/10" type="button">خروج</button>
              `:`
                <button onclick="navigate('login')" class="btn-primary px-4 lg:px-6 py-2 rounded-xl" type="button">ورود</button>
              `}

              <!-- Hamburger (mobile/tablet) -->
              <button onclick="toggleMenu()" class="lg:hidden p-2.5 glass rounded-xl hover:bg-white/10" aria-label="منو" type="button">
                ☰
              </button>
            </div>
          </div>
        </div>

        <!-- Floating Search (بدون رندر مجدد) -->
        <div class="gpt5-search-wrap">
          <div class="gpt5-search-shell">
            <div class="gpt5-search">
              <div class="gpt5-search-inner">
                <span class="gpt5-search-icon">🔍</span>
                <input
                  id="header-search"
                  type="text"
                  placeholder="جستجوی محصولات..."
                  class="gpt5-search-input"
                  onkeydown="handleSearchKey(event)"
                >
                <button
                  class="gpt5-search-btn"
                  onclick="applySearch()"
                  type="button"
                >
                  جستجو
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Mobile/Tablet Sidebar (همیشه در DOM، فقط کلاس open) -->
      <div id="mobileMenu" class="mobile-menu">
        <div class="gpt5-drawer gpt5-drawer-w ml-auto h-full p-5 sm:p-6 flex flex-col gap-2">
          <div class="flex items-center justify-between mb-3 sm:mb-4">
            <span class="font-bold text-white text-base sm:text-lg">${config.store_name}</span>
            <button onclick="toggleMenu()" class="p-2 rounded-lg hover:bg-white/10 text-white/90" aria-label="بستن" type="button">✕</button>
          </div>

          <button onclick="navigate('home'); toggleMenu();" class="gpt5-drawer-link" type="button">خانه</button>
          <button onclick="navigate('shop'); toggleMenu();" class="gpt5-drawer-link" type="button">فروشگاه</button>

          <div class="mt-1">
            <button onclick="toggleSidebarCategories()" class="gpt5-drawer-link flex items-center justify-between" type="button">
              <span>دسته‌بندی‌ها</span>
              <span>▼</span>
            </button>
            <div id="mobileCats" class="gpt5-dd">
              <div class="gpt5-dd-inner">
                ${(state.categories || []).map(cat => `
                  <button onclick="state.productFilter.category='${cat.id}'; navigate('shop'); toggleMenu();" class="gpt5-dd-item" type="button">${cat.title}</button>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="mt-3 border-t border-white/10"></div>

          <div class="flex items-center gap-2 mt-3">
            <button onclick="toggleSearchBar(); toggleMenu();" class="gpt5-drawer-link" style="width:auto;" type="button">🔍 جستجو</button>
            ${state.user?`
              <button onclick="navigate('profile'); toggleMenu();" class="gpt5-drawer-link" style="width:auto;" type="button">👤 پروفایل</button>

            `:''}
          </div>
        </div>

        <button onclick="toggleMenu()" class="flex-1 bg-black/40" aria-label="بستن" type="button"></button>
      </div>
    `;

    return headerHTML;
  }

  window.renderHeader = renderHeader;
  window.navigate = navigate;
  window.toggleMenu = toggleMenu;
  window.toggleSidebarCategories = toggleSidebarCategories;
  window.toggleSearchBar = toggleSearchBar;
  window.applySearch = applySearch;
  window.handleSearchKey = handleSearchKey;
})();

// ═══════════════════════════════════════════════════════════════
// FOOTER COMPONENT
// File: assets/js/footer component.js
// ═══════════════════════════════════════════════════════════════
(function () {
  function navigate(page) {
    goTo(page);
    setTimeout(() => {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
    }, 0);
  }

  // سال شمسی دقیق
  function getShamsiYear() {
    return new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric' })
      .format(new Date());
  }

  function renderFooter() {
    const currentYear = getShamsiYear();

    // اگر trustBadges تعریف نشده بود، یک آرایه خالی باشد
    const badges = Array.isArray(window.trustBadges) ? window.trustBadges : [];

    return `
      <footer class="glass border-t border-white/5 mt-16" aria-label="پاورقی سایت">
        <div class="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            
            <!-- Brand -->
            <div class="col-span-2 md:col-span-1">
              <div class="flex items-center gap-3 mb-4">
                <img src="assets/img/logo/logo.png" alt="Logo" class="w-10 h-10 object-contain">
                <span class="font-black text-xl gradient-text">${config.store_name}</span>
              </div>
              <p class="text-white/60 text-sm leading-relaxed mb-6">
                ${config.hero_subtitle}
              </p>
              <div class="flex items-center justify-center gap-6 mt-6">
                <a href="${socialLinks?.instagram || '#'}" target="_blank" class="transition hover:opacity-80">
                  <img src="assets/img/logo/instagram.png" alt="Instagram" class="w-7 h-7 object-contain">
                </a>
                <a href="${socialLinks?.telegram || '#'}" target="_blank" class="transition hover:opacity-80">
                  <img src="assets/img/logo/telegram.png" alt="Telegram" class="w-7 h-7 object-contain">
                </a>
                <a href="${socialLinks?.whatsapp || '#'}" target="_blank" class="transition hover:opacity-80">
                  <img src="assets/img/logo/whatsapp.png" alt="WhatsApp" class="w-7 h-7 object-contain">
                </a>
              </div>
            </div>
            
            <!-- Quick Links -->
            <div>
              <h4 class="font-bold text-sm mb-5">دسترسی سریع</h4>
              <ul class="space-y-3">
                <li><button onclick="navigate('home')" class="text-white/60 hover:text-white text-sm transition-colors" type="button">صفحه اصلی</button></li>
                <li><button onclick="navigate('shop')" class="text-white/60 hover:text-white text-sm transition-colors" type="button">فروشگاه</button></li>
                <li><button onclick="navigate('cart')" class="text-white/60 hover:text-white text-sm transition-colors" type="button">سبد خرید</button></li>
              </ul>
            </div>
            
            <!-- Categories -->
            <div>
              <h4 class="font-bold text-sm mb-5">دسته‌بندی‌ها</h4>
              <ul class="space-y-3">
                ${(state.categories || []).slice(0, 4).map(cat => `
                  <li>
                    <button 
                      onclick="state.productFilter.category='${cat.id}'; navigate('shop')" 
                      class="text-white/60 hover:text-white text-sm transition-colors"
                      type="button"
                    >
                      ${cat.title}
                    </button>
                  </li>
                `).join('')}
              </ul>
            </div>
            
            <!-- Contact -->
            <div>
              <h4 class="font-bold text-sm mb-5">ارتباط با ما</h4>
              <ul class="space-y-3 text-white/60 text-sm">
                <li class="flex items-center gap-2"><span aria-hidden="true">📞</span><span class="font-mono" dir="ltr">۰۲۱-۱۲۳۴۵۶۸</span></li>
                <li class="flex items-center gap-2"><span aria-hidden="true">📧</span><span>info@premium-shop.ir</span></li>
                <li class="flex items-center gap-2"><span aria-hidden="true">📍</span><span>تهران، ایران</span></li>
                <li class="flex items-center gap-2"><span aria-hidden="true">⏰</span><span>شنبه تا پنج‌شنبه ۹-۱۸</span></li>
              </ul>
            </div>
          </div>
          
          <!-- Bottom Bar -->
          <div class="border-t border-white/10 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p class="text-white/40 text-xs text-center md:text-right">
              © ${currentYear} ${config.store_name} - تمامی حقوق محفوظ است
            </p>
            <div class="flex flex-wrap items-center gap-3">
              ${badges.length === 0
                ? `
                <div class="flex flex-wrap items-center gap-3">
                  ${trustBadges.map(b => `
                    <img 
                      src="${b.img}" 
                      alt="${b.alt}" 
                      class="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 object-contain rounded-lg glass p-1"
                    >
                  `).join('')}
                </div>
                `
                : badges.map(b => `
                  <img 
                    src="${b.img}" 
                    alt="${b.alt || ''}" 
                    class="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 object-contain rounded-lg glass p-1"
                  >
                `).join('')}
            </div>
          </div>
        </div>

        <!-- Google Map -->
        <div class="mt-6">
          <div class="rounded-2xl overflow-hidden glass" style="height:200px;">
            <iframe
              title="موقعیت فروشگاه روی نقشه"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d809.7641054083018!2d51.503209039672846!3d35.72483089176731!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3f8e034310ea73a5%3A0xa0c3fb28da93acf6!2sSquare%202!5e0!3m2!1sen!2s!4v1769885074544!5m2!1sen!2s"
              width="100%" height="100%" style="border:0;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade">
            </iframe>
          </div>
        </div>

        <!-- Back-to-top button -->
        <div class="fixed bottom-6 left-6 z-[60]">
          <button onclick="window.scrollTo({ top: 0, behavior: 'smooth' })"
            class="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 ring-1 ring-white/10 shadow-2xl hover:bg-white/20 transition-all flex items-center justify-center text-xl"
            aria-label="برو به بالا" title="برو به بالا" type="button">⬆️</button>
        </div>
      </footer>
    `;
  }

  window.renderFooter = renderFooter;
  window.navigate = navigate;
})();

// ═══════════════════════════════════════════════════════════════
// PRODUCT CARD COMPONENT (نسخه اصلاح شده)
// File: assets/js/product card component.js
// ═══════════════════════════════════════════════════════════════

function renderProductCard(product, index = 0) {
  const inStock = (product.stock || 0) > 0;
  const discount = utils.calculateDiscount(product.original_price, product.price);
  const isNew = new Date() - new Date(product.created_at) < 7 * 24 * 60 * 60 * 1000;
  
  // === تشخیص هوشمند تصویر محصول (مهمترین بخش) ===
  const getProductImage = (product) => {
    // بررسی تمام فیلدهای احتمالی
    if (product.image) return product.image;
    if (product.main_image) return product.main_image;
    if (product.mainImage) return product.mainImage;
    if (product.images && product.images.length > 0) return product.images[0];
    if (product.gallery && product.gallery.length > 0) return product.gallery[0];
    if (product.thumbnail) return product.thumbnail;
    if (product.picture) return product.picture;
    
    // اگر هیچ کدام نبود، خالی برگردان
    return '';
  };

  const productImage = getProductImage(product);
  
  return `
    <article class="glass rounded-2xl lg:rounded-3xl overflow-hidden card animate-fade" style="animation-delay: ${index * 0.08}s">
      
      <!-- Product Image با مدیریت خطا -->
      <div 
        class="product-image aspect-square flex items-center justify-center text-6xl lg:text-8xl cursor-pointer relative bg-gradient-to-br from-violet-500/10 to-purple-600/10"
        onclick="state.selectedProduct = state.products.find(p => p.id === '${product.id}'); goTo('product')"
      >
        ${productImage ? `
          <img 
            src="${productImage}" 
            alt="${product.title || 'محصول'}"
            class="w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
            onload="this.style.opacity='1'"
            style="opacity:0"
            onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'text-6xl lg:text-8xl\\'>📦</div>'; this.parentElement.classList.add('no-image')"
          >
        ` : `
          <div class="text-6xl lg:text-8xl">📦</div>
        `}
        
        <!-- Badges -->
        <div class="absolute top-3 right-3 flex flex-col gap-2">
          ${discount > 0 ? `<span class="badge badge-discount">${discount}% تخفیف</span>` : ''}
          ${isNew ? `<span class="badge badge-new">جدید</span>` : ''}
        </div>
        
        <!-- Out of Stock Overlay -->
        ${!inStock ? `
          <div class="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
            <span class="bg-rose-500/90 text-white px-5 py-2 rounded-full text-sm font-bold">ناموجود</span>
          </div>
        ` : ''}
      </div>
      
      <!-- Product Info -->
      <div class="p-4 lg:p-5">
        ${product.category ? `
          <span class="text-[10px] lg:text-xs text-violet-400 font-medium mb-2 block">
            ${state.categories.find(c => c.id === product.category)?.title || product.category}
          </span>
        ` : ''}
        
        <h3 class="font-bold text-sm lg:text-base mb-2 line-clamp-2 min-h-[2.5rem] lg:min-h-[3rem]">
          ${product.title || 'بدون عنوان'}
        </h3>
        
        <div class="flex items-center gap-2 mb-3">
          <div class="flex">${utils.renderStars(product.rating, 'text-xs')}</div>
          <span class="text-white/40 text-xs">(${product.sales || 0})</span>
        </div>
        
        <div class="flex items-center justify-between mb-4">
          <div>
            <span class="text-base lg:text-lg font-bold text-emerald-400">${utils.formatPrice(product.price)}</span>
            ${product.original_price && product.original_price > product.price ? `
              <span class="block text-xs price-original">${utils.formatPrice(product.original_price)}</span>
            ` : ''}
          </div>
          <span class="text-xs ${inStock ? 'text-emerald-400' : 'text-rose-400'}">
            ${inStock ? `موجود: ${product.stock}` : 'ناموجود'}
          </span>
        </div>
        
        <button 
          onclick="event.stopPropagation(); addToCart(state.products.find(p => p.id === '${product.id}'))"
          ${!inStock ? 'disabled' : ''}
          class="w-full btn-primary py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
        >
          <span>🛒</span>
          <span>افزودن به سبد</span>
        </button>
      </div>
    </article>
  `;
}