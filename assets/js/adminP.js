// ═════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD — PRO VERSION (WITH 3 ESSENTIAL CHARTS)
// File: assets/js/admin dashboard.js
// ═════════════════════════════════════════════════════════════════

function renderAdminDashboard() {
  const orders = Array.isArray(state.orders) ? state.orders : [];
  const products = Array.isArray(state.products) ? state.products : [];
  const users = Array.isArray(state.users) ? state.users : [];

  // Total sales
  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Today orders
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(o => (o.created_at || '').startsWith(today));

  // Pending orders
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  // Last 5 orders
  const lastOrders = orders
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // Best selling products
  const productSales = {};
  orders.forEach(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach(i => {
      if (!productSales[i.id]) productSales[i.id] = { title: i.title, qty: 0 };
      productSales[i.id].qty += i.qty || 1;
    });
  });

  const bestProducts = Object.values(productSales)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return `
    <div class="animate-fade">

      <h1 class="text-2xl lg:text-3xl font-black mb-8">داشبورد مدیریت</h1>

      <!-- Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        ${dashboardStatCard("coins", "کل فروش", utils.formatPriceShort(totalSales), "from-emerald-500 to-green-600", todayOrders.length + ' سفارش امروز')}
        ${dashboardStatCard("trending", "سفارشات امروز", todayOrders.length, "from-blue-500 to-cyan-600", 'میانگین ' + utils.formatPriceShort(todayOrders.length ? Math.round(totalSales / Math.max(orders.length,1)) : 0) + ' تومان')}
        ${dashboardStatCard("hourglass", "در انتظار پردازش", pendingOrders, "from-amber-500 to-orange-600", 'نیازمند بررسی')}
        ${dashboardStatCard("box", "محصولات فعال", products.length, "from-blue-500 to-sky-600", users.length + ' کاربر ثبت‌نامی')}
      </div>

      <!-- Essential Charts -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6">
        ${renderSalesChart(orders)}
        ${renderOrdersChart(orders)}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 mb-6">
      ${renderMonthlyRevenueChart(orders)}
      ${renderStatusDonut(orders)}

      <!-- Best Selling Products -->
      <div class="glass rounded-2xl p-4 sm:p-6 h-full">
        <h2 class="font-bold text-lg mb-4 flex items-center gap-2">${typeof aryIcon === 'function' ? aryIcon('star', 'w-4 h-4 text-amber-400') : ''}پرفروش‌ترین محصولات</h2>

        ${
          bestProducts.length === 0
            ? `<p class="text-white/60 text-sm">هنوز فروشی ثبت نشده است.</p>`
            : `
              <div class="space-y-2.5">
                ${bestProducts
                  .map((p, bi) => {
                    const maxQ = bestProducts[0].qty || 1;
                    const pct = Math.max(6, Math.round((p.qty / maxQ) * 100));
                    return `
                  <div class="rounded-xl p-3 sm:p-4 bg-white/[.04] border border-white/5">
                    <div class="flex items-center justify-between gap-3 min-w-0">
                      <span class="text-sm font-medium truncate flex items-center gap-2 min-w-0"><span class="text-white/30 font-mono text-xs shrink-0">${bi + 1}</span><span class="truncate">${escapeHtml(p.title)}</span></span>
                      <span class="text-emerald-400 font-bold shrink-0 text-sm">${p.qty} عدد</span>
                    </div>
                    <div class="h-1.5 mt-2 rounded-full bg-white/5 overflow-hidden"><div class="h-full rounded-full bg-gradient-to-l from-emerald-400 to-teal-400" style="width:${pct}%"></div></div>
                  </div>
                `;
                  })
                  .join("")}
              </div>
            `
        }
      </div>
      </div>

      <!-- Recent Orders -->
      <div class="glass rounded-2xl p-6">
        <h2 class="font-bold text-lg mb-5">آخرین سفارشات</h2>

        ${
          lastOrders.length === 0
            ? `<p class="text-white/60 text-center py-12">سفارشی ثبت نشده است</p>`
            : `
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-white/10">
                      <th class="text-right py-4 px-3 text-white/60 font-medium">شماره</th>
                      <th class="text-right py-4 px-3 text-white/60 font-medium hidden sm:table-cell">مشتری</th>
                      <th class="text-right py-4 px-3 text-white/60 font-medium">مبلغ</th>
                      <th class="text-right py-4 px-3 text-white/60 font-medium">وضعیت</th>
                      <th class="text-right py-4 px-3 text-white/60 font-medium hidden lg:table-cell">تاریخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${lastOrders
                      .map(o => {
                        const statusInfo = utils.getStatusInfo(o.status);
                        return `
                          <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td class="py-4 px-3 font-mono text-xs">#${(o.id || "").slice(-6)}</td>
                            <td class="py-4 px-3 hidden sm:table-cell">${o.user_name || o.user_phone}</td>
                            <td class="py-4 px-3 text-emerald-400 font-bold">${utils.formatPrice(o.total)}</td>
                            <td class="py-4 px-3"><span class="badge ${statusInfo.badge}">${statusInfo.label}</span></td>
                            <td class="py-4 px-3 text-white/60 hidden lg:table-cell">${utils.formatDate(o.created_at)}</td>
                          </tr>
                        `;
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
        }
      </div>

    </div>
  `;
}

/* Helper: stat card */
function dashboardStatCard(icon, label, value, gradient, hint) {
  const svg = (typeof aryIcon === 'function') ? aryIcon(icon, 'w-6 h-6 text-white') : '';
  return `
    <div class="glass rounded-2xl p-4 sm:p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20">
      <div class="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l ${gradient} opacity-80"></div>
      <div class="flex items-center gap-3 sm:gap-4 min-w-0">
        <div class="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg shrink-0 transition-transform group-hover:scale-105">
          ${svg || `<span class="text-2xl">${icon}</span>`}
        </div>
        <div class="min-w-0">
          <p class="text-white/55 text-[11px] sm:text-xs">${label}</p>
          <p class="text-lg sm:text-xl xl:text-2xl font-black leading-8 truncate">${value}</p>
          ${hint ? `<p class="text-[10px] text-white/40 truncate">${hint}</p>` : ''}
        </div>
      </div>
    </div>
  `;
}

/* ============================================================
   ADMIN CHARTS — SVG حرفه‌ای (area/bar/donut) با گرید، لیبل و tooltip
   ============================================================ */
function _arySeries30(orders, numeric) {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const map = {};
  days.forEach(d => (map[d] = 0));
  orders.forEach(o => {
    const k = (o.created_at || '').slice(0, 10);
    if (map[k] !== undefined) map[k] += numeric ? (Number(o.total) || 0) : 1;
  });
  return { days, values: days.map(d => map[d]) };
}

function _aryAreaChart(days, values, gradId, c1, c2, fmt) {
  const max = Math.max(...values, 1);
  const W = 300, H = 110, pad = 6;
  const x = i => pad + (i / Math.max(days.length - 1, 1)) * (W - pad * 2);
  const y = v => H - pad - (v / max) * (H - pad * 2);
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(values.length - 1).toFixed(1)} ${H - pad} L${x(0).toFixed(1)} ${H - pad} Z`;
  const dates = days;
  const pts = values.map((v, i) => (v > 0 && (i % 2 === 0 || i === values.length - 1))
    ? `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="2" fill="#fff" opacity=".9"><title>${days[i] || ''} — ${fmt(v)}</title></circle>` : '').join('');
  const gridY = [0.25, 0.5, 0.75].map(f => `<line x1="${pad}" x2="${W - pad}" y1="${(H - pad - f * (H - pad * 2)).toFixed(1)}" y2="${(H - pad - f * (H - pad * 2)).toFixed(1)}" stroke="rgba(255,255,255,.06)" stroke-width=".5"/>`).join('');
  return `
    <svg viewBox="0 0 ${W} ${H}" class="w-full h-32 sm:h-36 lg:h-40" preserveAspectRatio="none" dir="ltr" aria-hidden="true">
      <defs>
        <linearGradient id="${gradId}" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="${c1}" stop-opacity=".45"/>
          <stop offset="100%" stop-color="${c2}" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="${gradId}s" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stop-color="${c2}"/>
          <stop offset="100%" stop-color="${c1}"/>
        </linearGradient>
      </defs>
      ${gridY}
      <path d="${area}" fill="url(#${gradId})"/>
      <path d="${line}" fill="none" stroke="url(#${gradId}s)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      ${pts}
    </svg>
    <div class="flex justify-between text-[9px] text-white/30 mt-1 tabular-nums" dir="ltr">
      <span>${dates[0] ? dates[0].slice(5) : ''}</span>
      <span>${dates[Math.floor(dates.length / 2)] ? dates[Math.floor(dates.length / 2)].slice(5) : ''}</span>
      <span>${dates[dates.length - 1] ? dates[dates.length - 1].slice(5) : ''}</span>
    </div>`;
}

function _aryBarsChart(days, values, gradId, c1, c2, fmt) {
  const max = Math.max(...values, 1);
  const W = 300, H = 110, pad = 6, n = values.length;
  const bw = (W - pad * 2) / n * .62;
  const step = (W - pad * 2) / n;
  const bars = values.map((v, i) => {
    const h = Math.max(v > 0 ? 2 : 0.8, (v / max) * (H - pad * 2 - 10));
    return `<rect x="${(pad + i * step + (step - bw) / 2).toFixed(1)}" y="${(H - pad - 10 - h + 10).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="1.2" fill="url(#${gradId})" ${v > 0 ? '' : 'opacity=".25"'}><title>${escapeHtml(days[i])} — ${fmt(v)}</title></rect>`;
  }).join('');
  return `
    <svg viewBox="0 0 ${W} ${H}" class="w-full h-32 sm:h-36 lg:h-40" preserveAspectRatio="none" dir="ltr" aria-hidden="true">
      <defs>
        <linearGradient id="${gradId}" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <line x1="${pad}" x2="${W - pad}" y1="${H - pad - 10}" y2="${H - pad - 10}" stroke="rgba(255,255,255,.1)" stroke-width=".6"/>
      ${bars}
    </svg>`;
}

function renderSalesChart(orders) {
  const { days, values } = _arySeries30(orders, true);
  const total = values.reduce((a, b) => a + b, 0);
  const best = Math.max(...values, 0);
  return `
    <div class="glass rounded-2xl p-4 sm:p-6 h-full flex flex-col">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 class="font-bold text-sm sm:text-lg flex items-center gap-2">${typeof aryIcon === 'function' ? aryIcon('trending', 'w-4 h-4 text-emerald-400') : ''}فروش ۳۰ روز اخیر</h2>
        <div class="flex items-center gap-2 text-[10px] sm:text-xs">
          <span class="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300">جمع: ${utils.formatPriceShort(total)}</span>
          <span class="px-2 py-1 rounded-lg bg-white/5 text-white/50">اوج روزانه: ${utils.formatPriceShort(best)}</span>
        </div>
      </div>
      ${_aryAreaChart(days, values, 'gArySales', '#4ade80', '#22c55e', v => utils.formatPrice(v))}
      <p class="text-[10px] text-white/40 mt-2">راهنما: محور افقی روزِ ماه، عمودی مبلغ — روی نقاط نگه دارید</p>
    </div>
  `;
}

function renderOrdersChart(orders) {
  const { days, values } = _arySeries30(orders, false);
  const total = values.reduce((a, b) => a + b, 0);
  return `
    <div class="glass rounded-2xl p-4 sm:p-6 h-full flex flex-col">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 class="font-bold text-sm sm:text-lg flex items-center gap-2">${typeof aryIcon === 'function' ? aryIcon('box', 'w-4 h-4 text-sky-400') : ''}سفارش‌های ۳۰ روز اخیر</h2>
        <span class="px-2 py-1 rounded-lg bg-sky-500/10 text-sky-300 text-[10px] sm:text-xs">مجموع: ${total}</span>
      </div>
      ${_aryBarsChart(days, values, 'gAryOrders', '#38bdf8', '#0ea5e9', v => v + ' سفارش')}
      <p class="text-[10px] text-white/40 mt-2">تعداد سفارش هر روز</p>
    </div>
  `;
}

function renderMonthlyRevenueChart(orders) {
  const months = [], now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const map = {};
  months.forEach(m => (map[m] = 0));
  orders.forEach(o => { const k = (o.created_at || '').slice(0, 7); if (map[k] !== undefined) map[k] += Number(o.total) || 0; });
  const values = months.map(m => map[m]);
  return `
    <div class="glass rounded-2xl p-4 sm:p-6 h-full flex flex-col">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 class="font-bold text-sm sm:text-lg flex items-center gap-2">${typeof aryIcon === 'function' ? aryIcon('coins', 'w-4 h-4 text-pink-400') : ''}درآمد ۱۲ ماه اخیر</h2>
        <span class="px-2 py-1 rounded-lg bg-pink-500/10 text-pink-300 text-[10px] sm:text-xs">میانگین ماهانه: ${utils.formatPriceShort(values.reduce((a, b) => a + b, 0) / 12)}</span>
      </div>
      ${_aryBarsChart(months, values, 'gAryMonthly', '#f472b6', '#ec4899', v => utils.formatPrice(v))}
      <p class="text-[10px] text-white/40 mt-2">ستون‌ها از چپ: ۱۲ ماه گذشته ← ماه جاری</p>
    </div>
  `;
}

function renderStatusDonut(orders) {
  const defs = [
    ['pending',    'در انتظار',   '#f59e0b'],
    ['processing', 'پردازش',      '#38bdf8'],
    ['shipped',    'ارسال‌شده',    '#60a5fa'],
    ['delivered',  'تحویل‌شده',    '#34d399'],
    ['canceled',   'لغوشده',       '#fb7185'],
  ];
  const counts = defs.map(([k]) => [k, orders.filter(o => (o.status || 'pending') === k).length]);
  const total = counts.reduce((a, [, v]) => a + v, 0) || 1;
  let acc = 0;
  const segs = counts.map(([k, v], i) => {
    if (!v) return '';
    const frac = v / total;
    const dash = `${(frac * 87.96).toFixed(2)} ${(87.96 * (1 - frac)).toFixed(2)}`;
    const off = -acc * 87.96;
    acc += frac;
    return `<circle r="14" cx="16" cy="16" fill="none" stroke="${defs[i][2]}" stroke-width="3.4" stroke-dasharray="${dash}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 16 16)"><title>${defs[i][1]}: ${v}</title></circle>`;
  }).join('');
  const legend = counts.map(([k, v], i) => `
    <div class="flex items-center justify-between gap-2 text-xs">
      <span class="flex items-center gap-2 text-white/70"><span class="block w-2.5 h-2.5 rounded-full shrink-0" style="background:${defs[i][2]}"></span>${defs[i][1]}</span>
      <span class="font-bold tabular-nums">${v}<span class="text-white/40 font-normal mr-1">(${Math.round((v / total) * 100)}٪)</span></span>
    </div>`).join('');
  return `
    <div class="glass rounded-2xl p-4 sm:p-6 h-full flex flex-col">
      <h2 class="font-bold text-sm sm:text-lg mb-4">توزیع وضعیت سفارش‌ها</h2>
      <div class="flex items-center gap-4 sm:gap-6 min-w-0">
        <div class="relative shrink-0 w-28 h-28 sm:w-32 sm:h-32">
          <svg viewBox="0 0 32 32" class="w-full h-full" style="transform:scaleX(-1)" aria-hidden="true">
            <circle r="14" cx="16" cy="16" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="3.4"/>
            ${segs}
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-xl font-black tabular-nums">${counts.reduce((a, [, v]) => a + v, 0)}</span>
            <span class="text-[9px] text-white/50">کل سفارش</span>
          </div>
        </div>
        <div class="flex-1 space-y-2 min-w-0">${legend}</div>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// ADMIN ORDERS
// File: assets/js/admin orders.js
// ═══════════════════════════════════════════════════════════════
function renderAdminOrders() {
  let filteredOrders = [...state.orders];
  
  if (state.orderFilter.status) {
    filteredOrders = filteredOrders.filter(o => o.status === state.orderFilter.status);
  }
  const returnsRequestedCount = (state.orders || []).filter(o => o.return_status === 'requested').length;
  const canceledCount = (state.orders || []).filter(o => (o.status || 'pending') === 'canceled').length;
  const _ordIcon = (n, c) => (typeof aryIcon === 'function' ? aryIcon(n, c) : '');
  
  return `
    <div class="animate-fade">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 class="text-2xl lg:text-3xl font-black">سفارشات (${filteredOrders.length})</h1>
        <div class="flex items-center gap-2">
          ${canceledCount > 0 ? `<button type="button" onclick="state.orderFilter.status='canceled'; state.orderFilter.view=''; render()" class="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/25 hover:bg-rose-500/25 transition-all">✕ ${canceledCount} لغوشده</button>` : ''}
          <button type="button" onclick="aryAdminRefreshNow(this)" title="دریافت آخرین سفارش‌ها از سرور" class="px-3.5 py-2 rounded-xl text-xs font-bold glass hover:bg-white/10 text-white/70">↻ بازخوانی سرور</button>
        </div>
      </div>
      
      <!-- Filter -->
      <div class="glass rounded-2xl p-4 lg:p-5 mb-6 space-y-3">
        <div class="flex flex-wrap gap-2">
          <button
            onclick="state.orderFilter.status = ''; state.orderFilter.view = ''; render()"
            class="px-3.5 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all ${!state.orderFilter.status && !state.orderFilter.view ? 'bg-blue-500 text-white' : 'glass hover:bg-white/10'}"
          >همه</button>
          ${[
            { value: 'pending', label: 'در انتظار', color: 'bg-amber-500' },
            { value: 'processing', label: 'پردازش', color: 'bg-blue-500' },
            { value: 'shipped', label: 'ارسال شده', color: 'bg-cyan-500' },
            { value: 'delivered', label: 'تحویل', color: 'bg-emerald-500' },
            { value: 'canceled', label: 'لغوشده', color: 'bg-rose-600' }
          ].map(opt => `
            <button
              onclick="state.orderFilter.status = '${opt.value}'; state.orderFilter.view = ''; render()"
              class="px-3.5 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all ${state.orderFilter.status === opt.value && !state.orderFilter.view ? opt.color + ' text-white' : 'glass hover:bg-white/10'}"
            >${opt.label}</button>
          `).join('')}
          <button
            onclick="state.orderFilter.view = state.orderFilter.view === 'returns' ? '' : 'returns'; state.orderFilter.status = ''; render()"
            class="px-3.5 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all inline-flex items-center gap-2 ${state.orderFilter.view === 'returns' ? 'bg-sky-500 text-white' : 'glass hover:bg-white/10 text-sky-200'}"
          >مرجوعی‌ها
            ${returnsRequestedCount > 0 ? `<span class="bg-white/25 text-white text-[10px] font-bold rounded-full px-1.5 leading-4">${returnsRequestedCount}</span>` : ''}
          </button>
        </div>
        <div class="relative">
          <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 inline-flex">${typeof aryIcon === 'function' ? aryIcon('search', 'w-4 h-4') : ''}</span>
          <input id="admin-orders-search" type="search" placeholder="جستجو: شماره سفارش، موبایل یا نام مشتری…"
            class="input-style w-full pr-10 text-sm" value="${escapeHtml(state.orderFilter.q || '')}"
            oninput="state.orderFilter.q = this.value; updateAdminOrdersList()" autocomplete="off">
        </div>
      </div>

      <div id="admin-orders-list">
      ${renderAdminOrdersList(filteredOrders)}
      </div>
      `;
}

function renderAdminOrdersList(filteredOrders) {
  const q = String((state.orderFilter && state.orderFilter.q) || '').trim().toLowerCase();
  const returnsRequestedCount = (state.orders || []).filter(o => o.return_status === 'requested').length;
  let list = Array.isArray(filteredOrders) ? filteredOrders.slice() : [];
  if (state.orderFilter && state.orderFilter.view === 'returns') {
    list = list.filter(o => o.return_status && o.return_status !== 'none');
  }
  if (q) {
    const digits = q.replace(/\D/g, '');
    const isPhone = digits.length >= 4 && /^0?9?\d+$/.test(digits);
    list = list.filter(o =>
      String(o.id || '').toLowerCase().includes(q) ||
      (isPhone && String(o.user_phone || '').replace(/\D/g, '').includes(digits)) ||
      String(o.user_name || '').toLowerCase().includes(q) ||
      String(o.return_reason || '').toLowerCase().includes(q));
  }

  if (state.orderFilter && state.orderFilter.view === 'returns') {
    const groups = [['requested', 'در انتظار بررسی من', 'text-sky-300 bg-sky-500/10'], ['approved', 'تأییدشده', 'text-emerald-300 bg-emerald-500/10'], ['rejected', 'ردشده', 'text-rose-300 bg-rose-500/10'], ['completed', 'عودت‌شده', 'text-white/70 bg-white/10']];
    const sum = groups.map(([k, label, cls]) => {
      const n = (state.orders || []).filter(o => o.return_status === k).length;
      return `<span class="px-2.5 py-1 rounded-lg text-[11px] ${cls}">${label}: <b>${n}</b></span>`;
    }).join('');
    list = [...list].sort((a, b) => ((a.return_status === 'requested') ? 0 : 1) - ((b.return_status === 'requested') ? 0 : 1) || String(b.return_at || '').localeCompare(String(a.return_at || '')));
    return `
      <div class="glass rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-2">
        <span class="text-xs text-white/60 font-bold">خلاصه مرجوعی‌ها:</span>
        ${sum}
      </div>
      ${list.length === 0 ? `<div class="glass rounded-2xl p-12 text-center text-sm text-white/50">موردی برای نمایش نیست.</div>` : ''}
      ${list.map((order, i) => renderAdminOrderCard(order, i)).join('')}
    `;
  }
  if (list.length === 0) {
    return `<div class="glass rounded-2xl p-12 text-center text-sm text-white/50">سفارشی با این فیلترها یافت نشد.</div>`;
  }
  return `<div class="space-y-4">${list.map((order, i) => renderAdminOrderCard(order, i)).join('')}</div>`;
}

function updateAdminOrdersList() {
  const wrap = document.getElementById('admin-orders-list');
  if (!wrap) return;
  let fo = Array.isArray(state.orders) ? [...state.orders] : [];
  if (state.orderFilter && state.orderFilter.status) fo = fo.filter(o => (o.status || 'pending') === state.orderFilter.status);
  wrap.innerHTML = renderAdminOrdersList(fo);
}
window.updateAdminOrdersList = updateAdminOrdersList;

function renderAdminOrderCard(order, i) {
  const items = JSON.parse(order.items || '[]');
  const canceled = (order.status || 'pending') === 'canceled';
  const delivered = (order.status || 'pending') === 'delivered';
  const ret = order.return_status && order.return_status !== 'none';
  const ai = (n, c) => (typeof aryIcon === 'function' ? aryIcon(n, c) : '');
  return `
              <div class="glass rounded-2xl p-5 lg:p-6 animate-fade ${canceled ? 'border border-rose-500/40 bg-rose-500/[0.05]' : ''}" style="animation-delay: ${i * 0.05}s">
                <div class="flex flex-wrap items-center justify-between gap-4 mb-5">
                  <div>
                    <span class="font-mono font-bold">#${(order.id || '').slice(-8)}</span>
                    ${canceled ? `<span class="mr-2 inline-flex items-center gap-1 align-middle text-[10px] font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 rounded-lg px-2 py-0.5">✕ لغوشده${order.cancel_reason ? ' توسط مشتری' : ''}</span>` : ''}
                    ${ret ? `<span class="mr-2 inline-flex items-center gap-1 align-middle text-[10px] font-bold text-sky-300 bg-sky-500/15 border border-sky-500/30 rounded-lg px-2 py-0.5">↩ مرجوعی</span>` : ''}
                    <p class="text-xs text-white/60 mt-1">${utils.formatDateTime(order.created_at)}</p>
                  </div>
                  
                  <div>
                    <label for="status-${order.id}" class="sr-only">وضعیت سفارش</label>
                    <select 
                      id="status-${order.id}"
                      onchange="updateOrderStatus(state.orders.find(o => o.id === '${order.id}'), this.value)"
                      class="bg-white/10 border border-white/20 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>در انتظار</option>
                      <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>در حال پردازش</option>
                      <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>ارسال شده</option>
                      <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>تحویل</option>
                    <option value="canceled" ${order.status === 'canceled' ? 'selected' : ''}>لغو</option>
                    </select>
                                        ${order.return_status && order.return_status !== 'none' ? `
                                        <div class="mt-2 rounded-xl border p-2.5 " + (order.return_status === 'requested' ? 'border-sky-500/30 bg-sky-500/10' : (order.return_status === 'approved' || order.return_status === 'completed' ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10')) + "">
                                          <div class="flex flex-wrap items-center justify-between gap-2">
                                            <p class="text-[11px] font-bold " + (order.return_status === 'requested' ? 'text-sky-300' : 'text-white/70') + "">مرجوعی: ${order.return_status === 'requested' ? 'در انتظار بررسی' : (order.return_status === 'approved' ? 'تایید شده' : (order.return_status === 'completed' ? 'عودت شد' : 'رد شده'))}</p>
                                            ${order.return_status === 'requested' ? `<span class="flex gap-2"><button type="button" class="btn-success text-[11px] px-2.5 py-1 rounded-lg" onclick="aryAdminReturnDecision('${order.id}', 'approved')">تایید مرجوعی</button> <button type="button" class="btn-danger text-[11px] px-2.5 py-1 rounded-lg" onclick="aryAdminReturnDecision('${order.id}', 'rejected')">رد مرجوعی</button></span>` : ''}
                                          </div>
                                          ${order.return_reason ? `<p class="text-[10px] text-white/60 mt-1.5 leading-5">دلیل مشتری: ${escapeHtml(String(order.return_reason).slice(0, 300))}</p>` : ''}
                                        </div>` : ''}
                                      </div>
                                    </div>
                
                <div class="grid md:grid-cols-3 gap-4">
                  <div class="glass rounded-xl p-4">
                    <p class="text-xs text-white/60 mb-2">مشتری</p>
                    <p class="font-semibold">${order.user_name || 'بدون نام'}</p>
                    <p class="text-sm font-mono text-white/70">${order.user_phone}</p>
                  </div>
                  
                  <div class="glass rounded-xl p-4 hidden md:block">
                    <p class="text-xs text-white/60 mb-2">آدرس</p>
                    <p class="text-sm line-clamp-2">${order.address || '-'}</p>
                  </div>
                  
                  <div class="glass rounded-xl p-4">
                    <p class="text-xs text-white/60 mb-2">مبلغ کل</p>
                    <p class="text-xl font-black ${canceled ? 'text-rose-300 line-through decoration-rose-400/70 decoration-2' : 'text-emerald-400'}">${utils.formatPrice(order.total)}</p>
                    <p class="text-xs text-white/60">${items.length} کالا</p>
                  </div>
                </div>
              </div>
                ${canceled && order.cancel_reason ? `<p class="mt-3 text-[11px] text-rose-300/85">دلیل لغو مشتری: ${escapeHtml(String(order.cancel_reason).slice(0,300))}</p>` : ''}
                <!-- کالاهای سفارش -->
                <div class="mt-4 rounded-2xl bg-black/25 border border-white/5 p-3.5">
                  <p class="text-[11px] font-bold text-white/55 mb-2 flex items-center gap-1.5">${typeof aryIcon === 'function' ? aryIcon('box', 'w-3.5 h-3.5') : ''} اقلام (${items.length})</p>
                  ${items.length === 0 ? `<p class="text-[11px] text-white/40">—</p>` : `
                    <div class="divide-y divide-white/5">
                      ${items.map(it => `
                        <div class="flex items-center justify-between gap-3 py-1.5 text-xs">
                          <span class="text-white/85 truncate min-w-0">${escapeHtml(it.title || it.name || 'محصول')}</span>
                          <span class="shrink-0 text-white/55 font-mono" dir="ltr">${Number(it.qty || it.count || 1)} × ${utils.formatPrice(it.price || 0)}</span>
                        </div>`).join('')}
                      ${Number(order.discount || 0) > 0 ? `<div class="flex items-center justify-between gap-3 py-1.5 text-xs"><span class="text-emerald-300">تخفیف</span><span class="text-emerald-300 font-mono" dir="ltr">-${utils.formatPrice(order.discount)}</span></div>` : ''}
                      ${Number(order.shipping_cost || order.shipping || 0) > 0 ? `<div class="flex items-center justify-between gap-3 py-1.5 text-xs"><span class="text-white/60">هزینه ارسال</span><span class="text-white/70 font-mono" dir="ltr">${utils.formatPrice(order.shipping_cost || order.shipping)}</span></div>` : ''}
                    </div>`}
                </div>

                <!-- نقشه راه وضعیت -->
                ${canceled ? `
                  <div class="mt-3 rounded-xl bg-rose-500/10 border border-rose-500/25 px-3.5 py-2 text-[11px] text-rose-200 inline-flex items-center gap-2">✕ این سفارش لغو شده است${order.cancel_reason ? ' — ' + escapeHtml(String(order.cancel_reason).slice(0,120)) : ''}</div>
                ` : `
                  <div class="mt-3 flex items-center gap-0 flex-wrap">
                    ${[
                      { k: 'pending',    l: 'ثبت' },
                      { k: 'processing', l: 'پردازش' },
                      { k: 'shipped',    l: 'ارسال' },
                      { k: 'delivered',  l: 'تحویل' }
                    ].map((st, si, arr) => {
                      const orderIdx = ['pending','processing','shipped','delivered'].indexOf(order.status || 'pending');
                      const done = si <= orderIdx;
                      const cur = si === orderIdx;
                      return `<div class="flex items-center">
                        <div class="flex flex-col items-center gap-1 w-14">
                          <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition
                            ${done ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/15 text-white/35'}
                            ${cur ? 'ring-2 ring-blue-400/50 scale-110' : ''}">${done ? (typeof aryIcon === 'function' ? aryIcon('check', 'w-3 h-3') : '✓') : si + 1}</span>
                          <span class="text-[9.5px] ${cur ? 'text-blue-300 font-bold' : done ? 'text-white/60' : 'text-white/35'}">${st.l}</span>
                        </div>
                        ${si < arr.length - 1 ? `<span class="w-6 h-0.5 rounded ${si < orderIdx ? 'bg-blue-500/70' : 'bg-white/10'} -mt-4"></span>` : ''}
                      </div>`;
                    }).join('')}
                    ${order.tracking_code ? `<span dir="ltr" class="mr-2 text-[10px] font-mono text-white/50 bg-white/5 rounded-lg px-2 py-1 border border-white/10">TRK ${escapeHtml(String(order.tracking_code).slice(0, 24))}</span>` : ''}
                  </div>
                `}

                <div class="mt-4 pt-3.5 border-t border-white/5 flex flex-wrap items-center gap-2">
                  ${delivered && !ret ? `<button type="button" class="text-[11px] px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-300 hover:bg-sky-500/25 transition-all inline-flex items-center gap-1.5" onclick="aryAdminOpenReturn('${order.id}')">${ai('hourglass','w-3.5 h-3.5')}ثبت مرجوعی مشتری</button>` : ''}
                  ${order.status === 'shipped' || order.tracking_code ? `<span class="text-[11px] text-white/50">کد رهگیری: <b dir="ltr" class="font-mono text-white/85">${escapeHtml(order.tracking_code || '-')}</b></span>` : ''}
                  ${ret ? `<span class="text-[10px] text-white/45">وضعیت عودت: <b class="text-white/70">${order.return_status}</b>${order.refund_status && order.refund_status !== 'none' ? ` • بازگشت وجه: <b class="text-white/70">${order.refund_status}</b>` : ''}</span>` : ''}
                  <span class="flex-1"></span>
                  ${!canceled ? `<button type="button" class="text-[11px] px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-300 hover:bg-blue-500/25 transition-all inline-flex items-center gap-1.5 border border-blue-500/20" onclick="aryAdminOpenTracking('${order.id}')">${ai('truck','w-3.5 h-3.5')}${order.tracking_code ? 'ویرایش رهگیری' : 'ثبت کد رهگیری'}</button>` : ''}
                  <button type="button" class="text-[11px] px-3 py-1.5 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition-all" onclick="aryAdminCopyOrderCode('${order.id}')">کپی شناسه</button>
                  <button type="button" class="text-[11px] px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/25 transition-all inline-flex items-center gap-1.5" onclick="adminDeleteOrder('${order.id}')">${ai('trash','w-3.5 h-3.5')}حذف سفارش</button>
                </div>
              </div>
            `;
}

window.aryAdminCopyOrderCode = async function (id) {
  try { await navigator.clipboard.writeText(String(id)); if (window.toast) toast('شناسه سفارش کپی شد', 'success'); }
  catch (e) { if (window.toast) toast('کپی ممکن نبود', 'error'); }
};

window.adminDeleteOrder = function (id) {
  const o = (state.orders || []).find(x => x.id === id);
  if (!o) return;
  state.confirmModal = {
    icon: '🗑️',
    title: 'حذف دائمی سفارش',
    message: 'سفارش #' + String(o.id || '').slice(-8) + ' به نام ' + (o.user_name || 'بدون نام') + ' (' + utils.formatPrice(o.total) + ') برای همیشه حذف می‌شود. این کار قابل بازگشت نیست و در لاگ امنیتی سرور ثبت می‌شود. برای تأیید، عبارت «حذف» را وارد کنید.',
    confirmText: 'حذف دائمی',
    confirmClass: 'bg-rose-600 hover:bg-rose-500 text-white',
    requirePhrase: 'حذف',
    onConfirm: async function () {
      const res = await adminApiCall('delete&table=orders', { id: o.id });
      if (res && res.ok === false) { if (window.toast) toast('حذف ناموفق: ' + (res.msg || ''), 'error'); return; }
      state.confirmModal = null;
      state.orders = (state.orders || []).filter(x => x.id !== o.id);
      if (window.toast) toast('سفارش حذف شد', 'success');
      render();
    }
  };
  render();
};

window.aryAdminOpenReturn = function (id) {
  const o = (state.orders || []).find(x => x.id === id);
  if (!o) return;
  const cur = document.getElementById('ary-return-reason-modal');
  if (cur) cur.remove();
  const wrap = document.createElement('div');
  wrap.id = 'ary-return-reason-modal';
  wrap.className = 'fixed inset-0 z-[110] flex items-center justify-center p-4 modal-overlay';
  wrap.innerHTML = `<div class="glass-strong rounded-3xl p-6 max-w-md w-full animate-scale text-right">
    <h3 class="font-bold text-lg mb-2">ثبت مرجوعی برای #${String(o.id || '').slice(-8)}</h3>
    <p class="text-xs text-white/60 mb-3">مرجوعی طبق سیاست فروشگاه بررسی می‌شود (۷ روز پس از تحویل، سلامت کالا و…).</p>
    <textarea id="ary-return-reason" rows="3" class="input-style w-full text-sm" placeholder="شرح کارشناسی/دلیل مشتری…"></textarea>
    <div class="flex gap-3 mt-4">
      <button type="button" class="flex-1 btn-ghost py-2.5 rounded-xl" onclick="document.getElementById('ary-return-reason-modal').remove()">انصراف</button>
      <button type="button" class="flex-1 btn-primary py-2.5 rounded-xl text-sm" onclick="aryAdminSubmitReturn('${o.id}')">ثبت درخواست مرجوعی</button>
    </div></div>`;
  document.body.appendChild(wrap);
};

window.aryAdminOpenTracking = function (id) {
  const o = (state.orders || []).find(x => x.id === id);
  if (!o) return;
  const cur = document.getElementById('ary-track-modal');
  if (cur) cur.remove();
  const wrap = document.createElement('div');
  wrap.id = 'ary-track-modal';
  wrap.className = 'fixed inset-0 z-[110] flex items-center justify-center p-4 modal-overlay';
  const willShip = (o.status || 'pending') !== 'delivered' && (o.status || 'pending') !== 'shipped';
  wrap.innerHTML = `<div class="glass-strong rounded-3xl p-6 max-w-lg w-full animate-scale text-right">
    <h3 class="font-bold text-lg mb-1">پیگیری و ارسال سفارش #${String(o.id || '').slice(-8)}</h3>
    <p class="text-xs text-white/55 mb-4">کد رهگیری باربری را ثبت کنید؛ مشتری همین کد را در «پیگیری سفارش» سایت می‌بیند.</p>
    <label class="block text-xs text-white/60 mb-1.5">کد رهگیری (باربری/پست تیپاکس و…)</label>
    <input id="ary-track-code" dir="ltr" class="input-style w-full text-left font-mono" placeholder="مثلاً 1234567890123" value="${(o.tracking_code || '').replace(/"/g, '&quot;')}">
    <label class="block text-xs text-white/60 mt-4 mb-1.5">یادداشت داخلی برای مشتری (اختیاری)</label>
    <textarea id="ary-track-note" rows="2" class="input-style w-full text-sm" placeholder="مثلاً: بسته فردا صبح تحویل پست شد">${(o.admin_note || '').replace(/</g, '&lt;')}</textarea>
    ${willShip ? `<label class="mt-4 flex items-center gap-2 text-xs text-white/70 cursor-pointer select-none"><input id="ary-track-ship" type="checkbox" class="accent-blue-500 w-4 h-4" checked> وضعیت سفارش هم به «ارسال شده» تغییر کند</label>` : ''}
    <div class="flex gap-3 mt-5">
      <button type="button" class="flex-1 btn-ghost py-2.5 rounded-xl" onclick="document.getElementById('ary-track-modal').remove()">انصراف</button>
      <button type="button" class="flex-1 btn-primary py-2.5 rounded-xl text-sm font-bold" onclick="aryAdminSaveTracking('${o.id}', ${willShip ? 1 : 0})">ذخیره رهگیری</button>
    </div></div>`;
  document.body.appendChild(wrap);
  setTimeout(() => { const el = document.getElementById('ary-track-code'); if (el) el.focus(); }, 40);
};

window.aryAdminSaveTracking = async function (id, willShip) {
  const code = String((document.getElementById('ary-track-code') || {}).value || '').trim();
  const note = String((document.getElementById('ary-track-note') || {}).value || '').trim().slice(0, 500);
  if (!code) { if (window.toast) toast('کد رهگیری را وارد کنید', 'warning'); return; }
  const shipEl = document.getElementById('ary-track-ship');
  const setShipped = willShip && (!shipEl || shipEl.checked);
  const o = (state.orders || []).find(x => x.id === id);
  const patch = { id: String(id), tracking_code: code };
  if (note !== '') patch.admin_note = note; else if (o && o.admin_note !== undefined) patch.admin_note = o.admin_note;
  if (setShipped) patch.status = 'shipped';
  let failed = null;
  if (window.AryaServer && AryaServer.isConfigured()) {
    const r = await AryaServer.crud.upsert('orders', patch).catch(e => ({ ok: false, msg: 'خطای شبکه' }));
    if (r && r.ok === false) failed = r.msg || 'ذخیره روی سرور ناموفق بود';
  }
  if (failed) { if (window.toast) toast(failed, 'error'); return; }
  if (o) { o.tracking_code = code; if (note !== '') o.admin_note = note; if (setShipped) o.status = 'shipped'; }
  if (window.AryaDB) { try { AryaDB.upsert('orders', patch); } catch (e) {} }
  const m = document.getElementById('ary-track-modal'); if (m) m.remove();
  window.__aryOrdersSig = ''; // بگذار لاگ زنده تغییر را ببیند
  if (window.toast) toast('کد رهگیری ثبت شد' + (setShipped ? ' و سفارش «ارسال شده» شد' : ''), 'success');
  render();
};

window.aryAdminSubmitReturn = async function (id) {
  const o = (state.orders || []).find(x => x.id === id) || {};
  const ta = document.getElementById('ary-return-reason');
  const reason = String((ta && ta.value) || '').trim();
  const res = await adminApiCall('order_return', { id: id, phone: o.user_phone, admin: 1, reason: reason || 'درخواست ثبت‌شده توسط کارشناس' });
  const m = document.getElementById('ary-return-reason-modal');
  if (m) m.remove();
  if (res && res.ok === false) { if (window.toast) toast('خطا: ' + (res.msg || ''), 'error'); return; }
  if (o && o.id) { o.return_status = 'requested'; o.return_reason = reason || o.return_reason; o.return_at = new Date().toISOString(); }
  if (window.toast) toast('مرجوعی ثبت شد؛ در انتظار تصمیم', 'success');
  render();
};

// ═══════════════════════════════════════════════════════════════
// ADMIN PANEL
// File: assets/js/admin panel.js
// ═══════════════════════════════════════════════════════════════

/* ========== Global state bootstrapping ========== */

state.reviews = Array.isArray(state.reviews) ? state.reviews : [];
state.adminReviewsSelectedProductId = state.adminReviewsSelectedProductId || null;
state.adminReviewsFilter = state.adminReviewsFilter || { status: '', q: '' };

state.supportFilter = state.supportFilter || { status: '', priority: '', view: 'all' };
state.adminSupportSelectedTicketId = state.adminSupportSelectedTicketId || null;
state.supportQuickReplies = Array.isArray(state.supportQuickReplies)
  ? state.supportQuickReplies
  : [
      { id: 'qr1', label: 'تشکر از تماس', text: 'سلام، ممنون از پیام شما. درخواست شما در حال بررسی است.' },
      { id: 'qr2', label: 'اطلاع از پیگیری', text: 'درخواست شما ثبت شد و به زودی نتیجه را اطلاع می‌دهیم.' }
    ];

state.orderFilter = state.orderFilter || { status: '', q: '', view: '' };
state.productSearchQ = state.productSearchQ || '';
state.productVideosOnly = !!state.productVideosOnly;
state.adminTab = state.adminTab || 'dashboard';

state.categoryModal = state.categoryModal || null;

/* ============================================================
   BOTTOM SHEET — FULL OPEN ONLY (iOS STYLE)
   ============================================================ */

let sheetState = {
  dragging: false,
  startY: 0,
  lastY: 0,
  lastTime: 0,
  velocity: 0,
  height: 0,
  mode: "closed" // closed | full
};

function getSheetElements() {
  return {
    sheet: document.querySelector(".admin-sheet"),
    backdrop: document.querySelector(".admin-sheet-backdrop"),
    trigger: document.querySelector(".admin-sheet-trigger")
  };
}

function sheetSetMode(mode) {
  const { sheet, backdrop, trigger } = getSheetElements();
  if (!sheet) return;

  sheetState.mode = mode;

  if (mode === "closed") {
    sheet.style.transform = `translateY(100%)`;
    backdrop.classList.remove("sheet-open");
    trigger.classList.remove("hidden-trigger");
  }

  if (mode === "full") {
    sheet.style.transform = `translateY(0%)`;
    backdrop.classList.add("sheet-open");
    trigger.classList.add("hidden-trigger");
  }
}

function sheetToggle(force) {
  if (force === true) return sheetSetMode("full");
  if (force === false) return sheetSetMode("closed");

  sheetSetMode(sheetState.mode === "closed" ? "full" : "closed");
}

function sheetDragStart(e) {
  const { sheet } = getSheetElements();
  if (!sheet) return;

  const target = e.target;
  if (!target.closest(".admin-sheet-handle")) return;

  const isTouch = e.type === "touchstart";
  const clientY = isTouch ? e.touches[0].clientY : e.clientY;

  sheetState.dragging = true;
  sheetState.startY = clientY;
  sheetState.lastY = clientY;
  sheetState.lastTime = performance.now();
  sheetState.height = sheet.offsetHeight;

  sheet.style.transition = "none";

  if (!isTouch) {
    window.addEventListener("mousemove", sheetDragMove);
    window.addEventListener("mouseup", sheetDragEnd);
  } else {
    window.addEventListener("touchmove", sheetDragMove, { passive: false });
    window.addEventListener("touchend", sheetDragEnd);
    window.addEventListener("touchcancel", sheetDragEnd);
  }
}

function sheetDragMove(e) {
  if (!sheetState.dragging) return;

  const { sheet } = getSheetElements();
  if (!sheet) return;

  const isTouch = e.type === "touchmove";
  const clientY = isTouch ? e.touches[0].clientY : e.clientY;

  if (isTouch) e.preventDefault();

  const dy = clientY - sheetState.startY;

  const now = performance.now();
  const dt = now - sheetState.lastTime;
  sheetState.velocity = (clientY - sheetState.lastY) / dt;

  sheetState.lastY = clientY;
  sheetState.lastTime = now;

  let translatePercent = 0;

  if (sheetState.mode === "full") {
    translatePercent = (dy / sheetState.height) * 100;
  } else {
    translatePercent = 100 + (dy / sheetState.height) * 100;
  }

  translatePercent = Math.max(0, Math.min(100, translatePercent));

  sheet.style.transform = `translateY(${translatePercent}%)`;
}

function sheetDragEnd() {
  if (!sheetState.dragging) return;
  sheetState.dragging = false;

  const { sheet } = getSheetElements();
  if (!sheet) return;

  sheet.style.transition = "transform 0.25s ease-out";

  const velocity = sheetState.velocity;
  const translate = parseFloat(sheet.style.transform.replace("translateY(", "").replace("%)", ""));

  if (velocity < -0.5) return sheetSetMode("full");
  if (velocity > 0.5) return sheetSetMode("closed");

  if (translate < 50) return sheetSetMode("full");

  sheetSetMode("closed");

  window.removeEventListener("mousemove", sheetDragMove);
  window.removeEventListener("mouseup", sheetDragEnd);
  window.removeEventListener("touchmove", sheetDragMove);
  window.removeEventListener("touchend", sheetDragEnd);
  window.removeEventListener("touchcancel", sheetDragEnd);
}

/* ========== Root admin panel renderer ========== */

function renderAdminPanel() {
  const tabs = [
    { id: 'dashboard', icon: 'trending', label: 'داشبورد' },
    { id: 'products', icon: 'box', label: 'محصولات' },
    { id: 'orders', icon: 'cart', label: 'سفارشات' },
    { id: 'categories', icon: 'grid', label: 'دسته‌بندی‌ها' },
    { id: 'reviews', icon: 'star', label: 'نظرات' },
    { id: 'support', icon: 'ticket', label: 'پشتیبانی' },
    { id: 'admins', icon: 'shield', label: 'کاربران مدیر' }
  ];

  const pendingReviewsCount = (state.reviews || []).filter(r => r.status === 'pending').length;
  const _ordersArr = Array.isArray(state.orders) ? state.orders : [];
  const tabCounts = {
    orders: _ordersArr.filter(o => (o.status || 'pending') === 'pending').length,
    support: (state.tickets || []).filter(t => t.status !== 'closed').length,
    reviews: pendingReviewsCount
  };
  const returnsRequestedCount = _ordersArr.filter(o => o.return_status === 'requested').length;
  const icon = (n, cls) => (typeof aryIcon === 'function' ? aryIcon(n, cls) : '');

  return `
    <div class="flex flex-col lg:flex-row min-h-screen">
      <!-- Sidebar (Desktop) -->
      <aside class="hidden lg:flex w-72 glass-dark border-l border-white/5 flex-col fixed right-0 top-0 h-screen overflow-y-auto">
        <div class="p-6 border-b border-white/5">
          <div class="flex items-center gap-3">
            <span class="text-3xl">⚙️</span>
            <div>
              <h1 class="font-black text-lg">پنل مدیریت</h1>
              <p class="text-xs text-white/60">مدیریت فروشگاه</p>
            </div>
          </div>
        </div>
        <nav class="flex-1 p-4">
          ${tabs
            .map(
              tab => `
            <button 
              onclick="state.adminTab='${tab.id}'; render()"
              class="sidebar-item w-full text-right px-5 py-4 flex items-center justify-between text-sm ${state.adminTab === tab.id ? 'active' : ''}" type="button"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="relative inline-flex text-xl">
                  <span class="inline-flex ${state.adminTab === tab.id ? 'text-white' : 'text-white/55'}">${icon(tab.icon, 'w-5 h-5')}</span>
                  ${(tabCounts[tab.id] || 0) > 0 || (tab.id === 'orders' && returnsRequestedCount > 0)
                    ? `<span class="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[9px] font-bold min-w-[1.05rem] h-[1.05rem] px-1 flex items-center justify-center rounded-full shadow-lg shadow-rose-500/30">
                          ${tab.id === 'orders' && returnsRequestedCount > 0 ? returnsRequestedCount : tabCounts[tab.id]}
                       </span>`
                    : ''}
                </span>
                <span class="font-medium truncate">${tab.label}</span>
                ${tab.id === 'orders' && (tabCounts.orders || 0) > 0
                  ? `<span class="text-[10px] text-white/40 shrink-0">${tabCounts.orders} در انتظار</span>` : ''}
              </div>
            </button>
          `
            )
            .join('')}
        </nav>
        <div class="p-4 border-t border-white/5 space-y-2">
          <button onclick="window.open('index.html', '_blank')" class="w-full btn-ghost py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium" type="button">${typeof aryIcon === 'function' ? aryIcon('home', 'w-4 h-4') : ''} مشاهده سایت (تب جدید)</button>
          <button onclick="showDbExportPanel()" class="w-full bg-emerald-500/10 text-emerald-400 py-3 rounded-xl hover:bg-emerald-500/20 flex items-center justify-center gap-2 text-sm font-medium transition-all" type="button">${typeof aryIcon === 'function' ? aryIcon('database', 'w-4 h-4') : ''} دیتابیس</button>
          <button onclick="adminLogout()" class="w-full bg-rose-500/10 text-rose-400 py-3 rounded-xl hover:bg-rose-500/20 flex items-center justify-center gap-2 text-sm font-medium transition-all" type="button">${typeof aryIcon === 'function' ? aryIcon('logout', 'w-4 h-4') : ''} خروج</button>
        </div>
      </aside>

      <!-- Mobile Header -->
      <header class="lg:hidden glass-dark border-b border-white/5 p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">${typeof aryIcon === 'function' ? aryIcon('settings', 'w-5 h-5') : '⚙️'}</span>
            <h1 class="font-bold truncate">پنل مدیریت</h1>
          </div>
          <div class="flex gap-2">
            <button onclick="window.open('index.html', '_blank')" class="p-2 glass rounded-xl text-sm" type="button" title="مشاهده سایت در تب جدید">${typeof aryIcon === 'function' ? aryIcon('home', 'w-4 h-4') : '🏠'}</button>
            <button onclick="adminLogout()" class="p-2 glass rounded-xl text-rose-400 text-sm" type="button" title="خروج از پنل">${typeof aryIcon === 'function' ? aryIcon('logout', 'w-4 h-4') : '🚪'}</button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 p-4 lg:p-8 overflow-auto overflow-x-hidden pb-24 lg:pb-8 lg:mr-72 mr-0">
        ${state.adminTab === 'dashboard' ? (typeof renderAdminDashboard === 'function' ? renderAdminDashboard() : '') : ''}
        ${state.adminTab === 'products' ? (typeof renderAdminProductsEditor === 'function' ? renderAdminProductsEditor() : '') : ''}
        ${state.adminTab === 'orders' ? renderAdminOrdersSafe() : ''}
        ${state.adminTab === 'categories' ? renderAdminCategoriesEditor() : ''}
        ${state.adminTab === 'reviews' ? renderAdminReviews() : ''}
        ${state.adminTab === 'support' ? renderAdminSupportSafe() : ''}
        ${state.adminTab === 'admins' ? (typeof renderAdminUsersManagement === 'function' ? renderAdminUsersManagement() : '') : ''}
      </main>

      <!-- مودال‌های سراسری پنل (تأیید خطرناک + پیش‌نمایش ویدیو) -->
      ${typeof renderConfirmModal === 'function' ? renderConfirmModal() : ''}
      ${renderAdminVideoPreviewModal()}

      <!-- Mobile Bottom Sheet Trigger -->
      <button
        type="button"
        class="admin-sheet-trigger lg:hidden ${sheetState.open ? 'hidden-trigger' : ''}"
        onclick="sheetToggle(true)"
      >
        <span class="icon">⬆️</span>
        <span>بخش‌های پنل مدیریت</span>
      </button>

      <!-- Mobile Bottom Sheet Backdrop -->
      <div 
        class="admin-sheet-backdrop lg:hidden ${sheetState.open ? 'sheet-open' : ''}"
        onclick="sheetToggle(false)"
      ></div>

      <!-- Mobile Bottom Sheet (Tabs) -->
      <div 
        class="admin-sheet lg:hidden ${sheetState.open ? 'sheet-open' : ''}"
      >
        <div class="admin-sheet-header" onmousedown="sheetDragStart(event)" ontouchstart="sheetDragStart(event)">
          <div class="admin-sheet-handle"></div>
          <div class="admin-sheet-toggle-icon" onclick="sheetToggle()">
            ▲
          </div>
        </div>
        <div class="admin-sheet-body">
          <div class="admin-sheet-tabs">
            ${tabs
              .map(tab => `
                <button
                  type="button"
                  class="admin-sheet-tab-btn ${state.adminTab === tab.id ? 'active' : ''}"
                  onclick="state.adminTab='${tab.id}'; sheetToggle(false); render()"
                >
                  <span class="flex items-center gap-2 min-w-0">
                    <span class="tab-icon inline-flex">${icon(tab.icon, 'w-4 h-4')}</span>
                    <span class="truncate">${tab.label}</span>
                  </span>
                  ${(tabCounts[tab.id] || 0) > 0
                    ? `<span class="admin-sheet-tab-badge">${tabCounts[tab.id]}</span>`
                    : (tab.id === 'orders' && returnsRequestedCount > 0 ? `<span class="admin-sheet-tab-badge">${returnsRequestedCount}</span>` : '')}
                </button>
              `)
              .join('')}
          </div>
        </div>
      </div>

      ${renderCategoryModal()}
    </div>
  `;
}

/* ========== Helper wrapper to align legacy select to new API ========== */

window.aryAdminReturnDecision = function (orderId, decision) {
  // تایید/رد درخواست مرجوعی — در حالت سرور مستقیم از Db.php؛ در حالت محلی updateOrder (IDB)
  if (window.AryaServer && AryaServer.isConfigured()) {
    AryaServer.crud.upsert('orders', { id: String(orderId), return_status: decision }).then(function (r) {
      if (r && r.ok) {
        var o = (state.orders || []).find(function (x) { return String(x.id) === String(orderId); });
        if (o) o.return_status = decision;
        if (typeof render === 'function') render();
        toast(decision === 'approved' ? 'مرجوعی تایید شد' : 'مرجوعی رد شد');
      } else { toast((r && r.msg) || 'ثبت نظر ناموفق بود', 'error'); }
    });
    return;
  }
  updateOrder(orderId, { return_status: decision });
};

function updateOrderStatus(order, nextStatus) {
  if (!order || !order.id) return;
  updateOrder(order.id, { status: nextStatus });
}

/* ========== Categories: modal-based CRUD + product assignment ========== */

function openCategoryModal(mode, id = null) {
  if (mode === 'add') {
    state.categoryModal = {
      mode: 'add',
      id: null,
      title: '',
      selectedProducts: []
    };
  } else {
    state.categories = Array.isArray(state.categories) ? state.categories : [];
    state.products = Array.isArray(state.products) ? state.products : [];

    const cat = state.categories.find(c => c.id === id);
    if (!cat) return;

    const selectedProducts = state.products.filter(p => p.category === id).map(p => p.id);

    state.categoryModal = {
      mode: 'edit',
      id,
      title: cat.title,
      selectedProducts
    };
  }
  render();
}

function closeCategoryModal() {
  state.categoryModal = null;
  render();
}

function saveCategoryModal() {
  const m = state.categoryModal;
  if (!m) return;

  const title = (m.title || '').trim();
  if (!title) {
    toast('نام دسته‌بندی الزامی است', 'warning');
    return;
  }

  state.categories = Array.isArray(state.categories) ? state.categories : [];
  state.products = Array.isArray(state.products) ? state.products : [];

  if (m.mode === 'add') {
    const id = utils.generateId();
    state.categories.push({ id, title });

    state.products.forEach(p => {
      if (m.selectedProducts.includes(p.id)) {
        p.category = id;
      }
    });

    toast('دسته‌بندی اضافه شد', 'success');
  } else {
    const cat = state.categories.find(c => c.id === m.id);
    if (!cat) return;

    cat.title = title;

    state.products.forEach(p => {
      if (p.category === m.id) p.category = '';
    });

    state.products.forEach(p => {
      if (m.selectedProducts.includes(p.id)) {
        p.category = m.id;
      }
    });

    toast('دسته‌بندی بروزرسانی شد', 'success');
  }

  closeCategoryModal();
}

function deleteCategoryWithConfirm(id) {
  state.categories = Array.isArray(state.categories) ? state.categories : [];
  state.products = Array.isArray(state.products) ? state.products : [];

  const cat = state.categories.find(c => c.id === id);
  if (!cat) return;

  state.categoryModal = null;

  state.confirmModal = {
    type: 'delete-category',
    title: 'حذف دسته',
    message: `آیا از حذف «${cat.title}» مطمئن هستید؟`,
    icon: '🗑️',
    confirmText: 'حذف',
    confirmClass: 'btn-danger',
    onConfirm: () => {
      state.categories = state.categories.filter(c => c.id !== id);
      state.products.forEach(p => {
        if (p.category === id) p.category = '';
      });
      state.confirmModal = null;
      render();
    }
  };
  render();
}

function renderCategoryModal() {
  const m = state.categoryModal;
  if (!m) return '';

  state.products = Array.isArray(state.products) ? state.products : [];

  const uncategorized = state.products.filter(p => !p.category || p.category === m.id);

  return `
    <div class="fixed inset-0 z-[200] flex items-center justify-center p-4 modal-overlay">
      <div class="glass-strong rounded-3xl p-6 lg:p-8 max-w-lg w-full max-h-[90%] overflow-y-auto animate-scale">

        <h2 class="text-xl font-black mb-6">
          ${m.mode === 'add' ? '➕ دسته‌بندی جدید' : '✏️ ویرایش دسته‌بندی'}
        </h2>

        <div class="space-y-5">

          <div>
            <label class="block text-sm text-white/70 mb-2">نام دسته *</label>
            <input 
              type="text"
              class="w-full input-style"
              value="${escapeHtml(m.title)}"
              oninput="state.categoryModal.title=this.value"
              placeholder="نام دسته را وارد کنید"
            >
          </div>

          <div>
            <label class="block text-sm text-white/70 mb-2">محصولات بدون دسته</label>
            <div class="flex gap-3 overflow-x-auto pb-2">
              ${
                uncategorized.length === 0
                  ? `<p class="text-white/40 text-sm">محصول بدون دسته وجود ندارد</p>`
                  : uncategorized
                      .map(
                        p => `
                    <label class="glass rounded-xl p-3 flex-shrink-0 w-40 cursor-pointer hover:bg-white/10 transition">
                      <div class="w-full h-24 bg-white/5 rounded-lg overflow-hidden mb-2">
                        ${
                          p.image || p.main_image
                            ? `<img src="${p.image || p.main_image}" class="w-full h-full object-cover">`
                            : `<div class="w-full h-full flex items-center justify-center text-3xl">📦</div>`
                        }
                      </div>

                      <div class="flex items-center gap-2">
                        <input 
                          type="checkbox"
                          class="w-4 h-4"
                          ${m.selectedProducts.includes(p.id) ? 'checked' : ''}
                          onchange="
                            if(this.checked){
                              if(!state.categoryModal.selectedProducts.includes('${p.id}')){
                                state.categoryModal.selectedProducts.push('${p.id}');
                              }
                            } else {
                              state.categoryModal.selectedProducts = state.categoryModal.selectedProducts.filter(x => x !== '${p.id}');
                            }
                            render();
                          "
                        >
                        <span class="text-xs line-clamp-2">${escapeHtml(p.title)}</span>
                      </div>
                    </label>
                  `
                      )
                      .join('')
              }
            </div>
          </div>

        </div>

        <div class="flex gap-4 mt-8">
          ${
            m.mode === 'edit'
              ? `<button 
                  type="button" 
                  onclick="deleteCategoryWithConfirm('${m.id}')"
                  class="flex-1 btn-danger py-4 rounded-xl font-semibold"
                >
                  حذف دسته
                </button>`
              : ''
          }

          <button 
            type="button" 
            onclick="closeCategoryModal()"
            class="flex-1 btn-ghost py-4 rounded-xl font-semibold"
          >
            انصراف
          </button>

          <button 
            type="button" 
            onclick="saveCategoryModal()"
            class="flex-1 btn-primary py-4 rounded-xl font-semibold"
          >
            ثبت
          </button>
        </div>

      </div>
    </div>
  `;
}

function renderAdminCategoriesEditor() {
  state.categories = Array.isArray(state.categories) ? state.categories : [];

  return `
    <div class="animate-fade">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl lg:text-3xl font-black">مدیریت دسته‌بندی‌ها (${state.categories.length})</h1>
        <button class="btn-primary px-5 py-3 rounded-xl font-semibold text-sm" type="button" onclick="openCategoryModal('add')">
          افزودن دسته
        </button>
      </div>

      <div class="grid gap-3">
        ${state.categories
          .map(
            (c, i) => `
          <div class="glass rounded-xl p-4 flex items-center justify-between animate-fade" style="animation-delay:${i *
            0.05}s">
            <div>
              <div class="font-semibold">${c.title}</div>
              <div class="text-xs text-white/40">${c.id}</div>
            </div>
            <div class="flex gap-2">
              <button class="p-2 glass rounded-xl" type="button" onclick="openCategoryModal('edit', '${c.id}')">✏️</button>
              <button class="p-2 glass rounded-xl text-rose-400 hover:bg-rose-500/20" type="button" onclick="deleteCategoryWithConfirm('${c.id}')">🗑️</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

/* ========== Reviews: product-based moderation + like/dislike ========== */

function normalizeReview(r) {
  if (!r) return null;
  r.status = r.status || 'pending';
  r.likes = typeof r.likes === 'number' ? r.likes : parseInt(r.likes || '0', 10) || 0;
  r.dislikes = typeof r.dislikes === 'number' ? r.dislikes : parseInt(r.dislikes || '0', 10) || 0;
  return r;
}

function getReviewProductId(r) {
  return r.product_id || r.productId || r.product || 'unknown';
}

function getReviewProductTitle(r) {
  return r.product_title || r.productTitle || r.product_name || 'محصول بدون نام';
}

function setReviewStatus(id, status) {
  state.reviews = Array.isArray(state.reviews) ? state.reviews : [];
  const r = state.reviews.find(x => x.id === id);
  if (!r) return;
  r.status = status;
  render();
  // ذخیره روی سرور: اکشن اختصاصی مدیریت نظرات (و کش محلی)
  if (window.AryaServer && AryaServer.isConfigured()) {
    adminApiCall('admin_review_moderate', { id: String(id), status }).then(j => {
      if (!j.ok) toast(j.msg || 'ثبت وضعیت نظر روی سرور ناموفق بود', 'error');
    });
  }
  if (window.AryaDB) { try { AryaDB.upsert('reviews', { ...r }); } catch (e) {} }
}

window.aryAdminApproveAllPending = function (pid) {
  let pend = (state.reviews || []).filter(r => (r.status || 'pending') === 'pending');
  if (pid && pid !== '__all__') pend = pend.filter(r => String(getReviewProductId(r)) === String(pid));
  if (!pend.length) { if (window.toast) toast('نظر درانتظاری برای تأیید نیست', 'warning'); return; }
  state.confirmModal = {
    icon: '✅',
    title: 'تأیید گروهی نظرات',
    message: pend.length + ' نظر در انتظار برای «' + (pid === '__all__' ? 'همه محصولات' : (getReviewProductTitle(pend[0]) || 'این محصول')) + '» تأیید و منتشر می‌شود.',
    confirmText: 'تأیید همه',
    onConfirm: function () {
      state.confirmModal = null;
      pend.forEach(r => setReviewStatus(r.id, 'approved'));
      if (window.toast) toast(pend.length + ' نظر تأیید شد', 'success');
      render();
    }
  };
  render();
};

window.aryAdminDeleteReview = function (id) {
  const r = (state.reviews || []).find(x => x.id === id);
  if (!r) return;
  state.confirmModal = {
    icon: '🗑️',
    title: 'حذف دائمی نظر',
    message: 'نظر «' + String(r.text || r.comment || '').slice(0, 90) + '…» برای همیشه حذف می‌شود. برای تأیید، عبارت «حذف» را وارد کنید.',
    confirmText: 'حذف دائمی',
    confirmClass: 'bg-rose-600 hover:bg-rose-500 text-white',
    requirePhrase: 'حذف',
    onConfirm: async function () {
      const res = await adminApiCall('delete&table=reviews', { id: String(id) });
      if (res && res.ok === false) { if (window.toast) toast('حذف ناموفق: ' + (res.msg || ''), 'error'); return; }
      state.confirmModal = null;
      state.reviews = (state.reviews || []).filter(x => x.id !== id);
      if (window.toast) toast('نظر حذف شد', 'success');
      render();
    }
  };
  render();
};

window.updateAdminReviewsAside = function () {
  const prevLen = (state.adminReviewsFilter.q || '').length;
  render();
  const el = document.getElementById('admin-reviews-search');
  if (el) { el.focus(); try { el.setSelectionRange(prevLen, prevLen); } catch (e) {} }
};

function reactToReview(id, reaction) {
  state.reviews = Array.isArray(state.reviews) ? state.reviews : [];
  const r = state.reviews.find(x => x.id === id);
  if (!r) return;

  normalizeReview(r);

  const prev = r._adminReaction || null;

  if (window.AryaDB) { setTimeout(() => { try { AryaDB.upsert('reviews', { ...r }); } catch (e) {} }, 0); }
  if (reaction === 'like') {
    if (prev === 'like') {
      r.likes = Math.max(0, r.likes - 1);
      r._adminReaction = null;
    } else {
      if (prev === 'dislike') r.dislikes = Math.max(0, r.dislikes - 1);
      r.likes += 1;
      r._adminReaction = 'like';
    }
  } else if (reaction === 'dislike') {
    if (prev === 'dislike') {
      r.dislikes = Math.max(0, r.dislikes - 1);
      r._adminReaction = null;
    } else {
      if (prev === 'like') r.likes = Math.max(0, r.likes - 1);
      r.dislikes += 1;
      r._adminReaction = 'dislike';
    }
  }

  render();
}

function renderAdminReviews() {
  state.reviews = Array.isArray(state.reviews) ? state.reviews.map(normalizeReview) : [];

  const byProduct = {};
  state.reviews.forEach(r => {
    const pid = getReviewProductId(r);
    if (!byProduct[pid]) {
      byProduct[pid] = {
        id: pid,
        title: getReviewProductTitle(r),
        reviews: []
      };
    }
    byProduct[pid].reviews.push(r);
  });

  const productIds = Object.keys(byProduct);
  if (!state.adminReviewsSelectedProductId && productIds.length > 0) {
    state.adminReviewsSelectedProductId = productIds[0];
  }

  const activeProductId = state.adminReviewsSelectedProductId;
  const activeProduct = activeProductId === '__all__'
    ? { id: '__all__', title: 'همه محصولات', reviews: state.reviews }
    : (activeProductId ? byProduct[activeProductId] : null);

  const _rf = state.adminReviewsFilter || {};
  const _rq = String(_rf.q || '').trim().toLowerCase();
  let activeReviews = activeProduct ? activeProduct.reviews.slice() : [];
  if (_rq) activeReviews = activeReviews.filter(r => String(r.text || r.comment || '').toLowerCase().includes(_rq) || String(r.user_name || r.userName || '').toLowerCase().includes(_rq));
  if (_rf.status) activeReviews = activeReviews.filter(r => (r.status || 'pending') === _rf.status);
  const baseSet = activeProduct ? activeProduct.reviews : [];
  const rCounts = {
    all: baseSet.length,
    pending: baseSet.filter(r => (r.status || 'pending') === 'pending').length,
    approved: baseSet.filter(r => r.status === 'approved').length,
    rejected: baseSet.filter(r => r.status === 'rejected').length
  };

  const pendingCount = state.reviews.filter(r => r.status === 'pending').length;

  let shownIds = Object.keys(byProduct);
  if (_rq) shownIds = shownIds.filter(pid => String(byProduct[pid].title || '').toLowerCase().includes(_rq) || byProduct[pid].reviews.some(r => String(r.text || r.comment || '').toLowerCase().includes(_rq)));

  return `
    <div class="animate-fade">
      <div class="flex flex-col lg:flex-row gap-6">
        
        <!-- Products list -->
        <aside class="lg:w-72 glass rounded-2xl p-4 h-max max-h-[70vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-bold flex items-center gap-2">
              ${typeof aryIcon === 'function' ? aryIcon('star', 'w-4 h-4') : '📝'}
              <span>محصولات با نظر</span>
            </h2>
            ${
              pendingCount > 0
                ? `<span class="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">در انتظار: ${pendingCount}</span>`
                : ''
            }
          </div>
          <div class="relative mb-3">
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 inline-flex">${typeof aryIcon === 'function' ? aryIcon('search', 'w-3.5 h-3.5') : ''}</span>
            <input id="admin-reviews-search" type="search" placeholder="جستجوی محصول یا متن نظر…" class="input-style w-full pr-9 text-xs"
              value="${escapeHtml(_rq)}" oninput="state.adminReviewsFilter.q = this.value; updateAdminReviewsAside()" autocomplete="off">
          </div>
          ${
            shownIds.length > 0
              ? `<button type="button" class="w-full text-right px-3 py-2 rounded-xl text-xs mb-1 flex items-center justify-between ${activeProductId === '__all__' ? 'bg-blue-500/20 text-blue-200' : 'glass hover:bg-white/10'}" onclick="state.adminReviewsSelectedProductId='__all__'; render()">
                  <span>همه محصولات</span><span class="text-[10px] text-white/60">${state.reviews.length} نظر</span>
                </button>`
              : ''
          }
          <div id="admin-reviews-aside-list">
          ${
            shownIds.length === 0
              ? `<p class="text-xs text-white/60">${productIds.length === 0 ? 'هنوز نظری ثبت نشده است.' : 'موردی با این جستجو نیست.'}</p>`
              : shownIds
                  .map(pid => {
                    const p = byProduct[pid];
                    const pPending = p.reviews.filter(r => r.status === 'pending').length;
                    return `
                      <button
                        type="button"
                        class="w-full text-right px-3 py-2 rounded-xl text-xs mb-1 flex items-center justify-between ${activeProductId === pid ? 'bg-white/10' : 'glass hover:bg-white/10'}"
                        onclick="state.adminReviewsSelectedProductId='${pid}'; render()"
                      >
                        <span class="line-clamp-1">${escapeHtml(p.title)}</span>
                        <span class="flex items-center gap-1 text-[10px] text-white/60">
                          <span>${p.reviews.length} نظر</span>
                          ${
                            pPending > 0
                              ? `<span class="px-1.5 py-0.5 rounded-full bg-rose-500/30 text-rose-100">${pPending}</span>`
                              : ''
                          }
                        </span>
                      </button>
                    `;
                  })
                  .join('')
          }
          </div>
        </aside>

        <!-- Reviews list -->
        <section class="flex-1">
          ${
            !activeProduct
              ? `<div class="glass rounded-2xl p-10 text-center text-sm text-white/60">
                  محصولی برای نمایش نظرات انتخاب نشده است.
                </div>`
              : `
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
              <div class="min-w-0">
                <h1 class="text-xl lg:text-2xl font-black mb-1">نظرات محصول</h1>
                <p class="text-xs text-white/60 line-clamp-1">${activeProduct.title}</p>
              </div>
              <div class="text-xs text-white/60">
                <span>نمایش: ${activeReviews.length} از ${rCounts.all}</span>
              </div>
            </div>

            <div class="glass rounded-2xl p-2.5 mb-4 flex flex-wrap items-center gap-2">
              ${[['','همه',rCounts.all,'bg-blue-500'],['pending','در انتظار',rCounts.pending,'bg-amber-500'],['approved','تأییدشده',rCounts.approved,'bg-emerald-600'],['rejected','ردشده',rCounts.rejected,'bg-rose-600']]
                .map(([v,label,n,col]) => `<button type="button" onclick="state.adminReviewsFilter.status='${v}'; render()"
                  class="px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all ${(_rf.status||'')===v ? col + ' text-white' : 'glass hover:bg-white/10 text-white/70'}">${label} <b class="opacity-80">${n}</b></button>`).join('')}
              <span class="flex-1"></span>
              ${rCounts.pending > 0 ? `<button type="button" onclick="aryAdminApproveAllPending('${activeProduct.id}')"
                class="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/25 transition-all inline-flex items-center gap-1.5">✓ تأیید همه درانتظار (${rCounts.pending})</button>` : ''}
            </div>

            ${
              activeReviews.length === 0
                ? `<div class="glass rounded-2xl p-10 text-center text-sm text-white/60">
                    برای این محصول نظری ثبت نشده است.
                  </div>`
                : `
              <div class="space-y-3 max-h-[70vh] overflow-y-auto">
                ${activeReviews
                  .map(r => {
                    const created = r.created_at || r.createdAt || '';
                    const rating = typeof r.rating === 'number' ? r.rating : parseInt(r.rating || '0', 10) || 0;
                    const stars = '★★★★★'.slice(0, Math.max(0, Math.min(5, rating)));
                    const emptyStars = '☆☆☆☆☆'.slice(stars.length);
                    return `
                      <div class="glass rounded-2xl p-4 text-sm">
                        <div class="flex items-center justify-between mb-2">
                          <div>
                            <div class="font-semibold text-sm">${r.user_name || r.userName || 'کاربر ناشناس'}</div>
                            <div class="text-[11px] text-white/50">${utils.formatDateTime(created)}</div>
                          </div>
                          <div class="text-xs text-amber-300 font-mono">
                            <span class="text-base">${stars}<span class="text-white/20">${emptyStars}</span></span>
                            ${rating ? `<span class="ml-1 text-[11px] text-white/60">(${rating}/5)</span>` : ''}
                          </div>
                        </div>

                        <p class="text-sm text-white/80 whitespace-pre-line mb-3">${escapeHtml(r.text || r.comment || '')}</p>

                        <div class="flex items-center justify-between gap-3">
                          <div class="flex items-center gap-2 text-[11px]">
                            <button
                              type="button"
                              class="px-2 py-1 rounded-lg flex items-center gap-1 ${r._adminReaction === 'like' ? 'bg-emerald-500/20 text-emerald-300' : 'glass text-white/70 hover:bg-white/10'}"
                              onclick="reactToReview('${r.id}', 'like')"
                            >
                              👍 <span>${r.likes}</span>
                            </button>
                            <button
                              type="button"
                              class="px-2 py-1 rounded-lg flex items-center gap-1 ${r._adminReaction === 'dislike' ? 'bg-rose-500/20 text-rose-300' : 'glass text-white/70 hover:bg-white/10'}"
                              onclick="reactToReview('${r.id}', 'dislike')"
                            >
                              👎 <span>${r.dislikes}</span>
                            </button>
                          </div>

                          <div class="flex items-center gap-2 text-[11px]">
                            <span class="px-2 py-1 rounded-lg bg-white/5 text-white/70">
                              ${
                                r.status === 'approved'
                                  ? '✅ تایید شده'
                                  : r.status === 'rejected'
                                  ? '⛔ رد شده'
                                  : '⏳ در انتظار'
                              }
                            </span>
                            ${r.status !== 'approved' ? `<button
                              type="button"
                              class="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                              onclick="setReviewStatus('${r.id}', 'approved')"
                            >تایید</button>` : ''}
                            ${r.status !== 'rejected' ? `<button
                              type="button"
                              class="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-200 hover:bg-rose-500/30"
                              onclick="setReviewStatus('${r.id}', 'rejected')"
                            >رد</button>` : ''}
                            <button type="button" title="حذف نظر" aria-label="حذف نظر"
                              class="px-2 py-1 rounded-lg bg-white/5 text-white/55 hover:bg-rose-500/25 hover:text-rose-300 transition-all inline-flex items-center"
                              onclick="aryAdminDeleteReview('${r.id}')"
                            >${typeof aryIcon === 'function' ? aryIcon('trash', 'w-3.5 h-3.5') : '✕'}</button>
                          </div>
                        </div>
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            `
            }
          `
          }
        </section>

      </div>
    </div>
  `;
}

/* ============================================================
   ORDERS — FULL REWRITE (FAST, CLEAN, BUG‑FREE)
   ============================================================ */

function renderAdminOrdersSafe() {
  const orders = Array.isArray(state.orders) ? state.orders : [];

  // فیلتر وضعیت
  const filtered = state.orderFilter.status
    ? orders.filter(o => o.status === state.orderFilter.status)
    : orders;

  return `
    <div class="animate-fade">
      <h1 class="text-2xl lg:text-3xl font-black mb-8">
        سفارشات (${filtered.length})
      </h1>

      <!-- FILTER BAR -->
      <div class="glass rounded-2xl p-5 mb-6">
        <div class="flex flex-wrap gap-2">

          ${renderOrderFilterButton("", "همه")}
          ${renderOrderFilterButton("pending", "⏳ در انتظار")}
          ${renderOrderFilterButton("processing", "⚙️ پردازش")}
          ${renderOrderFilterButton("shipped", "🚚 ارسال شده")}
          ${renderOrderFilterButton("delivered", "✅ تحویل")}

        </div>
      </div>

      ${filtered.length === 0 ? renderOrdersEmpty() : renderOrdersList(filtered)}
    </div>
  `;
}

/* ============================================================
   FILTER BUTTON COMPONENT
   ============================================================ */

function renderOrderFilterButton(value, label) {
  const active = state.orderFilter.status === value;
  return `
    <button 
      onclick="state.orderFilter.status='${value}'; render()"
      class="px-4 py-2.5 rounded-xl text-sm font-medium transition-all 
      ${active ? 'bg-blue-500 text-white' : 'glass hover:bg-white/10'}"
    >
      ${label}
    </button>
  `;
}

/* ============================================================
   EMPTY STATE
   ============================================================ */

function renderOrdersEmpty() {
  return `
    <div class="glass rounded-3xl p-16 text-center">
      <div class="text-7xl mb-6">🛒</div>
      <h3 class="text-2xl font-bold">سفارشی یافت نشد</h3>
    </div>
  `;
}

/* ============================================================
   ORDERS LIST
   ============================================================ */

function renderOrdersList(list) {
  return `
    <div class="space-y-4">
      ${list.map(renderOrderCard).join("")}
    </div>
  `;
}

/* ============================================================
   ORDER CARD COMPONENT
   ============================================================ */

function renderOrderCard(order) {
  const items = safeParseItems(order.items);
  const total = calcOrderTotal(order, items);

  return `
    <div class="glass rounded-2xl p-6 animate-fade">

      <!-- HEADER -->
      <div class="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <span class="font-mono font-bold">#${(order.id || "").slice(-8)}</span>
          <p class="text-xs text-white/60 mt-1">
            ${utils.formatDateTime(order.created_at || order.createdAt || "")}
          </p>
        </div>

        <div>
          <select 
            onchange="updateOrder('${order.id}', { status: this.value })"
            class="bg-white/10 border border-white/20 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            ${renderOrderStatusOption("pending", "⏳ در انتظار", order.status)}
            ${renderOrderStatusOption("processing", "⚙️ پردازش", order.status)}
            ${renderOrderStatusOption("shipped", "🚚 ارسال شده", order.status)}
            ${renderOrderStatusOption("delivered", "✅ تحویل", order.status)}
          </select>
        </div>
      </div>

      <!-- BODY -->
      <div class="grid md:grid-cols-3 gap-4">

        <!-- CUSTOMER -->
        <div class="glass rounded-xl p-4">
          <p class="text-xs text-white/60 mb-2">مشتری</p>
          <p class="font-semibold">${order.user_name || "بدون نام"}</p>
          <p class="text-sm font-mono text-white/70">
            ${order.user_phone || order.userPhone || ""}
          </p>
        </div>

        <!-- ADDRESS -->
        <div class="glass rounded-xl p-4 hidden md:block">
          <p class="text-xs text-white/60 mb-2">آدرس</p>
          <p class="text-sm line-clamp-2">${order.address || "-"}</p>
        </div>

        <!-- TOTAL -->
        <div class="glass rounded-xl p-4">
          <p class="text-xs text-white/60 mb-2">مبلغ کل</p>
          <p class="text-xl font-black text-emerald-400">
            ${utils.formatPrice(total)}
          </p>
          <p class="text-xs text-white/60">${items.length} کالا</p>
        </div>

      </div>
    </div>
  `;
}

/* ============================================================
   HELPERS
   ============================================================ */

function safeParseItems(items) {
  if (Array.isArray(items)) return items;
  try {
    const parsed = JSON.parse(items || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function calcOrderTotal(order, items) {
  if (order.total) return order.total;
  const subtotal = order.subtotal || 0;
  const shipping = order.shipping || 0;
  return subtotal + shipping;
}

function renderOrderStatusOption(value, label, current) {
  return `
    <option value="${value}" ${current === value ? "selected" : ""}>
      ${label}
    </option>
  `;
}

/* ========== Support: messenger-style + quick replies ========== */

function getTicketMessages(t) {
  if (!t) return [];
  if (Array.isArray(t.messages)) return t.messages;
  try {
    const parsed = JSON.parse(t.messages || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setTicketMessages(t, msgs) {
  t.messages = Array.isArray(msgs) ? msgs : [];
}

function addTicketMessage(ticket, payload) {
  if (!ticket) return Promise.resolve(false);
  const text = String(payload.text || '').trim();
  if (!text) return Promise.resolve(false);

  const msgs = getTicketMessages(ticket);
  msgs.push({
    from: payload.from || 'admin',
    text,
    at: new Date().toISOString()
  });
  setTicketMessages(ticket, msgs);

  if (window.AppState) AppState.set({ tickets: state.tickets });

  // همگام‌سازی روی سرور: پاسخ ادمین + باز/پاسخ‌داده‌شده شدن وضعیت (خودکار سمت سرور)
  if (window.AryaServer && AryaServer.isConfigured && AryaServer.isConfigured()) {
    AryaServer.replyTicket({ id: String(ticket.id), reply: text }).then(function (r) {
      if (r && r.ok === false) { if (window.toast) toast('پاسخ روی سرور ثبت نشد: ' + (r.msg || ''), 'error'); return; }
      if (r && r.data && r.data.status) ticket.status = r.data.status;
      window.__aryTicketsSig = '';
    }).catch(function () { if (window.toast) toast('پاسخ روی سرور ثبت نشد', 'error'); });
  }

  render();
  return Promise.resolve(true);
}

function updateTicketStatus(ticket, status) {
  if (!ticket) return;
  ticket.status = status;
  if (window.AppState) AppState.set({ tickets: state.tickets });
  if (window.AryaServer && AryaServer.isConfigured && AryaServer.isConfigured()) {
    AryaServer.crud.upsert('tickets', { id: String(ticket.id), status: String(status) }).then(function (r) {
      if (r && r.ok === false) { ticket.status = status === 'closed' ? 'open' : 'closed'; if (window.toast) toast('تغییر وضعیت روی سرور ناموفق بود', 'error'); render(); return; }
      window.__aryTicketsSig = '';
    });
  }
  render();
}

function closeTicket(ticket) {
  if (!ticket) return;
  ticket.status = 'closed';
  if (window.AppState) AppState.set({ tickets: state.tickets });
  render();
}

/* Quick replies CRUD */

function addQuickReply(label, text) {
  const lbl = String(label || '').trim();
  const txt = String(text || '').trim();
  if (!lbl || !txt) {
    toast('عنوان و متن پاسخ آماده الزامی است', 'warning');
    return;
  }
  const id = (utils && utils.uid ? utils.uid() : 'qr_' + Date.now());
  state.supportQuickReplies.push({ id, label: lbl, text: txt });
  if (window.AppState) AppState.set({ supportQuickReplies: state.supportQuickReplies });
  toast('پاسخ آماده اضافه شد', 'success');
  render();
}

function deleteQuickReply(id) {
  state.supportQuickReplies = state.supportQuickReplies.filter(q => q.id !== id);
  if (window.AppState) AppState.set({ supportQuickReplies: state.supportQuickReplies });
  toast('پاسخ آماده حذف شد', 'success');
  render();
}

window.aryAdminQrInsert = function (qi) {
  const list = Array.isArray(state.supportQuickReplies) ? state.supportQuickReplies : [];
  const q = list[qi];
  if (!q) return;
  const ta = document.getElementById('admin-reply-textarea');
  if (!ta) { if (window.toast) toast('ابتدا یک تیکت باز کنید', 'warning'); return; }
  const cur = String(ta.value || '');
  const ins = String(q.text || '');
  ta.value = cur.trim() ? cur.replace(/\s+$/, '') + '\n' + ins : ins;
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
};

window.aryAdminThreadScroll = function () {
  requestAnimationFrame(() => {
    const el = document.getElementById('admin-ticket-thread');
    if (el) el.scrollTop = el.scrollHeight;
  });
};

function renderAdminSupportQuickReplies() {
  const list = Array.isArray(state.supportQuickReplies) ? state.supportQuickReplies : [];

  return `
    <div class="glass rounded-2xl p-4 lg:p-6 animate-fade">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg lg:text-xl font-bold flex items-center gap-2">
          <span>⚡</span><span>مدیریت پاسخ‌های آماده</span>
        </h2>
      </div>

      <form class="grid gap-3 mb-5" onsubmit="event.preventDefault(); addQuickReply(this.label.value, this.text.value); this.reset();">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div class="lg:col-span-1">
            <label class="block text-xs text-white/60 mb-1">عنوان پاسخ *</label>
            <input name="label" class="input-style w-full" placeholder="مثال: تشکر از تماس" required>
          </div>
          <div class="lg:col-span-2">
            <label class="block text-xs text-white/60 mb-1">متن پاسخ *</label>
            <textarea name="text" class="input-style w-full resize-none" rows="2" placeholder="متن کامل پاسخ آماده..." required></textarea>
          </div>
        </div>
        <div class="flex justify-end">
          <button class="btn-primary px-4 py-2 rounded-xl text-sm font-semibold" type="submit">افزودن پاسخ آماده</button>
        </div>
      </form>

      <div class="space-y-2 max-h-[55vh] overflow-y-auto">
        ${
          list.length === 0
            ? `<div class="text-sm text-white/60">پاسخ آماده‌ای ثبت نشده است.</div>`
            : list
                .map(
                  q => `
              <div class="glass rounded-xl p-3 flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-sm mb-1">${q.label}</div>
                  <div class="text-xs text-white/70 whitespace-pre-line">${q.text}</div>
                </div>
                <button type="button" class="btn-ghost text-rose-400 text-xs px-3 py-1 rounded-lg" onclick="deleteQuickReply('${q.id}')">حذف</button>
              </div>
            `
                )
                .join('')
        }
      </div>
    </div>
  `;
}

function renderAdminSupportSafe() {
  const allTickets = Array.isArray(state.tickets) ? state.tickets : [];

  let filtered = allTickets;
  if (state.supportFilter.status) {
    filtered = filtered.filter(t => t.status === state.supportFilter.status);
  }
  if (state.supportFilter.priority) {
    filtered = filtered.filter(t => (t.priority || 'normal') === state.supportFilter.priority);
  }
  if (state.supportFilter.view === 'urgent') {
    filtered = filtered.filter(t => (t.priority || 'normal') === 'urgent');
  }

  filtered = [...filtered].sort((a, b) => {
    const pa = a.priority === 'urgent' ? 1 : 0;
    const pb = b.priority === 'urgent' ? 1 : 0;
    if (pa !== pb) return pb - pa;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  if (!state.adminSupportSelectedTicketId && filtered.length > 0) {
    state.adminSupportSelectedTicketId = filtered[0].id;
  }
  const activeTicket = filtered.find(t => t.id === state.adminSupportSelectedTicketId) || filtered[0] || null;
  const activeMessages = activeTicket ? getTicketMessages(activeTicket) : [];

  const statusButtons = [
    { value: '', label: 'همه' },
    { value: 'open', label: 'باز' },
    { value: 'answered', label: 'پاسخ‌داده‌شده' },
    { value: 'closed', label: 'بسته' }
  ];

  const priorityButtons = [
    { value: '', label: 'همه' },
    { value: 'urgent', label: 'فوری' },
    { value: 'normal', label: 'عادی' }
  ];

  return `
    <div class="animate-fade">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 class="text-2xl lg:text-3xl font-black flex items-center gap-2.5">
          <span class="inline-flex text-blue-300">${typeof aryIcon === 'function' ? aryIcon('ticket', 'w-6 h-6') : ''}</span>
          پشتیبانی و تیکت‌ها
          ${(allTickets.filter(t => t.status !== 'closed').length) > 0 ? `<span class="align-middle text-[11px] font-bold bg-rose-500 text-white rounded-full px-2 py-0.5">${allTickets.filter(t => t.status !== 'closed').length} باز</span>` : ''}
        </h1>
        <button type="button" onclick="aryAdminRefreshNow(this)" title="دریافت آخرین تیکت‌ها از سرور"
          class="px-3.5 py-2 rounded-xl text-xs font-bold glass hover:bg-white/10 inline-flex items-center gap-1.5 text-white/70">${typeof aryIcon === 'function' ? aryIcon('settings', 'w-3.5 h-3.5 animate-spin [animation-duration:3s]') : '↻'} بازخوانی سرور</button>
      </div>

      <div class="glass rounded-2xl p-4 mb-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div class="flex flex-wrap gap-2">
          <span class="text-xs text-white/60">وضعیت:</span>
          ${statusButtons
            .map(
              b => `
            <button
              type="button"
              class="px-3 py-1.5 rounded-xl text-xs font-medium ${
                state.supportFilter.status === b.value ? 'bg-blue-500 text-white' : 'glass hover:bg-white/10'
              }"
              onclick="state.supportFilter.status='${b.value}'; render()"
            >
              ${b.label}
            </button>
          `
            )
            .join('')}
        </div>

        <div class="flex flex-wrap gap-2">
          <span class="text-xs text-white/60">اولویت:</span>
          ${priorityButtons
            .map(
              b => `
            <button
              type="button"
              class="px-3 py-1.5 rounded-xl text-xs font-medium ${
                state.supportFilter.priority === b.value ? 'bg-amber-500 text-white' : 'glass hover:bg-white/10'
              }"
              onclick="state.supportFilter.priority='${b.value}'; render()"
            >
              ${b.label}
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <div class="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
        <!-- Tickets list -->
        <aside class="glass rounded-2xl p-3 max-h-[70vh] overflow-y-auto">
          ${
            filtered.length === 0
              ? `<div class="text-sm text-white/60 p-4 text-center">تیکتی یافت نشد.</div>`
              : filtered
                  .map(t => {
                    const isActive = activeTicket && activeTicket.id === t.id;
                    const isUrgent = (t.priority || 'normal') === 'urgent';
                    const statusLabel =
                      t.status === 'closed' ? 'بسته' : 'باز';
                    return `
                      <button
                        type="button"
                        class="w-full text-right mb-2 px-3 py-2 rounded-xl text-xs ${
                          isActive ? 'bg-white/10' : 'glass hover:bg-white/10'
                        }"
                        onclick="state.adminSupportSelectedTicketId='${t.id}' render(); setTimeout(aryAdminThreadScroll, 30);\"
                      >
                        <div class="flex items-center justify-between mb-1">
                          <span class="font-semibold line-clamp-1">${t.subject || 'بدون عنوان'}</span>
                          ${
                            isUrgent
                              ? `<span class="px-1.5 py-0.5 rounded-full bg-rose-500/30 text-rose-100 text-[10px]">فوری</span>`
                              : ''
                          }
                        </div>
                        <div class="flex items-center justify-between text-[10px] text-white/60">
                          <span>${t.user_name || t.userName || 'کاربر'}</span>
                          <span>${utils.formatDateTime(t.created_at || t.createdAt || '')}</span>
                          <span>${statusLabel}</span>
                        </div>
                      </button>
                    `;
                  })
                  .join('')
          }
        </aside>

        <!-- Active ticket / chat -->
        <section class="glass rounded-2xl p-4 flex flex-col max-h-[70vh]">
          ${
            !activeTicket
              ? `<div class="flex-1 flex items-center justify-center text-sm text-white/60">
                  تیکتی برای نمایش انتخاب نشده است.
                </div>`
              : `
            <div class="border-b border-white/10 pb-3 mb-3 flex items-center justify-between">
              <div>
                <h2 class="text-sm font-bold mb-1 line-clamp-1">${activeTicket.subject || 'بدون عنوان'}</h2>
                <p class="text-[11px] text-white/60">
                  ${activeTicket.user_name || activeTicket.userName || 'کاربر'} •
                  ${utils.formatDateTime(activeTicket.created_at || activeTicket.createdAt || '')}
                </p>
              </div>
              <div class="flex items-center gap-2 text-[11px]">
                <span class="px-2 py-1 rounded-lg bg-white/5 text-white/70">
                  ${
                    activeTicket.status === 'closed' ? 'بسته' : (activeTicket.status === 'answered' ? 'پاسخ داده شده — در انتظار کاربر' : 'باز — در انتظار پاسخ شما')
                  }
                </span>
                ${
                  activeTicket.status !== 'closed'
                    ? `<button
                        type="button"
                        class="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                        onclick="closeTicket(state.tickets.find(t => t.id === '${activeTicket.id}'))"
                      >
                        بستن تیکت
                      </button>`
                    : ''
                }
              </div>
            </div>

            <div id="admin-ticket-thread" class="flex-1 overflow-y-auto space-y-2 mb-3" data-tid="${activeTicket.id}">
              ${
                activeMessages.length === 0
                  ? `<div class="text-xs text-white/60 text-center py-4">پیامی ثبت نشده است.</div>`
                  : activeMessages
                      .map(m => {
                        const isAdmin = (m.from || 'user') === 'admin';
                        return `
                          <div class="flex ${isAdmin ? 'justify-start' : 'justify-end'}">
                            <div class="max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                              isAdmin ? 'bg-white/10 text-white' : 'bg-blue-500 text-white'
                            }">
                              <div class="mb-1 text-[10px] opacity-70">
                                ${isAdmin ? 'پشتیبانی' : (activeTicket.user_name || activeTicket.userName || 'کاربر')}
                                • ${utils.formatDateTime(m.at || '')}
                              </div>
                              <div class="whitespace-pre-line">${escapeHtml(m.text)}</div>
                            </div>
                          </div>
                        `;
                      })
                      .join('')
              }
            </div>

            <div class="border-t border-white/10 pt-3 mt-auto space-y-2">
              <div class="flex flex-wrap gap-2 mb-1">
                ${
                  (Array.isArray(state.supportQuickReplies) ? state.supportQuickReplies : [])
                    .map(
                      (q, qi) => `
                    <button
                      type="button"
                      title="درج در متن پاسخ — «${escapeHtml(q.label || '')}»"
                      class="px-2 py-1 rounded-xl text-[11px] glass hover:bg-white/10 inline-flex items-center gap-1.5"
                      onclick="aryAdminQrInsert(${qi})"
                    >${typeof aryIcon === 'function' ? aryIcon('hourglass', 'w-3 h-3').replace('w-3 h-3','w-3 h-3 opacity-60') : '⚡'} ${q.label}</button>
                  `
                    )
                    .join('')
                }
              </div>

              <form
                id="admin-reply-form"
                class="flex flex-wrap items-center gap-2"
                onsubmit="
                  event.preventDefault();
                  const input = document.getElementById('admin-reply-textarea');
                  const val = String(input && input.value || '').trim();
                  if (!val) { if (window.toast) toast('متن پاسخ خالی است', 'warning'); return; }
                  const closeAfter = !!document.getElementById('admin-reply-close') && document.getElementById('admin-reply-close').checked;
                  addTicketMessage(state.tickets.find(t => t.id === '${activeTicket.id}'), { from: 'admin', text: val }).then(async ok => {
                    if (ok) {
                      if (input) input.value = '';
                      if (closeAfter) await closeTicket(state.tickets.find(t => t.id === '${activeTicket.id}'));
                    }
                  });
                "
              >
                <textarea
                  id="admin-reply-textarea"
                  class="flex-1 input-style resize-none text-xs min-w-[200px]"
                  rows="3"
                  placeholder="پاسخ خود را بنویسید… (برای ارسال: Ctrl+Enter)"
                  onkeydown="if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();document.getElementById('admin-reply-form').requestSubmit();}"
                ></textarea>
                <div class="flex flex-col gap-1.5">
                  <button
                    type="submit"
                    class="px-3.5 py-2 rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 inline-flex items-center gap-1.5"
                  >ارسال</button>
                  <label class="text-[10px] text-white/55 flex items-center gap-1 cursor-pointer select-none">
                    <input id="admin-reply-close" type="checkbox" class="accent-emerald-500 w-3 h-3"> ارسال و بستن
                  </label>
                </div>
              </form>
            </div>
          `
          }
        </section>
      </div>

      <div class="mt-4">
        ${renderAdminSupportQuickReplies()}
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// ADMIN PRODUCTS - ULTIMATE EDITOR v10.3
// ویژگی‌ها: Fixed Delete Button (با الهام از admin panel.js)
// ═══════════════════════════════════════════════════════════════

// ========== CONSTANTS & CONFIG ==========
const AUTO_SAVE_DELAY = 300000; // 5 دقیقه
const MAX_HISTORY = 50;

// ========== GLOBAL EDITOR STATE ==========
window.__articleEditor = window.__articleEditor || {
  history: [],
  historyIndex: -1,
  autoSaveTimer: null,
  lastSavedContent: '',
  isDirty: false,
  selectedImage: null,
  previewMode: false,
  activeTool: null,
  seo: {
    title: '',
    description: '',
    keywords: '',
    slug: '',
    canonical: '',
    robots: 'index,follow',
    og_title: '',
    og_description: '',
    og_slug: '',
    twitter_title: '',
    twitter_description: '',
    redirect_old_url: '',
    schema_json: ''
  }
};

// ========== UTILITIES ==========
function safeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, (s) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[s]));
}

function escapeJs(str) {
  return (str || '').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

// ========== HISTORY MANAGEMENT ==========
function saveToHistory(editor) {
  if (!editor) return;

  const content = editor.innerHTML;
  const editorState = window.__articleEditor;

  if (editorState.history[editorState.historyIndex] === content) return;

  if (editorState.historyIndex < editorState.history.length - 1) {
    editorState.history = editorState.history.slice(0, editorState.historyIndex + 1);
  }

  editorState.history.push(content);
  editorState.historyIndex++;

  if (editorState.history.length > MAX_HISTORY) {
    editorState.history.shift();
    editorState.historyIndex--;
  }

  editorState.isDirty = true;
  updateDirtyState(true);
}

function undo() {
  const editor = document.getElementById('article-editor-content');
  const editorState = window.__articleEditor;
  if (!editor || editorState.historyIndex <= 0) return;

  editorState.historyIndex--;
  editor.innerHTML = editorState.history[editorState.historyIndex];
  editorState.isDirty = editor.innerHTML !== editorState.lastSavedContent;
  updateDirtyState(editorState.isDirty);
  updateActiveTool();
}

function redo() {
  const editor = document.getElementById('article-editor-content');
  const editorState = window.__articleEditor;
  if (!editor || editorState.historyIndex >= editorState.history.length - 1) return;

  editorState.historyIndex++;
  editor.innerHTML = editorState.history[editorState.historyIndex];
  editorState.isDirty = editor.innerHTML !== editorState.lastSavedContent;
  updateDirtyState(editorState.isDirty);
  updateActiveTool();
}

function updateDirtyState(isDirty) {
  const indicator = document.getElementById('article-dirty-indicator');
  if (!indicator) return;

  if (isDirty) {
    indicator.innerHTML = '● ویرایش نشده';
    indicator.className = 'text-amber-400 text-xs mr-2';
  } else {
    indicator.innerHTML = '✓ ذخیره شده';
    indicator.className = 'text-emerald-400 text-xs mr-2';
  }
}

// ========== ACTIVE TOOL MANAGEMENT ==========
function updateActiveTool() {
  const editor = document.getElementById('article-editor-content');
  const editorState = window.__articleEditor;
  if (!editor) return;

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    editorState.activeTool = null;
    updateToolbarButtons();
    return;
  }

  const range = sel.getRangeAt(0);
  let container = range.commonAncestorContainer;
  if (container.nodeType === 3) container = container.parentElement;

  let activeTool = null;
  
  if (document.queryCommandState('bold')) activeTool = 'bold';
  else if (document.queryCommandState('italic')) activeTool = 'italic';
  else if (document.queryCommandState('underline')) activeTool = 'underline';
  
  if (container) {
    if (container.closest('blockquote')) activeTool = 'blockquote';
  }
  
  if (document.queryCommandState('justifyLeft')) activeTool = 'align-left';
  else if (document.queryCommandState('justifyCenter')) activeTool = 'align-center';
  else if (document.queryCommandState('justifyRight')) activeTool = 'align-right';
  else if (document.queryCommandState('justifyFull')) activeTool = 'align-justify';

  editorState.activeTool = activeTool;
  updateToolbarButtons();
}

function updateToolbarButtons() {
  const editorState = window.__articleEditor;
  document.querySelectorAll('.tool-btn').forEach(btn => {
    const cmd = btn.getAttribute('data-cmd');
    if (!cmd) return;
    
    if (editorState.activeTool === cmd) {
      btn.classList.add('active-tool');
    } else {
      btn.classList.remove('active-tool');
    }
  });
}

// ========== AUTO-SAVE ==========
function scheduleAutoSave() {
  const editor = document.getElementById('article-editor-content');
  const editorState = window.__articleEditor;
  if (!editor) return;

  if (editorState.autoSaveTimer) clearTimeout(editorState.autoSaveTimer);

  editorState.autoSaveTimer = setTimeout(() => {
    const content = editor.innerHTML;
    if (content !== editorState.lastSavedContent) {
      state.productDraft.article = content;
      editorState.lastSavedContent = content;
      editorState.isDirty = false;
      updateDirtyState(false);
      toast('✅ مقاله به طور خودکار ذخیره شد', 'success', 2000);
    }
  }, AUTO_SAVE_DELAY);
}

// ========== PREVIEW MODE ==========
function togglePreview() {
  const editorState = window.__articleEditor;
  editorState.previewMode = !editorState.previewMode;
  render();
}

// ========== TEXT SIZE SLIDER ==========
function changeTextSize(direction) {
  const editor = document.getElementById('article-editor-content');
  if (!editor) return;

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  let container = range.commonAncestorContainer;
  if (container.nodeType === 3) container = container.parentElement;

  let targetElement = container;
  if (container.nodeType === 1 && container !== editor) {
    targetElement = container;
  } else {
    const span = document.createElement('span');
    range.surroundContents(span);
    targetElement = span;
  }

  const currentSize = parseFloat(window.getComputedStyle(targetElement).fontSize) || 16;
  const newSize = direction === 'increase' ? currentSize + 2 : Math.max(12, currentSize - 2);
  
  targetElement.style.fontSize = newSize + 'px';
  
  saveToHistory(editor);
  updateEditorState();
}

function setTextSize(size) {
  const editor = document.getElementById('article-editor-content');
  if (!editor) return;

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  let container = range.commonAncestorContainer;
  if (container.nodeType === 3) container = container.parentElement;

  let targetElement = container;
  if (container.nodeType === 1 && container !== editor) {
    targetElement = container;
  } else {
    const span = document.createElement('span');
    range.surroundContents(span);
    targetElement = span;
  }

  targetElement.style.fontSize = size + 'px';
  
  saveToHistory(editor);
  updateEditorState();
}

// ========== SEPARATOR ==========
function insertSeparator() {
  const html = `<hr class="custom-separator" style="border: none; height: 2px; background: #1e40af; margin: 20px 0; border-radius: 2px;">`;
  insertHtmlAtCaret(html);
}

// ========== TABLE MODAL ==========
function openTableModal() {
  state.confirmModal = {
    type: 'insertTable',
    title: 'درج جدول',
    icon: '📊',
    message: `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-white/70 mb-1">تعداد سطرها</label>
            <input id="table-rows" type="number" min="1" max="10" value="3" class="input-style w-full">
          </div>
          <div>
            <label class="block text-xs text-white/70 mb-1">تعداد ستون‌ها</label>
            <input id="table-cols" type="number" min="1" max="8" value="3" class="input-style w-full">
          </div>
        </div>
        <div>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" id="table-header" checked>
            <span>ردیف عنوان داشته باشد</span>
          </label>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-white/70 mb-1">عرض جدول</label>
            <select id="table-width" class="input-style w-full">
              <option value="100%">۱۰۰٪</option>
              <option value="90%">۹۰٪</option>
              <option value="80%">۸۰٪</option>
              <option value="70%">۷۰٪</option>
              <option value="60%">۶۰٪</option>
              <option value="50%">۵۰٪</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-white/70 mb-1">حاشیه</label>
            <select id="table-border" class="input-style w-full">
              <option value="1">دارد</option>
              <option value="0">ندارد</option>
            </select>
          </div>
        </div>
      </div>
    `,
    confirmText: 'درج جدول',
    confirmClass: 'btn-primary',
    onConfirm: () => {
      const rows = Math.min(10, Math.max(1, Number(document.getElementById('table-rows')?.value) || 3));
      const cols = Math.min(8, Math.max(1, Number(document.getElementById('table-cols')?.value) || 3));
      const hasHeader = document.getElementById('table-header')?.checked;
      const width = document.getElementById('table-width')?.value || '100%';
      const border = document.getElementById('table-border')?.value === '1';

      insertTable(rows, cols, hasHeader, width, border);
      state.confirmModal = null;
      render();
    }
  };
  render();
}

function insertTable(rows, cols, hasHeader, width, border) {
  const editor = document.getElementById('article-editor-content');
  if (!editor) return;

  let html = `<div class="table-wrapper" style="overflow-x:auto; margin:16px 0;">`;
  html += `<table style="width:${width}; border-collapse:collapse; ${border ? 'border:1px solid rgba(255,255,255,0.2);' : ''}">`;

  for (let r = 0; r < rows; r++) {
    html += '<tr>';
    for (let c = 0; c < cols; c++) {
      const isHeader = hasHeader && r === 0;
      const tag = isHeader ? 'th' : 'td';
      const style = isHeader ? 'background:rgba(255,255,255,0.1); font-weight:bold;' : '';
      html += `<${tag} style="padding:10px; ${border ? 'border:1px solid rgba(255,255,255,0.2);' : ''} ${style}">${isHeader ? `عنوان ${c+1}` : `متن ${c+1}`}</${tag}>`;
    }
    html += '</tr>';
  }

  html += '</table></div><p></p>';

  insertHtmlAtCaret(html);
  
  setTimeout(() => {
    editor.innerHTML = editor.innerHTML;
  }, 10);
  
  saveToHistory(editor);
  scheduleAutoSave();
}

// ========== INSERT HTML AT CARET ==========
function insertHtmlAtCaret(html) {
  const editor = document.getElementById("article-editor-content"); 
  if (!editor) return;
  
  editor.focus();

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) { 
    editor.insertAdjacentHTML('beforeend', html); 
    saveToHistory(editor);
    return;
  }
  
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) { 
    editor.insertAdjacentHTML('beforeend', html); 
    saveToHistory(editor);
    return;
  }
  
  const frag = range.createContextualFragment(html);
  range.deleteContents(); 
  range.insertNode(frag); 
  sel.collapseToEnd();
  
  saveToHistory(editor);
}

// ========== LINK MODAL ==========
function openLinkModal() {
  const sel = window.getSelection();
  const selectedText = sel.toString();

  if (!selectedText || selectedText.trim().length === 0) {
    toast('ابتدا متن مورد نظر برای لینک را انتخاب کنید', 'warning');
    return;
  }

  // ذخیره موقعیت فعلی
  const range = sel.getRangeAt(0);
  const savedRange = range.cloneRange();

  state.confirmModal = {
    type: 'insertLink',
    title: 'درج لینک',
    icon: '🔗',
    message: `
      <div class="space-y-4">
        <div class="glass rounded-xl p-3 mb-2">
          <p class="text-xs text-white/60 mb-1">متن انتخاب شده:</p>
          <p class="text-sm text-white bg-white/5 p-2 rounded-lg">${escapeHtml(selectedText)}</p>
        </div>
        <div>
          <label class="block text-xs text-white/70 mb-1">آدرس لینک *</label>
          <input id="link-url" class="input-style w-full" placeholder="https://example.com" dir="ltr" value="https://">
        </div>
        <div>
          <label class="block text-xs text-white/70 mb-1">عنوان لینک (اختیاری)</label>
          <input id="link-title" class="input-style w-full" placeholder="عنوان برای سئو">
        </div>
        <div class="flex gap-3">
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" id="link-target" checked>
            <span>در تب جدید باز شود</span>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" id="link-nofollow">
            <span>nofollow</span>
          </label>
        </div>
      </div>
    `,
    confirmText: 'درج لینک',
    confirmClass: 'btn-primary',
    onConfirm: () => {
      const url = document.getElementById('link-url')?.value;
      const title = document.getElementById('link-title')?.value;
      const target = document.getElementById('link-target')?.checked ? '_blank' : '_self';
      const nofollow = document.getElementById('link-nofollow')?.checked;

      if (!url) {
        toast('آدرس لینک الزامی است', 'warning');
        return;
      }

      // بازیابی انتخاب
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);

      // اعمال لینک
      document.execCommand('createLink', false, url);
      
      // تنظیم ویژگی‌های اضافی
      setTimeout(() => {
        const editor = document.getElementById('article-editor-content');
        const links = editor.querySelectorAll('a');
        links.forEach(a => {
          if (a.href === url || a.href === url + '/' || a.href.endsWith(url)) {
            if (title) a.title = title;
            a.target = target;
            a.setAttribute('rel', nofollow ? 'nofollow noopener' : 'noopener');
          }
        });
        saveToHistory(editor);
      }, 50);

      state.confirmModal = null;
      render();
    },
    onCancel: () => {
      state.confirmModal = null;
      render();
    }
  };
  render();
}

// ========== APPLY TEXT FORMAT ==========
function applyTextFormat(cmd, value) {
  const editor = document.getElementById("article-editor-content"); 
  if (!editor) return; 

  editor.focus();
  saveToHistory(editor);

  if (cmd === 'createLink') {
    openLinkModal();
    return;
  }

  if (cmd === 'bold' || cmd === 'italic' || cmd === 'underline') {
    document.execCommand(cmd, false, null);
  }
  else if (cmd === 'blockquote') {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      
      let container = range.commonAncestorContainer;
      if (container.nodeType === 3) container = container.parentElement;
      
      if (container && container.closest('blockquote')) {
        toast('نمی‌توانید داخل نقل قول، نقل قول دیگری ایجاد کنید', 'warning');
        return;
      }
      
      const blockquote = document.createElement('blockquote');
      blockquote.className = 'custom-blockquote';
      
      if (range.collapsed) {
        blockquote.innerHTML = '<p><br></p>';
        range.insertNode(blockquote);
      } else {
        const contents = range.extractContents();
        blockquote.appendChild(contents);
        range.insertNode(blockquote);
      }
      
      const newRange = document.createRange();
      newRange.setStart(blockquote, 0);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  }
  else if (cmd === 'align-left') {
    document.execCommand('justifyLeft', false, null);
  }
  else if (cmd === 'align-center') {
    document.execCommand('justifyCenter', false, null);
  }
  else if (cmd === 'align-right') {
    document.execCommand('justifyRight', false, null);
  }
  else if (cmd === 'align-justify') {
    document.execCommand('justifyFull', false, null);
  }
  else if (cmd === 'separator') {
    insertSeparator();
  }
  else if (cmd === 'undo') {
    undo();
    return;
  }
  else if (cmd === 'redo') {
    redo();
    return;
  }
  else if (cmd === 'dir-rtl') {
    editor.setAttribute('dir', 'rtl');
  }
  else if (cmd === 'dir-ltr') {
    editor.setAttribute('dir', 'ltr');
  }
  else if (cmd === 'table') {
    openTableModal();
    return;
  }

  updateEditorState();
  updateActiveTool();
  scheduleAutoSave();
}

// ========== VIDEO HELPERS (پیش‌نمایش داخل پنل ادمین - مجزا از پخش‌کننده سایت) ==========
function openAdminVideoPreview(videoIndex) { 
  state.adminVideoPreview = { index: videoIndex, file: state.productDraft.videos[videoIndex] }; 
  render(); 
}

function closeAdminVideoPreview() { 
  const video = document.querySelector('video');
  if (video) {
    video.pause();
    video.currentTime = 0;
    video.src = '';
    video.load();
  }
  state.adminVideoPreview = null; 
  render(); 
}

function renderAdminVideoPreviewModal() {
  if (!state.adminVideoPreview) return '';
  
  const file = state.adminVideoPreview.file;
  let url = '';
  
  if (file && file instanceof File) {
    url = URL.createObjectURL(file);
  } else {
    url = file || '';
  }
  
  return `
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 video-player-overlay" onclick="if(event.target===this) closeAdminVideoPreview()">
      <div class="glass-strong rounded-3xl p-4 max-w-2xl w-full animate-scale">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-lg font-bold">🎥 پخش ویدیو</h3>
          <button onclick="closeAdminVideoPreview()" class="text-white/70 hover:text-white text-xl" type="button"><i class="ri-close-line text-xl"></i></button>
        </div>
        <div class="w-full">
          <video controls playsinline preload="metadata" class="w-full rounded-xl" src="${escapeHtml(url)}">
            مرورگر شما از پخش این ویدیو پشتیبانی نمی‌کند.
          </video>
        </div>
      </div>
    </div>
  `;
}

// ========== ICON LOADER + FALLBACK ==========
(function initToolbarIcons() {
  function ensureRemixCss() {
    const href = "https://cdn.jsdelivr.net/npm/remixicon@4.3.0/fonts/remixicon.css";
    const exists = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .some(l => l.href && l.href.indexOf('remixicon') !== -1);
    if (!exists) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      return link;
    }
    return null;
  }

  const ICON_FALLBACK = {
    'ri-bold': 'B','ri-italic': '𝑖','ri-underline': 'U̲',
    'ri-double-quotes-l': '❝','ri-link': '🔗','ri-align-left': '⬅️','ri-align-center': '↔️','ri-align-right': '➡️',
    'ri-align-justify': '≡','ri-arrow-go-back-line': '↶','ri-arrow-go-forward-line': '↷',
    'ri-separator': '─','ri-table-line': '📊', 'ri-eye-line': '👁️',
    'ri-arrow-right-line': '→', 'ri-arrow-left-line': '←', 'ri-font-size': 'Aa',
    'ri-box-3-line': '📦', 'ri-search-line': '🔍', 'ri-video-line': '🎥'
  };

  function remixIconsAvailable() {
    try {
      const el = document.createElement('i');
      el.className = 'ri-bold';
      el.style.position = 'absolute';
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      document.body.appendChild(el);
      const cs = window.getComputedStyle(el);
      const fontFamily = cs.getPropertyValue('font-family') || '';
      document.body.removeChild(el);
      return /remix/i.test(fontFamily);
    } catch (e) {
      return false;
    }
  }

  function applyIconFallback(root = document) {
    try {
      const icons = root.querySelectorAll('i[class*="ri-"]');
      icons.forEach(i => {
        if (i.getAttribute('data-fallback-applied') === '1') return;
        const cs = window.getComputedStyle(i);
        const fontFamily = cs.getPropertyValue('font-family') || '';
        const isRemix = /remix/i.test(fontFamily);
        if (!isRemix) {
          const cls = Array.from(i.classList).find(c => c.startsWith('ri-'));
          const fallback = ICON_FALLBACK[cls];
          if (fallback) {
            i.innerHTML = `<span aria-hidden="true" class="icon-fallback">${fallback}</span>`;
            i.setAttribute('data-fallback-applied', '1');
          }
        }
      });
    } catch (e) {}
  }

  try {
    const observer = new MutationObserver((mutations) => {
      if (observer._timeout) clearTimeout(observer._timeout);
      observer._timeout = setTimeout(() => { applyIconFallback(document); }, 80);
    });

    const injectedLink = ensureRemixCss();

    if (injectedLink) {
      let loaded = false;
      injectedLink.addEventListener('load', () => {
        loaded = true;
        setTimeout(() => {
          if (!remixIconsAvailable()) applyIconFallback(document);
          if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
          }
        }, 120);
      });
      setTimeout(() => {
        if (!loaded) {
          if (!remixIconsAvailable()) applyIconFallback(document);
          if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
          }
        }
      }, 1000);
    } else {
      setTimeout(() => {
        if (!remixIconsAvailable()) applyIconFallback(document);
        if (document.body) {
          observer.observe(document.body, { childList: true, subtree: true });
        }
      }, 80);
    }
  } catch (e) {}

  window.__applyIconFallback = function(root) { applyIconFallback(root || document); };
})();

// ---------- State init / Draft ----------
function initProductDraft() {
  if (!state.productDraft) {
    state.productDraft = {
      title: '', category: '', price: 0, stock: 0, description: '',
      mainImage: '', gallery: [], original_price: 0, article: '', videos: [], _synced: null,
      seo_title: '', seo_description: '', seo_keywords: '', slug: '',
      seo_canonical: '', seo_robots: 'index,follow',
      og_title: '', og_description: '', og_slug: '',
      twitter_title: '', twitter_description: '',
      redirect_old_url: '', schema_json: ''
    };
  } else {
    if (typeof state.productDraft.article === 'undefined') state.productDraft.article = "";
    if (!Array.isArray(state.productDraft.videos)) state.productDraft.videos = [];
  }
  if (typeof state.productFilterCategory === 'undefined') state.productFilterCategory = 'all';
}

function syncDraftFromEditing() {
  const p = state.editProduct;
  if (!p) return;
  const d = state.productDraft;
  if (d._synced === 'locked') return;
  d.title = p.title || '';
  d.category = p.category || '';
  d.price = safeNumber(p.price);
  d.stock = safeNumber(p.stock);
  d.description = p.description || '';
  d.mainImage = p.main_image || p.image || '';
  d.gallery = Array.isArray(p.images) ? [...p.images] : [];
  d.original_price = safeNumber(p.original_price);
  d.article = p.article || '';
  d.videos = Array.isArray(p.videos) ? [...p.videos] : [];
  d.seo_title = p.seo_title || '';
  d.seo_description = p.seo_description || '';
  d.seo_keywords = p.seo_keywords || '';
  d.slug = p.slug || '';
  d.seo_canonical = p.seo_canonical || '';
  d.seo_robots = p.seo_robots || 'index,follow';
  d.og_title = p.og_title || '';
  d.og_description = p.og_description || '';
  d.og_slug = p.og_slug || '';
  d.twitter_title = p.twitter_title || '';
  d.twitter_description = p.twitter_description || '';
  d.redirect_old_url = p.redirect_old_url || '';
  d.schema_json = p.schema_json || '';
  d._synced = 'locked';
}

// ---------- File readers ----------
function readImageFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

// تبدیل فایل‌های ویدیویی به data URL (base64) تا مثل تصاویر قابل ذخیره‌سازی
// در IndexedDB/دیتابیس و قابل پخش در صفحه محصول باشند (قبلاً به‌صورت آبجکت
// File خام نگه‌داری می‌شدند که نه ذخیره می‌شد و نه در صفحه محصول قابل پخش بود)
async function handleVideoFilesUpload(files) {
  const list = [...files];
  const MAX_MB = 25;

  for (const f of list) {
    if (f.size > MAX_MB * 1024 * 1024) {
      toast(`ویدیوی «${f.name}» بزرگ‌تر از ${MAX_MB} مگابایت است و رد شد`, 'warning');
      continue;
    }
    try {
      const dataUrl = await readImageFile(f); // همان تابع، برای هر نوع فایل کار می‌کند
      state.productDraft.videos.push(dataUrl);
      renderProductModalOnly();
    } catch (e) {
      toast(`خطا در خواندن ویدیوی «${f.name}»`, 'error');
    }
  }

  if (list.length) toast(`${list.length} ویدیو اضافه شد`, 'success');
  const input = document.getElementById('video-upload-input');
  if (input) input.value = '';
}
window.handleVideoFilesUpload = handleVideoFilesUpload;

// ---------- Modal partial render (رفع رفرش) ----------
function renderProductModalOnly() {
  const modal = document.querySelector(".modal-overlay");
  if (!modal) return;
  
  // فقط محتوای مودال رو آپدیت کن، نه کل مودال
  const modalContent = modal.querySelector('.glass-strong');
  if (modalContent) {
    const newContent = renderProductModal().match(/<div class="glass-strong[^>]*>[\s\S]*<\/div>/)?.[0] || '';
    if (newContent) {
      modalContent.outerHTML = newContent;
    }
  }
}

// ---------- Image helpers (رفع رفرش) ----------
async function handleMainImageFiles(files) {
  const file = files[0];
  if (!file) return;
  const dataUrl = await readImageFile(file);
  state.productDraft.mainImage = dataUrl;
  toast('تصویر اصلی تنظیم شد', 'success');
  renderProductModalOnly(); // فقط مودال رفرش میشه، نه کل صفحه
}

async function handleGalleryFiles(files) {
  const allowed = Math.max(0, 10 - state.productDraft.gallery.length);
  const list = [...files].slice(0, allowed);
  for (const f of list) {
    const dataUrl = await readImageFile(f);
    state.productDraft.gallery.push(dataUrl);
  }
  if (list.length) toast(`${list.length} تصویر اضافه شد`, 'success');
  renderProductModalOnly(); // فقط مودال رفرش میشه
}

function removeGalleryItem(i) { 
  state.productDraft.gallery.splice(i, 1); 
  renderProductModalOnly(); // فقط مودال رفرش میشه
}

function moveGalleryItem(i, dir) {
  const g = state.productDraft.gallery; 
  const ni = i + dir;
  if (ni < 0 || ni >= g.length) return;
  const [item] = g.splice(i, 1); 
  g.splice(ni, 0, item); 
  renderProductModalOnly(); // فقط مودال رفرش میشه
}

// ---------- Video helpers (رفع رفرش) ----------
function moveVideoItem(i, dir) {
  const v = state.productDraft.videos || []; 
  const ni = i + dir;
  if (ni < 0 || ni >= v.length) return;
  const [item] = v.splice(i, 1); 
  v.splice(ni, 0, item); 
  renderProductModalOnly(); // فقط مودال رفرش میشه
}

// ---------- Product filter ----------
function setProductFilterCategory(val) { state.productFilterCategory = val; render(); }

/* --- محصولات: جستجو + ویدیو --- */
function adminProductVideos(p) {
  if (!p) return [];
  let v = p.videos;
  if (typeof v === 'string') { v = v.trim(); if (!v) return []; try { v = JSON.parse(v); } catch (e) { v = [v]; } }
  if (!Array.isArray(v)) return [];
  return v.map(x => (typeof x === 'string' ? x : (x && (x.url || x.src || x.link)) || '')).filter(Boolean);
}
function adminProductsFiltered() {
  const q = String(state.productSearchQ || '').trim().toLowerCase();
  const vidsOnly = !!state.productVideosOnly;
  return (state.products || []).filter(p => {
    const cat = p.category || '';
    if (state.productFilterCategory === 'all') { /* noop */ }
    else if (state.productFilterCategory === 'uncategorized') { if (cat) return false; }
    else if (String(cat) !== String(state.productFilterCategory)) return false;
    if (vidsOnly && adminProductVideos(p).length === 0) return false;
    if (q) {
      const catTitle = ((state.categories || []).find(c => String(c.id) === String(cat)) || {}).title || '';
      const hay = [String(p.title || ''), String(p.slug || ''), String(catTitle)].map(x => x.toLowerCase());
      if (q === 'ویدیو' || q === 'video') { if (adminProductVideos(p).length === 0) return false; }
      else if (!hay.some(h => h.includes(q))) return false;
    }
    return true;
  });
}
function updateAdminProductsList() {
  const w = document.getElementById('admin-products-list');
  if (!w) return;
  w.innerHTML = adminProductsListHtml(adminProductsFiltered());
}
window.updateAdminProductsList = updateAdminProductsList;
window.aryAdminPlayProductVideos = function (pid, start) {
  const p = (state.products || []).find(x => x.id === pid);
  if (!p) return;
  const list = adminProductVideos(p);
  if (!list.length) { if (window.toast) toast('ویدیویی برای این محصول ثبت نشده است', 'warning'); return; }
  if (window.AryaVideoPlayer) AryaVideoPlayer.open(Math.min(Number(start) || 0, list.length - 1), list);
  else { state.adminVideoPreview = { index: 0, file: list[0] }; render(); }
};

// ---------- Admin list (with category filter) ----------
function renderAdminProductsEditor() {
  initProductDraft(); if (state.editProduct) syncDraftFromEditing();
  const categoriesOptions = [
    `<option value="all"${state.productFilterCategory === 'all' ? ' selected' : ''}>همه</option>`,
    `<option value="uncategorized"${state.productFilterCategory === 'uncategorized' ? ' selected' : ''}>بدون دسته</option>`,
    ...state.categories.map(cat => `<option value="${cat.id}"${state.productFilterCategory === String(cat.id) ? ' selected' : ''}>${escapeHtml(cat.title)}</option>`)
  ].join('');
  const filteredProducts = adminProductsFiltered();

  return `
    <div class="animate-fade">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-black">محصولات (${filteredProducts.length})</h1>
          <p class="text-sm text-white/60 mt-1">مدیریت محصولات و مقالات</p>
        </div>

        <div class="flex items-center gap-3">
          <label class="text-sm text-white/70">فیلتر دسته:</label>
          <select onchange="setProductFilterCategory(this.value)" class="input-style">${categoriesOptions}</select>

          <button onclick="
            state.editProduct = {}; 
            state.productDraft = { 
              title:'', category:'', price:0, stock:0, description:'',
              mainImage:'', gallery:[], original_price:0, article:'', videos: [], _synced: null,
              seo_title:'', seo_description:'', seo_keywords:'', slug:'',
              seo_canonical:'', seo_robots:'index,follow',
              og_title:'', og_description:'', og_slug:'',
              twitter_title:'', twitter_description:'',
              redirect_old_url:'', schema_json:''
            }; 
            render();
          " class="btn-primary px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold" type="button">
            <i class="ri-add-line text-base"></i><span>افزودن محصول</span>
          </button>
        </div>
      </div>

      <div class="glass rounded-2xl p-3 lg:p-4 mb-4 flex flex-wrap items-center gap-2">
        <div class="relative flex-1 min-w-[220px]">
          <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 inline-flex">${typeof aryIcon === 'function' ? aryIcon('search', 'w-4 h-4') : ''}</span>
          <input id="admin-products-search" type="search" placeholder="جستجوی محصول: نام، اسلاگ یا دسته…"
            class="input-style w-full pr-10 text-sm" value="${escapeHtml(state.productSearchQ || '')}"
            oninput="state.productSearchQ = this.value; updateAdminProductsList()" autocomplete="off">
        </div>
        <button type="button" onclick="state.productVideosOnly = !state.productVideosOnly; render()"
          class="px-3.5 py-2 rounded-xl text-xs font-medium transition-all inline-flex items-center gap-1.5 ${state.productVideosOnly ? 'bg-blue-500 text-white' : 'glass hover:bg-white/10 text-white/70'}">
          ${typeof aryIcon === 'function' ? aryIcon('play', 'w-3.5 h-3.5') : '▶'} فقط دارای ویدیو
        </button>
        <span class="text-[11px] text-white/45">${filteredProducts.length} نتیجه</span>
      </div>

      <div id="admin-products-list">
      ${adminProductsListHtml(filteredProducts)}
      </div>
    </div>
  `;
}

function adminProductsListHtml(filteredProducts) {
  return filteredProducts.length > 0 ? `
        <div class="grid gap-4">
          ${filteredProducts.map((product, i) => {
            const imgSrc = product.image || product.main_image || '';
            const hasImage = !!imgSrc;
            const price = Number(product.price || 0);
            const original = Number(product.original_price || 0);
            const hasDiscount = original > price && price > 0;
            const discountPercent = hasDiscount ? Math.round(((original - price) / original) * 100) : 0;
            return `
              <div class="glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 animate-fade min-w-0" style="animation-delay:${i * 0.05}s">
                <div class="w-full sm:w-16 h-24 sm:h-16 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                  ${ hasImage ? `<img src="${imgSrc}" alt="${escapeHtml(product.title)}" class="w-full h-full object-cover">` : `<span class="text-3xl">📦</span>` }
                </div>

                <div class="flex-1 min-w-0">
                  <h3 class="font-bold leading-6 break-words">${escapeHtml(String(product.title || 'بدون نام'))}</h3>
                  <p class="text-white/60 text-sm truncate">${escapeHtml(state.categories.find(c => c.id === product.category)?.title || 'بدون دسته')}</p>
                  ${product.slug ? `<p class="text-white/40 text-xs mt-1 break-all line-clamp-1">/${escapeHtml(String(product.slug))}</p>` : ''}
                  ${(() => { const vids = adminProductVideos(product); if (!vids.length) return ''; return `<button type="button" class="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 hover:bg-blue-500/25 border border-blue-500/20 transition-all" onclick="aryAdminPlayProductVideos('${product.id}', 0)">${typeof aryIcon === 'function' ? aryIcon('play', 'w-3 h-3') : '▶'} <bdi dir="rtl">${vids.length} ویدیوی محصول${vids[0] ? '' : ''}</bdi></button>`; })()}
                </div>

                <div class="text-left sm:text-right shrink-0">
                  ${ hasDiscount ? `
                      <div class="flex items-center gap-2">
                        <span class="text-emerald-400 font-bold">${utils.formatPrice(price)}</span>
                        <span class="price-original text-xs">${utils.formatPrice(original)}</span>
                      </div>
                      <div class="mt-1"><span class="badge badge-discount text-[10px]">${discountPercent}% تخفیف</span></div>
                    ` : `<p class="text-emerald-400 font-bold">${utils.formatPrice(price)}</p>` }
                  <p class="text-xs text-white/60 mt-1">موجودی: ${Number(product.stock) || 0}${(Number(product.stock) || 0) < 5 ? '<span class="text-amber-400 mr-1.5"> (رو به اتمام)</span>' : ''}</p>
                </div>

                <div class="flex gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                  <button onclick="
                    state.editProduct = state.products.find(p => p.id === '${product.id}');
                    state.productDraft = { 
                      title:'', category:'', price:0, stock:0, description:'',
                      mainImage:'', gallery:[], original_price:0, article:'', videos: [], _synced: null,
                      seo_title:'', seo_description:'', seo_keywords:'', slug:'',
                      seo_canonical:'', seo_robots:'index,follow',
                      og_title:'', og_description:'', og_slug:'',
                      twitter_title:'', twitter_description:'',
                      redirect_old_url:'', schema_json:''
                    };
                    render();
                  " class="p-3 glass rounded-xl hover:bg-white/10 transition-all" type="button"><i class="ri-edit-line text-base"></i></button>

                  <button onclick="confirmDeleteProduct('${product.id}', '${escapeJs(product.title)}')" class="p-3 glass rounded-xl hover:bg-rose-500/20 text-rose-400 transition-all" type="button"><i class="ri-delete-bin-line text-base"></i></button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="glass rounded-3xl p-16 text-center">
          <div class="mb-6 animate-float flex items-center justify-center text-white/25">
            ${typeof aryIcon === 'function' ? aryIcon('box', 'w-20 h-20') : '<span class="text-7xl">📦</span>'}
          </div>
          <h3 class="text-2xl font-bold mb-4">محصولی ثبت نشده است</h3>
          <p class="text-white/60 mb-6">اولین محصول خود را اضافه کنید</p>
          <button onclick="
            state.editProduct = {}; 
            state.productDraft = { 
              title:'', category:'', price:0, stock:0, description:'',
              mainImage:'', gallery:[], original_price:0, article:'', videos: [], _synced: null,
              seo_title:'', seo_description:'', seo_keywords:'', slug:'',
              seo_canonical:'', seo_robots:'index,follow',
              og_title:'', og_description:'', og_slug:'',
              twitter_title:'', twitter_description:'',
              redirect_old_url:'', schema_json:''
            }; 
            render();
          " class="btn-primary px-8 py-4 rounded-xl font-bold" type="button">افزودن محصول</button>
        </div>
  `;
}

// ---------- Product Modal (با placeholder برای قیمت) ----------
function renderProductModal() {
  const isEdit = state.editProduct && state.editProduct.id;
  const product = state.editProduct || {};
  initProductDraft(); if (state.editProduct) syncDraftFromEditing();
  const d = state.productDraft;
  const price = d.price || product.price || '';
  const original = d.original_price || product.original_price || '';
  const hasDiscount = original > price && price > 0;
  const discountPercent = hasDiscount ? Math.round(((original - price) / original) * 100) : 0;

  return `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay">
      <div class="glass-strong rounded-3xl p-6 lg:p-8 max-w-lg w-full max-h-[90%] overflow-y-auto animate-scale">
        <h2 class="text-xl font-black mb-6">${isEdit ? '✏️ ویرایش محصول' : '➕ محصول جدید'}</h2>
        <form onsubmit="event.preventDefault(); submitProductForm(this);">
          <div class="space-y-5">
            <div>
              <label class="block text-sm text-white/70 mb-2">عنوان محصول *</label>
              <input type="text" name="title" required value="${escapeHtml(d.title)}" class="w-full input-style" placeholder="عنوان محصول را وارد کنید" oninput="state.productDraft.title = this.value">
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-white/70 mb-2">قیمت *</label>
                <input type="number" name="price" required value="${price}" class="w-full input-style" dir="ltr" placeholder="قیمت را وارد کنید"
                  onfocus="if(this.value == 0) this.value=''"
                  onblur="if(this.value === '') { this.value = ''; state.productDraft.price = ''; }"
                  oninput="state.productDraft.price = Number(this.value)">
              </div>

              <div>
                <label class="block text-sm text-white/70 mb-2">قیمت اصلی</label>
                <input type="number" name="original_price" value="${original}" class="w-full input-style" dir="ltr" placeholder="قیمت اصلی را وارد کنید"
                  onfocus="if(this.value == 0) this.value=''"
                  onblur="if(this.value === '') { this.value = ''; state.productDraft.original_price = ''; }"
                  oninput="state.productDraft.original_price = Number(this.value)">
                ${ hasDiscount ? `<p class="text-xs text-emerald-400 mt-1">${discountPercent}% تخفیف</p>` : `<p class="text-xs text-white/40 mt-1">در صورت وارد کردن قیمت اصلی بالاتر، تخفیف محاسبه می‌شود.</p>` }
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-white/70 mb-2">موجودی *</label>
                <input type="number" name="stock" required value="${d.stock}" class="w-full input-style" dir="ltr" placeholder="موجودی را وارد کنید"
                  onfocus="if(this.value == 0) this.value=''"
                  onblur="if(this.value === '') { this.value = ''; state.productDraft.stock = ''; }"
                  oninput="state.productDraft.stock = Number(this.value)">
              </div>

              <div>
                <label class="block text-sm text-white/70 mb-2">دسته‌بندی</label>
                <select name="category" class="w-full input-style" onchange="state.productDraft.category = this.value">
                  <option value="">بدون دسته</option>
                  ${state.categories.map(cat => `<option value="${cat.id}" ${d.category === cat.id ? 'selected' : ''}>${escapeHtml(cat.title)}</option>`).join('')}
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm text-white/70 mb-2">تصویر اصلی</label>
              <div class="glass rounded-2xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer border border-dashed border-white/20 hover:border-blue-400 transition" onclick="document.getElementById('main-image-input').click()">
                ${ d.mainImage ? `
                  <div class="w-full max-h-56 rounded-xl overflow-hidden mb-3"><img src="${d.mainImage}" class="w-full h-full object-cover"></div>
                  <div class="flex gap-2">
                    <button type="button" class="btn-ghost px-4 py-2 rounded-xl text-sm" onclick="event.stopPropagation(); state.productDraft.mainImage=''; renderProductModalOnly();">حذف</button>
                    <button type="button" class="btn-primary px-4 py-2 rounded-xl text-sm" onclick="event.stopPropagation(); document.getElementById('main-image-input').click()">تغییر تصویر</button>
                  </div>` : `<div class="text-4xl">📷</div><p class="text-sm text-white/70 text-center">برای انتخاب تصویر کلیک کنید</p>` }
                <input id="main-image-input" type="file" accept="image/*" class="hidden" onchange="handleMainImageFiles(this.files)">
              </div>
            </div>

            <div>
              <label class="block text-sm text-white/70 mb-2">گالری تصاویر</label>
              <div class="flex gap-3 overflow-x-auto pb-2">
                ${ d.gallery.length === 0 ? `<p class="text-white/40 text-sm">هنوز تصویری اضافه نشده.</p>` : d.gallery.map((img, i) => `
                  <div class="glass rounded-xl p-2 flex-shrink-0 w-32">
                    <div class="w-full h-24 rounded-lg overflow-hidden mb-2"><img src="${img}" class="w-full h-full object-cover"></div>
                    <div class="flex items-center justify-between gap-1">
                      <button type="button" class="btn-ghost px-2 py-1 rounded-lg text-[10px]" onclick="removeGalleryItem(${i})">حذف</button>
                    </div>
                  </div>`).join('') }
              </div>

              <div class="glass rounded-2xl p-4 mt-3 flex flex-col items-center justify-center gap-3 cursor-pointer border border-dashed border-white/20 hover:border-blue-400 transition" onclick="document.getElementById('gallery-image-input').click()">
                <div class="text-3xl">🖼️</div>
                <p class="text-sm text-white/70 text-center">برای افزودن تصاویر کلیک کنید</p>
                <input id="gallery-image-input" type="file" accept="image/*" multiple class="hidden" onchange="handleGalleryFiles(this.files)">
              </div>
            </div>

            <div>
              <label class="block text-sm text-white/70 mb-2">مقاله محصول</label>
              <button type="button" onclick="openArticleEditor()" class="btn-primary w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"><span>✏️</span><span>افزودن / ویرایش مقاله</span></button>
              ${ d.article ? `<p class="text-xs text-emerald-400 mt-2 truncate">مقاله ثبت شده ✔</p>` : `<p class="text-xs text-white/40 mt-2">مقاله‌ای ثبت نشده.</p>` }
            </div>

            <div>
              <label class="block text-sm text-white/70 mb-2">ویدیوهای محصول</label>
              <div class="flex flex-col gap-3">
                ${ d.videos.length === 0 ? `<p class="text-white/40 text-sm">ویدیویی اضافه نشده.</p>` : d.videos.map((vid, i) => `
                  <div class="glass rounded-xl p-3 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group" onclick="openAdminVideoPreview(${i})" title="پیش‌نمایش و پخش">
                      ${(() => { const u = typeof vid === 'string' ? vid : (vid && (vid.url || vid.src || vid.link)) || ''; return u
                        ? `<div class="relative w-24 h-14 bg-black/40 rounded-lg overflow-hidden border border-white/10 shrink-0">
                             <video src="${escapeHtml(u)}#t=0.9" muted playsinline preload="metadata" class="w-full h-full object-cover group-hover:opacity-90 transition"></video>
                             <span class="absolute inset-0 flex items-center justify-center text-white/85"><span class="bg-black/55 rounded-full p-1.5 inline-flex">${typeof aryIcon === 'function' ? aryIcon('play', 'w-4 h-4') : '▶'}</span></span>
                           </div>`
                        : `<div class="w-24 h-14 bg-black/10 rounded-lg overflow-hidden flex items-center justify-center text-[10px] shrink-0 border border-white/10">${escapeHtml(String((vid && vid.name) || 'ویدیو ' + (i + 1)).slice(0, 10))}</div>`; })()}
                      <div class="text-xs truncate flex-1 min-w-0 text-white/70">${typeof vid === 'string' ? (vid.startsWith('data:') ? `ویدیوی آپلودی ${(vid.length / 1024 / 1024).toFixed(1)} مگابایت` : String(vid).split('/').pop().slice(0, 40)) : escapeHtml(vid.name || 'ویدیو')}</div>
                    </div>
                    <div class="flex gap-2 flex-shrink-0">
                      <button class="btn-ghost text-[11px] px-3 py-1 rounded-lg" type="button" onclick="openAdminVideoPreview(${i})">مشاهده</button>
                      <button class="btn-ghost text-[11px] px-3 py-1 rounded-lg" type="button" onclick="state.productDraft.videos.splice(${i},1); renderProductModalOnly();">حذف</button>
                    </div>
                  </div>`).join('') }
              </div>

              <div class="glass rounded-2xl p-4 mt-3 flex flex-col items-center justify-center gap-3 cursor-pointer border border-dashed border-white/20 hover:border-blue-400 transition" onclick="document.getElementById('video-upload-input').click()">
                <div class="text-3xl">🎥</div>
                <p class="text-sm text-white/70 text-center">برای افزودن ویدیو کلیک کنید</p>
                <input id="video-upload-input" type="file" accept="video/*" multiple class="hidden" onchange="handleVideoFilesUpload(this.files)">
              </div>
            </div>

          </div>

          <div class="flex gap-4 mt-8">
            ${ isEdit ? `<button type="button" class="flex-1 btn-danger py-4 rounded-xl font-semibold flex items-center justify-center gap-2" onclick="confirmDeleteProductFromModal('${product.id}', '${escapeJs(product.title)}')">🗑️<span>حذف محصول</span></button>` : '' }
            <button type="button" onclick="clearProductDraft()" class="flex-1 btn-ghost py-4 rounded-xl font-semibold">انصراف</button>
            <button type="submit" class="flex-1 btn-primary py-4 rounded-xl font-semibold" ${state.loading ? 'disabled' : ''}>${state.loading ? '⏳' : isEdit ? 'بروزرسانی' : 'ذخیره'}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// ---------- Product actions (با الهام از admin panel.js) ----------
function confirmDeleteProduct(id, title) {
  state.confirmModal = {
    type: 'delete-product', 
    title: 'حذف محصول', 
    message: `آیا از حذف «${title}» مطمئن هستید؟`, 
    icon: '🗑️',
    confirmText: 'حذف', 
    confirmClass: 'btn-danger',
    onConfirm: () => { 
      deleteProduct(id); 
      state.confirmModal = null; 
      state.editProduct = null; 
      state.productDraft = null; 
      render(); 
    }
  };
  render();
}

// تابع جدید برای حذف از داخل مودال (با الهام از deleteCategoryWithConfirm در admin panel.js)
function confirmDeleteProductFromModal(id, title) {
  // بستن مودال فعلی
  state.editProduct = null;
  state.productDraft = null;
  
  // نمایش مودال تایید حذف
  state.confirmModal = {
    type: 'delete-product', 
    title: 'حذف محصول', 
    message: `آیا از حذف «${title}» مطمئن هستید؟`, 
    icon: '🗑️',
    confirmText: 'حذف', 
    confirmClass: 'btn-danger',
    onConfirm: () => { 
      deleteProduct(id); 
      state.confirmModal = null; 
      render(); 
    }
  };
  render();
}

function validateProductForm(formEl) {
  const title = (formEl.title.value || '').trim();
  const price = Number(formEl.price.value || 0);
  const stock = Number(formEl.stock.value || 0);
  const mainImage = state.productDraft.mainImage;
  const errors = [];
  if (!title) errors.push('نام محصول الزامی است.');
  if (price < 0) errors.push('قیمت نمی‌تواند منفی باشد.');
  if (stock < 0) errors.push('موجودی نمی‌تواند منفی باشد.');
  if (!mainImage) errors.push('تصویر اصلی محصول الزامی است.');
  return { ok: errors.length === 0, errors };
}
function submitProductForm(formEl) {
  event.preventDefault(); initProductDraft();
  const { ok, errors } = validateProductForm(formEl);
  if (!ok) { toast(errors[0], 'warning'); return; }
  const price = Number(formEl.price.value || 0);
  const original_price = Number(formEl.original_price.value || 0);
  const payload = {
    article: state.productDraft.article || "",
    videos: state.productDraft.videos || [],
    title: formEl.title.value.trim(), category: formEl.category.value || '', price,
    stock: Number(formEl.stock.value || 0), description: formEl.description ? formEl.description.value || '' : '',
    main_image: state.productDraft.mainImage, image: state.productDraft.mainImage,
    images: state.productDraft.gallery.filter(Boolean), original_price: original_price > 0 ? original_price : 0
  };
  if (state.editProduct && state.editProduct.id) {
    const updated = updateProduct(state.editProduct.id, payload);
    if (updated) toast('تغییرات محصول ذخیره شد ✨', 'success');
    state.editProduct = null; state.productDraft = null; render(); return;
  }
  const created = createProduct(payload);
  if (created) toast('محصول ذخیره شد ✅', 'success');
  state.editProduct = null; state.productDraft = null; render();
}
function clearProductDraft() { 
  state.productDraft = { 
    title:'', category:'', price:0, stock:0, description:'', 
    mainImage:'', gallery:[], original_price:0, article: "", videos: [], _synced: null,
    seo_title:'', seo_description:'', seo_keywords:'', slug:'',
    seo_canonical:'', seo_robots:'index,follow',
    og_title:'', og_description:'', og_slug:'',
    twitter_title:'', twitter_description:'',
    redirect_old_url:'', schema_json:''
  }; 
  state.editProduct = null; 
  render(); 
}

// ---------- Article editor core ----------
function openArticleEditor() { 
  initProductDraft(); 
  
  const editorState = window.__articleEditor;
  const content = state.productDraft.article || "";
  editorState.history = [content];
  editorState.historyIndex = 0;
  editorState.lastSavedContent = content;
  editorState.isDirty = false;
  editorState.previewMode = false;
  editorState.activeTool = null;
  editorState.seo = {
    title: state.productDraft.seo_title || '',
    description: state.productDraft.seo_description || '',
    keywords: state.productDraft.seo_keywords || '',
    slug: state.productDraft.slug || '',
    canonical: state.productDraft.seo_canonical || '',
    robots: state.productDraft.seo_robots || 'index,follow',
    og_title: state.productDraft.og_title || '',
    og_description: state.productDraft.og_description || '',
    og_slug: state.productDraft.og_slug || '',
    twitter_title: state.productDraft.twitter_title || '',
    twitter_description: state.productDraft.twitter_description || '',
    redirect_old_url: state.productDraft.redirect_old_url || '',
    schema_json: state.productDraft.schema_json || ''
  };
  
  state.articleEditor = content; 
  state._prevEditProduct = state.editProduct || null; 
  state.editProduct = null; 
  state.currentScreen = "article-editor"; 
  render(); 
}
function initArticleEditor() { if (typeof state.articleEditor === "undefined") state.articleEditor = ""; }

// ---------- SEO Settings (پیشرفته) ----------
function updateSeoField(field, value) {
  const editorState = window.__articleEditor;
  if (!editorState.seo) editorState.seo = {};
  editorState.seo[field] = value;
  
  // به‌روزرسانی خودکار JSON-LD
  if (field === 'title' || field === 'description' || field === 'slug' || field === 'price') {
    generateSchemaJson();
  }
}

function generateSchemaJson() {
  const editorState = window.__articleEditor;
  if (!editorState.seo) return;
  
  const product = state.editProduct || {};
  const baseUrl = window.location.origin || 'https://example.com';
  const slug = editorState.seo.slug || product.slug || 'product';
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": editorState.seo.title || product.title || '',
    "description": editorState.seo.description || product.description || '',
    "url": `${baseUrl}/product/${slug}`,
    "sku": product.id || '',
    "brand": {
      "@type": "Brand",
      "name": config?.store_name || 'فروشگاه'
    },
    "offers": {
      "@type": "Offer",
      "price": product.price || 0,
      "priceCurrency": "IRR",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };
  
  editorState.seo.schema_json = JSON.stringify(schema, null, 2);
}

function saveSeoSettings() {
  const editorState = window.__articleEditor;
  if (editorState.seo) {
    state.productDraft.seo_title = editorState.seo.title;
    state.productDraft.seo_description = editorState.seo.description;
    state.productDraft.seo_keywords = editorState.seo.keywords;
    state.productDraft.slug = editorState.seo.slug;
    state.productDraft.seo_canonical = editorState.seo.canonical;
    state.productDraft.seo_robots = editorState.seo.robots;
    state.productDraft.og_title = editorState.seo.og_title;
    state.productDraft.og_description = editorState.seo.og_description;
    state.productDraft.og_slug = editorState.seo.og_slug;
    state.productDraft.twitter_title = editorState.seo.twitter_title;
    state.productDraft.twitter_description = editorState.seo.twitter_description;
    state.productDraft.redirect_old_url = editorState.seo.redirect_old_url;
    state.productDraft.schema_json = editorState.seo.schema_json;
    
    toast('✅ تنظیمات سئو ذخیره شد', 'success');
  }
}

// ---------- Editor styles ----------
(function injectEditorStyles() {
  if (document.getElementById('admin-product-editor-styles')) return;
  const css = `
    /* استایل انتخاب متن */
    ::selection {
      background: #3b82f6 !important;
      color: white !important;
    }
    ::-moz-selection {
      background: #3b82f6 !important;
      color: white !important;
    }
    
    /* نوار ابزار sticky مدرن */
    .article-toolbar-sticky {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(20, 25, 35, 0.95);
      backdrop-filter: blur(16px) saturate(180%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 12px 20px;
      margin-bottom: 24px;
      border-radius: 0;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }
    
    /* نوار ابزار اصلی */
    .article-toolbar { 
      display: flex; 
      gap: 10px; 
      align-items: center; 
      flex-wrap: nowrap; 
      overflow-x: auto; 
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch; 
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.3) transparent;
      padding: 4px 0;
    }
    
    .article-toolbar::-webkit-scrollbar {
      height: 8px;
      display: block;
    }
    .article-toolbar::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
    }
    .article-toolbar::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
      border-radius: 10px;
    }
    .article-toolbar::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.3);
    }
    
    .article-toolbar:not(:hover) {
      overflow-x: hidden;
    }
    
    .article-toolbar .tool-group { display: flex; gap: 6px; min-width: max-content; }
    .article-toolbar .tool-btn { 
      flex: 0 0 auto; 
      min-width: 44px; 
      height: 44px; 
      display: inline-flex; 
      align-items: center; 
      justify-content: center; 
      border-radius: 12px; 
      padding: 8px; 
      font-size: 18px;
      transition: all 0.2s ease;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.03);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }
    .article-toolbar .tool-btn:hover { 
      background: rgba(255, 255, 255, 0.12);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      border-color: rgba(255, 255, 255, 0.1);
    }
    .article-toolbar .tool-btn.active-tool { 
      background: linear-gradient(145deg, #1e40af, #2563eb);
      border-color: #93c5fd;
      box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.3);
      color: white;
    }
    
    /* باکس ویرایشگر سفید */
    .editor-white-box {
      background: white;
      color: #1a1a1a;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.08), 0 6px 12px rgba(0,0,0,0.05);
      border: 1px solid rgba(0,0,0,0.05);
    }
    .editor-white-box #article-editor-content {
      color: #1a1a1a;
      background: white;
      min-height: 500px;
      line-height: 1.8;
    }
    .editor-white-box blockquote {
      color: #333;
      border-right-color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
    }
    
    /* استایل نقل قول با آیکون */
    .custom-blockquote {
      position: relative;
      background: rgba(59, 130, 246, 0.05);
      border-right: 4px solid #3b82f6;
      padding: 20px 48px 20px 20px;
      margin: 20px 0;
      border-radius: 12px;
      font-style: italic;
      color: inherit;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .custom-blockquote::before {
      content: '"';
      position: absolute;
      right: 16px;
      top: 12px;
      font-size: 48px;
      color: #3b82f6;
      opacity: 0.2;
      font-family: serif;
      line-height: 1;
      font-weight: bold;
    }
    
    /* پیش‌نمایش */
    .preview-mode-active {
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
      color: white;
      padding: 6px 16px;
      border-radius: 30px;
      font-size: 13px;
      font-weight: 500;
      margin-right: 16px;
      box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
    }
    
    /* استایل‌های ریسپانسیو */
    @media (max-width: 768px) {
      .article-toolbar-sticky { padding: 8px 12px; }
      .article-toolbar .tool-btn { min-width: 40px; height: 40px; font-size: 16px; }
      .editor-white-box { padding: 16px; }
      .editor-white-box #article-editor-content { min-height: 350px; }
    }
    @media (max-width: 480px) {
      .article-toolbar .tool-btn { min-width: 36px; height: 36px; font-size: 15px; }
      .editor-white-box { padding: 12px; }
      .editor-white-box #article-editor-content { min-height: 300px; font-size: 14px; }
    }
  `;
  const style = document.createElement('style');
  style.id = 'admin-product-editor-styles';
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
})();

// ---------- Save handlers ----------
function saveArticleFromEditor() {
  const editor = document.getElementById("article-editor-content");
  const content = editor ? editor.innerHTML : (state.articleEditor || "");
  initProductDraft(); 
  state.productDraft.article = content;
  
  // ذخیره تنظیمات سئو
  const editorState = window.__articleEditor;
  if (editorState.seo) {
    state.productDraft.seo_title = editorState.seo.title;
    state.productDraft.seo_description = editorState.seo.description;
    state.productDraft.seo_keywords = editorState.seo.keywords;
    state.productDraft.slug = editorState.seo.slug;
    state.productDraft.seo_canonical = editorState.seo.canonical;
    state.productDraft.seo_robots = editorState.seo.robots;
    state.productDraft.og_title = editorState.seo.og_title;
    state.productDraft.og_description = editorState.seo.og_description;
    state.productDraft.og_slug = editorState.seo.og_slug;
    state.productDraft.twitter_title = editorState.seo.twitter_title;
    state.productDraft.twitter_description = editorState.seo.twitter_description;
    state.productDraft.redirect_old_url = editorState.seo.redirect_old_url;
    state.productDraft.schema_json = editorState.seo.schema_json;
  }
  
  editorState.lastSavedContent = content;
  editorState.isDirty = false;
  editorState.previewMode = false;
  editorState.activeTool = null;
  
  state.currentScreen = null; 
  state.editProduct = state._prevEditProduct || state.editProduct || {}; 
  state._prevEditProduct = null; 
  render(); 
}

function saveArticleOnly() {
  const editor = document.getElementById("article-editor-content");
  const content = editor ? editor.innerHTML : (state.articleEditor || "");
  initProductDraft(); 
  state.productDraft.article = content; 
  state.articleEditor = content;
  
  // ذخیره تنظیمات سئو
  const editorState = window.__articleEditor;
  if (editorState.seo) {
    state.productDraft.seo_title = editorState.seo.title;
    state.productDraft.seo_description = editorState.seo.description;
    state.productDraft.seo_keywords = editorState.seo.keywords;
    state.productDraft.slug = editorState.seo.slug;
    state.productDraft.seo_canonical = editorState.seo.canonical;
    state.productDraft.seo_robots = editorState.seo.robots;
    state.productDraft.og_title = editorState.seo.og_title;
    state.productDraft.og_description = editorState.seo.og_description;
    state.productDraft.og_slug = editorState.seo.og_slug;
    state.productDraft.twitter_title = editorState.seo.twitter_title;
    state.productDraft.twitter_description = editorState.seo.twitter_description;
    state.productDraft.redirect_old_url = editorState.seo.redirect_old_url;
    state.productDraft.schema_json = editorState.seo.schema_json;
  }
  
  editorState.lastSavedContent = content;
  editorState.isDirty = false;
  updateDirtyState(false);
  
  toast('✅ مقاله ذخیره شد', 'success'); 
  render();
}

// ---------- Toolbar helpers ----------
(function toolbarHelpers() {
  function normalizeToolbarIcons() {
    const toolbar = document.querySelector('.article-toolbar');
    if (!toolbar) return;
    try {
      toolbar.querySelectorAll('button, label').forEach(btn => {
        if (btn.querySelector('i') || btn.querySelector('.icon-fallback')) return;
        const title = (btn.getAttribute('title') || '').toLowerCase();
        const map = { 
          'bold':'ri-bold','italic':'ri-italic','underline':'ri-underline',
          'blockquote':'ri-double-quotes-l','link':'ri-link',
          'separator':'ri-separator','align left':'ri-align-left','align center':'ri-align-center',
          'align right':'ri-align-right','justify':'ri-align-justify','undo':'ri-arrow-go-back-line',
          'redo':'ri-arrow-go-forward-line', 'table':'ri-table-line',
          'preview':'ri-eye-line', 'font size':'ri-font-size', 
          'decrease':'ri-subtract-line', 'increase':'ri-add-line',
          'rtl':'ri-arrow-right-line', 'ltr':'ri-arrow-left-line'
        };
        for (const k in map) if (title.indexOf(k) !== -1) { 
          const i = document.createElement('i'); 
          i.className = map[k]; 
          btn.insertBefore(i, btn.firstChild); 
          break; 
        }
      });
    } catch (e) {}
    
    if (window.__applyIconFallback) window.__applyIconFallback();
  }
  setTimeout(normalizeToolbarIcons, 120);
  
  try {
    const obs = new MutationObserver(normalizeToolbarIcons);
    if (document.body) {
      obs.observe(document.body, { childList: true, subtree: true });
    }
  } catch (e) {}
})();

// ---------- Editor layout tweaks ----------
(function injectArticleLayoutStyles() {
  if (document.getElementById('admin-product-article-layout-styles')) return;
  const css = `
    .article-editor-wrapper { display:block; }
    .article-main-column { width:100%; }
    @media (min-width: 1024px) {
      .article-main-column { width:100%; }
    }
  `;
  const s = document.createElement('style'); 
  s.id = 'admin-product-article-layout-styles'; 
  s.appendChild(document.createTextNode(css)); 
  document.head.appendChild(s);
})();

// ---------- Render Article Editor (بدون عکس) ----------
function renderArticleEditor() {
  initArticleEditor();
  const content = state.articleEditor || "";
  const isDirty = window.__articleEditor ? window.__articleEditor.isDirty : false;
  const previewMode = window.__articleEditor ? window.__articleEditor.previewMode : false;
  const seo = window.__articleEditor ? window.__articleEditor.seo : { 
    title: '', description: '', keywords: '', slug: '',
    canonical: '', robots: 'index,follow',
    og_title: '', og_description: '', og_slug: '',
    twitter_title: '', twitter_description: '',
    redirect_old_url: '', schema_json: ''
  };

  return `
    <div class="p-4 lg:p-6 max-w-7xl mx-auto animate-fade">
      <!-- نوار ابزار sticky در هدر -->
      <div class="article-toolbar-sticky">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div class="flex items-center">
            <h2 class="text-lg sm:text-xl font-black">ویرایشگر مقاله محصول</h2>
            <span id="article-dirty-indicator" class="${isDirty ? 'text-amber-400' : 'text-emerald-400'} text-xs mr-2 whitespace-nowrap">
              ${isDirty ? '● ویرایش نشده' : '✓ ذخیره شده'}
            </span>
            ${previewMode ? '<span class="preview-mode-active">🔍 حالت پیش‌نمایش</span>' : ''}
          </div>
          <div class="flex gap-2 flex-wrap">
            <button class="btn-ghost px-3 py-2 rounded-lg text-sm flex items-center gap-1" type="button" onclick="undo()" title="بازگردانی">
              <i class="ri-arrow-go-back-line"></i> <span class="hidden sm:inline">بازگردانی</span>
            </button>
            <button class="btn-ghost px-3 py-2 rounded-lg text-sm flex items-center gap-1" type="button" onclick="redo()" title="جلو">
              <i class="ri-arrow-go-forward-line"></i> <span class="hidden sm:inline">جلو</span>
            </button>
            <button class="btn-ghost px-3 py-2 rounded-lg text-sm flex items-center gap-1" type="button" onclick="togglePreview()" title="پیش‌نمایش">
              <i class="ri-eye-line"></i> <span class="hidden sm:inline">پیش‌نمایش</span>
            </button>
            <button class="btn-ghost px-3 py-2 rounded-lg text-sm" type="button" onclick="saveArticleOnly()">ذخیره</button>
            <button class="btn-primary px-3 py-2 rounded-lg text-sm" type="button" onclick="saveArticleFromEditor()">ذخیره و بازگشت</button>
          </div>
        </div>

        <!-- نوار ابزار اصلی (بدون دکمه عکس) -->
        <div class="article-toolbar overflow-x-auto">
          <div class="tool-group flex gap-1 min-w-max" role="toolbar">
            <button class="btn-ghost tool-btn" type="button" onclick="applyTextFormat('bold')" title="Bold" data-cmd="bold"><i class="ri-bold"></i></button>
            <button class="btn-ghost tool-btn" type="button" onclick="applyTextFormat('italic')" title="Italic" data-cmd="italic"><i class="ri-italic"></i></button>
            <button class="btn-ghost tool-btn" type="button" onclick="applyTextFormat('underline')" title="Underline" data-cmd="underline"><i class="ri-underline"></i></button>

            <span class="w-px h-6 bg-white/10 mx-1"></span>

            <button class="btn-ghost tool-btn" type="button" onclick="setTextSize(24)" title="سایز بزرگ" data-cmd="size-large"><i class="ri-font-size"></i> +</button>
            <button class="btn-ghost tool-btn" type="button" onclick="setTextSize(18)" title="سایز متوسط" data-cmd="size-medium"><i class="ri-font-size"></i> =</button>
            <button class="btn-ghost tool-btn" type="button" onclick="setTextSize(14)" title="سایز کوچک" data-cmd="size-small"><i class="ri-font-size"></i> -</button>
            <button class="btn-ghost tool-btn" type="button" onclick="changeTextSize('increase')" title="افزایش سایز" data-cmd="size-increase"><i class="ri-add-line"></i></button>
            <button class="btn-ghost tool-btn" type="button" onclick="changeTextSize('decrease')" title="کاهش سایز" data-cmd="size-decrease"><i class="ri-subtract-line"></i></button>

            <span class="w-px h-6 bg-white/10 mx-1"></span>

            <button class="btn-ghost tool-btn" type="button" onclick="applyTextFormat('align-left')" title="Align left" data-cmd="align-left"><i class="ri-align-left"></i></button>
            <button class="btn-ghost tool-btn" type="button" onclick="applyTextFormat('align-center')" title="Align center" data-cmd="align-center"><i class="ri-align-center"></i></button>
            <button class="btn-ghost tool-btn" type="button" onclick="applyTextFormat('align-right')" title="Align right" data-cmd="align-right"><i class="ri-align-right"></i></button>
            <button class="btn-ghost tool-btn" type="button" onclick="applyTextFormat('align-justify')" title="Justify" data-cmd="align-justify"><i class="ri-align-justify"></i></button>

            <span class="w-px h-6 bg-white/10 mx-1"></span>

            <button class="btn-ghost tool-btn" type="button" onclick="applyTextFormat('blockquote')" title="Blockquote" data-cmd="blockquote"><i class="ri-double-quotes-l"></i></button>

            <button class="btn-ghost tool-btn" type="button" onclick="applyTextFormat('createLink')" title="Insert link" data-cmd="link"><i class="ri-link"></i></button>
            <button class="btn-ghost tool-btn" type="button" onclick="applyTextFormat('separator')" title="Separator" data-cmd="separator"><i class="ri-separator"></i></button>
            <button class="btn-ghost tool-btn" type="button" onclick="applyTextFormat('table')" title="Insert table" data-cmd="table"><i class="ri-table-line"></i></button>

            <span class="w-px h-6 bg-white/10 mx-1"></span>

            <button class="btn-ghost tool-btn" type="button" onclick="applyTextFormat('dir-rtl')" title="RTL" data-cmd="rtl"><i class="ri-arrow-right-line"></i></button>
            <button class="btn-ghost tool-btn" type="button" onclick="applyTextFormat('dir-ltr')" title="LTR" data-cmd="ltr"><i class="ri-arrow-left-line"></i></button>
          </div>
        </div>
      </div>

      <div class="article-editor-wrapper">
        <div class="glass rounded-xl mb-4 article-main-column">
          <div class="editor-white-box">
            ${previewMode ? `
              <div class="preview-mode">
                ${content}
              </div>
            ` : `
              <div 
                id="article-editor-content" 
                class="w-full min-h-[400px] sm:min-h-[520px] prose max-w-none text-sm outline-none" 
                contenteditable="true" 
                oninput="state.articleEditor = this.innerHTML; saveToHistory(this); scheduleAutoSave()" 
                onkeyup="updateActiveTool()"
                onmouseup="updateActiveTool()"
                onpaste="setTimeout(() => { updateEditorState(); saveToHistory(this); updateActiveTool(); }, 50)"
                spellcheck="true" 
                dir="rtl"
              >${content}</div>
            `}
          </div>
        </div>

        <!-- تنظیمات سئو پیشرفته -->
        <div class="glass rounded-xl p-5 mt-6">
          <h3 class="text-sm font-bold mb-3 flex items-center gap-2">
            <i class="ri-search-line text-lg"></i> تنظیمات پیشرفته سئو
          </h3>
          
          <div class="space-y-4">
            <!-- بخش ۱: اطلاعات اصلی -->
            <div class="glass p-4 rounded-lg">
              <h4 class="text-xs font-semibold text-white/70 mb-3">اطلاعات اصلی</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-white/70 mb-1">عنوان سئو (Title)</label>
                  <input type="text" class="input-style w-full text-sm" value="${escapeHtml(seo.title || '')}" placeholder="حداکثر ۶۰ کاراکتر" maxlength="60" oninput="updateSeoField('title', this.value)">
                  <p class="text-[10px] text-white/40 mt-1">${(seo.title || '').length}/60 کاراکتر</p>
                </div>
                <div>
                  <label class="block text-xs text-white/70 mb-1">توضیحات متا (Meta Description)</label>
                  <textarea class="input-style w-full text-sm" rows="2" placeholder="حداکثر ۱۶۰ کاراکتر" maxlength="160" oninput="updateSeoField('description', this.value)">${escapeHtml(seo.description || '')}</textarea>
                  <p class="text-[10px] text-white/40 mt-1">${(seo.description || '').length}/160 کاراکتر</p>
                </div>
                <div>
                  <label class="block text-xs text-white/70 mb-1">کلمات کلیدی (Keywords)</label>
                  <input type="text" class="input-style w-full text-sm" value="${escapeHtml(seo.keywords || '')}" placeholder="مثال: گوشی, موبایل, شیائومی" oninput="updateSeoField('keywords', this.value)">
                </div>
                <div>
                  <label class="block text-xs text-white/70 mb-1">آدرس یکتا (URL Slug)</label>
                  <input type="text" class="input-style w-full text-sm" value="${escapeHtml(seo.slug || '')}" placeholder="example-product" dir="ltr" oninput="updateSeoField('slug', this.value)">
                </div>
              </div>
            </div>

            <!-- بخش ۲: تنظیمات پیشرفته -->
            <div class="glass p-4 rounded-lg">
              <h4 class="text-xs font-semibold text-white/70 mb-3">تنظیمات پیشرفته</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-white/70 mb-1">آدرس کنونیکال (Canonical)</label>
                  <input type="url" class="input-style w-full text-sm" value="${escapeHtml(seo.canonical || '')}" placeholder="https://example.com/product" dir="ltr" oninput="updateSeoField('canonical', this.value)">
                </div>
                <div>
                  <label class="block text-xs text-white/70 mb-1">دستورالعمل روبات‌ها (Robots)</label>
                  <select class="input-style w-full text-sm" onchange="updateSeoField('robots', this.value)">
                    <option value="index,follow" ${seo.robots === 'index,follow' ? 'selected' : ''}>index, follow (پیش‌فرض)</option>
                    <option value="noindex,follow" ${seo.robots === 'noindex,follow' ? 'selected' : ''}>noindex, follow</option>
                    <option value="index,nofollow" ${seo.robots === 'index,nofollow' ? 'selected' : ''}>index, nofollow</option>
                    <option value="noindex,nofollow" ${seo.robots === 'noindex,nofollow' ? 'selected' : ''}>noindex, nofollow</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- بخش ۳: شبکه‌های اجتماعی -->
            <div class="glass p-4 rounded-lg">
              <h4 class="text-xs font-semibold text-white/70 mb-3">شبکه‌های اجتماعی</h4>
              
              <div class="mb-3">
                <h5 class="text-xs text-white/60 mb-2">Open Graph (فیسبوک، لینکدین)</h5>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-xs text-white/70 mb-1">عنوان OG</label>
                    <input type="text" class="input-style w-full text-sm" value="${escapeHtml(seo.og_title || '')}" placeholder="عنوان اختصاصی" oninput="updateSeoField('og_title', this.value)">
                  </div>
                  <div>
                    <label class="block text-xs text-white/70 mb-1">توضیحات OG</label>
                    <input type="text" class="input-style w-full text-sm" value="${escapeHtml(seo.og_description || '')}" placeholder="توضیحات اختصاصی" oninput="updateSeoField('og_description', this.value)">
                  </div>
                  <div>
                    <label class="block text-xs text-white/70 mb-1">اسلاگ OG</label>
                    <input type="text" class="input-style w-full text-sm" value="${escapeHtml(seo.og_slug || '')}" placeholder="آدرس اختصاصی" dir="ltr" oninput="updateSeoField('og_slug', this.value)">
                  </div>
                </div>
              </div>

              <div>
                <h5 class="text-xs text-white/60 mb-2">Twitter Card</h5>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs text-white/70 mb-1">عنوان توییتر</label>
                    <input type="text" class="input-style w-full text-sm" value="${escapeHtml(seo.twitter_title || '')}" placeholder="عنوان اختصاصی" oninput="updateSeoField('twitter_title', this.value)">
                  </div>
                  <div>
                    <label class="block text-xs text-white/70 mb-1">توضیحات توییتر</label>
                    <input type="text" class="input-style w-full text-sm" value="${escapeHtml(seo.twitter_description || '')}" placeholder="توضیحات اختصاصی" oninput="updateSeoField('twitter_description', this.value)">
                  </div>
                </div>
              </div>
            </div>

            <!-- بخش ۴: ریدایرکت و اسکیما -->
            <div class="glass p-4 rounded-lg">
              <h4 class="text-xs font-semibold text-white/70 mb-3">ریدایرکت و اسکیما</h4>
              <div class="grid grid-cols-1 gap-3">
                <div>
                  <label class="block text-xs text-white/70 mb-1">ریدایرکت ۳۰۱ (آدرس قدیمی)</label>
                  <input type="url" class="input-style w-full text-sm" value="${escapeHtml(seo.redirect_old_url || '')}" placeholder="/old-product" dir="ltr" oninput="updateSeoField('redirect_old_url', this.value)">
                  <p class="text-[10px] text-white/40 mt-1">آدرس قدیمی به این آدرس جدید هدایت می‌شود</p>
                </div>
                <div>
                  <label class="block text-xs text-white/70 mb-1">اسکیمای JSON-LD (تولید خودکار)</label>
                  <textarea class="input-style w-full text-sm" rows="3" readonly placeholder="اسکیما به صورت خودکار تولید می‌شود">${escapeHtml(seo.schema_json || '')}</textarea>
                  <button class="btn-ghost text-xs px-3 py-1 rounded-lg mt-1" onclick="generateSchemaJson()">تولید مجدد اسکیما</button>
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button class="btn-primary px-6 py-3 rounded-xl text-sm font-semibold" onclick="saveSeoSettings()">ذخیره تنظیمات سئو</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    ${renderAdminVideoPreviewModal()}
  `;
}

// ---------- Attach controls after render ----------
(function ensureAttachAfterRender() {
  try {
    const obs = new MutationObserver(() => {
      const editor = document.getElementById('article-editor-content');
      if (editor && window.__articleEditor && !window.__articleEditor.previewMode) { 
        if (window.__applyIconFallback) window.__applyIconFallback(editor); 
        updateActiveTool();
      }
    });
    if (document.body) {
      obs.observe(document.body, { childList: true, subtree: true });
    }
  } catch (e) {}
})();

// ---------- Update editor state ----------
function updateEditorState() { 
  const editor = document.getElementById("article-editor-content"); 
  if (!editor) return; 
  state.articleEditor = editor.innerHTML; 
}

// ========== EXPOSE FUNCTIONS GLOBALLY ==========
window.undo = undo;
window.redo = redo;
window.togglePreview = togglePreview;
window.saveToHistory = saveToHistory;
window.scheduleAutoSave = scheduleAutoSave;
window.openTableModal = openTableModal;
window.openLinkModal = openLinkModal;
window.applyTextFormat = applyTextFormat;
window.openArticleEditor = openArticleEditor;
window.renderArticleEditor = renderArticleEditor;
window.updateEditorState = updateEditorState;
window.saveArticleOnly = saveArticleOnly;
window.saveArticleFromEditor = saveArticleFromEditor;
window.updateActiveTool = updateActiveTool;
window.changeTextSize = changeTextSize;
window.setTextSize = setTextSize;
window.insertSeparator = insertSeparator;
window.updateSeoField = updateSeoField;
window.saveSeoSettings = saveSeoSettings;
window.generateSchemaJson = generateSchemaJson;
window.openVideoPlayer = openVideoPlayer;
window.closeVideoPlayer = closeVideoPlayer;
window.handleMainImageFiles = handleMainImageFiles;
window.handleGalleryFiles = handleGalleryFiles;
window.removeGalleryItem = removeGalleryItem;
window.renderProductModalOnly = renderProductModalOnly;
window.confirmDeleteProduct = confirmDeleteProduct;
window.confirmDeleteProductFromModal = confirmDeleteProductFromModal;
window.clearProductDraft = clearProductDraft;
window.setProductFilterCategory = setProductFilterCategory;
window.renderAdminProductsEditor = renderAdminProductsEditor;
window.renderProductModal = renderProductModal;

// ---------- End of file ----------

// ═══════════════════════════════════════════════════════════════
// DATABASE EXPORT PANEL
// ═══════════════════════════════════════════════════════════════

function showDbExportPanel() {
  state.confirmModal = {
    type: 'db-export',
    title: '🗄️ مدیریت دیتابیس',
    icon: '🗄️',
    message: `
      <div class="space-y-4 text-sm">
        <p class="text-white/70">داده‌های فروشگاه را به فرمت‌های مختلف دریافت کنید:</p>

        <div class="grid grid-cols-2 gap-3">
          <button type="button" onclick="downloadDbSQL()" 
            class="glass rounded-xl p-4 hover:bg-white/10 transition-colors text-center">
            <div class="text-2xl mb-2">🗃️</div>
            <div class="font-semibold">دانلود SQL</div>
            <div class="text-xs text-white/50 mt-1">قابل import در phpMyAdmin</div>
          </button>
          <button type="button" onclick="downloadDbJSON()"
            class="glass rounded-xl p-4 hover:bg-white/10 transition-colors text-center">
            <div class="text-2xl mb-2">📋</div>
            <div class="font-semibold">دانلود JSON</div>
            <div class="text-xs text-white/50 mt-1">فرمت استاندارد</div>
          </button>
        </div>

        <div class="glass rounded-xl p-4">
          <div class="font-semibold mb-3">📊 آمار دیتابیس:</div>
          <div id="db-stats-container" class="space-y-2">
            <div class="text-white/50 text-xs animate-pulse">در حال بارگذاری...</div>
          </div>
        </div>

        <div class="glass rounded-xl p-4 bg-blue-500/10 border border-blue-500/20">
          <div class="font-semibold text-blue-300 mb-2">🔗 وضعیت سرور و دیتابیس</div>
          <div id="sys-status-box" class="text-xs text-white/60">در حال دریافت...</div>
          <p class="text-[11px] text-white/40 mt-2 leading-relaxed">
            اتصال از طریق ویزارد نصب صفحه اصلی انجام می‌شود (MySQL/MariaDB، PostgreSQL، SQLite، SQL Server)
            و پشتیبانی از پنل‌های cPanel/DirectAdmin/Plesk برای ساخت خودکار دیتابیس.
            نمونه تنظیمات دستی: <code class="text-blue-300">config.sample.php</code>
          </p>
        </div>

        <div class="glass rounded-xl p-4 bg-emerald-500/10 border border-emerald-500/20">
          <div class="font-semibold text-emerald-300 mb-2">📥 آموزش phpMyAdmin</div>
          <ol class="text-xs text-white/60 space-y-1 list-decimal list-inside">
            <li>فایل SQL را دانلود کنید</li>
            <li>وارد phpMyAdmin شوید</li>
            <li>یک دیتابیس جدید بسازید</li>
            <li>تب Import را بزنید</li>
            <li>فایل SQL را آپلود کنید</li>
          </ol>
        </div>
      </div>
    `,
    confirmText: 'بستن',
    confirmClass: 'btn-ghost',
    onConfirm: () => { state.confirmModal = null; render(); }
  };
  render();

  // وضعیت سرور (php -m، درایور، نسخه) از اکشن system_status
  setTimeout(async () => {
    const box = document.getElementById('sys-status-box');
    if (!box) return;
    if (!(window.AryaServer && AryaServer.isConfigured())) { box.innerHTML = 'حالت محلی (بدون سرور) — داده‌ها فقط در مرورگر این مرورگر ذخیره می‌شوند.'; return; }
    try {
      const j = await adminApiCall('system_status', {});
      if (j.ok && j.data) {
        const d = j.data;
        const ext = Object.entries(d.extensions || {}).map(([k, v]) => `<span class="${v ? 'text-emerald-400' : 'text-rose-400'}">${k}:${v ? '✓' : '✗'}</span>`).join(' · ');
        box.innerHTML = `موتور فعال: <b class="text-white/85">${escapeHtml(String(d.label || d.driver))}</b> · نسخه: ${escapeHtml(String(d.server_version || '?'))}<br>PHP ${escapeHtml(String(d.php || '?'))} — ${ext}` +
          (d.demo_mode ? '<br><span class="text-amber-300">⚠️ DEMO_MODE روشن است — کدهای OTP در پاسخ API برمی‌گردند؛ پیش از انتشار غیرفعالش کنید.</span>' : '');
      } else box.textContent = 'دریافت وضعیت ناموفق بود.';
    } catch (e) { box.textContent = 'دریافت وضعیت ناموفق بود.'; }
  }, 120);

  // Load DB stats after render
  setTimeout(async () => {
    const container = document.getElementById('db-stats-container');
    if (!container) return;
    try {
      if (window.AryaDB) {
        await AryaDB.syncState();
        const stats = await AryaDB.getStats();
        const icons = { products:'📦', orders:'🛒', users:'👥', categories:'🗂️', tickets:'💬', reviews:'⭐', admins:'⚙️', settings:'⚙️' };
        const labels = { products:'محصولات', orders:'سفارشات', users:'کاربران', categories:'دسته‌بندی‌ها', tickets:'تیکت‌ها', reviews:'نظرات', admins:'مدیران', settings:'تنظیمات' };
        container.innerHTML = Object.entries(stats).filter(([k]) => k !== 'settings').map(([k,v]) => `
          <div class="flex items-center justify-between text-xs">
            <span class="flex items-center gap-2"><span>${icons[k]||'•'}</span><span>${labels[k]||k}</span></span>
            <span class="font-bold text-blue-400">${v} رکورد</span>
          </div>
        `).join('');
      } else {
        const statMap = {
          products: (state.products||[]).length,
          orders: (state.orders||[]).length,
          users: (() => { try { return JSON.parse(localStorage.getItem('arya_users_v1')||'[]').length; } catch { return 0; } })(),
          categories: (state.categories||[]).length,
          tickets: (state.tickets||[]).length,
          reviews: (state.reviews||[]).length,
        };
        container.innerHTML = Object.entries(statMap).map(([k,v]) => `
          <div class="flex items-center justify-between text-xs">
            <span>${k}</span><span class="font-bold text-blue-400">${v}</span>
          </div>
        `).join('');
      }
    } catch(e) {
      if (container) container.innerHTML = '<p class="text-xs text-white/50">خطا در بارگذاری آمار</p>';
    }
  }, 200);
}

async function downloadDbSQL() {
  toast('در حال آماده‌سازی فایل SQL...', 'info');
  try {
    let sql;
    if (window.AryaDB) {
      await AryaDB.syncState();
      sql = await AryaDB.exportToSQL();
    } else {
      sql = _generateBasicSQL();
    }
    const blob = new Blob([sql], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arya_store_' + new Date().toISOString().slice(0,10) + '.sql';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('✅ فایل SQL دانلود شد');
  } catch(e) {
    toast('خطا: ' + e.message, 'error');
  }
}

async function downloadDbJSON() {
  toast('در حال آماده‌سازی فایل JSON...', 'info');
  try {
    let data;
    if (window.AryaDB) {
      await AryaDB.syncState();
      data = await AryaDB.exportToJSON();
    } else {
      data = JSON.stringify({
        products: state.products || [],
        orders: state.orders || [],
        categories: state.categories || [],
        tickets: state.tickets || [],
        reviews: state.reviews || [],
        users: (() => { try { return JSON.parse(localStorage.getItem('arya_users_v1')||'[]').map(u => { const c={...u}; delete c.passwordHash; return c; }); } catch { return []; } })(),
      }, null, 2);
    }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arya_store_' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('✅ فایل JSON دانلود شد');
  } catch(e) {
    toast('خطا: ' + e.message, 'error');
  }
}

function _generateBasicSQL() {
  const esc = v => v == null ? 'NULL' : `'${String(v).replace(/\\/g,'\\\\').replace(/'/g,"''").replace(/\n/g,'\\n')}'`;
  let sql = `-- AryaStore Export\n-- ${new Date().toISOString()}\nSET NAMES utf8mb4;\n\n`;

  // Products
  sql += `CREATE TABLE IF NOT EXISTS \`products\` (\n  \`id\` VARCHAR(64) PRIMARY KEY,\n  \`title\` VARCHAR(500),\n  \`price\` DECIMAL(18,0),\n  \`stock\` INT,\n  \`category\` VARCHAR(64),\n  \`description\` TEXT,\n  \`image\` TEXT,\n  \`article\` LONGTEXT,\n  \`created_at\` DATETIME\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  const prods = state.products || [];
  if (prods.length) {
    sql += `INSERT INTO \`products\` (\`id\`,\`title\`,\`price\`,\`stock\`,\`category\`,\`description\`,\`image\`,\`created_at\`) VALUES\n`;
    sql += prods.map(p => `(${esc(p.id)},${esc(p.title)},${esc(p.price)},${esc(p.stock)},${esc(p.category)},${esc(p.description)},${esc(p.image||p.main_image)},${esc(p.created_at)})`).join(',\n') + ';\n\n';
  }

  // Orders
  sql += `CREATE TABLE IF NOT EXISTS \`orders\` (\n  \`id\` VARCHAR(64) PRIMARY KEY,\n  \`user_name\` VARCHAR(255),\n  \`user_phone\` VARCHAR(20),\n  \`address\` TEXT,\n  \`items\` LONGTEXT,\n  \`total\` DECIMAL(18,0),\n  \`status\` VARCHAR(50),\n  \`created_at\` DATETIME\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  const ords = state.orders || [];
  if (ords.length) {
    sql += `INSERT INTO \`orders\` (\`id\`,\`user_name\`,\`user_phone\`,\`address\`,\`items\`,\`total\`,\`status\`,\`created_at\`) VALUES\n`;
    sql += ords.map(o => `(${esc(o.id)},${esc(o.user_name)},${esc(o.user_phone)},${esc(o.address)},${esc(JSON.stringify(o.items||[]))},${esc(o.total)},${esc(o.status)},${esc(o.created_at)})`).join(',\n') + ';\n\n';
  }

  return sql;
}

window.showDbExportPanel = showDbExportPanel;
window.downloadDbSQL = downloadDbSQL;
window.downloadDbJSON = downloadDbJSON;

// ═══════════════════════════════════════════════════════════════
// مدیریت کاربران مدیر (جایگزین ثبت‌نام عمومی حذف‌شده)
// این بخش با Db.php (اکشن‌های admin_list/admin_create/admin_update/admin_delete)
// در ارتباط است. فقط مدیرِ از قبل واردشده می‌تواند حساب مدیر جدید بسازد؛
// هیچ فرم ثبت‌نام عمومی‌ای در سایت وجود ندارد.
// ═══════════════════════════════════════════════════════════════

// ── فراخوان امن Db.php با CSRF (توکن از admin.html / AryaServer) ──
/* ========== همگام‌سازی زندهٔ پنل (تیکت‌ها و سفارش‌ها هر ۳۰ ثانیه) ========== */
(async function () {
  async function pull() {
    try {
      if (!window.AryaServer || !AryaServer.isConfigured || !AryaServer.isConfigured()) return;
      const ae = document.activeElement;
      if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;         // وسط تایپ رفرش نکن
      if (window.state && (state.editProduct || state.confirmModal || state.categoryModal)) return; // وسط فرم/مودال نه
      const results = await Promise.all([
        AryaServer.crud.getAll('tickets', {}),
        AryaServer.crud.getAll('orders', {})
      ]);
      let changed = false;
      const t = results[0], o = results[1];
      if (t && t.ok && Array.isArray(t.data)) {
        const rows = t.data.map(x => { if (typeof x.messages === 'string') { try { x.messages = JSON.parse(x.messages); } catch (e) { x.messages = []; } } return x; })
          .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
        const sig = JSON.stringify(rows);
        if (sig !== (window.__aryTicketsSig || '')) { window.__aryTicketsSig = sig; state.tickets = rows; changed = true; }
      }
      if (o && o.ok && Array.isArray(o.data)) {
        const rows = o.data.map(x => { if (typeof x.items === 'string') { try { x.items = JSON.parse(x.items); } catch (e) { x.items = []; } } return x; })
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        const sig = JSON.stringify(rows);
        if (sig !== (window.__aryOrdersSig || '')) { window.__aryOrdersSig = sig; state.orders = rows; changed = true; }
      }
      if (changed && typeof render === 'function') render();
      return changed;
    } catch (e) { return false; }
  }
  setInterval(pull, 30000);
  window.aryAdminLiveSync = pull;
  window.aryAdminRefreshNow = function (btn) {
    if (btn) { btn.disabled = true; btn.style.opacity = '.55'; }
    Promise.resolve(pull()).then(function () {
      if (btn) { btn.disabled = false; btn.style.opacity = ''; }
      if (window.toast) toast('اطلاعات از سرور تازه شد', 'info');
    });
  };
})();

async function adminApiCall(action, body) {
  if (window.aryaAdminCall) return window.aryaAdminCall(action, body);
  const isGet = body === null || body === undefined;
  const headers = isGet ? {} : { 'Content-Type': 'application/json' };
  if (!isGet && window.ARYA_CSRF) headers['X-CSRF-Token'] = ARYA_CSRF;
  let res;
  try {
    res = await fetch('Db.php?action=' + action, {
      method: isGet ? 'GET' : 'POST', credentials: 'same-origin', headers,
      body: isGet ? undefined : JSON.stringify(body),
    });
  } catch (e) { return { ok: false, msg: 'ارتباط با سرور برقرار نشد' }; }
  let json;
  try { json = await res.json(); } catch (e) { return { ok: false, msg: 'پاسخ نامعتبر سرور' }; }
  if (json.ok && json.data && json.data.csrf) window.ARYA_CSRF = json.data.csrf;
  if (!json.ok && res.status === 403 && /CSRF/.test(String(json.msg || ''))) {
    try {
      const c = await fetch('Db.php?action=csrf', { credentials: 'same-origin' }).then(r => r.json());
      if (c && c.ok && c.data && c.data.csrf) {
        window.ARYA_CSRF = c.data.csrf;
        headers['X-CSRF-Token'] = ARYA_CSRF;
        res = await fetch('Db.php?action=' + action, { method: 'POST', credentials: 'same-origin', headers, body: JSON.stringify(body) });
        json = await res.json();
      }
    } catch (e) {}
  }
  json._status = res.status;
  return json;
}

state.adminUsersList = state.adminUsersList || [];
state.adminUsersLoading = state.adminUsersLoading || false;
state.adminUserFormOpen = state.adminUserFormOpen || false;

async function loadAdminUsersList() {
  state.adminUsersLoading = true;
  render();
  try {
    const json = await adminApiCall('admin_list', null);
    if (json.ok) {
      state.adminUsersList = json.data || [];
    } else {
      toast(json.msg || 'خطا در دریافت لیست کاربران مدیر', 'error');
    }
  } catch (e) {
    toast('ارتباط با سرور برقرار نشد', 'error');
  }
  state.adminUsersLoading = false;
  render();
}

function renderAdminUsersManagement() {
  if (!state._adminUsersLoaded) {
    state._adminUsersLoaded = true;
    loadAdminUsersList();
  }

  const list = state.adminUsersList || [];

  return `
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <h1 class="text-2xl font-black">کاربران مدیر</h1>
      <div class="flex gap-2">
        <button onclick="loadAdminUsersList()" type="button" class="btn-ghost px-4 py-2.5 rounded-xl text-sm">🔄 بروزرسانی</button>
        <button onclick="state.adminUserFormOpen = !state.adminUserFormOpen; render()" type="button" class="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold">
          ${state.adminUserFormOpen ? 'بستن فرم' : '+ حساب مدیر جدید'}
        </button>
      </div>
    </div>

    <div class="glass rounded-xl p-3 mb-5 text-xs text-white/50">
      ℹ️ حساب‌های مدیر فقط از همین بخش (یا مستقیماً از phpMyAdmin) قابل ایجاد هستند.
      هیچ فرم ثبت‌نام عمومی‌ای در سایت وجود ندارد.
    </div>

    ${state.adminUserFormOpen ? `
      <div class="glass rounded-2xl p-5 mb-6">
        <form onsubmit="submitNewAdminUser(event)" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label class="block text-white/70 mb-1">نام</label>
            <input name="name" class="input-style w-full" required>
          </div>
          <div>
            <label class="block text-white/70 mb-1">ایمیل</label>
            <input name="email" type="email" class="input-style w-full" dir="ltr" required>
          </div>
          <div>
            <label class="block text-white/70 mb-1">شماره موبایل</label>
            <input name="phone" class="input-style w-full" dir="ltr" placeholder="09123456789">
          </div>
          <div>
            <label class="block text-white/70 mb-1">رمز عبور (حداقل ۸ کاراکتر)</label>
            <input name="password" type="password" class="input-style w-full" required minlength="8">
          </div>
          <div class="md:col-span-2">
            <label class="block text-white/70 mb-1">رمز دومرحله‌ای (اختیاری — اگر خالی بماند، غیرفعال است)</label>
            <input name="two_factor_password" type="password" class="input-style w-full" placeholder="خالی = بدون تایید دومرحله‌ای">
          </div>
          <div class="md:col-span-2 flex gap-3">
            <button type="submit" class="btn-primary px-6 py-3 rounded-xl font-bold">ایجاد حساب</button>
          </div>
        </form>
      </div>
    ` : ''}

    <div class="glass rounded-2xl overflow-x-auto">
      ${state.adminUsersLoading ? `
        <div class="p-10 text-center text-white/50">در حال بارگذاری...</div>
      ` : list.length === 0 ? `
        <div class="p-10 text-center text-white/50">حساب مدیری یافت نشد.</div>
      ` : `
        <table class="w-full text-sm">
          <thead>
            <tr class="text-white/50 text-right border-b border-white/10">
              <th class="p-3">نام</th><th class="p-3">ایمیل</th><th class="p-3">موبایل</th>
              <th class="p-3">نقش</th><th class="p-3">دومرحله‌ای</th><th class="p-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(u => `
              <tr class="border-b border-white/5 hover:bg-white/5">
                <td class="p-3">${escapeHtml(u.name || '')}</td>
                <td class="p-3 text-white/60">${u.email || ''}</td>
                <td class="p-3 text-white/60">${u.phone || '-'}</td>
                <td class="p-3">${u.role === 'superadmin' ? '👑 مدیر اصلی' : 'مدیر'}</td>
                <td class="p-3">${Number(u.two_factor_enabled) === 1 ? '✅ فعال' : '—'}</td>
                <td class="p-3">
                  <div class="flex gap-2">
                    <button onclick="openEditAdminUserModal('${u.id}')" type="button" class="btn-ghost px-3 py-1.5 rounded-lg text-xs">ویرایش</button>
                    <button onclick="deleteAdminUserConfirm('${u.id}', '${escapeJs(u.name || '')}')" type="button" class="btn-ghost text-rose-400 px-3 py-1.5 rounded-lg text-xs">حذف</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </div>
  `;
}

async function submitNewAdminUser(event) {
  event.preventDefault();
  const f = event.target;
  const payload = {
    name: f.name.value.trim(),
    email: f.email.value.trim(),
    phone: f.phone.value.trim(),
    password: f.password.value,
    two_factor_password: f.two_factor_password.value
  };

  try {
    const json = await adminApiCall('admin_create', payload);
    if (!json.ok) { toast(json.msg || 'ایجاد حساب ناموفق بود', 'error'); return; }
    toast('✅ حساب مدیر جدید ایجاد شد');
    state.adminUserFormOpen = false;
    loadAdminUsersList();
  } catch (e) {
    toast('ارتباط با سرور برقرار نشد', 'error');
  }
}

function openEditAdminUserModal(id) {
  const u = (state.adminUsersList || []).find(x => x.id === id);
  if (!u) return;

  state.confirmModal = {
    title: 'ویرایش حساب مدیر',
    icon: '✏️',
    message: `
      <div class="space-y-3 text-right text-sm">
        <div>
          <label class="block text-white/60 mb-1 text-xs">نام</label>
          <input id="edit-admin-name" class="input-style w-full" value="${escapeHtml(u.name || '')}">
        </div>
        <div>
          <label class="block text-white/60 mb-1 text-xs">شماره موبایل</label>
          <input id="edit-admin-phone" class="input-style w-full" dir="ltr" value="${escapeHtml(u.phone || '')}">
        </div>
        <div>
          <label class="block text-white/60 mb-1 text-xs">رمز عبور جدید (اختیاری)</label>
          <input id="edit-admin-password" type="password" class="input-style w-full" placeholder="خالی = بدون تغییر">
        </div>
        <div>
          <label class="block text-white/60 mb-1 text-xs">رمز دومرحله‌ای (خالی = غیرفعال کردن)</label>
          <input id="edit-admin-2fa" type="password" class="input-style w-full" placeholder="خالی بگذارید یا مقدار جدید">
        </div>
      </div>
    `,
    confirmText: 'ذخیره',
    confirmClass: 'btn-primary',
    onConfirm: () => saveEditedAdminUser(id)
  };
  render();
}

async function saveEditedAdminUser(id) {
  const nameEl = document.getElementById('edit-admin-name');
  const phoneEl = document.getElementById('edit-admin-phone');
  const passEl = document.getElementById('edit-admin-password');
  const tfaEl = document.getElementById('edit-admin-2fa');

  const payload = { id };
  if (nameEl && nameEl.value.trim()) payload.name = nameEl.value.trim();
  if (phoneEl && phoneEl.value.trim()) payload.phone = phoneEl.value.trim();
  if (passEl && passEl.value) payload.password = passEl.value;
  if (tfaEl) payload.two_factor_password = tfaEl.value || '';

  try {
    const json = await adminApiCall('admin_update', payload);
    state.confirmModal = null;
    if (!json.ok) { toast(json.msg || 'ویرایش ناموفق بود', 'error'); render(); return; }
    toast('✅ حساب بروزرسانی شد');
    loadAdminUsersList();
  } catch (e) {
    state.confirmModal = null;
    toast('ارتباط با سرور برقرار نشد', 'error');
    render();
  }
}

function deleteAdminUserConfirm(id, name) {
  state.confirmModal = {
    title: 'حذف حساب مدیر',
    icon: '🗑️',
    message: `آیا از حذف حساب «${escapeHtml(name)}» مطمئن هستید؟`,
    confirmText: 'حذف',
    confirmClass: 'btn-danger',
    onConfirm: async () => {
      try {
        const json = await adminApiCall('admin_delete', { id });
        state.confirmModal = null;
        if (!json.ok) { toast(json.msg || 'حذف ناموفق بود', 'error'); render(); return; }
        toast('حساب حذف شد');
        loadAdminUsersList();
      } catch (e) {
        state.confirmModal = null;
        toast('ارتباط با سرور برقرار نشد', 'error');
        render();
      }
    }
  };
  render();
}

window.loadAdminUsersList = loadAdminUsersList;
window.renderAdminUsersManagement = renderAdminUsersManagement;
window.submitNewAdminUser = submitNewAdminUser;
window.openEditAdminUserModal = openEditAdminUserModal;
window.saveEditedAdminUser = saveEditedAdminUser;
window.deleteAdminUserConfirm = deleteAdminUserConfirm;
// ═══════════════════════════════════════════════════════════════
// امنیت: قفل خودکار پنل در حالت بی‌کاری (Idle Lock)
// ═══════════════════════════════════════════════════════════════
(function aryAdminIdleLock() {
  const LIMIT = 15 * 60 * 1000;      // ۱۵ دقیقه بی‌کاری → خروج
  const WARN = LIMIT - 60 * 1000;    // ۱ دقیقه مانده → هشدار
  let last = Date.now(), warned = false;
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'pointerdown'].forEach(ev => {
    window.addEventListener(ev, function bump() {
      last = Date.now(); warned = false;
    }, { passive: true });
  });
  // بازگشت تب فعال — تایمرهای مرورگرهای بک‌گراند محدودند، پس فعال‌سازی دوباره لازم است
  document.addEventListener('visibilitychange', () => { if (!document.hidden) last = Date.now(); });
  setInterval(function () {
    if (!(window.state && state.isAdmin)) return;
    const idle = Date.now() - last;
    if (idle >= LIMIT) {
      last = Date.now(); // جلوگیری از اجرای دوباره پیش از رفتن صفحه
      if (typeof window.adminLogout === 'function') { try { window.adminLogout(); return; } catch (e) {} }
      try { if (window.AryaServer) AryaServer.call('admin_logout', { method: 'POST' }).catch(() => {}); } catch (e) {}
      location.reload();
    } else if (idle >= WARN && !warned) {
      warned = true;
      if (window.toast) toast('در صورت ادامه بی‌کاری، تا ۱ دقیقه دیگر به‌دلیل امنیت از پنل خارج می‌شوید', 'warning');
    }
  }, 15 * 1000);
})();
