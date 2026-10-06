// ═══════════════════════════════════════════════════════════════
// سیستم آیکون SVG (جایگزین ایموجی) — خطی، هم‌وزن Tailwind
// مصرف: aryIcon('cart') یا aryIcon('truck', 'w-6 h-6 text-emerald-400')
// ═══════════════════════════════════════════════════════════════
window.ARYA_ICONS = {
  // آیکون‌ها: پک رسمی Lucide v0.462.0 (lucide.dev — ISC) — 24×24، currentColor
  thumbdown: '<path d="M17 14V2" /> <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />',
  video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" /> <rect x="2" y="6" width="14" height="12" rx="2" />',
  edit: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /> <path d="m15 5 4 4" />',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /> <path d="M12 9v4" /> <path d="M12 17h.01" />',
  grid: '<rect width="7" height="7" x="3" y="3" rx="1" /> <rect width="7" height="7" x="14" y="3" rx="1" /> <rect width="7" height="7" x="14" y="14" rx="1" /> <rect width="7" height="7" x="3" y="14" rx="1" />',
  coins: '<circle cx="8" cy="8" r="6" /> <path d="M18.09 10.37A6 6 0 1 1 10.34 18" /> <path d="M7 6h1v4" /> <path d="m16.71 13.88.7.71-2.82 2.82" />',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /> <circle cx="9" cy="7" r="4" /> <path d="M22 21v-2a4 4 0 0 0-3-3.87" /> <path d="M16 3.13a4 4 0 0 1 0 7.75" />',
  trending: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /> <polyline points="16 7 22 7 22 13" />',
  hourglass: '<path d="M5 22h14" /> <path d="M5 2h14" /> <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /> <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /> <circle cx="12" cy="12" r="3" />',
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /> <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3" /> <path d="M3 5V19A9 3 0 0 0 21 19V5" /> <path d="M3 12A9 3 0 0 0 21 12" />',
  list: '<path d="M3 12h.01" /> <path d="M3 18h.01" /> <path d="M3 6h.01" /> <path d="M8 12h13" /> <path d="M8 18h13" /> <path d="M8 6h13" />',
  key: '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" /> <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />',
  cart: '<circle cx="8" cy="21" r="1" /> <circle cx="19" cy="21" r="1" /> <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />',
  search: '<circle cx="11" cy="11" r="8" /> <path d="m21 21-4.3-4.3" />',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /> <circle cx="12" cy="7" r="4" />',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />',
  bolt: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /> <path d="M15 18H9" /> <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /> <circle cx="17" cy="18" r="2" /> <circle cx="7" cy="18" r="2" />',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /> <path d="M7 11V7a5 5 0 0 1 10 0v4" />',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /> <path d="m9 12 2 2 4-4" />',
  check: '<path d="M20 6 9 17l-5-5" />',
  card: '<rect width="20" height="14" x="2" y="5" rx="2" /> <line x1="2" x2="22" y1="10" y2="10" />',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />',
  star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1" /> <path d="M12 8v13" /> <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /> <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /> <path d="M3 6h18" /> <path d="M16 10a4 4 0 0 1-8 0" />',
  x: '<path d="M18 6 6 18" /> <path d="m6 6 12 12" />',
  trash: '<path d="M3 6h18" /> <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /> <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /> <line x1="10" x2="10" y1="11" y2="17" /> <line x1="14" x2="14" y1="11" y2="17" />',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /> <circle cx="12" cy="10" r="3" />',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2" /> <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />',
  clock: '<circle cx="12" cy="12" r="10" /> <polyline points="12 6 12 12 16 14" />',
  box: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" /> <path d="M12 22V12" /> <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" /> <path d="m7.5 4.27 9 5.15" />',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /> <path d="M13 5v2" /> <path d="M13 17v2" /> <path d="M13 11v2" />',
  plus: '<path d="M5 12h14" /> <path d="M12 5v14" />',
  chevrondown: '<path d="m6 9 6 6 6-6" />',
  info: '<circle cx="12" cy="12" r="10" /> <path d="M12 16v-4" /> <path d="M12 8h.01" />',
  return: '<path d="M9 14 4 9l5-5" /> <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /> <circle cx="12" cy="12" r="3" />',
  eyeoff: '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /> <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /> <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /> <path d="m2 2 20 20" />',
  smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2" /> <path d="M12 18h.01" />',
  headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />',
  watch: '<circle cx="12" cy="12" r="6" /> <polyline points="12 10 12 12 13 13" /> <path d="m16.13 7.66-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05" /> <path d="m7.88 16.36.8 4a2 2 0 0 0 2 1.61h2.72a2 2 0 0 0 2-1.61l.81-4.05" />',
  gamepad: '<line x1="6" x2="10" y1="11" y2="11" /> <line x1="8" x2="8" y1="9" y2="13" /> <line x1="15" x2="15.01" y1="12" y2="12" /> <line x1="18" x2="18.01" y1="10" y2="10" /> <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />',
  shirt: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /> <circle cx="12" cy="13" r="3" />',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /> <polyline points="16 17 21 12 16 7" /> <line x1="21" x2="9" y1="12" y2="12" />',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /> <path d="M20 3v4" /> <path d="M22 5h-4" /> <path d="M4 17v2" /> <path d="M5 18H3" />',
  arrowleft: '<path d="m12 19-7-7 7-7" /> <path d="M19 12H5" />',
  percent: '<line x1="19" x2="5" y1="5" y2="19" /> <circle cx="6.5" cy="6.5" r="2.5" /> <circle cx="17.5" cy="17.5" r="2.5" />',
  thumbup: '<path d="M7 10v12" /> <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />',
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
                <li class="flex items-center gap-2">${aryIcon("phone","w-4 h-4 text-blue-300")}<span class="font-mono" dir="ltr">۰۲۱-۱۲۳۴۵۶۸</span></li>
                <li class="flex items-center gap-2">${aryIcon("mail","w-4 h-4 text-blue-300")}<span>info@premium-shop.ir</span></li>
                <li class="flex items-center gap-2">${aryIcon("pin","w-4 h-4 text-blue-300")}<span>تهران، ایران</span></li>
                <li class="flex items-center gap-2">${aryIcon("clock","w-4 h-4 text-blue-300")}<span>شنبه تا پنج‌شنبه ۹-۱۸</span></li>
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
        class="product-image aspect-square flex items-center justify-center text-6xl lg:text-8xl cursor-pointer relative bg-gradient-to-br from-blue-500/10 to-sky-600/10"
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
          <div class="flex items-center justify-center w-full h-full text-white/15">${window.ARYA_ICONS ? '<svg class="ary-ic w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">' + ARYA_ICONS.box + '</svg>' : '📦'}</div>
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
          <span class="text-[10px] lg:text-xs text-blue-400 font-medium mb-2 block">
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