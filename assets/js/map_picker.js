// ═══════════════════════════════════════════════════════════════
// AryaMap — انتخاب آدرس روی نقشه (Leaflet + OSM) + reverse geocode
// - مبلا (محل فروشگاه) را ادمین در پنل تنظیم می‌کند؛ کاربر مقصد را روی
//   نقشه سوزن می‌کند؛ آدرس خودکار از Nominatim گرفته و در فیلدها نوشته
//   می‌شود. فاصله مبدأ→مقصد (هاورسین) هم برای برآورد زمان تحویل نشان
//   داده می‌شود. اگر نقشه/اینترنت در دسترس نبود، مختصات دستی کار می‌کند.
// File: assets/js/map_picker.js
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';
  const V = 'assets/vendor/leaflet/';
  let loading = null;

  function ensureLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      try {
        if (!document.querySelector('link[data-aryl]')) {
          const ln = document.createElement('link');
          ln.rel = 'stylesheet'; ln.href = V + 'leaflet.css'; ln.setAttribute('data-aryl', '1');
          document.head.appendChild(ln);
        }
        const sc = document.createElement('script');
        sc.src = V + 'leaflet.js';
        sc.onload = () => (window.L ? resolve(window.L) : reject(new Error('L')));
        sc.onerror = () => reject(new Error('leaflet-load'));
        document.head.appendChild(sc);
      } catch (e) { reject(e); }
    });
    return loading;
  }

  async function fetchJson(url, ms) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms || 9000);
    try {
      const r = await fetch(url, { signal: ctl.signal, headers: { 'Accept': 'application/json' } });
      if (!r.ok) throw new Error('geo-' + r.status);
      return await r.json();
    } finally { clearTimeout(t); }
  }

  // تبدیل مختصات به آدرس (OpenStreetMap Nominatim — زبان فارسی)
  async function reverseGeocode(lat, lng) {
    const url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=fa'
      + '&lat=' + encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lng);
    try {
      const d = await fetchJson(url, 9000);
      const a = d.address || {};
      const parts = [a.road, a.neighbourhood || a.suburb || a.quarter, a.city_district, a.city, a.state]
        .filter(Boolean);
      const full = String(d.display_name || parts.join('، ') || '').replace(/\s*،\s*/g, '، ').trim();
      return {
        ok: true, full,
        city: a.city || a.town || a.village || '',
        province: a.state || '',
        road: a.road || '',
        postal: String(a.postcode || '').replace(/\D/g, '').slice(0, 10),
        label: String(d.name || a.neighbourhood || a.suburb || a.road || '').trim(),
      };
    } catch (e) {
      return { ok: false, full: '', city: '', province: '', road: '', postal: '', label: '' };
    }
  }

  async function searchPlaces(q) {
    const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=fa&countrycodes=ir'
      + '&q=' + encodeURIComponent(q);
    const d = await fetchJson(url, 9000);
    return Array.isArray(d) ? d : [];
  }

  function haversineKm(a, b) {
    if (!a || !b || !isFinite(a.lat) || !isFinite(a.lng) || !isFinite(b.lat) || !isFinite(b.lng)) return null;
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
  }

  function originOf() {
    const cfg = (window.state && window.state.shopConfig) || window.__aryShopCfg || {};
    const o = cfg.origin || {};
    return (isFinite(+o.lat) && isFinite(+o.lng) && o.lat !== '' && o.lng !== '') ? { lat: +o.lat, lng: +o.lng, label: o.label || 'مبدأ فروشگاه' } : null;
  }

  const STYLE = `
  .ary-map-wrap{position:relative;z-index:0}
  .ary-map{height:min(52vh,380px);border-radius:14px;overflow:hidden;background:#0b1526;border:1px solid rgba(148,197,253,.18)}
  .ary-map .leaflet-container{font:inherit;background:#0b1526}
  .ary-map .leaflet-control-zoom a{background:#101d38;color:#bfdbfe;border-color:#1e3a5f}
  .ary-map .leaflet-tile-pane{filter:saturate(.85) brightness(.92)}
  `;
  function injectStyle() {
    if (document.getElementById('ary-map-style')) return;
    const st = document.createElement('style'); st.id = 'ary-map-style'; st.textContent = STYLE;
    document.head.appendChild(st);
  }

  function mkPin(L) {
    return L.divIcon({
      className: '', iconSize: [26, 36], iconAnchor: [13, 34],
      html: '<svg width="26" height="36" viewBox="0 0 26 36"><path d="M13 1C6.4 1 1.4 6 1.4 12.6c0 8.2 9.4 19.6 10.6 21 .4.4 1 .4 1.4 0 1.2-1.4 10.6-12.8 10.6-21C24 6 19.6 1 13 1Z" fill="#2563eb" stroke="#bfdbfe" stroke-width="1.5"/><circle cx="13" cy="12.5" r="4.4" fill="#fff"/></svg>',
    });
  }

  // ——— مودال انتخاب نقطه ———
  function openPick(opts) {
    opts = opts || {};
    injectStyle();
    return ensureLeaflet().then((L) => {
      const wrap = document.createElement('div');
      wrap.className = 'fixed inset-0 z-[95] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade';
      wrap.innerHTML = `
        <div class="glass-strong w-full max-w-2xl rounded-2xl p-4 sm:p-5 animate-fade-up" role="dialog" aria-modal="true">
          <div class="flex items-center justify-between gap-3 mb-3">
            <h3 class="font-black text-base sm:text-lg">${aryHtmlEsc(opts.title || 'انتخاب آدرس روی نقشه')}</h3>
            <button type="button" data-x class="w-8 h-8 rounded-lg hover:bg-white/10 text-white/60 flex items-center justify-center" aria-label="بستن"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="w-4 h-4"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
          </div>
          <div class="flex gap-2 mb-3">
            <input data-q class="input-style flex-1 text-sm" placeholder="جستجوی محله/خیابان (اختیاری)…" dir="rtl">
            <button type="button" data-go class="btn-ghost px-4 py-2 rounded-xl text-sm whitespace-nowrap">جستجو</button>
          </div>
          <div class="ary-map-wrap"><div data-map class="ary-map"></div></div>
          <div data-res class="mt-3 text-[12px] leading-6 text-white/70 min-h-[2.6rem]">نقشه در حال بارگذاری… برای ثبت آدرس، روی نقشه کلیک کنید یا سوزن را بکشید.</div>
          <div data-results class="mt-1"></div>
          <div class="flex flex-wrap items-center justify-between gap-2 mt-4">
            <span data-dist class="text-[11px] text-white/45"></span>
            <div class="flex gap-2">
              <button type="button" data-cancel class="btn-ghost px-4 py-2.5 rounded-xl text-sm">انصراف</button>
              <button type="button" data-ok class="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold opacity-60 pointer-events-none">ثبت این نقطه</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(wrap);

      const $ = (s) => wrap.querySelector(s);
      const res = $('[data-res]'), okBtn = $('[data-ok]'), distEl = $('[data-dist]');
      let point = (isFinite(+opts.lat) && isFinite(+opts.lng)) ? { lat: +opts.lat, lng: +opts.lng } : null;
      let busy = false;
      const center = point || originOf() || { lat: 35.6997, lng: 51.3379 };

      const map = L.map($('[data-map]'), { zoomControl: true, attributionControl: true }).setView([center.lat, center.lng], point ? 16 : 11);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      const marker = L.marker(map.getCenter(), { draggable: true, icon: mkPin(L) }).addTo(map);
      if (point) marker.setLatLng([point.lat, point.lng]); else marker.setStyle({ opacity: .55 });

      function enableOk(on) {
        okBtn.classList.toggle('opacity-60', !on); okBtn.classList.toggle('pointer-events-none', !on);
      }
      function geo(lat, lng) {
        point = { lat: round6(lat), lng: round6(lng) };
        enableOk(true); marker.setLatLng([lat, lng]); marker.setStyle({ opacity: 1 });
        const o = originOf(); const km = o ? haversineKm(o, point) : null;
        distEl.textContent = o ? (km != null ? ('فاصله تا مبدأ (' + o.label + '): حدود ' + km.toLocaleString('fa-IR') + ' کیلومتر') : '') : '';
        busy = true;
        res.innerHTML = '<span class="inline-flex items-center gap-2 text-white/55"><span class="w-3.5 h-3.5 border-2 border-blue-300/40 border-t-blue-300 rounded-full animate-spin inline-block"></span> در حال ساخت آدرس از روی مختصات…</span>';
        reverseGeocode(lat, lng).then((g) => {
          busy = false;
          if (g.ok) {
            res.innerHTML = '<div class="glass rounded-xl px-3 py-2 text-white/85">' + aryHtmlEsc(g.full) + '</div>'
              + (g.postal ? '<p class="text-[11px] text-emerald-300/90 mt-1">کد پستی پیشنهادی: <b dir="ltr">' + g.postal + '</b></p>' : '');
          } else {
            point.geo = null;
            res.innerHTML = '<div class="glass rounded-xl px-3 py-2 text-amber-200/90">سرویس آدرس‌یاب در دسترس نبود — مختصات ثبت می‌شود؛ آدرس را خودتان کامل بنویسید.</div>';
          }
          point.g = g.ok ? g : null;
        });
      }
      map.on('click', (e) => geo(e.latlng.lat, e.latlng.lng));
      marker.on('dragend', () => { const p = marker.getLatLng(); geo(p.lat, p.lng); });

      const runSearch = () => {
        const q = String($('[data-q]').value || '').trim();
        if (q.length < 2) return;
        const rc = $('[data-results]'); rc.innerHTML = '<p class="text-[11px] text-white/50 mb-1">در حال جستجو…</p>';
        searchPlaces(q).then((rows) => {
          if (!rows.length) { rc.innerHTML = '<p class="text-[11px] text-white/50 mb-1">موردی پیدا نشد؛ روی نقشه سوزن را جابه‌جا کنید.</p>'; return; }
          rc.innerHTML = '<p class="text-[11px] text-white/50 mb-1">نتایج (برای انتخاب کلیک کنید):</p>' + rows.map((r, i) =>
            '<button type="button" data-r="' + i + '" class="block w-full text-start text-[12px] hover:bg-white/10 rounded-lg px-2.5 py-1.5 mb-1 glass">' + aryHtmlEsc(r.display_name) + '</button>').join('');
          rows.forEach((r, i) => rc.querySelector('[data-r="' + i + '"]').addEventListener('click', () => {
            rc.innerHTML = ''; map.setView([+r.lat, +r.lon], 16); geo(+r.lat, +r.lon);
          }));
        }).catch(() => { rc.innerHTML = '<p class="text-[11px] text-amber-300/80 mb-1">جستجو ناموفق بود — از کلیک روی نقشه استفاده کنید.</p>'; });
      };
      $('[data-go]').addEventListener('click', runSearch);
      $('[data-q]').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } });

      const close = () => { try { map.remove(); } catch (e) {} wrap.remove(); };
      $('[data-x]').addEventListener('click', close);
      $('[data-cancel]').addEventListener('click', close);
      wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
      okBtn.addEventListener('click', () => {
        if (!point || busy) return;
        close();
        try { opts.onPick && opts.onPick(point); } catch (e) { console.warn('[AryaMap] onPick', e); }
      });
    }).catch(() => {
      toast && toast('کتابخانه نقشه بارگذاری نشد؛ آدرس را دستی وارد کنید', 'warning', 6000);
    });
  }

  // ——— نقشهٔ جای‌شده برای پنل ادمین (انتخاب مبدأ) ———
  function mountInline(el, opts) {
    opts = opts || {}; injectStyle();
    return ensureLeaflet().then((L) => {
      const start = (isFinite(+opts.lat) && isFinite(+opts.lng)) ? [+opts.lat, +opts.lng] : [35.6997, 51.3379];
      const map = L.map(el, { attributionControl: false }).setView(start, isFinite(+opts.lat) ? 14 : 10);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      const mk = L.marker(start, { draggable: true, icon: mkPin(L) }).addTo(map);
      function emit(lat, lng) { try { opts.onChange && opts.onChange(round6(lat), round6(lng)); } catch (e) {} }
      map.on('click', (e) => { mk.setLatLng(e.latlng); emit(e.latlng.lat, e.latlng.lng); });
      mk.on('dragend', () => { const p = mk.getLatLng(); emit(p.lat, p.lng); });
      return {
        set(lat, lng) { if (isFinite(+lat) && isFinite(+lng)) { mk.setLatLng([+lat, +lng]); map.panTo([+lat, +lng]); } },
        remove() { try { map.remove(); } catch (e) {} },
      };
    });
  }

  function round6(n) { return Math.round((+n) * 1e6) / 1e6; }
  function aryHtmlEsc(s) {
    if (typeof window.aryEsc === 'function') return window.aryEsc(String(s ?? ''));
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  window.AryaMap = {
    ensure: ensureLeaflet,
    pick: openPick,
    mountInline,
    reverseGeocode,
    haversineKm,
    origin: originOf,
  };
})();
