#!/usr/bin/env node
/* تست رگرسیون یکپارچه آریا (راندهای ۴۰→۴۶)
   اجرا:  npm i --no-save jsdom && node tests/aria-regression.test.js
   - بخش ۱: ایستا — CSS/JS (هدر، دکمه‌ها، مودال‌ها، صفرتا صفر ایموجی)
   - بخش ۲: رانتایم سایت (jsdom) — جستجوی شناور، ولش‌لیست میهمان/کاربر، خروج با مودال
   - بخش ۳: رانتایم ادمین — بوت واقعی، تب‌ها، فیلتر سفارشات، صفر ایموجی در DOM زنده */
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
let JSDOM;
try { JSDOM = require('jsdom').JSDOM; }
catch (e) { JSDOM = require('/home/user/node_modules/jsdom').JSDOM; }
const fs = require('fs');
const flush = async w => { await new Promise(r => { try { w.requestAnimationFrame(r); } catch (e) { r(); } }); await new Promise(r => setTimeout(r, 200)); };
let fails = 0;
const t = (n, ok) => { const p = ok === true; if (!p) fails++; console.log((p ? '✓' : '✗ ' + String(ok).slice(0, 150)) + '  ' + n); };
const rd = f => fs.readFileSync(ROOT + '/' + f, 'utf8');
const EMO = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}]/gu;
const TYPO = new Set([...'★☆⯨←↑→↓↔↕⬅➡⬆⬇✓✔✕✖✗×▪•·▲▼⚠☰']);
const hard = s => [...String(s).replace(/\uFE0F/g, '').matchAll(EMO)].map(m => m[0]).filter(c => !TYPO.has(c));
const SITE_FILES = ['Arya_api.js','Arya_db.js','configuration.js','global_state_management.js','functions.js','navigation.js','toast_notifications.js','crud_operations_products.js','crud_operations_orders.js','map_picker.js','components.js','confirm_modal.js','wp_editor.js','pages.js'];
const ALL_FILES = SITE_FILES.map(f => 'assets/js/' + f).concat(['assets/js/adminP.js', 'index.html', 'admin.html', '404.html']);

async function boot(htmlFile, extra) {
  const html = rd(htmlFile);
  const dom = new JSDOM(html, { url: 'http://localhost:8312/' + htmlFile, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
  w.Element.prototype.animate = function () { return { finished: Promise.resolve(), cancel() {} }; };
  const files = extra === 'admin' ? SITE_FILES.concat(['adminP.js']).map(f => 'assets/js/' + f) : SITE_FILES.map(f => 'assets/js/' + f);
  try { w.eval(files.map(f => fs.readFileSync(ROOT + '/' + f, 'utf8') + '\n;\n').join('\n')); } catch (e) { console.log('LOAD-ERR', e.message); }
  const inline = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(x => x.trim() && !/cdn\.js|tailwind/.test(x));
  for (const c of inline) { try { w.eval(c); } catch (e) {} }
  if (w.AryaDB && w.AryaDB.init) { try { await w.AryaDB.init(); } catch (e) {} }
  await flush(w); if (w.render) { w.render(); await flush(w); }
  return w;
}

(async () => {
  /* ═══ ۱ — ایستا ═══ */
  const C = rd('assets/js/components.js'), TH = rd('assets/css/theme.css'), A = rd('assets/js/adminP.js'), P = rd('assets/js/pages.js');
  let emo = 0; for (const f of ALL_FILES) emo += hard(rd(f)).length;
  t('zero emoji across system', emo === 0, emo);
  t('floating search restored', /function toggleSearchBar\(force\)/.test(C) && /function applySearch\(\)/.test(C));
  t('no cmdk remnants', !/AryaSearch/.test(C) && !/ary-cmdk/i.test(C) && !/ary-cmdk/i.test(TH));
  t('search btn not force-circular', !/header \.gpt5-search-btn[^}]*border-radius:\s*50%/s.test(TH) && /header \.gpt5-search-btn \{ border-radius: 11px; \}/.test(TH));
  t('menu hamburger is svg', !/☰/.test(C) && /aryIcon\('menu'/.test(C));
  t('drawer action row aligned (no overflow)', /flex:1 1 0; min-width:0; margin-inline:0;[^}]*white-space:nowrap/.test(TH) && /style="margin-inline:\.8rem"/.test(C));
  t('adminP order filters plain text', /renderOrderFilterButton\("pending", "در انتظار"\)/.test(A));
  t('ICON_FALLBACK neutralized', /const ICON_FALLBACK = \{\}/.test(A));
  t('products toolbar: filter row then buttons', A.includes('grid grid-cols-2 sm:flex') && A.includes('col-span-2 sm:col-auto'));
  t('r48 editor reuse wired', /state.blogEdit._isProduct/.test(A) && /_isProduct: true/.test(A) && /return renderAdminBlogEditor\(\)/.test(A.slice(A.indexOf('function renderAdminProductsEditor'), A.indexOf('function renderAdminProductsEditor') + 700)));
  t('r48 separate draft key', (A.match(/'product_article'/g) || []).length >= 4);
  t('r48 legacy dispatch guarded', /_isProduct\) return null/.test(rd('assets/js/functions.js').replace(/\r\n/g, '\n')));
  t('product form stacked actions on mobile', /flex flex-col-reverse sm:flex-row gap-2\.5 sm:gap-4 mt-8/.test(A));
  t('bulk import shared media', /media: \{ image: '', video: '', article: '', onlyEmpty: true \}/.test(A) && /function aryBulkImgFile/.test(A));
  t('admin login header has key icon', /width:80px;[\s\S]{0,260}?box-shadow:0 20px 40px[\s\S]{0,340}?<circle cx="7.5" cy="15.5" r="4"/.test(rd('admin.html')));
  t('wizard logo has db icon', /<div class="sw-logo"><svg/.test(rd('index.html')));
  t('no empty one-line buttons in adminP', !/<button[^<>]*><\/button>/.test(A));
  t('category filter precedes buttons', A.indexOf('col-span-2 sm:col-auto flex items-center gap-2 min-w-0') < A.indexOf('openAryaBulkImport()">'));
  t('shop list row: price/stock top, cart btn LEFT (end in RTL) on mobile too',
    /mt-auto pt-2 flex flex-col gap-2 sm:block/.test(P) &&
    /flex items-end justify-between gap-3 min-w-0/.test(P) &&
    /<div class="flex items-center justify-end mt-0\.5 sm:mt-1">/.test(P) &&
    /h-10 sm:h-9 rounded-xl inline-flex items-center justify-center[^"]*whitespace-nowrap/.test(P) &&
    !/w-full sm:w-auto rounded-xl inline-flex items-center justify-center gap-1\.5 whitespace-nowrap disabled/.test(P) &&
    !/flex flex-wrap items-end justify-between gap-2 mt-auto/.test(P));
  for (const f of ['index.html','admin.html']) t(f + ': frame-src self + cache', /frame-src 'self' https:\/\/www\.youtube\.com/.test(rd(f)) && /v=20261022[a-z]/.test(rd(f)));
  t('CSP in .htaccess too', /frame-src 'self' https:\/\/www\.youtube\.com/.test(rd('.htaccess')));

  /* ═══ ۲ — سایت ═══ */
  const w = await boot('index.html', 'site');
  const d = w.document;
  w.state.products = [{ id: 'p1', title: 'هدفون بی‌سیم آریا', price: 1200000, category: 'audio', stock: 3 }, { id: 'p2', title: 'کیبورد مکانیکی', price: 800000, category: 'keyboard', stock: 5 }, { id: 'p3', title: 'ماوس', price: 300000, category: 'keyboard', stock: 5 }];
  w.state.page = 'home'; if (w.render) { w.render(); await flush(w); }
  t('header search toggle', !!d.getElementById('searchToggleBtn'));
  if (w.toggleSearchBar) w.toggleSearchBar(true); await flush(w);
  t('floating bar opens', /open/.test((d.querySelector('.gpt5-search-shell') || {}).className || ''));
  const si = d.getElementById('header-search'); if (si) si.value = 'هدفون';
  w.eval("state.searchQuery='هدفون'; applySearch();"); await flush(w);
  t('applySearch → shop filter', w.state.page === 'shop' && /هدفون/.test(String(w.state.productFilter.search || w.state.searchQuery || '')), w.state.page + '/' + w.state.productFilter.search);
  t('site body zero emoji (rendered)', hard(d.body.innerHTML).length === 0, hard(d.body.innerHTML).slice(0, 3).join(''));
  // ── ولش‌لیست: چرخه میهمان → لاگین → خروج → تب جدید ──
  w.state.user = null; w.eval('wlSync(); sessionStorage.clear();');
  w.toggleWishlist('p1'); await flush(w);
  t('guest wishlist works', w.state.wishlist.includes('p1') && JSON.parse(w.sessionStorage.getItem('arya_guest_wl') || '[]').includes('p1'));
  w.toggleWishlist('p2'); await flush(w);
  w.eval("state.user={ phone:'09120000000', name:'آرین علوی' }; state.currentUser=state.user; wlSync();");
  await flush(w);
  t('login merges guest into user list', w.state.wishlist.includes('p1') && w.state.wishlist.includes('p2') && !w.sessionStorage.getItem('arya_guest_wl'));
  t('user list keyed + persisted', !!(w.state.userWishlists && w.state.userWishlists['u:09120000000'] && w.state.userWishlists['u:09120000000'].length === 2));
  w.toggleWishlist('p3'); await flush(w);
  w.logoutUser(); await flush(w);
  const cm = w.state.confirmModal;
  t('site logout uses confirm modal', !!(cm && /خروج از حساب/.test(cm.title)));
  cm.onConfirm(); await new Promise(r => setTimeout(r, 120));
  t('guest list wiped after logout', w.state.wishlist.length === 0);
  w.eval("state.user={ phone:'09120000000' }; wlSync();");
  t('re-login restores user list', w.state.wishlist.length === 3);
  w.eval("state.user=null; sessionStorage.clear(); wlSync();");
  t('new tab wipes guest wishlist', w.state.wishlist.length === 0);
  // سایت — لاگین OTP ادغام می‌کند (hook در functions)
  t('OTP login hooks wlSync', /ورود موفق بود[\s\S]{0,60}wlSync|wlSync[\s\S]{0,60}goTo\('home'\);\r?\n  toast/.test(rd('assets/js/functions.js')) || /r46 — ادغام خودکار/.test(rd('assets/js/functions.js')));

  /* ═══ ۳ — ادمین ═══ */
  const a = await boot('admin.html', 'admin');
  await new Promise(r => setTimeout(r, 120));
  try { await a.startAdminPanel({ username: 'admin', role: 'admin', name: 'Admin' }); } catch (e) {}
  await new Promise(r => setTimeout(r, 150)); if (a.render) a.render(); await flush(a);
  const d2 = a.document;
  t('admin boots after startAdminPanel', /داشبورد|مدیریت/.test(d2.body.textContent || ''));
  t('confirmed wrapper survives boot', !!(a.adminLogout && a.adminLogout.__aryConfirmed));
  a.window.__rawCalls = 0;
  a.window.__aryAdminLogoutRaw = function () { a.window.__rawCalls++; };
  a.state.confirmModal = null; a.adminLogout(); await flush(a);
  t('admin logout confirm modal', !!(a.state.confirmModal && /خروج از پنل مدیریت/.test(a.state.confirmModal.title)));


  a.state.confirmModal.onConfirm(); await new Promise(r => setTimeout(r, 80));
  t('raw logout called once', a.window.__rawCalls === 1);
  t('adminLogoutNow bypass (idle)', (() => { a.window.__rawCalls = 0; a.adminLogoutNow(); return a.window.__rawCalls === 1 && !a.state.confirmModal; })());

  /* ═══ r48 — ویرایشگر مقالهٔ محصول = همان ادیتور وبلاگ ═══ */
  {
    const st = a.state;
    st.adminTab = 'products'; st.blogEdit = null; st.currentScreen = null;
    st.editProduct = { id: 1, title: 'هدفون X', price: 100 };
    st.productDraft = null;
    const blogLen = (st.blog || []).length;
    a.openArticleEditor(); await flush(a);
    let bd = a.document.body.innerHTML;
    t('product article opens blog-style editor', /ary-wp-root/.test(bd) && /ویرایش مقالهٔ محصول/.test(bd));
    t('product mode: full WP toolbar', /class="ary-wp-tools" role="toolbar"/.test(bd) && /ary-wp-tbtn/.test(bd) && /ary-wp-back/.test(bd));
    t('product mode: no blog title input', !/id="ary-wp-title"/.test(bd));
    t('product mode: blog-only settings hidden', !/مقاله منتشرشده/.test(bd) && /رسانه‌های مقاله/.test(bd));
    t('product mode: paper body editable', !!a.document.getElementById('ary-wp-body'));
    a.document.getElementById('ary-wp-body').innerHTML = '<p>این یک مقالهٔ آزمایشی کافی‌طول برای تست ذخیره است.</p>';
    await a.window.aryBlogWpSave(); await flush(a);
    t('article saved to product draft', /آزمایشی کافی‌طول/.test(String((st.productDraft || {}).article || '')));
    t('no blog post created by product save', (st.blog || []).length === blogLen);
    t('editor closed back to product form', !st.blogEdit && /مقاله ثبت شده/.test(a.document.body.innerHTML));
    a.openArticleEditor(); await flush(a);
    a.document.getElementById('ary-wp-body').innerHTML = '<p>محتوای تغییرکردهٔ ذخیره‌نشده برای تست دیالوگ خروج الزامی است.</p>';
    a.window.aryBlogWpCancel(); await flush(a);
    t('dirty exit shows confirm modal', !!(st.confirmModal && /خروج از ویرایش مقالهٔ محصول/.test(String(st.confirmModal.title || ''))));
    if (st.confirmModal) { const cb = st.confirmModal.onConfirm; st.confirmModal = null; cb(); }
    await flush(a);
    t('discard on confirmed exit', !st.blogEdit && !/دیالوگ خروج الزامی/.test(String((st.productDraft || {}).article || '')));
    a.eval('state.editProduct = null; state.productDraft = null; state.blogEdit = null; render();');
    await flush(a);
  }
  for (const tab of ['products', 'orders', 'database']) {
    a.state.adminTab = tab; if (a.render) a.render(); await flush(a);
    t('admin tab ' + tab + ' zero emoji', hard(d2.body.innerHTML).length === 0, hard(d2.body.innerHTML).slice(0, 3).join(''));
  }
  // ادیتور محصول: دکمه بروزرسانی داخل کادر
  a.state.editProduct = { id: 'x1', title: 'تست', price: 1000, original_price: 0, category: '', stock: 2, description: '', mainImage: '', gallery: [], videos: [], article: '' };
  a.state.productDraft = null;
  const fh = a.renderProductModal();
  t('product form submit stacked + nowrap', /flex flex-col-reverse sm:flex-row/.test(fh) && /btn-primary w-full sm:flex-1[^"]*whitespace-nowrap/.test(fh) && /بروزرسانی/.test(fh));
  t('edit icon on category/blog rows', /aria-label="ویرایش دسته"[^>]*>\s*<svg/.test(A) && /aria-label="ویرایش مقاله"[^>]*>\s*<svg/.test(A));
  // مودال ولش‌لیست ادمین ربطی ندارد — ادیتور چک نشد؛ تست bulk flow کوتاه:
  a.openAryaBulkImport && a.openAryaBulkImport();
  if (a.state.adminBulk) {
    a.state.adminBulk.text = 'محصول الف,100000,0,5\nمحصول ب,200000,0,3';
    a.state.adminBulk.media.image = 'https://x/y.jpg';
    a.aryBulkParse();
    const n0 = (a.state.products || []).length;
    a.aryBulkApply(); await new Promise(r => setTimeout(r, 100));
    const add = (a.state.products || []).slice(0, 2);
    t('bulk import + shared image auto', (a.state.products || []).length === n0 + 2 && add.every(p => p.image === 'https://x/y.jpg'), 'n0=' + n0 + '→' + (a.state.products || []).length);
  } else t('bulk import available', 'no-fn');

  console.log(fails ? '\nFAILS: ' + fails : '\nALL GREEN — aria regression (r40→r46)');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FATAL', e); process.exit(1); });
