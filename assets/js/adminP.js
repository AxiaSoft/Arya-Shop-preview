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
          <p class="text-lg sm:text-xl xl:text-[1.6rem] font-black leading-8 truncate tabular-nums" style="font-feature-settings:'tnum'">${value}</p>
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
  const W = 320, H = 118, pad = 8;
  const fa = k => { try { return new Date(k).toLocaleDateString('fa-IR', { day: 'numeric', month: 'long' }); } catch (e) { return k; } };
  const x = i => pad + (i / Math.max(days.length - 1, 1)) * (W - pad * 2);
  const y = v => H - pad - 14 - (v / max) * (H - pad * 2 - 16);
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(values.length - 1).toFixed(1)} ${H - pad - 14} L${x(0).toFixed(1)} ${H - pad - 14} Z`;
  const gridY = [0.5, 1].map(f => `<line x1="${pad}" x2="${W - pad}" y1="${(H - pad - 14 - f * (H - pad * 2 - 16)).toFixed(1)}" y2="${(H - pad - 14 - f * (H - pad * 2 - 16)).toFixed(1)}" stroke="rgba(255,255,255,.06)" stroke-width=".5"/>`).join('');
  const pts = values.map((v, i) => {
    const showNum = v > 0 && (i === values.length - 1 || v === max || i % 7 === 0);
    return `<g class="ary-cx-col" tabindex="0" role="button" aria-label="${fa(days[i])} — ${fmt(v)}" onclick="aryChartDrill('day','${days[i]}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();aryChartDrill('day','${days[i]}')}">
      <line class="gl" x1="${x(i).toFixed(1)}" x2="${x(i).toFixed(1)}" y1="${pad}" y2="${H - pad - 14}" stroke="rgba(255,255,255,.22)" stroke-width=".6" stroke-dasharray="2 3"/>
      <circle class="dot" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${v === max ? 3.4 : 2.4}" fill="#fff" stroke="${c1}" stroke-width="1.2"/>
      ${showNum ? `<text x="${x(i).toFixed(1)}" y="${(y(v) - 7).toFixed(1)}" text-anchor="middle" class="num" style="font-size:6.4px;font-weight:800;fill:${c1}">${utils.formatPriceShort(v)}</text>` : ''}
      <g class="tip" transform="translate(${Math.max(46, Math.min(W - 46, x(i))).toFixed(1)}, ${Math.max(13, y(v) - 14).toFixed(1)})">
        <rect x="-44" y="-13" width="88" height="19" rx="4" fill="rgba(6,14,32,.94)" stroke="rgba(148,187,255,.28)" stroke-width=".5"/>
        <text x="0" y=".5" text-anchor="middle" style="font-size:6.6px;font-weight:800;fill:#fff">${fa(days[i])} · ${fmt(v)}</text>
      </g>
      <rect x="${(x(i) - (W - pad * 2) / Math.max(days.length - 1, 1) / 2).toFixed(1)}" y="0" width="${((W - pad * 2) / Math.max(days.length - 1, 1)).toFixed(1)}" height="${H - 14}" fill="transparent"/>
    </g>`;
  }).join('');
  return `
    <svg viewBox="0 0 ${W} ${H}" class="w-full" style="aspect-ratio:${W}/${H}" dir="ltr" role="img" aria-label="نمودار فروش روزانه">
      <defs>
        <linearGradient id="${gradId}" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="${c1}" stop-opacity=".42"/>
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
      <line x1="${pad}" x2="${W - pad}" y1="${H - pad - 14}" y2="${H - pad - 14}" stroke="rgba(255,255,255,.12)" stroke-width=".6"/>
      <text x="${pad}" y="${H - 3}" style="font-size:5.8px;fill:rgba(255,255,255,.4)">${days[0] ? days[0].slice(5) : ''}</text>
      <text x="${W / 2}" y="${H - 3}" text-anchor="middle" style="font-size:5.8px;fill:rgba(255,255,255,.4)">${days[Math.floor(days.length / 2)] ? days[Math.floor(days.length / 2)].slice(5) : ''}</text>
      <text x="${W - pad}" y="${H - 3}" text-anchor="end" style="font-size:5.8px;fill:rgba(255,255,255,.4)">${days[days.length - 1] ? days[days.length - 1].slice(5) : ''}</text>
    </svg>`;
}


function _aryBarsChart(days, values, gradId, c1, c2, fmt, drillKind) {
  const kind = drillKind === 'month' ? 'month' : 'day';
  const max = Math.max(...values, 1);
  const W = 320, H = 120, pad = 8, n = values.length;
  const step = (W - pad * 2) / n, bw = step * .58;
  const faD = k => { try { return new Date(k).toLocaleDateString('fa-IR', { day: 'numeric', month: 'long' }); } catch (e) { return k; } };
  const faM = k => { const [y, m] = String(k).split('-'); return `${m}/${String(y).slice(2)}`; };
  const labelOf = i => kind === 'month' ? faM(days[i]) : faD(days[i]);
  const bars = values.map((v, i) => {
    const h = Math.max(v > 0 ? 3 : 1, (v / max) * (H - pad - 30));
    const bx = pad + i * step + (step - bw) / 2;
    const by = H - pad - 14 - h;
    return `<g class="ary-cx-col" tabindex="0" role="button" aria-label="${labelOf(i)} — ${fmt(v)}" onclick="aryChartDrill('${kind}','${days[i]}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();aryChartDrill('${kind}','${days[i]}')}">
      <rect class="bar" x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="1.6" fill="url(#${gradId})" ${v > 0 ? '' : 'opacity=".3"'}/>
      ${v > 0 ? `<text x="${(bx + bw / 2).toFixed(1)}" y="${(by - 3.2).toFixed(1)}" text-anchor="middle" class="num" style="font-size:${n > 16 ? 5.6 : 6.6}px;font-weight:800;fill:#dbeafe">${utils.formatPriceShort ? (kind === 'month' ? utils.formatPriceShort(v) : v) : v}</text>` : ''}
      <g class="tip" transform="translate(${(bx + bw / 2).toFixed(1)}, ${Math.max(12, by - 16).toFixed(1)})">
        <rect x="-46" y="-12" width="92" height="19" rx="4" fill="rgba(6,14,32,.94)" stroke="rgba(148,187,255,.28)" stroke-width=".5"/>
        <text x="0" y="1.6" text-anchor="middle" style="font-size:6.6px;font-weight:800;fill:#fff">${labelOf(i)} · ${fmt(v)}</text>
      </g>
      <rect x="${(pad + i * step).toFixed(1)}" y="0" width="${step.toFixed(1)}" height="${H - 14}" fill="transparent"/>
    </g>`;
  }).join('');
  return `
    <svg viewBox="0 0 ${W} ${H}" class="w-full" style="aspect-ratio:${W}/${H}" dir="ltr" role="img" aria-label="نمودار ستونی">
      <defs>
        <linearGradient id="${gradId}" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <line x1="${pad}" x2="${W - pad}" y1="${H - pad - 14}" y2="${H - pad - 14}" stroke="rgba(255,255,255,.12)" stroke-width=".6"/>
      ${bars}
      <text x="${pad}" y="${H - 4}" style="font-size:6px;fill:rgba(255,255,255,.4)">${kind === 'month' ? faM(days[0]) : (days[0] || '').slice(5)}</text>
      <text x="${W - pad}" y="${H - 4}" text-anchor="end" style="font-size:6px;fill:rgba(255,255,255,.4)">${kind === 'month' ? faM(days[n - 1]) : (days[n - 1] || '').slice(5)}</text>
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
      <p class="text-[10px] text-white/40 mt-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Zm7 10 .9 2.1L22 16l-2.1.9L19 19l-.9-2.1L16 16l2.1-.9L19 13Z"/></svg> برای دیدن جزئیات هر روز، روی نقطه/ستون کلیک کنید — اسکرول افقی ندارد</p>
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
      <p class="text-[10px] text-white/40 mt-2">تعداد سفارش هر روز — کلیک = فیلتر سفارشات همان روز</p>
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
      ${_aryBarsChart(months, values, 'gAryMonthly', '#f472b6', '#ec4899', v => utils.formatPrice(v), 'month')}
      <p class="text-[10px] text-white/40 mt-2">کلیک روی هر ستون = فیلتر کل سفارشات آن ماه</p>
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
    return `<circle class="ary-donut-seg" tabindex="0" role="button" aria-label="${defs[i][1]}: ${v} — کلیک برای فیلتر" onclick="aryChartDrill('status','${k}')" onkeydown="if(event.key==='Enter'){aryChartDrill('status','${k}')}" r="14" cx="16" cy="16" fill="none" stroke="${defs[i][2]}" stroke-width="3.4" stroke-dasharray="${dash}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 16 16)"><title>${defs[i][1]}: ${v}</title></circle>`;
  }).join('');
  const legend = counts.map(([k, v], i) => `
    <div class="flex items-center justify-between gap-2 text-xs rounded-lg px-2 py-1 -mx-2 ary-donut-row" tabindex="0" role="button" title="فیلتر سفارشات ${defs[i][1]}" onclick="aryChartDrill('status','${k}')" onkeydown="if(event.key==='Enter'){aryChartDrill('status','${k}')}">
      <span class="flex items-center gap-2 text-white/70"><span class="block w-2.5 h-2.5 rounded-full shrink-0" style="background:${defs[i][2]}"></span>${defs[i][1]}</span>
      <span class="font-bold tabular-nums">${v}<span class="text-white/40 font-normal mr-1">(${Math.round((v / total) * 100)}٪)</span></span>
    </div>`).join('');
  return `
    <div class="glass rounded-2xl p-4 sm:p-6 h-full flex flex-col">
      <h2 class="font-bold text-sm sm:text-lg mb-4">توزیع وضعیت سفارش‌ها <span class="text-[9px] font-normal text-white/35 mr-1">کلیک = فیلتر</span></h2>
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
  const _oq = String(state.orderQuery || '').trim().toLowerCase();
  if (_oq) {
    filteredOrders = filteredOrders.filter(o =>
      String(o.id || '').toLowerCase().includes(_oq) ||
      String(o.tracking_code || o.trackingCode || '').toLowerCase().includes(_oq) ||
      String(o.user_name || o.userName || '').toLowerCase().includes(_oq));
  }
  const returnsRequestedCount = (state.orders || []).filter(o => o.return_status === 'requested').length;
  const canceledCount = (state.orders || []).filter(o => (o.status || 'pending') === 'canceled').length;
  const _ordIcon = (n, c) => (typeof aryIcon === 'function' ? aryIcon(n, c) : '');
  
  return `
    <div class="animate-fade">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 class="text-2xl lg:text-3xl font-black">سفارشات (${filteredOrders.length})</h1>
        <div class="relative shrink-0">
          <span class="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none">${_ordIcon('search','w-4 h-4')}</span>
          <input id="order-search" class="input-style w-44 sm:w-64 pr-10 text-sm" placeholder="جست‌وجوی کد سفارش، پیگیری یا نام…" value="${escapeHtml(state.orderQuery || '')}" oninput="state.orderQuery=this.value; render()">
        </div>
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
  const items = safeParseItems(order.items);
  const total = calcOrderTotal(order, items);
  const st = order.status || 'pending';
  const canceled = st === 'canceled';
  const ai = (n, c) => (typeof aryIcon === 'function' ? aryIcon(n, c) : '');
  const ship = Number(order.shipping_cost != null ? order.shipping_cost : (order.shipping || 0));
  const disc = Number(order.discount || 0);
  const addrTxt = typeof order.address === 'string' ? order.address.trim()
    : [ (order.address && (order.address.title || order.address.label)) || '', (order.address && (order.address.full || order.address.text)) || '' ].filter(Boolean).join(' — ');
  const lat = Number(order.lat != null ? order.lat : (order.address_lat || (order.address && order.address.lat)));
  const lng = Number(order.lng != null ? order.lng : (order.address_lng || (order.address && order.address.lng)));
  const hasPt = isFinite(lat) && isFinite(lng) && lat !== 0 && lng !== 0;
  const trk = String(order.tracking_code || order.trackingCode || '').trim();
  const oid = String(order.id || '');
  const slot = order.delivery_slot ? String(order.delivery_slot) : '';
  const rows = items.slice(0, 6).map(it => `
      <div class="flex items-center justify-between gap-3 py-1.5 text-xs">
        <span class="text-white/85 truncate min-w-0 flex items-center gap-2">
          <span class="shrink-0 w-7 h-7 rounded-lg bg-white/5 border border-white/10 overflow-hidden inline-flex items-center justify-center text-[9px] text-white/40">${it.image ? `<img src="${it.image}" class="w-full h-full object-cover" alt="">` : (it.title || '?').slice(0, 1)}</span>
          ${escapeHtml(it.title || it.name || 'محصول')}
        </span>
        <span class="shrink-0 text-white/55 font-mono" dir="ltr">${Number(it.qty || it.count || 1)} × ${utils.formatPrice(it.price || 0)}</span>
      </div>`).join('');
  return `
    <div class="glass rounded-2xl p-4 lg:p-5 animate-fade ${canceled ? 'border !border-rose-500/35' : ''}">
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <button type="button" class="inline-flex items-center gap-1.5 font-mono font-black text-sm px-2.5 py-1.5 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/25 hover:bg-blue-500/25 transition" onclick="aryCopyText('${oid}')" title="کپی کد سفارش">#${escapeHtml(oid.slice(-8))}${ai('copy','w-3.5 h-3.5 opacity-60')}</button>
        ${trk ? `<button type="button" class="text-[11px] font-bold mono inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/12 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition" onclick="aryCopyText('${escapeHtml(trk)}')" title="کپی کد رهگیری"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7Z"/></svg> ${escapeHtml(trk)}</button>` : ''}
        <span class="text-[11px] text-white/50">${utils.formatDateTime(order.created_at)}</span>
        <div class="mr-auto flex items-center gap-2">
          <span class="text-[10px] font-black px-2 py-1 rounded-lg ${({pending:'bg-amber-500/15 text-amber-300',processing:'bg-blue-500/15 text-blue-300',shipped:'bg-sky-500/15 text-sky-300',delivered:'bg-emerald-500/15 text-emerald-300',canceled:'bg-rose-500/15 text-rose-300'})[st] || 'bg-white/10 text-white/60'}">${({pending:'در انتظار',processing:'پردازش',shipped:'ارسال شده',delivered:'تحویل شده',canceled:'لغوشده'})[st] || st}</span>
          <select id="status-${oid}" onchange="updateOrderStatus(state.orders.find(o => o.id === '${oid}'), this.value)" class="text-[11px] font-bold rounded-lg px-2 py-1.5 bg-white/8 border border-white/15 text-white/80">
            ${[['pending','در انتظار'],['processing','پردازش'],['shipped','ارسال'],['delivered','تحویل']].map(o => `<option value="${o[0]}" ${st === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}${canceled ? `<option value="canceled" selected>لغو (قدیمی)</option>` : ''}
          </select>
        </div>
      </div>

      ${order.cancel_reason && canceled ? `<div class="mb-3 rounded-xl bg-rose-500/10 border border-rose-500/25 px-3 py-2 text-[11px] text-rose-200 flex items-start gap-2">${ai('x','w-4 h-4 shrink-0 mt-0.5')}<span><b>لغوشده —</b> ${escapeHtml(String(order.cancel_reason))}</span><button type="button" class="mr-auto shrink-0 text-[10px] font-black px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition" onclick="aryReopenOrder('${oid}')">بازگشایی</button></div>` : ''}

      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="rounded-xl bg-white/4 border border-white/8 p-3">
          <p class="text-[10px] text-white/50 font-bold mb-1 flex items-center gap-1">${ai('user','w-3.5 h-3.5')} مشتری</p>
          <p class="text-xs font-bold truncate">${escapeHtml(order.user_name || 'بدون نام')}</p>
          <a href="tel:${escapeHtml(String(order.user_phone || ''))}" class="text-[11px] font-mono text-blue-300 hover:underline inline-flex items-center gap-1" dir="ltr">${escapeHtml(String(order.user_phone || '—'))}${order.user_phone ? `<button type="button" class="opacity-60 hover:opacity-100" onclick="event.preventDefault();event.stopPropagation();aryCopyText('${escapeHtml(String(order.user_phone))}')">${ai('copy','w-3 h-3')}</button>` : ''}</a>
        </div>
        <div class="rounded-xl bg-white/4 border border-white/8 p-3">
          <p class="text-[10px] text-white/50 font-bold mb-1 flex items-center gap-1">${ai('pin','w-3.5 h-3.5')} آدرس تحویل ${hasPt ? `<button type="button" class="mr-auto text-[9px] font-black px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 transition" onclick="aryShowOrderMap(${lat},${lng})">نقشه</button>` : ''}</p>
          ${addrTxt ? `<p class="text-[11px] leading-5 text-white/80 max-h-14 overflow-y-auto">${escapeHtml(addrTxt)}</p>` : '<p class="text-[11px] text-white/35">—</p>'}
          ${order.postal ? `<p class="text-[10px] font-mono text-white/45 mt-1" dir="ltr">کدپستی: ${escapeHtml(String(order.postal))}</p>` : ''}
        </div>
        <div class="rounded-xl bg-white/4 border border-white/8 p-3">
          <p class="text-[10px] text-white/50 font-bold mb-1 flex items-center gap-1">${ai('truck','w-3.5 h-3.5')} ارسال${slot ? ` <span class="mr-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-sky-500/12 text-sky-300">${escapeHtml(slot)}</span>` : ''}</p>
          <p class="text-[11px] text-white/75">${ship > 0 ? utils.formatPrice(ship) + ' تومان' : '<span class="text-emerald-300 font-bold">رایگان</span>'}</p>
        </div>
        <div class="rounded-xl bg-white/4 border border-white/8 p-3">
          <p class="text-[10px] text-white/50 font-bold mb-1">مالی</p>
          <p class="text-sm font-black ${canceled ? 'text-rose-300 line-through decoration-2' : 'text-emerald-400'}">${utils.formatPrice(total)} <span class="text-[9px] font-normal text-white/50">تومان</span></p>
          <p class="text-[10px] text-white/50">${items.length} کالا${disc > 0 ? ` · <span class="text-emerald-300">تخفیف ${utils.formatPrice(disc)}</span>` : ''}${order.coupon_code ? ` <span class="font-mono px-1 rounded bg-emerald-500/15 text-emerald-300">${escapeHtml(String(order.coupon_code))}</span>` : ''}</p>
        </div>
      </div>

      <div class="mt-3 rounded-xl bg-black/20 border border-white/6 px-3 py-1.5">
        <button type="button" class="w-full flex items-center justify-between py-1 text-[11px] font-bold text-white/60 hover:text-white transition" onclick="var b=document.getElementById('ord-items-${oid}');b.style.display=b.style.display==='none'?'block':'none';this.querySelector('.oc').style.transform=b.style.display==='none'?'':'rotate(90deg)'">
          <span>کالاهای سفارش (${items.length})</span><span class="oc transition-transform inline-flex">${ai('chevron','w-4 h-4')}</span>
        </button>
        <div id="ord-items-${oid}" style="display:none" class="pb-2 divide-y divide-white/5">${items.length ? rows : '<p class="text-[11px] text-white/35 py-1">—</p>'}${items.length > 6 ? `<p class="text-[10px] text-white/40 py-1">+${items.length - 6} قلم دیگر…</p>` : ''}</div>
      </div>
    </div>`;
}

function aryCopyText(txt) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(String(txt)).then(function () { if (window.toast) toast('کپی شد ✓', 'success', 1600); }); return; }
  } catch (e) {}
  try { const ta = document.createElement('textarea'); ta.value = String(txt); document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); if (window.toast) toast('کپی شد ✓', 'success', 1600); } catch (e) {}
}
function aryReopenOrder(oid) {
  const o = (state.orders || []).find(x => String(x.id) === String(oid)); if (!o) return;
  o.status = 'processing'; o.cancel_reason = ''; o.reopened_at = new Date().toISOString();
  if (window.AppState) AppState.set({ orders: state.orders });
  if (window.AryaServer && AryaServer.isConfigured && AryaServer.isConfigured()) { try { AryaServer.crud.upsert('orders', { id: String(o.id), status: 'processing' }); } catch (e) {} }
  if (window.toast) toast('سفارش بازگشایی و به «پردازش» منتقل شد', 'info');
  render();
}
// وضعیت شیت پایین ادمین (باز/کشیدن/حالت) — تعریف سراسری
const sheetState = { mode: 'closed', open: false, dragging: false, startY: 0, lastY: 0, lastTime: 0, height: 0, velocity: 0 };
window.sheetState = sheetState;

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
    { id: 'shop', icon: 'truck', label: 'تنظیمات ارسال' },
    { id: 'blog', icon: 'list', label: 'بلاگ' },
    { id: 'coupons', icon: 'tag', label: 'کد تخفیف' },
    { id: 'home', icon: 'home', label: 'صفحه اصلی' },
    { id: 'database', icon: 'database', label: 'دیتابیس' },
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
        <div class="p-5 border-b border-white/5">
          <div class="flex items-center gap-3">
            <span class="admin-logo-tile" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M3 9.5 12 3l9 6.5V21H3z"/><path d="M9 21v-7h6v7"/></svg></span>
            <div class="flex-1 min-w-0">
              <h1 class="font-black text-[.95rem] truncate">${(window.SITE_CONFIG && SITE_CONFIG.site_name) || 'فروشگاه آرین علوی'}</h1>
              <p class="text-[.68rem] text-white/55 mt-0.5">پنل مدیریت — نسخه ${ (window.SITE_CONFIG && SITE_CONFIG.version) || '۱.۰' }</p>
            </div>
            <button type="button" onclick="window.AryaTheme&&AryaTheme.toggle()" class="ary-theme-btn" title="حالت روشن/تاریک" aria-label="تغییر تم"><svg class="ico-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="ico-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg></button>
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
          <button onclick="AryaAdminPreview.open()" class="w-full btn-ghost py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium" type="button">${typeof aryIcon === 'function' ? aryIcon('eye', 'w-4 h-4') : ''} پیش‌نمایش سایت در پنل</button>
          <button onclick="state.adminTab='database'; render()" class="w-full bg-emerald-500/10 text-emerald-400 py-3 rounded-xl hover:bg-emerald-500/20 flex items-center justify-center gap-2 text-sm font-medium transition-all" type="button">${typeof aryIcon === 'function' ? aryIcon('database', 'w-4 h-4') : ''} دیتابیس</button>
          <button onclick="adminLogout()" class="w-full bg-rose-500/10 text-rose-400 py-3 rounded-xl hover:bg-rose-500/20 flex items-center justify-center gap-2 text-sm font-medium transition-all" type="button">${typeof aryIcon === 'function' ? aryIcon('logout', 'w-4 h-4') : ''} خروج</button>
        </div>
      </aside>

      <!-- Mobile Header -->
      <header class="lg:hidden glass-dark border-b border-white/5 p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">${typeof aryIcon === 'function' ? aryIcon('settings', 'w-5 h-5') : ''}</span>
            <h1 class="font-bold truncate">پنل مدیریت</h1>
          </div>
          <div class="flex gap-2 items-center">
            <button type="button" onclick="window.AryaTheme&&AryaTheme.toggle()" class="ary-theme-btn" title="حالت روشن/تاریک" aria-label="تغییر تم"><svg class="ico-sun w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="ico-moon w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg></button>
            <button onclick="AryaAdminPreview.open()" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-500/15 border border-blue-400/25 text-blue-200 text-[11px] font-bold whitespace-nowrap active:scale-95 transition" type="button" title="پیش‌نمایش زندهٔ سایت در پنل" aria-label="پیش‌نمایش سایت">${typeof aryIcon === 'function' ? aryIcon('eye', 'w-4 h-4') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>'}<span>پیش‌نمایش</span></button>
            <button onclick="adminLogout()" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/12 border border-rose-400/25 text-rose-300 text-[11px] font-bold whitespace-nowrap active:scale-95 transition" type="button" title="خروج از پنل">${typeof aryIcon === 'function' ? aryIcon('logout', 'w-4 h-4') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>'}<span>خروج</span></button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 p-4 lg:p-8 overflow-auto overflow-x-hidden pb-24 lg:pb-8 lg:mr-72 mr-0">
        <header class="admin-topbar">
          <div class="admin-topbar-title">
            <span class="admin-topbar-crumb">${(tabs.find(t=>t.id===state.adminTab)||{}).label || 'داشبورد'}</span>
            <span class="admin-topbar-sep">/</span>
            <span class="admin-topbar-store">${(window.SITE_CONFIG && SITE_CONFIG.site_name) || 'آرین علوی'}</span>
          </div>
          <div class="admin-topbar-acts">
            <button type="button" class="admin-topbar-btn" onclick="AryaAdminPreview.open()">${typeof aryIcon === 'function' ? aryIcon('eye','w-4 h-4') : ''}<span>پیش‌نمایش سایت</span></button>
            <button type="button" onclick="window.AryaTheme&&AryaTheme.toggle()" class="ary-theme-btn" title="حالت روشن/تاریک" aria-label="تغییر تم"><svg class="ico-sun w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="ico-moon w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg></button>
            <button type="button" class="admin-topbar-btn admin-topbar-logout" onclick="adminLogout()">${typeof aryIcon === 'function' ? aryIcon('logout','w-4 h-4') : ''}<span>خروج</span></button>
          </div>
        </header>
        ${state.adminTab === 'dashboard' ? (typeof renderAdminDashboard === 'function' ? renderAdminDashboard() : '') : ''}
        ${state.adminTab === 'products' ? (typeof renderAdminProductsEditor === 'function' ? renderAdminProductsEditor() : '') : ''}
        ${state.adminTab === 'orders' ? renderAdminOrdersSafe() : ''}
        ${state.adminTab === 'categories' ? renderAdminCategoriesEditor() : ''}
        ${state.adminTab === 'reviews' ? renderAdminReviews() : ''}
        ${state.adminTab === 'support' ? renderAdminSupportSafe() : ''}
        ${state.adminTab === 'shop' ? renderAdminShopSettings() : ''}
        ${state.adminTab === 'coupons' ? renderAdminCoupons() : ''}
        ${state.adminTab === 'home' ? renderAdminHomeEditor() : ''}
        ${state.adminTab === 'blog' ? (typeof renderAdminBlogTab === 'function' ? renderAdminBlogTab() : '') : ''}
        ${state.adminTab === 'database' ? (typeof renderAdminDatabasePage === 'function' ? renderAdminDatabasePage() : '') : ''}
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
        <span class="icon"></span>
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
          <div class="ary-sheet-tools">
            <button type="button" class="ary-sheet-tool ary-sheet-tool-view" onclick="AryaAdminPreview.open(); sheetToggle(false)">
              ${typeof aryIcon === 'function' ? aryIcon('eye', 'w-4 h-4') : ''}<span>پیش‌نمایش سایت</span>
            </button>
            <button type="button" class="ary-sheet-tool ary-sheet-tool-db" onclick="state.adminTab='database'; sheetToggle(false); render()">
              ${typeof aryIcon === 'function' ? aryIcon('database', 'w-4 h-4') : ''}<span>دیتابیس</span>
            </button>
            <button type="button" class="ary-sheet-tool ary-sheet-tool-out" onclick="adminLogout()">
              ${typeof aryIcon === 'function' ? aryIcon('logout', 'w-4 h-4') : ''}<span>خروج از پنل</span>
            </button>
          </div>
        </div>
      </div>

      ${renderCategoryModal()}
      ${typeof renderAdminCouponModal === 'function' ? renderAdminCouponModal() : ''}
      ${typeof renderAdminBulkImport === 'function' ? renderAdminBulkImport() : ''}
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
  // r49 — امکان لغو سفارش از پنل ادمین حذف شده؛ لغو فقط سابقاً ثبت‌شده نمایش داده می‌شود
  if (String(nextStatus) === 'canceled') {
    render();
    toast('امکان لغو سفارش از پنل وجود ندارد', 'warning');
    return;
  }
  updateOrder(order.id, { status: nextStatus });
}

/* ========== تنظیمات ارسال و نقشه (مبدأ فروشگاه + گزینه‌های زمان) ========== */
const ARY_SHIP_FALLBACK = {
  base_cost: 30000, free_over: 500000,
  map_provider: 'osm', google_maps_key: '',
  origin: { lat: '', lng: '', label: 'مبدأ فروشگاه' },
  shipping_options: [
    { id: 'standard', label: 'ارسال عادی (پست پیشتاز)', min_days: 3, max_days: 5, extra_cost: 0, active: true, is_default: true },
    { id: 'express', label: 'ارسال فوری (پیک تیپاکس)', min_days: 1, max_days: 2, extra_cost: 45000, active: true, is_default: false },
    { id: 'economy', label: 'ارسال اقتصادی (پست دولتی)', min_days: 5, max_days: 9, extra_cost: 0, active: true, is_default: false }
  ]
};
function aryAdminShopCfg() {
  if (!state.shopCfg && window.AryaServer && AryaServer.isConfigured && AryaServer.isConfigured() && !state.__shopCfgReq) {
    state.__shopCfgReq = true;
    AryaServer.call('shop_config').then(r => {
      state.__shopCfgReq = false;
      if (r && r.ok && r.data) { state.shopCfg = r.data; window.__aryShopCfg = r.data; render(); }
    }).catch(() => { state.__shopCfgReq = false; });
  }
  const src = state.shopCfg || window.__aryShopCfg || ARY_SHIP_FALLBACK;
  return {
    base_cost: Number(src.base_cost) || 0,
    free_over: Number(src.free_over) || 0,
    map_provider: src.map_provider === 'google' ? 'google' : 'osm',
    google_maps_key: String(src.google_maps_key || ''),
    origin: { lat: src.origin?.lat ?? '', lng: src.origin?.lng ?? '', label: src.origin?.label || 'مبدأ فروشگاه' },
    shipping_options: (Array.isArray(src.shipping_options) && src.shipping_options.length ? src.shipping_options : ARY_SHIP_FALLBACK.shipping_options).map(o => ({
      id: o.id, label: o.label, min_days: Number(o.min_days) || 0, max_days: Number(o.max_days) || 0,
      extra_cost: Number(o.extra_cost) || 0, active: o.active !== false, is_default: !!o.is_default
    }))
  };
}
function renderAdminShopSettings() {
  const ai = (n, c) => (typeof aryIcon === 'function' ? aryIcon(n, c) : '');
  const cfg = aryAdminShopCfg();
  state.shopCfg = cfg; // mirror برای رندرهای بعدی
  const esc = (v) => escapeHtml(String(v ?? ''));
  const rows = cfg.shipping_options.map((o, i) => `
    <div class="glass rounded-xl p-3.5 grid grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
      <div class="col-span-2 md:col-span-4 lg:col-span-3">
        <label class="block text-[10px] text-white/50 mb-1">نام گزینه</label>
        <input id="shop-o${i}-label" class="input-style w-full text-sm" value="${esc(o.label)}" placeholder="مثلاً ارسال عادی">
      </div>
      <div class="col-span-1 md:col-span-2 lg:col-span-1">
        <label class="block text-[10px] text-white/50 mb-1">حداقل روز</label>
        <input id="shop-o${i}-min" type="number" min="0" max="45" class="input-style w-full text-sm" value="${o.min_days}">
      </div>
      <div class="col-span-1 md:col-span-2 lg:col-span-1">
        <label class="block text-[10px] text-white/50 mb-1">حداکثر روز</label>
        <input id="shop-o${i}-max" type="number" min="0" max="60" class="input-style w-full text-sm" value="${o.max_days}">
      </div>
      <div class="col-span-2 md:col-span-2 lg:col-span-2">
        <label class="block text-[10px] text-white/50 mb-1">هزینه اضافه — تومان</label>
        <input id="shop-o${i}-extra" type="number" min="0" step="1000" class="input-style w-full text-sm" value="${o.extra_cost}">
      </div>
      <label class="md:col-span-2 lg:col-span-1 inline-flex items-center gap-2 text-xs cursor-pointer pb-2">
        <input id="shop-o${i}-active" type="checkbox" ${o.active ? 'checked' : ''} class="accent-blue-500 w-4 h-4"><span>فعال</span>
      </label>
      <label class="md:col-span-3 lg:col-span-2 inline-flex items-center gap-2 text-xs cursor-pointer pb-2">
        <input type="radio" name="shop-default" value="${i}" ${o.is_default ? 'checked' : ''} class="accent-blue-500"><span>پیش‌فرض</span>
      </label>
      <div class="md:col-span-1 flex justify-end pb-1">
        <button type="button" class="text-[11px] px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 transition" onclick="aryAdminShopEdit('del', ${i})" title="حذف گزینه">حذف</button>
      </div>
      <input type="hidden" id="shop-o${i}-id" value="${esc(o.id)}">
    </div>`).join('');
  setTimeout('typeof aryAdminShopMountMap===\'function\'&&aryAdminShopMountMap()', 50);
  return `
    <div class="animate-fade max-w-4xl">
      <div class="flex items-center justify-between gap-3 mb-5">
        <h1 class="text-xl lg:text-2xl font-black flex items-center gap-2.5 flex-wrap"><span class="inline-flex text-blue-300">${ai('truck','w-6 h-6')}</span> زمان ارسال و مبدأ نقشه</h1>
        <button type="button" class="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2" onclick="aryAdminShopSave()">${ai('check','w-4 h-4')} ذخیره تنظیمات</button>
      </div>

      <div class="glass rounded-2xl p-4 lg:p-6 mb-6">
        <h2 class="font-bold mb-1.5">هزینه و مهلت رایگان‌سازی</h2>
        <p class="text-[11px] text-white/45 mb-4">مبلغی که به‌صورت پیش‌فرض بابت ارسال حساب می‌شود؛ سفارش‌های بالای سقف «ارسال رایگان» هستند.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label class="block text-xs text-white/55 mb-1">هزینه پایهٔ ارسال (تومان)</label>
            <input id="shop-base-cost" type="number" min="0" step="1000" class="input-style w-full" value="${cfg.base_cost}">
          </div>
          <div>
            <label class="block text-xs text-white/55 mb-1">سقف خرید رایگان (تومان — صفر = هیچ‌وقت رایگان نیست)</label>
            <input id="shop-free-over" type="number" min="0" step="50000" class="input-style w-full" value="${cfg.free_over}">
          </div>
        </div>
      </div>

      <div class="glass rounded-2xl p-4 lg:p-6 mb-6">
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <h2 class="font-bold">گزینه‌های زمان ارسال (در صفحهٔ checkout به مشتری نشان داده می‌شود)</h2>
          <button type="button" class="text-[11px] px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 transition" onclick="aryAdminShopEdit('add')">+ افزودن گزینه</button>
        </div>
        <p class="text-[11px] text-white/45 mb-4">بازهٔ روزهای کاری «از — تا» پس از تأخیر پرداخت محاسبه می‌شود. دستِ‌کم یک گزینه باید فعال باشد.</p>
        <div class="space-y-3">${rows}</div>
      </div>

      <div class="glass rounded-2xl p-4 lg:p-6">
        <h2 class="font-bold mb-1.5">مبدأ ارسال روی نقشه</h2>
        <p class="text-[11px] text-white/45 mb-4">انبار/محل ارسال را با یک کلیک روی نقشه مشخص کنید. مشتری هنگام انتخاب آدرس مقصد، فاصله تا همین مبدأ را می‌بیند و سیستم بر اساس آن برآورد زمان می‌دهد.</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-sm">
          <div>
            <label class="block text-xs text-white/55 mb-1">عرض جغرافیایی (lat)</label>
            <input id="shop-origin-lat" dir="ltr" class="input-style w-full font-mono text-left" value="${cfg.origin.lat}" placeholder="35.699700">
          </div>
          <div>
            <label class="block text-xs text-white/55 mb-1">طول جغرافیایی (lng)</label>
            <input id="shop-origin-lng" dir="ltr" class="input-style w-full font-mono text-left" value="${cfg.origin.lng}" placeholder="51.337900">
          </div>
          <div>
            <label class="block text-xs text-white/55 mb-1">برچسب مبدأ</label>
            <input id="shop-origin-label" class="input-style w-full" value="${esc(cfg.origin.label)}" placeholder="انبار مرکزی تهران">
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-x-5 gap-y-2 mb-2 p-2.5 rounded-xl bg-white/[.04] border border-white/10">
          <span class="text-[11px] font-bold text-white/60">موتور نقشه:</span>
          <label class="inline-flex items-center gap-2 text-xs cursor-pointer"><input type="radio" name="shop-map-provider" value="osm" ${cfg.map_provider !== 'google' ? 'checked' : ''} onchange="document.getElementById('shop-gmaps-key-box').classList.toggle('opacity-50', this.value!=='google'); if(this.value==='google'&&document.getElementById('shop-gmaps-key')&&!document.getElementById('shop-gmaps-key').value.trim())document.getElementById('shop-gmaps-key').focus();"><span>مسیر باز — OSM/Leaflet</span></label>
          <label class="inline-flex items-center gap-2 text-xs cursor-pointer"><input type="radio" name="shop-map-provider" value="google" ${cfg.map_provider === 'google' ? 'checked' : ''}><span>Google Maps</span></label>
          <span class="text-[10px] text-white/40">(با گوگل، «موقعیت کنونی» و جستجو با Geocoder فارسی گوگل انجام می‌شود؛ بدون کلید معتبر خودکار به OSM برمی‌گردد)</span>
        </div>
        <div id="shop-gmaps-key-box" class="${cfg.map_provider === 'google' ? '' : 'opacity-50'} mb-2">
          <label class="block text-[10px] text-white/50 mb-1">کلید API گوگل (Maps JavaScript API)</label>
          <input id="shop-gmaps-key" dir="ltr" autocomplete="off" spellcheck="false" class="input-style w-full font-mono text-left text-xs" value="${esc(cfg.google_maps_key || '')}" placeholder="AIza…">
        </div>
        <div id="ary-origin-map" class="ary-map rounded-xl border border-white/10 mb-2"></div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="text-[11px] px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition" onclick="aryAdminShopLocate()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg> استفاده از موقعیت فعلی من</button>
          <span class="text-[10px] text-white/40 self-center">برای ثبت مبدأ، روی نقشه کلیک کنید.</span>
        </div>
      </div>
    </div>`;
}
function aryAdminShopEdit(mode, i) {
  const cfg = state.shopCfg || aryAdminShopCfg();
  const opts = (cfg.shipping_options || []).slice();
  if (mode === 'add') {
    if (opts.length >= 8) { toast('حداکثر ۸ گزینه مجاز است', 'warning'); return; }
    opts.push({ id: 'opt_' + Math.random().toString(36).slice(2, 7), label: 'گزینهٔ جدید', min_days: 2, max_days: 4, extra_cost: 0, active: true, is_default: !opts.some(o => o.is_default) });
  } else if (mode === 'del') {
    if (opts.length <= 1) { toast('حداقل یک گزینه باید بماند', 'warning'); return; }
    opts.splice(i, 1);
  }
  state.shopCfg = { ...cfg, shipping_options: opts };
  render();
}
function aryAdminShopMountMap() {
  try {
    if (state.adminTab !== 'shop') return;
    const el = document.getElementById('ary-origin-map');
    if (!el || el._aryMounted || !window.AryaMap) return;
    el._aryMounted = 1;
    const lat = parseFloat(document.getElementById('shop-origin-lat')?.value);
    const lng = parseFloat(document.getElementById('shop-origin-lng')?.value);
    AryaMap.mountInline(el, {
      lat: isFinite(lat) ? lat : null, lng: isFinite(lng) ? lng : null,
      onChange: (la, ln) => {
        const a = document.getElementById('shop-origin-lat'), b = document.getElementById('shop-origin-lng');
        if (a) a.value = la; if (b) b.value = ln;
      }
    }).then(inst => { el._aryInst = inst; }).catch(() => { el._aryMounted = 0; el.innerHTML = '<div class="p-4 text-xs text-white/50">نقشه بارگذاری نشد — مختصات را دستی وارد کنید.</div>'; });
  } catch (e) {}
}
function aryAdminShopLocate() {
  if (!navigator.geolocation) return toast('مرورگر شما موقعیت‌یابی ندارد', 'warning');
  navigator.geolocation.getCurrentPosition((pos) => {
    const la = Number(pos.coords.latitude).toFixed(6), ln = Number(pos.coords.longitude).toFixed(6);
    const a = document.getElementById('shop-origin-lat'), b = document.getElementById('shop-origin-lng');
    if (a) a.value = la; if (b) b.value = ln;
    const el = document.getElementById('ary-origin-map');
    if (el && el._aryInst) el._aryInst.set(+la, +ln);
    toast('موقعیت فعلی در مبدأ نوشته شد — روی «ذخیره تنظیمات» بزنید', 'info');
  }, () => toast('دسترسی به موقعیت رد شد', 'warning'));
}
function aryAdminShopSave() {
  const cfg = state.shopCfg || aryAdminShopCfg();
  const n = (cfg.shipping_options || []).length;
  const opts = [];
  for (let i = 0; i < n; i++) {
    const g = (f) => document.getElementById('shop-o' + i + '-' + f);
    const label = String(g('label')?.value || '').trim();
    if (label.length < 2) { toast('عنوان هر گزینه حداقل ۲ حرف باشد', 'warning'); return; }
    const min = Number(g('min')?.value) || 0, max = Number(g('max')?.value) || 0;
    if (max < min) { toast('در گزینهٔ «' + label + '» بازهٔ روزها معتبر نیست (کمینه بیشینه شد)', 'warning'); return; }
    opts.push({
      id: String(g('id')?.value || ('opt' + i)), label,
      min_days: min, max_days: max,
      extra_cost: Math.max(0, Number(g('extra')?.value) || 0),
      active: !!g('active')?.checked,
      is_default: document.querySelector('input[name="shop-default"]:checked')?.value === String(i)
    });
  }
  const body = {
    base_cost: Math.max(0, Number(document.getElementById('shop-base-cost')?.value) || 0),
    free_over: Math.max(0, Number(document.getElementById('shop-free-over')?.value) || 0),
    origin: {
      lat: String(document.getElementById('shop-origin-lat')?.value || '').trim() || null,
      lng: String(document.getElementById('shop-origin-lng')?.value || '').trim() || null,
      label: String(document.getElementById('shop-origin-label')?.value || '').trim() || 'مبدأ فروشگاه'
    },
    map_provider: (document.querySelector('input[name="shop-map-provider"]:checked') || {}).value || 'osm',
    google_maps_key: String(document.getElementById('shop-gmaps-key')?.value || '').trim().slice(0, 120),
    shipping_options: opts
  };
  AryaServer.call('shop_config_save', { body }).then(r => {
    if (!r || !r.ok) { toast((r && r.msg) || 'ذخیره ناموفق بود', 'error'); return; }
    state.shopCfg = r.data; window.__aryShopCfg = r.data;
    if (window.state) state.shopConfig = r.data;
    toast('تنظیمات ارسال ذخیره شد ✓');
    render();
  }).catch(() => toast('ارتباط با سرور برقرار نشد', 'error'));
}
window.renderAdminShopSettings = renderAdminShopSettings;
window.aryAdminShopEdit = aryAdminShopEdit;
window.aryAdminShopMountMap = aryAdminShopMountMap;
window.aryAdminShopLocate = aryAdminShopLocate;
window.aryAdminShopSave = aryAdminShopSave;


/* ========== Categories: modal-based CRUD + product assignment ========== */

function openCategoryModal(mode, id = null) {
  if (mode === 'add') {
    state.categoryModal = {
      mode: 'add',
      id: null,
      title: '',
      icon: '',
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
      icon: cat.icon || '',
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
    state.categories.push({ id, title, icon: (m.icon || '').trim() });

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
    cat.icon = (m.icon || '').trim();

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
    icon: 'trash',
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
          ${m.mode === 'add' ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg> دسته‌بندی جدید' : ' ویرایش دسته‌بندی'}
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
            <div class="flex items-center justify-between gap-2 mb-2">
              <label class="block text-sm text-white/70 font-bold">آیکون دسته (در هوم‌پیج)</label>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center justify-center w-9 h-9 rounded-xl glass text-blue-300">${(typeof aryCatIcon==='function'?aryCatIcon({icon:m.icon||''},'w-5 h-5'):'')}</span>
                <button type="button" class="text-[11px] font-bold px-2.5 py-1 rounded-lg glass text-white/60 hover:text-rose-300 transition" onclick="state.categoryModal.icon=''; render()">حذف آیکون</button>
              </div>
            </div>
            ${aryCatIconPickerHTML(m)}

          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <label class="block text-sm text-white/70 font-bold">محصولات بدون دسته (${uncategorized.length})</label>
              <span class="relative w-44"><span class="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-45 pointer-events-none">${typeof aryIcon==='function'?aryIcon('search','w-3.5 h-3.5'):''}</span><input class="input-style w-full !py-1.5 pr-8 text-xs" placeholder="جست‌وجو…" value="${escapeHtml(m.q||'')}" oninput="state.categoryModal.q=this.value; render()"></span>
            </div>
            <div class="flex gap-3 overflow-x-auto pb-2">
              ${
                uncategorized.length === 0
                  ? `<p class="text-white/40 text-sm">محصول بدون دسته وجود ندارد</p>`
                  : uncategorized
                      .filter(p => !String(m.q || '').trim() || String(p.title || '').toLowerCase().includes(String(m.q).trim().toLowerCase()))
                      .map(
                        p => `
                    <label class="glass rounded-xl p-3 flex-shrink-0 w-40 cursor-pointer hover:bg-white/10 transition">
                      <div class="w-full h-24 bg-white/5 rounded-lg overflow-hidden mb-2">
                        ${
                          p.image || p.main_image
                            ? `<img src="${p.image || p.main_image}" class="w-full h-full object-cover">`
                            : `<div class="w-full h-full flex items-center justify-center text-3xl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.7rem;height:1.7rem;vertical-align:-0.15em" aria-hidden="true"><path d="m21 8-9-5-9 5v8l9 5 9-5V8Zm-9 5L3 8m18 0-9 5m-6-9 9 5 9-5m-9 13V13"/></svg></div>`
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

        <div class="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-4 mt-8">
          ${
            m.mode === 'edit'
              ? `<button 
                  type="button" 
                  onclick="deleteCategoryWithConfirm('${m.id}')"
                  class="btn-danger w-full sm:flex-1 py-3.5 sm:py-4 rounded-xl font-semibold text-center whitespace-nowrap"
                >
                  حذف دسته
                </button>`
              : ''
          }

          <button 
            type="button" 
            onclick="closeCategoryModal()"
            class="btn-ghost w-full sm:flex-1 py-3.5 sm:py-4 rounded-xl font-semibold text-center whitespace-nowrap"
          >
            انصراف
          </button>

          <button 
            type="button" 
            onclick="saveCategoryModal()"
            class="btn-primary w-full sm:flex-1 py-3.5 sm:py-4 rounded-xl font-semibold text-center whitespace-nowrap"
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
  const _cq = String(state.catQuery || '').trim().toLowerCase();
  const _visCats = state.categories.filter(c => !_cq || String(c.title || '').toLowerCase().includes(_cq) || String(c.id || '').toLowerCase().includes(_cq));

  return `
    <div class="animate-fade">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 class="text-2xl lg:text-3xl font-black">مدیریت دسته‌بندی‌ها (${_visCats.length})</h1>
        <div class="relative">
          <span class="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none">${typeof aryIcon === 'function' ? aryIcon('search','w-4 h-4') : ''}</span>
          <input id="cat-search" class="input-style w-44 sm:w-56 pr-10 text-sm" placeholder="جست‌وجوی دسته…" value="${escapeHtml(state.catQuery || '')}" oninput="state.catQuery=this.value; render()">
        </div>
        <button class="btn-primary px-5 py-3 rounded-xl font-semibold text-sm" type="button" onclick="openCategoryModal('add')">
          افزودن دسته
        </button>
      </div>

      <div class="grid gap-3">
        ${_visCats
          .map(
            (c, i) => `
          <div class="glass rounded-xl p-4 flex items-center justify-between animate-fade" style="animation-delay:${i *
            0.05}s">
            <div>
              <div class="font-semibold flex items-center gap-2">${c.icon ? `<span class="text-lg leading-none">${escapeHtml(String(c.icon).slice(0, 6))}</span>` : ""}<span>${c.title}</span></div>
              <div class="text-xs text-white/40">${c.id}</div>
            </div>
            <div class="flex gap-2">
              <button class="p-2 glass rounded-xl text-blue-200 hover:bg-blue-500/15" type="button" title="ویرایش دسته" aria-label="ویرایش دسته" onclick="openCategoryModal('edit', '${c.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1rem;height:1rem;vertical-align:-0.15em" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
              <button class="p-2 glass rounded-xl text-rose-400 hover:bg-rose-500/20" type="button" onclick="deleteCategoryWithConfirm('${c.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7m4 4v6m4-6v6"/></svg></button>
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
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/></svg>',
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
    icon: 'trash',
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
              ${typeof aryIcon === 'function' ? aryIcon('star', 'w-4 h-4') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h6" stroke-width="1.4"/></svg>'}
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
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="M7 10v12H4a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1h3Zm0 0 4.5-7a2.4 2.4 0 0 1 2 1.4c.3.7.2 1.4-.1 2L12.5 9H19a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 17.6 20H7"/></svg> <span>${r.likes}</span>
                            </button>
                            <button
                              type="button"
                              class="px-2 py-1 rounded-lg flex items-center gap-1 ${r._adminReaction === 'dislike' ? 'bg-rose-500/20 text-rose-300' : 'glass text-white/70 hover:bg-white/10'}"
                              onclick="reactToReview('${r.id}', 'dislike')"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="M17 14V2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-3Zm0 0-4.5 7a2.4 2.4 0 0 1-2-1.4c-.3-.7-.2-1.4.1-2L11.5 15H5a2 2 0 0 1-2-2.4l1.4-7A2 2 0 0 1 6.4 4H17"/></svg> <span>${r.dislikes}</span>
                            </button>
                          </div>

                          <div class="flex items-center gap-2 text-[11px]">
                            <span class="px-2 py-1 rounded-lg bg-white/5 text-white/70">
                              ${
                                r.status === 'approved'
                                  ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/></svg> تایید شده'
                                  : r.status === 'rejected'
                                  ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg> رد شده'
                                  : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 1.8"/></svg> در انتظار'
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

  // فیلتر وضعیت + روز/ماه (دریل از چارت‌ها)
  const OF = state.orderFilter = Object.assign({ status: '', search: '' }, state.orderFilter || {});
  let filtered = OF.status ? orders.filter(o => (o.status || 'pending') === OF.status) : orders.slice();
  if (OF.day) filtered = filtered.filter(o => String(o.created_at || o.date || '').slice(0, 10) === OF.day);
  if (OF.month) filtered = filtered.filter(o => String(o.created_at || o.date || '').slice(0, 7) === OF.month);
  const dateChips = (OF.day || OF.month) ? `
        <div class="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/10">
          ${OF.day ? `<span class="inline-flex items-center gap-2 text-[11px] font-black px-2.5 py-1.5 rounded-lg bg-blue-500/15 text-blue-200 border border-blue-400/25"> ${_aryFaDay(OF.day)}</span>` : ''}
          ${OF.month ? `<span class="inline-flex items-center gap-2 text-[11px] font-black px-2.5 py-1.5 rounded-lg bg-pink-500/15 text-pink-200 border border-pink-400/25"> ماه ${OF.month.split('-').reverse().join('/')}</span>` : ''}
          <button type="button" class="text-[10px] font-black px-2.5 py-1.5 rounded-lg glass text-white/60 hover:text-rose-300 hover:bg-rose-500/10 transition" onclick="aryClearDateFilters()">✕ حذف فیلتر تاریخ</button>
        </div>` : '';

  return `
    <div class="animate-fade">
      <h1 class="text-2xl lg:text-3xl font-black mb-8">
        سفارشات (${filtered.length})
      </h1>

      <!-- FILTER BAR -->
      <div class="glass rounded-2xl p-5 mb-6">
        <div class="flex flex-wrap gap-2">

          ${renderOrderFilterButton("", "همه")}
          ${renderOrderFilterButton("pending", "در انتظار")}
          ${renderOrderFilterButton("processing", " پردازش")}
          ${renderOrderFilterButton("shipped", " ارسال شده")}
          ${renderOrderFilterButton("delivered", "تحویل")}

        </div>
        ${dateChips}
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
      <div class="text-7xl mb-6"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:3.2rem;height:3.2rem;vertical-align:-0.15em" aria-hidden="true"><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.4 11.1a1 1 0 0 0 1 .9h8.3a1 1 0 0 0 1-.8L21 8H6"/></svg></div>
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
      ${list.map((order, i) => renderAdminOrderCard(order, i)).join("")}
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
            ${renderOrderStatusOption("pending", "در انتظار", order.status)}
            ${renderOrderStatusOption("processing", " پردازش", order.status)}
            ${renderOrderStatusOption("shipped", " ارسال شده", order.status)}
            ${renderOrderStatusOption("delivered", "تحویل", order.status)}
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

/* ═══ r51 — پروندهٔ بازگشت وجهِ ناشی از لغو سفارش (از همان تیکت به کاربر پاسخ داده می‌شود) ═══ */
function aryIsRefundTicket(t) {
  return !!t && (String(t.type) === 'refund' || /بازگشت وجه/.test(String(t.subject || '')));
}
function aryRefundOrderOf(t) {
  const oid = String((t && t.order_id) || (String((t && t.subject) || '').match(/#\s*([A-Za-z0-9-]{4,})/) || [])[1] || '');
  if (!oid) return null;
  return (state.orders || []).find(o => String(o.id) === oid || String(o.id).slice(-8) === oid) || null;
}
window.aryAdminRefundPanel = function (t) {
  if (!aryIsRefundTicket(t)) return '';
  const od = aryRefundOrderOf(t);
  const oid = od ? String(od.id) : String(t.order_id || '');
  const amount = Number((od && od.refund && od.refund.amount) || t.refund_amount || (od && od.total) || 0);
  const stt = String((od && od.refund && od.refund.state) || t.refund_state || 'requested');
  const amtTxt = (window.utils && utils.formatPrice ? utils.formatPrice(amount) : String(amount)) + ' تومان';
  const label = stt === 'refunded' ? ('واریز شد' + (t.refund_ref ? ' — مرجع: ' + escapeHtml(String(t.refund_ref)) : '')) : (stt === 'rejected' ? 'رد شده' : 'در انتظار اقدام مالی');
  const lblCls = stt === 'refunded' ? 'text-emerald-300' : (stt === 'rejected' ? 'text-rose-300' : 'text-amber-300');
  return `
    <div class="mb-3 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3">
      <div class="flex flex-wrap items-center gap-3">
        <div class="text-xs text-white/85 leading-6 min-w-0">پروندهٔ <b>بازگشت وجه</b> سفارش <span dir="ltr" class="font-mono">#${escapeHtml(oid.slice(-8)) || '—'}</span> — مبلغ <b class="text-emerald-300">${amtTxt}</b> — وضعیت: <b class="${lblCls}">${label}</b>${od && od.cancel_reason ? ' · دلیل لغو کاربر: ' + escapeHtml(String(od.cancel_reason)) : ''}</div>
        <div class="mr-auto flex items-center gap-2 shrink-0">
          ${stt === 'requested' ? `<button type="button" class="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white whitespace-nowrap" onclick="aryAdminRefundStart('${escapeHtml(String(t.id))}','refunded')">تأیید و ثبت واریز</button>
          <button type="button" class="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-rose-600/85 hover:bg-rose-600 text-white whitespace-nowrap" onclick="aryAdminRefundStart('${escapeHtml(String(t.id))}','rejected')">رد درخواست</button>` : `<button type="button" class="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/85 whitespace-nowrap" onclick="aryAdminRefundStart('${escapeHtml(String(t.id))}','refunded')">اصلاح وضعیت واریز</button>`}
        </div>
      </div>
      <p class="text-[10px] text-white/45 mt-1">پاسخ (واریز یا رد) از طریق همین تیکت برای کاربر ثبت و در پنل کاربری او نمایش داده می‌شود؛ لغو/وضعیت سفارش از این‌جا تغییر نمی‌کند.</p>
    </div>`;
};
window.aryAdminRefundStart = function (tid, mode) {
  const t = (state.tickets || []).find(x => String(x.id) === String(tid));
  if (!t) return;
  const rej = mode === 'rejected';
  state.confirmModal = {
    type: rej ? 'warning' : 'info',
    title: rej ? 'رد درخواست بازگشت وجه — ثبت دلیل' : 'ثبت واریز بازگشت وجه',
    message: `
      <div class="text-start space-y-2.5">
        <textarea id="ary-refund-note" rows="2" class="input-style w-full text-sm resize-none" placeholder="${rej ? 'دلیل رد (از همان تیکت برای کاربر قابل مشاهده است)' : 'توضیح / تاریخ و مرجع حواله (اختیاری)'}"></textarea>
        ${rej ? '' : '<input id="ary-refund-ref" dir="ltr" class="input-style w-full text-xs" placeholder="شماره پیگیری/حواله (اختیاری)">'}
        <p class="text-[10px] text-white/40">متن به‌عنوان پاسخ پشتیبانی در همین تیکت ثبت می‌شود${rej ? ' — در صورت رد، سفارش «لغوشده» باقی می‌ماند' : ''}.</p>
      </div>`,
    confirmText: rej ? 'ثبت رد و ارسال پاسخ' : 'ثبت واریز و ارسال پاسخ',
    confirmClass: rej ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white',
    onConfirm: function () {
      const note = String(document.getElementById('ary-refund-note')?.value || '').trim().slice(0, 400);
      const ref = rej ? '' : String(document.getElementById('ary-refund-ref')?.value || '').trim().slice(0, 80);
      if (rej && note.replace(/\s+/g, '').length < 4) { if (window.toast) toast('برای رد درخواست، دلیل را بنویسید', 'warning'); return; }
      state.confirmModal = null;
      window.aryAdminRefundApply(tid, mode, note, ref);
    }
  };
  render();
};
window.aryAdminRefundApply = function (tid, mode, note, ref) {
  const t = (state.tickets || []).find(x => String(x.id) === String(tid));
  if (!t) return;
  const od = aryRefundOrderOf(t);
  const oid = od ? String(od.id) : String(t.order_id || '');
  const amount = Number((od && od.refund && od.refund.amount) || t.refund_amount || (od && od.total) || 0);
  const amtTxt = (window.utils && utils.formatPrice ? utils.formatPrice(amount) : String(amount)) + ' تومان';
  const ok = mode === 'refunded';
  const msg = ok
    ? ('بازگشت وجه سفارش #' + oid.slice(-8) + ' تأیید شد؛ مبلغ ' + amtTxt + ' به حساب شما واریز می‌گردد.' + (ref ? (' مرجع حواله: ' + ref + '.') : '') + (note ? (' توضیح: ' + note + '.') : '') + ' در صورت واریز نشدن تا ۷۲ ساعت کاری، از همین تیکت پیگیری کنید.')
    : ('با سلام. درخواست بازگشت وجه سفارش #' + oid.slice(-8) + ' بررسی و متأسفانه رد شد.' + (note ? (' دلیل: ' + note + '.') : '') + ' در صورت داشتن مستندات جدید، همان‌جا پاسخ دهید تا مجدد بررسی شود.');
  t.type = 'refund';
  if (oid) t.order_id = oid;
  t.refund_state = ok ? 'refunded' : 'rejected';
  if (ok) { t.refunded_at = new Date().toISOString(); if (ref) t.refund_ref = ref; }
  if (note) t.refund_note = note;
  if (od) {
    od.refund = Object.assign({}, od.refund || {}, { state: t.refund_state, amount: amount, ref: ref || (od.refund && od.refund.ref) || '', note: note || (od.refund && od.refund.note) || '', decided_at: new Date().toISOString() });
    try { if (window.AryaDB && AryaDB.upsert) AryaDB.upsert('orders', od).catch(function () {}); } catch (e2) {}
  }
  try { if (window.AppState) AppState.set({ orders: state.orders, tickets: state.tickets }); } catch (e2) {}
  try {
    if (window.AryaServer && AryaServer.isConfigured && AryaServer.isConfigured()) {
      AryaServer.crud.upsert('tickets', { id: String(t.id), refund_state: t.refund_state, status: t.status }).catch(function () {});
    }
  } catch (e2) {}
  addTicketMessage(t, { from: 'admin', text: msg });
  if (t.status === 'open') t.status = 'answered';
  if (window.toast) toast(ok ? 'واریز ثبت شد و پاسخ از طریق تیکت برای کاربر ارسال شد' : 'رد درخواست ثبت و از طریق تیکت به کاربر اعلام شد', 'success');
  render();
};

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

  // اطلاع‌رسانی پیامکی به کاربر (اگر شماره دارد) — سرور: واقعی / دمو: شبیه‌سازی یا صف
  if (ticket.user_phone && window.AryaSMS && payload.from !== 'user') {
    AryaSMS.send(ticket.user_phone, text, ticket.id).then(function (st) {
      try {
        ticket.sms_last = { to: st.to || ticket.user_phone, at: new Date().toISOString(), via: st.via, ok: !!st.ok };
        if (window.AppState) AppState.set({ tickets: state.tickets });
        if (window.toast) toast(st.via === 'server' ? 'پاسخ ثبت شد؛ پیامک هم برای کاربر ارسال شد' : (st.via === 'demo' ? 'پاسخ ثبت شد؛ اطلاع‌رسانی پیامکی (شبیه‌سازی دمو) انجام شد' : 'پاسخ ثبت شد؛ پیامک در صف ارسال بک‌اند قرار گرفت'), 'info', 4600);
      } catch (e) {}
    }).catch(function () {});
  }

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

window.aryAdminThreadScroll = function () {
  requestAnimationFrame(() => {
    const el = document.getElementById('admin-ticket-thread');
    if (el) el.scrollTop = el.scrollHeight;
  });
};

function renderAdminSupportSafe() {
  const allTickets = Array.isArray(state.tickets) ? state.tickets : [];
  // خود-ترمیم: اگر لیست خالی است (اولین بازکردن یا لود قبل از لاگین) یک‌بار از سرور بگیر
  if (!allTickets.length && window.AryaServer && AryaServer.isConfigured && AryaServer.isConfigured() && typeof window.aryAdminLiveSync === 'function') {
    const last = window.__aryTicketsHealAt || 0;
    if (Date.now() - last > 8000) {
      window.__aryTicketsHealAt = Date.now();
      Promise.resolve(window.aryAdminLiveSync()).catch(() => {});
    }
  }

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
              ? `<div class="flex-1 flex flex-col items-center justify-center text-center gap-3 py-14">
                  <span class="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-400/25 flex items-center justify-center text-blue-200"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.7rem;height:1.7rem;vertical-align:-0.15em" aria-hidden="true"><path d="M21 12a8 8 0 0 1-8.5 8 9.7 9.7 0 0 1-3.4-.6L4 20.5l1.2-4.4A7.8 7.8 0 0 1 4 12a8 8 0 0 1 8-8 8 8 0 0 1 9 8Z"/></svg></span>
                  <div class="text-sm font-bold text-white/75">گفتگوی تیکت را همین‌جا ببینید</div>
                  <div class="text-[11px] text-white/45 max-w-[36ch] leading-5">یک تیکت از فهرست کنار (یا زیر، در موبایل) انتخاب کنید تا پاسخ‌ها باز و همین‌جا پاسخ دهید — نیازی به پنجرهٔ جدا نیست.</div>
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

            ${(function () { return window.aryAdminRefundPanel ? aryAdminRefundPanel(activeTicket) : ''; })()}
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
      toast(' مقاله به طور خودکار ذخیره شد', 'success', 2000);
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
    icon: 'table',
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
    icon: 'link',
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
          <h3 class="text-lg font-bold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8Z"/></svg> پخش ویدیو</h3>
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

  const ICON_FALLBACK = {}; // r44 — فالبک ایموجی حذف شد؛ آیکون‌ها از ARYA_ICONS

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
        if (i.getAttribute('data-fallback-applied') === '1' || i.getAttribute('data-aryico') === '1') return;
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
  const root = document.querySelector('[data-pf-root]');
  if (!root) { render(); return; }
  const newContent = renderProductModal().match(/<div class="glass-strong[^>]*>[\s\S]*<\/div>/)?.[0] || '';
  if (newContent) {
    const sc = window.scrollY; root.innerHTML = newContent;
    try { window.scrollTo({ top: sc, behavior: 'auto' }); } catch (e) {}
    const f = root.querySelector('[data-pf-focus]'); if (f) f.focus();
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
  // r48 — مقالهٔ محصول با همان ویرایشگر پیشرفتهٔ بلاگ (منوی کامل بالا + برگهٔ سفید وسط)
  if (state.blogEdit && state.blogEdit._isProduct) {
    setTimeout('window.aryBlogWpMount && window.aryBlogWpMount()', 30);
    return renderAdminBlogEditor();
  }
  if (state.editProduct) return renderProductModal(); // فرم تمام‌صفحه (به‌جای پاپ‌آپ)
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

        <div class="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end gap-2 sm:gap-3 max-w-full w-full">
          <div class="col-span-2 sm:col-auto flex items-center gap-2 min-w-0">
            <label class="text-xs text-white/55 font-bold shrink-0 hidden md:inline">فیلتر دسته:</label>
            <select onchange="setProductFilterCategory(this.value)" class="input-style !py-2 text-xs rounded-xl w-full sm:w-auto sm:min-w-[170px] min-w-0">${categoriesOptions}</select>
          </div>
          <button type="button" class="btn-ghost h-10 w-full sm:w-auto !py-0 px-3 rounded-xl text-[11px] font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap" title="افزودن دسته‌جمعی محصولات" onclick="openAryaBulkImport()"> افزودن دسته‌جمعی</button>

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
          " class="btn-primary h-10 w-full sm:w-auto !py-0 px-3.5 rounded-xl inline-flex items-center justify-center gap-1.5 text-[11px] sm:text-sm font-bold whitespace-nowrap" type="button">
            ${typeof aryIcon === 'function' ? aryIcon('plus', 'w-4 h-4') : ''}<span>افزودن محصول جدید</span>
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
              <div class="glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 animate-fade min-w-0 cursor-pointer hover:bg-white/[.06] transition-colors" title="کلیک روی کارت = ویرایش محصول" style="animation-delay:${i * 0.05}s" onclick="openAryaProductEdit('${product.id}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'){openAryaProductEdit('${product.id}')}">
                <div class="w-full sm:w-16 h-24 sm:h-16 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                  ${ hasImage ? `<img src="${imgSrc}" alt="${escapeHtml(product.title)}" class="w-full h-full object-cover">` : `<span class="text-3xl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.7rem;height:1.7rem;vertical-align:-0.15em" aria-hidden="true"><path d="m21 8-9-5-9 5v8l9 5 9-5V8Zm-9 5L3 8m18 0-9 5m-6-9 9 5 9-5m-9 13V13"/></svg></span>` }
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
                  <button onclick="event.stopPropagation(); openAryaProductEdit('${product.id}')" class="p-3 glass rounded-xl hover:bg-white/10 transition-all" type="button" title="ویرایش"><i class="ri-edit-line text-base"></i></button>

                  <button onclick="event.stopPropagation(); confirmDeleteProduct('${product.id}', '${escapeJs(product.title)}')" title="حذف" class="p-3 glass rounded-xl hover:bg-rose-500/20 text-rose-400 transition-all" type="button"><i class="ri-delete-bin-line text-base"></i></button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="glass rounded-3xl p-16 text-center">
          <div class="mb-6 animate-float flex items-center justify-center text-white/25">
            ${typeof aryIcon === 'function' ? aryIcon('box', 'w-20 h-20') : '<span class="text-7xl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:3.2rem;height:3.2rem;vertical-align:-0.15em" aria-hidden="true"><path d="m21 8-9-5-9 5v8l9 5 9-5V8Zm-9 5L3 8m18 0-9 5m-6-9 9 5 9-5m-9 13V13"/></svg></span>'}
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
    <div class="animate-fade w-full" data-pf-root>
      <div class="glass-strong rounded-3xl p-5 lg:p-8 max-w-4xl mx-auto">
        <div class="flex items-center justify-between gap-3 mb-6">
          <h2 class="text-xl font-black">${isEdit ? ' ویرایش محصول' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.15rem;height:1.15rem;vertical-align:-0.15em" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg> محصول جدید'}</h2>
          <button type="button" class="btn-ghost px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5" onclick="state.editProduct=null; state.productDraft=null; render()">↩ بازگشت به لیست محصولات</button>
        </div>
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
                  </div>` : `<div class="text-4xl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:2.3rem;height:2.3rem;vertical-align:-0.15em" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.4"/></svg></div><p class="text-sm text-white/70 text-center">برای انتخاب تصویر کلیک کنید</p>` }
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
                <div class="inline-flex"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.7rem;height:1.7rem;color:#bfdbfe" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.4"/></svg></div>
                <p class="text-sm text-white/70 text-center">برای افزودن تصاویر کلیک کنید</p>
                <input id="gallery-image-input" type="file" accept="image/*" multiple class="hidden" onchange="handleGalleryFiles(this.files)">
              </div>
            </div>

            <div>
              <label class="block text-sm text-white/70 mb-2">مقالهٔ خودِ محصول <span class="text-[10px] text-white/40 font-normal">(فقط در صفحهٔ همین محصول — مستقل از تب بلاگ)</span></label>
              <button type="button" onclick="openArticleEditor()" class="btn-primary w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2">${window.aryWpIco ? aryWpIco('edit-line') : '<span></span>'}<span>${d.article ? 'ویرایش مقالهٔ محصول' : 'نوشتن مقالهٔ محصول'}</span></button>
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
                <div class="text-3xl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.7rem;height:1.7rem;vertical-align:-0.15em" aria-hidden="true"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8Z"/></svg></div>
                <p class="text-sm text-white/70 text-center">برای افزودن ویدیو کلیک کنید</p>
                <input id="video-upload-input" type="file" accept="video/*" multiple class="hidden" onchange="handleVideoFilesUpload(this.files)">
              </div>
            </div>

          </div>

          <div class="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-4 mt-8">
            ${ isEdit ? `<button type="button" class="btn-danger w-full sm:flex-1 py-3.5 sm:py-4 rounded-xl font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap" onclick="confirmDeleteProductFromModal('${product.id}', '${escapeJs(product.title)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7m4 4v6m4-6v6"/></svg><span>حذف محصول</span></button>` : '' }
            <button type="button" onclick="clearProductDraft()" class="btn-ghost w-full sm:flex-1 py-3.5 sm:py-4 rounded-xl font-semibold text-center whitespace-nowrap">انصراف</button>
            <button type="submit" class="btn-primary w-full sm:flex-1 py-3.5 sm:py-4 rounded-xl font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap text-center" ${state.loading ? 'disabled' : ''}>${state.loading ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 1.8"/></svg>' : isEdit ? 'بروزرسانی' : 'ذخیره'}</button>
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
    icon: 'trash',
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
    icon: 'trash',
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
    article: (window.aryProductArticleHtml ? aryProductArticleHtml(state.productDraft.article) : (window.arySanitizeHtml ? arySanitizeHtml(state.productDraft.article) : String(state.productDraft.article || ""))),
    videos: state.productDraft.videos || [],
    title: formEl.title.value.trim(), category: formEl.category.value || '', price,
    stock: Number(formEl.stock.value || 0), description: formEl.description ? formEl.description.value || '' : '',
    main_image: state.productDraft.mainImage, image: state.productDraft.mainImage,
    images: state.productDraft.gallery.filter(Boolean), original_price: original_price > 0 ? original_price : 0
  };
  if (state.editProduct && state.editProduct.id) {
    const updated = updateProduct(state.editProduct.id, payload);
    if (updated) toast('تغییرات محصول ذخیره شد ', 'success');
    state.editProduct = null; state.productDraft = null; render(); return;
  }
  const created = createProduct(payload);
  if (created) toast('محصول ذخیره شد ', 'success');
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
  const d = state.productDraft;
  state._prevEditProduct = state.editProduct || null;
  state.blogEdit = {
    id: null, title: '', body: String(d.article || ''),
    excerpt: '', cover: '', tags: '', author: '', status: 'published',
    media: Array.isArray(d.articleMedia) ? d.articleMedia.slice() : [],
    _code: false, _isProduct: true
  };
  state.articleEditor = String(d.article || '');
  state.currentScreen = null;
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
    
    toast(' تنظیمات سئو ذخیره شد', 'success');
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
  
  toast(' مقاله ذخیره شد', 'success'); 
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
            ${previewMode ? '<span class="preview-mode-active"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4-4"/></svg> حالت پیش‌نمایش</span>' : ''}
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

// ═════════════════ ADMIN: صفحهٔ اختصاصی دیتابیس (به‌جای پاپ‌آپ) ═════════════════
function renderAdminDatabasePage() {
  setTimeout("typeof aryAdminDbLoadPanels==='function' && aryAdminDbLoadPanels()", 80);
  const ai = (n, c) => (typeof aryIcon === 'function' ? aryIcon(n, c) : '');
  return `
    <div class="animate-fade max-w-4xl">
      <div class="mb-6">
        <h1 class="text-2xl lg:text-3xl font-black flex items-center gap-2.5"><span class="inline-flex text-blue-300">${ai('database', 'w-7 h-7')}</span><span>دیتابیس فروشگاه</span></h1>
        <p class="text-sm text-white/55 mt-1.5">وضعیت اتصال، آمار جداول و دریافت نسخهٔ پشتیبان — همه در همین صفحه.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <button type="button" onclick="downloadDbSQL()" class="glass rounded-2xl p-5 hover:bg-white/10 transition-colors text-center">
          <div class="text-2xl mb-2"></div>
          <div class="font-bold">دانلود SQL</div>
          <div class="text-xs text-white/50 mt-1">قابل Import در phpMyAdmin</div>
        </button>
        <button type="button" onclick="downloadDbJSON()" class="glass rounded-2xl p-5 hover:bg-white/10 transition-colors text-center">
          <div class="text-2xl mb-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.4rem;height:1.4rem;vertical-align:-0.15em" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4a2 2 0 0 1 6 0"/><rect x="9" y="2.5" width="6" height="3.5" rx="1"/></svg></div>
          <div class="font-bold">دانلود JSON</div>
          <div class="text-xs text-white/50 mt-1">فرمت استاندارد</div>
        </button>
      </div>

      <div class="glass rounded-2xl p-5 mb-4">
        <div class="font-bold mb-3 flex items-center gap-2"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg></span><span>آمار جداول</span></div>
        <div id="db-stats-container" class="space-y-2">
          <div class="text-white/50 text-xs animate-pulse">در حال بارگذاری…</div>
        </div>
      </div>

      <div class="glass rounded-2xl p-5 mb-4" style="background:rgba(59,130,246,.07);border-color:rgba(59,130,246,.25)">
        <div class="font-bold mb-2 flex items-center gap-2"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l2.5-2.5a5 5 0 0 0-7-7L11.5 6.5"/><path d="M14 11a5 5 0 0 0-7.5-.5L4 13a5 5 0 0 0 7 7l2.5-2.5"/></svg></span><span>وضعیت سرور و دیتابیس</span></div>
        <div id="sys-status-box" class="text-xs text-white/60">در حال دریافت…</div>
        <p class="text-[11px] text-white/40 mt-2 leading-relaxed">
          اتصال از طریق ویزارد نصب صفحه اصلی انجام می‌شود (MySQL/MariaDB، PostgreSQL، SQLite، SQL Server — و راهنمای سریع XAMPP/phpMyAdmin)
          و پشتیبانی از پنل‌های cPanel/DirectAdmin/Plesk برای ساخت خودکار دیتابیس.
          نمونه تنظیمات دستی: <code class="text-blue-300">config.sample.php</code>
        </p>
      </div>

      <div class="glass rounded-2xl p-5">
        <div class="font-bold mb-2 text-emerald-300 flex items-center gap-2"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg></span><span>راهنمای بازیابی در phpMyAdmin</span></div>
        <ol class="text-xs text-white/60 space-y-1.5 list-decimal list-inside">
          <li>فایل SQL را از همین صفحه دانلود کنید</li>
          <li>وارد phpMyAdmin هاست شوید</li>
          <li>یک دیتابیس جدید بسازید (ترجیحاً با نام موجود در config)</li>
          <li>تب Import را بزنید و فایل SQL را آپلود کنید</li>
          <li>پس از Import، آدرس‌دهی config را ست کرده و سایت را باز کنید</li>
        </ol>
      </div>
    </div>
  `;
}

window.aryAdminDbLoadPanels = async function () {
  const box = document.getElementById('sys-status-box');
  if (box) {
    if (!(window.AryaServer && AryaServer.isConfigured())) {
      box.innerHTML = 'حالت محلی (بدون سرور) — داده‌ها فقط در IndexedDB همین مرورگر ذخیره می‌شوند.';
    } else {
      try {
        const j = await adminApiCall('system_status', {});
        if (j && j.ok && j.data) {
          const d = j.data;
          const ext = Object.entries(d.extensions || {}).map(([k, v]) => `<span class="${v ? 'text-emerald-400' : 'text-rose-400'}">${escapeHtml(k)}:${v ? '✓' : '✗'}</span>`).join(' · ');
          box.innerHTML = `موتور فعال: <b class="text-white/85">${escapeHtml(String(d.label || d.driver || '—'))}</b> · نسخه: ${escapeHtml(String(d.version || '—'))}${ext ? '<br>' + ext : ''}`
            + (d.demo_mode ? '<br><span class="text-amber-300"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg> DEMO_MODE روشن است — کدهای OTP در پاسخ API برگردانده می‌شوند.</span>' : '');
        } else box.textContent = 'دریافت وضعیت ناموفق بود.';
      } catch (e) { box.textContent = 'دریافت وضعیت ناموفق بود.'; }
    }
  }
  const container = document.getElementById('db-stats-container');
  if (!container) return;
  try {
    if (window.AryaDB && AryaDB.isReady && AryaDB.isReady()) {
      await AryaDB.syncState();
      const stats = await AryaDB.getStats();
      const icons = { products: 'box', orders: 'cart', users: 'users', categories: 'archive', tickets: 'chat', reviews: 'star', admins: 'settings', blog: 'filetext', settings: 'compass' };
      const labels = { products: 'محصولات', orders: 'سفارشات', users: 'کاربران', categories: 'دسته‌بندی‌ها', tickets: 'تیکت‌ها', reviews: 'نظرات', admins: 'مدیران', blog: 'مقالات بلاگ', settings: 'تنظیمات' };
      container.innerHTML = Object.entries(stats).filter(([k]) => k !== 'settings').map(([k, v]) => `
        <div class="flex items-center justify-between text-xs">
          <span class="flex items-center gap-2"><span>${aryIcon(icons[k] || 'info', 'w-4 h-4')}</span><span>${labels[k] || k}</span></span>
          <span class="font-bold text-blue-400">${v} رکورد</span>
        </div>`).join('') || '<div class="text-xs text-white/45">موردی یافت نشد.</div>';
    } else {
      const statMap = {
        products: (state.products || []).length,
        orders: (state.orders || []).length,
        users: (() => { try { return JSON.parse(localStorage.getItem('arya_users_v1') || '[]').length; } catch (e) { return 0; } })(),
        categories: (state.categories || []).length,
        tickets: (state.tickets || []).length,
        reviews: (state.reviews || []).length,
        blog: (state.blog || []).length
      };
      container.innerHTML = Object.entries(statMap).map(([k, v]) => `
        <div class="flex items-center justify-between text-xs">
          <span>${k}</span><span class="font-bold text-blue-400">${v}</span>
        </div>`).join('');
    }
  } catch (e) {
    container.innerHTML = '<p class="text-xs text-white/50">خطا در بارگذاری آمار</p>';
  }
};

function showDbExportPanel() { state.adminTab = 'database'; if (typeof render === 'function') render(); }

// ═════════════════ ADMIN: تب بلاگ — فهرست + ویرایشگر تمام‌صفحه با بلوک رسانه ═════════════════
function aryBlogParseMedia(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim()) { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch (e) { return []; } }
  return [];
}
async function aryAdminBlogRows() {
  try {
    if (window.AryaServer && AryaServer.isConfigured && AryaServer.isConfigured()) {
      const r = await AryaServer.crud.getAll('blog');
      if (r && r.ok && Array.isArray(r.data)) return r.data;
    } else if (window.AryaDB && AryaDB.isReady && AryaDB.isReady()) {
      const rows = await AryaDB.getAll('blog');
      if (Array.isArray(rows)) return rows;
    }
  } catch (e) {}
  return Array.isArray(state.blog) ? state.blog : [];
}
window.aryAdminBlogRefresh = async function () {
  state.blog = await aryAdminBlogRows();
  render();
};

function renderAdminBlogTab() {
  setTimeout("typeof aryAdminBlogRefresh==='function' && (!state.blog || !state.blog.length) && aryAdminBlogRefresh()", 40);
  if (state.blogEdit) { setTimeout('window.aryBlogWpMount && window.aryBlogWpMount()', 30); return renderAdminBlogEditor(); }
  const posts = (Array.isArray(state.blog) ? state.blog.slice() : [])
    .sort((a, b) => String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || '')));
  const fmt = v => { try { return new Date(v).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return ''; } };
  return `
    <div class="animate-fade max-w-5xl">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-black">بلاگ (${posts.length})</h1>
          <p class="text-xs text-white/50 mt-1.5">مقالات «منتشر» در صفحهٔ بلاگ سایت دیده می‌شوند؛ پیش‌نویس فقط همین‌جا هست.</p>
        </div>
        <button type="button" class="btn-primary px-5 py-3 rounded-xl text-sm font-bold" onclick="aryAdminBlogNew()">+ مقالهٔ جدید</button>
      </div>
      ${posts.length === 0
        ? `<div class="glass rounded-2xl p-10 text-center text-white/55 text-sm">هنوز مقاله‌ای ثبت نشده — با دکمهٔ «مقالهٔ جدید» شروع کنید.</div>`
        : `<div class="space-y-2.5">
            ${posts.map(p => `
              <div class="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
                <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold ${p.status === 'published' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25' : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'}">${p.status === 'published' ? 'منتشر ✓' : 'پیش‌نویس'}</span>
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-sm truncate">${escapeHtml(p.title || '(بدون عنوان)')}</div>
                  <div class="text-[11px] text-white/40 mt-0.5">${p.created_at ? fmt(p.created_at) : ''}${p.author ? ' • ' + escapeHtml(p.author) : ''} • ${aryBlogParseMedia(p.media).length} رسانه</div>
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" class="p-2 glass rounded-xl text-sm text-blue-200 hover:bg-blue-500/15" title="ویرایش" aria-label="ویرایش مقاله" onclick="aryAdminBlogEdit('${escapeHtml(String(p.id))}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1rem;height:1rem;vertical-align:-0.15em" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                  <button type="button" class="p-2 glass rounded-xl text-rose-400 hover:bg-rose-500/20 text-sm" title="حذف" onclick="aryAdminBlogDelete('${escapeHtml(String(p.id))}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7m4 4v6m4-6v6"/></svg></button>
                </div>
              </div>`).join('')}
          </div>`}
    </div>
  `;
}

function renderAdminBlogEditor() {
  const m = state.blogEdit;
  const isProd = !!m._isProduct;
  const prodTitle = isProd ? String((state.productDraft || {}).title || 'محصول') : '';
  const escAttr = v => escapeHtml(String(v ?? ''));
  const ico = (n) => (window.aryWpIco ? window.aryWpIco(n) : '');
  const hasDraft = !!(window.AryaWp && AryaWp.draft(isProd ? 'product_article' : 'blog_' + (m.id || 'new')));
  const mediaRows = m.media.map((md, i) => `
    <div class="glass rounded-xl p-3 space-y-2">
      <div class="flex flex-wrap items-center gap-2">
        <select class="input-style text-xs py-1.5" onchange="state.blogEdit.media[${i}].type=this.value">${(isProd ? ['image'] : ['image', 'video', 'embed']).map(t => `<option value="${t}"${md.type === t ? ' selected' : ''}>${t === 'image' ? 'تصویر' : t === 'video' ? 'ویدیو' : 'کد جاسازی (iframe)'}</option>`).join('')}</select>
        <select class="input-style text-xs py-1.5" onchange="state.blogEdit.media[${i}].size=this.value">${[['full', 'عرض کامل'], ['half', 'نصف'], ['third', 'یک‌سوم']].map(t => `<option value="${t[0]}"${(md.size || 'full') === t[0] ? ' selected' : ''}>${t[1]}</option>`).join('')}</select>
        <select class="input-style text-xs py-1.5" onchange="state.blogEdit.media[${i}].align=this.value">${[['center', 'وسط'], ['start', 'راست'], ['end', 'چپ']].map(t => `<option value="${t[0]}"${(md.align || 'center') === t[0] ? ' selected' : ''}>${t[1]}</option>`).join('')}</select>
        <label class="inline-flex items-center gap-1.5 text-[11px] text-white/60"><input type="checkbox" ${md.radius !== false ? 'checked' : ''} onchange="state.blogEdit.media[${i}].radius=this.checked" class="accent-blue-500"><span>گِرد</span></label>
        <span class="mr-auto flex items-center gap-1 shrink-0">
          <button type="button" class="p-1.5 rounded-lg glass text-xs" title="بالا" onclick="aryAdminBlogMediaMove(${i},-1)" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="p-1.5 rounded-lg glass text-xs" title="پایین" onclick="aryAdminBlogMediaMove(${i},1)" ${i === m.media.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="p-1.5 rounded-lg glass text-blue-300 hover:bg-blue-500/15" title="درج در انتهای متن مقاله" onclick="aryBlogWpMediaInsert(${i})">${ico('image-line')}</button>
          <button type="button" class="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 text-xs" title="حذف" onclick="aryAdminBlogMediaDel(${i})">✕</button>
        </span>
      </div>
      <input class="input-style w-full text-xs" dir="ltr" placeholder="آدرس فایل (https://…) یا URL ویدیو" value="${escAttr(md.url || '')}" oninput="state.blogEdit.media[${i}].url=this.value">
      <input class="input-style w-full text-xs" placeholder="زیرنویس (اختیاری)" value="${escAttr(md.caption || '')}" oninput="state.blogEdit.media[${i}].caption=this.value">
    </div>`).join('');
  const tb = (fn, title, icon) => `<button type="button" class="ary-wp-tbtn" title="${title}" aria-label="${title}" onmousedown="event.preventDefault()" onclick="${fn}">${ico(icon)}</button>`;
  const sep = '<span class="ary-wp-sep"></span>';
  return `
    <div class="ary-wp-root">
      <div class="ary-wp-bar">
        <div class="ary-wp-toprow">
          <button type="button" class="ary-wp-back" title="بازگشت" onmousedown="event.preventDefault()" onclick="aryBlogWpCancel()">${ico('close-line')}<span>خروج از ویرایش</span></button>
          <span class="ary-wp-doctitle">${isProd ? 'ویرایش مقالهٔ محصول' : (m.id ? 'ویرایش مقاله' : 'مقالهٔ تازه')}</span>
          <span class="ary-wp-saved mr-auto hidden sm:inline" id="ary-wp-saved">${hasDraft ? 'پیش‌نویس خودکار بازیابی‌شدنی است' : ''}</span>
          <span class="text-[10px] tabular-nums text-white/45" id="ary-wp-wcount">—</span>
          <span class="text-[10px] tabular-nums text-white/30" id="ary-wp-ccount"></span>
          ${m.id ? '' : (hasDraft ? '<button type="button" class="btn-ghost !py-1.5 px-3 rounded-lg text-[11px] font-bold whitespace-nowrap" onclick="aryBlogWpRecoverDraft()">⟳ بازیابی پیش‌نویس</button>' : '')}
          <button type="button" class="btn-primary !py-1.5 px-3.5 rounded-lg text-[11px] font-black whitespace-nowrap inline-flex items-center gap-1.5" onclick="aryBlogWpSave()">${ico('save-line')}<span>ذخیره</span></button>
        </div>
        <div class="ary-wp-tools" role="toolbar" aria-label="قالب‌بندی">
          <select class="ary-wp-blocksel" title="نوع بلوک" onchange="aryBlogWpBlock(this)">
            <option value="">¶ پاراگراف</option><option value="h2">H2 تیتر بخش</option><option value="h3">H3 تیتر فرعی</option><option value="h4">H4 ریزتیتر</option><option value="blockquote"> نقل‌قول</option><option value="pre"> کد</option>
          </select>
          ${sep}
          ${tb("AryaWp.exec('bold')", 'پررنگ', 'bold')}${tb("AryaWp.exec('italic')", 'کج', 'italic')}${tb("AryaWp.exec('underline')", 'زیرخط', 'underline')}${tb("AryaWp.exec('strikeThrough')", 'خط‌خورده', 'strikethrough')}
          ${sep}
          ${tb("AryaWp.exec('justifyRight')", 'راست‌چین', 'align-right')}${tb("AryaWp.exec('justifyCenter')", 'وسط‌چین', 'align-center')}${tb("AryaWp.exec('justifyLeft')", 'چپ‌چین', 'align-left')}${tb("AryaWp.exec('justifyFull')", 'دوکشیده', 'align-justify')}
          ${sep}
          ${tb("AryaWp.exec('insertUnorderedList')", 'لیست نشانه‌دار', 'list-unordered')}${tb("AryaWp.exec('insertOrderedList')", 'لیست عددی', 'list-ordered')}
          ${sep}
          ${tb("AryaWp.exec('formatBlock','blockquote')", 'نقل‌قول', 'double-quotes-l')}${tb("AryaWp.linkPop()", 'درج لینک', 'link')}${tb("AryaWp.exec('unlink')", 'حذف لینک', 'unlink')}${tb("aryBlogWpInsertTable()", 'جدول', 'table-line')}${tb("AryaWp.insertHTML('<hr>')", 'خط جداکننده', 'separator')}
          ${sep}
          ${tb("aryBlogWpMediaAdd('image')", 'تصویر (پایین صفحه)', 'image-line')}${isProd ? '' : tb("aryBlogWpMediaAdd('video')", 'ویدیو', 'video-line')}
          ${sep}
          ${tb("AryaWp.undo()", 'بازگشت (Ctrl+Z)', 'arrow-go-back-line')}${tb("AryaWp.redo()", 'جلو (Ctrl+Y)', 'arrow-go-forward-line')}${tb("AryaWp.exec('removeFormat')", 'پاک‌کردن قالب‌بندی', 'eraser')}
          ${sep}
          <button type="button" class="ary-wp-tbtn ${m._code ? 'is-on' : ''}" title="${m._code ? 'نمایش دیداری' : 'ویرایش کد HTML'}" onmousedown="event.preventDefault()" onclick="aryBlogWpToggleCode()">${ico('code-line')}</button>
        </div>
      </div>
      <div class="ary-wp-scroll">
        <article class="ary-wp-paper">
          ${m._code ? `
            <textarea id="ary-wp-code" class="ary-wp-code" dir="ltr" spellcheck="false" oninput="state.blogEdit.body=this.value">${escAttr(m.body || '')}</textarea>
          ` : `
            ${isProd ? '' : `<input id="ary-wp-title" class="ary-wp-title" placeholder="عنوان مقاله…" value="${escAttr(m.title || '')}" oninput="state.blogEdit.title=this.value">`}
            <div id="ary-wp-body" class="ary-wp-content" contenteditable="true" data-ph="بدنهٔ مقاله را همین‌جا بنویسید — از منوی بالا تیتر، لیست، لینک و رسانه اضافه کنید…" data-oninput="aryBlogWpSync" oninput="aryBlogWpSync(this.innerHTML); AryaWp.refreshState()" onkeydown="if((event.ctrlKey||event.metaKey)&amp;&amp;event.key.toLowerCase()==='s'){event.preventDefault();aryBlogWpSave();}">${m.body || ''}</div>
          `}
        </article>
        <div class="ary-wp-under">
          <details class="glass-strong rounded-2xl p-4 lg:p-5">
            <summary class="cursor-pointer text-sm font-bold text-white/80 select-none">${isProd ? ' رسانه‌های مقاله — بلوک‌های تصویر/ویدیو؛ با دکمهٔ «درج» داخل متن قرار می‌گیرند' : ' تنظیمات مقاله — وضعیت، نویسنده، چکیده، تصویر جلد، رسانه‌ها'}</summary>
            ${isProd ? '' : `<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div>
                <label class="block text-xs text-white/60 mb-1.5 font-bold">وضعیت</label>
                <select class="input-style w-full" onchange="state.blogEdit.status=this.value">
                  <option value="draft"${m.status !== 'published' ? ' selected' : ''}>پیش‌نویس (فقط ادمین)</option>
                  <option value="published"${m.status === 'published' ? ' selected' : ''}>انتشار در سایت ✓</option>
                </select>
              </div>
              <div><label class="block text-xs text-white/60 mb-1.5 font-bold">نویسنده</label><input class="input-style w-full text-sm" value="${escAttr(m.author || '')}" oninput="state.blogEdit.author=this.value" placeholder="تیم آریا"></div>
              <div><label class="block text-xs text-white/60 mb-1.5 font-bold">برچسب‌ها (با ویرگول)</label><input class="input-style w-full text-sm" value="${escAttr(m.tags || '')}" oninput="state.blogEdit.tags=this.value" placeholder="هدفون، راهنمای خرید"></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label class="block text-xs text-white/60 mb-1.5 font-bold">تصویر جلد (URL)</label>
                <div class="flex gap-2 items-start">
                  <input class="input-style w-full text-sm" dir="ltr" value="${escAttr(m.cover || '')}" oninput="state.blogEdit.cover=this.value; document.getElementById('blog-cover-prev').src=this.value; document.getElementById('blog-cover-prev').classList.remove('hidden')" placeholder="https://…/cover.jpg">
                  <img id="blog-cover-prev" src="${escAttr(m.cover || '')}" class="w-16 h-16 object-cover rounded-xl border border-white/10 shrink-0 ${m.cover ? '' : 'hidden'}" onerror="this.classList.add('hidden')" alt="">
                </div>
              </div>
              <div>
                <label class="block text-xs text-white/60 mb-1.5 font-bold">چکیده (نمایش در کارت فهرست)</label>
                <textarea id="blog-excerpt" class="input-style w-full resize-none" rows="2" maxlength="600" oninput="state.blogEdit.excerpt=this.value">${escAttr(m.excerpt || '')}</textarea>
                <button type="button" class="text-[10px] font-bold mt-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition" onclick="aryBlogExcerpt()"> چکیده خودکار از متن</button>
              </div>
            </div>
            `}<div class="mt-4">
              <div class="flex flex-wrap items-center gap-2 mb-2">
                <label class="text-xs text-white/60 font-bold">بلوک‌های رسانه (بین متن مقاله)</label>
                <span class="mr-auto flex gap-1.5 shrink-0">
                  <button type="button" class="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition" onclick="aryAdminBlogMediaAdd('image')">+ تصویر</button>
                  <button type="button" class="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition" onclick="aryAdminBlogMediaAdd('video')">+ ویدیو</button>
                  <button type="button" class="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition" onclick="aryAdminBlogMediaAdd('embed')">+ iframe</button>
                </span>
              </div>
              ${mediaRows ? `<div class="space-y-2.5">${mediaRows}</div>` : `<div class="text-[11px] text-white/40 glass rounded-xl px-4 py-3">${isProd ? 'فعلاً بلوک رسانه‌ای ندارید — افزودن تصویر، مقاله را زنده می‌کند.' : 'فعلاً بلوک رسانه‌ای ندارید — تصویر یا ویدیوی درشت، مقاله را زنده می‌کند. بلوک ویدیو را با کشیدن یا دکمه‌های ↑↓ روی همان بلوک، جابه‌جا کنید.'}</div>`}
            </div>
          </details>
          <div class="flex flex-wrap items-center gap-3 pt-1 pb-2">
            <button type="button" class="btn-primary px-6 py-3 rounded-xl font-bold text-sm" onclick="aryBlogWpSave()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="M5 4h11l3 3v13H5Z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/></svg> ذخیرهٔ مقاله</button>
            <button type="button" class="btn-ghost px-4 py-3 rounded-xl text-sm whitespace-nowrap" onclick="aryBlogWpCancel()">انصراف</button>
            <span class="text-[11px] text-white/40 mr-auto">${isProd ? ('مقالهٔ «' + escAttr(prodTitle.slice(0, 40)) + '»') : (m.id ? 'ویرایش «' + escAttr((m.title || '').slice(0, 40)) + '»' : 'مقالهٔ تازه')} — Ctrl+S ذخیره می‌کند</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
window.aryBlogWpSync = function (html) {
  if (state.blogEdit) state.blogEdit.body = window.aryWpCleanBody ? window.aryWpCleanBody(String(html || '')) : String(html || '');
};
window.aryBlogWpBlock = function (sel) { const v = sel.value; sel.value = ''; if (v) window.AryaWp && AryaWp.block(v); };
window.aryBlogWpInsertTable = function () {
  if (!window.AryaWp) return;
  AryaWp.insertHTML('<table><tbody><tr><th>سرستون ۱</th><th>سرستون ۲</th></tr><tr><td>مقدار</td><td>مقدار</td></tr></tbody></table><p><br></p>');
};
window.aryBlogWpMediaAdd = function (t) {
  if (!state.blogEdit) return;
  if (state.blogEdit._isProduct && String(t) !== 'image') { toast('در مقالهٔ محصول فقط تصویر مجاز است (ویدیو حذف شده)', 'warning'); return; }
  state.blogEdit.media = state.blogEdit.media || [];
  state.blogEdit.media.push({ type: t, url: '', caption: '', size: 'full', align: 'center', radius: true });
  render();
  const d = document.querySelector('.ary-wp-under details'); if (d) d.open = true;
  setTimeout(() => { const rows = document.querySelectorAll('.ary-wp-under .glass.rounded-xl'); const last = rows[rows.length - 1]; last && last.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 80);
};
window.aryBlogWpMediaInsert = function (i) {
  const m = state.blogEdit; const md = m && m.media && m.media[i];
  if (!md || !String(md.url || '').trim()) { toast('اول آدرس فایل این رسانه را پر کنید', 'warning'); return; }
  if (!window.AryaWp) return;
  if (md.type === 'code') {}
  AryaWp.block('p');
  const u = String(md.url).replace(/"/g, '&quot;');
  const cap = String(md.caption || '').replace(/</g, '');
  let html;
  const FIG = '<figure data-ary-media="1">';
  if (md.type === 'video') html = FIG + '<video controls preload="metadata" src="' + u + '" style="width:100%;' + (md.radius !== false ? 'border-radius:16px' : '') + '"></video>' + (cap ? '<figcaption>' + cap + '</figcaption>' : '') + '</figure>';
  else if (md.type === 'embed') {
    const thumb = window.aryYoutubeThumbUrl ? aryYoutubeThumbUrl(md.url) : '';
    html = FIG + '<div class="ary-wp-embed" data-embed-src="' + u + '"' + (thumb ? ' data-embed-thumb="' + thumb + '"' : '') + ' style="aspect-ratio:16/9;background:#0b1526;color:#93c5fd;display:flex;align-items:center;justify-content:center;font-size:12px;border-radius:12px;background-size:cover;background-position:center">پلیر ویدیو — پس از ذخیره در سایت پخش می‌شود (جابه‌جایی: کشیدن بلوک یا ↑↓)</div>' + (cap ? '<figcaption>' + cap + '</figcaption>' : '') + '</figure>';
  }
  else html = FIG + '<img src="' + u + '" alt="' + cap + '" style="width:100%;' + (md.radius !== false ? 'border-radius:16px' : '') + '">' + (cap ? '<figcaption>' + cap + '</figcaption>' : '') + '</figure>';
  AryaWp.insertHTML(html + '<p><br></p>');
  if (window.aryWpSyncBody) window.aryWpSyncBody();
  if (window.aryWpDecorateMedia) setTimeout(function () { window.aryWpDecorateMedia(); }, 20);
  toast('رسانه در متن درج شد ✓ — با کشیدن بلوک یا دکمه‌های ↑↓ جایش را عوض کنید', 'success');
};
window.aryBlogWpToggleCode = function () {
  const m = state.blogEdit; if (!m) return;
  const live = document.getElementById('ary-wp-body'); if (live) m.body = (window.aryWpCleanBody ? window.aryWpCleanBody(live.innerHTML) : live.innerHTML);
  const ta = document.getElementById('ary-wp-code'); if (ta) m.body = ta.value;
  const ti = document.getElementById('ary-wp-title'); if (ti) m.title = ti.value;
  m._code = !m._code; render();
};
window.aryBlogWpSave = async function () {
  const m = state.blogEdit; if (!m) return;
  const live = document.getElementById('ary-wp-body'); if (live) m.body = (window.aryWpCleanBody ? window.aryWpCleanBody(live.innerHTML) : live.innerHTML);
  const ta = document.getElementById('ary-wp-code'); if (ta) m.body = ta.value;
  const ti = document.getElementById('ary-wp-title'); if (ti) m.title = ti.value;
  window.AryaWp && AryaWp.stopAutosave();
  if (m._isProduct) {
    const txt = String(m.body || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (txt.length < 20) { toast('متن مقاله خیلی کوتاه است (حداقل ۲۰ نویسه).', 'warning'); return; }
    let html = String(m.body || '');
    try { html = window.aryProductArticleHtml ? window.aryProductArticleHtml(html) : arySanitizeHtml(aryStripVideoMedia(html)); } catch (e) {}
    initProductDraft();
    state.productDraft.article = html;
    state.productDraft.articleMedia = (m.media || []).filter(x => x && String(x.url || '').trim());
    state.articleEditor = html;
    state.blogEdit = null;
    try { if (window.AryaWp) AryaWp.clearDraft('product_article'); } catch (e) {}
    render();
    toast('مقالهٔ محصول ذخیره شد — در پیش‌نمایش صفحهٔ محصول هم نمایش داده می‌شود', 'success');
    return;
  }
  await aryAdminBlogSave();
  window.AryaWp && AryaWp.clearDraft(m && m._isProduct ? 'product_article' : 'blog_' + ((m && m.id) || 'new'));
};
window.aryBlogWpCancel = function () {
  const pm = state.blogEdit;
  if (pm && pm._isProduct) {
    const fin = () => { if (window.AryaWp) AryaWp.stopAutosave(); state.blogEdit = null; state.confirmModal = null; render(); };
    const lv = document.getElementById('ary-wp-body');
    const cur = lv ? lv.innerHTML : (pm.body || '');
    if (String(cur || '').trim() !== String(state.productDraft && state.productDraft.article || '').trim()) {
      state.confirmModal = {
        type: 'warning',
        title: 'خروج از ویرایش مقالهٔ محصول',
        message: '<p class="text-xs text-white/60 leading-6 text-start">تغییرات ذخیره‌نشدهٔ این مقاله دور ریخته شود؟</p>',
        confirmText: 'بله، خروج',
        confirmClass: 'bg-rose-600 hover:bg-rose-500 text-white',
        onConfirm: fin,
      };
      render(); return;
    }
    fin(); return;
  }
  const open = state.blogEdit && (state.blogEdit.title || state.blogEdit.body);
  if (open) {
    state.confirmModal = {
      type: 'warning',
      title: 'خروج از ویرایش مقاله',
      message: '<p class="text-xs text-white/60 leading-6 text-start">تغییرات ذخیره‌نشدهٔ این مقاله دور ریخته شود؟ (پیش‌نویس خودکار برای بازیابی نگه داشته می‌شود)</p>',
      confirmText: 'بله، خروج',
      confirmClass: 'bg-rose-600 hover:bg-rose-500 text-white',
      onConfirm: () => { state.confirmModal = null; window.AryaWp && AryaWp.stopAutosave(); state.blogEdit = null; render(); },
    };
    render(); return;
  }
  window.AryaWp && AryaWp.stopAutosave();
  state.blogEdit = null; render();
};
window.aryBlogWpRecoverDraft = function () {
  const m = state.blogEdit; if (!m || !window.AryaWp) return;
  const d = AryaWp.draft(m._isProduct ? 'product_article' : 'blog_' + (m.id || 'new'));
  if (!d || !d.o) { toast('پیش‌نویسی پیدا نشد', 'warning'); return; }
  Object.assign(m, d.o); render();
  toast('پیش‌نویس خودکار بازیابی شد ✓', 'success');
};
/* ───────── رندر/جابه‌جایی بلوک رسانه داخل برگهٔ ویرایشگر ───────── */
window.aryWpCleanBody = function (html) {
  const raw = String(html == null ? '' : html);
  try {
    const doc = new DOMParser().parseFromString('<div id="ary-clean">' + raw + '</div>', 'text/html');
    const root = doc.getElementById('ary-clean'); if (!root) return raw;
    root.querySelectorAll('[data-ary-ui]').forEach(function (n) { n.remove(); });
    root.querySelectorAll('figure[data-ary-media]').forEach(function (f) {
      f.removeAttribute('draggable'); f.removeAttribute('contenteditable');
    });
    return root.innerHTML;
  } catch (e) { return raw.replace(/<div class="ary-wp-media-ui"[\s\S]*?<\/div>(?=<\/figure>)/g, ''); }
};
window.aryWpDecorateMedia = function () {
  const b = document.getElementById('ary-wp-body'); if (!b) return;
  Array.prototype.slice.call(b.querySelectorAll('figure')).forEach(function (f) {
    f.setAttribute('data-ary-media', '1');
    f.setAttribute('contenteditable', 'false');
    f.setAttribute('draggable', 'true');
    const ph = f.querySelector('.ary-wp-embed[data-embed-thumb]');
    if (ph && ph.style) { ph.style.backgroundImage = 'url("' + ph.getAttribute('data-embed-thumb') + '")'; }
    if (f.querySelector(':scope > .ary-wp-media-ui')) return;
    const ui = document.createElement('div');
    ui.className = 'ary-wp-media-ui'; ui.setAttribute('data-ary-ui', '1'); ui.setAttribute('contenteditable', 'false');
    ui.innerHTML = '<span class="ary-wp-media-grip" title="برای جابه‌جایی، بلوک را بکشید">⋮⋮</span>'
      + '<button type="button" title="انتقال به بالای بلوک قبلی" aria-label="انتقال به بالا" onclick="event.preventDefault();event.stopPropagation();window.aryWpMediaMove \u0026\u0026 aryWpMediaMove(this.closest(\'figure\'), -1)">↑</button>'
      + '<button type="button" title="انتقال به پایینِ بلوک بعدی" aria-label="انتقال به پایین" onclick="event.preventDefault();event.stopPropagation();window.aryWpMediaMove \u0026\u0026 aryWpMediaMove(this.closest(\'figure\'), 1)">↓</button>'
      + '<button type="button" class="is-danger" title="حذف از متن (ردیف تنظیمات پایین می‌ماند)" aria-label="حذف بلوک از متن" onclick="event.preventDefault();event.stopPropagation();window.aryWpMediaDetach \u0026\u0026 aryWpMediaDetach(this.closest(\'figure\'))">✕</button>';
    f.appendChild(ui);
  });
  if (window.aryWpMediaDndOn) window.aryWpMediaDndOn(b);
};
window.aryWpSyncBody = function () {
  const b = document.getElementById('ary-wp-body');
  if (b && state.blogEdit) {
    state.blogEdit.body = window.aryWpCleanBody ? window.aryWpCleanBody(b.innerHTML) : b.innerHTML;
    if (window.AryaWp) AryaWp.refreshState();
  }
};
window.aryWpMediaMove = function (fig, dir) {
  if (!fig) return;
  const b = document.getElementById('ary-wp-body'); if (!b) return;
  const figs = Array.prototype.slice.call(b.querySelectorAll('figure[data-ary-media]'));
  const i = figs.indexOf(fig); if (i < 0) return;
  const j = i + (Number(dir) < 0 ? -1 : 1);
  if (j < 0 || j >= figs.length) return;
  const other = figs[j];
  if (Number(dir) < 0) b.insertBefore(fig, other); else b.insertBefore(other, fig);
  window.aryWpSyncBody && window.aryWpSyncBody();
};
window.aryWpMediaDetach = function (fig) {
  if (!fig || !fig.parentNode) return;
  fig.parentNode.removeChild(fig);
  window.aryWpSyncBody && window.aryWpSyncBody();
};
window.aryWpMediaDndOn = function (body) {
  if (!body || body.dataset.dnd === '1') return;
  body.dataset.dnd = '1';
  body.addEventListener('dragstart', function (e) {
    const interactive = e.target && e.target.closest && e.target.closest('button, a, input, textarea, select');
    const fig = e.target && e.target.closest && e.target.closest('figure[data-ary-media]');
    if (interactive || !fig) { try { e.preventDefault(); } catch (err) {} return; }
    window.__aryDragFig = fig;
    fig.classList.add('is-dragging');
    try { e.dataTransfer.setData('text/plain', 'ary-media'); e.dataTransfer.effectAllowed = 'move'; } catch (err) {}
  });
  body.addEventListener('dragover', function (e) {
    const f0 = window.__aryDragFig; if (!f0) return;
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch (err) {}
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const tgt = under && under.closest && under.closest('figure[data-ary-media]');
    if (tgt && tgt !== f0) {
      const r = tgt.getBoundingClientRect();
      if (e.clientY > r.top + r.height / 2) body.insertBefore(f0, tgt.nextSibling); else body.insertBefore(f0, tgt);
    }
  });
  body.addEventListener('drop', function (e) { if (window.__aryDragFig) e.preventDefault(); });
  body.addEventListener('dragend', function () {
    const f0 = window.__aryDragFig;
    window.__aryDragFig = null;
    if (f0) { f0.classList.remove('is-dragging'); window.aryWpSyncBody && window.aryWpSyncBody(); }
  });
};
window.aryBlogWpMount = function () {
  const b = document.getElementById('ary-wp-body');
  if (b) {
    if (!b.dataset.bound) {
      b.dataset.bound = '1';
      b.addEventListener('paste', function (e) {
        try { e.preventDefault(); const t = ((e.clipboardData || window.clipboardData).getData('text/plain') || '').slice(0, 200000); document.execCommand('insertText', false, t); } catch (err) { try { document.execCommand('insertText', false, ''); } catch (e2) {} }
      });
    }
    if (window.AryaWp) AryaWp.refreshState();
    if (window.aryWpDecorateMedia) window.aryWpDecorateMedia();
  }
  const m = state.blogEdit; if (!m || !window.AryaWp) return;
  AryaWp.autosave(m._isProduct ? 'product_article' : 'blog_' + (m.id || 'new'), function () {
    const el = document.getElementById('ary-wp-body'); const code = document.getElementById('ary-wp-code'); const ti = document.getElementById('ary-wp-title');
    if (ti) m.title = ti.value;
    if (el) m.body = window.aryWpCleanBody ? window.aryWpCleanBody(el.innerHTML) : el.innerHTML; if (code) m.body = code.value;
    return { id: m.id || '', title: m.title, body: m.body, excerpt: m.excerpt, cover: m.cover, tags: m.tags, author: m.author, status: m.status, media: m.media };
  });
};

window.aryAdminBlogNew = function () {
  state.blogEdit = { id: null, title: '', excerpt: '', body: '', cover: '', tags: '', author: 'تیم آریا', status: 'draft', media: [], created_at: new Date().toISOString() };
  render();
};
window.aryAdminBlogEdit = async function (id) {
  const rows = state.blog && state.blog.length ? state.blog : await aryAdminBlogRows();
  state.blog = rows;
  const p = rows.find(x => String(x.id) === String(id));
  if (!p) return;
  const copy = JSON.parse(JSON.stringify(p));
  copy.media = aryBlogParseMedia(copy.media);
  state.blogEdit = copy;
  render();
};
window.aryAdminBlogCancel = function () { state.blogEdit = null; render(); };
window.aryAdminBlogMediaAdd = function (type) {
  if (!state.blogEdit) return;
  state.blogEdit.media.push({ type, url: '', caption: '', size: 'full', align: 'center', radius: true });
  render();
};
window.aryAdminBlogMediaDel = function (i) { if (state.blogEdit) { state.blogEdit.media.splice(i, 1); render(); } };
window.aryAdminBlogMediaMove = function (i, d) {
  const a = state.blogEdit && state.blogEdit.media;
  if (!a || i + d < 0 || i + d >= a.length) return;
  const t = a[i]; a[i] = a[i + d]; a[i + d] = t; render();
};
window.aryAdminBlogSave = async function () {
  const m = state.blogEdit;
  if (!m) return;
  if (String(m.title || '').trim().length < 3) { toast('عنوان مقاله کوتاه است (حداقل ۳ حرف).', 'warning'); return; }
  if (String(m.body || '').trim().length < 20) { toast('متن مقاله خیلی کوتاه است.', 'warning'); return; }
  const now = new Date().toISOString();
  const row = {
    id: m.id || ('bp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
    title: String(m.title).trim(), excerpt: String(m.excerpt || '').trim().slice(0, 600),
    body: String(m.body || ''), cover: String(m.cover || '').trim(),
    media: JSON.stringify((m.media || []).filter(x => x && x.url)),
    tags: String(m.tags || '').trim().slice(0, 255), status: m.status === 'published' ? 'published' : 'draft',
    author: String(m.author || 'تیم آریا').trim().slice(0, 80),
    created_at: m.created_at || now, updated_at: now
  };
  try { row.body = arySanitizeHtml(row.body); } catch (e) {}
  {
    const live = document.getElementById('ary-wp-body'); if (live) row.body = live.innerHTML;
    try { row.body = arySanitizeHtml(row.body); } catch (e2) {}
  }
  let okLocal = true;
  try { if (window.AryaDB && AryaDB.isReady && AryaDB.isReady()) await AryaDB.upsert('blog', row); } catch (e) { okLocal = false; }
  let okServer = false;
  try {
    if (window.AryaServer && AryaServer.isConfigured && AryaServer.isConfigured()) {
      const r = await AryaServer.crud.upsert('blog', row);
      okServer = !!(r && r.ok);
      if (!okServer && r && r.msg) toast(r.msg, 'warning');
    }
  } catch (e) {}
  if (!okLocal && !okServer && !(window.AryaServer && AryaServer.isConfigured && AryaServer.isConfigured())) {
    // ذخیرهٔ state به‌هرحال
  }
  state.blog = Array.isArray(state.blog) ? state.blog.slice() : await aryAdminBlogRows();
  const idx = state.blog.findIndex(x => String(x.id) === String(row.id));
  if (idx >= 0) state.blog[idx] = row; else state.blog.unshift(row);
  try { if (window.AppState) AppState.set({ blog: state.blog }); } catch (e) {}
  state.blogEdit = null;
  toast(row.status === 'published' ? 'مقاله ذخیره و در سایت منتشر شد ✓' : 'پیش‌نویس ذخیره شد ✓', 'success');
  render();
};
window.aryAdminBlogDelete = function (id) {
  const p = (state.blog || []).find(x => String(x.id) === String(id));
  if (!p) return;
  state.confirmModal = {
    type: 'delete-blog', title: 'حذف مقاله',
    message: `آیا از حذف «${escapeHtml(p.title || '')}» مطمئن هستید؟`,
    icon: 'trash', confirmText: 'حذف', confirmClass: 'btn-danger',
    onConfirm: async () => {
      state.blog = (state.blog || []).filter(x => String(x.id) !== String(id));
      try { if (window.AryaDB && AryaDB.isReady && AryaDB.isReady()) await AryaDB.remove('blog', id); } catch (e) {}
      try { if (window.AryaServer && AryaServer.isConfigured && AryaServer.isConfigured()) await AryaServer.crud.remove('blog', id); } catch (e) {}
      try { if (window.AppState) AppState.set({ blog: state.blog }); } catch (e) {}
      state.confirmModal = null;
      toast('مقاله حذف شد', 'success');
      render();
    }
  };
  render();
};
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
    toast(' فایل SQL دانلود شد');
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
    toast(' فایل JSON دانلود شد');
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
  setInterval(pull, 15000);
  window.aryAdminLiveSync = pull;
  setTimeout(pull, 2500);   // کورتاه فوری تیکت‌ها/سفارش‌ها هنگام بالا آمدن پنل
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
        <button onclick="loadAdminUsersList()" type="button" class="btn-ghost px-4 py-2.5 rounded-xl text-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg> بروزرسانی</button>
        <button onclick="state.adminUserFormOpen = !state.adminUserFormOpen; render()" type="button" class="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold">
          ${state.adminUserFormOpen ? 'بستن فرم' : '+ حساب مدیر جدید'}
        </button>
      </div>
    </div>

    <div class="glass rounded-xl p-3 mb-5 text-xs text-white/50">
      ℹ حساب‌های مدیر فقط از همین بخش (یا مستقیماً از phpMyAdmin) قابل ایجاد هستند.
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
                <td class="p-3">${u.role === 'superadmin' ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><path d="m2 8 4.5 3.5L12 5l5.5 6.5L22 8l-2 11H4L2 8Z"/></svg> مدیر اصلی' : 'مدیر'}</td>
                <td class="p-3">${Number(u.two_factor_enabled) === 1 ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.05rem;height:1.05rem;vertical-align:-0.15em" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/></svg> فعال' : '—'}</td>
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
    toast(' حساب مدیر جدید ایجاد شد');
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
    icon: '',
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
    toast(' حساب بروزرسانی شد');
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
    icon: 'trash',
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
      if (typeof window.adminLogoutNow === 'function') { try { window.adminLogoutNow(); return; } catch (e) {} }
      try { if (window.AryaServer) AryaServer.call('admin_logout', { method: 'POST' }).catch(() => {}); } catch (e) {}
      location.reload();
    } else if (idle >= WARN && !warned) {
      warned = true;
      if (window.toast) toast('در صورت ادامه بی‌کاری، تا ۱ دقیقه دیگر به‌دلیل امنیت از پنل خارج می‌شوید', 'warning');
    }
  }, 15 * 1000);
})();

// ════════════════════════════════════════════════════════════════
// ARYA ADMIN PREVIEW — پیش‌نمایش زندهٔ سایت داخل پنل (بدون تب/پاپ‌آپ مرورگر)
// ════════════════════════════════════════════════════════════════
const AryaAdminPreview = (function () {
  var root = null, frame = null;
  function ensure() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'ary-admin-preview';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = [
      '<div class="ap-scrim" data-ap-close></div>',
      '<div class="ap-frame" role="dialog" aria-modal="true" aria-label="پیش‌نمایش سایت">',
      '  <div class="ap-bar">',
      '    <span class="ap-title">پیش‌نمایش زندهٔ سایت</span>',
      '    <button type="button" class="ap-btn" data-ap-reload title="بارگذاری مجدد">⟳</button>',
      '    <button type="button" class="ap-btn ap-btn-danger" data-ap-close title="بستن (Esc)">✕ بستن</button>',
      '  </div>',
      '  <div class="ap-load">در حال بارگذاری سایت…</div>',
      '  <iframe title="پیش‌نمایش فروشگاه" src="about:blank"></iframe>',
      '</div>'
    ].join('');
    document.body.appendChild(root);
    frame = root.querySelector('iframe');
    root.addEventListener('click', function (e) { if (e.target.closest('[data-ap-close]')) close(); if (e.target.closest('[data-ap-reload]')) reload(); });
    frame.addEventListener('load', function () { if (frame.src && frame.src !== 'about:blank') root.classList.remove('loading'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('open')) close(); });
    return root;
  }
  function syncTheme() { try { if (frame && frame.contentDocument && frame.contentDocument.documentElement) frame.contentDocument.documentElement.setAttribute('data-aria-theme', document.documentElement.getAttribute('data-aria-theme') || 'dark'); } catch (e) {} }
  function reload() { ensure(); root.classList.add('loading'); try { frame.contentWindow.location.reload(); } catch (e) { frame.src = 'index.html?ap=' + Date.now(); } setTimeout(syncTheme, 600); }
  function open() {
    ensure();
    root.classList.add('open'); root.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (!frame.src || frame.src.endsWith('about:blank')) { root.classList.add('loading'); frame.src = 'index.html' + (window.__ARY_V ? '?v=' + window.__ARY_V : ''); }
    setTimeout(syncTheme, 700); setTimeout(syncTheme, 1800);
    if (window.toast) toast('پیش‌نمایش سایت باز شد — با Esc یا ✕ بسته می‌شود', 'info', 2600);
  }
  function close() { if (!root) return; root.classList.remove('open'); root.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
  return { open: open, close: close };
})();
window.AryaAdminPreview = AryaAdminPreview;

// ════════════════════════════════════════════════════════════════
// ARYA SELECT — ارتقای همهٔ <select>های پنل به لیست‌باکس اختصاصیِ خود اپ
// (هیچ پاپ‌آپ/دراپ‌داونِ مرورگری باز نمی‌شود؛ value و change همان native)
// ════════════════════════════════════════════════════════════════
window.AryaSelect = (function () {
  var openSel = null;
  var CHEV = '<svg class=\"as-chev\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m6 9 6 6 6-6\"/></svg>';
  function closeAll() { if (!openSel) return; try { openSel._asBox.style.display = 'none'; openSel._asBtn.setAttribute('aria-expanded', 'false'); } catch (e) {} openSel = null; }
  document.addEventListener('mousedown', function (e) { if (openSel && openSel._asWrap && !openSel._asWrap.contains(e.target)) closeAll(); }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); }, true);
  function curLabel(sel) {
    for (var i = 0; i < sel.options.length; i++) { if (sel.options[i].selected || String(sel.options[i].value) === String(sel.value)) return sel.options[i].textContent.trim(); }
    return (sel.options[0] && sel.options[0].textContent.trim()) || '—';
  }
  function fill(sel) {
    var box = sel._asBox; box.innerHTML = '';
    Array.prototype.forEach.call(sel.options, function (o) {
      if (o.tagName === 'OPTGROUP') { var g = document.createElement('div'); g.className = 'as-grp'; g.textContent = o.label; box.appendChild(g); }
      var it = document.createElement('button');
      it.type = 'button'; it.className = 'as-item' + (String(o.value) === String(sel.value) ? ' sel' : '');
      it.textContent = o.textContent.trim();
      it.onclick = function (ev) {
        ev.stopPropagation();
        sel.value = o.value; sel.dispatchEvent(new Event('change', { bubbles: true })); sel.dispatchEvent(new Event('input', { bubbles: true }));
        var v = sel._asBtn.querySelector('.as-val'); if (v) v.textContent = o.textContent.trim();
        closeAll();
      };
      box.appendChild(it);
    });
    var sel_ = box.querySelector('.as-item.sel'); if (sel_) box.scrollTop = Math.max(0, sel_.offsetTop - 48);
  }
  function enhance(sel) {
    if (sel._asOn || sel.multiple || sel.size > 1 || sel.classList.contains('as-skip')) return;
    sel._asOn = true;
    var wrap = document.createElement('span'); wrap.className = 'as-wrap' + (sel.dataset.asClass ? ' ' + sel.dataset.asClass : '');
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'as-btn'; btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class=\"as-val\"></span>' + CHEV;
    var box = document.createElement('div'); box.className = 'as-box'; box.setAttribute('role', 'listbox');
    sel._asWrap = wrap; sel._asBtn = btn; sel._asBox = box;
    btn.addEventListener('click', function (ev) { ev.stopPropagation(); if (sel.disabled) return; if (openSel === sel) { closeAll(); return; } closeAll(); openSel = sel; fill(sel); box.style.display = 'block'; btn.setAttribute('aria-expanded', 'true'); });
    sel.addEventListener('change', function () { var v = btn.querySelector('.as-val'); if (v) v.textContent = curLabel(sel); });
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(btn); wrap.appendChild(box); wrap.appendChild(sel);
    sel.classList.add('as-native');
    btn.querySelector('.as-val').textContent = curLabel(sel);
    if (sel.disabled) { btn.disabled = true; }
  }
  function enhanceAll(root) { (root || document).querySelectorAll('select').forEach(enhance); }
  return { enhanceAll: enhanceAll, refresh: function (root) { closeAll(); enhanceAll(root); } };
})();
(function () {
  function boot() {
    var scr = document.getElementById('admin-panel-screen') || document.getElementById('admin-auth-screen');
    if (!scr) return;
    try { window.AryaSelect && AryaSelect.enhanceAll(scr); } catch (e) {}
    new MutationObserver(function () { try { window.AryaSelect && AryaSelect.enhanceAll(scr); } catch (e) {} }).observe(scr, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 1200);
})();
// ═══════════ چارت تعاملی: کلیک = دریل‌داون به لیست سفارشات ═══════════
window.aryChartDrill = function (kind, key) {
  if (!state.orderFilter) state.orderFilter = { status: '', search: '' };
  const f = state.orderFilter;
  let label = '';
  if (kind === 'day') { f.day = (f.day === key ? '' : key); f.month = ''; label = f.day ? ('سفارش‌های ' + _aryFaDay(key)) : 'فیلتر روز حذف شد'; }
  else if (kind === 'month') { f.month = (f.month === key ? '' : key); f.day = ''; label = f.month ? ('سفارشات ماه ' + key.split('-').reverse().join('/')) : 'فیلتر ماه حذف شد'; }
  else if (kind === 'status') { f.status = (f.status === key ? '' : key); const L = { pending: 'در انتظار', processing: 'پردازش', shipped: 'ارسال‌شده', delivered: 'تحویل‌شده', canceled: 'لغوشده' }[key] || key; label = f.status ? ('وضعیت: ' + L) : 'فیلتر وضعیت حذف شد'; }
  const cnt = (state.orders || []).filter(o => (!f.status || (o.status || 'pending') === f.status) && (!f.day || String(o.created_at || o.date || '').slice(0, 10) === f.day) && (!f.month || String(o.created_at || o.date || '').slice(0, 7) === f.month)).length;
  state.adminTab = 'orders';
  if (window.toast) toast(label + (f.status || f.day || f.month ? ' — ' + cnt + ' مورد یافت شد' : ''), 'info', 3200);
  render();
};
function _aryFaDay(k) { try { return new Date(k).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { return k; } }
window.aryClearDateFilters = function () { if (state.orderFilter) { state.orderFilter.day = ''; state.orderFilter.month = ''; } render(); };

// ════════════════════════════════════════════════════════════════
// ARYA COUPONS ADMIN — ساخت/ویرایش کدهای تخفیف (کل سبد، دسته، محصولات، ارسال)
// ════════════════════════════════════════════════════════════════
function renderAdminCoupons() {
  const cs = Array.isArray(state.coupons) ? state.coupons : [];
  const q = String((state.couponQ || '')).trim().toLowerCase();
  const list = q ? cs.filter(c => String(c.code || '').toLowerCase().includes(q)) : cs;
  const now = Date.now();
  const ai = (n, c) => (typeof aryIcon === 'function' ? aryIcon(n, c) : '');
  return `
    <div class="animate-fade">
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <h1 class="text-2xl lg:text-3xl font-black">کدهای تخفیف (${cs.length})</h1>
        <span class="relative w-44 lg:w-56"><span class="absolute right-3 top-1/2 -translate-y-1/2 opacity-45 pointer-events-none">${ai('search','w-4 h-4')}</span><input class="input-style w-full pr-9 text-sm" placeholder="جست‌وجوی کد…" value="${escapeHtml(state.couponQ || '')}" oninput="state.couponQ=this.value; render()"></span>
        <button type="button" class="btn-primary px-4 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 mr-auto" onclick="openAryaCouponModal('add')">${ai('plus','w-4 h-4')} کد جدید</button>
      </div>
      <div class="grid gap-3">
      ${list.length === 0 ? `<div class="glass rounded-2xl p-12 text-center"><p class="text-white/55 text-sm mb-4">${q ? 'کدی با این نام یافت نشد' : 'هنوز کد تخفیفی نساخته‌اید — کدها هم روی سبد، هم دسته/محصول خاص و هم هزینهٔ ارسال اثر می‌گذارند.'}</p>${q ? '' : `<button type="button" class="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold" onclick="openAryaCouponModal('add')">ساخت اولین کد</button>`}</div>` : ''}
      ${list.map(c => {
        const expired = c.expires_at && now > new Date(c.expires_at).getTime();
        const full = c.max_uses && Number(c.used || 0) >= Number(c.max_uses);
        const scope = c.scope === 'category' ? ('دسته: ' + ((state.categories.find(x => String(x.id) === String(c.categoryId)) || {}).title || '—')) : (c.scope === 'products' ? (c.productIds.length + ' محصول') : (c.scope === 'shipping' ? 'ارسال' : 'کل سبد'));
        return `<div class="glass rounded-2xl p-4 flex flex-wrap items-center gap-3 border ${c.active !== false && !expired && !full ? '!border-emerald-500/25' : ''}>
          <button type="button" class="font-mono font-black text-sm px-3 py-2 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/25 hover:bg-blue-500/25 transition" onclick="aryCopyText('${escapeHtml(String(c.code))}')" title="کپی کد">${escapeHtml(String(c.code))}</button>
          <span class="text-[11px] font-bold px-2 py-1 rounded-lg ${c.type === 'shipping' ? 'bg-sky-500/15 text-sky-300' : 'bg-emerald-500/12 text-emerald-300'}">${c.type === 'percent' ? (c.value + '٪' + (c.max_discount ? ' (سقف ' + utils.formatPrice(c.max_discount) + ')' : '')) : (c.type === 'fixed' ? utils.formatPrice(c.value) + ' تومان' : 'ارسال رایگان')}</span>
          <span class="text-[11px] text-white/55">${scope}</span>
          ${c.min_cart ? `<span class="text-[10px] text-white/45">حداقل سبد: ${utils.formatPrice(c.min_cart)}</span>` : ''}
          <span class="text-[10px] ${expired ? 'text-rose-300 font-bold' : 'text-white/45'}">${expired ? 'منقضی' : (c.expires_at ? 'انقضا: ' + new Date(c.expires_at).toLocaleDateString('fa-IR') : 'بدون انقضا')}</span>
          <span class="text-[10px] text-white/45">${Number(c.used || 0)}/${c.max_uses || '∞'} استفاده${full ? ' — تکمیل' : ''}</span>
          <div class="flex items-center gap-1.5 mr-auto">
            <button type="button" class="text-[10px] font-black px-2 py-1.5 rounded-lg ${c.active !== false ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/8 text-white/45'} hover:brightness-125 transition" onclick="toggleAryaCoupon('${escapeHtml(String(c.id))}')">${c.active !== false ? 'فعال' : 'غیرفعال'}</button>
            <button type="button" class="p-1.5 rounded-lg glass hover:bg-white/10 transition" title="ویرایش" onclick="openAryaCouponModal('edit','${escapeHtml(String(c.id))}')">${ai('edit','w-4 h-4')}</button>
            <button type="button" class="p-1.5 rounded-lg glass hover:bg-rose-500/15 text-rose-300 transition" title="حذف" onclick="deleteAryaCoupon('${escapeHtml(String(c.id))}')">${ai('trash','w-4 h-4')}</button>
          </div>
        </div>`;
      }).join('')}
      </div>
    </div>`;
}

function openAryaCouponModal(mode, id) {
  if (mode === 'edit') {
    const c = (state.coupons || []).find(x => String(x.id) === String(id)); if (!c) return;
    state.adminCouponModal = { mode, id, code: c.code, type: c.type || 'percent', value: c.value, scope: c.scope || 'all', categoryId: c.categoryId || '', productIds: (c.productIds || []).slice(), min_cart: c.min_cart || '', max_discount: c.max_discount || '', expires_at: (c.expires_at || '').slice(0, 10), max_uses: c.max_uses || '', active: c.active !== false, q: '' };
  } else {
    state.adminCouponModal = { mode: 'add', code: 'ARYA-' + Math.random().toString(36).slice(2, 7).toUpperCase(), type: 'percent', value: 10, scope: 'all', categoryId: '', productIds: [], min_cart: '', max_discount: '', expires_at: '', max_uses: '', active: true, q: '' };
  }
  render();
}
function closeAryaCouponModal() { state.adminCouponModal = null; render(); }
function toggleAryaCoupon(id) { const c = (state.coupons || []).find(x => String(x.id) === String(id)); if (!c) return; c.active = c.active === false; if (window.AppState) AppState.set({ coupons: state.coupons }); render(); }
function deleteAryaCoupon(id) {
  const c = (state.coupons || []).find(x => String(x.id) === String(id)); if (!c) return;
  state.confirmModal = { title: 'حذف کد تخفیف', message: 'کد «' + c.code + '» حذف شود؟', icon: 'tag', confirmText: 'حذف', confirmClass: 'btn-danger', onConfirm: () => { state.coupons = (state.coupons || []).filter(x => String(x.id) !== String(id)); state.confirmModal = null; if (window.AppState) AppState.set({ coupons: state.coupons }); if (window.toast) toast('کد تخفیف حذف شد', 'info'); render(); } };
  render();
}
function saveAryaCoupon() {
  const m = state.adminCouponModal; if (!m) return;
  const code = String(m.code || '').trim().toUpperCase().replace(/\s+/g, '-');
  if (!/^[A-Z0-9-]{4,20}$/.test(code)) return (window.toast && toast('کد باید ۴ تا ۲۰ نویسه (حروف بزرگ/عدد/خط تیره) باشد', 'warning'));
  if (m.type !== 'shipping' && !(Number(m.value) > 0)) return (window.toast && toast('مقدار تخفیف را وارد کنید', 'warning'));
  if (m.type === 'percent' && Number(m.value) > 95) return (window.toast && toast('سقف درصد تخفیف ۹۵٪ است', 'warning'));
  if (m.scope === 'category' && !m.categoryId) return (window.toast && toast('یک دسته انتخاب کنید', 'warning'));
  if (m.scope === 'products' && !(m.productIds || []).length) return (window.toast && toast('حداقل یک محصول انتخاب کنید', 'warning'));
  state.coupons = Array.isArray(state.coupons) ? state.coupons : [];
  const dup = state.coupons.find(c => String(c.code).toUpperCase() === code && String(c.id) !== String(m.id || ''));
  if (dup) return (window.toast && toast('این کد تکراری است', 'warning'));
  const obj = { code, type: m.type, value: Number(m.value) || 0, scope: m.scope, categoryId: m.scope === 'category' ? m.categoryId : '', productIds: m.scope === 'products' ? m.productIds.slice() : [], min_cart: Number(m.min_cart) || 0, max_discount: m.type === 'percent' ? (Number(m.max_discount) || 0) : 0, expires_at: m.expires_at ? m.expires_at + 'T23:59:59' : '', max_uses: Number(m.max_uses) || 0, active: !!m.active };
  if (m.mode === 'edit') { const c = state.coupons.find(x => String(x.id) === String(m.id)); if (!c) return; Object.assign(c, obj); }
  else { obj.id = String(Date.now()); obj.used = 0; obj.created_at = new Date().toISOString(); state.coupons.unshift(obj); }
  if (window.AppState) AppState.set({ coupons: state.coupons }); else render();
  state.adminCouponModal = null;
  if (window.toast) toast(m.mode === 'edit' ? 'کد تخفیف به‌روزرسانی شد' : 'کد تخفیف ساخته شد ✓', 'success');
}
function renderAdminCouponModal() {
  const m = state.adminCouponModal; if (!m) return '';
  const cats = state.categories || [];
  const pq = String(m.q || '').trim().toLowerCase();
  const prods = (state.products || []).filter(p => !pq || String(p.title || '').toLowerCase().includes(pq)).slice(0, 80);
  return `
    <div class="fixed inset-0 z-[200] flex items-center justify-center p-4 modal-overlay" onclick="if(event.target===this)closeAryaCouponModal()">
      <div class="glass-strong rounded-3xl p-6 lg:p-7 max-w-xl w-full max-h-[92%] overflow-y-auto animate-scale">
        <h2 class="text-xl font-black mb-5">${m.mode === 'add' ? ' کد تخفیف جدید' : 'ویرایش کد تخفیف'}</h2>
        <div class="grid gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-xs text-white/60 mb-1.5 font-bold">کد</label><input class="input-style w-full font-mono uppercase tracking-wider" dir="ltr" value="${escapeHtml(m.code)}" maxlength="20" oninput="state.adminCouponModal.code=this.value"></div>
            <div><label class="block text-xs text-white/60 mb-1.5 font-bold">نوع</label><select class="input-style w-full" onchange="state.adminCouponModal.type=this.value; render()">${[['percent','درصدی'],['fixed','مبلغ ثابت'],['shipping','ارسال رایگان']].map(t => `<option value="${t[0]}" ${m.type === t[0] ? 'selected' : ''}>${t[1]}</option>`).join('')}</select></div>
          </div>
          ${m.type !== 'shipping' ? `<div class="grid grid-cols-2 gap-4"><div><label class="block text-xs text-white/60 mb-1.5 font-bold">${m.type === 'percent' ? 'درصد (۱ تا ۹۵)' : 'مبلغ تخفیف (تومان)'}</label><input type="number" min="1" class="input-style w-full" value="${m.value}" oninput="state.adminCouponModal.value=this.value"></div>${m.type === 'percent' ? `<div><label class="block text-xs text-white/60 mb-1.5 font-bold">سقف تخفیف (اختیاری)</label><input type="number" min="0" class="input-style w-full" value="${m.max_discount}" oninput="state.adminCouponModal.max_discount=this.value"></div>` : '<div></div>'}</div>` : ''}
          <div><label class="block text-xs text-white/60 mb-1.5 font-bold">شامل چه چیزهایی شود؟</label><div class="grid grid-cols-2 md:grid-cols-4 gap-2">${[['all','کل سبد'],['category','دسته خاص'],['products','محصولات خاص'],['shipping','هزینه ارسال']].map(x => `<button type="button" class="py-2 rounded-xl text-[11px] font-black transition ${m.scope === x[0] ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'glass text-white/60 hover:bg-white/10'}" onclick="state.adminCouponModal.scope='${x[0]}'; render()">${x[1]}</button>`).join('')}</div></div>
          ${m.scope === 'category' ? `<div><label class="block text-xs text-white/60 mb-1.5 font-bold">دسته</label><select class="input-style w-full" onchange="state.adminCouponModal.categoryId=this.value">${cats.map(c => `<option value="${escapeHtml(String(c.id))}" ${String(m.categoryId) === String(c.id) ? 'selected' : ''}>${escapeHtml(c.title)}</option>`).join('')}</select></div>` : ''}
          ${m.scope === 'products' ? `<div><div class="flex items-center justify-between gap-2 mb-1.5"><label class="text-xs text-white/60 font-bold">محصولات (${(m.productIds || []).length} انتخاب‌شده)</label><input class="input-style !py-1.5 w-36 text-xs" placeholder="جست‌وجو…" value="${escapeHtml(m.q || '')}" oninput="state.adminCouponModal.q=this.value; render()"></div><div class="max-h-44 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2 grid grid-cols-1 gap-1">${prods.map(p => `<label class="flex items-center gap-2 text-[11px] px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer ${m.productIds.includes(p.id) ? 'bg-blue-500/10 text-blue-200' : 'text-white/70'}"><input type="checkbox" ${m.productIds.includes(p.id) ? 'checked' : ''} onchange="if(this.checked){if(!state.adminCouponModal.productIds.includes('${p.id}'))state.adminCouponModal.productIds.push('${p.id}')}else{state.adminCouponModal.productIds=state.adminCouponModal.productIds.filter(x=>String(x)!=='${p.id}');} render()"><span class="truncate">${escapeHtml(p.title)}</span></label>`).join('') || '<p class="text-[11px] text-white/40 p-2">محصولی نیست</p>'}</div></div>` : ''}
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label class="block text-xs text-white/60 mb-1.5 font-bold">حداقل سبد</label><input type="number" min="0" class="input-style w-full" value="${m.min_cart}" oninput="state.adminCouponModal.min_cart=this.value"></div>
            <div><label class="block text-xs text-white/60 mb-1.5 font-bold">انقضا</label><input type="date" dir="ltr" class="input-style w-full" value="${m.expires_at}" onchange="state.adminCouponModal.expires_at=this.value"></div>
            <div><label class="block text-xs text-white/60 mb-1.5 font-bold">سقف استفاده</label><input type="number" min="0" class="input-style w-full" value="${m.max_uses}" oninput="state.adminCouponModal.max_uses=this.value" placeholder="بی‌نهایت"></div>
          </div>
          <label class="flex items-center gap-2 text-xs text-white/70 cursor-pointer"><input type="checkbox" class="w-4 h-4" ${m.active ? 'checked' : ''} onchange="state.adminCouponModal.active=this.checked">فعال باشد</label>
        </div>
        <div class="flex gap-3 mt-6">
          <button type="button" class="flex-1 btn-ghost py-3 rounded-xl font-bold text-sm" onclick="closeAryaCouponModal()">انصراف</button>
          <button type="button" class="flex-2 btn-primary py-3 rounded-xl font-bold text-sm" onclick="saveAryaCoupon()">${m.mode === 'add' ? 'ساخت کد' : 'ذخیره تغییرات'}</button>
        </div>
      </div>
    </div>`;
}

// ═══════ نقشهٔ موقعیت سفارش — داخل پنل (بدون تب مرورگر) ═══════
function aryShowOrderMap(lat, lng) {
  let m = document.getElementById('ary-order-map');
  if (!m) { m = document.createElement('div'); m.id = 'ary-order-map'; m.className = 'fixed inset-0 z-[210] hidden items-center justify-center p-4 modal-overlay'; m.innerHTML = '<div class="glass-strong rounded-3xl w-full max-w-3xl overflow-hidden animate-scale"><div class="flex items-center justify-between px-4 py-2.5 border-b border-white/10"><b class="text-sm">موقعیت روی نقشه</b><button type="button" class="p-1.5 rounded-lg hover:bg-white/10 text-white/70" onclick="document.getElementById(\'ary-order-map\').classList.add(\'hidden\');document.getElementById(\'ary-order-map\').classList.remove(\'flex\')">✕</button></div><iframe title="نقشه" class="w-full h-[60vh] border-0" src="about:blank"></iframe></div>'; document.body.appendChild(m); m.addEventListener('click', function (e) { if (e.target === m) { m.classList.add('hidden'); m.classList.remove('flex'); } }); }
  const f = m.querySelector('iframe'); f.src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + (lng - .006) + '%2C' + (lat - .004) + '%2C' + (lng + .006) + '%2C' + (lat + .004) + '&layer=mapnik&marker=' + lat + '%2C' + lng;
  m.classList.remove('hidden'); m.classList.add('flex');
}

// ═══════ پیکر آیکون دسته (از کتابخانهٔ آیکون‌های خود سایت) ═══════
function aryCatIconPickerHTML(m) {
  const names = Object.keys(window.ARYA_ICONS || {});
  const cur = m.icon || '';
  return '<div class="ad-ic-grid">' + names.map(n => `<button type="button" title="${n}" class="ad-ic-cell ${cur === n ? 'sel' : ''}" onclick="state.categoryModal.icon='${n}'; render()">${aryIcon(n, 'w-5 h-5')}</button>`).join('') + '</div>';
}

// ═══════ ایمپورت انبوت محصولات (JSON/CSV/URL/تولید خودکار) ═══════
function openAryaBulkImport() {
  state.adminBulk = { tab: 'paste', text: '', url: '', genCount: 60, genCat: '', preview: null, err: '',
    media: { image: '', video: '', article: '', onlyEmpty: true }, mediaOpen: false };
  render();
}
// انتخاب فایل از دستگاه برای تصویر مشترک (تبدیل به dataURL)
function aryBulkImgFile(inp) {
  const f = inp && inp.files && inp.files[0]; if (!f) return;
  if (f.size > 1500000) { if (window.toast) toast('فایل تصویر بزرگ است — حداکثر ۱.۵ مگابایت', 'warning'); inp.value=''; return; }
  const r = new FileReader();
  r.onload = () => { if (state.adminBulk) { state.adminBulk.media.image = String(r.result || ''); state.adminBulk.mediaOpen = true; render(); } };
  r.readAsDataURL(f);
}
function aryBulkMediaToggle(k, v) { if (state.adminBulk) { state.adminBulk.media[k] = v; if (k==='onlyEmpty') render(); } }
function closeAryaBulkImport() { state.adminBulk = null; render(); }
function aryBulkParse() {
  const b = state.adminBulk; if (!b) return;
  b.err = ''; b.preview = null;
  try {
    let arr = [];
    if (b.tab === 'paste') {
      const raw = String(b.text || '').trim();
      if (raw.startsWith('[') || raw.startsWith('{')) { const j = JSON.parse(raw); arr = Array.isArray(j) ? j : [j]; }
      else {
        const lines = raw.split(/\r?\n/).filter(x => x.trim());
        arr = lines.map(ln => { const cols = ln.split(/[;,\t]/).map(x => x.trim()); return { title: cols[0], price: Number(String(cols[1] || '0').replace(/[٬,]/g, '')) || 0, original_price: Number(String(cols[2] || '0').replace(/[٬,]/g, '')) || 0, stock: Number(cols[3] || 10), category: cols[4] || '', description: cols[5] || '' }; });
      }
    } else if (b.tab === 'gen') {
      const names = ['هدفون بی‌سیم','کیبورد مکانیکال','ماوس گیمینگ','پاوربانک ۲۰۰۰۰','هندزفری بلوتوث','مانیتور ۲۷ اینچ','هارد SSD ۱ ترابایت','فلش ۱۲۸ گیگ',' وب‌کم HD','میکروفون استودیویی','اسپیکر بلوتوثی','شارژر فست','کابل تایپ‌سی','پد شارژ وایرلس','دانگل بلوتوث','هاب USB','رم‌افزار','دسته بازی','صندلی گیمینگ','میز تنظیم ارتفاع'];
      const n = Math.min(300, Math.max(1, Number(b.genCount) || 30));
      for (let i = 0; i < n; i++) { const base = 120000 + Math.round(Math.random() * 4800000 / 10000) * 10000; const off = Math.random() < 0.45 ? Math.round(base * (0.05 + Math.random() * 0.25)) : 0; arr.push({ title: names[i % names.length] + ' مدل ' + String.fromCharCode(65 + (i % 26)) + (Math.floor(i / 26) + 1), price: base, original_price: base + off, stock: 3 + Math.floor(Math.random() * 60), category: b.genCat || '', description: 'محصول تولید خودکار — قابل ویرایش پس از ایمپورت.', rating: Math.round((3.6 + Math.random() * 1.3) * 10) / 10 }); }
    }
    if (b.tab === 'url') {
      if (!/^https?:\/\//i.test(String(b.url))) throw new Error('آدرس نامعتبر');
      b.err = 'در حال دریافت…'; render();
      fetch(String(b.url)).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(j => { b.preview = (Array.isArray(j) ? j : (j.data || j.products || j.results || [])).map(aryBulkNorm); b.err = ''; render(); }).catch(e2 => { b.err = 'خطا: ' + e2.message; render(); });
      return;
    }
    b.preview = arr.map(aryBulkNorm);
  } catch (e) { b.err = 'ورودی نامعتبر: ' + (e.message || e); }
  render();
}
function aryBulkNorm(p) {
  p = p || {};
  const num = v => Number(String(v == null ? '' : v).replace(/[٬,]/g, '')) || 0;
  return { id: String(p.id || 'imp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)), title: String(p.title || p.name || 'بدون عنوان').slice(0, 120), price: num(p.price) || 100000, original_price: num(p.original_price) || 0, stock: p.stock != null ? num(p.stock) : 10, category: String(p.category || (state.adminBulk && state.adminBulk.genCat) || '').trim(), description: String(p.description || '').slice(0, 600), image: p.image || p.main_image || p.mainImage || '', videos: Array.isArray(p.videos) ? p.videos : (p.video ? [String(p.video)] : []), article: String(p.article || p.content || '').slice(0, 20000), rating: p.rating || 4.2 };
}
function aryBulkApply() {
  const b = state.adminBulk; if (!b || !b.preview || !b.preview.length) return;
  const cats = new Set((state.categories || []).map(c => String(c.id)));
  const m = b.media || {};
  const fill = m.onlyEmpty !== false;
  const rows = b.preview.map(p => {
    if (p.category && !cats.has(String(p.category))) p.category = '';
    if (m.image && String(m.image).trim() && (fill ? !p.image : true)) p.image = String(m.image).trim();
    if (m.video && String(m.video).trim() && (fill ? !(p.videos && p.videos.length) : true)) p.videos = [String(m.video).trim()];
    if (m.article && String(m.article).trim() && (fill ? !p.article : true)) p.article = String(m.article);
    return p;
  });
  const ids = new Set((state.products || []).map(p => String(p.id)));
  let addN = 0;
  state.products = Array.isArray(state.products) ? state.products : [];
  rows.forEach(p => { if (!ids.has(String(p.id))) { state.products.unshift(p); addN++; } });
  try { if (window.AppState) AppState.set({ products: state.products }); } catch (e) {}
  state.adminBulk = null;
  if (window.toast) toast(addN + ' محصول ایمپورت شد (تکراری‌ها رد شدند) — جمع ' + state.products.length + ' محصول', 'success', 4200);
  render();
}
function renderAdminBulkImport() {
  const b = state.adminBulk; if (!b) return '';
  const pvN = (b.preview || []).length;
  const m = b.media || {};
  const setImg = m.image ? `<div class="w-12 h-12 rounded-xl overflow-hidden border border-white/15 bg-black/30 shrink-0"><img src="${String(m.image).slice(0,400000)}" class="w-full h-full object-cover" alt=""></div>` : '';
  const ico = (n, c) => (typeof aryIcon === 'function' ? aryIcon(n, c) : '');
  return `
    <div class="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 modal-overlay" onclick="if(event.target===this)closeAryaBulkImport()">
      <div class="glass-strong rounded-3xl p-4 sm:p-6 max-w-2xl w-full max-h-[92%] overflow-y-auto animate-scale">
        <h2 class="text-lg sm:text-xl font-black mb-1 inline-flex items-center gap-2">${ico('download','w-5 h-5 text-blue-300')} افزودن دسته‌جمعی محصولات</h2>
        <p class="text-[11px] text-white/50 mb-4 leading-6">یک‌جا وارد کنید: خطی به شکل «نام، قیمت، قیمت‌قبلی، موجودی» یا JSON کامل. تصویر/ویدیو/مقالهٔ مشترک خودکار روی همه می‌خورد.</p>
        <div class="grid grid-cols-3 gap-1.5 mb-4">${[['paste','چسباندن لیست'],['url','از آدرس'],['gen','تولید نمونه']].map(t => `<button type="button" class="h-9 rounded-xl text-[11px] font-bold inline-flex items-center justify-center whitespace-nowrap ${b.tab === t[0] ? 'bg-blue-600 text-white' : 'glass text-white/60'}" onclick="state.adminBulk.tab='${t[0]}'; state.adminBulk.preview=null; render()">${t[1]}</button>`).join('')}</div>
        ${b.tab === 'paste' ? `<textarea class="input-style w-full font-mono text-[11px] leading-5" rows="6" dir="auto" placeholder='[{"title":"هدفون","price":850000,"original_price":990000,"stock":12}]\nیا CSV: نام، قیمت، قیمت‌قبلی، موجودی، دسته'  oninput="state.adminBulk.text=this.value">${escapeHtml(b.text || '')}</textarea>` : ''}
        ${b.tab === 'url' ? `<input class="input-style w-full font-mono text-xs" dir="ltr" placeholder="https://api.example.com/products.json" value="${escapeHtml(b.url || '')}" oninput="state.adminBulk.url=this.value">` : ''}
        ${b.tab === 'gen' ? `<div class="grid grid-cols-2 gap-3"><div><label class="block text-xs text-white/60 mb-1 font-bold">تعداد (۱ تا ۳۰۰)</label><input type="number" min="1" max="300" class="input-style w-full" value="${b.genCount}" oninput="state.adminBulk.genCount=this.value"></div><div><label class="block text-xs text-white/60 mb-1 font-bold">دسته</label><select class="input-style w-full" onchange="state.adminBulk.genCat=this.value"><option value="">— بدون دسته —</option>${(state.categories || []).map(c => `<option value="${escapeHtml(String(c.id))}" ${String(b.genCat) === String(c.id) ? 'selected' : ''}>${escapeHtml(c.title)}</option>`).join('')}</select></div></div>` : ''}

        <div class="mt-3 rounded-2xl border ${m.image||m.video||m.article||b.mediaOpen ? 'border-blue-400/30 bg-blue-500/5' : 'border-white/10 bg-black/15'} p-3 sm:p-4">
          <button type="button" class="w-full flex items-center justify-between gap-2 text-xs font-black" onclick="state.adminBulk.mediaOpen=!state.adminBulk.mediaOpen; render()">
            <span class="inline-flex items-center gap-2">${ico('sparkles','w-4 h-4 text-blue-300')} پیش‌فرض مشترک: تصویر / ویدیو / مقاله</span>
            <span class="text-[10px] text-white/40 inline-flex items-center gap-1">${(m.image||m.video||m.article) ? 'فعال · ' : ''}${b.mediaOpen ? 'بستن ▲' : 'بازکردن ▼'}</span>
          </button>
          ${b.mediaOpen ? `<div class="grid sm:grid-cols-2 gap-3 mt-3 text-start">
            <div class="sm:col-span-2">
              <label class="block text-[11px] text-white/60 mb-1 font-bold">تصویر اصلی همه محصولات</label>
              <div class="flex items-center gap-2">
                ${setImg}
                <input class="input-style flex-1 min-w-0 text-xs !py-2" dir="ltr" placeholder="https://…  یا از دستگاه انتخاب کنید" value="${String(m.image||'').startsWith('data:') ? '(فایل انتخاب‌شده از دستگاه)' : escapeHtml(m.image||'')}" oninput="aryBulkMediaToggle('image', this.value)">
                <label class="btn-ghost h-9 px-3 rounded-xl text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">${ico('upload','w-3.5 h-3.5')}<span>فایل</span><input type="file" accept="image/*" class="hidden" onchange="aryBulkImgFile(this)"></label>
              </div>
            </div>
            <div><label class="block text-[11px] text-white/60 mb-1 font-bold">ویدیو (لینک)</label><input class="input-style w-full text-xs !py-2" dir="ltr" placeholder="https://…/clip.mp4" value="${escapeHtml(m.video||'')}" oninput="aryBulkMediaToggle('video', this.value)"></div>
            <div><label class="block text-[11px] text-white/60 mb-1 font-bold">مقالهٔ مشترک (اختیاری)</label><textarea class="input-style w-full text-xs leading-5" rows="2" dir="auto" placeholder="متن یا Markdown کوتاه که به همهٔ محصولات افزوده می‌شود…" oninput="aryBulkMediaToggle('article', this.value)">${escapeHtml(m.article||'')}</textarea></div>
            <label class="sm:col-span-2 flex items-center gap-2 text-[11px] text-white/70 font-bold cursor-pointer w-fit">
              <input type="checkbox" class="w-4 h-4 accent-blue-500" ${m.onlyEmpty !== false ? 'checked' : ''} onchange="state.adminBulk.media.onlyEmpty=this.checked; render()">
              فقط برای محصولاتی که خودشان ندارند (پیشنهادی)
            </label>
          </div>` : ''}
        </div>

        ${b.tab !== 'url' ? `<div class="mt-3 flex items-center gap-3"><button type="button" class="btn-ghost h-9 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap" onclick="aryBulkParse()">${ico('search','w-3.5 h-3.5')}<span>پیش‌نمایش و اعتبارسنجی</span></button>${pvN ? `<span class="text-[11px] text-emerald-300 font-bold inline-flex items-center gap-1">${ico('check','w-3.5 h-3.5')} ${pvN} ردیف آماده</span>` : ''}</div>` : ''}
        ${b.err ? `<p class="mt-2 text-[11px] text-rose-300 font-bold">${escapeHtml(b.err)}</p>` : ''}
        ${pvN ? `<div class="mt-3 rounded-xl border border-white/10 bg-black/20 max-h-40 overflow-y-auto divide-y divide-white/5">${b.preview.slice(0, 25).map(p => `<div class="flex items-center justify-between gap-2 px-3 py-1.5 text-[11px]"><span class="truncate inline-flex items-center gap-2 min-w-0">${p.image ? `<img src="${String(p.image).slice(0,300)}" class="w-6 h-6 rounded-md object-cover bg-white/5 shrink-0" alt="" onerror="this.style.visibility='hidden'">` : `<span class="w-6 h-6 rounded-md bg-white/5 shrink-0 inline-flex items-center justify-center text-white/25">${ico('image','w-3.5 h-3.5')}</span>`}<span class="truncate">${escapeHtml(p.title)}</span></span><span class="text-emerald-400 font-mono shrink-0" dir="ltr">${utils.formatPrice(p.price)}</span></div>`).join('')}${pvN > 25 ? `<p class="text-[10px] text-white/40 px-3 py-1.5">+${pvN - 25} ردیف دیگر…</p>` : ''}</div>` : ''}
        <div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-5"><button type="button" class="btn-ghost w-full sm:flex-1 h-11 sm:h-10 rounded-xl text-sm font-bold whitespace-nowrap" onclick="closeAryaBulkImport()">انصراف</button><button type="button" class="btn-primary w-full sm:flex-[2] h-11 sm:h-10 rounded-xl text-sm font-bold whitespace-nowrap inline-flex items-center justify-center gap-2 disabled:opacity-40" ${pvN ? '' : 'disabled'} onclick="aryBulkApply()">${ico('plus','w-4 h-4')}<span>افزودن ${pvN || ''} محصول</span></button></div>
      </div>
    </div>`;
}
// ════════════════════════════════════════════════════════════════
// ARYA HOME EDITOR — ویرایش محتوای صفحهٔ اصلی در state.home (ذخیرهٔ خودکار)
// ════════════════════════════════════════════════════════════════

function aryHomeSet(patch) {
  var merged = Object.assign({}, state.home || {});
  if (patch.hero) merged.hero = Object.assign({}, (state.home && state.home.hero) || {}, patch.hero);
  Object.keys(patch).forEach(function (k) { if (k !== 'hero') merged[k] = patch[k]; });
  state.home = merged;
  try { if (window.AppState) AppState.set({ home: state.home }); else render(); } catch (e) { render(); }
}
function aryAboutSave(blocks) { state.aboutBlocks = blocks; try { if (window.AppState) AppState.set({ aboutBlocks: state.aboutBlocks }); } catch (e) {} render(); }
function aryHomeBlk(i, key, val) { var blocks = aryHome().about_blocks.map(function (b, bi) { var c = Object.assign({}, b); if (bi === i) c[key] = val; return c; }); aryAboutSave(blocks); }
function aryHomeBlkAdd() { var b = aryHome().about_blocks.slice(); b.push({ id: 'about' + (b.length + 1), title: 'بلوک جدید', text: '', image: '', stat_n: '', stat_l: '' }); aryAboutSave(b); }
function aryHomeBlkDel(i) { var b = aryHome().about_blocks.slice(); b.splice(i, 1); if (!b.length) b = (window.ARYA_ABOUT_DEFAULTS || []).map(function (x) { return Object.assign({}, x); }); aryAboutSave(b); }
function aryHomeReset() {
  state.confirmModal = { title: 'بازگشت هوم به حالت اولیه', message: 'همهٔ تغییرات محتوای صفحهٔ اصلی (هیرو/شگفت‌انگیز/معرفی) حذف و پیش‌فرض‌ها بازنشانی شوند؟', icon: '', confirmText: 'بازنشانی', confirmClass: 'btn-danger', onConfirm: function () { state.home = null; state.aboutBlocks = null; state.confirmModal = null; try { if (window.AppState) AppState.set({ home: null, aboutBlocks: null }); } catch (e) {} if (window.toast) toast('محتوای هوم به پیش‌فرض برگشت', 'info'); render(); } };
  render();
}
function renderAdminHomeEditor() {
  var h = aryHome();
  var ai = function (n, c) { return (typeof aryIcon === 'function') ? aryIcon(n, c) : ''; };
  var field = function (lab, js, val, ph) { return '<div><label class="block text-xs text-white/60 mb-1.5 font-bold">' + lab + '</label><input class="input-style w-full text-sm" value="' + escapeHtml(String(val == null ? '' : val)) + '" placeholder="' + (ph || '') + '" oninput="' + js + '"></div>'; };
  var heroField = function (lab, key, val) { return field(lab, "aryHomeSet({hero:{ " + key + ": this.value }})", val); };
  return `
    <div class="animate-fade max-w-4xl">
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <h1 class="text-2xl lg:text-3xl font-black">ویرایش صفحهٔ اصلی</h1>
        <span class="text-[10px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300">ذخیرهٔ خودکار</span>
        <button type="button" class="mr-auto btn-ghost !py-2 px-3.5 rounded-xl text-[11px] font-bold inline-flex items-center gap-1.5" onclick="aryHomeReset()"> بازنشانی</button>
      </div>

      <section class="glass rounded-2xl p-5 mb-5">
        <h2 class="font-black text-sm mb-4 flex items-center gap-2 text-blue-300">${ai('image','w-4 h-4')} بنر اصلی (هیرو)</h2>
        <div class="grid sm:grid-cols-2 gap-4">${heroField('برچسب بالا','badge',h.hero.badge)}${heroField('تیتر اصلی','title',h.hero.title)}</div>
        <div class="mt-3"><label class="block text-xs text-white/60 mb-1.5 font-bold">زیرتیتر</label><textarea class="input-style w-full text-sm" rows="2" oninput="aryHomeSet({hero:{ sub: this.value }})">${escapeHtml(h.hero.sub)}</textarea></div>
        <div class="grid sm:grid-cols-3 gap-4 mt-3">
          ${heroField('متن دکمه','cta',h.hero.cta)}
          <div><label class="block text-xs text-white/60 mb-1.5 font-bold">مقصد دکمه</label><select class="input-style w-full text-sm" onchange="aryHomeSet({hero:{ ctaPage: this.value }})">${[['shop','فروشگاه'],['blog','بلاگ'],['contact','تماس'],['offers','پیشنهادها']].map(function (x) { return `<option value="${x[0]}" ${h.hero.ctaPage === x[0] ? 'selected' : ''}>${x[1]}</option>`; }).join('')}</select></div>
          <div><label class="block text-xs text-white/60 mb-1.5 font-bold">تاریکی روکش: <b data-ovl>${h.hero.overlay}</b>٪</label><input type="range" min="0" max="85" value="${Number(h.hero.overlay) || 55}" oninput="this.previousElementSibling.querySelector('[data-ovl]').textContent=this.value; aryHomeSet({hero:{ overlay: Number(this.value) }})"></div>
        </div>
        <div class="mt-3"><label class="block text-xs text-white/60 mb-1.5 font-bold">آدرس تصویر پس‌زمینه (اختیاری — خالی = گرادیان)</label><input class="input-style w-full text-sm font-mono" dir="ltr" placeholder="https://…/hero.jpg" value="${escapeHtml(h.hero.image)}" oninput="aryHomeSet({hero:{ image: this.value }})"></div>
        <div class="mt-3 rounded-xl overflow-hidden border border-white/10 relative h-32 bg-gradient-to-l from-blue-900 to-slate-900">${h.hero.image ? `<img src="${escapeHtml(h.hero.image)}" class="absolute inset-0 w-full h-full object-cover">` : ''}<div class="absolute inset-0 flex flex-col items-center justify-center text-center p-3" style="background:rgba(4,10,26,${(Number(h.hero.overlay) || 55) / 100})"><b class="text-white text-sm">${escapeHtml(h.hero.title)}</b><span class="text-white/60 text-[10px] mt-1">${escapeHtml(h.hero.badge)} · ${escapeHtml(h.hero.cta)}</span></div></div>
      </section>

      <section class="glass rounded-2xl p-5 mb-5">
        <h2 class="font-black text-sm mb-4 flex items-center gap-2 text-rose-300">${ai('bolt','w-4 h-4')} بخش شگفت‌انگیزها</h2>
        <div class="grid sm:grid-cols-2 gap-4">${field('عنوان','aryHomeSet({ deals_title: this.value })',h.deals_title)}${field('زیرعنوان','aryHomeSet({ deals_sub: this.value })',h.deals_sub)}</div>
      </section>

      <section class="glass rounded-2xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-black text-sm flex items-center gap-2 text-sky-300">${ai('info','w-4 h-4')} معرفی مجموعه</h2>
          <button type="button" class="text-[11px] font-black px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 transition" onclick="aryHomeBlkAdd()">+ بلوک جدید</button>
        </div>
        ${field('عنوان بخش','aryHomeSet({ about_title: this.value })',h.about_title)}
        <div class="space-y-4 mt-4">
        ${h.about_blocks.map(function (b, bi) { return `
        <div class="rounded-xl border border-white/10 bg-black/20 p-4">
          <div class="flex items-center justify-between mb-3"><b class="text-[11px] text-white/60">بلوک ${bi + 1}</b><button type="button" class="text-[10px] font-black px-2 py-1 rounded-lg text-rose-300 hover:bg-rose-500/15 transition" onclick="aryHomeBlkDel(${bi})">حذف</button></div>
          <div class="grid sm:grid-cols-2 gap-3">
            <input class="input-style text-sm" value="${escapeHtml(b.title || '')}" placeholder="عنوان بلوک" oninput="aryHomeBlk(${bi},'title',this.value)">
            <input class="input-style text-sm font-mono" dir="ltr" value="${escapeHtml(b.image || '')}" placeholder="about3.jpg یا https://…" oninput="aryHomeBlk(${bi},'image',this.value)">
            <textarea class="input-style text-sm sm:col-span-2" rows="2" placeholder="متن" oninput="aryHomeBlk(${bi},'text',this.value)">${escapeHtml(b.text || '')}</textarea>
            <input class="input-style text-sm" value="${escapeHtml(b.stat_n || '')}" placeholder="عدد شاخص (۱۲+)" oninput="aryHomeBlk(${bi},'stat_n',this.value)">
            <input class="input-style text-sm" value="${escapeHtml(b.stat_l || '')}" placeholder="برچسب شاخص" oninput="aryHomeBlk(${bi},'stat_l',this.value)">
          </div>
        </div>`; }).join('')}
        </div>
      </section>
      <p class="text-[10px] text-white/40 mt-4 text-center">همهٔ تغییرات بلافاصله در سایت اعمال می‌شود — تصویر هیرو ۱۶:۹ و کمتر از ۵۰۰KB پیشنهاد می‌شود.</p>
    </div>`;
}

// ═══════════ راند ۴۰ — کارت کلیک‌پذیر محصول + ابزارهای ادیتور بلاگ ═══════════
function openAryaProductEdit(id) {
  const p = (state.products || []).find(x => String(x.id) === String(id)); if (!p) return;
  state.editProduct = p;
  state.productDraft = {
    title: p.title || '', category: p.category || '', price: Number(p.price) || 0, stock: Number(p.stock) || 0,
    description: p.description || '', mainImage: p.image || p.main_image || '', gallery: (p.gallery || []).slice(),
    original_price: Number(p.original_price) || 0, article: p.article || '', videos: (p.videos || []).slice(), _synced: String(p.id),
    seo_title: p.seo_title || '', seo_description: p.seo_description || '', seo_keywords: p.seo_keywords || '', slug: p.slug || '',
    seo_canonical: p.seo_canonical || '', seo_robots: p.seo_robots || 'index,follow',
    og_title: p.og_title || '', og_description: p.og_description || '', og_slug: p.og_slug || '',
    twitter_title: p.twitter_title || '', twitter_description: p.twitter_description || '',
    redirect_old_url: p.redirect_old_url || '', schema_json: p.schema_json || ''
  };
  render();
}
window.openAryaProductEdit = openAryaProductEdit;

window.aryBlogTag = function (lab, snip) {
  const ta = document.getElementById('blog-body'); if (!ta || !state.blogEdit) return;
  const s0 = ta.selectionStart || 0, e0 = ta.selectionEnd || 0;
  const sel = String(ta.value.slice(s0, e0) || '');
  let text = String(snip || '');
  if (sel) { try { text = text.replace(/>([^<]+)</, '>' + sel.replace(/</g, '&lt;') + '<'); } catch (e) {} }
  ta.setRangeText(text, s0, e0, 'end');
  state.blogEdit.body = ta.value;
  ta.focus();
  if (window.aryBlogCount) window.aryBlogCount();
};
window.aryBlogCount = function () {
  const ta = document.getElementById('blog-body'); if (!ta) return;
  const el = document.querySelector('[data-blog-count]'); if (!el) return;
  const words = (String(ta.value).replace(/<[^>]*>/g, ' ').match(/[\u0600-\uFBFFa-zA-Z0-9]+/g) || []).length;
  el.textContent = words.toLocaleString('fa-IR') + ' واژه · ' + ta.value.length.toLocaleString('fa-IR') + ' نویسه';
  el.style.color = words >= 60 ? 'rgba(110,231,183,.9)' : '';
};
window.aryBlogExcerpt = function () {
  const m = state.blogEdit; if (!m) return;
  const plain = String(m.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const ex = plain.length > 180 ? plain.slice(0, 177) + '…' : plain;
  m.excerpt = ex;
  const ta = document.querySelector('textarea[maxlength="600"]');
  if (ta) { ta.value = ex; }
  if (window.toast) toast(ex ? 'چکیده از متن ساخته شد ✓' : 'اول متن را بنویسید', ex ? 'success' : 'warning');
  if (window.aryBlogCount) window.aryBlogCount();
};

// ═══════ راند ۴۳ — خروج از پنل با مودال تایید (in-app) ═══════
window.adminLogoutNow = function () {
  if (typeof window.__aryAdminLogoutRaw === 'function') { try { return window.__aryAdminLogoutRaw(); } catch (e) {} }
  try { if (window.AryaServer) AryaServer.call('admin_logout', { method: 'POST' }).catch(function () {}); } catch (e) {}
  try { if (typeof state !== 'undefined') { state.isAdmin = false; state.page = 'home'; } } catch (e) {}
  location.reload();
};
window.adminLogout = function () {
  if (window.state && state.confirmModal) { state.confirmModal = null; }
  state.confirmModal = {
    type: 'danger',
    title: 'خروج از پنل مدیریت',
    message: '<div class="text-start space-y-2"><p class="text-xs leading-6">با خروج، سشن مدیریتی بسته می‌شود و صفحهٔ ورود پنل نمایش داده می‌شود.</p><p class="text-[10px] text-white/45">اگر فرمی (محصول/مقاله/تنظیمات) باز و ذخیره‌نشده دارید، ابتدا «ذخیره» را بزنید — پیش‌نویس خودکار مقاله‌ها حفظ می‌ماند.</p></div>',
    confirmText: 'بله، خروج از پنل',
    confirmClass: 'bg-rose-600 hover:bg-rose-500 text-white',
    onConfirm: function () { state.confirmModal = null; window.adminLogoutNow(); }
  };
  render();
};
window.adminLogout.__aryConfirmed = true; // r44fix — نشانهٔ «نسخهٔ تاییددار» تا startAdminPanel بازنویسی‌اش نکند
