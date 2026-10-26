import subprocess
p = 'assets/js/adminP.js'
s = open(p, encoding='utf-8', newline='').read()
EOL = '\r\n'

def rep(old, new, lab):
    global s
    o = old.replace('\n', EOL); n = new.replace('\n', EOL)
    c = s.count(o)
    assert c == 1, (lab, c)
    s = s.replace(o, n)
    print('ok', lab)

rep('return `<circle r="14" cx="16" cy="16" fill="none" stroke="${defs[i][2]}" stroke-width="3.4"',
    'return `<circle class="ary-donut-seg" tabindex="0" role="button" aria-label="${defs[i][1]}: ${v} — کلیک برای فیلتر" onclick="aryChartDrill(\'status\',\'${k}\')" onkeydown="if(event.key===\'Enter\'){aryChartDrill(\'status\',\'${k}\')}" r="14" cx="16" cy="16" fill="none" stroke="${defs[i][2]}" stroke-width="3.4"',
    'donut-seg')

rep('    <div class="flex items-center justify-between gap-2 text-xs">\n      <span class="flex items-center gap-2 text-white/70"><span class="block w-2.5 h-2.5 rounded-full shrink-0" style="background:${defs[i][2]}"></span>${defs[i][1]}</span>',
    '    <div class="flex items-center justify-between gap-2 text-xs rounded-lg px-2 py-1 -mx-2 ary-donut-row" tabindex="0" role="button" title="فیلتر سفارشات ${defs[i][1]}" onclick="aryChartDrill(\'status\',\'${k}\')" onkeydown="if(event.key===\'Enter\'){aryChartDrill(\'status\',\'${k}\')}">\n      <span class="flex items-center gap-2 text-white/70"><span class="block w-2.5 h-2.5 rounded-full shrink-0" style="background:${defs[i][2]}"></span>${defs[i][1]}</span>',
    'donut-legend')

rep('<h2 class="font-bold text-sm sm:text-lg mb-4">توزیع وضعیت سفارش‌ها</h2>',
    '<h2 class="font-bold text-sm sm:text-lg mb-4">توزیع وضعیت سفارش‌ها <span class="text-[9px] font-normal text-white/35 mr-1">کلیک = فیلتر</span></h2>',
    'donut-hint')

rep("${_aryBarsChart(months, values, 'gAryMonthly', '#f472b6', '#ec4899', v => utils.formatPrice(v))}",
    "${_aryBarsChart(months, values, 'gAryMonthly', '#f472b6', '#ec4899', v => utils.formatPrice(v), 'month')}",
    'monthly-drill')

rep('<p class="text-[10px] text-white/40 mt-2">راهنما: محور افقی روزِ ماه، عمودی مبلغ — روی نقاط نگه دارید</p>',
    '<p class="text-[10px] text-white/40 mt-2">💡 کلیک روی هر نقطه = فیلتر سفارشات همان روز</p>',
    'sales-hint')

rep('<p class="text-[10px] text-white/40 mt-2">تعداد سفارش هر روز</p>',
    '<p class="text-[10px] text-white/40 mt-2">تعداد سفارش هر روز — کلیک = فیلتر همان روز</p>',
    'orders-hint')

rep('<p class="text-[10px] text-white/40 mt-2">ستون‌ها از چپ: ۱۲ ماه گذشته ← ماه جاری</p>',
    '<p class="text-[10px] text-white/40 mt-2">کلیک روی هر ستون = فیلتر کل سفارشات آن ماه</p>',
    'monthly-hint')

anchor = ('// ════════════════════════════════════════════════════════════════\n'
          '// ARYA COUPONS ADMIN').replace('\n', EOL)
assert s.count(anchor) == 1, 'coupon anchor'

DRILL = (
"// ═══════════ چارت تعاملی: کلیک = دریل‌داون به لیست سفارشات ═══════════\n"
"window.aryChartDrill = function (kind, key) {\n"
"  if (!state.orderFilter) state.orderFilter = { status: '', search: '' };\n"
"  const f = state.orderFilter;\n"
"  let label = '';\n"
"  if (kind === 'day') { f.day = (f.day === key ? '' : key); f.month = ''; label = f.day ? ('سفارش‌های ' + _aryFaDay(key)) : 'فیلتر روز حذف شد'; }\n"
"  else if (kind === 'month') { f.month = (f.month === key ? '' : key); f.day = ''; label = f.month ? ('سفارشات ماه ' + key.split('-').reverse().join('/')) : 'فیلتر ماه حذف شد'; }\n"
"  else if (kind === 'status') { f.status = (f.status === key ? '' : key); const L = { pending: 'در انتظار', processing: 'پردازش', shipped: 'ارسال‌شده', delivered: 'تحویل‌شده', canceled: 'لغوشده' }[key] || key; label = f.status ? ('وضعیت: ' + L) : 'فیلتر وضعیت حذف شد'; }\n"
"  const cnt = (state.orders || []).filter(o => (!f.status || (o.status || 'pending') === f.status) && (!f.day || String(o.created_at || o.date || '').slice(0, 10) === f.day) && (!f.month || String(o.created_at || o.date || '').slice(0, 7) === f.month)).length;\n"
"  state.adminTab = 'orders';\n"
"  if (window.toast) toast(label + (f.status || f.day || f.month ? ' — ' + cnt + ' مورد یافت شد' : ''), 'info', 3200);\n"
"  render();\n"
"};\n"
"function _aryFaDay(k) { try { return new Date(k).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { return k; } }\n"
"window.aryClearDateFilters = function () { if (state.orderFilter) { state.orderFilter.day = ''; state.orderFilter.month = ''; } render(); };\n\n"
).replace('\n', EOL)
s = s.replace(anchor, DRILL + anchor)
print('ok drill')

rep("""  // فیلتر وضعیت
  const filtered = state.orderFilter.status
    ? orders.filter(o => o.status === state.orderFilter.status)
    : orders;""",
"""  // فیلتر وضعیت + روز/ماه (دریل از چارت‌ها)
  const OF = state.orderFilter = Object.assign({ status: '', search: '' }, state.orderFilter || {});
  let filtered = OF.status ? orders.filter(o => (o.status || 'pending') === OF.status) : orders.slice();
  if (OF.day) filtered = filtered.filter(o => String(o.created_at || o.date || '').slice(0, 10) === OF.day);
  if (OF.month) filtered = filtered.filter(o => String(o.created_at || o.date || '').slice(0, 7) === OF.month);
  const dateChips = (OF.day || OF.month) ? `
        <div class="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/10">
          ${OF.day ? `<span class="inline-flex items-center gap-2 text-[11px] font-black px-2.5 py-1.5 rounded-lg bg-blue-500/15 text-blue-200 border border-blue-400/25">📅 ${_aryFaDay(OF.day)}</span>` : ''}
          ${OF.month ? `<span class="inline-flex items-center gap-2 text-[11px] font-black px-2.5 py-1.5 rounded-lg bg-pink-500/15 text-pink-200 border border-pink-400/25">🗓️ ماه ${OF.month.split('-').reverse().join('/')}</span>` : ''}
          <button type="button" class="text-[10px] font-black px-2.5 py-1.5 rounded-lg glass text-white/60 hover:text-rose-300 hover:bg-rose-500/10 transition" onclick="aryClearDateFilters()">✕ حذف فیلتر تاریخ</button>
        </div>` : '';""",
'safe-filter')

rep("""        </div>
      </div>

      ${filtered.length === 0 ? renderOrdersEmpty() : renderOrdersList(filtered)}""",
"""        </div>
        ${dateChips}
      </div>

      ${filtered.length === 0 ? renderOrdersEmpty() : renderOrdersList(filtered)}""",
'safe-chips')

open(p, 'w', encoding='utf-8', newline='').write(s)
r = subprocess.run(['node', '--check', p], capture_output=True, text=True)
print('syntax:', r.returncode == 0, r.stderr[:400])
