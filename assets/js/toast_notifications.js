// ═══════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS — استک مرکزی بالا، سقف تعداد، ددوپ، حذف با سوایپ
// File: assets/js/toast_notifications.js
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const MAX_VISIBLE = 4;          // حداکثر نوتیفیکیشن هم‌زمان روی صفحه
  const RATE_WINDOW_MS = 2000;    // پنجره‌ی ضداسپم
  const RATE_MAX = 8;             // حداکثر درخواست نمایش در پنجره (تکراری‌ها رایگان‌اند)
  const SWIPE_MIN = 64;           // آستانه‌ی سوایپ (پیکسل، هر جهتی)

  const active = [];              // { el, timer, key, count }
  const recent = [];              // زمان‌های درخواست نمایش (نرمال‌شده)
  let lastKeySeen = new Map();

  function ensureToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className =
        'fixed top-4 inset-x-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none px-4';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }

  const ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0"><path d="M20 6 9 17l-4-4"/></svg>',
    error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
    info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>',
  };

  const TYPES = {
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    error:   'bg-rose-500/15 text-rose-300 border-rose-400/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    info:    'bg-blue-500/15 text-blue-200 border-blue-400/30',
  };

  function clearTimer(t) { if (t.timer) { clearTimeout(t.timer); t.timer = 0; } }

  function removeToast(t, instant) {
    const i = active.indexOf(t);
    if (i === -1) return;
    active.splice(i, 1);
    clearTimer(t);
    const el = t.el;
    if (!el.isConnected) return;
    if (instant || !el.animate) { el.remove(); return; }
    const d = document.documentElement.dir === 'rtl' ? 1 : -1;
    const dir = t.fling || 'up';
    const key = el.animate(
      dir === 'left'  ? [{ opacity: 1 }, { opacity: 0, transform: `translateX(${(d < 0 ? -1 : 1) * 320}px) scale(.9)` }]
      : dir === 'right' ? [{ opacity: 1 }, { opacity: 0, transform: `translateX(${(d < 0 ? 1 : -1) * 320}px) scale(.9)` }]
      : dir === 'down' ? [{ opacity: 1 }, { opacity: 0, transform: 'translateY(24px) scale(.9)' }]
      /* up */ : [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-18px) scale(.95)' }],
      { duration: 180, easing: 'ease-in', fill: 'forwards' }
    );
    key.onfinish = () => el.remove();
    setTimeout(() => { if (el.isConnected) el.remove(); }, 400);
  }

  function armTimer(t, duration) {
    clearTimer(t);
    t.timer = setTimeout(() => removeToast(t), duration);
  }

  function bindSwipe(t) {
    const el = t.el;
    let sx = 0, sy = 0, dragging = false;
    el.addEventListener('pointerdown', (e) => {
      if (e.button != null && e.button !== 0) return;
      dragging = true; sx = e.clientX; sy = e.clientY; t.fling = null;
      el.setPointerCapture?.(e.pointerId);
      el.style.transition = 'none';
      clearTimer(t);
    });
    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.opacity = String(Math.max(0.35, 1 - Math.hypot(dx, dy) / 260));
    });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      const dx = (e?.clientX ?? sx) - sx, dy = (e?.clientY ?? sy) - sy;
      const dist = Math.hypot(dx, dy);
      if (dist >= SWIPE_MIN || Math.abs(dy) >= SWIPE_MIN * 1.6) {
        t.fling = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        removeToast(t);
      } else {
        el.style.transition = 'transform .18s cubic-bezier(.2,.8,.3,1), opacity .18s';
        el.style.transform = '';
        el.style.opacity = '';
        armTimer(t, t.duration);
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', () => {
      dragging = false;
      el.style.transition = 'transform .15s'; el.style.transform = ''; el.style.opacity = '';
      armTimer(t, t.duration);
    });
  }

  function bump(t) {
    const badge = t.el.querySelector('[data-toast-count]');
    if (badge) {
      badge.textContent = '×' + t.count;
      badge.classList.remove('hidden');
      t.el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.045)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
    }
  }

  function toast(message, type = 'success', duration = 4000) {
    message = String(message ?? '');
    if (!message) return;
    type = TYPES[type] ? type : 'info';

    // ضداسپم: درخواست‌های پشت‌سرهمِ مختلف را محدود کن (تکراری‌ها از ددوپ سود می‌برند)
    const now = performance.now();
    const norm = type + '|' + message.trim();
    recent.push({ t: now, dup: lastKeySeen.has(norm) });
    while (recent.length && now - recent[0].t > RATE_WINDOW_MS) recent.shift();
    const fresh = recent.filter((r2) => !r2.dup).length;
    lastKeySeen.set(norm, now);
    if (lastKeySeen.size > 64) lastKeySeen = new Map([[norm, now]]);
    if (fresh > RATE_MAX) return;

    const container = ensureToastContainer();

    // ددوپ: پیام تکراری = همان نوتیفیکیشن + شمارنده + ریست تایمر
    for (const t of active) {
      if (t.key === norm) { t.count++; bump(t); armTimer(t, Math.max(t.duration, duration)); return; }
    }

    // سقف نمایش: قدیمی‌ترین را کنار بزن تا لیست صفحه را نگیرد
    while (active.length >= MAX_VISIBLE) removeToast(active[0], active.length > MAX_VISIBLE);

    const el = document.createElement('div');
    el.className = 'toast-item pointer-events-auto max-w-[min(92vw,30rem)] w-fit flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg shadow-black/30 text-[13px] leading-6 backdrop-blur-xl border select-none cursor-grab active:cursor-grabbing ' + (TYPES[type] || TYPES.info);
    el.style.touchAction = 'pan-y';
    el.innerHTML = (ICONS[type] || ICONS.info) + '<span class="flex-1 text-start"></span><span class="hidden text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-black/30" data-toast-count></span>';
    el.children[1].textContent = message;

    const t = { el, key: norm, count: 1, duration: Math.max(1200, duration), timer: 0, fling: null };
    container.appendChild(el);
    active.push(t);
    bindSwipe(t);

    // دکمه بستن (دسکتاپ)
    const close = document.createElement('button');
    close.type = 'button'; close.className = 'opacity-60 hover:opacity-100 transition shrink-0';
    close.setAttribute('aria-label', 'بستن');
    close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="w-3.5 h-3.5"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    close.addEventListener('click', (e) => { e.stopPropagation(); removeToast(t); });
    el.appendChild(close);

    if (el.animate) el.animate([{ opacity: 0, transform: 'translateY(-14px) scale(.96)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.3,1)' });
    armTimer(t, t.duration);
  }

  window.toast = toast;
  window.AryaToast = { toast, clear() { while (active.length) removeToast(active[0], true); } };
})();
