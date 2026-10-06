// ═══════════════════════════════════════════════════════════════
// سیستم آیکون SVG (جایگزین ایموجی) — خطی، هم‌وزن Tailwind
// مصرف: aryIcon('cart') یا aryIcon('truck', 'w-6 h-6 text-emerald-400')
// ═══════════════════════════════════════════════════════════════
window.ARYA_ICONS = {
  cart: '<path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 15.75V18a3 3 0 0 0 3 3h7.5m-7.5-3h13.076c.607 0 1.087-.518.966-1.115L23.25 5.25H6.375"/><circle cx="10.5" cy="19.5" r="1.5"/><circle cx="19.5" cy="19.5" r="1.5"/>',
  search: '<circle cx="11.25" cy="11.25" r="7.5"/><path d="m20.25 20.25-4.35-4.35"/>',
  user: '<path d="M17.98 20.873a9.03 9.03 0 0 0-11.96 0m15-4.53a6.75 6.75 0 1 0-18 0m9-12a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"/>',
  heart: '<path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>',
  bolt: '<path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/>',
  truck: '<path d="M8.25 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm10.5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM6 18.75h4.5m1.5-12h3.75c.621 0 1.157.386 1.373.93l1.847 4.618a1.5 1.5 0 0 1-.302 1.52L17.25 17.25H15m-2.25 0h-5.25M3.75 6.75h6.75v9H3.75v-9Z"/>',
  lock: '<path d="M16.5 10.5v-2.25a4.5 4.5 0 1 0-9 0v2.25m11.25 0h-13.5a.75.75 0 0 0-.75.75v7.5a.75.75 0 0 0 .75.75h13.5a.75.75 0 0 0 .75-.75v-7.5a.75.75 0 0 0-.75-.75Z"/>',
  shield: '<path d="M9 12.75 11.25 15 15 9.75M22.5 11.25c0-4.97-3.75-7.5-10.5-9.75C5.25 3.75 1.5 6.28 1.5 11.25c0 8.25 7.5 10.5 10.5 12 3-1.5 10.5-3.75 10.5-12Z"/>',
  check: '<path d="m4.5 12.75 6 6 9-13.5"/>',
  card: '<path d="M2.25 8.25h19.5M2.25 18h19.5m-18-5.25h4.5m3 0h6m-9.75 5.25v-10.5a2.25 2.25 0 0 1 2.25-2.25h15a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25Z"/>',
  chat: '<path d="M20.25 8.51A8.26 8.26 0 0 1 12 20.25a8.26 8.26 0 0 1-3.5-.79L3.75 20.25l1.25-3.23A8.25 8.25 0 1 1 20.25 8.51Z"/>',
  star: '<path d="M11.48 3.5a.56.56 0 0 1 1.04 0l2.12 5.11 5.52.45c.5.04.7.67.32 1.01l-4.2 3.6 1.28 5.38a.56.56 0 0 1-.84.61L12 16.73l-4.72 2.93a.56.56 0 0 1-.84-.61l1.28-5.38-4.2-3.6a.56.56 0 0 1 .32-1l5.52-.46 2.12-5.11Z"/>',
  gift: '<path d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 20.25V3.75m0 0S9.75 6 8.625 6a2.625 2.625 0 1 1 0-5.25C10.5.75 12 3.75 12 3.75Zm0 0s2.25-3 3.375-3a2.625 2.625 0 1 1 0 5.25C13.5 6 12 3.75 12 3.75ZM3 7.5h18v3.75H3V7.5Z"/>',
  bag: '<path d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m10.5-3v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 22.5V12"/><path d="M5.25 6.75h13.5a.75.75 0 0 1 .75.75v2.25H4.5V7.5a.75.75 0 0 1 .75-.75Z" fill="rgba(255,255,255,.08)"/>',
  x: '<path d="M6 18 18 6M6 6l12 12"/>',
  trash: '<path d="M14.25 5.25h5m-14 0h1.5m3 0v14.25a1.5 1.5 0 0 0 1.5 1.5h2.25a1.5 1.5 0 0 0 1.5-1.5V5.25m-7.5 0V3.75A2.25 2.25 0 0 1 9.75 1.5h1.5a2.25 2.25 0 0 1 2.25 2.25v1.5m-7.5 0h12"/>',
  pin: '<path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path d="M12 2.25c-4.14 0-7.5 3.17-7.5 7.08 0 5.22 7.5 12.42 7.5 12.42s7.5-7.2 7.5-12.42c0-3.91-3.36-7.08-7.5-7.08Z"/>',
  phone: '<path d="M2.25 6.67c0 8.32 6.76 15.08 15.08 15.08h.82a1.13 1.13 0 0 0 1.13-1.13v-2.5a1.13 1.13 0 0 0-.97-1.12l-3.1-.52a1.13 1.13 0 0 0-1.1.46l-.66.99a9.72 9.72 0 0 1-4.63-4.63l.98-.66a1.13 1.13 0 0 0 .46-1.1l-.51-3.1a1.13 1.13 0 0 0-1.13-.97H3.38a1.13 1.13 0 0 0-1.13 1.13v2.07Z"/>',
  mail: '<path d="M21.75 7.5v9a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25v-9m19.5 0a2.25 2.25 0 0 0-2.25-2.25h-15A2.25 2.25 0 0 0 2.25 7.5m19.5 0-9.75 6.1a.56.56 0 0 1-.64 0L1.5 7.5"/>',
  clock: '<path d="M12 6.75v5.25l3 2.25M21.75 12a9.75 9.75 0 1 1-19.5 0 9.75 9.75 0 0 1 19.5 0Z"/>',
  box: '<path d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>',
  ticket: '<path d="M16.5 6v.75m0 0v3m0-3h5.06a2.25 2.25 0 0 1 2.19 1.74c.04.17.06.34.06.51v1.5a2.25 2.25 0 0 0 0 4.5v1.5c0 .17-.02.35-.06.52A2.25 2.25 0 0 1 21.56 18.75H16.5v-3m0 3H2.44a2.25 2.25 0 0 1-2.19-1.73 2.5 2.5 0 0 1-.06-.52v-1.5a2.25 2.25 0 0 0 0-4.5V8.5c0-.17.02-.34.06-.51A2.25 2.25 0 0 1 2.44 6.75H16.5m0-.75V4.5"/>',
  return: '<path d="M9 15 3 9m0 0 6-6M3 9h12.75A5.25 5.25 0 0 1 21 14.25V18"/>',
  eye: '<path d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3.99 5.29A11.94 11.94 0 0 1 12 3.75c6 0 9.75 7.5 9.75 7.5a17.46 17.46 0 0 1-2.64 3.78m-3.27 3.2A11.6 11.6 0 0 1 12 20.25c-6 0-9.75-7.5-9.75-7.5 0 0 .77-1.54 2.16-3.16M15 12a3 3 0 1 1-6 0M3.75 3.75l16.5 16.5"/>',
  smartphone: '<path d="M10.5 1.5h3a1.5 1.5 0 0 1 1.5 1.5v18a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 21V3a1.5 1.5 0 0 1 1.5-1.5ZM10.87 19.5h2.26"/>',
  headphones: '<path d="M4.5 15a7.5 7.5 0 1 1 15 0m-15 0v2.25a2.25 2.25 0 0 1-2.18 2.25 1.87 1.87 0 0 1-1.82-1.87v-.76A1.87 1.87 0 0 1 2.37 15a1.87 1.87 0 0 1 2.13 0Zm15 0v2.25a2.25 2.25 0 0 0 2.18 2.25 1.87 1.87 0 0 0 1.82-1.87v-.76A1.87 1.87 0 0 0 21.63 15a1.87 1.87 0 0 0-2.13 0Z"/>',
  watch: '<path d="M12 6.75a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5Zm0 0V3m0 15v3.75M12 10.5V12l1.5 1"/>',
  gamepad: '<path d="M7.5 13.5h1.5m-.75-.75v1.5M16.5 13.5h.01M15 15h.01M6.37 6.75h11.26c1.6 0 2.94 1.18 3.13 2.77l.5 3.94a3.24 3.24 0 0 1-5.55 2.52l-.84-.9a1.5 1.5 0 0 0-1.13-.52H9.76a1.5 1.5 0 0 0-1.13.52l-.84.9a3.24 3.24 0 0 1-5.55-2.52l.5-3.94a3.24 3.24 0 0 1 3.13-2.77Z"/>',
  shirt: '<path d="M15.75 3.75 18 4.9l2.7 1.35a.9.9 0 0 1 .48.72l.24 2.4c.05.5-.36.93-.86.93h-.81v8.1a1.5 1.5 0 0 1-1.5 1.5H5.75a1.5 1.5 0 0 1-1.5-1.5v-8.1h-.81c-.5 0-.9-.43-.86-.93l.24-2.4a.9.9 0 0 1 .48-.72L6 4.9l2.25-1.15a3 3 0 0 0 7.5 0Z"/>',
  camera: '<path d="M6.83 5.5h-.25A2.25 2.25 0 0 0 4.33 7.75v9.5A2.25 2.25 0 0 0 6.58 19.5h10.84a2.25 2.25 0 0 0 2.25-2.25v-9.5a2.25 2.25 0 0 0-2.25-2.25h-.25m-12.84 0 1.4-2.1a1.5 1.5 0 0 1 1.22-.63h7.65c.48 0 .93.24 1.2.63l1.4 2.1M12 15.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>',
  logout: '<path d="M15.75 9V6.75a2.25 2.25 0 0 0-2.25-2.25h-7.5A2.25 2.25 0 0 0 3.75 6.75v10.5A2.25 2.25 0 0 0 6 19.5h7.5a2.25 2.25 0 0 0 2.25-2.25V15m4.5-3H8.25m9.75 0-3-3m3 3-3 3"/>',
  sparkles: '<path d="m9.81 2.9 1.28 3.31a2.25 2.25 0 0 0 1.32 1.32l3.32 1.29-3.32 1.32a2.25 2.25 0 0 0-1.32 1.32L9.81 14.85l-1.3-3.35a2.25 2.25 0 0 0-1.32-1.32l-3.35-1.32 3.35-1.29a2.25 2.25 0 0 0 1.32-1.32L9.8 2.9ZM18.75 13.5l.64 1.65c.1.25.29.44.53.54l1.66.64-1.66.66a1.13 1.13 0 0 0-.53.53l-.64 1.66-.66-1.66a1.13 1.13 0 0 0-.53-.53l-1.66-.66 1.66-.64c.24-.1.43-.29.53-.53l.66-1.66Z"/>',
  arrowleft: '<path d="M10.5 19.5 3 12m7.5 7.5L18 12m-7.5 7.5V4.5M12 3l7.5 7.5L12 18"/>',
  percent: '<path d="M12 3.75 3.75 12 12 20.25 20.25 12 12 3.75Zm0 5.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM6.75 6.75 7.5 7.5m9 9 .75.75"/>',
  thumbup: '<path d="M7 22V10l4.2-7.4A1.9 1.9 0 0 1 14.6 4.9L13.4 10h5.4a2 2 0 0 1 2 2.5l-1.8 7.2A2.2 2.2 0 0 1 16.8 22H7z"/><path d="M7 10H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4"/>',
  thumbdown: '<path d="M17 2v12l-4.2 7.4A1.9 1.9 0 0 1 9.4 19.1l1.2-5.1H5.2a2 2 0 0 1-2-2.5l1.8-7.2A2.2 2.2 0 0 1 7.2 2H17z"/><path d="M17 14h4a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1h-4"/>',
  video: '<rect x="2" y="6" width="13" height="12" rx="2.5"/><path d="m22 8.5-7 3.5 7 3.5z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  alert: '<path d="M12 3 2.5 20h19L12 3z"/><path d="M12 10v4"/><path d="M12 17.4v.6"/>',
  key: '<path d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-9.03 5.25l-6.3 6.3a1.5 1.5 0 0 1-2.12 0L2.7 18.3a1.5 1.5 0 0 1 0-2.12l6.3-6.3A6 6 0 1 1 21.75 8.25ZM18 9h.01"/>',
};
window.aryIcon = function (name, extra) {
  var d = window.ARYA_ICONS[name] || ARYA_ICONS.box;
  var cls = extra || 'w-5 h-5';
  return '<svg class="ary-ic ' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
};
window.ARYA_BOX_SVG = '<div class="w-full h-full flex items-center justify-center text-white/30">' + (window.ARYA_ICONS ? '<svg class="ary-ic w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + ARYA_ICONS.box + '</svg>' : '📦') + '</div>';
// آیکون دسته‌بندی: اگر داده نام آیکون داشت SVG و اگر ایموجی/متن بود همان متن
window.aryCatIcon = function (cat, extra) {
  var ic = (cat && cat.icon) ? String(cat.icon) : '';
  if (ARYA_ICONS[ic]) return aryIcon(ic, extra || 'w-6 h-6');
  return ic ? '<span aria-hidden="true">' + ic + '</span>' : aryIcon('box', extra || 'w-6 h-6');
};

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
    if (btn) btn.innerHTML = shell.classList.contains('open') ? '✕' : aryIcon('search','w-5 h-5');
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
                ${aryIcon('search','w-5 h-5 lg:w-6 lg:h-6')}
              </button>

              <!-- Cart -->
              <button onclick="navigate('cart')" class="relative p-2.5 lg:p-3 glass rounded-xl hover:bg-white/10" aria-label="سبد خرید" type="button">
                ${aryIcon('cart','w-5 h-5 lg:w-6 lg:h-6')}
                ${cartCount>0?`<span class="absolute -top-1 -right-1 gpt5-badge">${cartCount>99?'99+':cartCount}</span>`:''}
              </button>

              <!-- Profile / Admin -->
              ${state.user?`
                <button onclick="navigate('profile')" class="p-2.5 lg:p-3 glass rounded-xl hover:bg-white/10" aria-label="پروفایل" type="button">${aryIcon('user','w-5 h-5')}</button>

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
                <span class="gpt5-search-icon">${aryIcon('search','w-4 h-4')}</span>
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
            <button onclick="toggleSearchBar(); toggleMenu();" class="gpt5-drawer-link" style="width:auto;" type="button"><span style="display:inline-flex;gap:.4rem;align-items:center">${aryIcon('search','w-4 h-4')}جستجو</span></button>
            ${state.user?`
              <button onclick="navigate('profile'); toggleMenu();" class="gpt5-drawer-link" style="width:auto;" type="button"><span style="display:inline-flex;gap:.4rem;align-items:center">${aryIcon('user','w-4 h-4')}پروفایل</span></button>

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

  // پلاک مجوز: اگر url داشت، لینک تأیید بیرونی (eNamad/Samandehi) با noopener
  function aryBadgeHtml(b) {
    var img = '<img src="' + b.img + '" alt="' + (b.alt || '') + '" title="' + (b.alt || '') + '" class="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 object-contain rounded-lg glass p-1 transition hover:scale-110 hover:bg-white/10" loading="lazy">';
    if (b.url) return '<a href="' + b.url + '" target="_blank" rel="noopener noreferrer" title="مشاهده و تأیید اصالت این مجوز">' + img + '</a>';
    return img;
  }
  window.aryBadgeHtml = window.aryBadgeHtml || aryBadgeHtml;

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
                <li class="flex items-center gap-2">${aryIcon("phone","w-4 h-4 text-violet-300")}<span class="font-mono" dir="ltr">۰۲۱-۱۲۳۴۵۶۸</span></li>
                <li class="flex items-center gap-2">${aryIcon("mail","w-4 h-4 text-violet-300")}<span>info@premium-shop.ir</span></li>
                <li class="flex items-center gap-2">${aryIcon("pin","w-4 h-4 text-violet-300")}<span>تهران، ایران</span></li>
                <li class="flex items-center gap-2">${aryIcon("clock","w-4 h-4 text-violet-300")}<span>شنبه تا پنج‌شنبه ۹-۱۸</span></li>
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
                  ${trustBadges.map(aryBadgeHtml).join('')}
                </div>
                `
                : badges.map(aryBadgeHtml).join('')}
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
          <div class="flex items-center justify-center w-full h-full text-white/15">' + (window.ARYA_ICONS ? '<svg class="ary-ic w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">' + ARYA_ICONS.box + '</svg>' : '📦') + '</div>
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
          <span>${aryIcon('cart','w-6 h-6')}</span>
          <span>افزودن به سبد</span>
        </button>
      </div>
    </article>
  `;
}