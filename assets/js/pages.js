// ── اسکیپ محتوای کاربر پیش از درج در HTML (ضد XSS) ──
function aryEsc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
window.aryEsc = window.aryEsc || aryEsc;

// ═══════════════════════════════════════════════════════════════
// HOME PAGE (ری‌دیزاین‌شده - همان استایل سایت با انیمیشن و جزئیات بیشتر)
// File: assets/js/pages.js
// ═══════════════════════════════════════════════════════════════

// زمان پایان پیشنهادهای ویژه امروز (تا پایان روز جاری) — فقط یک‌بار محاسبه می‌شود
function getHomeDealsDeadline() {
  if (!state.homeDealsEndsAt) {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    state.homeDealsEndsAt = end.getTime();
  }
  return state.homeDealsEndsAt;
}

function formatCountdownPart(n) {
  return String(Math.max(0, n)).padStart(2, '0');
}

function renderHomeCountdownHTML() {
  const remaining = Math.max(0, getHomeDealsDeadline() - Date.now());
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return `
    <span class="bg-black/30 rounded-lg px-2 py-1 font-mono">${formatCountdownPart(h)}</span>
    <span class="opacity-60">:</span>
    <span class="bg-black/30 rounded-lg px-2 py-1 font-mono">${formatCountdownPart(m)}</span>
    <span class="opacity-60">:</span>
    <span class="bg-black/30 rounded-lg px-2 py-1 font-mono">${formatCountdownPart(s)}</span>
  `;
}

function startHomeCountdownTimer() {
  if (state._homeCountdownInterval) {
    clearInterval(state._homeCountdownInterval);
    state._homeCountdownInterval = null;
  }
  const el = document.getElementById('home-deals-countdown');
  if (!el) return; // این بخش در صفحه فعلی وجود ندارد
  state._homeCountdownInterval = setInterval(() => {
    const target = document.getElementById('home-deals-countdown');
    if (!target) {
      clearInterval(state._homeCountdownInterval);
      state._homeCountdownInterval = null;
      return;
    }
    target.innerHTML = renderHomeCountdownHTML();
  }, 1000);
}
window.startHomeCountdownTimer = startHomeCountdownTimer;

// درصد «فروخته‌شده» برای نوار فوریت (بر اساس نسبت فروش به موجودی، با کف مشخص برای جذابیت بصری)
function estimateSoldPercent(p) {
  const sold = Number(p.sales) || 0;
  const stock = Number(p.stock) || 0;
  const total = sold + stock;
  if (total <= 0) return 35;
  const pct = Math.round((sold / total) * 100);
  return Math.min(96, Math.max(18, pct));
}

function scrollDealsCarousel(dir) {
  const el = document.getElementById('home-deals-track');
  if (!el) return;
  el.scrollBy({ left: dir * 320, behavior: 'smooth' });
}
window.scrollDealsCarousel = scrollDealsCarousel;

function renderHomePage() {
  const IMAGE_BASE = 'assets/img/photo/';

  const discountedProducts = (state.products || [])
    .filter(p => p.original_price && p.original_price > p.price)
    .sort((a, b) => (utils.calculateDiscount(b.original_price, b.price) || 0) - (utils.calculateDiscount(a.original_price, a.price) || 0));
  // اگر تخفیف‌دارها کمتر از ۱۰ تا بودند، با پرفروش‌ها پر می‌شود — سقف ۱۰ کارت
  const _notDeals = (state.products || []).filter(p => !discountedProducts.includes(p))
    .sort((a, b) => estimateSoldPercent(b) - estimateSoldPercent(a));
  const dealsList = discountedProducts.slice(0, 10)
    .concat(discountedProducts.length < 10 ? _notDeals.slice(0, 10 - discountedProducts.length) : []);
  const hasMoreDeals = (state.products || []).length > dealsList.length;

  const aboutBlocks = Array.isArray(state.aboutBlocks)
    ? state.aboutBlocks
    : [
        {
          id: 'about1',
          title: 'مجموعه آکسیاسافت',
          text: 'ما در آکسیاسافت روی ساخت فروشگاه‌های مدرن، سریع و امن تمرکز کرده‌ایم تا تجربه خرید لذت‌بخشی بسازیم.',
          image: 'p1.png'
        },
        {
          id: 'about2',
          title: 'تجربه کاربری ممتاز',
          text: 'طراحی رابط کاربری و تجربه کاربری در اولویت ماست تا کاربران بدون سردرگمی به هدف خود برسند.',
          image: 'p2.png'
        },
        {
          id: 'about3',
          title: 'پشتیبانی و توسعه مداوم',
          text: 'سیستم‌ها به صورت مداوم به‌روزرسانی می‌شوند تا همیشه در بالاترین سطح کیفیت و امنیت باقی بمانند.',
          image: 'p3.png'
        }
      ];

  const heroSlides = (window.aryHeroSlides || []).filter(sl => sl && sl.img);
  const slidesHtml = heroSlides.map((sl, i) =>
    `<div class="ary-hero-slide ${i === 0 ? 'is-on' : ''}" data-idx="${i}" style="background-image:url('${sl.img}')"></div>`
  ).join('');

  setTimeout(() => { try { setupHomeHeroSlider(); } catch (e) {} }, 0);
  setTimeout(startHomeCountdownTimer, 0);

  return `
    ${renderHeader()}
    
    <main class="overflow-x-hidden">
      
      <!-- Hero Slider -->
      <section class="relative overflow-hidden">
        <div id="home-hero" class="bg-hero-gradient ary-hero py-20 lg:py-32 rounded-b-[4rem] lg:rounded-b-[6rem] relative">
          ${slidesHtml}
          <div class="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/40 to-slate-950/75 z-[1]"></div>

          <!-- عناصر تزئینی شناور -->
          <div class="absolute -top-10 right-10 w-40 h-40 rounded-full bg-white/10 blur-3xl animate-float" style="animation-duration:6s"></div>
          <div class="absolute bottom-0 left-10 w-56 h-56 rounded-full bg-blue-400/10 blur-3xl animate-float" style="animation-duration:8s;animation-delay:1s"></div>
          <div class="absolute top-1/3 left-1/4 w-24 h-24 rounded-full bg-cyan-300/10 blur-2xl animate-pulse-slow"></div>

          <div class="max-w-7xl mx-auto px-4 lg:px-8 text-center relative z-10">
            <div class="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-xs lg:text-sm mb-6 animate-fade-up">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>فروشگاه آنلاین معتبر و امن</span>
            </div>

            <h1 class="text-4xl md:text-5xl lg:text-7xl font-black mb-6 animate-fade-up">
              ${config.hero_title}
            </h1>

            <p class="text-lg lg:text-xl text-white/90 mb-10 max-w-2xl mx-auto animate-fade-up" style="animation-delay:0.1s">
              ${config.hero_subtitle}
            </p>

            <div class="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style="animation-delay:0.2s">
              <button onclick="goTo('shop')" class="btn-primary px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-3 hover:scale-105 transition-transform">
                <span class="inline-flex">${aryIcon('bag','w-6 h-6')}</span>
                <span>شروع خرید</span>
              </button>
            </div>

            <div class="flex flex-wrap items-center justify-center gap-3 lg:gap-6 mt-10 animate-fade-up" style="animation-delay:0.3s">
              <div class="flex items-center gap-2 text-white/80 text-xs lg:text-sm">
                <span class="text-sky-300 inline-flex">${aryIcon('truck','w-5 h-5')}</span><span>ارسال سریع سراسری</span>
              </div>
              <span class="w-1 h-1 rounded-full bg-white/30 hidden sm:block"></span>
              <div class="flex items-center gap-2 text-white/80 text-xs lg:text-sm">
                <span class="text-emerald-300 inline-flex">${aryIcon('lock','w-5 h-5')}</span><span>پرداخت ۱۰۰٪ امن</span>
              </div>
              <span class="w-1 h-1 rounded-full bg-white/30 hidden sm:block"></span>
              <div class="flex items-center gap-2 text-white/80 text-xs lg:text-sm">
                <span class="text-amber-300 inline-flex">${aryIcon('star','w-5 h-5 fill-current')}</span><span>رضایت مشتریان</span>
              </div>
            </div>
          </div>
          ${heroSlides.length > 1 ? `<div class="ary-hero-dots">${heroSlides.map((sl, i) => `<button type="button" aria-label="اسلاید ${i + 1}" class="${i === 0 ? 'on' : ''}" onclick="window.aryHeroGo && window.aryHeroGo(${i})"></button>`).join('')}</div>` : ''}
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="py-8 lg:py-12">
        <div class="max-w-7xl mx-auto px-4 lg:px-8">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">

            ${[
              { icon: 'truck',     tint: 'text-sky-300',   title: 'ارسال رایگان', desc: 'سفارش بالای ۵۰۰ هزار' },
              { icon: 'shield',    tint: 'text-emerald-300', title: 'ضمانت اصالت', desc: 'تضمین کیفیت کالا' },
              { icon: 'card',      tint: 'text-blue-300', title: 'پرداخت امن', desc: 'درگاه معتبر بانکی' },
              { icon: 'chat',      tint: 'text-amber-300',  title: 'پشتیبانی ۲۴/۷', desc: 'همیشه در کنار شما' },
            ].map((f, i) => `
              <div class="glass rounded-2xl p-5 lg:p-7 text-center card group animate-fade" style="animation-delay:${i * 0.1}s">
                <div class="mb-3 inline-flex p-3 rounded-2xl bg-white/5 ${f.tint} transition-transform duration-300 group-hover:scale-110">${aryIcon(f.icon, 'w-7 h-7 lg:w-9 lg:h-9')}</div>
                <h3 class="font-bold text-sm lg:text-base mb-1">${f.title}</h3>
                <p class="text-white/50 text-xs lg:text-sm">${f.desc}</p>
              </div>
            `).join('')}

          </div>
        </div>
      </section>

      <!-- Categories Section -->
      <section class="py-12 lg:py-16">
        <div class="max-w-7xl mx-auto px-4 lg:px-8">

          <div class="text-center mb-10 animate-fade-up">
            <h2 class="text-2xl lg:text-3xl font-black mb-3">دسته‌بندی محصولات</h2>
            <p class="text-white/60">انتخاب بر اساس نیاز شما</p>
          </div>

          <div class="grid grid-cols-3 md:grid-cols-6 gap-4">
            ${(state.categories || [])
              .map(
                (cat, i) => `
              <button 
                onclick="state.productFilter.category='${aryEsc(String(cat.id))}'; goTo('shop')"
                class="glass rounded-2xl p-5 lg:p-6 text-center card animate-fade hover:shadow-lg hover:shadow-blue-500/10 transition-shadow group"
                style="animation-delay:${i * 0.06}s"
              >
                <div class="mb-2 inline-flex text-blue-300 transition-transform group-hover:scale-110">${aryCatIcon(cat, 'w-6 h-6 lg:w-8 lg:h-8')}</div>
                <h3 class="font-semibold text-xs lg:text-sm">${aryEsc(cat.title)}</h3>
              </button>
            `
              )
              .join('')}
          </div>

        </div>
      </section>

      <!-- شگفت‌انگیزها — اسلایدر افقی (حداکثر ۱۰ کارت؛ ارتفاع ثابت، بدون کش‌آمدن صفحه) -->
      ${dealsList.length > 0 ? `
      <section class="py-12 lg:py-16">
        <div class="max-w-7xl mx-auto px-4 lg:px-8">
          <div class="relative overflow-hidden rounded-[2rem] bg-gradient-to-l from-rose-600 via-pink-600 to-blue-700 p-5 lg:p-8 shadow-2xl shadow-rose-500/15">
            <div class="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-white/10 blur-2xl animate-pulse-slow"></div>
            <div class="absolute -bottom-16 -right-10 w-52 h-52 rounded-full bg-amber-300/10 blur-3xl"></div>

            <div class="relative flex flex-wrap items-center justify-between gap-3 mb-6">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white shadow-lg">${aryIcon('bolt','w-6 h-6')}</div>
                <div>
                  <h2 class="text-lg lg:text-2xl font-black leading-tight">${discountedProducts.length ? 'شگفت‌انگیزهای امروز' : 'پرفروش‌ترین‌های فروشگاه'}</h2>
                  <p class="text-white/75 text-[11px] lg:text-sm">${discountedProducts.length ? 'فقط تا پایان امشب — تعداد محدود، از دست نده!' : 'محبوب‌ترین انتخاب مشتریان آریا'}</p>
                </div>
              </div>
              <div class="flex items-center gap-2 lg:gap-3">
                ${discountedProducts.length ? `<div class="flex items-center gap-1 text-white text-xs lg:text-base" id="home-deals-countdown">${renderHomeCountdownHTML()}</div>` : ''}
                <div class="flex items-center gap-1.5">
                  <button type="button" onclick="aryDealsScroll(-1)" aria-label="قبلی" class="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors rotate-180">${aryIcon('arrowleft','w-4 h-4')}</button>
                  <button type="button" onclick="aryDealsScroll(1)" aria-label="بعدی" class="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors">${aryIcon('arrowleft','w-4 h-4')}</button>
                </div>
                ${hasMoreDeals ? `<button onclick="goTo('shop'); setTimeout(()=>utils.scrollTop(),0)" class="text-[11px] lg:text-xs font-black bg-white text-rose-600 hover:bg-rose-50 px-3.5 py-2 rounded-xl transition-colors shadow-lg">مشاهده بیشتر</button>` : ''}
              </div>
            </div>

            <div id="home-deals-slider" class="ary-hscroll flex gap-3 lg:gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
              ${dealsList
                .map((p, i) => {
                  const discount = utils.calculateDiscount(p.original_price, p.price);
                  const soldPct = estimateSoldPercent(p);
                  const img = p.image || p.main_image || (p.images && p.images[0]) || '';
                  return `
                <div class="snap-start shrink-0 w-[68%] sm:w-[46%] md:w-[31.5%] lg:w-[24.5%] xl:w-[19.8%] min-w-0">
                  <div
                    class="group rounded-2xl bg-white/10 backdrop-blur p-2.5 lg:p-3 transition-all duration-300 hover:bg-white/20 hover:-translate-y-1 cursor-pointer h-full flex flex-col"
                    onclick="openProductById('${aryEsc(String(p.id))}')"
                  >
                    <div class="relative aspect-square rounded-xl overflow-hidden bg-slate-950/25 mb-2">
                      ${img
                        ? `<img src="${img}" alt="" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy">`
                        : `<div class="w-full h-full flex items-center justify-center text-white/30">${aryIcon('box','w-10 h-10')}</div>`}
                      ${discount > 0 ? `<span class="absolute top-1.5 right-1.5 bg-white text-rose-600 text-[10px] lg:text-xs font-black px-1.5 py-0.5 rounded-lg shadow">${discount}٪−</span>` : ''}
                    </div>
                    <h3 class="text-[11px] lg:text-xs font-bold line-clamp-2 leading-5 min-h-[2.4rem]">${aryEsc(p.title)}</h3>
                    <div class="mt-auto pt-1">
                      ${p.original_price > p.price ? `<div class="text-white/45 text-[10px] line-through">${utils.formatPrice(p.original_price)}</div>` : ''}
                      <div class="text-emerald-300 font-black text-xs lg:text-sm">${utils.formatPrice(p.price)}<span class="text-[9px] font-normal opacity-75">تومان</span></div>
                    </div>
                    <div class="h-1.5 bg-white/15 rounded-full overflow-hidden mt-2"><div class="h-full bg-gradient-to-r from-amber-300 to-rose-400 rounded-full" style="width:${soldPct}%"></div></div>
                    <div class="flex items-center justify-between gap-1 mt-1.5">
                      <p class="text-[9px] lg:text-[10px] text-white/55">${soldPct}٪ فروخته شده</p>
                      <button type="button" class="inline-flex items-center gap-1 text-[10px] font-black bg-white text-rose-600 rounded-lg px-2 py-1.5 hover:bg-rose-50 transition-colors shadow" onclick="event.stopPropagation(); addToCartById('${aryEsc(String(p.id))}')">${aryIcon('cart','w-3.5 h-3.5')}افزودن</button>
                    </div>
                  </div>
                </div>`;
                })
                .join('')}
            </div>
          </div>
        </div>
      </section>
      ` : ''}

      <!-- About Section -->
      <section class="py-16 lg:py-24">
        <div class="max-w-7xl mx-auto px-4 lg:px-8">

          <h2 class="text-2xl lg:text-3xl font-black text-center mb-12 animate-fade-up">معرفی مجموعه</h2>

          <div class="space-y-20">
            ${aboutBlocks
              .map(
                (b, i) => `
              <div class="grid grid-cols-1 md:grid-cols-2 gap-10 items-center animate-fade" style="animation-delay:${i * 0.1}s">

                <div class="relative about-image-wrapper flex justify-center ${i % 2 === 1 ? 'md:order-2' : ''}">
                  <div class="about-3d-square square-sky w-24 h-24 -top-6 -left-6"></div>
                  <div class="about-3d-square square-red w-28 h-28 -bottom-6 -right-6"></div>

                  <div class="w-56 h-56 lg:w-72 lg:h-72 rounded-3xl overflow-hidden shadow-2xl relative z-10 transition-transform duration-500 hover:scale-[1.03]">
                    <img src="${IMAGE_BASE + b.image}" class="w-full h-full object-cover">
                  </div>
                </div>

                <div class="text-right ${i % 2 === 1 ? 'md:order-1' : ''}">
                  <h3 class="text-xl lg:text-2xl font-black mb-4">${b.title}</h3>
                  <p class="text-white/70 leading-relaxed">${aryEsc(b.text)}</p>
                </div>

              </div>
            `
              )
              .join('')}
          </div>

        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-16 lg:py-24">
        <div class="max-w-7xl mx-auto px-4 lg:px-8">

          <div class="bg-hero-gradient rounded-3xl lg:rounded-[2.5rem] p-10 lg:p-20 text-center relative overflow-hidden">
            <div class="ary-cta-banner" style="background-image:url('assets/img/home/cta-banner.jpg')"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/45 to-slate-950/70"></div>
            <div class="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-float" style="animation-duration:7s"></div>

            <div class="relative z-10">
              <h2 class="text-3xl lg:text-5xl font-black mb-5">همین الان خرید کنید!</h2>
              <p class="text-lg lg:text-xl text-white/90 mb-10 max-w-xl mx-auto">
                از تخفیف‌های استثنایی و ارسال رایگان بهره‌مند شوید
              </p>

              <button onclick="goTo('shop')" class="btn-ghost bg-white/10 hover:bg-white/20 px-10 py-5 rounded-2xl font-bold text-lg hover:scale-105 transition-transform inline-flex items-center gap-2 mx-auto">
                ${aryIcon('bag','w-5 h-5')}<span>رفتن به فروشگاه</span>
              </button>
            </div>

          </div>

        </div>
      </section>

    </main>

    ${renderFooter()}
  `;
}


// ═══════════════════════════════════════════════════════════════
// USER AUTH SYSTEM — Email/Phone + Password
// ═══════════════════════════════════════════════════════════════

// ── اسلایدر هیرو صفحهٔ اصلی: autoplay + dots + توقف روی hover ──
window._aryHero = window._aryHero || { i: 0, timer: null, paused: false };
function setupHomeHeroSlider() {
  const root = document.getElementById('home-hero');
  const H = window._aryHero;
  const slides = root ? Array.from(root.querySelectorAll('.ary-hero-slide')) : [];
  const dots = root && root.parentElement ? Array.from(root.parentElement.querySelectorAll('.ary-hero-dots button')) : [];
  if (H.timer) { clearInterval(H.timer); H.timer = null; }
  if (slides.length < 2) return;
  H.i = 0;
  window.aryHeroGo = function (i) {
    H.i = ((i % slides.length) + slides.length) % slides.length;
    slides.forEach((el, k) => el.classList.toggle('is-on', k === H.i));
    dots.forEach((el, k) => el.classList.toggle('on', k === H.i));
  };
  if (root.parentElement) {
    root.parentElement.onmouseenter = () => { H.paused = true; };
    root.parentElement.onmouseleave = () => { H.paused = false; };
  }
  H.timer = setInterval(() => { if (!H.paused && window.aryHeroGo) window.aryHeroGo(H.i + 1); }, 6000);
}
window.setupHomeHeroSlider = setupHomeHeroSlider;

// ── سوییچ تب پروفایل بدون پرش اسکرول ──
function switchProfileTab(id) {
  if (state.profileTab === id) return;
  const y = window.scrollY || 0;
  state.profileTab = id;
  if (window.AppState) AppState.set({ profileTab: id });
  else if (typeof render === 'function') render();
  setTimeout(() => window.scrollTo(0, y), 40);
  setTimeout(() => window.scrollTo(0, y), 140);
}
window.switchProfileTab = switchProfileTab;

// ── اسکرول افقی با موس: چرخ‌دنده بدون کلیک + کشیدن با کلیک چپ (روی همهٔ .ary-hscroll) ──
(function aryHscrollEnhancer() {
  let drag = null;
  const isRtl = el => (getComputedStyle(el).direction || '') === 'rtl';
  document.addEventListener('wheel', function (e) {
    const el = e.target && e.target.closest ? e.target.closest('.ary-hscroll') : null;
    if (!el || el.scrollWidth <= el.clientWidth + 4) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.preventDefault();
    el.scrollLeft += (isRtl(el) ? -1 : 1) * e.deltaY;
  }, { passive: false });
  document.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    const el = e.target && e.target.closest ? e.target.closest('.ary-hscroll') : null;
    if (!el || el.scrollWidth <= el.clientWidth + 4) return;
    drag = { el, x0: e.clientX, l0: el.scrollLeft, rtl: isRtl(el), moved: false };
    el.classList.add('dragging');
  });
  window.addEventListener('mousemove', function (e) {
    if (!drag) return;
    const dx = e.clientX - drag.x0;
    if (!drag.moved && Math.abs(dx) > 5) drag.moved = true;
    if (drag.moved) {
      e.preventDefault();
      drag.el.scrollLeft = drag.rtl ? drag.l0 + dx : drag.l0 - dx;
    }
  });
  window.addEventListener('mouseup', function () {
    if (!drag) return;
    const moved = drag.moved, el = drag.el;
    drag = null;
    el.classList.remove('dragging');
    if (moved) { // کلیکِ بعد از درگ (انتخاب محصول) خنثی شود
      const h = function (ev) { document.removeEventListener('click', h, true); ev.stopPropagation(); ev.preventDefault(); };
      document.addEventListener('click', h, true);
      setTimeout(() => document.removeEventListener('click', h, true), 250);
    }
  });
})();

// ── دایرهٔ شناور پشتیبانی — گفتگوی اختصاصی و امن کاربر با ادمین (بر بستر تیکت) ──
window.AryaSupportChat = (function () {
  let root = null, isOpen = false, pollTimer = null, lastCount = -1;
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const u = () => (typeof state !== 'undefined' && (state.user || state.currentUser)) || null;
  function msgsOf(t) {
    if (Array.isArray(t.messages)) return t.messages;
    try { const p = JSON.parse(t.messages || '[]'); return Array.isArray(p) ? p : []; } catch (e) { return []; }
  }
  function myTickets() {
    const me = u(); if (!me) return [];
    const ph = String(me.phone || '');
    return (state.tickets || []).filter(t => ph && String(t.user_phone || '') === ph); // فقط تیکت‌های خودِ کاربر
  }
  async function pull() {
    const me = u(); if (!me || !me.phone) return;
    try {
      if (window.AryaServer && AryaServer.isConfigured && AryaServer.isConfigured()) {
        const r = await AryaServer.crud.getAll('tickets', { user_phone: String(me.phone) });
        if (r && r.ok && Array.isArray(r.data)) {
          state.tickets = r.data.map(x => {
            if (typeof x.messages === 'string') { try { x.messages = JSON.parse(x.messages); } catch (e) { x.messages = []; } }
            return x;
          });
          if (isOpen) paint();
          updateBadge();
        }
      }
    } catch (e) {}
  }
  function thread() {
    const ts = myTickets().slice().sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    const msgs = [];
    ts.slice(0, 3).forEach(t => {
      msgs.push({ sys: true, text: 'تیکت «' + (t.subject || 'پشتیبانی') + '» — وضعیت: ' + (t.status === 'open' ? 'باز' : (t.status === 'answered' ? 'پاسخ داده شده' : t.status)) });
      msgsOf(t).forEach(m => msgs.push(m));
    });
    msgs.sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')));
    return { tickets: ts, msgs };
  }
  function paint() {
    if (!root) return;
    const body = root.querySelector('#ary-chat-body');
    if (!body) return;
    const { tickets, msgs } = thread();
    body.innerHTML = msgs.length ? msgs.map(m => m.sys
      ? `<div class="text-center text-[10px] text-white/35 py-1">${esc(m.text)}</div>`
      : `<div class="flex ary-msg-in ${m.from === 'user' ? 'justify-end' : 'justify-start'}">
           <div class="${m.from === 'user' ? 'ary-chat-bubble-user text-white' : 'ary-chat-bubble-sup text-white/85'} max-w-[85%] px-3 py-2 text-[12px] leading-6">
             <p class="whitespace-pre-line break-words">${esc(m.text)}</p>
             <span class="block text-[9px] opacity-55 mt-0.5">${m.at ? new Date(m.at).toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : ''}</span>
           </div>
         </div>`).join('')
      : `<div class="h-full flex flex-col items-center justify-center text-center gap-2 text-white/45 px-6">
           <svg class="w-10 h-10 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
           <p class="text-xs leading-6">گفتگویی شروع نشده.<br>اولین پیام‌تان یک تیکت پشتیبانی می‌سازد و ادمین همین‌جا پاسخ می‌دهد.</p>
         </div>`;
    body.scrollTop = body.scrollHeight;
    const st = root.querySelector('#ary-chat-status');
    if (st) st.textContent = tickets.some(t => t.status === 'open') ? 'کارشناس پشتیبانی — آنلاین، پاسخ‌گویی تا ۴۸ ساعت' : 'تیکت‌های شما: ' + tickets.length;
  }
  function send(text) {
    const me = u();
    if (!me) { toast('برای گفتگو ابتدا وارد حساب شوید', 'warning'); close(); goTo('login'); return; }
    const clean = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 1200);
    if (clean.length < 3) { toast('پیام کوتاه‌تر از ۳ کاراکتر ارسال نمی‌شود', 'warning'); return; }
    const openT = myTickets().find(t => t.status === 'open');
    if (openT && typeof window.replyTicket === 'function') window.replyTicket(String(openT.id), clean);
    else if (typeof window.createTicketUser === 'function') window.createTicketUser({ subject: 'گفتگوی پشتیبانی آنلاین', message: clean, priority: 'normal' });
    const inp = root.querySelector('#ary-chat-input'); if (inp) { inp.value = ''; inp.focus(); }
    setTimeout(() => { pull(); paint(); }, 350);
  }
  function open() {
    const me = u();
    if (!me) { toast('گفتگوی پشتیبانی مخصوص کاربران ثبت‌نام‌شده است', 'info'); goTo('login'); return; }
    if (!root) {
      root = document.createElement('div');
      root.id = 'ary-chat-panel';
      root.className = 'fixed z-[81] inset-x-3 bottom-3 sm:inset-x-auto sm:right-5 sm:bottom-24 w-auto sm:w-96';
      root.innerHTML = `
        <div class="glass-strong rounded-3xl overflow-hidden border border-white/12 shadow-2xl" style="max-height:min(72vh,34rem)">
          <div class="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-l from-blue-700 via-blue-600 to-sky-600">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="relative w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                <span class="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0f1d3a]"></span>
              </span>
              <div class="min-w-0">
                <p class="text-sm font-bold text-white truncate">چت پشتیبانی آریا</p>
                <p id="ary-chat-status" class="text-[10px] text-white/65 truncate">اتصال امن — مخصوص حساب شما</p>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button type="button" id="ary-chat-new" title="ثبت تیکت جدید" class="w-8 h-8 rounded-full flex items-center justify-center text-white/75 hover:bg-white/15 transition-colors">
                <svg class="w-4.5 h-4.5 w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5h4a2 2 0 0 1 2 2v3"/><path d="M13.5 17.5 17.5 13.5a2.12 2.12 0 0 0-3-3L4 21l4-1Z"/><path d="M10 4H4a2 2 0 0 0-2 2v0"/></svg>
              </button>
              <button type="button" id="ary-chat-close" class="w-8 h-8 rounded-full flex items-center justify-center text-white/75 hover:bg-white/15 transition-colors" aria-label="بستن">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </div>
          <div id="ary-chat-body" class="p-3 space-y-2 overflow-y-auto bg-black/25" style="min-height:14rem;max-height:min(42vh,22rem)"></div>
          <form id="ary-chat-form" class="flex items-end gap-2 p-3 border-t border-white/10 bg-black/30">
            <textarea id="ary-chat-input" rows="1" maxlength="1200" placeholder="پیام خود را بنویسید… (Enter ارسال)" class="input-style flex-1 text-[12px] resize-none py-2.5" style="min-height:2.6rem;max-height:6rem"></textarea>
            <button type="submit" class="btn-primary w-10 h-10 rounded-xl flex items-center justify-center shrink-0" aria-label="ارسال">
              <svg class="w-4.5 h-4.5 w-5 h-5 rotate-180 ltr:rotate-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="transform:scaleX(-1)"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </button>
          </form>
          <p class="text-center text-[9px] text-white/30 pb-2">پیام‌ها از مسیر امن تیکت و فقط برای حساب شما ثبت و نمایش داده می‌شوند.</p>
        </div>`;
      document.body.appendChild(root);
      root.querySelector('#ary-chat-close').onclick = close;
      root.querySelector('#ary-chat-form').onsubmit = e => { e.preventDefault(); send(e.target.querySelector('#ary-chat-input').value); };
      const inpEl = root.querySelector('#ary-chat-input');
      inpEl.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e.target.value); } });
      root.querySelector('#ary-chat-new').onclick = () => { if (typeof window.openUserTicketModal === 'function') { close(); window.openUserTicketModal(); } };
    }
    root.style.display = '';
    root.classList.remove('ary-chat-open'); void root.offsetWidth; root.classList.add('ary-chat-open');
    isOpen = true;
    paint(); pull();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => { if (isOpen) pull(); }, 30000); // دریافت پاسخ‌های تازه
  }
  function close() {
    isOpen = false;
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (root) root.style.display = 'none';
  }
  function updateBadge() {
    const fab = document.getElementById('arya-support-fab');
    if (!fab) return;
    let badge = fab.querySelector('.ary-fab-badge');
    const n = u() ? myTickets().filter(t => t.status === 'answered').length : 0;
    if (n > 0) {
      if (!badge) { badge = document.createElement('span'); badge.className = 'ary-fab-badge'; const b = fab.querySelector('.ary-fab-btn'); if (b) b.appendChild(badge); }
      badge.textContent = n > 9 ? '۹+' : String(n);
    } else if (badge) badge.remove();
  }
  return { open, close, toggle: () => (isOpen ? close() : open()), updateBadge };
})();

// ساخت دکمهٔ شناور (خارج از ریشهٔ render تا با هر رندر از بین نرود)
(function mountSupportFab() {
  function build() {
    if (document.getElementById('arya-support-fab')) return;
    if (document.getElementById('admin-panel-screen') || /admin\.html/i.test(location.pathname)) return; // در پنل ادمین نمایش داده نشود
    const b = document.createElement('button');
    b.type = 'button';
    b.id = 'arya-support-fab';
    b.setAttribute('aria-label', 'چت پشتیبانی');
    b.innerHTML = `<span class="ary-fab-btn">
        <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
      </span>
      <span class="ary-fab-tip">چت با پشتیبانی</span>`;
    b.onclick = () => window.AryaSupportChat.toggle();
    document.body.appendChild(b);
    window.AryaSupportChat.updateBadge();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
  document.addEventListener('ary:rendered', () => window.AryaSupportChat.updateBadge());
})();

// ── پخش‌کنندهٔ ویدیو: مستقل از render — بدون پخش تکراری، سوییچ درست، پیش‌نمایش فریم اول ──
window.AryaVideoPlayer = (function () {
  let root = null, list = [], idx = 0, isOpen = false;
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function info(v) {
    if (typeof v === 'string') return { url: v, name: '' };
    if (v && typeof v === 'object') return { url: String(v.url || v.src || v.link || ''), name: String(v.name || v.title || '') };
    return { url: '', name: '' };
  }
  function ensure() {
    if (root) return;
    root = document.createElement('div');
    root.id = 'avp-root';
    root.className = 'fixed inset-0 z-[210] hidden items-center justify-center p-3 sm:p-6';
    root.style.background = 'rgba(0,0,0,.96)';
    root.innerHTML = '<div class="relative w-full max-w-5xl" id="avp-box"></div>';
    document.body.appendChild(root);
    root.addEventListener('mousedown', e => { if (e.target === root) API.close(); });
    document.addEventListener('keydown', e => {
      if (!isOpen) return;
      if (e.key === 'Escape') API.close();
      else if (e.key === 'ArrowLeft') API.step(1);
      else if (e.key === 'ArrowRight') API.step(-1);
    });
  }
  function paint() {
    const cur = info(list[idx]);
    const many = list.length > 1;
    root.querySelector('#avp-box').innerHTML = `
      <div class="flex items-center justify-between gap-3 mb-3 text-white px-1">
        <span class="text-sm text-white/75 truncate min-w-0">${esc(cur.name || ('ویدیو ' + (idx + 1)))}</span>
        <div class="flex items-center gap-3 shrink-0">
          ${many ? `<span class="text-xs bg-white/15 px-2.5 py-1 rounded-full tabular-nums">${idx + 1} / ${list.length}</span>` : ''}
          <button type="button" aria-label="بستن" id="avp-close" class="text-white/70 hover:text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      </div>
      <div class="relative bg-black rounded-2xl overflow-hidden shadow-2xl" style="aspect-ratio:16/9; max-height:74vh">
        <video id="avp-video" controls playsinline preload="metadata" class="w-full h-full object-contain" src="${esc(cur.url)}"></video>
        ${many ? `
        <button type="button" id="avp-prev" aria-label="ویدیو قبلی" class="absolute right-3 top-1/2 -translate-y-1/2 bg-black/55 hover:bg-black/85 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18 6-6-6-6"/></svg>
        </button>
        <button type="button" id="avp-next" aria-label="ویدیو بعدی" class="absolute left-3 top-1/2 -translate-y-1/2 bg-black/55 hover:bg-black/85 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18-6-6 6-6"/></svg>
        </button>` : ''}
      </div>
      ${many ? `
      <div id="avp-thumbs" class="ary-hscroll flex gap-2 overflow-x-auto mt-3 px-1 py-1">
        ${list.map((v, i) => {
          const it = info(v);
          return `
          <button type="button" data-i="${i}" class="avp-thumb shrink-0 w-28 sm:w-32 rounded-xl overflow-hidden border-2 transition-all ${i === idx ? 'border-blue-400 ring-2 ring-blue-400/30' : 'border-white/10 hover:border-white/40'}">
            <span class="relative block aspect-video bg-white/5">
              <video muted playsinline preload="metadata" src="${esc(it.url)}#t=0.9" tabindex="-1" class="absolute inset-0 w-full h-full object-cover pointer-events-none"></video>
              <span class="absolute inset-0 flex items-center justify-center text-white/40 pointer-events-none">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              </span>
              ${it.name ? '' : `<span class="absolute bottom-1 left-1 text-[9px] bg-black/60 rounded px-1">${i + 1}</span>`}
            </span>
            <span class="block text-[10px] text-white/70 truncate px-1.5 py-1">${esc(it.name || ('ویدیو ' + (i + 1)))}</span>
          </button>`;
        }).join('')}
      </div>` : ''}
    `;
    const box = root.querySelector('#avp-box');
    const v = box.querySelector('#avp-video');
    if (v) v.play().catch(() => {}); // تنها همین یک‌بار، بدون autoplayِ HTML
    box.querySelector('#avp-close').onclick = API.close;
    if (many) {
      box.querySelector('#avp-prev').onclick = () => API.step(-1);
      box.querySelector('#avp-next').onclick = () => API.step(1);
      box.querySelectorAll('.avp-thumb').forEach(b => { b.onclick = () => API.jump(Number(b.dataset.i)); });
    }
  }
  const API = {
    open(i, videos) {
      const arr = (Array.isArray(videos) && videos.length) ? videos : (state.productVideos || []);
      if (!arr.length) { if (window.toast) toast('ویدیویی برای پخش یافت نشد', 'warning'); return; }
      list = arr; idx = Math.max(0, Math.min(arr.length - 1, Number(i) || 0));
      ensure(); paint();
      isOpen = true;
      root.classList.remove('hidden'); root.style.display = 'flex';
      document.documentElement.style.overflow = 'hidden';
    },
    close() {
      if (!isOpen) return;
      isOpen = false;
      const v = root.querySelector('#avp-video');
      if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {} }
      root.style.display = 'none'; root.classList.add('hidden');
      document.documentElement.style.overflow = '';
    },
    step(d) { if (list.length > 1) { idx = (idx + d + list.length) % list.length; paint(); } },
    jump(i) { if (i !== idx && i >= 0 && i < list.length) { idx = i; paint(); } }
  };
  return API;
})();

// ── اسکرول افقی بنر شگفت‌انگیزها (سازگار با RTL) ──
window.aryDealsScroll = function (dir) {
  const el = document.getElementById('home-deals-slider');
  if (!el) return;
  const rtl = (getComputedStyle(el).direction || 'ltr') === 'rtl';
  el.scrollBy({ left: (rtl ? -dir : dir) * el.clientWidth * 0.85, behavior: 'smooth' });
};

(function () {
  const USERS_KEY = 'arya_users_v1';

  // ── User storage helpers ──
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
  }
  function saveUsers(users) {
    try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch {}
  }
  function hashPass(p) { return btoa(unescape(encodeURIComponent(p || ''))); }
  function verifyPass(plain, hash) { return hashPass(plain) === hash; }

  // حالت سرور: وقتی Db.php پیکربندی است، همه‌ی مسیرهای احراز هویت سمت سرور می‌روند
  function serverAuth() { return !!(window.AryaServer && AryaServer.isConfigured()); }
  window.serverAuth = serverAuth;

  // تبدیل ارقام فارسی/عربی به انگلیسی (برخی کیبوردهای فارسی حتی در فیلدهای
  // عددی رقم فارسی/عربی تایپ می‌کنند و اعتبارسنجی کد تایید را خراب می‌کردند)
  function normalizeDigits(str) {
    if (!str) return '';
    const persian = '۰۱۲۳۴۵۶۷۸۹';
    const arabic  = '٠١٢٣٤٥٦٧٨٩';
    return String(str).replace(/[۰-۹٠-٩]/g, ch => {
      const pIdx = persian.indexOf(ch);
      if (pIdx > -1) return String(pIdx);
      const aIdx = arabic.indexOf(ch);
      if (aIdx > -1) return String(aIdx);
      return ch;
    }).trim();
  }

  // ثبت/بروزرسانی کاربر در دیتابیس واقعی MySQL (best-effort، بدون مسدود کردن رابط کاربری)
  function persistUserToServer(record) {
    if (serverAuth()) return Promise.resolve({ ok: true, skipped: true }); // مسیرهای اختصاصی user_* جای این را گرفته‌اند
    try {
      fetch('Db.php?action=upsert&table=users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ record })
      }).catch(() => {}); // اگر بک‌اند PHP در دسترس نباشد، بی‌سروصدا نادیده گرفته می‌شود
    } catch (e) {}
  }
  window.persistUserToServer = persistUserToServer;

  // ── Strength calculator ──
  function calcStrength(p) {
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }

  // ── State ──
  state.authTab    = state.authTab    || 'login';   // login | register | forgot
  state.authMode   = state.authMode   || 'email';   // email | phone
  state.authError  = state.authError  || '';
  state.authPassOk = state.authPassOk || false;
  state.authStrength = 0;
  // OTP دو مرحله‌ای برای افزایش امنیت ورود
  state.authOtpStep     = state.authOtpStep     || false;
  state.authOtp         = state.authOtp         || '';
  state.authOtpTimer    = state.authOtpTimer    || 0;
  state.authOtpInterval = state.authOtpInterval || null;
  state.pendingLoginUser = state.pendingLoginUser || null;
  let resendCred = null; // فقط در حافظه‌ی لحظه‌ای برای «ارسال مجدد» (در state نمی‌نشیند)

  // ── Toggle password visibility ──
  function togglePassVis(inputId, btn) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.type = el.type === 'password' ? 'text' : 'password';
    btn.innerHTML = el.type === 'password' ? aryIcon('eye', 'w-5 h-5') : aryIcon('eyeoff', 'w-5 h-5');
  }
  window.togglePassVis = togglePassVis;

  // ── LOGIN (مرحله ۱: شناسه + رمز عبور) ──
  function handleUserLogin(form) {
    const id = (form.identifier?.value || '').trim();
    const pass = form.password?.value || '';

    if (serverAuth()) {
      state.authError = '';
      AryaServer.login1(id, pass).then(r => {
        if (!r.ok) { state.authError = r.msg || 'خطا در ورود.'; render(); return; }
        resendCred = { id, pass };
        state.authOtpMode = 'login';
        state.pendingLoginUser = { phone: r.data.target_masked || id, email: '' };
        state.authOtp = r.data.otp_demo || '';
        state.authOtpStep = true;
        startLoginOtpCountdown(120);
        toast(`کد تایید به ${r.data.target_masked || id} ارسال شد.`, 'info', 6000);
        render();
      }).catch(() => { state.authError = 'ارتباط با سرور برقرار نشد.'; render(); });
      return;
    }

    const users = getUsers();

    const user = users.find(u =>
      u.email?.toLowerCase() === id.toLowerCase() || u.phone === id
    );

    if (!user) {
      state.authError = 'حسابی با این مشخصات یافت نشد. ابتدا ثبت‌نام کنید.';
      render(); return;
    }
    if (!verifyPass(pass, user.passwordHash)) {
      state.authError = 'رمز عبور اشتباه است.';
      render(); return;
    }

    const userObj = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      addresses: user.addresses || [],
      avatar: user.avatar || '',
      nationalId: user.nationalId || ''
    };

    // به‌جای ورود فوری، مرحله تایید با کد ۶ رقمی را آغاز می‌کنیم
    state.pendingLoginUser = userObj;
    state.authError = '';
    startLoginOtpStep();
  }

  // ── ارسال/شروع کد تایید ۶ رقمی ──
  function startLoginOtpStep() {
    state.authOtp = utils.generateOtp();
    state.authOtpStep = true;
    state.authError = '';
    startLoginOtpCountdown(120);

    // نکته: در این نسخه به دلیل نبود سرویس واقعی پیامک/ایمیل، کد به صورت
    // شبیه‌سازی‌شده نمایش داده می‌شود. برای استفاده واقعی، این بخش باید
    // به یک سرویس ارسال پیامک/ایمیل روی سرور (PHP) متصل شود.
    const target = state.pendingLoginUser?.phone || state.pendingLoginUser?.email || '';
    toast(`کد تایید برای ${target} آماده شد`, 'info', 4000);
    render();
  }

  function startLoginOtpCountdown(seconds) {
    state.authOtpTimer = seconds;
    if (state.authOtpInterval) clearInterval(state.authOtpInterval);
    state.authOtpInterval = setInterval(() => {
      state.authOtpTimer--;
      if (state.authOtpTimer <= 0) {
        clearInterval(state.authOtpInterval);
        state.authOtpInterval = null;
      }
      updateLoginOtpTimerDisplay();
    }, 1000);
  }

  function updateLoginOtpTimerDisplay() {
    const el = document.getElementById('login-otp-timer');
    if (!el) return;
    if (state.authOtpTimer > 0) {
      el.innerHTML = `<span class="text-white/40">${Math.floor(state.authOtpTimer / 60)}:${String(state.authOtpTimer % 60).padStart(2, '0')}</span>`;
    } else {
      el.innerHTML = `<button type="button" onclick="resendLoginOtp()" class="text-blue-400 hover:text-blue-300 transition-colors">ارسال مجدد کد</button>`;
    }
  }

  function resendLoginOtp() {
    if (state.authOtpTimer > 0) return;
    if (serverAuth()) {
      const mode = state.authOtpMode || 'login';
      const req = mode === 'forgot'
        ? AryaServer.reset1(state.forgotIdentifier || '')
        : AryaServer.login1(resendCred ? resendCred.id : '', resendCred ? resendCred.pass : '');
      req.then(r => {
        if (!r.ok) { state.authError = r.msg || 'ارسال مجدد ناموفق.'; render(); return; }
        state.authOtp = r.data.otp_demo || '';
        startLoginOtpCountdown(120);
        render();
      }).catch(() => {});
      return;
    }
    startLoginOtpStep();
  }
  window.resendLoginOtp = resendLoginOtp;

  // ── LOGIN (مرحله ۲: تایید کد ۶ رقمی) ──
  function handleVerifyLoginOtp(form) {
    const code = normalizeDigits(form.otp?.value || '');
    if (!/^\d{6}$/.test(code)) {
      state.authError = 'کد تایید باید دقیقاً ۶ رقم باشد.';
      render();
      return;
    }

    if (serverAuth()) {
      const mode = state.authOtpMode || 'login';
      const req = mode === 'forgot'
        ? AryaServer.reset2(code, state.pendingForgotPass || '')
        : AryaServer.login2(code);
      req.then(r => {
        if (!r.ok) { state.authError = r.msg || 'کد نامعتبر است.'; render(); return; }
        if (state.authOtpInterval) { clearInterval(state.authOtpInterval); state.authOtpInterval = null; }
        state.authOtpStep = false; state.authOtp = ''; state.authOtpTimer = 0;
        state.pendingForgotPass = ''; state.forgotIdentifier = ''; resendCred = null;
        if (mode === 'forgot') {
          state.authTab = 'login'; state.authError = '';
          toast('رمز عبور بازنشانی شد؛ اکنون وارد شوید.');
          render(); return;
        }
        const u = r.data.user || {};
        let addr = u.addresses;
        if (typeof addr === 'string') { try { addr = JSON.parse(addr); } catch { addr = []; } }
        if (addr && !Array.isArray(addr)) addr = Object.values(addr);
        const userObj = {
          id: u.id, name: u.name || '', phone: u.phone || '', email: u.email || '',
          addresses: Array.isArray(addr) ? addr : [], avatar: u.avatar || '',
          nationalId: u.national_id || u.nationalId || '',
        };
        state.currentUser = userObj; state.user = userObj; state.isAdmin = false; state.authError = '';
        if (window.AppState) AppState.set({ loggedIn: true, currentUser: userObj, user: userObj, isAdmin: false });
        toast('با موفقیت وارد شدید');
        goTo('profile');
        render();
      }).catch(() => { state.authError = 'ارتباط با سرور برقرار نشد.'; render(); });
      return;
    }
    if (code !== state.authOtp) {
      state.authError = 'کد تایید اشتباه است.';
      render();
      return;
    }

    if (state.authOtpInterval) {
      clearInterval(state.authOtpInterval);
      state.authOtpInterval = null;
    }

    const userObj = state.pendingLoginUser;

    state.currentUser = userObj;
    state.user = userObj;
    state.isAdmin = false;
    state.authError = '';
    state.authTab = 'login';
    state.authOtpStep = false;
    state.authOtp = '';
    state.authOtpTimer = 0;
    state.pendingLoginUser = null;

    if (window.AppState) AppState.set({ loggedIn: true, currentUser: userObj, user: userObj, isAdmin: false });

    // همگام‌سازی با دیتابیس واقعی (اگر قبلاً ثبت نشده باشد نیز اینجا ثبت می‌شود)
    persistUserToServer({
      id: userObj.id,
      name: userObj.name,
      email: userObj.email,
      phone: userObj.phone,
      national_id: userObj.nationalId || '',
      created_at: new Date().toISOString()
    });

    toast('با موفقیت وارد شدید');
    goTo('profile');
    render();
  }

  function cancelLoginOtpStep() {
    if (state.authOtpInterval) {
      clearInterval(state.authOtpInterval);
      state.authOtpInterval = null;
    }
    state.authOtpStep = false;
    state.authOtp = '';
    state.authOtpTimer = 0;
    state.pendingLoginUser = null;
    state.authOtpMode = null; state.pendingForgotPass = ''; resendCred = null;
    state.authError = '';
    render();
  }
  window.cancelLoginOtpStep = cancelLoginOtpStep;

  // ── REGISTER ──
  function handleUserRegister(form) {
    const name = (form.name?.value || '').trim();
    const email = (form.email?.value || '').trim().toLowerCase();
    const phone = (form.phone?.value || '').trim();
    const pass = form.password?.value || '';
    const pass2 = form.password2?.value || '';

    if (name.length < 3) { state.authError = 'نام باید حداقل ۳ کاراکتر باشد.'; render(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { state.authError = 'ایمیل نامعتبر است.'; render(); return; }
    if (!/^09\d{9}$/.test(phone)) { state.authError = 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.'; render(); return; }
    if (pass.length < 8) { state.authError = 'رمز عبور باید حداقل ۸ کاراکتر باشد.'; render(); return; }
    if (!/[A-Z]/.test(pass)) { state.authError = 'رمز باید حداقل یک حرف بزرگ داشته باشد.'; render(); return; }
    if (!/\d/.test(pass)) { state.authError = 'رمز باید حداقل یک عدد داشته باشد.'; render(); return; }
    if (pass !== pass2) { state.authError = 'رمزهای عبور یکسان نیستند.'; render(); return; }

    if (serverAuth()) {
      AryaServer.register({ name, email, phone, password: pass }).then(r => {
        if (!r.ok) { state.authError = r.msg || 'خطا در ثبت‌نام.'; render(); return; }
        state.authError = ''; state.authTab = 'login';
        toast('ثبت‌نام انجام شد. برای ادامه وارد حساب شوید.');
        render();
      }).catch(() => { state.authError = 'ارتباط با سرور برقرار نشد.'; render(); });
      return;
    }

    const users = getUsers();
    if (users.find(u => u.email === email)) { state.authError = 'این ایمیل قبلاً ثبت شده است.'; render(); return; }
    if (users.find(u => u.phone === phone)) { state.authError = 'این شماره قبلاً ثبت شده است.'; render(); return; }

    const newUser = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2,8),
      name, email, phone,
      passwordHash: hashPass(pass),
      addresses: [], avatar: '', nationalId: '',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);

    // Sync to IndexedDB (client-side)
    if (window.AryaDB) {
      AryaDB.upsert('users', { id: newUser.id, name, email, phone, createdAt: newUser.createdAt });
    }

    // ثبت واقعی کاربر در دیتابیس MySQL (قابل مشاهده در phpMyAdmin)
    persistUserToServer({
      id: newUser.id,
      name, email, phone,
      password_hash: newUser.passwordHash,
      national_id: '',
      created_at: newUser.createdAt
    });

    state.authError = '';
    state.authTab = 'login';
    toast('ثبت‌نام موفق! وارد شوید.');
    render();
  }

  // ── FORGOT PASSWORD ──
  function handleUserForgot(form) {
    const id = (form.identifier?.value || '').trim();
    const newpass = form.newpass?.value || '';
    const newpass2 = form.newpass2?.value || '';

    if (newpass.length < 8) { state.authError = 'رمز جدید باید حداقل ۸ کاراکتر باشد.'; render(); return; }
    if (newpass !== newpass2) { state.authError = 'رمزهای عبور یکسان نیستند.'; render(); return; }

    if (serverAuth()) {
      AryaServer.reset1(id).then(r => {
        if (!r.ok) { state.authError = r.msg || 'خطا در ارسال کد.'; render(); return; }
        state.pendingForgotPass = newpass;
        state.forgotIdentifier = id;
        state.authOtpMode = 'forgot';
        state.authOtp = r.data.otp_demo || '';
        state.pendingLoginUser = { phone: r.data.target_masked || id, email: '' };
        state.authOtpStep = true; state.authError = '';
        startLoginOtpCountdown(120);
        render();
      }).catch(() => { state.authError = 'ارتباط با سرور برقرار نشد.'; render(); });
      return;
    }

    const users = getUsers();
    const idx = users.findIndex(u =>
      u.email?.toLowerCase() === id.toLowerCase() || u.phone === id
    );
    if (idx === -1) { state.authError = 'حسابی با این مشخصات یافت نشد.'; render(); return; }

    users[idx].passwordHash = hashPass(newpass);
    saveUsers(users);

    state.authError = '';
    state.authTab = 'login';
    toast('رمز عبور با موفقیت تغییر یافت.');
    render();
  }

  // ── Strength live update ──
  function onPassInput(val) {
    state.authStrength = calcStrength(val);
    const bars = document.querySelectorAll('.auth-strength-bar');
    const cols = ['','bg-rose-500','bg-amber-500','bg-yellow-400','bg-emerald-400','bg-emerald-500'];
    bars.forEach((b, i) => {
      b.className = `auth-strength-bar flex-1 h-1.5 rounded-full transition-all ${(i+1) <= state.authStrength ? cols[state.authStrength] || 'bg-emerald-500' : 'bg-white/10'}`;
    });
    const lbl = document.getElementById('auth-strength-label');
    if (lbl) {
      const labels = ['','خیلی ضعیف','ضعیف','متوسط','قوی','خیلی قوی'];
      const textCols = ['','text-rose-400','text-amber-400','text-yellow-400','text-emerald-400','text-emerald-400'];
      lbl.textContent = labels[state.authStrength] || '';
      lbl.className = `text-xs mt-1 ${textCols[state.authStrength] || ''}`;
    }
  }
  window.onPassInput = onPassInput;

  // ── RENDER ──
  function renderLoginPage() {
    const tab = state.authTab || 'login';
    const err = state.authError || '';

    // مرحله تایید کد ۶ رقمی (بعد از ورود موفق شماره/رمز)
    if (state.authOtpStep) {
      const target = state.pendingLoginUser?.phone || state.pendingLoginUser?.email || '';
      const timerHtml = state.authOtpTimer > 0
        ? `<span class="text-white/40">${Math.floor(state.authOtpTimer / 60)}:${String(state.authOtpTimer % 60).padStart(2, '0')}</span>`
        : `<button type="button" onclick="resendLoginOtp()" class="text-blue-400 hover:text-blue-300 transition-colors">ارسال مجدد کد</button>`;
      return `
        ${typeof renderHeader === 'function' ? renderHeader() : ''}
        <main class="max-w-md mx-auto px-4 py-12 lg:py-20">
          <div class="text-center mb-8">
            <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-sky-700 flex items-center justify-center text-4xl mx-auto mb-4 shadow-2xl shadow-blue-500/30 animate-float">${aryIcon('lock', 'w-10 h-10 text-blue-100')}</div>
            <h1 class="text-2xl font-black mb-1">${state.authOtpMode === 'forgot' ? 'بازیابی رمز عبور' : 'تایید هویت'}</h1>
            <p class="text-white/50 text-sm">کد ۶ رقمی ارسال‌شده به ${target} را وارد کنید</p>
          </div>
          <div class="glass-strong rounded-3xl p-7 animate-scale">
            <form onsubmit="event.preventDefault(); handleVerifyLoginOtp(this);" class="space-y-4">
              <div>
                <label class="block text-sm text-white/70 mb-2 text-center">کد تایید</label>
                <input name="otp" inputmode="numeric" maxlength="6"
                  class="input-style w-full text-center tracking-[0.5em] text-xl font-bold" dir="ltr"
                  placeholder="------" autocomplete="one-time-code" required autofocus>
              </div>
              ${state.authOtp ? `
              <div class="glass rounded-xl px-4 py-3 border border-blue-500/30 bg-blue-500/10 flex items-center justify-between gap-3">
                <p class="text-xs text-white/70">حالت نمایشی — کد شما: <b dir="ltr" class="tracking-[0.3em] text-blue-200">${aryEsc(String(state.authOtp))}</b></p>
                <button type="button" class="text-xs font-bold text-blue-300 hover:text-white transition-colors" onclick="document.querySelector('input[name=otp]').value='${aryEsc(String(state.authOtp))}'">استفاده از کد</button>
              </div>` : ''}
              <div class="text-center text-sm">
                <span id="login-otp-timer">${timerHtml}</span>
              </div>
              ${err ? `<div class="glass rounded-xl px-4 py-3 border border-rose-500/30 bg-rose-500/10"><p class="text-rose-300 text-sm">${err}</p></div>` : ''}
              <button type="submit" class="btn-primary w-full py-4 rounded-xl font-bold text-base">${state.authOtpMode === 'forgot' ? 'تایید کد و بازنشانی رمز' : 'تایید و ورود'}</button>
              <button type="button" onclick="cancelLoginOtpStep()" class="w-full py-3 btn-ghost rounded-xl text-sm text-white/60">← بازگشت</button>
            </form>
          </div>
        </main>
      `;
    }

    const tabBar = `
      <div class="flex gap-2 mb-6">
        <button type="button" onclick="state.authTab='login'; state.authError=''; render()"
          class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab==='login' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'glass text-white/60 hover:bg-white/10'}">
          ورود
        </button>
        <button type="button" onclick="state.authTab='register'; state.authError=''; render()"
          class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab==='register' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'glass text-white/60 hover:bg-white/10'}">
          ثبت‌نام
        </button>
      </div>
    `;

    let formContent = '';

    if (tab === 'login') {
      formContent = `
        ${tabBar}
        <form onsubmit="event.preventDefault(); handleUserLogin(this);" class="space-y-4" autocomplete="off">
          <div>
            <label class="block text-sm text-white/70 mb-2">ایمیل یا شماره موبایل</label>
            <input name="identifier" class="input-style w-full" dir="ltr" placeholder="user@email.com یا 09..." autocomplete="off" readonly onfocus="this.removeAttribute('readonly')" required>
          </div>
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm text-white/70">رمز عبور</label>
              <button type="button" onclick="state.authTab='forgot'; state.authError=''; render()" class="text-xs text-blue-400 hover:text-blue-300">فراموشی رمز؟</button>
            </div>
            <div class="relative">
              <input name="password" id="login-pass" type="password" class="input-style w-full pl-12" placeholder="رمز عبور" autocomplete="off" readonly onfocus="this.removeAttribute('readonly')" required>
              <button type="button" onclick="togglePassVis('login-pass', this)" class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                <span class="inline-flex">${aryIcon('eye','w-5 h-5')}</span></button>
            </div>
          </div>
          ${err ? `<div class="glass rounded-xl px-4 py-3 border border-rose-500/30 bg-rose-500/10"><p class="text-rose-300 text-sm">${err}</p></div>` : ''}
          <button type="submit" class="btn-primary w-full py-4 rounded-xl font-bold text-base">ورود به حساب</button>
        </form>
      `;
    } else if (tab === 'register') {
      formContent = `
        ${tabBar}
        <form onsubmit="event.preventDefault(); handleUserRegister(this);" class="space-y-4" autocomplete="off">
          <div>
            <label class="block text-sm text-white/70 mb-2">نام و نام خانوادگی</label>
            <input name="name" class="input-style w-full" placeholder="نام کامل" required minlength="3">
          </div>
          <div>
            <label class="block text-sm text-white/70 mb-2">آدرس ایمیل</label>
            <input name="email" type="email" class="input-style w-full" dir="ltr" placeholder="user@example.com" required autocomplete="off" readonly onfocus="this.removeAttribute('readonly')">
          </div>
          <div>
            <label class="block text-sm text-white/70 mb-2">شماره موبایل</label>
            <input name="phone" type="tel" class="input-style w-full" dir="ltr" placeholder="09123456789" maxlength="11" required autocomplete="off">
          </div>
          <div>
            <label class="block text-sm text-white/70 mb-2">رمز عبور</label>
            <div class="relative">
              <input name="password" id="reg-pass" type="password" class="input-style w-full pl-12" placeholder="حداقل ۸ کاراکتر" required minlength="8"
                autocomplete="new-password" readonly onfocus="this.removeAttribute('readonly')"
                oninput="onPassInput(this.value)">
              <button type="button" onclick="togglePassVis('reg-pass', this)" class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                <span class="inline-flex">${aryIcon('eye','w-5 h-5')}</span></button>
            </div>
            <div class="flex gap-1 mt-2">
              ${[1,2,3,4,5].map(()=>`<div class="auth-strength-bar flex-1 h-1.5 rounded-full bg-white/10"></div>`).join('')}
            </div>
            <span id="auth-strength-label" class="text-xs mt-1 text-white/40"></span>
          </div>
          <div>
            <label class="block text-sm text-white/70 mb-2">تکرار رمز عبور</label>
            <div class="relative">
              <input name="password2" id="reg-pass2" type="password" class="input-style w-full pl-12" placeholder="تکرار رمز" required
                autocomplete="new-password" readonly onfocus="this.removeAttribute('readonly')">
              <button type="button" onclick="togglePassVis('reg-pass2', this)" class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                <span class="inline-flex">${aryIcon('eye','w-5 h-5')}</span></button>
            </div>
          </div>
          <div class="glass rounded-xl p-3 text-xs text-white/40 space-y-0.5">
            <p>${aryIcon('key', 'w-4 h-4 inline-block align-[-3px] ml-1')} رمز باید: حداقل ۸ کاراکتر، یک حرف بزرگ و یک عدد داشته باشد</p>
          </div>
          ${err ? `<div class="glass rounded-xl px-4 py-3 border border-rose-500/30 bg-rose-500/10"><p class="text-rose-300 text-sm">${err}</p></div>` : ''}
          <button type="submit" class="btn-primary w-full py-4 rounded-xl font-bold text-base">ثبت‌نام</button>
        </form>
      `;
    } else if (tab === 'forgot') {
      formContent = `
        <div class="text-center mb-6">
          <div class="text-blue-300 flex justify-center mb-3">${aryIcon('key','w-11 h-11')}</div>
          <h2 class="text-xl font-black mb-1">بازیابی رمز</h2>
          <p class="text-white/50 text-sm">ایمیل یا شماره ثبت‌شده را وارد کنید</p>
        </div>
        <form onsubmit="event.preventDefault(); handleUserForgot(this);" class="space-y-4" autocomplete="off">
          <div>
            <label class="block text-sm text-white/70 mb-2">ایمیل یا شماره موبایل</label>
            <input name="identifier" class="input-style w-full" dir="ltr" placeholder="user@email.com یا 09..." required autocomplete="off" readonly onfocus="this.removeAttribute('readonly')">
          </div>
          <div>
            <label class="block text-sm text-white/70 mb-2">رمز عبور جدید</label>
            <div class="relative">
              <input name="newpass" id="forgot-pass" type="password" class="input-style w-full pl-12" placeholder="حداقل ۸ کاراکتر" required minlength="8" autocomplete="new-password" readonly onfocus="this.removeAttribute('readonly')">
              <button type="button" onclick="togglePassVis('forgot-pass', this)" class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                <span class="inline-flex">${aryIcon('eye','w-5 h-5')}</span></button>
            </div>
          </div>
          <div>
            <label class="block text-sm text-white/70 mb-2">تکرار رمز جدید</label>
            <input name="newpass2" type="password" class="input-style w-full" placeholder="تکرار رمز" required autocomplete="new-password" readonly onfocus="this.removeAttribute('readonly')">
          </div>
          ${err ? `<div class="glass rounded-xl px-4 py-3 border border-rose-500/30 bg-rose-500/10"><p class="text-rose-300 text-sm">${err}</p></div>` : ''}
          <button type="submit" class="btn-primary w-full py-4 rounded-xl font-bold text-base">تغییر رمز عبور</button>
          <button type="button" onclick="state.authTab='login'; state.authError=''; render()" class="w-full py-3 btn-ghost rounded-xl text-sm text-white/60">← بازگشت</button>
        </form>
      `;
    }

    return `
      ${typeof renderHeader === 'function' ? renderHeader() : ''}
      <main class="max-w-md mx-auto px-4 py-12 lg:py-20">
        <div class="text-center mb-8">
          <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-sky-700 flex items-center justify-center text-4xl mx-auto mb-4 shadow-2xl shadow-blue-500/30 animate-float">${aryIcon('key', 'w-9 h-9 text-blue-100')}</div>
          <h1 class="text-2xl font-black mb-1">${tab === 'login' ? 'ورود به حساب' : tab === 'register' ? 'ایجاد حساب' : 'بازیابی رمز'}</h1>
          <p class="text-white/50 text-sm">فروشگاه آریا</p>
        </div>
        <div class="glass-strong rounded-3xl p-7 animate-scale">
          ${formContent}
        </div>
      </main>
    `;
  }

  window.renderLoginPage   = renderLoginPage;
  window.handleUserLogin   = handleUserLogin;
  window.handleUserRegister = handleUserRegister;
  window.handleUserForgot  = handleUserForgot;
  window.handleVerifyLoginOtp = handleVerifyLoginOtp;
  window.resendLoginOtp = resendLoginOtp;
  window.cancelLoginOtpStep = cancelLoginOtpStep;
  window.updateLoginOtpTimerDisplay = updateLoginOtpTimerDisplay;

})();

// ═══════════════════════════════════════════════════════════════
// SHOP PAGE
// ═══════════════════════════════════════════════════════════════

function toggleFilterSidebar() {
  const sidebar = document.getElementById('shop-filter-sidebar');
  if (!sidebar) return;
  sidebar.classList.toggle('open');
}

function getFilteredProducts() {
  const products = state.products || [];
  let filteredProducts = [...products];

  if (state.productFilter.category) {
    filteredProducts = filteredProducts.filter(
      p => p.category === state.productFilter.category
    );
  }

  if (state.productFilter.search) {
    const s = (state.productFilter.search || '').toLowerCase();
    filteredProducts = filteredProducts.filter(
      p =>
        (p.title || '').toLowerCase().includes(s) ||
        (p.description || '').toLowerCase().includes(s)
    );
  }

  if (state.productFilter.minPrice) {
    filteredProducts = filteredProducts.filter(
      p => Number(p.price) >= Number(state.productFilter.minPrice)
    );
  }
  if (state.productFilter.maxPrice) {
    filteredProducts = filteredProducts.filter(
      p => Number(p.price) <= Number(state.productFilter.maxPrice)
    );
  }

  switch (state.productFilter.sort) {
    case 'price-low':
      filteredProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    case 'popular':
      filteredProducts.sort((a, b) => (b.sales || 0) - (a.sales || 0));
      break;
    case 'newest':
    default:
      filteredProducts.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
  }

  return filteredProducts;
}

function setProductView(mode) {
  mode = mode === 'list' ? 'list' : 'grid';
  if (window.AppState) { AppState.set({ productView: mode }); return; } // notify → render
  state.productView = mode;
  if (typeof render === 'function') render();
}
window.setProductView = setProductView;

function renderProductRow(p, i) {
  const img = p.image || p.main_image || (Array.isArray(p.images) && p.images[0]) || '';
  const discount = utils.calculateDiscount(p.original_price, p.price);
  const inStock = (p.stock || 0) > 0;
  const shortDesc = String(p.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return `
    <article class="glass rounded-2xl p-3 sm:p-4 flex items-stretch gap-3 sm:gap-5 animate-fade" style="animation-delay:${i * 0.04}s">
      <div class="w-24 sm:w-32 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500/10 to-sky-600/10 flex items-center justify-center cursor-pointer relative" onclick="openProductById('${aryEsc(String(p.id))}')">
        ${img ? `<img src="${img}" alt="" class="w-full h-24 sm:h-32 object-cover" loading="lazy">` : `<div class="flex items-center justify-center w-full h-24 sm:h-32 text-white/25">${aryIcon('box','w-8 h-8')}</div>`}
        ${discount > 0 ? `<span class="absolute top-1 right-1 badge badge-discount text-[10px] py-0.5">${discount}٪−</span>` : ''}
      </div>
      <div class="flex-1 min-w-0 py-0.5 flex flex-col">
        <h3 class="font-bold text-sm sm:text-base line-clamp-1 cursor-pointer hover:text-blue-300 transition-colors" onclick="openProductById('${aryEsc(String(p.id))}')">${aryEsc(p.title || '')}</h3>
        ${shortDesc ? `<p class="text-white/50 text-xs mt-1 line-clamp-2 leading-5 hidden sm:block">${aryEsc(shortDesc.slice(0, 180))}</p>` : ''}
        <div class="flex flex-wrap items-end justify-between gap-2 mt-auto pt-2">
          <div>
            ${p.original_price > p.price ? `<div class="text-white/35 text-[11px] line-through">${utils.formatPrice(p.original_price)}</div>` : ''}
            <div class="text-emerald-400 font-black text-sm sm:text-base">${utils.formatPrice(p.price)}<span class="text-[10px] font-normal text-white/50"> تومان</span></div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[11px] ${inStock ? 'text-emerald-300/80' : 'text-rose-300/80'} inline-flex items-center gap-1">${aryIcon(inStock ? 'check' : 'x','w-3.5 h-3.5')}${inStock ? 'موجود' : 'ناموجود'}</span>
            <button type="button" class="btn-primary text-xs px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 disabled:opacity-40" ${inStock ? '' : 'disabled'} onclick="addToCartById('${aryEsc(String(p.id))}')">${aryIcon('cart','w-4 h-4')}افزودن به سبد</button>
            <button type="button" class="text-xs px-3 py-2 rounded-xl border border-white/15 text-white/70 hover:bg-white/10 transition-colors" onclick="openProductById('${aryEsc(String(p.id))}')">جزئیات</button>
          </div>
        </div>
      </div>
    </article>`;
}

function renderShopProductsOnly() {
  const filteredProducts = getFilteredProducts();

  if (filteredProducts.length > 0) {
    if (state.productView === 'list') {
      return `
        <div class="space-y-3 lg:space-y-4">
          ${filteredProducts.map((p, i) => renderProductRow(p, i)).join('')}
        </div>
      `;
    }
    return `
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        ${filteredProducts.map((p, i) => renderProductCard(p, i)).join('')}
      </div>
    `;
  }

  return `
    <div class="glass rounded-3xl p-16 text-center">
      <div class="mb-6 flex justify-center text-white/30">${aryIcon('search', 'w-20 h-20')}</div>
      <h3 class="text-2xl font-bold mb-3">محصولی یافت نشد</h3>
      <p class="text-white/60 mb-6">فیلترهای جستجو را تغییر دهید</p>
      <button
        onclick="state.productFilter={category:'',search:'',sort:'newest',minPrice:'',maxPrice:''}; updateShopProductsOnly(true); updateSortButtonsUI(); updateCategoryButtonsUI()"
        class="btn-primary px-8 py-3 rounded-xl font-semibold"
        type="button"
      >پاک کردن فیلترها</button>
    </div>
  `;
}

function updateShopProductsOnly(resetSliders = false) {
  const container = document.getElementById('shop-products-container');
  if (!container) return;

  container.innerHTML = renderShopProductsOnly();

  const countEl = document.getElementById('shop-products-count');
  if (countEl) {
    const filteredProducts = getFilteredProducts();
    countEl.textContent = `${filteredProducts.length} محصول`;
  }

  if (resetSliders) {
    const products = state.products || [];
    const baseList = state.productFilter.category
      ? products.filter(p => p.category === state.productFilter.category)
      : products;

    const prices = baseList.map(p => Number(p.price) || 0);
    if (prices.length > 0) {
      const autoMinPrice = Math.min(...prices);
      const autoMaxPrice = Math.max(...prices);

      const maxEl = document.getElementById('priceMax');
      const maxLabel = document.getElementById('priceMaxLabel');

      if (maxEl) maxEl.value = autoMaxPrice;
      if (maxLabel) maxLabel.innerText = utils.formatPrice(autoMaxPrice);

      state.productFilter.minPrice = autoMinPrice;
      state.productFilter.maxPrice = autoMaxPrice;
    } else {
      state.productFilter.minPrice = '';
      state.productFilter.maxPrice = '';
    }
  }
}

function updateSortButtonsUI() {
  document.querySelectorAll(".sort-btn").forEach(btn => {
    const val = btn.getAttribute("data-sort");

    if (val === state.productFilter.sort) {
      btn.classList.add(
        "bg-emerald-500/20",
        "text-emerald-400",
        "border",
        "border-emerald-500/50"
      );
      btn.classList.remove("bg-white/5", "text-white/60");
    } else {
      btn.classList.remove(
        "bg-emerald-500/20",
        "text-emerald-400",
        "border",
        "border-emerald-500/50"
      );
      btn.classList.add("bg-white/5", "text-white/60");
    }
  });
}

function updateCategoryButtonsUI() {
  document.querySelectorAll(".cat-btn").forEach(btn => {
    const val = btn.getAttribute("data-category");

    const isActive =
      (val && val === state.productFilter.category) ||
      (!val && !state.productFilter.category);

    if (isActive) {
      btn.classList.add("bg-blue-500", "text-white", "shadow-lg");
      btn.classList.remove("glass", "hover:bg-white/10", "text-white/60");
    } else {
      btn.classList.remove("bg-blue-500", "text-white", "shadow-lg");
      btn.classList.add("glass", "hover:bg-white/10");
    }
  });
}

function updatePriceSlider() {
  const maxEl = document.getElementById('priceMax');
  if (!maxEl) return;

  const max = Number(maxEl.value);

  state.productFilter.maxPrice = max;

  const maxLabel = document.getElementById('priceMaxLabel');
  if (maxLabel) maxLabel.innerText = utils.formatPrice(max);

  updateShopProductsOnly();
}

function renderShopPage() {
  const products = state.products || [];
  const pv = state.productView === 'list' ? 'list' : 'grid';

  const baseList = state.productFilter.category
    ? products.filter(p => p.category === state.productFilter.category)
    : products;

  const prices = baseList.map(p => Number(p.price) || 0);

  let autoMinPrice = 0;
  let autoMaxPrice = 0;

  if (prices.length > 0) {
    autoMinPrice = Math.min(...prices);
    autoMaxPrice = Math.max(...prices);
  }

  state.productFilter.minPrice = autoMinPrice || 0;

  const filteredProducts = getFilteredProducts();

  const activeCategory = state.categories.find(
    c => c.id === state.productFilter.category
  );

  const html = `
    ${renderHeader()}
    
    <main class="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <div class="mb-8">
        <nav class="flex items-center gap-2 text-sm text-white/60 mb-4">
          <button onclick="goTo('home')" class="hover:text-white transition-colors" type="button">خانه</button>
          <span>←</span>
          <span class="text-white">فروشگاه</span>
          ${
            activeCategory
              ? `<span>←</span><span class="text-white">${activeCategory.title}</span>`
              : ''
          }
        </nav>
        <div class="flex items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl lg:text-4xl font-black">
              ${activeCategory ? activeCategory.title : 'همه محصولات'}
            </h1>
            <div class="flex items-center gap-3 mt-2 flex-wrap">
              <p class="text-white/60" id="shop-products-count">${filteredProducts.length} محصول</p>
              <span class="inline-flex rounded-xl border border-white/10 overflow-hidden" role="group" aria-label="نوع نمایش محصولات">
                <button type="button" onclick="setProductView('grid')" title="نمایش کاشی‌ای" class="px-2.5 py-1.5 inline-flex items-center gap-1.5 text-xs transition-colors ${pv === 'grid' ? 'bg-blue-500/25 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}">${aryIcon('grid','w-4 h-4')}<span class="hidden sm:inline">کاشی</span></button>
                <button type="button" onclick="setProductView('list')" title="نمایش لیستی" class="px-2.5 py-1.5 inline-flex items-center gap-1.5 text-xs border-r border-white/10 transition-colors ${pv === 'list' ? 'bg-blue-500/25 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}">${aryIcon('list','w-4 h-4')}<span class="hidden sm:inline">لیستی</span></button>
              </span>
            </div>
          </div>
          <button
            onclick="toggleFilterSidebar()"
            class="btn-primary px-4 py-2 rounded-xl font-semibold"
            type="button"
          >
            فیلترها
          </button>
        </div>
      </div>

      <div id="shop-filter-sidebar" class="shop-filter-sidebar">
        <div class="shop-filter-inner">
          <div class="flex items-center justify-between mb-6" style="padding: 1.5rem 1.5rem 0 1.5rem;">
            <h3 class="font-bold text-lg">فیلتر محصولات</h3>
            <button onclick="toggleFilterSidebar()" class="text-white/60 hover:text-white text-xl" type="button">✕</button>
          </div>

          <div class="mb-6" style="padding: 0 1.5rem;">
            <div class="relative">
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 inline-flex">${aryIcon('search', 'w-5 h-5')}</span>
              <input 
                type="text"
                placeholder="جستجوی محصول..."
                value="${state.productFilter.search}"
                oninput="state.productFilter.search=this.value; updateShopProductsOnly()"
                class="w-full input-style pr-14"
                style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14); border-radius: 12px; padding: 12px 46px 12px 12px; color: #fff; width: 100%; outline: none;"
              >
            </div>
          </div>

          <div class="mb-6" style="padding: 0 1.5rem;">
            <h4 class="text-sm text-white/70 mb-3">دسته‌بندی</h4>
            <div class="flex flex-wrap gap-2">
              <button 
                data-category=""
                onclick="state.productFilter.category=''; updateShopProductsOnly(true); updateCategoryButtonsUI()"
                class="cat-btn px-4 py-2.5 rounded-xl text-sm font-medium ${
                  !state.productFilter.category
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'glass hover:bg-white/10'
                }"
                type="button"
              >همه</button>

              ${(state.categories || [])
                .map(
                  cat => `
                <button 
                  data-category="${cat.id}"
                  onclick="state.productFilter.category='${cat.id}'; updateShopProductsOnly(true); updateCategoryButtonsUI()"
                  class="cat-btn px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${
                    state.productFilter.category === cat.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'glass hover:bg-white/10'
                  }"
                  type="button"
                >
                  <span>${cat.icon || cat.title}</span>
                  <span class="hidden sm:inline">${cat.title}</span>
                </button>
              `
                )
                .join('')}
            </div>
          </div>

          <div class="mb-6" style="padding: 0 1.5rem;">
            <h4 class="text-sm text-white/70 mb-3">مرتب‌سازی</h4>
            <div class="flex flex-wrap gap-2">
              ${[
                { value: 'newest', label: 'جدیدترین' },
                { value: 'popular', label: 'پرفروش' },
                { value: 'price-low', label: 'ارزان‌ترین' },
                { value: 'price-high', label: 'گران‌ترین' }
              ]
                .map(
                  opt => `
                <button 
                  data-sort="${opt.value}"
                  onclick="state.productFilter.sort='${opt.value}'; updateShopProductsOnly(); updateSortButtonsUI()"
                  class="sort-btn px-3 py-1.5 rounded-lg text-xs font-medium ${
                    state.productFilter.sort === opt.value
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }"
                  type="button"
                >${opt.label}</button>
              `
                )
                .join('')}
            </div>
          </div>

          ${
            prices.length > 0
              ? `
          <div class="mb-6" style="padding: 0 1.5rem;">
            <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 1rem;">
              <h4 class="text-sm text-white/70 mb-3">بازه قیمت</h4>

              <input
                type="range"
                id="priceMax"
                min="${autoMinPrice}"
                max="${autoMaxPrice}"
                value="${state.productFilter.maxPrice || autoMaxPrice}"
                oninput="updatePriceSlider()"
                class="w-full"
              >

              <div class="flex justify-between text-white/70 text-sm mt-2">
                <span>${utils.formatPrice(autoMinPrice)}</span>
                <span id="priceMaxLabel">${utils.formatPrice(state.productFilter.maxPrice || autoMaxPrice)}</span>
              </div>
            </div>
          </div>
          `
              : ''
          }

          <div class="flex gap-2 mt-4" style="padding: 0 1.5rem 1.5rem 1.5rem;">
            <button class="btn-success px-4 py-2 rounded-xl flex-1" onclick="toggleFilterSidebar()" type="button" style="background: linear-gradient(135deg,#2a8dff,#005aff); border: none; color: white; font-weight: 600; padding: 10px 16px; border-radius: 11px; box-shadow: 0 4px 14px rgba(37,99,235,0.55);">اعمال</button>
            <button
              class="btn-ghost px-4 py-2 rounded-xl flex-1"
              onclick="state.productFilter={category:'',search:'',sort:'newest',minPrice:'',maxPrice:''}; updateShopProductsOnly(true); updateSortButtonsUI(); updateCategoryButtonsUI()"
              type="button"
              style="background: transparent; border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.9); padding: 10px 16px; border-radius: 11px;"
            >پاک‌سازی</button>
          </div>
        </div>
      </div>

      <div id="shop-products-container">
        ${renderShopProductsOnly()}
      </div>
    </main>
    
    <style>
      .shop-filter-sidebar {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 420px;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 220ms ease;
      }
      
      .shop-filter-sidebar.open {
        pointer-events: auto;
        opacity: 1;
      }
      
      .shop-filter-sidebar .shop-filter-inner {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        background: 
          radial-gradient(900px 500px at 95% 5%, rgba(86,125,255,0.22) 0%, rgba(0,0,0,0) 40%),
          radial-gradient(700px 500px at 10% 95%, rgba(0,210,255,0.16) 0%, rgba(0,0,0,0) 45%),
          linear-gradient(180deg, rgba(16,18,24,0.92) 0%, rgba(16,18,24,0.88) 55%, rgba(16,18,24,0.95) 100%);
        backdrop-filter: blur(26px) saturate(160%);
        border-left: 1px solid rgba(255,255,255,0.12);
        box-shadow: -14px 0 36px rgba(0,0,0,0.45);
        color: #fff;
        overflow-y: auto;
      }
      
      @media (max-width: 480px) {
        .shop-filter-sidebar {
          max-width: 86vw;
        }
      }
      
      @media (min-width: 481px) and (max-width: 768px) {
        .shop-filter-sidebar {
          max-width: 72vw;
        }
      }
      
      @media (min-width: 769px) {
        .shop-filter-sidebar {
          max-width: 420px;
        }
      }
    </style>
  `;

  setTimeout(() => {
    updateSortButtonsUI();
    updateCategoryButtonsUI();
  }, 0);

  return html;
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT DETAIL PAGE (نسخه نهایی با ویدیو و فیلتر نظرات)
// ═══════════════════════════════════════════════════════════════

// ───── State init ─────
state.reviews = state.reviews || [];
state.wishlist = state.wishlist || [];
state.currentUser = state.currentUser || null;
state.reviewDraftRatings = state.reviewDraftRatings || {};
state.productGalleryIndex =
  typeof state.productGalleryIndex === 'number' ? state.productGalleryIndex : 0;
state.reviewRepliesModal = state.reviewRepliesModal || null;
state.productGalleryLightbox = state.productGalleryLightbox || null;
state.lastProductId = state.lastProductId || null;
state.isAnimating = false;
state.reviewsToShow = 3;
state.reviewFilter = state.reviewFilter || 'all';
state.videoPlayer = state.videoPlayer || null;

// ───── Global modal helpers ─────
function openGlobalModal() {
  if (typeof document !== 'undefined') {
    document.body.dataset.modalOpenCount =
      (parseInt(document.body.dataset.modalOpenCount || '0', 10) || 0) + 1;
    document.body.style.overflow = 'hidden';
  }
}

function closeGlobalModal() {
  if (typeof document !== 'undefined') {
    const current =
      parseInt(document.body.dataset.modalOpenCount || '0', 10) || 0;
    const next = Math.max(0, current - 1);
    document.body.dataset.modalOpenCount = String(next);
    if (next === 0) document.body.style.overflow = '';
  }
}

// ───── Helpers ─────
function isLoggedIn() {
  return !!state.currentUser;
}

function isInWishlist(productId) {
  return state.wishlist.includes(productId);
}

function preserveScrollAndRender() {
  const y = window.scrollY || 0;
  render();
  setTimeout(() => {
    window.scrollTo(0, y);
  }, 0);
}

function safeActionWithRender(fn) {
  const y = window.scrollY || 0;
  fn();
  render();
  setTimeout(() => {
    window.scrollTo(0, y);
  }, 0);
}

function toggleWishlist(productId) {
  safeActionWithRender(() => {
    if (isInWishlist(productId)) {
      state.wishlist = state.wishlist.filter(id => id !== productId);
      toast('از لیست علاقه‌مندی‌ها حذف شد', 'info');
    } else {
      state.wishlist.push(productId);
      toast('به لیست علاقه‌مندی‌ها اضافه شد', 'success');
    }
  });
}

// ───── Reviews ─────
function getProductReviews(productId) {
  return (state.reviews || []).filter(r => r.product_id === productId);
}

function getFilteredReviews(productId) {
  const allReviews = getProductReviews(productId).filter(r => r.status === 'approved');
  
  if (state.reviewFilter === 'all') {
    return allReviews;
  }
  
  const filterValue = parseInt(state.reviewFilter);
  return allReviews.filter(r => r.rating === filterValue);
}

function buildReviewTree(reviews) {
  const map = {};
  reviews.forEach(r => (map[r.id] = { ...r, children: [] }));
  const roots = [];

  reviews.forEach(r => {
    if (r.parent) {
      if (map[r.parent]) map[r.parent].children.push(map[r.id]);
    } else {
      roots.push(map[r.id]);
    }
  });

  return roots;
}

function setReviewRating(formId, productId, value) {
  state.reviewDraftRatings = state.reviewDraftRatings || {};
  state.reviewDraftRatings[productId] = value;

  const form = document.getElementById(formId);
  if (!form) return;

  if (form.rating) {
    form.rating.value = value;
  }

  const stars = form.querySelectorAll('[data-star]');
  stars.forEach(star => {
    const v = Number(star.getAttribute('data-star'));
    if (v <= value) {
      star.classList.add('text-amber-400');
      star.classList.remove('text-white/30');
    } else {
      star.classList.remove('text-amber-400');
      star.classList.add('text-white/30');
    }
  });
}

function submitReview(event, productId) {
  event.preventDefault();

  if (!isLoggedIn()) {
    toast('برای ثبت نظر باید وارد شوید', 'warning');
    return;
  }

  const form = event.target;
  const rating = Number(form.rating.value || 0);
  const text = form.text.value.trim();

  if (!rating || !text) {
    toast('امتیاز و متن نظر الزامی است', 'warning');
    return;
  }

  if (window.serverAuth && serverAuth()) {
    AryaServer.createReview({ product_id: productId, user_name: state.currentUser.name, rating, text })
      .then(r => {
        if (!r.ok) { toast(r.msg || 'خطا در ثبت نظر', 'warning'); return; }
        state.reviews.push({
          id: r.data.id, product_id: productId, user_name: state.currentUser.name,
          rating, text, likes: 0, dislikes: 0, status: 'pending', parent: null,
          created_at: Date.now(),
        });
        toast('نظر شما ثبت شد و پس از تأیید مدیر نمایش داده می‌شود', 'success');
        form.reset();
        state.reviewDraftRatings[productId] = 0;
        render();
      })
      .catch(() => toast('ارتباط با سرور برقرار نشد', 'warning'));
    return;
  }

  safeActionWithRender(() => {
    state.reviews.push({
      id: 'rev_' + utils.generateId(),
      product_id: productId,
      user_name: state.currentUser.name,
      rating,
      text,
      likes: 0,
      dislikes: 0,
      status: 'pending',
      parent: null,
      created_at: Date.now()
    });

    toast('نظر شما ثبت شد و پس از تأیید مدیر نمایش داده می‌شود', 'success');
    form.reset();
    state.reviewDraftRatings[productId] = 0;
  });
}

function submitReply(event, productId, parentId) {
  event.preventDefault();

  if (!isLoggedIn()) {
    toast('برای پاسخ دادن باید وارد شوید', 'warning');
    return;
  }

  const form = event.target;
  const text = form.text.value.trim();

  if (!text) {
    toast('متن پاسخ الزامی است', 'warning');
    return;
  }

  if (window.serverAuth && serverAuth()) {
    AryaServer.createReview({ product_id: productId, user_name: state.currentUser.name, rating: 0, text, parent: parentId })
      .then(r => {
        if (!r.ok) { toast(r.msg || 'خطا در ثبت پاسخ', 'warning'); return; }
        state.reviews.push({
          id: r.data.id, product_id: productId, user_name: state.currentUser.name,
          rating: 0, text, likes: 0, dislikes: 0, status: 'pending', parent: parentId,
          created_at: Date.now(),
        });
        toast('پاسخ شما ثبت شد و پس از تأیید مدیر نمایش داده می‌شود', 'success');
        form.reset();
        render();
      })
      .catch(() => toast('ارتباط با سرور برقرار نشد', 'warning'));
    return;
  }

  safeActionWithRender(() => {
    state.reviews.push({
      id: 'rev_' + utils.generateId(),
      product_id: productId,
      user_name: state.currentUser.name,
      rating: 0,
      text,
      likes: 0,
      dislikes: 0,
      status: 'pending',
      parent: parentId,
      created_at: Date.now()
    });

    toast('پاسخ شما ثبت شد و پس از تأیید مدیر نمایش داده می‌شود', 'success');
    form.reset();
  });
}

function toggleReviewVote(reviewId, type) {
  const r = state.reviews.find(x => x.id === reviewId);
  if (!r) return;

  r.likes =
    typeof r.likes === 'number' ? r.likes : parseInt(r.likes || '0', 10) || 0;
  r.dislikes =
    typeof r.dislikes === 'number'
      ? r.dislikes
      : parseInt(r.dislikes || '0', 10) || 0;

  const prev = r._clientReaction || null;

  if (type === 'like') {
    if (prev === 'like') {
      r.likes = Math.max(0, r.likes - 1);
      r._clientReaction = null;
    } else {
      if (prev === 'dislike') {
        r.dislikes = Math.max(0, r.dislikes - 1);
      }
      r.likes += 1;
      r._clientReaction = 'like';
    }
  } else if (type === 'dislike') {
    if (prev === 'dislike') {
      r.dislikes = Math.max(0, r.dislikes - 1);
      r._clientReaction = null;
    } else {
      if (prev === 'like') {
        r.likes = Math.max(0, r.likes - 1);
      }
      r.dislikes += 1;
      r._clientReaction = 'dislike';
    }
  }

  if (window.serverAuth && serverAuth()) {
    const acts = [];
    if (prev) acts.push(prev === 'like' ? 'unlike' : 'undislike');
    if (prev !== type) acts.push(type === 'like' ? 'like' : 'dislike');
    acts.reduce((p, k) => p.then(() => AryaServer.voteReview(reviewId, k)), Promise.resolve())
        .catch(() => {});
  }

  if (typeof document !== 'undefined') {
    const nodes = document.querySelectorAll(`[data-review-id="${reviewId}"]`);
    nodes.forEach(node => {
      const likeBtn = node.querySelector('[data-review-like]');
      const dislikeBtn = node.querySelector('[data-review-dislike]');
      if (likeBtn) {
        const span = likeBtn.querySelector('span:last-child');
        if (span) span.textContent = String(r.likes);
        likeBtn.classList.toggle('bg-emerald-500/20', r._clientReaction === 'like');
        likeBtn.classList.toggle('text-emerald-300', r._clientReaction === 'like');
        if (r._clientReaction === 'like') {
          likeBtn.classList.remove('bg-white/5', 'hover:bg-white/10');
        } else {
          likeBtn.classList.add('bg-white/5', 'hover:bg-white/10');
        }
      }
      if (dislikeBtn) {
        const span = dislikeBtn.querySelector('span:last-child');
        if (span) span.textContent = String(r.dislikes);
        dislikeBtn.classList.toggle('bg-rose-500/20', r._clientReaction === 'dislike');
        dislikeBtn.classList.toggle('text-rose-300', r._clientReaction === 'dislike');
        if (r._clientReaction === 'dislike') {
          dislikeBtn.classList.remove('bg-white/5', 'hover:bg-white/10');
        } else {
          dislikeBtn.classList.add('bg-white/5', 'hover:bg-white/10');
        }
      }
    });
  }
}

function setReviewFilter(filter, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  state.reviewFilter = filter;
  state.reviewsToShow = 3;
  
  const scrollY = window.scrollY;
  render();
  
  setTimeout(() => {
    window.scrollTo(0, scrollY);
  }, 0);
}

function loadMoreReviews(productId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  const scrollY = window.scrollY;
  state.reviewsToShow += 5;
  
  render();
  
  setTimeout(() => {
    window.scrollTo(0, scrollY);
  }, 0);
}

// ───── مودال پاسخ‌ها ─────
function openReviewRepliesModal(reviewId, productId) {
  state.reviewRepliesModal = { reviewId, productId };
  openGlobalModal();
  preserveScrollAndRender();
}

function closeReviewRepliesModal() {
  state.reviewRepliesModal = null;
  closeGlobalModal();
  preserveScrollAndRender();
}

function renderReviewRepliesModal(productId) {
  const m = state.reviewRepliesModal;
  if (!m || m.productId !== productId) return '';

  const all = getProductReviews(productId).filter(r => r.status === 'approved');
  const root = all.find(r => r.id === m.reviewId);
  if (!root) return '';

  const children = all.filter(r => r.parent === root.id);

  return `
    <div class="fixed inset-0 z-[200] flex items-center justify-center p-4 modal-overlay bg-black/70" onclick="if(event.target===this){closeReviewRepliesModal()}">
      <div class="glass-strong rounded-3xl p-4 sm:p-6 lg:p-8 max-w-xl w-full max-h-[90%] flex flex-col animate-scale" dir="rtl">
        
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base sm:text-lg font-black flex items-center gap-2">
            <span class="inline-flex text-sky-300">${aryIcon('chat', 'w-5 h-5')}</span>
            <span>گفت‌وگوی مربوط به این نظر</span>
          </h2>
          <button type="button" class="text-white/60 hover:text-white text-lg" onclick="closeReviewRepliesModal()">${aryIcon('x', 'w-5 h-5')}</button>
        </div>

        <div class="flex-1 overflow-y-auto no-scrollbar rounded-3xl bg-black/40 p-3 sm:p-4 space-y-3">

          <div class="flex justify-start">
            <div class="max-w-[85%] flex gap-2 items-start">
              <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs sm:text-sm" aria-hidden="true">
                ${(root.user_name || 'ک')[0]}
              </div>
              <div class="bg-white/5 rounded-2xl rounded-bl-sm px-3 py-2 text-xs sm:text-sm text-white/90 shadow-sm">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span class="font-semibold text-[11px] sm:text-xs">${aryEsc(root.user_name)}</span>
                  <span class="text-[10px] text-white/40">${utils.formatDateTime(root.created_at)}</span>
                </div>
                ${
                  root.rating
                    ? `<div class="flex items-center gap-1 text-amber-400 text-[10px] mb-1">
                         ${utils.renderStars(root.rating, 'text-[10px]')}
                         <span class="text-white/60">(${root.rating})</span>
                       </div>`
                    : ''
                }
                <p class="leading-relaxed">${aryEsc(root.text)}</p>
              </div>
            </div>
          </div>

          ${
            children.length
              ? children
                  .map(
                    c => `
              <div class="flex justify-end">
                <div class="max-w-[85%] flex gap-2 items-start flex-row-reverse">
                  <div class="w-8 h-8 rounded-full bg-blue-500/40 flex items-center justify-center text-xs sm:text-sm" aria-hidden="true">
                    ${(c.user_name || 'ک')[0]}
                  </div>
                  <div class="bg-blue-500/20 border border-blue-400/40 rounded-2xl rounded-br-sm px-3 py-2 text-xs sm:text-sm text-white shadow-sm">
                    <div class="flex items-center justify-between gap-2 mb-1">
                      <span class="font-semibold text-[11px] sm:text-xs">${aryEsc(c.user_name)}</span>
                      <span class="text-[10px] text-white/50">${utils.formatDateTime(c.created_at)}</span>
                    </div>
                    <p class="leading-relaxed">${aryEsc(c.text)}</p>
                    <div class="mt-1 flex items-center gap-2 text-[10px] text-white/50">
                      <button 
                        type="button"
                        data-review-like
                        onclick="toggleReviewVote('${c.id}', 'like')" 
                        class="px-1.5 py-0.5 rounded-lg flex items-center gap-1 ${
                          c._clientReaction === 'like'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-white/5 hover:bg-white/10'
                        }"
                      >
                        ${aryIcon('thumbup', 'w-4 h-4')} <span>${c.likes || 0}</span>
                      </button>
                      <button 
                        type="button"
                        data-review-dislike
                        onclick="toggleReviewVote('${c.id}', 'dislike')" 
                        class="px-1.5 py-0.5 rounded-lg flex items-center gap-1 ${
                          c._clientReaction === 'dislike'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-white/5 hover:bg-white/10'
                        }"
                      >
                        ${aryIcon('thumbdown', 'w-4 h-4')} <span>${c.dislikes || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `
                  )
                  .join('')
              : `<p class="text-xs sm:text-sm text-white/60 text-center mt-2">هنوز پاسخی برای این نظر ثبت نشده است.</p>`
          }
        </div>

        ${
          isLoggedIn()
            ? `
          <form class="mt-3 space-y-2" onsubmit="submitReply(event, '${productId}', '${root.id}')">
            <div class="text-[11px] text-white/50 mb-1">
              در حال پاسخ به نظر <span class="font-semibold text-white/80">${aryEsc(root.user_name)}</span>
            </div>
            <textarea name="text" class="input-style w-full text-xs sm:text-sm" rows="2" placeholder="پاسخ خود را درباره این نظر بنویسید..."></textarea>
            <div class="flex justify-end">
              <button class="btn-primary px-4 py-2 rounded-xl text-xs" type="submit">ارسال پاسخ</button>
            </div>
          </form>
        `
            : `
          <div class="mt-3 text-xs text-white/50">
            برای پاسخ دادن ابتدا 
            <button onclick="goTo('login')" class="text-blue-400 underline" type="button">وارد شوید</button>
          </div>
        `
        }
      </div>
    </div>
  `;
}

// ───── Render Review Item ─────
function renderReviewItem(review, depth, productId, options) {
  const opts = options || {};
  const indent = Math.min(depth, 4);
  const hasChildren =
    review.children && Array.isArray(review.children) && review.children.length > 0;

  return `
    <div class="glass rounded-2xl p-4 mb-3 mr-${indent * 4} transition-all hover:shadow-xl hover:shadow-blue-500/10" data-review-id="${review.id}">
      
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center text-sm font-bold text-white" aria-hidden="true">
            ${(review.user_name || 'ک')[0]}
          </div>
          <div>
            <div class="text-sm font-semibold">${aryEsc(review.user_name)}</div>
            <div class="text-[11px] text-white/40">${utils.formatDateTime(review.created_at)}</div>
          </div>
        </div>

        ${
          review.rating
            ? `<div class="flex items-center gap-1 text-amber-400 text-xs">
                 ${utils.renderStars(review.rating, 'text-xs')}
                 <span class="text-white/60">(${review.rating})</span>
               </div>`
            : ''
        }
      </div>

      <p class="text-sm text-white/80 mb-3 leading-relaxed">${aryEsc(review.text)}</p>

      <div class="flex items-center justify-between text-xs text-white/50 mb-2">
        <div class="flex items-center gap-2">
          <button 
            type="button"
            data-review-like
            onclick="toggleReviewVote('${review.id}', 'like')" 
            class="px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${
              review._clientReaction === 'like'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-white/5 hover:bg-white/10 hover:text-emerald-300'
            }"
            aria-label="پسندیدن این نظر"
          >
            ${aryIcon('thumbup', 'w-4 h-4')} <span>${review.likes || 0}</span>
          </button>
          <button 
            type="button"
            data-review-dislike
            onclick="toggleReviewVote('${review.id}', 'dislike')" 
            class="px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${
              review._clientReaction === 'dislike'
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-white/5 hover:bg-white/10 hover:text-rose-300'
            }"
            aria-label="نپسندیدن این نظر"
          >
            ${aryIcon('thumbdown', 'w-4 h-4')} <span>${review.dislikes || 0}</span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          ${
            hasChildren && !opts.hideRepliesButton
              ? `
            <button
              type="button"
              class="px-2 py-1 rounded-lg glass text-[11px] flex items-center gap-1 hover:bg-white/10 transition-all"
              onclick="openReviewRepliesModal('${review.id}', '${productId}')"
            >
              ${aryIcon('chat', 'w-4 h-4 inline-block align-[-3px] ml-1')} پاسخ‌ها (${review.children.length})
            </button>
          `
              : ''
          }
          <button 
            type="button"
            onclick="this.closest('.glass').querySelector('.reply-form').classList.toggle('hidden'); event.preventDefault();" 
            class="text-blue-400 hover:text-blue-300 transition-all"
          >
            پاسخ دادن
          </button>
        </div>
      </div>

      ${
        isLoggedIn()
          ? `
        <form class="hidden mt-3 space-y-2 reply-form" onsubmit="submitReply(event, '${productId}', '${review.id}')">
          <textarea name="text" class="input-style w-full text-sm" rows="2" placeholder="پاسخ خود را بنویسید..."></textarea>
          <div class="flex justify-end">
            <button class="btn-primary px-4 py-2 rounded-xl text-xs" type="submit">ارسال پاسخ</button>
          </div>
        </form>
        `
          : `
        <div class="hidden mt-3 text-xs text-white/50 reply-form">
          برای پاسخ دادن ابتدا 
          <button onclick="goTo('login')" class="text-blue-400 underline" type="button">وارد شوید</button>
        </div>
        `
      }
    </div>
  `;
}

// ========== بخش گالری محصول ==========

function buildProductGallery(product) {
  if (!product) return [];
  
  const gallery = [];
  const seen = new Set();

  const mainCandidates = [
    product.main_image,
    product.image,
    product.mainImage
  ];

  mainCandidates.forEach(img => {
    if (img && typeof img === 'string' && img.trim() && !seen.has(img)) {
      gallery.push(img.trim());
      seen.add(img);
    }
  });

  const arrayFields = ['images', 'gallery'];
  arrayFields.forEach(field => {
    if (Array.isArray(product[field])) {
      product[field].forEach(img => {
        if (img && typeof img === 'string' && img.trim() && !seen.has(img)) {
          gallery.push(img.trim());
          seen.add(img);
        }
      });
    }
  });

  return gallery;
}

function openProductGalleryLightbox(productId) {
  state.productGalleryLightbox = { productId: productId };
  state.isAnimating = false;
  openGlobalModal();
  preserveScrollAndRender();
}

function closeProductGalleryLightbox() {
  state.productGalleryLightbox = null;
  state.isAnimating = false;
  closeGlobalModal();
  preserveScrollAndRender();
}

function changeGalleryIndex(delta, galleryLength) {
  if (galleryLength <= 1 || state.isAnimating) return;
  
  state.isAnimating = true;
  
  const max = galleryLength - 1;
  let next = state.productGalleryIndex + delta;
  
  if (next < 0) next = max;
  if (next > max) next = 0;
  
  const product = state.selectedProduct;
  if (!product) return;

  const gallery = buildProductGallery(product);
  const currentImg = document.querySelector('[data-gallery-main]');
  
  if (!currentImg) return;

  currentImg.style.opacity = '0';
  
  setTimeout(() => {
    state.productGalleryIndex = next;
    currentImg.src = gallery[next];
    currentImg.style.opacity = '1';
    
    const thumbs = document.querySelectorAll('[data-gallery-thumb]');
    thumbs.forEach(btn => {
      const idx = Number(btn.getAttribute('data-index') || '0');
      if (idx === next) {
        btn.classList.add('border-blue-400');
        btn.classList.remove('border-white/30');
      } else {
        btn.classList.remove('border-blue-400');
        btn.classList.add('border-white/30');
      }
    });

    const counter = document.querySelector('.gallery-counter');
    if (counter) {
      counter.textContent = `${next + 1} / ${galleryLength}`;
    }

    state.isAnimating = false;
  }, 200);
}

function setGalleryIndexDirect(index, galleryLength) {
  if (state.isAnimating) return;
  state.productGalleryIndex = index;
  changeGalleryIndex(0, galleryLength);
}

function renderThumbnail(img, i, idx, product, galleryLength) {
  const isActive = i === idx;
  const thumbnailClass = `flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
    isActive ? 'border-blue-400' : 'border-white/30 hover:border-blue-300'
  } bg-black/40`;

  return `
    <button
      type="button"
      data-gallery-thumb
      data-index="${i}"
      class="${thumbnailClass}"
      onclick="setGalleryIndexDirect(${i}, ${galleryLength})"
      aria-label="تصویر ${i + 1} از ${galleryLength}"
    >
      <img 
        src="${img}" 
        alt="${product.title} - تصویر ${i + 1}"
        class="w-full h-full object-cover"
        loading="lazy"
        onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center text-xl\\'>📦</div>';"
      >
    </button>
  `;
}

function renderProductGalleryLightbox(product, gallery) {
  const m = state.productGalleryLightbox;
  if (!m || m.productId !== product.id) return '';

  const maxIndex = Math.max(0, gallery.length - 1);
  const idx = Math.min(Math.max(0, state.productGalleryIndex), maxIndex);
  const currentImage = gallery[idx] || '';

  return `
    <div 
      class="fixed inset-0 z-[210] flex items-center justify-center p-4 modal-overlay bg-black/95"
      onclick="if(event.target===this) closeProductGalleryLightbox()"
    >
      <div class="relative w-full max-w-6xl max-h-[90vh] flex flex-col animate-scale">
        
        <div class="flex items-center justify-between mb-3 text-white px-2">
          <span class="text-sm text-white/70 truncate max-w-[200px] md:max-w-md">
            ${product.title}
          </span>
          <div class="flex items-center gap-3">
            <span class="text-xs bg-white/20 px-2 py-1 rounded-full gallery-counter">
              ${idx + 1} / ${gallery.length}
            </span>
            <button 
              type="button" 
              class="text-white/80 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10" 
              onclick="closeProductGalleryLightbox()"
              aria-label="بستن"
            >
              ✕
            </button>
          </div>
        </div>

        <div class="relative flex items-center justify-center bg-black/40 rounded-2xl overflow-hidden" style="height: 60vh;">
          ${currentImage ? `
            <img 
              src="${currentImage}" 
              alt="${product.title}"
              data-gallery-main
              class="max-h-full max-w-full object-contain transition-opacity duration-200"
              style="opacity: 1;"
              onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'text-6xl text-white/60\\'>📦</div>';"
            >
          ` : `
            <div class="flex items-center justify-center text-white/30">${aryIcon('box', 'w-16 h-16')}</div>
          `}

          ${gallery.length > 1 ? `
            <button 
              type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl"
              onclick="changeGalleryIndex(1, ${gallery.length})"
              aria-label="تصویر بعدی"
            >
              →
            </button>
            <button 
              type="button"
              class="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl"
              onclick="changeGalleryIndex(-1, ${gallery.length})"
              aria-label="تصویر قبلی"
            >
              ←
            </button>
          ` : ''}
        </div>

        ${gallery.length > 1 ? `
          <div data-keep-scroll="catchips" class="flex gap-2 overflow-x-auto mt-4 px-2 py-2 justify-center">
            ${gallery.map((img, i) => renderThumbnail(img, i, idx, product, gallery.length)).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ========== افزودن به سبد خرید (اصلاح شده) ==========
function findProductById(id) {
  id = String(id);
  return (state.products || []).find(p => String(p.id) === id)
      || (state.selectedProduct && String(state.selectedProduct.id) === id ? state.selectedProduct : null);
}

// افزودن به سبد از روی شناسه — امن برای onclick (بدون جاسازی JSON در HTML)
function addToCartById(id) {
  const product = findProductById(id);
  if (!product) { toast('محصول یافت نشد', 'error'); return; }
  if ((product.stock || 0) <= 0) { toast('این محصول موجود نیست', 'warning'); return; }
  addToCart(product);
}

function openProductById(id) {
  const product = findProductById(id);
  if (product) { state.selectedProduct = product; goTo('product'); }
  else toast('محصول یافت نشد', 'error');
}

// سازگاری با فراخوانی‌های قدیمی
function addToCartFromProduct(product) { addToCartById(product && product.id); }

window.addToCartById = addToCartById;
window.openProductById = openProductById;
window.findProductById = findProductById;

// ========== بخش ویدیو محصول (بی‌رنگ) ==========

// استخراج آدرس و MIME از آیتم ویدیو (رشته، dataURL یا آبجکت {name,url})
// نکته: نوع مدیا هرگز هاردکد نمی‌شود؛ اگر قابل‌تشخیص نبود خالی می‌ماند
// تا خودِ مرورگر فرمت را استنتاج کند (رفع باگ پخش نشدن webm/mov)
function videoSrcInfo(v) {
  let url = '';
  if (typeof v === 'string') url = v;
  else if (v && typeof v === 'object') url = v.url || v.src || '';
  let mime = '';
  const dm = /^data:(video\/[a-z0-9.+-]+)[;,]/i.exec(url);
  if (dm) mime = dm[1].toLowerCase();
  else {
    const ext = ((url.split(/[?#]/)[0] || '').match(/\.([a-z0-9]+)$/i) || [])[1];
    if (ext) {
      const map = { mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm',
                    ogv: 'video/ogg', ogg: 'video/ogg', mov: 'video/quicktime' };
      mime = map[ext.toLowerCase()] || '';
    }
  }
  return { url, mime };
}

function openVideoPlayer(videoIndex, videos) {
  window.AryaVideoPlayer.open(videoIndex, videos);
}
window.openVideoPlayer = openVideoPlayer;

function closeVideoPlayer() { window.AryaVideoPlayer.close(); }
window.closeVideoPlayer = closeVideoPlayer;

function changeVideo(delta) { window.AryaVideoPlayer.step(delta); }
window.changeVideo = changeVideo;

function renderVideoPlayerModal() { return ''; /* پلیر مستقل: AryaVideoPlayer در body */ }

// ========== بخش ویدیو محصول در صفحه (بی‌رنگ) ==========
function renderProductVideos(product) {
  // بررسی دقیق وجود ویدیو
  if (!product || !product.videos || !Array.isArray(product.videos) || product.videos.length === 0) {
    return '';
  }

  const videos = product.videos;
  const hasMultipleVideos = videos.length > 1;
  
  // ذخیره ویدیوها در state برای دسترسی
  state.productVideos = videos;

  return `
    <section class="mb-16 video-section">
      <!-- هدر ویدیوها -->
      <div class="flex items-center gap-3 mb-6">
        <div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl">
          ${aryIcon('video', 'w-6 h-6 text-blue-300')}
        </div>
        <div>
          <h2 class="text-2xl font-black">ویدیوهای محصول</h2>
          <p class="text-white/60 text-sm">${videos.length} ویدیو</p>
        </div>
      </div>

      <!-- گرید ویدیوها (کوچک‌تر شده - به‌صورت بندانگشتی) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-2xl">
        ${videos.slice(0, 2).map((video, index) => {
          const videoTitle = typeof video === 'object' && video.name 
            ? video.name 
            : `ویدیو ${index + 1}`;
          
          const vInfo = videoSrcInfo(video);
          return `
            <div 
              class="glass rounded-xl overflow-hidden cursor-pointer group hover:shadow-lg hover:shadow-white/10 transition-all border border-white/10 hover:border-white/30"
              onclick="openVideoPlayer(${index})"
            >
              <div class="relative aspect-video bg-white/5 flex items-center justify-center">
                <video muted playsinline preload="metadata" src="${aryEsc(vInfo.url)}#t=0.9" tabindex="-1" class="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none"></video>
                
                <!-- آیکون پخش -->
                <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div class="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-base transform group-hover:scale-110 transition-transform">
                    ▶
                  </div>
                </div>
                
                ${index === 0 && videos.length > 1 ? `
                  <div class="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[10px]">
                    +${videos.length - 1} ویدیو دیگر
                  </div>
                ` : ''}
              </div>
              
              <div class="p-2">
                <h3 class="font-semibold text-xs truncate">${aryEsc(videoTitle)}</h3>
                <p class="text-white/40 text-[10px] mt-0.5">برای پخش کلیک کنید</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      ${videos.length > 2 ? `
        <div class="text-center mt-4">
          <button 
            onclick="openVideoPlayer(0)"
            class="btn-ghost px-6 py-2 rounded-xl text-sm inline-flex items-center gap-2"
          >
            <span>مشاهده همه ${videos.length} ویدیو</span>
            <span>←</span>
          </button>
        </div>
      ` : ''}
    </section>
  `;
}

// ========== بخش مقاله محصول ==========
function renderProductArticle(article) {
  if (!article || !article.trim()) return '';

  const wordCount = article.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return `
    <section class="mb-16 article-section">
      <div class="relative mb-8">
        <div class="absolute -top-6 right-0 w-32 h-32 bg-gradient-to-br from-blue-600/20 to-sky-600/20 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-6 left-0 w-40 h-40 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-full blur-3xl"></div>
        
        <div class="relative flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h8v8h-8v-8z" />
            </svg>
          </div>
          <div>
            <h2 class="text-3xl font-black bg-gradient-to-l from-white to-white/70 bg-clip-text text-transparent">مقاله محصول</h2>
            <p class="text-white/50 text-sm mt-1">اطلاعات تکمیلی و راهنمای استفاده</p>
          </div>
        </div>
      </div>

      <div class="article-container relative">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-sky-500/5 rounded-3xl"></div>
        
        <div class="relative glass rounded-3xl overflow-hidden border border-white/10">
          <div class="h-2 bg-gradient-to-l from-blue-500 via-sky-500 to-pink-500"></div>
          
          <div class="p-6 lg:p-10">
            <div class="flex items-center gap-3 mb-6 text-sm text-white/40 border-b border-white/10 pb-4">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>زمان مطالعه: ${readTime} دقیقه</span>
              </span>
              <span class="w-1 h-1 rounded-full bg-white/20"></span>
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>مقاله تخصصی</span>
              </span>
            </div>
            
            <div class="article-content prose prose-invert prose-blue max-w-none
                        prose-headings:text-white prose-headings:font-bold
                        prose-p:text-white/80 prose-p:leading-relaxed
                        prose-strong:text-blue-300
                        prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300
                        prose-ul:text-white/80 prose-ol:text-white/80
                        prose-li:marker:text-blue-400
                        prose-blockquote:border-r-blue-500 prose-blockquote:bg-white/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-lg
                        prose-hr:border-white/10
                        prose-img:rounded-xl prose-img:shadow-lg">
              ${article}
            </div>
            
            <div class="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <div class="flex items-center gap-2 text-sm text-white/40">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>به‌روزرسانی: ${utils.formatDate(new Date().toISOString())}</span>
              </div>
              
              <button onclick="shareArticle()" class="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-white/10 transition-all group">
                <svg class="w-4 h-4 text-white/60 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span class="text-sm text-white/80 group-hover:text-white transition-colors">اشتراک‌گذاری</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function shareArticle() {
  const product = state.selectedProduct;
  if (!product) return;
  
  if (navigator.share) {
    navigator.share({
      title: product.title,
      text: product.article ? product.article.substring(0, 100) + '...' : '',
      url: window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast('لینک محصول کپی شد', 'success');
    }).catch(() => {
      toast('خطا در کپی لینک', 'error');
    });
  }
}

// ───── PRODUCT PAGE (نسخه نهایی) ─────
function renderProductPage() {
  const product = state.selectedProduct;
  if (!product) return renderShopPage();

  if (state.lastProductId !== product.id) {
    state.productGalleryIndex = 0;
    state.lastProductId = product.id;
    state.reviewFilter = 'all';
    state.reviewsToShow = 3;
  }

  const inStock = (product.stock || 0) > 0;
  const discount = utils.calculateDiscount(product.original_price, product.price);
  const category = state.categories.find(c => c.id === product.category);

  const allReviews = getProductReviews(product.id).filter(r => r.status === 'approved');
  const filteredReviews = getFilteredReviews(product.id);
  
  const ratings = filteredReviews.filter(r => r.rating > 0).map(r => r.rating);
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : '0.0';

  const reviewTree = buildReviewTree(filteredReviews);

  const relatedProducts = state.products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const inWishlist = isInWishlist(product.id);

  const gallery = buildProductGallery(product);
  const mainImage = gallery[0] || '';

  const maxIndex = Math.max(0, gallery.length - 1);
  if (state.productGalleryIndex > maxIndex) state.productGalleryIndex = 0;
  if (state.productGalleryIndex < 0) state.productGalleryIndex = 0;

  const currentDraftRating = state.reviewDraftRatings[product.id] || 0;
  const reviewFormId = `review-form-${product.id}`;

  const thumbLimit = 5;
  const visibleThumbs = gallery.slice(0, thumbLimit);
  const extraCount = gallery.length > thumbLimit ? gallery.length - thumbLimit : 0;

  // بررسی وجود مقاله و ویدیو
  const hasArticle = product.article && product.article.trim().length > 0;
  const hasVideos = product.videos && Array.isArray(product.videos) && product.videos.length > 0;
  
  const totalReviews = allReviews.length;
  const fiveStarCount = allReviews.filter(r => r.rating === 5).length;
  const fourStarCount = allReviews.filter(r => r.rating === 4).length;
  const threeStarCount = allReviews.filter(r => r.rating === 3).length;
  const twoStarCount = allReviews.filter(r => r.rating === 2).length;
  const oneStarCount = allReviews.filter(r => r.rating === 1).length;

  return `
    ${renderHeader()}

    <main class="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12 pb-28 lg:pb-16">

      <nav class="flex flex-wrap items-center gap-2 text-sm text-white/60 mb-6 lg:mb-8" aria-label="مسیر صفحه">
        <button onclick="goTo('home')" class="hover:text-white" type="button">خانه</button>
        <span>←</span>
        <button onclick="goTo('shop')" class="hover:text-white" type="button">فروشگاه</button>
        ${
          category
            ? `<span>←</span><button onclick="state.productFilter.category='${category.id}'; goTo('shop')" class="hover:text-white" type="button">${category.title}</button>`
            : ''
        }
        <span>←</span>
        <span class="text-white truncate max-w-[150px] lg:max-w-xs" title="${product.title}">${product.title}</span>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16 items-start">

        <!-- Gallery -->
        <div class="space-y-4">
          <div 
            class="glass rounded-3xl overflow-hidden cursor-pointer w-full flex items-center justify-center aspect-[4/3] sm:aspect-[16/10]"
            onclick="state.productGalleryIndex=0; openProductGalleryLightbox('${product.id}')"
          >
            ${
              mainImage
                ? `
                  <img 
                    src="${mainImage}" 
                    alt="${product.title}" 
                    class="w-full h-full object-contain"
                  >
                `
                : `<div class="text-white/25 flex justify-center" aria-hidden="true">${aryIcon('box','w-24 h-24 lg:w-32 lg:h-32')}</div>`
            }
          </div>

          ${
            gallery.length > 0
              ? `
            <div data-keep-scroll="toolbar" class="flex items-center gap-3 overflow-x-auto w-full">
              ${visibleThumbs
                .map(
                  (img, idx) => `
                <button
                  type="button"
                  class="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-white/10 hover:border-blue-400 transition-colors bg-black/30"
                  onclick="state.productGalleryIndex=${idx}; openProductGalleryLightbox('${product.id}')"
                  aria-label="تصویر ${idx + 1} محصول"
                >
                  ${
                    img
                      ? `<img src="${img}" alt="${product.title}" class="w-full h-full object-cover">`
                      : `<div class="w-full h-full flex items-center justify-center text-white/30">${aryIcon('box','w-6 h-6')}</div>`
                  }
                </button>
              `
                )
                .join('')}

              ${
                extraCount > 0
                  ? `
                <button
                  type="button"
                  class="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl glass flex items-center justify-center text-xs text-white/80 hover:bg-white/10"
                  onclick="state.productGalleryIndex=0; openProductGalleryLightbox('${product.id}')"
                >
                  +${extraCount}
                </button>
              `
                  : ''
              }
            </div>
          `
              : ''
          }
        </div>

        <!-- Info -->
        <div class="space-y-6">
          ${category ? `
            <span class="inline-block bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium">
              ${category.title}
            </span>
          ` : ''}

          <h1 class="text-2xl md:text-3xl lg:text-4xl font-black leading-snug">${product.title}</h1>

          <div class="flex flex-wrap items-center gap-3 text-sm">
            <div class="flex items-center gap-2">
              ${utils.renderStars(Number(avgRating), 'text-base')}
              <span class="text-white/60 text-sm">(${avgRating})</span>
            </div>
            <span class="text-white/40 text-xs">| ${filteredReviews.length} نظر</span>
            ${discount > 0 ? `
              <span class="text-xs px-2 py-1 rounded-full bg-rose-500/20 text-rose-300">
                -${discount}% تخفیف
              </span>
            ` : ''}
          </div>

          <p class="text-white/70 leading-relaxed text-sm md:text-base">
            ${product.description || ''}
          </p>

          <!-- Price & stock & wishlist -->
          <div class="glass rounded-2xl p-5 md:p-6 space-y-4">
            <div class="flex items-center justify-between gap-4">
              <span class="text-white/60 text-sm">قیمت:</span>
              <div class="text-left">
                <span class="text-2xl md:text-3xl font-black text-emerald-400">
                  ${utils.formatPrice(product.price)}
                </span>
                ${product.original_price > product.price ? `
                  <span class="block text-xs md:text-sm price-original">
                    ${utils.formatPrice(product.original_price)}
                  </span>
                ` : ''}
              </div>
            </div>

            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-white/60">موجودی:</span>
              <span class="${inStock ? 'text-emerald-400' : 'text-rose-400'} font-semibold">
                ${inStock ? `${product.stock} عدد` : 'ناموجود'}
              </span>
            </div>

            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-white/60">علاقه‌مندی:</span>
              <button 
                type="button"
                onclick="toggleWishlist('${product.id}')" 
                class="px-3 py-1.5 rounded-xl text-sm flex items-center gap-2 ${
                  inWishlist
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }"
                aria-pressed="${inWishlist ? 'true' : 'false'}"
              >
                <span class="inline-flex ${inWishlist ? 'text-rose-400' : 'text-white/50'}">${aryIcon('heart','w-5 h-5' + (inWishlist ? ' fill-current' : ''))}</span>
                <span>${inWishlist ? 'در لیست' : 'افزودن'}</span>
              </button>
            </div>

            <!-- دکمه اصلی افزودن به سبد خرید با id -->
            <button
              id="main-add-to-cart"
              type="button"
              class="btn-primary w-full mt-2 py-3 rounded-2xl text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
              onclick="addToCartById('${aryEsc(String(product.id))}')"
              ${inStock ? '' : 'disabled'}
            >
              ${inStock ? 'افزودن به سبد خرید' : 'ناموجود'}
            </button>
          </div>
        </div>
      </div>

      <!-- ===== بخش مقاله محصول ===== -->
      ${hasArticle ? renderProductArticle(product.article) : ''}

      <!-- ===== بخش ویدیوهای محصول ===== -->
      ${hasVideos ? renderProductVideos(product) : ''}

      <!-- ===== بخش نظرات کاربران ===== -->
      <section class="mb-16" id="reviews-section">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-lg shadow-amber-500/30">
              ⭐
            </div>
            <div>
              <h2 class="text-2xl font-black">نظرات کاربران</h2>
              <p class="text-white/60 text-sm">${totalReviews} نظر ثبت شده</p>
            </div>
          </div>
          
          <button 
            onclick="document.getElementById('review-form-container').scrollIntoView({behavior: 'smooth'})"
            class="btn-primary px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 w-full lg:w-auto justify-center group"
          >
            <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>ثبت نظر جدید</span>
          </button>
        </div>

        ${totalReviews > 0 ? `
          <div class="glass rounded-2xl p-5 mb-8">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div class="text-center lg:text-right">
                <div class="text-4xl font-black text-amber-400">${avgRating}</div>
                <div class="flex items-center justify-center lg:justify-start gap-1 my-2">
                  ${utils.renderStars(Number(avgRating), 'text-xl')}
                </div>
                <div class="text-white/60 text-sm">از مجموع ${totalReviews} نظر</div>
              </div>
              
              <div class="lg:col-span-2 space-y-2">
                ${[5, 4, 3, 2, 1].map(star => {
                  const count = star === 5 ? fiveStarCount :
                               star === 4 ? fourStarCount :
                               star === 3 ? threeStarCount :
                               star === 2 ? twoStarCount : oneStarCount;
                  const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                  
                  return `
                    <div class="flex items-center gap-2 text-sm">
                      <span class="w-8 text-amber-400 inline-flex items-center gap-1">${star}${aryIcon('star', 'w-4 h-4')}</span>
                      <div class="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div class="h-full bg-amber-400 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                      </div>
                      <span class="w-12 text-white/60">${count} نظر</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        ` : ''}

        ${totalReviews > 0 ? `
          <div class="flex flex-wrap items-center gap-2 mb-6">
            <span class="text-sm text-white/60 ml-2">فیلتر بر اساس امتیاز:</span>
            <button 
              onclick="setReviewFilter('all', event)"
              class="px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                state.reviewFilter === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'glass hover:bg-white/10'
              }"
            >
              همه
            </button>
            ${[5, 4, 3, 2, 1].map(star => {
              const count = star === 5 ? fiveStarCount :
                           star === 4 ? fourStarCount :
                           star === 3 ? threeStarCount :
                           star === 2 ? twoStarCount : oneStarCount;
              
              if (count === 0) return '';
              
              return `
                <button 
                  onclick="setReviewFilter('${star}', event)"
                  class="px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                    state.reviewFilter === String(star)
                      ? 'bg-amber-500 text-white' 
                      : 'glass hover:bg-white/10'
                  }"
                >
                  <span class="inline-flex items-center gap-1 text-amber-400">${star}${aryIcon('star', 'w-4 h-4')}</span>
                  <span class="text-[10px] opacity-70">(${count})</span>
                </button>
              `;
            }).join('')}
          </div>
        ` : ''}

        <div class="space-y-4 mb-8" id="reviews-list">
          ${reviewTree.length > 0 ? `
            ${reviewTree.slice(0, state.reviewsToShow).map(r => renderReviewItem(r, 0, product.id, { hideChildren: true })).join('')}
            
            ${reviewTree.length > state.reviewsToShow ? `
              <div class="text-center mt-8">
                <button 
                  onclick="loadMoreReviews('${product.id}', event)"
                  class="btn-ghost px-8 py-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2 hover:bg-white/10 transition-all group"
                >
                  <svg class="w-4 h-4 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7-7-7m14-6l-7-7-7 7" />
                  </svg>
                  <span>نمایش نظرات بیشتر (${reviewTree.length - state.reviewsToShow} نظر باقی‌مانده)</span>
                </button>
              </div>
            ` : ''}
          ` : `
            <div class="glass rounded-3xl p-12 text-center">
              <div class="mb-4 animate-float flex justify-center text-white/30">${aryIcon('chat', 'w-16 h-16')}</div>
              <h3 class="text-xl font-bold mb-2">هنوز نظری ثبت نشده است</h3>
              <p class="text-white/60 mb-6">شما می‌توانید اولین نفری باشید که نظر می‌دهید</p>
            </div>
          `}
        </div>

        <div id="review-form-container" class="glass rounded-2xl p-6 md:p-8">
          <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
            <span class="inline-flex">${aryIcon('edit', 'w-5 h-5')}</span>
            <span>ثبت نظر شما</span>
          </h3>

          ${
            isLoggedIn()
              ? `
            <form id="${reviewFormId}" class="space-y-4" onsubmit="submitReview(event, '${product.id}')">
              <div>
                <label class="block text-sm text-white/70 mb-2">امتیاز شما به این محصول:</label>
                <div class="flex items-center gap-2">
                  ${[1, 2, 3, 4, 5].map(v => `
                    <button
                      type="button"
                      data-star="${v}"
                      onclick="setReviewRating('${reviewFormId}', '${product.id}', ${v})"
                      class="text-2xl transition-all hover:scale-110 ${
                        currentDraftRating >= v ? 'text-amber-400' : 'text-white/30'
                      }"
                    >
                      ${aryIcon('star', 'w-5 h-5 fill-amber-400/60 text-amber-400')}
                    </button>
                  `).join('')}
                  <input type="hidden" name="rating" value="${currentDraftRating}">
                </div>
              </div>

              <div>
                <label class="block text-sm text-white/70 mb-2">متن نظر:</label>
                <textarea
                  name="text"
                  rows="5"
                  class="input-style w-full text-sm resize-none"
                  placeholder="تجربه خود از این محصول را بنویسید..."
                  required
                ></textarea>
              </div>

              <div class="flex items-center gap-2 text-xs text-white/40 bg-white/5 p-3 rounded-lg">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>نظر شما پس از تأیید مدیر در سایت نمایش داده می‌شود.</span>
              </div>

              <button
                type="submit"
                class="btn-primary w-full py-3 rounded-xl text-sm font-bold"
              >
                ارسال نظر
              </button>
            </form>
          `
              : `
            <div class="text-center py-8">
              <p class="text-white/60 mb-4">برای ثبت نظر باید وارد حساب کاربری خود شوید</p>
              <button 
                type="button" 
                onclick="goTo('login')" 
                class="btn-primary px-8 py-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>ورود / ثبت‌نام</span>
              </button>
            </div>
          `
          }
        </div>
      </section>

      <!-- Related products -->
      ${
        relatedProducts.length
          ? `
      <section class="mb-10">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg md:text-xl font-black flex items-center gap-2">
            <span class="inline-flex">${aryIcon('bag', 'w-5 h-5')}</span>
            <span>محصولات مرتبط</span>
          </h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          ${relatedProducts
            .map(
              p => `
            <button
              type="button"
              onclick="openProductById('${aryEsc(String(p.id))}')"
              class="glass rounded-2xl p-3 flex flex-col items-stretch text-right hover:bg-white/5 transition-colors"
            >
              <div class="w-full aspect-[4/3] rounded-xl overflow-hidden bg-black/30 mb-3 flex items-center justify-center">
                ${
                  p.image || p.main_image
                    ? `<img src="${p.image || p.main_image}" alt="${p.title}" class="w-full h-full object-contain">`
                    : `<div class="flex justify-center text-white/30">${aryIcon('box', 'w-10 h-10')}</div>`
                }
              </div>
              <div class="text-xs text-white/70 line-clamp-2 mb-1">${p.title}</div>
              <div class="text-sm font-bold text-emerald-400">${utils.formatPrice(p.price)}</div>
            </button>
          `
            )
            .join('')}
        </div>
      </section>
      `
          : ''
      }

    </main>

    <!-- دکمه شناور هوشمند (فقط وقتی دکمه اصلی دیده نشه) -->
    <div id="floating-add-to-cart" class="fixed inset-x-0 bottom-0 z-[120]" style="display: none; opacity: 0; transition: opacity 0.3s ease;">
      <div class="mx-auto max-w-7xl px-4 pb-4">
        <div class="rounded-3xl px-4 py-3 flex items-center justify-between gap-3" style="background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1);">
          <div class="flex flex-col">
            <span class="text-[11px] text-white/60 mb-0.5">قیمت</span>
            <div class="flex items-baseline gap-2">
              <span class="text-lg font-black text-emerald-400">${utils.formatPrice(product.price)}</span>
              ${product.original_price > product.price ? `
                <span class="text-[11px] price-original">${utils.formatPrice(product.original_price)}</span>
              ` : ''}
            </div>
          </div>
          <button
            type="button"
            class="btn-primary flex-1 py-2.5 rounded-2xl text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
            onclick="addToCartById('${aryEsc(String(product.id))}')"
            ${inStock ? '' : 'disabled'}
          >
            ${inStock ? 'افزودن به سبد خرید' : 'ناموجود'}
          </button>
        </div>
      </div>
    </div>

    ${renderReviewRepliesModal(product.id)}
    ${renderProductGalleryLightbox(product, gallery)}
    ${renderVideoPlayerModal()}
    
    <!-- اسکریپت کنترل دکمه شناور -->
    <script>
      (function() {
        const floatingBtn = document.getElementById('floating-add-to-cart');
        const mainBtn = document.getElementById('main-add-to-cart');
        
        if (!floatingBtn || !mainBtn) return;
        
        function checkVisibility() {
          const rect = mainBtn.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          
          // اگر دکمه اصلی در Viewport نباشه یا پایین‌تر از 80% صفحه باشه
          const isHidden = rect.bottom > windowHeight || rect.top < 0 || rect.bottom < 0;
          
          if (isHidden) {
            floatingBtn.style.display = 'block';
            setTimeout(() => {
              floatingBtn.style.opacity = '1';
            }, 50);
          } else {
            floatingBtn.style.opacity = '0';
            setTimeout(() => {
              floatingBtn.style.display = 'none';
            }, 350);
          }
        }
        
        window.addEventListener('scroll', checkVisibility, { passive: true });
        window.addEventListener('resize', checkVisibility, { passive: true });
        setTimeout(checkVisibility, 300);
      })();
    <\/script>
  `;
}


// ═══════════════════════════════════════════════════════════════
// PROFILE PAGE
// File: assets/js/profile page.js
// ═══════════════════════════════════════════════════════════════
(function () {
  // ───────── Initial sync with AppState ─────────
  const persisted = window.AppState ? AppState.get() : {};

  window.state.currentUser = state.currentUser || persisted.currentUser || null;
  window.state.user        = state.user        || persisted.user        || null;
  window.state.isAdmin     = typeof state.isAdmin === 'boolean'
    ? state.isAdmin
    : (persisted.isAdmin || false);

  if (!state.user && state.currentUser) {
    state.user = {
      ...state.currentUser,
      addresses: [],
      avatar: '',
      nationalId: state.currentUser.nationalId || ''
    };
  }

  // Tickets global array
  state.tickets = Array.isArray(state.tickets) ? state.tickets : (persisted.tickets || []);
  // User ticket modal state
  state.userTicketModal = state.userTicketModal || {
    open: false,
    subject: '',
    message: '',
    priority: 'normal'
  };

  // ───────── Navigation ─────────
  function navigate(page) {
    if (typeof goTo === 'function') goTo(page);
    setTimeout(() => {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {}
    }, 0);
  }

  // ───────── Logout (با مودال تایید) ─────────
  function logoutUser() {
    state.confirmModal = {
      type: 'logout',
      title: 'خروج از حساب کاربری',
      message: 'آیا مطمئن هستید که می‌خواهید از حساب خود خارج شوید؟',
      icon: aryIcon('logout', 'w-14 h-14 text-rose-300'),
      confirmText: 'خروج',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        if (serverAuth()) { try { AryaServer.logout().catch(() => {}); } catch (e) {} }
        state.user = null;
        state.currentUser = null;
        state.isAdmin = false;
        if (window.AppState) {
          AppState.set({ user: null, currentUser: null, isAdmin: false, loggedIn: false });
        }
        state.confirmModal = null;
        toast('از حساب خارج شدید', 'info');
        goTo('home');
        render();
      }
    };
    render();
  }

  // ───────── Helpers ─────────
  function numericMask(el, maxLen) {
    if (!el) return;
    el.value = String(el.value || '').replace(/\D+/g, '').slice(0, maxLen || 50);
  }

  function autoTitle(i) {
    return `آدرس ${i + 1}`;
  }

  function normalizeAddresses() {
    if (!state.user) return;
    const arr = Array.isArray(state.user.addresses) ? state.user.addresses : [];
    state.user.addresses = arr.map((it, idx) => {
      if (typeof it === 'string') {
        return { title: autoTitle(idx), full: it.trim(), postal: '', plaque: '', unit: '' };
      }
      return {
        title: (it.title || '').trim() || autoTitle(idx),
        full: (it.full || '').trim(),
        postal: String(it.postal || '').replace(/\D+/g, '').slice(0, 10),
        plaque: String(it.plaque || '').replace(/\D+/g, ''),
        unit: String(it.unit || '').replace(/\D+/g, '')
      };
    });
  }

  // ───────── Profile update (فقط نام و موبایل) ─────────
  function updateUserProfile() {
    const name = String(document.getElementById('profile-name')?.value || '').trim();
    const phone = String(document.getElementById('profile-phone')?.value || '').trim();
    const emailEl = document.getElementById('profile-email');
    const email = String((emailEl && emailEl.value) || '').trim().toLowerCase();

    if (name.length < 3) return toast('نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد', 'warning');
    if (phone && !/^09[0-9]{9}$/.test(phone)) return toast('شماره موبایل نامعتبر است', 'warning');
    if (emailEl && email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return toast('قالب ایمیل نامعتبر است', 'warning');

    if (serverAuth()) {
      AryaServer.update({ name, ...(phone ? { phone } : {}), ...(emailEl && email ? { email } : {}) }).then(r => {
        if (!r.ok) toast(r.msg || 'خطا در ذخیره روی سرور', 'warning');
      });
    }
    state.user.name = name;
    if (phone) state.user.phone = phone;
    if (emailEl && email) state.user.email = email;

    state.currentUser = { ...(state.currentUser || {}), name, phone, ...(emailEl && email ? { email } : {}) };

    try {
      const users = JSON.parse(localStorage.getItem('arya_users_v1') || '[]');
      const uidx = users.findIndex(u => u.id === state.user.id || u.email === state.user.email);
      if (uidx >= 0) { users[uidx] = { ...users[uidx], name, ...(phone ? {phone} : {}), ...(email ? {email} : {}) }; }
      localStorage.setItem('arya_users_v1', JSON.stringify(users));
    } catch(e) {}

    if (window.AppState) AppState.set({ user: state.user, currentUser: state.currentUser });
    if (window.AryaDB) AryaDB.upsert('users', { id: state.user.id, name, phone, ...(email ? { email } : {}) });
    if (window.persistUserToServer) persistUserToServer({ id: state.user.id, name, phone, ...(email ? { email } : {}) });

    toast('پروفایل بروزرسانی شد');
    render();
  }

  // ───────── ذخیرهٔ مشخصات حساب (به‌جز کد ملی) از تب تنظیمات ─────────
  function updateUserAccount() {
    const name = String(document.getElementById('settings-name')?.value || '').trim();
    const email = String(document.getElementById('settings-email')?.value || '').trim().toLowerCase();
    const phone = String(document.getElementById('settings-phone')?.value || '').trim();

    if (name.length < 3) return toast('نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد', 'warning');
    if (!/^09[0-9]{9}$/.test(phone)) return toast('شماره موبایل معتبر لازم است (۰۹xxxxxxxxx)', 'warning');
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return toast('قالب ایمیل نامعتبر است', 'warning');

    const payload = { name, phone, ...(email ? { email } : {}) };
    if (serverAuth()) {
      AryaServer.update(payload).then(r => {
        if (!r.ok) toast(r.msg || 'خطا در ذخیره روی سرور', 'warning');
      });
    }
    state.user.name = name; state.user.phone = phone;
    if (email) state.user.email = email;
    state.currentUser = { ...(state.currentUser || {}), name, phone, ...(email ? { email } : {}) };

    try {
      const users = JSON.parse(localStorage.getItem('arya_users_v1') || '[]');
      const uidx = users.findIndex(u => u.id === state.user.id || u.email === state.user.email);
      if (uidx >= 0) users[uidx] = { ...users[uidx], name, phone, ...(email ? { email } : {}) };
      localStorage.setItem('arya_users_v1', JSON.stringify(users));
    } catch (e) {}

    if (window.AppState) AppState.set({ user: state.user, currentUser: state.currentUser });
    if (window.AryaDB) AryaDB.upsert('users', { id: state.user.id, name, phone, ...(email ? { email } : {}) });
    if (window.persistUserToServer) persistUserToServer({ id: state.user.id, ...payload });

    toast('مشخصات حساب ذخیره شد');
    render();
  }

  // ───────── کد ملی (در تب تنظیمات) ─────────
  function updateUserNationalId() {
    const nationalId = String(document.getElementById('settings-nid')?.value || '').trim();
    if (nationalId && nationalId.length !== 10) return toast('کد ملی باید دقیقاً ۱۰ رقم باشد', 'warning');

    if (serverAuth()) {
      AryaServer.update({ national_id: nationalId }).then(r => {
        if (!r.ok) toast(r.msg || 'خطا در ذخیره روی سرور', 'warning');
      });
    }
    state.user.nationalId = nationalId;
    state.currentUser = { ...(state.currentUser || {}), nationalId };

    try {
      const users = JSON.parse(localStorage.getItem('arya_users_v1') || '[]');
      const uidx = users.findIndex(u => u.id === state.user.id || u.email === state.user.email);
      if (uidx >= 0) { users[uidx] = { ...users[uidx], nationalId }; }
      localStorage.setItem('arya_users_v1', JSON.stringify(users));
    } catch(e) {}

    if (window.AppState) AppState.set({ user: state.user, currentUser: state.currentUser });
    if (window.persistUserToServer) persistUserToServer({ id: state.user.id, national_id: nationalId });

    toast('کد ملی ذخیره شد');
    render();
  }

  // ───────── Addresses ─────────
  let _addrSyncT = null;
  function syncAddressesSoon() {
    if (!serverAuth() || !state.user) return;
    clearTimeout(_addrSyncT);
    _addrSyncT = setTimeout(() => {
      AryaServer.update({ addresses: (state.user.addresses || []).slice(0, 20) })
        .then(r => { if (!r.ok) toast(r.msg || 'همگام‌سازی نشانی‌ها روی سرور ناموفق بود', 'warning'); });
    }, 800);
  }

  function addAddressFromForm() {
    if (!state.user) return;

    normalizeAddresses();
    const arr = state.user.addresses;

    if (arr.length >= 10) return toast('حداکثر ۱۰ آدرس مجاز است', 'warning');

    const title = String(document.getElementById('addr-title')?.value || '').trim() || autoTitle(arr.length);
    const postal = String(document.getElementById('addr-postal')?.value || '').replace(/\D+/g, '');
    const full = String(document.getElementById('addr-full')?.value || '').trim();
    const plaque = String(document.getElementById('addr-plaque')?.value || '').replace(/\D+/g, '');
    const unit = String(document.getElementById('addr-unit')?.value || '').replace(/\D+/g, '');

    if (!/^\d{10}$/.test(postal)) return toast('کد پستی باید دقیقاً ۱۰ رقم باشد', 'warning');
    if (!full) return toast('آدرس کامل را وارد کنید', 'warning');

    arr.push({ title, full, postal, plaque, unit });
    syncAddressesSoon();

    if (window.AppState) AppState.set({ user: state.user, tickets: state.tickets });

    toast('آدرس جدید ذخیره شد');
    render();
  }

  function openEditAddressModal(i) {
    if (!state.user) return;

    normalizeAddresses();
    const addr = state.user.addresses[i];
    if (!addr) return;

    state.confirmModal = {
      type: 'editAddress',
      title: 'ویرایش آدرس',
      icon: aryIcon('pin', 'w-14 h-14 text-sky-300'),
      message: `
        <form id="edit-address-form" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block text-sm text-white/70 mb-1">عنوان</label>
              <input id="edit-title" class="input-style w-full" value="${addr.title}" placeholder="خانه، محل کار...">
            </div>
            <div>
              <label class="block text-sm text-white/70 mb-1">کد پستی (۱۰ رقمی) *</label>
              <input id="edit-postal" class="input-style w-full text-left" dir="ltr" maxlength="10"
                value="${addr.postal}" oninput="numericMask(this,10)">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm text-white/70 mb-1">پلاک</label>
                <input id="edit-plaque" class="input-style w-full text-left" dir="ltr" maxlength="6"
                  value="${addr.plaque}" oninput="numericMask(this,6)">
              </div>
              <div>
                <label class="block text-sm text-white/70 mb-1">واحد</label>
                <input id="edit-unit" class="input-style w-full text-left" dir="ltr" maxlength="6"
                  value="${addr.unit}" oninput="numericMask(this,6)">
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm text-white/70 mb-1">آدرس کامل *</label>
            <textarea id="edit-full" class="input-style w-full resize-none" rows="3">${addr.full}</textarea>
          </div>
        </form>
      `,
      confirmText: 'ذخیره تغییرات',
      confirmClass: 'btn-primary',
      onConfirm: () => saveEditedAddress(i),
      onCancel: () => {
        state.confirmModal = null;
        render();
      }
    };

    render();
  }

  function saveEditedAddress(i) {
    const title = String(document.getElementById('edit-title')?.value || '').trim() || autoTitle(i);
    const postal = String(document.getElementById('edit-postal')?.value || '').replace(/\D+/g, '');
    const full = String(document.getElementById('edit-full')?.value || '').trim();
    const plaque = String(document.getElementById('edit-plaque')?.value || '').replace(/\D+/g, '');
    const unit = String(document.getElementById('edit-unit')?.value || '').replace(/\D+/g, '');

    if (!/^\d{10}$/.test(postal)) return toast('کد پستی باید دقیقاً ۱۰ رقم باشد', 'warning');
    if (!full) return toast('آدرس کامل را وارد کنید', 'warning');

    state.user.addresses[i] = { title, full, postal, plaque, unit };
    syncAddressesSoon();

    if (window.AppState) AppState.set({ user: state.user, tickets: state.tickets });

    state.confirmModal = null;
    toast('آدرس ویرایش شد');
    render();
  }

  function deleteAddress(i) {
    if (!state.user) return;

    normalizeAddresses();
    const arr = state.user.addresses;
    if (i < 0 || i >= arr.length) return;

    arr.splice(i, 1);
    syncAddressesSoon();

    if (window.AppState) AppState.set({ user: state.user, tickets: state.tickets });

    toast('آدرس حذف شد');
    render();
  }

  // ───────── Wishlist ─────────
  function removeWishlist(index) {
    const wl = Array.isArray(state.wishlist) ? state.wishlist : (state.wishlist = []);
    if (index < 0 || index >= wl.length) return;

    wl.splice(index, 1);

    if (window.AppState) AppState.set({ wishlist: wl, tickets: state.tickets });

    toast('محصول از علاقه‌مندی حذف شد');
    render();
  }

  // ───────── Tickets: helpers ─────────
  function normalizeTicketMessages(t) {
    if (!t) return [];
    if (Array.isArray(t.messages)) return t.messages;
    try {
      const parsed = JSON.parse(t.messages || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function persistTickets() {
    if (window.AppState) {
      AppState.set({
        ...(AppState.get() || {}),
        tickets: state.tickets,
        user: state.user,
        currentUser: state.currentUser,
        isAdmin: state.isAdmin
      });
    }
  }

  // ───────── Tickets: create from user (with priority) ─────────
  function createTicketUser(payload) {
    if (!state.user) {
      toast('ابتدا وارد شوید', 'warning');
      navigate('login');
      return;
    }

    const subject = String(payload.subject || '').trim();
    const message = String(payload.message || '').trim();
    const priority = payload.priority === 'urgent' ? 'urgent' : 'normal';

    if (!subject || !message) {
      toast('موضوع و متن تیکت الزامی است', 'warning');
      return;
    }

    const ticket = {
      id: (window.utils && utils.uid ? utils.uid() : Date.now()).toString(),
      user_phone: state.user.phone,
      user_name: state.user.name || 'کاربر',
      user_avatar: state.user.avatar || '',
      subject,
      status: 'open',
      priority,
      messages: [
        {
          from: 'user',
          text: message,
          at: new Date().toISOString()
        }
      ],
      created_at: new Date().toISOString()
    };

    state.tickets = Array.isArray(state.tickets) ? state.tickets : [];
    state.tickets.unshift(ticket);

    if (serverAuth()) {
      AryaServer.createTicket({ user_phone: ticket.user_phone, user_name: ticket.user_name, subject, message, priority })
        .then(r => {
          if (r.ok) { ticket.id = r.data.id; persistTickets(); }
          else toast(r.msg || 'ثبت تیکت روی سرور ناموفق بود', 'warning');
        })
        .catch(() => toast('ثبت تیکت روی سرور ناموفق بود', 'warning'));
    }

    persistTickets();

    toast('تیکت ثبت شد');
    state.userTicketModal = { open: false, subject: '', message: '', priority: 'normal' };
    render();
  }

  function replyTicket(ticketId, text) {
    const t = (state.tickets || []).find(x => String(x.id) === String(ticketId));
    if (!t || t.status !== 'open') return;

    const msg = String(text || '').trim();
    if (!msg) return;

    const msgs = normalizeTicketMessages(t);
    msgs.push({
      from: 'user',
      text: msg,
      at: new Date().toISOString()
    });
    t.messages = msgs;

    if (serverAuth()) {
      t.status = 'open'; // منتظر پاسخ کارشناس
      AryaServer.replyTicket({ id: String(ticketId), reply: msg, user_phone: (state.user && state.user.phone) || '' })
        .then(r => { if (!r.ok) toast(r.msg || 'پاسخ روی سرور ثبت نشد', 'warning'); })
        .catch(() => toast('پاسخ روی سرور ثبت نشد', 'warning'));
    }

    persistTickets();

    toast('پاسخ شما ارسال شد');
    render();
  }

  function toggleUserTicketThread(id) {
    state._openTicketThreads = state._openTicketThreads || {};
    state._openTicketThreads[String(id)] = !state._openTicketThreads[String(id)];
    render();
  }

  function aryUserCopyTracking(orderId) {
    const o = (state.orders || []).find(x => String(x.id) === String(orderId));
    const code = o && String(o.tracking_code || '').trim();
    if (!code) { if (window.toast) toast('کد رهگیری هنوز ثبت نشده است', 'warning'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => toast('کد رهگیری کپی شد', 'success')).catch(() => toast('کپی ممکن نبود', 'error'));
    } else { toast('کد رهگیری: ' + code, 'info'); }
  }

  // ───────── Orders status helper ─────────
  function getStatusInfo(status) {
    const t = String(status || '').toLowerCase();
    if (t === 'processing') return { badge: 'badge-processing', icon: aryIcon('clock', 'w-3.5 h-3.5'), label: 'در حال پردازش' };
    if (t === 'shipped')    return { badge: 'badge-shipped',    icon: aryIcon('truck', 'w-3.5 h-3.5'), label: 'ارسال شد' };
    if (t === 'delivered')  return { badge: 'badge-delivered',  icon: aryIcon('check', 'w-3.5 h-3.5'), label: 'تحویل شده' };
    if (t === 'canceled')   return { badge: 'badge-canceled',   icon: aryIcon('x', 'w-3.5 h-3.5'), label: 'لغو شده' };
    return { badge: 'badge-new', icon: aryIcon('box', 'w-3.5 h-3.5'), label: 'ثبت شده' };
  }

  // ───────── پیگیری سفارش: لغو و درخواست مرجوعی (طبق قوانین) ─────────
  function getOrderPhone() { return String((state.user && state.user.phone) || (state.currentUser && state.currentUser.phone) || ''); }
  function findTrackedOrder(id) { id = String(id); return (state.orders || []).find(o => String(o.id) === id); }
  function returnWindowDays() {
    try {
      const st = window.AryaServer && AryaServer.getStatus ? AryaServer.getStatus() : null;
      if (st && st.return_window_days) return Number(st.return_window_days);
    } catch (e) {}
    return 7;
  }
  function inReturnWindow(order) {
    const raw = String(order.created_at || '').replace(' ', 'T');
    const t = Date.parse(raw);
    if (!t) return false;
    return (Date.now() - t) <= returnWindowDays() * 86400000;
  }
  async function afterOrderAction() {
    try { if (window.AryaDB && AryaDB.loadToState) await AryaDB.loadToState(); } catch (e) {}
    if (typeof render === 'function') render();
  }

  window.requestOrderCancel = function (id) {
    const order = findTrackedOrder(id);
    if (!order) { toast('سفارش یافت نشد', 'error'); return; }
    state.confirmModal = {
      type: 'warning',
      title: 'لغو سفارش',
      message: 'آیا از لغو سفارش #' + String(order.id || '').slice(-8) + ' مطمئن هستید؟ اگر پرداخت آنلاین انجام شده، مبلغ تا ۷۲ ساعت کاری عودت می‌شود.',
      confirmText: 'بله، لغو شود',
      confirmClass: 'btn-danger bg-rose-600 hover:bg-rose-700 text-white',
      onConfirm: async () => {
        state.confirmModal = null;
        try {
          if (window.AryaServer && AryaServer.isConfigured()) {
            const r = await AryaServer.call('order_cancel', { body: { id: String(order.id), phone: getOrderPhone(), reason: 'لغو از پنل کاربر — انصراف' } });
            if (!r || !r.ok) { toast((r && r.msg) || 'لغو سفارش ناموفق بود', 'error'); render(); return; }
          } else {
            order.status = 'canceled';
            order.cancel_reason = 'لغو از پنل کاربر';
            try { if (window.AryaDB && AryaDB.upsert) await AryaDB.upsert('orders', order); } catch (e) {}
          }
          toast('سفارش لغو شد؛ عودت وجه در صف پردازش است');
        } finally { await afterOrderAction(); }
      }
    };
    render();
  };

  window.toggleOrderReturnForm = function (id) {
    state.returnFormFor = (state.returnFormFor === String(id)) ? null : String(id);
    render();
  };

  window.submitOrderReturn = async function (id) {
    const el = document.getElementById('ret-reason-' + id);
    const reason = ((el && el.value) || '').trim();
    if (reason.length < 10) { toast('دلیل مرجوعی را کامل بنویسید (حداقل ۱۰ کاراکتر)', 'warning'); return; }
    if (window.AryaServer && AryaServer.isConfigured()) {
      const r = await AryaServer.call('order_return', { body: { id: String(id), phone: getOrderPhone(), reason } });
      if (!r || !r.ok) { toast((r && r.msg) || 'ثبت درخواست مرجوعی ناموفق بود', 'error'); return; }
      toast('درخواست مرجوعی ثبت شد؛ پاسخ کارشناس تا ۴۸ ساعت');
    } else {
      const order = findTrackedOrder(id);
      if (!order) { toast('سفارش یافت نشد', 'error'); return; }
      order.return_status = 'requested';
      order.return_reason = reason;
      order.return_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
      try { if (window.AryaDB && AryaDB.upsert) await AryaDB.upsert('orders', order); } catch (e) {}
      toast('درخواست مرجوعی (محلی) ثبت شد');
    }
    state.returnFormFor = null;
    await afterOrderAction();
  };

  // ───────── User ticket modal ─────────
  function openUserTicketModal() {
    state.userTicketModal.open = true;
    render();
  }

  function closeUserTicketModal() {
    state.userTicketModal.open = false;
    render();
  }

  function renderUserTicketModal() {
    const m = state.userTicketModal;
    if (!m || !m.open) return '';

    return `
      <div class="fixed inset-0 z-[200] flex items-center justify-center p-4 modal-overlay">
        <div class="glass-strong rounded-3xl p-6 lg:p-8 max-w-lg w-full max-h-[90%] overflow-y-auto animate-scale">
          <h2 class="text-xl font-black mb-4 flex items-center gap-2">
            <span class="inline-flex">${aryIcon('ticket', 'w-5 h-5')}</span><span>ارسال تیکت پشتیبانی</span>
          </h2>
          <p class="text-xs text-white/60 mb-4">
            لطفاً موضوع و توضیحات مشکل را وارد کنید. در صورت فوری بودن، گزینه «فوری» را فعال کنید تا تیکت شما در اولویت پاسخ‌گویی قرار بگیرد.
          </p>
          <form 
            onsubmit="event.preventDefault(); 
              createTicketUser({ 
                subject: this.subject.value, 
                message: this.message.value, 
                priority: this.priority.value 
              });"
            class="space-y-4 text-sm"
          >
            <div>
              <label class="block text-xs text-white/70 mb-1">موضوع تیکت *</label>
              <input 
                name="subject" 
                class="input-style w-full" 
                placeholder="مثال: مشکل در ثبت سفارش" 
                required
              >
            </div>
            <div>
              <label class="block text-xs text-white/70 mb-1">شرح مشکل *</label>
              <textarea 
                name="message" 
                class="input-style w-full resize-none" 
                rows="4" 
                placeholder="توضیحات کامل مشکل را بنویسید..." 
                required
              ></textarea>
            </div>
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <label class="text-xs text-white/70">اولویت:</label>
                <select name="priority" class="input-style text-xs w-32">
                  <option value="normal">عادی</option>
                  <option value="urgent">فوری</option>
                </select>
              </div>
              <span class="text-[11px] text-white/50">
                تیکت‌های «فوری» در پنل مدیر در بخش کوییک ریپلای نمایش داده می‌شوند.
              </span>
            </div>
            <div class="flex gap-3 mt-4">
              <button type="button" class="flex-1 btn-ghost py-3 rounded-xl font-semibold" onclick="closeUserTicketModal()">
                انصراف
              </button>
              <button type="submit" class="flex-1 btn-primary py-3 rounded-xl font-semibold">
                ثبت تیکت
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // ───────── Render profile page ─────────
  function renderProfilePage() {
    if (!state.user) {
      navigate('login');
      return '';
    }

    normalizeAddresses();

    const user = state.user;
    const ordersAll = Array.isArray(state.orders) ? state.orders : [];
    const userOrders = ordersAll.filter(o => String(o.user_phone) === String(user.phone));

    const ticketsAll = Array.isArray(state.tickets) ? state.tickets : [];
    const userTickets = ticketsAll.filter(t => String(t.user_phone) === String(user.phone));

    const wishlist = Array.isArray(state.wishlist) ? state.wishlist : [];

    // Init profile tab
    if (!state.profileTab) state.profileTab = 'profile';

    return `
      ${typeof renderHeader === 'function' ? renderHeader() : ''}

      <main class="max-w-5xl mx-auto px-4 lg:px-8 py-8 lg:py-12">

        <!-- Hero Profile Card -->
        <div class="glass rounded-3xl p-5 sm:p-6 mb-6 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-sky-500/4 pointer-events-none"></div>
          <div class="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center text-4xl shadow-lg shadow-blue-500/25 flex-shrink-0">
              ${aryIcon('user', 'w-10 h-10 text-blue-200')}
            </div>
            <div class="flex-1 min-w-0 text-center sm:text-right w-full">
              <h1 class="text-xl sm:text-2xl font-black mb-1 truncate">${user.name || 'کاربر'}</h1>
              <p class="text-white/50 text-sm font-mono mb-1 break-all">${user.email || ''}</p>
              <p class="text-white/40 text-sm font-mono mb-3">${user.phone || ''}</p>
              <div class="flex flex-wrap gap-2 justify-center sm:justify-start">
                <span class="glass px-3 py-1 rounded-full text-xs"><span class="text-blue-400 font-bold">${userOrders.length}</span> سفارش</span>
                <span class="glass px-3 py-1 rounded-full text-xs"><span class="text-rose-400 font-bold">${wishlist.length}</span> علاقه‌مندی</span>
                <span class="glass px-3 py-1 rounded-full text-xs"><span class="text-amber-400 font-bold">${userTickets.length}</span> تیکت</span>
                <span class="glass px-3 py-1 rounded-full text-xs"><span class="text-emerald-400 font-bold">${user.addresses.length}</span> آدرس</span>
              </div>
            </div>
            <button type="button" class="btn-ghost text-rose-400 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-center" onclick="logoutUser()">
              ${aryIcon('logout', 'w-4 h-4 inline-block align-[-3px] ml-1')} خروج
            </button>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div data-keep-scroll="profile-tabs" class="flex gap-2 overflow-x-auto pb-2 mb-6" style="-ms-overflow-style:none;scrollbar-width:none;">
          ${[
            {id:'profile', label:'پروفایل', icon:'user'},
            {id:'orders', label:'سفارشات', icon:'box'},
            {id:'addresses', label:'آدرس‌ها', icon:'pin'},
            {id:'wishlist', label:'علاقه‌مندی‌ها', icon:'heart'},
            {id:'tickets', label:'پشتیبانی', icon:'chat'},
            {id:'settings', label:'تنظیمات', icon:'lock'},
          ].map(tab => `
            <button type="button"
              onclick="switchProfileTab('${tab.id}')""
              class="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap
                ${state.profileTab===tab.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'glass text-white/60 hover:bg-white/10'}">
              <span class="inline-flex ${state.profileTab === tab.id ? '' : 'opacity-70'}">${aryCatIcon({ icon: tab.icon }, 'w-4 h-4')}</span><span>${tab.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- TAB: Profile -->
        ${state.profileTab === 'profile' ? `

        <!-- Profile editor -->
        <div class="glass rounded-2xl p-4 sm:p-6 mb-8">
          <h2 class="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2"><span class="inline-flex text-blue-300">${aryIcon('user', 'w-5 h-5')}</span><span>ویرایش پروفایل کاربری</span></h2>
          <form onsubmit="event.preventDefault(); updateUserProfile();" class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label class="block text-sm text-white/70 mb-1">نام و نام خانوادگی *</label>
              <input id="profile-name" class="input-style w-full" value="${user.name || ''}" placeholder="مثال: آرین علوی">
            </div>
            <div>
              <label class="block text-sm text-white/70 mb-1">شماره موبایل *</label>
              <input id="profile-phone" class="input-style w-full text-left" dir="ltr" inputmode="tel"
                value="${user.phone || ''}" placeholder="09123456789">
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm text-white/70 mb-1">ایمیل</label>
              <input id="profile-email" type="email" class="input-style w-full text-left" dir="ltr"
                value="${user.email || ''}" placeholder="example@mail.com" autocomplete="email">
              <p class="text-[11px] text-white/40 mt-1.5">با تغییر ایمیل، ورود با ایمیل جدید انجام می‌شود. بازیابی رمز عبور هم به همین آدرس ارسال می‌گردد.</p>
            </div>
            <div class="md:col-span-2">
              <button type="submit" class="btn-primary w-full py-3 rounded-xl font-bold">ذخیره تغییرات</button>
            </div>
          </form>
          <p class="text-xs text-white/40 mt-4">
            برای ویرایش کد ملی یا حذف دائمی حساب، به بخش «تنظیمات» مراجعه کنید.
          </p>
        </div>

        ` : ''}

        <!-- TAB: Addresses -->
        ${state.profileTab === 'addresses' ? `
        <!-- Address manager -->
        <div class="glass rounded-2xl p-6 mb-8">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold flex items-center gap-2"><span class="inline-flex text-sky-300">${aryIcon('pin', 'w-5 h-5')}</span><span>مدیریت آدرس‌ها</span></h3>
            <span class="text-xs text-white/50">حداکثر ۱۰ آدرس قابل ذخیره است</span>
          </div>

          <form class="space-y-4 mb-6" onsubmit="event.preventDefault(); addAddressFromForm();">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="block text-sm text-white/70 mb-1">عنوان آدرس</label>
                <input id="addr-title" class="input-style w-full" placeholder="خانه، محل کار... (خالی = خودکار)">
              </div>
              <div>
                <label class="block text-sm text-white/70 mb-1">کد پستی (۱۰ رقمی) *</label>
                <input id="addr-postal" class="input-style w-full text-left" dir="ltr" inputmode="numeric" maxlength="10" placeholder="1234567890" oninput="numericMask(this, 10)">
                <p class="text-xs text-white/40 mt-1">فقط عدد، دقیقاً ۱۰ رقم</p>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm text-white/70 mb-1">پلاک</label>
                  <input id="addr-plaque" class="input-style w-full text-left" dir="ltr" inputmode="numeric" maxlength="6" placeholder="12" oninput="numericMask(this, 6)">
                </div>
                <div>
                  <label class="block text-sm text-white/70 mb-1">واحد</label>
                  <input id="addr-unit" class="input-style w-full text-left" dir="ltr" inputmode="numeric" maxlength="6" placeholder="4" oninput="numericMask(this, 6)">
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm text-white/70 mb-1">آدرس کامل *</label>
              <textarea id="addr-full" class="input-style w-full resize-none" rows="3" placeholder="استان، شهر، خیابان، کوچه..."></textarea>
            </div>
            <div class="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <button type="submit" class="btn-primary px-4 py-3 rounded-xl w-full md:w-auto">افزودن آدرس</button>
              <span class="text-xs text-white/50">اگر عنوان خالی باشد، خودکار مثل «آدرس 1» ثبت می‌شود</span>
            </div>
          </form>

          <div class="space-y-3">
            ${
              user.addresses.length === 0
                ? `<div class="text-sm text-white/60">هنوز آدرسی ثبت نکرده‌اید.</div>`
                : user.addresses
                    .map(
                      (addr, i) => `
                  <div class="glass rounded-2xl p-4">
                    <div class="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                      <div class="flex items-center gap-2">
                        <span class="inline-flex">${aryIcon('percent', 'w-5 h-5')}</span>
                        <span class="font-bold line-clamp-1">${addr.title || autoTitle(i)}</span>
                        <span class="text-white/40 text-xs md:ml-2">کد پستی: ${addr.postal || '—'}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <button class="btn-ghost px-3 py-1 rounded-lg" onclick="openEditAddressModal(${i})">ویرایش</button>
                        <button class="btn-ghost text-rose-400 px-3 py-1 rounded-lg" onclick="deleteAddress(${i})">حذف</button>
                      </div>
                    </div>
                  </div>
                `
                    )
                    .join('')
            }
          </div>
        </div>

        ` : ''}

        <!-- TAB: Orders -->
        ${state.profileTab === 'orders' ? `
        <!-- Orders -->
        <div class="glass rounded-2xl p-6 mb-8">
          <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 class="font-bold text-lg">سفارش‌های شما و وضعیت آن‌ها</h2>
          </div>
          <details class="mb-5 rounded-xl border border-white/10 bg-white/5">
            <summary class="cursor-pointer text-sm text-white/70 px-4 py-3 flex items-center gap-2 select-none list-none">${aryIcon('return','w-4 h-4 text-sky-300')}<span>قوانین و شرایط مرجوعی</span></summary>
            <ul class="px-5 pb-4 text-xs text-white/50 space-y-1.5 leading-6 list-disc">
              <li>تا <b class="text-white/70">${returnWindowDays()} روز</b> پس از ثبت سفارش، بدون ذکر دلیل (محاسبه از تاریخ ثبت)</li>
              <li>کالا باید <b class="text-white/70">نو، پلمب و با بسته‌بندی و ملحق‌های کامل</b> باشد</li>
              <li>کالاهای دیجیتال باز/فعال‌شده، لباس استفاده‌شده و کالاهای مصرفی مشمول مرجوعی نیستند</li>
              <li>پس از تایید کارشناس، عودت وجه حداکثر تا <b class="text-white/70">۷۲ ساعت کاری</b> انجام می‌شود</li>
              <li>هزینه ارسال مجدد مرجوعی بر عهده فروشگاه است، مگر در مورد کالای معیوب یا اشتباه ارسالی</li>
            </ul>
          </details>
          ${
            userOrders.length === 0
              ? `<div class="text-sm text-white/60">سفارشی ثبت نشده است.</div>`
              : `
                <div class="space-y-3">
                  ${userOrders
                    .map(order => {
                      const s = getStatusInfo(order.status);
                      const st = String(order.status || '').toLowerCase();
                      const rs = String(order.return_status || '').toLowerCase();
                      const canCancel = st === 'pending' || st === 'processing';
                      const rsBusy = rs === 'requested' || rs === 'approved';
                      const canReturn = st === 'delivered' && !rsBusy && inReturnWindow(order);
                      const windowExpired = st === 'delivered' && !rsBusy && !canReturn;
                      const addrTxt = typeof order.address === 'string' ? order.address : '';
                      const retLabels = { requested: 'مرجوعی: در حال بررسی', approved: 'مرجوعی: تایید شد — بسته را به آدرس انبار ارسال کنید', rejected: 'مرجوعی: رد شد', completed: 'مرجوع و عودت وجه شد' };
                      return `
                      <div class="glass rounded-xl p-4 space-y-2.5">
                        <div class="flex items-center justify-between gap-2 flex-wrap">
                          <div class="font-mono text-xs text-white/70">#${aryEsc(String(order.id || '').slice(-8))}</div>
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="badge ${s.badge} inline-flex items-center gap-1">${s.icon} ${s.label}</span>
                            ${rs ? `<span class="badge ${rs === 'approved' || rs === 'completed' ? 'badge-delivered' : (rs === 'rejected' ? 'badge-canceled' : 'badge-processing')} inline-flex items-center gap-1">${aryIcon('return', 'w-3.5 h-3.5')}${retLabels[rs] || ('مرجوعی: ' + rs)}</span>` : ''}
                          </div>
                        </div>
                        <div class="flex items-center justify-between gap-3 text-sm">
                          <span class="text-white/60">${window.utils && utils.formatDate ? utils.formatDate(order.created_at) : (order.created_at || '')}</span>
                          <span class="text-emerald-400 font-bold">${window.utils && utils.formatPrice ? utils.formatPrice(order.total) : (order.total || '')}</span>
                        </div>
                        ${addrTxt ? `<p class="text-[11px] text-white/40 leading-5 flex items-start gap-1.5"><span class="mt-0.5 inline-flex text-blue-300/70">${aryIcon('pin', 'w-3.5 h-3.5')}</span><span class="min-w-0 break-words">${aryEsc(addrTxt)}</span></p>` : ''}
                        ${st === 'canceled' && order.cancel_reason ? `<p class="text-[11px] text-rose-300/80">دلیل لغو: ${aryEsc(String(order.cancel_reason))}</p>` : ''}
                        ${(function () {
                          if (st === 'canceled') return '';
                          const steps = [['pending','ثبت'],['processing','پردازش'],['shipped','ارسال'],['delivered','تحویل']];
                          const oi = steps.findIndex(x => x[0] === st);
                          const trk = String(order.tracking_code || '').trim();
                          return `
                        <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
                          ${steps.map((sp, si) => `
                            <div class="flex items-center gap-1.5">
                              <span class="w-2 h-2 rounded-full shrink-0 ${si <= oi ? 'bg-blue-400' : 'bg-white/15'} ${si === oi ? 'ring-2 ring-blue-400/40' : ''}"></span>
                              <span class="text-[10px] ${si === oi ? 'text-blue-300 font-bold' : si < oi ? 'text-white/60' : 'text-white/30'}">${sp[1]}</span>
                              ${si < 3 ? `<span class="w-3 h-px ${si < oi ? 'bg-blue-400/60' : 'bg-white/10'}"></span>` : ''}
                            </div>`).join('')}
                          ${trk ? `<button type="button" onclick="aryUserCopyTracking('${aryEsc(String(order.id))}')" title="کپی کد رهگیری" dir="ltr" class="ms-auto inline-flex items-center gap-1 text-[10px] font-mono text-blue-200/90 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg px-2 py-1 border border-blue-500/25 transition-all">${aryIcon('truck', 'w-3 h-3')}${aryEsc(trk)} ⧉</button>` : (st === 'shipped' || st === 'delivered' ? `<span class="ms-auto text-[10px] text-white/35">کد رهگیری به‌زودی ثبت می‌شود</span>` : '')}
                        </div>`;
                        })()}
                        ${order.admin_note ? `<p class="text-[11px] text-amber-200/85 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2 flex items-start gap-1.5"><span class="mt-0.5 inline-flex shrink-0">${aryIcon('info','w-3.5 h-3.5')}</span><span>یادداشت پشتیبانی: ${aryEsc(String(order.admin_note))}</span></p>` : ''}
                        ${rs && order.return_reason ? `<p class="text-[11px] text-white/50">دلیل مرجوعی: ${aryEsc(String(order.return_reason))}</p>` : ''}
                        ${(canCancel || canReturn || windowExpired) ? `
                        <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                          ${canCancel ? `<button type="button" onclick="requestOrderCancel('${aryEsc(String(order.id))}')" class="text-xs px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 transition-colors inline-flex items-center gap-1.5">${aryIcon('x', 'w-3.5 h-3.5')}لغو سفارش</button>` : ''}
                          ${canReturn ? `<button type="button" onclick="toggleOrderReturnForm('${aryEsc(String(order.id))}')" class="text-xs px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 transition-colors inline-flex items-center gap-1.5">${aryIcon('return', 'w-3.5 h-3.5')}درخواست مرجوعی</button>` : ''}
                          ${windowExpired ? `<span class="text-[10px] text-white/35">مهلت ${returnWindowDays()} روزه‌ی مرجوعی این سفارش به پایان رسیده است</span>` : ''}
                        </div>` : ''}
                        ${state.returnFormFor === String(order.id) ? `
                        <div class="rounded-xl border border-sky-500/25 bg-sky-500/5 p-3">
                          <label class="block text-[11px] text-white/60 mb-1.5">دلیل مرجوعی را بنویسید — کالا باید نو و با بسته‌بندی سالم باشد (مهلت: ${returnWindowDays()} روز پس از ثبت)</label>
                          <textarea id="ret-reason-${aryEsc(String(order.id))}" rows="2" class="input-style w-full text-sm" placeholder="مثلاً: قطعه خراب رسیده / مدل اشتباه ارسال شده"></textarea>
                          <div class="flex gap-2 mt-2">
                            <button type="button" onclick="submitOrderReturn('${aryEsc(String(order.id))}')" class="btn-primary text-xs px-4 py-1.5 rounded-lg">ثبت درخواست</button>
                            <button type="button" onclick="toggleOrderReturnForm('${aryEsc(String(order.id))}')" class="text-xs px-3 py-1.5 rounded-lg text-white/50 hover:text-white transition-colors">انصراف</button>
                          </div>
                        </div>` : ''}
                      </div>
                    `;
                    })
                    .join('')}
                </div>
              `
          }
        </div>

        ` : ''}

        <!-- TAB: Wishlist -->
        ${state.profileTab === 'wishlist' ? `
        <!-- Wishlist -->
        <div class="glass rounded-2xl p-6 mb-8">
          <h2 class="font-bold text-lg mb-4 flex items-center gap-2"><span class="text-rose-400 inline-flex">${aryIcon('heart','w-5 h-5 fill-current')}</span>لیست علاقه‌مندی‌ها</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${
              wishlist.length === 0
                ? `<div class="text-sm text-white/60 text-center py-6">هنوز محصولی اضافه نکرده‌اید.</div>`
                : wishlist
                    .map((productId, i) => {
                      const wProd = state.products.find(p => p.id === productId) || {};
                      const wImg = wProd.image || wProd.main_image || wProd.mainImage || '';
                      const wTitle = wProd.title || 'محصول';
                      const wPrice = wProd.price || 0;
                      return `
                  <div class="glass rounded-xl p-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
                    <button type="button" onclick="state.selectedProduct=state.products.find(p=>p.id==='${productId}'); if(state.selectedProduct)goTo('product')" class="flex-shrink-0">
                      ${wImg
                        ? `<img src="${wImg}" class="w-16 h-16 rounded-xl object-cover hover:opacity-80 transition-opacity">`
                        : `<div class="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center text-white/40">${aryIcon('box', 'w-8 h-8')}</div>`
                      }
                    </button>
                    <div class="flex-1 min-w-0">
                      <button type="button" onclick="state.selectedProduct=state.products.find(p=>p.id==='${productId}'); if(state.selectedProduct)goTo('product')" 
                        class="font-bold line-clamp-1 text-right hover:text-blue-300 transition-colors block w-full">${wTitle}</button>
                      <div class="text-sm text-emerald-400 mt-1">
                        ${window.utils && utils.formatPrice ? utils.formatPrice(wPrice) : wPrice}
                      </div>
                    </div>
                    <button class="btn-ghost text-rose-400 px-3 py-1 rounded-lg flex-shrink-0" onclick="removeWishlist(${i})">حذف</button>
                  </div>
                `}).join('')
            }
          </div>
        </div>

        ` : ''}

        <!-- TAB: Tickets -->
        ${state.profileTab === 'tickets' ? `
        <div class="space-y-5">
          <div class="glass rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <span class="w-11 h-11 rounded-2xl bg-blue-500/15 text-blue-300 flex items-center justify-center shrink-0">${aryIcon('ticket','w-5 h-5')}</span>
              <div class="min-w-0">
                <h2 class="font-black text-xl leading-7">تیکت‌های پشتیبانی</h2>
                <p class="text-xs text-white/50 mt-1">${userTickets.length} گفتگو ثبت شده • پشتیبانی تا ۴۸ ساعت کاری پاسخ می‌دهد</p>
              </div>
            </div>
            <button class="btn-primary px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2" type="button" onclick="openUserTicketModal()">
              <span class="inline-flex text-white">${aryIcon('plus','w-4 h-4')}</span> ارسال تیکت جدید
            </button>
          </div>

          ${userTickets.length === 0 ? `
            <div class="glass rounded-3xl p-12 text-center">
              <div class="mx-auto w-20 h-20 rounded-3xl bg-blue-500/10 text-blue-300/70 flex items-center justify-center mb-5">${aryIcon('ticket','w-10 h-10')}</div>
              <h3 class="font-bold text-lg mb-2">هنوز تیکتی ثبت نکرده‌اید</h3>
              <p class="text-sm text-white/50 leading-7 max-w-md mx-auto mb-6">هر سؤالی درباره سفارش، ارسال، مرجوعی یا کیفیت کالا دارید، همین‌جا بپرسید. گفتگوها در چت شناور پایین صفحه هم قابل پیگیری است.</p>
              <button class="btn-primary px-6 py-3 rounded-2xl font-bold text-sm" type="button" onclick="openUserTicketModal()">ثبت اولین تیکت</button>
            </div>
          ` : `
            <div class="space-y-4">
              ${userTickets
                .slice()
                .sort((x, y) => String(y.created_at || '').localeCompare(String(x.created_at || '')))
                .map(t => {
                  const msgs = normalizeTicketMessages(t);
                  const lastMsg = msgs[msgs.length - 1];
                  const isOpenT = t.status === 'open';
                  const isAns = t.status === 'answered';
                  const expanded = !!(state._openTicketThreads && state._openTicketThreads[t.id]);
                  const stBadge = isOpenT ? 'badge-processing' : (isAns ? 'badge-new' : 'badge-delivered');
                  const stLabel = isOpenT ? 'باز — در انتظار پاسخ' : (isAns ? 'پاسخ داده شده' : 'بسته‌شده');
                  const prLabel = t.priority === 'urgent' ? 'فوری' : 'عادی';
                  const prBadge = t.priority === 'urgent' ? 'badge-danger' : '';
                  const lastAt = lastMsg && lastMsg.at ? (window.utils && utils.formatDateTime ? utils.formatDateTime(lastMsg.at) : lastMsg.at) : '';

                  return `
                <div class="glass rounded-3xl p-5 sm:p-6 animate-fade">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2 mb-2">
                        <span class="badge ${stBadge}">${stLabel}</span>
                        ${t.priority === 'urgent' ? `<span class="badge ${prBadge}">${prLabel}</span>` : ''}
                        <span class="text-[11px] text-white/35 font-mono" dir="ltr">#${String(t.id || '').slice(-6)}</span>
                      </div>
                      <h3 class="font-bold text-base sm:text-lg leading-8 break-words">${aryEsc(t.subject || 'بدون موضوع')}</h3>
                      <p class="text-xs text-white/45 mt-1">
                        ثبت: ${window.utils && utils.formatDateTime ? utils.formatDateTime(t.created_at) : (t.created_at || '—')}
                        ${lastAt ? ` • آخرین پیام: ${lastAt}` : ''}
                      </p>
                    </div>
                    <button type="button" onclick="toggleUserTicketThread('${t.id}')"
                      class="btn-ghost px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shrink-0">
                      <span class="inline-flex transition-transform duration-300 ${expanded ? 'rotate-180' : ''}">${aryIcon('chevrondown','w-4 h-4')}</span>
                      ${expanded ? 'بستن گفتگو' : `مشاهده گفتگو (${msgs.length})`}
                    </button>
                  </div>

                  ${!expanded && lastMsg ? `
                    <div class="mt-4 glass rounded-2xl px-4 py-3 text-xs leading-6 text-white/60 line-clamp-2">
                      <b class="${lastMsg.from === 'user' ? 'text-blue-300' : 'text-emerald-300'}">${lastMsg.from === 'user' ? 'شما: ' : (lastMsg.from === 'admin' ? 'پشتیبانی: ' : 'دستیار: ')}</b>${aryEsc(String(lastMsg.text || '').slice(0, 160))}
                    </div>` : ''}

                  ${expanded ? `
                    <div class="mt-4 rounded-2xl bg-black/25 border border-white/5 p-4 sm:p-5">
                      <div class="space-y-3 max-h-[26rem] overflow-y-auto pl-1" style="scrollbar-width:thin">
                        ${msgs.map(m => {
                          const mine = m.from === 'user';
                          return `
                          <div class="flex ${mine ? 'justify-end' : 'justify-start'}">
                            <div class="${mine ? 'ary-chat-bubble-user text-white' : 'ary-chat-bubble-sup text-white/85'} max-w-[88%] px-4 py-2.5 text-[13px] leading-7">
                              <p class="text-[10px] opacity-60 mb-1 font-bold">${mine ? 'شما' : (m.from === 'admin' ? 'کارشناس پشتیبانی' : 'دستیار هوشمند')} • ${m.at ? (window.utils && utils.formatDateTime ? utils.formatDateTime(m.at) : m.at) : ''}</p>
                              <p class="whitespace-pre-line break-words">${aryEsc(m.text || '')}</p>
                            </div>
                          </div>`;
                        }).join('')}
                      </div>

                      ${isOpenT || isAns ? `
                        <form class="mt-4 flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5" onsubmit="event.preventDefault(); const v = this.elements.reply.value.trim(); if (!v) { toast('متن پاسخ خالی است','warning'); return; } replyTicket('${t.id}', v); this.reset();">
                          <div class="flex-1">
                            <textarea name="reply" rows="2" required placeholder="پاسخ شما… (برای ارسال: Ctrl+Enter)"
                              onkeydown="if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();this.closest('form').requestSubmit();}"
                              class="input-style w-full resize-none text-sm py-3"></textarea>
                          </div>
                          <button class="btn-primary px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap" type="submit">ارسال پاسخ</button>
                        </form>
                      ` : `
                        <p class="mt-4 text-[11px] text-white/40 flex items-center gap-2">${aryIcon('info','w-4 h-4')} این تیکت بسته شده است؛ در صورت نیاز یک تیکت جدید ارسال کنید.</p>
                      `}
                    </div>` : ''}
                </div>`;
                })
                .join('')}
            </div>
          `}
        </div>

        ` : ''}

        <!-- TAB: Settings -->
        ${state.profileTab === 'settings' ? `
        <div class="space-y-6">

          <!-- اطلاعات حساب -->
          <div class="glass rounded-2xl p-4 sm:p-6">
            <h2 class="text-lg font-bold mb-5 flex items-center gap-2"><span class="inline-flex text-blue-300">${aryIcon('user', 'w-5 h-5')}</span><span>مشخصات حساب</span></h2>
            <form onsubmit="event.preventDefault(); updateUserAccount();" class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label class="block text-white/55 text-xs mb-1.5">نام و نام خانوادگی *</label>
                <input id="settings-name" class="input-style w-full" value="${user.name || ''}" placeholder="نام کامل">
              </div>
              <div>
                <label class="block text-white/55 text-xs mb-1.5">ایمیل</label>
                <input id="settings-email" type="email" dir="ltr" class="input-style w-full text-left" value="${user.email || ''}" placeholder="example@mail.com" autocomplete="email">
              </div>
              <div>
                <label class="block text-white/55 text-xs mb-1.5">شماره موبایل *</label>
                <input id="settings-phone" dir="ltr" inputmode="tel" class="input-style w-full text-left" value="${user.phone || ''}" placeholder="09123456789">
              </div>
              <div>
                <label class="block text-white/55 text-xs mb-1.5">کد ملی (غیرقابل تغییر)</label>
                <div class="glass rounded-xl p-3 flex items-center justify-between gap-2">
                  <span class="font-mono text-sm ${user.nationalId ? '' : 'text-white/40'}" dir="ltr">${user.nationalId || 'ثبت نشده'}</span>
                  <span class="inline-flex text-white/35">${aryIcon('lock', 'w-4 h-4')}</span>
                </div>
              </div>
              <div class="glass rounded-xl p-3 sm:col-span-2 text-xs text-white/50 flex items-center justify-between gap-3">
                <span>شناسه کاربری (فقط‌نمایش): <b dir="ltr" class="font-mono text-white/70">${user.id || '—'}</b></span>
                <span class="text-[10px] text-white/35">این شناسه قابل تغییر نیست</span>
              </div>
              <div class="sm:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button type="submit" class="btn-primary px-6 py-3 rounded-xl font-bold whitespace-nowrap">ذخیره تغییرات</button>
                <p class="text-xs text-white/40">برای اصلاح کد ملی (مثلاً اشتباه تایپی) یک تیکت «فوری» در بخش پشتیبانی ثبت کنید تا کارشناس هویت، آن را در پنل بررسی و اصلاح کند.</p>
              </div>
            </form>
          </div>

        </div>
        ` : ''}

      </main>

    `;
  }

  // ───────── Expose ─────────
  window.renderProfilePage    = renderProfilePage;
  window.navigate             = navigate;
  window.logoutUser           = logoutUser;
  window.numericMask          = numericMask;
  window.updateUserProfile    = updateUserProfile;
  window.updateUserAccount    = updateUserAccount;
  window.updateUserNationalId = updateUserNationalId;
  window.addAddressFromForm   = addAddressFromForm;
  window.openEditAddressModal = openEditAddressModal;
  window.saveEditedAddress    = saveEditedAddress;
  window.deleteAddress        = deleteAddress;
  window.removeWishlist       = removeWishlist;
  window.createTicketUser     = createTicketUser;
  window.replyTicket          = replyTicket;
  window.toggleUserTicketThread = toggleUserTicketThread;
  window.aryUserCopyTracking   = aryUserCopyTracking;
  window.openUserTicketModal  = openUserTicketModal;
  window.closeUserTicketModal = closeUserTicketModal;
})();

//═════════════════════════════════════════════════════════════════════════════════
// CHECKOUT PAGE
// File: assets/js/checkout page.js
//═════════════════════════════════════════════════════════════════════════════════
(function () {
  function renderCheckoutPage() {
    if (!state.user || state.cart.length === 0) {
      goTo('cart');
      return '';
    }

    const user = state.user;
    user.addresses = Array.isArray(user.addresses) ? user.addresses : [];

    const total = getCartTotal();
    const shipping = total >= 500000 ? 0 : 30000;
    const finalTotal = total + shipping;

    return `
      ${typeof renderHeader === 'function' ? renderHeader() : ''}

      <main class="max-w-3xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <h1 class="text-2xl lg:text-4xl font-black mb-8">تکمیل سفارش</h1>

        <form id="checkout-form" onsubmit="event.preventDefault(); handleCheckoutSubmit(${finalTotal})">
          <div class="grid gap-6">

            <!-- Customer info -->
            <div class="glass rounded-2xl p-6">
              <h2 class="font-bold text-lg mb-5 flex items-center gap-2">
                <span class="inline-flex text-blue-300">${aryIcon('user', 'w-5 h-5')}</span> اطلاعات خریدار
              </h2>
              <div class="grid gap-4 grid-cols-1 lg:grid-cols-2">
                <div>
                  <label class="block text-sm text-white/70 mb-2">نام و نام خانوادگی *</label>
                  <input type="text" id="co-name" name="name" required minlength="3"
                    class="w-full input-style" placeholder="نام کامل"
                    value="${user.name || ''}">
                </div>
                <div>
                  <label class="block text-sm text-white/70 mb-2">شماره موبایل *</label>
                  <input type="tel" id="co-phone" name="phone" required pattern="09[0-9]{9}"
                    class="w-full input-style text-left" dir="ltr" placeholder="09123456789"
                    value="${user.phone || ''}">
                </div>
              </div>
            </div>

            <!-- Address management -->
            <div class="glass rounded-2xl p-6">
              <h2 class="font-bold text-lg mb-5 flex items-center gap-2">
                <span class="inline-flex text-sky-300">${aryIcon('pin', 'w-4.5 h-4.5 w-5 h-5')}</span> آدرس تحویل
              </h2>

              ${user.addresses.length > 0 ? `
                <div class="mb-5">
                  <div class="text-sm text-white/60 mb-2">انتخاب از آدرس‌های ذخیره‌شده:</div>
                  <div class="space-y-2">
                    ${user.addresses.map((addr, i) => `
                      <label class="flex items-center gap-3 glass rounded-xl p-3 cursor-pointer hover:bg-white/5">
                        <input type="radio" name="savedAddress" value="${i}" ${i === 0 ? 'checked' : ''}>
                        <span class="text-sm">${addr}</span>
                        <button type="button" class="ml-auto btn-ghost text-rose-400 px-2 py-1 rounded-lg"
                          onclick="removeSavedAddress(${i})">حذف</button>
                      </label>
                    `).join('')}
                  </div>
                </div>
              ` : `
                <div class="text-sm text-white/60 mb-4">هیچ آدرس ذخیره‌شده‌ای ندارید. لطفاً آدرس خود را وارد کنید.</div>
              `}

              <div class="grid gap-4">
                <div>
                  <label class="block text-sm text-white/70 mb-2">${user.addresses.length > 0 ? 'یا آدرس جدید' : 'آدرس کامل *'}</label>
                  <textarea id="co-address" name="address" ${user.addresses.length > 0 ? '' : 'required'} rows="3"
                    class="w-full input-style resize-none" placeholder="استان، شهر، خیابان، کوچه، پلاک، واحد..."></textarea>
                </div>

                <div class="flex items-center gap-3">
                  <button type="button" class="btn-ghost px-4 py-2 rounded-xl"
                    onclick="addNewAddressFromCheckout()">افزودن به آدرس‌های ذخیره‌شده</button>
                  <span class="text-xs text-white/50">حداکثر ۱۰ آدرس قابل ذخیره است</span>
                </div>
              </div>
            </div>

            <!-- Order summary -->
            <div class="glass rounded-2xl p-6">
              <h2 class="font-bold text-lg mb-5 flex items-center gap-2">
                <span class="inline-flex text-blue-300">${aryIcon('card', 'w-5 h-5')}</span> خلاصه سفارش
              </h2>

              <div class="space-y-3 mb-5">
                ${state.cart.map(item => `
                  <div class="flex items-center justify-between text-sm py-2 border-b border-white/5">
                    <div class="flex items-center gap-3">
                      ${item.image ? `<img src="${item.image}" alt="" class="w-8 h-8 rounded-lg object-cover" loading="lazy">` : `<span class="text-white/40 inline-flex">${aryIcon('box','w-6 h-6')}</span>`}
                      <span class="text-white/80">${item.title}</span>
                      <span class="text-white/40">× ${item.qty}</span>
                    </div>
                    <span>${utils.formatPrice(item.price * item.qty)}</span>
                  </div>
                `).join('')}
              </div>

              <div class="space-y-3 pt-3 border-t border-white/10">
                <div class="flex justify-between text-sm">
                  <span class="text-white/60">جمع کالاها</span>
                  <span>${utils.formatPrice(total)}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-white/60">هزینه ارسال</span>
                  <span class="${shipping === 0 ? 'text-emerald-400' : ''}">${shipping === 0 ? 'رایگان' : utils.formatPrice(shipping)}</span>
                </div>
                <div class="flex justify-between items-center pt-3 border-t border-white/10">
                  <span class="font-bold">مبلغ قابل پرداخت:</span>
                  <span class="text-2xl font-black text-emerald-400">${utils.formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>

            <!-- Submit -->
            <button type="submit" class="w-full btn-success py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3" ${state.loading ? 'disabled' : ''}>
              ${state.loading ? `<span class="animate-pulse-slow">در حال ثبت سفارش...</span>` : `<span>✓</span><span>پرداخت و ثبت سفارش</span>`}
            </button>
          </div>
        </form>
      </main>

      ${typeof renderFooter === 'function' ? renderFooter() : ''}
    `;
  }

  // Helpers for address management inside checkout
  window.removeSavedAddress = function (index) {
    if (!state.user) return;
    const arr = Array.isArray(state.user.addresses) ? state.user.addresses : [];
    if (index >= 0 && index < arr.length) {
      arr.splice(index, 1);
      toast('آدرس حذف شد');
      render();
    }
  };

  window.addNewAddressFromCheckout = function () {
    if (!state.user) return;
    const textarea = document.getElementById('co-address');
    const addr = (textarea?.value || '').trim();
    if (!addr) { toast('آدرس جدید خالی است', 'warning'); return; }
    const arr = Array.isArray(state.user.addresses) ? state.user.addresses : (state.user.addresses = []);
    if (arr.length >= 10) { toast('حداکثر ۱۰ آدرس مجاز است', 'warning'); return; }
    arr.push(addr);
    toast('آدرس جدید ذخیره شد');
    render();
  };

  window.handleCheckoutSubmit = async function (amount) {
    if (!state.user) {
      toast('ابتدا وارد حساب شوید', 'warning');
      goTo('login');
      setTimeout(() => utils.scrollTop(), 0);
      return;
    }
    if (state.cart.length === 0) {
      toast('سبد خرید خالی است', 'warning');
      return;
    }

    const form = document.getElementById('checkout-form');
    const name = (form?.name?.value || '').trim();
    const phone = (form?.phone?.value || '').trim();
    const addressText = (form?.address?.value || '').trim();
    const savedIndexRaw = form?.savedAddress?.value;
    const hasSavedIndex = typeof savedIndexRaw !== 'undefined';

    if (name.length < 3) { toast('نام باید حداقل ۳ کاراکتر باشد', 'warning'); return; }
    if (!/^09[0-9]{9}$/.test(phone)) { toast('شماره موبایل نامعتبر است', 'warning'); return; }

    // Resolve final address: either selected saved or new textarea
    let finalAddress = '';
    if (hasSavedIndex && String(savedIndexRaw).length) {
      const idx = Number(savedIndexRaw);
      const arr = Array.isArray(state.user.addresses) ? state.user.addresses : [];
      finalAddress = arr[idx] || '';
    }
    if (!finalAddress) {
      finalAddress = addressText;
    }
    if (!finalAddress) {
      toast('آدرس تحویل را انتخاب یا وارد کنید', 'warning');
      document.getElementById('co-address')?.focus();
      return;
    }
    if (String(finalAddress).trim().length < 10) {
      toast('آدرس کامل نیست — شهر، خیابان، پلاک و واحد را بنویسید (حداقل ۱۰ کاراکتر)', 'warning');
      document.getElementById('co-address')?.focus();
      return;
    }

    state.confirmModal = {
      type: 'payment',
      title: 'تایید پرداخت',
      message: `پرداخت مبلغ ${utils.formatPrice(amount)} انجام شود؟`,
      icon: aryIcon('card', 'w-14 h-14 text-blue-300'),
      confirmText: 'پرداخت',
      confirmClass: 'btn-success',
      onConfirm: async () => {
        state.confirmModal = null;
        try {
          await createOrder({
            total: amount,
            user_phone: phone,
            user_name: name,
            address: finalAddress,
            items: state.cart,
            created_at: new Date().toISOString()
          });
          state.cart = [];
          if (window.AppState) AppState.set({ cart: [] });
          toast('سفارش شما با موفقیت ثبت شد');
          goTo('orders');
          setTimeout(() => utils.scrollTop(), 0);
          render();
        } catch (err) {
          toast('خطا در ثبت سفارش', 'error');
        }
      }
    };
    render();
  };

  // Expose renderer
  window.renderCheckoutPage = renderCheckoutPage;
})();

//═════════════════════════════════════════════════════════════════════════════
// CART PAGE
// File: assets/js/cart page.js
//═══════════════════════════════════════════════════════════════════════════
function renderCartPage() {
  const total = getCartTotal();
  const originalTotal = getCartOriginalTotal();
  const discount = getCartDiscount();
  const FREE_SHIPPING_THRESHOLD = 500000;
  const SHIPPING_COST = total >= FREE_SHIPPING_THRESHOLD ? 0 : 30000;

  return `
    ${renderHeader()}
    <main class="max-w-4xl mx-auto px-4 lg:px-8 py-8 lg:py-12 overflow-x-hidden">
      <h1 class="text-2xl lg:text-4xl font-black mb-8">سبد خرید</h1>
      
      ${state.cart.length === 0 ? `
        <div class="glass rounded-3xl p-16 text-center animate-fade">
          <div class="mb-6 animate-float text-white/25 flex justify-center">${aryIcon('cart','w-24 h-24')}</div>
          <h2 class="text-2xl font-bold mb-3">سبد خرید شما خالی است</h2>
          <p class="text-white/60 mb-8">محصولات مورد علاقه خود را به سبد اضافه کنید</p>
          <div class="flex items-center justify-center gap-3">
            <button onclick="goTo('shop'); setTimeout(()=>utils.scrollTop(),0)" class="btn-primary px-10 py-4 rounded-2xl font-bold text-lg">
              مشاهده محصولات
            </button>
            <button onclick="goTo('home'); setTimeout(()=>utils.scrollTop(),0)" class="glass px-6 py-4 rounded-2xl font-bold text-sm">
              بازگشت به خانه
            </button>
          </div>
        </div>
      ` : `
        <div class="grid lg:grid-cols-3 gap-6">
          <!-- Cart Items -->
          <div class="lg:col-span-2 space-y-4">
            ${state.cart.map((item, i) => {
              const product = state.products.find(p => p.id === item.id) || {};
              const itemDiscountPercent = utils.calculateDiscount(item.original_price, item.price);
              const disablePlus = product && item.qty >= (product.stock || 99);

              return `
                <div class="glass rounded-2xl p-5 flex gap-4 animate-fade" style="animation-delay: ${i * 0.08}s">
                  <div class="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/5 rounded-xl flex items-center justify-center text-white/40 flex-shrink-0 overflow-hidden">
                    ${item.image
                      ? `<img src="${item.image}" alt="" class="w-full h-full object-cover" loading="lazy">`
                      : aryIcon('box','w-8 h-8')}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-sm lg:text-base line-clamp-2 break-words mb-1">${aryEsc(item.title)}</h3>
                    <div class="flex items-center gap-2 mb-3">
                      <span class="text-emerald-400 font-bold">${utils.formatPrice(item.price)}</span>
                      ${item.original_price && item.original_price > item.price ? `
                        <span class="text-white/40 line-through text-xs">${utils.formatPrice(item.original_price)}</span>
                      ` : ''}
                      ${itemDiscountPercent > 0 ? `<span class="badge badge-discount text-xs">${itemDiscountPercent}%</span>` : ''}
                    </div>
                    <div class="flex items-center gap-3">
                      <button onclick="updateCartQuantity('${item.id}', ${Math.max(1, item.qty - 1)})"
                        class="w-9 h-9 glass rounded-xl flex items-center justify-center hover:bg-white/10 transition-all text-lg font-bold"
                        ${item.qty <= 1 ? 'disabled' : ''}>−</button>
                      <span class="w-10 text-center font-bold text-lg">${item.qty}</span>
                      <button onclick="updateCartQuantity('${item.id}', ${item.qty + 1})"
                        class="w-9 h-9 glass rounded-xl flex items-center justify-center transition-all text-lg font-bold ${disablePlus ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}"
                        ${disablePlus ? 'disabled' : ''}>+</button>
                    </div>
                    ${product?.stock ? `<div class="mt-2 text-[11px] text-white/40">موجودی: ${product.stock} عدد</div>` : ''}
                  </div>
                  <div class="flex flex-col items-end justify-between">
                    <button onclick="removeFromCart('${aryEsc(String(item.id))}')" aria-label="حذف از سبد" class="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all">${aryIcon('trash','w-4 h-4')}</button>
                    <span class="text-white/60 text-sm font-medium">${utils.formatPrice(item.price * item.qty)}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Order Summary -->
          <div class="lg:col-span-1">
            <div class="glass rounded-2xl p-6 sticky top-28">
              <h2 class="font-bold text-lg mb-5">خلاصه سفارش</h2>
              <div class="space-y-4 mb-6">
                <div class="flex justify-between text-sm">
                  <span class="text-white/60">قیمت کالاها (${getCartCount()})</span>
                  <span>${utils.formatPrice(originalTotal)}</span>
                </div>
                ${discount > 0 ? `
                  <div class="flex justify-between text-sm">
                    <span class="text-white/60">تخفیف</span>
                    <span class="text-emerald-400">- ${utils.formatPrice(discount)}</span>
                  </div>
                ` : ''}
                <div class="flex justify-between text-sm">
                  <span class="text-white/60">هزینه ارسال</span>
                  <span class="${SHIPPING_COST === 0 ? 'text-emerald-400' : ''}">
                    ${SHIPPING_COST === 0 ? 'رایگان' : utils.formatPrice(SHIPPING_COST)}
                  </span>
                </div>
              </div>
              <div class="border-t border-white/10 pt-5 mb-6">
                <div class="flex justify-between items-center">
                  <span class="font-bold">مبلغ قابل پرداخت:</span>
                  <span class="text-2xl font-black text-emerald-400">${utils.formatPrice(total + SHIPPING_COST)}</span>
                </div>
              </div>
              ${state.user ? `
                <button onclick="startPayment(${total + SHIPPING_COST})"
                  class="w-full btn-success py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2">
                  <span>✓</span><span>ادامه فرآیند خرید</span>
                </button>
              ` : `
                <div class="text-center">
                  <p class="text-white/60 text-sm mb-4">برای ثبت سفارش وارد حساب خود شوید</p>
                  <button onclick="goTo('login'); setTimeout(()=>utils.scrollTop(),0)" class="w-full btn-primary py-4 rounded-xl font-bold">ورود / ثبت‌نام</button>
                </div>
              `}
              ${total < FREE_SHIPPING_THRESHOLD ? `
                <p class="text-center text-xs text-white/50 mt-4 flex items-center justify-center gap-1.5"><span class="text-sky-300">${aryIcon('truck','w-4 h-4')}</span>${utils.formatPrice(FREE_SHIPPING_THRESHOLD - total)} تا ارسال رایگان</p>
              ` : ''}
            </div>
          </div>
        </div>
      `}
    </main>
    ${state.page !== 'cart' && state.page !== 'login' && state.page !== 'profile' ? renderFooter() : ''}
  `;
}

// PAYMENT HANDLER (aligned with CRUD Orders)
async function startPayment(amount) {
  // ثبت سفارش حتماً باید از صفحهٔ پرداخت بگذرد (اعتبارسنجی آدرس گیرنده + تایید)
  // — قبلاً این دکمه مستقیم و با آدرس خالی سفارش می‌ساخت
  if (!state.user) {
    toast('ابتدا وارد حساب شوید', 'warning');
    goTo('login');
    setTimeout(() => utils.scrollTop(), 0);
    return;
  }
  if (state.cart.length === 0) {
    toast('سبد خرید خالی است', 'warning');
    return;
  }
  const hasAddr = (state.user.addresses || []).some(a => typeof a === 'string' ? a.trim().length >= 10 : a && (a.full || '').trim().length >= 10);
  goTo('checkout');
  setTimeout(() => utils.scrollTop(), 0);
  if (!hasAddr) toast('برای تکمیل خرید، آدرس تحویل را وارد کنید', 'info', 6000);
}

// ═══════════════════════════════════════════════════════════════
// بازگردانی نشست کاربر از سرور (کوکی) + همگام‌سازی تیکت/سفارش‌های خود کاربر
// ═══════════════════════════════════════════════════════════════
if (window.AryaServer && typeof state !== 'undefined') {
  AryaServer.ready.then(() => {
    if (!AryaServer.isConfigured()) return;
    AryaServer.me().then(r => {
      if (r && r.ok && r.data && r.data.loggedIn && r.data.user) {
        const u = r.data.user;
        let addr = u.addresses;
        if (typeof addr === 'string') { try { addr = JSON.parse(addr); } catch { addr = []; } }
        if (addr && !Array.isArray(addr)) addr = Object.values(addr);
        const userObj = {
          id: u.id, name: u.name || '', phone: u.phone || '', email: u.email || '',
          addresses: Array.isArray(addr) ? addr : [], avatar: u.avatar || '',
          nationalId: u.national_id || u.nationalId || '',
        };
        state.user = userObj;
        state.currentUser = userObj;
        if (window.AppState) AppState.set({ loggedIn: true, user: userObj, currentUser: userObj });
        if (userObj.phone) {
          AryaServer.crud.getAll('tickets', { user_phone: userObj.phone }).then(t => {
            if (t && t.ok && Array.isArray(t.data)) {
              state.tickets = t.data.map(x => {
                if (typeof x.messages === 'string') { try { x.messages = JSON.parse(x.messages); } catch { x.messages = []; } }
                return x;
              });
              if (typeof render === 'function') render();
            }
          });
        }
      } else if (r && r.ok && state.user) {
        // سشن سرور منقضی شده — تمیز کردن وضعیت محلی
        state.user = null; state.currentUser = null;
        if (window.AppState) AppState.set({ loggedIn: false, user: null, currentUser: null });
      }
      if (typeof render === 'function') render();
    }).catch(() => {});
  });
}
