// ═══════════════════════════════════════════════════════════════
// AryaWp — راند ۴۱
//  1) موتور آیکون: تبدیل خودکار <i class="ri-*"> (فونت RemixIcon که در این
//     پروژه بارگذاری نشده) به SVG درون‌خطی — با MutationObserver روی همه رندرها.
//  2) موتور ویرایشگر مقاله به سبک وردپرس: منوی کامل بالای صفحه + برگه سفید وسط.
// File: assets/js/wp_editor.js
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';
  function S(inner, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1.06em;height:1.06em;flex:none;display:block" ' + (extra || '') + ' aria-hidden="true">' + inner + '</svg>';
  }
  var R = {
    'add-line': S('<path d="M12 5v14M5 12h14"/>'),
    'subtract-line': S('<path d="M5 12h14"/>'),
    'close-line': S('<path d="M18 6 6 18M6 6l12 12"/>'),
    'check-line': S('<path d="m4.5 12.5 5 5 10-11"/>'),
    'edit-line': S('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
    'delete-bin-line': S('<path d="M3 6h18M8 6V4h8v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>'),
    'search-line': S('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    'eye-line': S('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
    'eye-off-line': S('<path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 3-.5"/>'),
    'arrow-go-back-line': S('<path d="M3 7v6h6"/><path d="M3.5 13a9 9 0 1 0 2.1-6.4L3 9"/>'),
    'arrow-go-forward-line': S('<path d="M21 7v6h-6"/><path d="M20.5 13a9 9 0 1 1-2.1-6.4L21 9"/>'),
    'arrow-left-line': S('<path d="M19 12H5m7-7-7 7 7 7"/>'),
    'arrow-right-line': S('<path d="M5 12h14m-7-7 7 7-7 7"/>'),
    'arrow-up-line': S('<path d="M12 19V5m-7 7 7-7 7 7"/>'),
    'arrow-down-line': S('<path d="M12 5v14m7-7-7 7-7-7"/>'),
    'bold': S('<path d="M7 5h6a3.4 3.4 0 0 1 0 6.8H7Zm0 6.8h7a3.6 3.6 0 0 1 0 7.2H7Z" fill="currentColor" stroke-width="1.4"/>'),
    'italic': S('<path d="M15 4h-6m6 16H9M14 4l-4 16"/>'),
    'underline': S('<path d="M6 4v6a6 6 0 0 0 12 0V4M4 20h16"/>'),
    'strikethrough': S('<path d="M16 6a4 4 0 0 0-4-2.5C9.6 3.5 8 5 8 6.8c0 1.3.7 2.3 2 3M8 17a4 4 0 0 0 4 2.5c2.4 0 4-1.5 4-3.3 0-1.3-.7-2.3-2-3M4 12h16"/>'),
    'align-left': S('<path d="M4 6h16M4 12h10M4 18h13"/>'),
    'align-center': S('<path d="M4 6h16M7 12h10M5 18h14"/>'),
    'align-right': S('<path d="M4 6h16M10 12h10M7 18h13"/>'),
    'align-justify': S('<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>'),
    'double-quotes-l': S('<path d="M10 8c-2.8 0-5 2.2-5 5v3h5v-5H7.5C7.5 9.6 8.6 8.5 10 8.5Zm9 0c-2.8 0-5 2.2-5 5v3h5v-5h-2.5c0-1.4 1.1-2.5 2.5-2.5Z" fill="currentColor" stroke="none"/>'),
    'link': S('<path d="M10 13a5 5 0 0 0 7.5.5l2.5-2.5a5 5 0 0 0-7-7L11.5 6.5"/><path d="M14 11a5 5 0 0 0-7.5-.5L4 13a5 5 0 0 0 7 7l2.5-2.5"/>'),
    'unlink': S('<path d="M9.5 14.5 6 18a4.2 4.2 0 0 1-6-6l3.5-3.5M14.5 9.5 18 6a4.2 4.2 0 0 1 6 6l-3.5 3.5M4 4l16 16"/>'),
    'table-line': S('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/>'),
    'separator': S('<path d="M4 12h16"/><path d="M8 6h8M8 18h8" opacity=".45"/>'),
    'list-unordered': S('<path d="M8 6h13M8 12h13M8 18h13M3.6 6h.01M3.6 12h.01M3.6 18h.01"/>'),
    'list-ordered': S('<path d="M10 6h11M10 12h11M10 18h11M4 5.5h1V9M4 9h2M4 15.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5c0 1.4-3 1.9-3 3.5h3"/>'),
    'font-size': S('<path d="M3 20 8.5 5 14 20M5.3 14.5h6.4"/><path d="M14.5 20 18 10l3.5 10m-2.6-3.6h3.2"/>'),
    'video-line': S('<rect x="2" y="6" width="13" height="12" rx="2"/><path d="m22 8.5-7 3.5 7 3.5Z"/>'),
    'image-line': S('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 15.5-4.5-4L6 20"/>'),
    'box-3-line': S('<path d="m12 3 8 4.2v9.6L12 21l-8-4.2V7.2Z"/><path d="m4 7.2 8 4.3 8-4.3M12 21v-9.5"/>'),
    'code-line': S('<path d="m8 7-5 5 5 5m8-10 5 5-5 5"/>'),
    'paragraph': S('<path d="M13 4v16M17 4v16M19 4H9.5a5.5 5.5 0 0 0 0 11H13"/>'),
    'h1': S('<path d="M4 5v14M12 5v14M4 12h8M16 7l3-1.6V19" stroke-width="2.4"/>'),
    'h2': S('<path d="M4 5v14M12 5v14M4 12h8M15.5 8.6A2.6 2.6 0 0 1 20.5 10c0 2.4-5 3.9-5 9h5.3"/>'),
    'h3': S('<path d="M4 5v14M12 5v14M4 12h8M15.5 7.4A2.4 2.4 0 0 1 20.4 9c0 1.4-1.2 2.4-2.6 2.8 1.8.4 3 1.5 3 3a2.6 2.6 0 0 1-5.2.4"/>'),
    'eraser': S('<path d="m7 21-4.3-4.3a1.8 1.8 0 0 1 0-2.5L14 3.5a1.8 1.8 0 0 1 2.5 0L22 9a1.8 1.8 0 0 1 0 2.5L13 20.6"/><path d="M7 21h13M10 8l7 7"/>'),
    'settings-line': S('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"/>'),
    'save-line': S('<path d="M5 4h11l3 3v13H5Z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>'),
    'file-list': S('<path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6H8Zm0 0v6h6"/><path d="M8 13h8M8 17h6" stroke-width="1.6"/>'),
  };
  var DEFAULT = S('<circle cx="12" cy="12" r="3.2"/>');
  function lookup(cls) {
    var m = /ri-([a-z0-9-]+)/.exec(cls || '');
    if (!m) return null;
    var k = m[1];
    if (R[k]) return R[k];
    var alt = { 'bold': 'bold', 'italic': 'italic', 'underline': 'underline', 'strikethrough': 'strikethrough' };
    for (var key in R) { if (k.indexOf(key) === 0) return R[key]; }
    if (alt[k]) return R[alt[k]];
    return null;
  }
  function fixNode(n) {
    if (!n || n.nodeType !== 1) return;
    var list = [];
    if (n.matches && n.matches('i[class*="ri-"]')) list.push(n);
    if (n.querySelectorAll) list = list.concat([].slice.call(n.querySelectorAll('i[class*="ri-"]')));
    var remixLinked = false;
    try { remixLinked = !!(document.querySelector('link[href*="remixicon"]') && document.fonts && document.fonts.check('16px RemixIcon')); } catch (e) {}
    list.forEach(function (el) {
      if (el.getAttribute('data-aryico')) return;
      var svg = lookup(el.className);
      if (!svg && remixLinked) { el.setAttribute('data-aryico', 'skip'); return; }
      el.setAttribute('data-aryico', '1');
      el.className = String(el.className || '').replace(/ri-[a-z0-9-]+/g, '').trim();
      el.innerHTML = svg || DEFAULT;
      el.style.display = 'inline-flex'; el.style.alignItems = 'center'; el.style.justifyContent = 'center'; el.style.fontStyle = 'normal';
      el.classList.add('ary-ic-i');
      el.setAttribute('aria-hidden', 'true');
    });
  }
  function installIcons() {
    fixNode(document.body);
    try {
      new MutationObserver(function (ms) {
        for (var i = 0; i < ms.length; i++) {
          var a = ms[i].addedNodes;
          for (var j = 0; j < a.length; j++) fixNode(a[j]);
        }
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installIcons);
  else installIcons();

  /* ─── موتور سبک وردپرس ─── */
  var WP = {
    focusEditor: function (id) {
      var el = document.getElementById(id || 'ary-wp-body');
      if (el) el.focus();
      return el;
    },
    exec: function (cmd, val, id) {
      var el = WP.focusEditor(id); if (!el) return;
      try { document.execCommand(cmd, false, val == null ? null : String(val)); } catch (e) {}
      WP.sync(id);
      WP.refreshState(id);
    },
    block: function (tag, id) {
      var el = WP.focusEditor(id); if (!el) return;
      try { document.execCommand('formatBlock', false, tag === 'p' ? 'p' : tag); } catch (e) {}
      WP.sync(id);
    },
    sync: function (id) {
      var el = document.getElementById(id || 'ary-wp-body'); if (!el) return;
      var cb = el.getAttribute('data-oninput');
      if (cb) { try { window[cb] && window[cb](el.innerHTML); } catch (e) {} }
    },
    refreshState: function () {
      var el = document.getElementById('ary-wp-body');
      if (!el) return;
      if (window.__AryaWpState) window.__AryaWpState.dirty = true;
      var txt = String(el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      var words = txt ? (txt.match(/[\u0600-\uFBFFa-zA-Z0-9]+/g) || []).length : 0;
      var cW = document.getElementById('ary-wp-wcount'); if (cW) cW.textContent = words.toLocaleString('fa-IR') + ' واژه';
      var cC = document.getElementById('ary-wp-ccount'); if (cC) cC.textContent = txt.length.toLocaleString('fa-IR') + ' نویسه';
    },
    snapshot: function (id) {
      var el = document.getElementById(id || 'ary-wp-body'); return el ? el.innerHTML : '';
    },
    setHTML: function (html, id) {
      var el = document.getElementById(id || 'ary-wp-body'); if (el) el.innerHTML = html || '';
    },
    insertHTML: function (html, id) {
      var el = WP.focusEditor(id); if (!el) return;
      try { document.execCommand('insertHTML', false, html); } catch (e) { el.innerHTML = el.innerHTML + html; }
      WP.refreshState(id);
    },
    undo: function (id) { WP.focusEditor(id); try { document.execCommand('undo'); } catch (e) {} WP.refreshState(id); },
    redo: function (id) { WP.focusEditor(id); try { document.execCommand('redo'); } catch (e) {} WP.refreshState(id); },
    /* لینک بدون دیالوگ native: پاپ‌اور کوچک بالای تولبار */
    linkPop: function (id) {
      var ed = WP.focusEditor(id); if (!ed) return;
      document.querySelectorAll('.ary-wp-linkpop').forEach(function (n) { n.remove(); });
      var sel = String(window.getSelection ? window.getSelection().toString() : '');
      var pop = document.createElement('div');
      pop.className = 'ary-wp-linkpop fixed z-[80] left-1/2 -translate-x-1/2 top-[112px] glass-strong rounded-xl p-2.5 flex gap-2 items-center shadow-2xl';
      pop.innerHTML = '<input data-u class="input-style text-xs w-56 sm:w-72" dir="ltr" placeholder="https://…" value="https://">'
        + (sel ? '<span class="text-[10px] text-white/50 whitespace-nowrap">روی «' + sel.slice(0, 14) + '…»</span>' : '')
        + '<button type="button" data-ok class="btn-primary !py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap">ثبت لینک</button>'
        + '<button type="button" data-x class="btn-ghost !py-1.5 px-3 rounded-lg text-xs whitespace-nowrap">انصراف</button>';
      document.body.appendChild(pop);
      var u = pop.querySelector('[data-u]'); u.focus();
      var done = function (ok) {
        var url = String(u.value || '').trim();
        pop.remove();
        if (ok && url && !/^(javascript|vbscript|data):/i.test(url)) {
          ed.focus();
          try {
            if (!String(window.getSelection())) document.execCommand('insertHTML', false, '<a href="' + url.replace(/"/g, '&quot;') + '">' + url.replace(/</g, '') + '</a>');
            else document.execCommand('createLink', false, url);
          } catch (e) {}
        }
        WP.refreshState(id);
      };
      pop.querySelector('[data-ok]').onclick = function () { done(true); };
      pop.querySelector('[data-x]').onclick = function () { done(false); };
      u.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); done(true); } if (e.key === 'Escape') done(false); };
    },
    /* پیش‌نویس خودکار در localStorage */
    autosave: function (key, getObj) {
      WP._t && clearInterval(WP._t);
      WP._t = setInterval(function () {
        try {
          var o = getObj && getObj(); if (!o) return;
          localStorage.setItem('arya_wp_draft_' + key, JSON.stringify({ at: Date.now(), o: o }));
          var el = document.getElementById('ary-wp-saved');
          if (el) el.textContent = 'پیش‌نویس خودکار: ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {}
      }, 12000);
    },
    stopAutosave: function () { WP._t && clearInterval(WP._t); WP._t = 0; },
    draft: function (key) { try { return JSON.parse(localStorage.getItem('arya_wp_draft_' + key) || 'null'); } catch (e) { return null; } },
    clearDraft: function (key) { try { localStorage.removeItem('arya_wp_draft_' + key); } catch (e) {} },
    /* منوی کشویی بلوک */
    blockMenu: function (v, id) { if (v) WP.exec && WP.block(v, id); },
    icons: function () { return R; },
  };
  window.AryaWp = WP;
  window.aryWpIco = function (name, cls) { return R[name] || DEFAULT; };
})();
