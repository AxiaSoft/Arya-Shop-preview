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
        ${dashboardStatCard("💰", "کل فروش", utils.formatPriceShort(totalSales), "from-emerald-500 to-green-600")}
        ${dashboardStatCard("📅", "سفارشات امروز", todayOrders.length, "from-blue-500 to-cyan-600")}
        ${dashboardStatCard("⏳", "در انتظار", pendingOrders, "from-amber-500 to-orange-600")}
        ${dashboardStatCard("📦", "محصولات", products.length, "from-violet-500 to-purple-600")}
      </div>

      <!-- Essential Charts -->
      ${renderSalesChart(orders)}
      ${renderOrdersChart(orders)}
      ${renderMonthlyRevenueChart(orders)}

      <!-- Best Selling Products -->
      <div class="glass rounded-2xl p-6 mb-8">
        <h2 class="font-bold text-lg mb-4">پرفروش‌ترین محصولات</h2>

        ${
          bestProducts.length === 0
            ? `<p class="text-white/60 text-sm">هنوز فروشی ثبت نشده است.</p>`
            : `
              <div class="space-y-3">
                ${bestProducts
                  .map(
                    p => `
                  <div class="glass rounded-xl p-4 flex items-center justify-between">
                    <span class="text-sm font-medium">${p.title}</span>
                    <span class="text-emerald-400 font-bold">${p.qty} عدد</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
            `
        }
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
function dashboardStatCard(icon, label, value, gradient) {
  return `
    <div class="glass rounded-2xl p-5">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-2xl shadow-lg">
          ${icon}
        </div>
        <div>
          <p class="text-white/60 text-xs">${label}</p>
          <p class="text-xl font-black">${value}</p>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================
   SALES CHART (30 DAYS)
   ============================================================ */
function renderSalesChart(orders) {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push(key);
  }

  const salesMap = {};
  days.forEach(d => (salesMap[d] = 0));

  orders.forEach(o => {
    const date = (o.created_at || "").slice(0, 10);
    if (salesMap[date] !== undefined) {
      salesMap[date] += o.total || 0;
    }
  });

  const values = Object.values(salesMap);
  const maxValue = Math.max(...values, 1);

  const points = values
    .map((v, i) => `${(i / 29) * 100},${100 - (v / maxValue) * 100}`)
    .join(" ");

  return `
    <div class="glass rounded-2xl p-6 mb-8">
      <h2 class="font-bold text-lg mb-4">نمودار فروش (۳۰ روز اخیر)</h2>

      <svg viewBox="0 0 100 100" class="w-full h-40 lg:h-56">
        <polyline points="${points}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3"/>
        <polyline points="${points}" fill="none" stroke="url(#gradSales)" stroke-width="3"/>

        <defs>
          <linearGradient id="gradSales" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#4ade80"/>
            <stop offset="100%" stop-color="#22c55e"/>
          </linearGradient>
        </defs>
      </svg>

      <p class="text-xs text-white/50 mt-2">فروش روزانه</p>
    </div>
  `;
}

/* ============================================================
   ORDERS COUNT CHART (30 DAYS)
   ============================================================ */
function renderOrdersChart(orders) {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push(key);
  }

  const ordersMap = {};
  days.forEach(d => (ordersMap[d] = 0));

  orders.forEach(o => {
    const date = (o.created_at || "").slice(0, 10);
    if (ordersMap[date] !== undefined) {
      ordersMap[date] += 1;
    }
  });

  const values = Object.values(ordersMap);
  const maxValue = Math.max(...values, 1);

  const points = values
    .map((v, i) => `${(i / 29) * 100},${100 - (v / maxValue) * 100}`)
    .join(" ");

  return `
    <div class="glass rounded-2xl p-6 mb-8">
      <h2 class="font-bold text-lg mb-4">تعداد سفارشات (۳۰ روز اخیر)</h2>

      <svg viewBox="0 0 100 100" class="w-full h-40 lg:h-56">
        <polyline points="${points}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3"/>
        <polyline points="${points}" fill="none" stroke="url(#gradOrders)" stroke-width="3"/>

        <defs>
          <linearGradient id="gradOrders" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#60a5fa"/>
            <stop offset="100%" stop-color="#3b82f6"/>
          </linearGradient>
        </defs>
      </svg>

      <p class="text-xs text-white/50 mt-2">سفارشات روزانه</p>
    </div>
  `;
}

/* ============================================================
   MONTHLY REVENUE CHART (12 MONTHS)
   ============================================================ */
function renderMonthlyRevenueChart(orders) {
  const months = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push(key);
  }

  const revenueMap = {};
  months.forEach(m => (revenueMap[m] = 0));

  orders.forEach(o => {
    const date = o.created_at || "";
    const monthKey = date.slice(0, 7);
    if (revenueMap[monthKey] !== undefined) {
      revenueMap[monthKey] += o.total || 0;
    }
  });

  const values = Object.values(revenueMap);
  const maxValue = Math.max(...values, 1);

  const points = values
    .map((v, i) => `${(i / 11) * 100},${100 - (v / maxValue) * 100}`)
    .join(" ");

  return `
    <div class="glass rounded-2xl p-6 mb-8">
      <h2 class="font-bold text-lg mb-4">درآمد ماهانه (۱۲ ماه اخیر)</h2>

      <svg viewBox="0 0 100 100" class="w-full h-48 lg:h-64">
        <polyline points="${points}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3"/>
        <polyline points="${points}" fill="none" stroke="url(#gradMonthly)" stroke-width="3"/>

        <defs>
          <linearGradient id="gradMonthly" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#f472b6"/>
            <stop offset="100%" stop-color="#ec4899"/>
          </linearGradient>
        </defs>
      </svg>

      <p class="text-xs text-white/50 mt-2">درآمد ماهانه</p>
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
  
  return `
    <div class="animate-fade">
      <h1 class="text-2xl lg:text-3xl font-black mb-8">سفارشات (${filteredOrders.length})</h1>
      
      <!-- Filter -->
      <div class="glass rounded-2xl p-5 mb-6">
        <div class="flex flex-wrap gap-2">
          <button 
            onclick="state.orderFilter.status = ''; render()"
            class="px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${!state.orderFilter.status ? 'bg-violet-500 text-white' : 'glass hover:bg-white/10'}"
          >
            همه
          </button>
          ${[
            { value: 'pending', label: '⏳ در انتظار', color: 'bg-amber-500' },
            { value: 'processing', label: '⚙️ پردازش', color: 'bg-blue-500' },
            { value: 'shipped', label: '🚚 ارسال شده', color: 'bg-cyan-500' },
            { value: 'delivered', label: '✅ تحویل', color: 'bg-emerald-500' }
          ].map(opt => `
            <button 
              onclick="state.orderFilter.status = '${opt.value}'; render()"
              class="px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${state.orderFilter.status === opt.value ? opt.color + ' text-white' : 'glass hover:bg-white/10'}"
            >
              ${opt.label}
            </button>
          `).join('')}
        </div>
      </div>
      
      ${filteredOrders.length > 0 ? `
        <div class="space-y-4">
          ${filteredOrders.map((order, i) => {
            const items = JSON.parse(order.items || '[]');
            const statusInfo = utils.getStatusInfo(order.status);
            
            return `
              <div class="glass rounded-2xl p-6 animate-fade" style="animation-delay: ${i * 0.05}s">
                <div class="flex flex-wrap items-center justify-between gap-4 mb-5">
                  <div>
                    <span class="font-mono font-bold">#${(order.id || '').slice(-8)}</span>
                    <p class="text-xs text-white/60 mt-1">${utils.formatDateTime(order.created_at)}</p>
                  </div>
                  
                  <div>
                    <label for="status-${order.id}" class="sr-only">وضعیت سفارش</label>
                    <select 
                      id="status-${order.id}"
                      onchange="updateOrderStatus(state.orders.find(o => o.id === '${order.id}'), this.value)"
                      class="bg-white/10 border border-white/20 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-violet-500"
                    >
                      <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ در انتظار</option>
                      <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>⚙️ پردازش</option>
                      <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>🚚 ارسال شده</option>
                      <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>✅ تحویل</option>
                    </select>
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
                    <p class="text-xl font-black text-emerald-400">${utils.formatPrice(order.total)}</p>
                    <p class="text-xs text-white/60">${items.length} کالا</p>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="glass rounded-3xl p-16 text-center">
          <div class="text-7xl mb-6">🛒</div>
          <h3 class="text-2xl font-bold">سفارشی یافت ن  د</h3>
        </div>
      `}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// ADMIN PANEL
// File: assets/js/admin panel.js
// ═══════════════════════════════════════════════════════════════

/* ========== Global state bootstrapping ========== */

state.reviews = Array.isArray(state.reviews) ? state.reviews : [];
state.adminReviewsSelectedProductId = state.adminReviewsSelectedProductId || null;

state.supportFilter = state.supportFilter || { status: '', priority: '', view: 'all' };
state.adminSupportSelectedTicketId = state.adminSupportSelectedTicketId || null;
state.supportQuickReplies = Array.isArray(state.supportQuickReplies)
  ? state.supportQuickReplies
  : [
      { id: 'qr1', label: 'تشکر از تماس', text: 'سلام، ممنون از پیام شما. درخواست شما در حال بررسی است.' },
      { id: 'qr2', label: 'اطلاع از پیگیری', text: 'درخواست شما ثبت شد و به زودی نتیجه را اطلاع می‌دهیم.' }
    ];

state.orderFilter = state.orderFilter || { status: '' };
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
    { id: 'dashboard', icon: '📊', label: 'داشبورد' },
    { id: 'products', icon: '📦', label: 'محصولات' },
    { id: 'orders', icon: '🛒', label: 'سفارشات' },
    { id: 'categories', icon: '🗂️', label: 'دسته‌بندی‌ها' },
    { id: 'reviews', icon: '📝', label: 'نظرات' },
    { id: 'support', icon: '💬', label: 'پشتیبانی' },
    { id: 'admins', icon: '🛡️', label: 'کاربران مدیر' }
  ];

  const pendingReviewsCount = (state.reviews || []).filter(r => r.status === 'pending').length;

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
              <div class="flex items-center gap-3">
                <span class="relative text-xl">
                  ${tab.icon}
                  ${
                    tab.id === 'reviews' && pendingReviewsCount > 0
                      ? `<span class="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          ${pendingReviewsCount}
                         </span>`
                      : ''
                  }
                </span>
                <span class="font-medium">${tab.label}</span>
              </div>
            </button>
          `
            )
            .join('')}
        </nav>
        <div class="p-4 border-t border-white/5 space-y-2">
          <button onclick="window.open('index.html', '_blank')" class="w-full btn-ghost py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium" type="button">🏠 مشاهده سایت (تب جدید)</button>
          <button onclick="showDbExportPanel()" class="w-full bg-emerald-500/10 text-emerald-400 py-3 rounded-xl hover:bg-emerald-500/20 flex items-center justify-center gap-2 text-sm font-medium transition-all" type="button">🗄️ دیتابیس</button>
          <button onclick="adminLogout()" class="w-full bg-rose-500/10 text-rose-400 py-3 rounded-xl hover:bg-rose-500/20 flex items-center justify-center gap-2 text-sm font-medium transition-all" type="button">🚪 خروج</button>
        </div>
      </aside>

      <!-- Mobile Header -->
      <header class="lg:hidden glass-dark border-b border-white/5 p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">⚙️</span>
            <h1 class="font-bold">پنل مدیریت</h1>
          </div>
          <div class="flex gap-2">
            <button onclick="window.open('index.html', '_blank')" class="p-2 glass rounded-xl text-sm" type="button" title="مشاهده سایت در تب جدید">🏠</button>
            <button onclick="adminLogout()" class="p-2 glass rounded-xl text-rose-400 text-sm" type="button" title="خروج از پنل">🚪</button>
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
                  <span>
                    <span class="tab-icon">${tab.icon}</span>
                    <span>${tab.label}</span>
                  </span>
                  ${
                    tab.id === 'reviews' && pendingReviewsCount > 0
                      ? `<span class="admin-sheet-tab-badge">${pendingReviewsCount}</span>`
                      : ''
                  }
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
              value="${m.title}"
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
                        <span class="text-xs line-clamp-2">${p.title}</span>
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
}

function reactToReview(id, reaction) {
  state.reviews = Array.isArray(state.reviews) ? state.reviews : [];
  const r = state.reviews.find(x => x.id === id);
  if (!r) return;

  normalizeReview(r);

  const prev = r._adminReaction || null;

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
  const activeProduct = activeProductId ? byProduct[activeProductId] : null;
  const activeReviews = activeProduct ? activeProduct.reviews : [];

  const pendingCount = state.reviews.filter(r => r.status === 'pending').length;

  return `
    <div class="animate-fade">
      <div class="flex flex-col lg:flex-row gap-6">
        
        <!-- Products list -->
        <aside class="lg:w-72 glass rounded-2xl p-4 h-max max-h-[70vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-bold flex items-center gap-2">
              <span>📝</span>
              <span>محصولات با نظر</span>
            </h2>
            ${
              pendingCount > 0
                ? `<span class="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">در انتظار: ${pendingCount}</span>`
                : ''
            }
          </div>
          ${
            productIds.length === 0
              ? `<p class="text-xs text-white/60">هنوز نظری ثبت نشده است.</p>`
              : productIds
                  .map(pid => {
                    const p = byProduct[pid];
                    const pPending = p.reviews.filter(r => r.status === 'pending').length;
                    return `
                      <button
                        type="button"
                        class="w-full text-right px-3 py-2 rounded-xl text-xs mb-1 flex items-center justify-between ${activeProductId === pid ? 'bg-white/10' : 'glass hover:bg-white/10'}"
                        onclick="state.adminReviewsSelectedProductId='${pid}'; render()"
                      >
                        <span class="line-clamp-1">${p.title}</span>
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
        </aside>

        <!-- Reviews list -->
        <section class="flex-1">
          ${
            !activeProduct
              ? `<div class="glass rounded-2xl p-10 text-center text-sm text-white/60">
                  محصولی برای نمایش نظرات انتخاب نشده است.
                </div>`
              : `
            <div class="flex items-center justify-between mb-4">
              <div>
                <h1 class="text-xl lg:text-2xl font-black mb-1">نظرات محصول</h1>
                <p class="text-xs text-white/60 line-clamp-1">${activeProduct.title}</p>
              </div>
              <div class="text-xs text-white/60">
                <span>کل نظرات: ${activeReviews.length}</span>
              </div>
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

                        <p class="text-sm text-white/80 whitespace-pre-line mb-3">${r.text || r.comment || ''}</p>

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
                            <button
                              type="button"
                              class="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                              onclick="setReviewStatus('${r.id}', 'approved')"
                            >
                              تایید
                            </button>
                            <button
                              type="button"
                              class="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-200 hover:bg-rose-500/30"
                              onclick="setReviewStatus('${r.id}', 'rejected')"
                            >
                              رد
                            </button>
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
      ${active ? 'bg-violet-500 text-white' : 'glass hover:bg-white/10'}"
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
            class="bg-white/10 border border-white/20 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-violet-500"
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

  render();
  return Promise.resolve(true);
}

function updateTicketStatus(ticket, status) {
  if (!ticket) return;
  ticket.status = status;
  if (window.AppState) AppState.set({ tickets: state.tickets });
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
    { value: 'closed', label: 'بسته' }
  ];

  const priorityButtons = [
    { value: '', label: 'همه' },
    { value: 'urgent', label: 'فوری' },
    { value: 'normal', label: 'عادی' }
  ];

  return `
    <div class="animate-fade">
      <h1 class="text-2xl lg:text-3xl font-black mb-4">پشتیبانی و تیکت‌ها 💬</h1>

      <div class="glass rounded-2xl p-4 mb-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div class="flex flex-wrap gap-2">
          <span class="text-xs text-white/60">وضعیت:</span>
          ${statusButtons
            .map(
              b => `
            <button
              type="button"
              class="px-3 py-1.5 rounded-xl text-xs font-medium ${
                state.supportFilter.status === b.value ? 'bg-violet-500 text-white' : 'glass hover:bg-white/10'
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
                        onclick="state.adminSupportSelectedTicketId='${t.id}'; render()"
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
                    activeTicket.status === 'closed'
                      ? 'بسته'
                      : 'باز'
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

            <div class="flex-1 overflow-y-auto space-y-2 mb-3">
              ${
                activeMessages.length === 0
                  ? `<div class="text-xs text-white/60 text-center py-4">پیامی ثبت نشده است.</div>`
                  : activeMessages
                      .map(m => {
                        const isAdmin = (m.from || 'user') === 'admin';
                        return `
                          <div class="flex ${isAdmin ? 'justify-start' : 'justify-end'}">
                            <div class="max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                              isAdmin ? 'bg-white/10 text-white' : 'bg-violet-500 text-white'
                            }">
                              <div class="mb-1 text-[10px] opacity-70">
                                ${isAdmin ? 'پشتیبانی' : (activeTicket.user_name || activeTicket.userName || 'کاربر')}
                                • ${utils.formatDateTime(m.at || '')}
                              </div>
                              <div class="whitespace-pre-line">${m.text}</div>
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
                      q => `
                    <button
                      type="button"
                      class="px-2 py-1 rounded-xl text-[11px] glass hover:bg-white/10"
                      onclick="addTicketMessage(state.tickets.find(t => t.id === '${activeTicket.id}'), { from: 'admin', text: '${(q.text || '').replace(/'/g, "\\'")}' })"
                    >
                      ${q.label}
                    </button>
                  `
                    )
                    .join('')
                }
              </div>

              <form
                class="flex items-center gap-2"
                onsubmit="
                  event.preventDefault();
                  const input = this.querySelector('textarea');
                  const val = input.value;
                  addTicketMessage(state.tickets.find(t => t.id === '${activeTicket.id}'), { from: 'admin', text: val }).then(ok => { if(ok) input.value=''; });
                "
              >
                <textarea
                  class="flex-1 input-style resize-none text-xs"
                  rows="2"
                  placeholder="پاسخ خود را بنویسید..."
                ></textarea>
                <button
                  type="submit"
                  class="px-3 py-2 rounded-xl bg-violet-500 text-white text-xs font-semibold hover:bg-violet-600"
                >
                  ارسال
                </button>
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
  const html = `<hr class="custom-separator" style="border: none; height: 2px; background: #4f46e5; margin: 20px 0; border-radius: 2px;">`;
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
          <video controls class="w-full rounded-xl">
            <source src="${url}" type="${file && file.type ? file.type : 'video/mp4'}">
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

// ---------- Admin list (with category filter) ----------
function renderAdminProductsEditor() {
  initProductDraft(); if (state.editProduct) syncDraftFromEditing();
  const categoriesOptions = [
    `<option value="all"${state.productFilterCategory === 'all' ? ' selected' : ''}>همه</option>`,
    `<option value="uncategorized"${state.productFilterCategory === 'uncategorized' ? ' selected' : ''}>بدون دسته</option>`,
    ...state.categories.map(cat => `<option value="${cat.id}"${state.productFilterCategory === String(cat.id) ? ' selected' : ''}>${escapeHtml(cat.title)}</option>`)
  ].join('');
  const filteredProducts = (state.products || []).filter(p => {
    const cat = p.category || '';
    if (state.productFilterCategory === 'all') return true;
    if (state.productFilterCategory === 'uncategorized') return !cat;
    return String(cat) === String(state.productFilterCategory);
  });

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

      ${filteredProducts.length > 0 ? `
        <div class="grid gap-4">
          ${filteredProducts.map((product, i) => {
            const imgSrc = product.image || product.main_image || '';
            const hasImage = !!imgSrc;
            const price = Number(product.price || 0);
            const original = Number(product.original_price || 0);
            const hasDiscount = original > price && price > 0;
            const discountPercent = hasDiscount ? Math.round(((original - price) / original) * 100) : 0;
            return `
              <div class="glass rounded-2xl p-5 flex items-center gap-4 animate-fade" style="animation-delay:${i * 0.05}s">
                <div class="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                  ${ hasImage ? `<img src="${imgSrc}" alt="${escapeHtml(product.title)}" class="w-full h-full object-cover">` : `<span class="text-3xl">📦</span>` }
                </div>

                <div class="flex-1 min-w-0">
                  <h3 class="font-bold truncate">${escapeHtml(product.title)}</h3>
                  <p class="text-white/60 text-sm">${state.categories.find(c => c.id === product.category)?.title || 'بدون دسته'}</p>
                  ${product.slug ? `<p class="text-white/40 text-xs mt-1">/${product.slug}</p>` : ''}
                </div>

                <div class="text-left hidden sm:block">
                  ${ hasDiscount ? `
                      <div class="flex items-center gap-2">
                        <span class="text-emerald-400 font-bold">${utils.formatPrice(price)}</span>
                        <span class="price-original text-xs">${utils.formatPrice(original)}</span>
                      </div>
                      <div class="mt-1"><span class="badge badge-discount text-[10px]">${discountPercent}% تخفیف</span></div>
                    ` : `<p class="text-emerald-400 font-bold">${utils.formatPrice(price)}</p>` }
                  <p class="text-xs text-white/60 mt-1">موجودی: ${product.stock || 0}</p>
                </div>

                <div class="flex gap-2">
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
          <div class="mb-6 animate-float flex items-center justify-center">
            <span class="text-7xl">📦</span>
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
      `}
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
              <div class="glass rounded-2xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer border border-dashed border-white/20 hover:border-violet-400 transition" onclick="document.getElementById('main-image-input').click()">
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

              <div class="glass rounded-2xl p-4 mt-3 flex flex-col items-center justify-center gap-3 cursor-pointer border border-dashed border-white/20 hover:border-violet-400 transition" onclick="document.getElementById('gallery-image-input').click()">
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
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <div class="w-10 h-10 bg-black/10 rounded overflow-hidden flex items-center justify-center text-[10px] shrink-0">${escapeHtml((vid.name||'ویدیو').slice(0,10))}</div>
                      <div class="text-xs truncate flex-1 min-w-0">${escapeHtml(vid.name||'ویدیو')}</div>
                    </div>
                    <div class="flex gap-2 flex-shrink-0">
                      <button class="btn-ghost text-[11px] px-3 py-1 rounded-lg" type="button" onclick="openAdminVideoPreview(${i})">مشاهده</button>
                      <button class="btn-ghost text-[11px] px-3 py-1 rounded-lg" type="button" onclick="state.productDraft.videos.splice(${i},1); renderProductModalOnly();">حذف</button>
                    </div>
                  </div>`).join('') }
              </div>

              <div class="glass rounded-2xl p-4 mt-3 flex flex-col items-center justify-center gap-3 cursor-pointer border border-dashed border-white/20 hover:border-violet-400 transition" onclick="document.getElementById('video-upload-input').click()">
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
      background: linear-gradient(145deg, #4f46e5, #7c3aed);
      border-color: #a78bfa;
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.3);
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
      border-right-color: #8b5cf6;
      background: rgba(139, 92, 246, 0.05);
    }
    
    /* استایل نقل قول با آیکون */
    .custom-blockquote {
      position: relative;
      background: rgba(139, 92, 246, 0.05);
      border-right: 4px solid #8b5cf6;
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
      color: #8b5cf6;
      opacity: 0.2;
      font-family: serif;
      line-height: 1;
      font-weight: bold;
    }
    
    /* پیش‌نمایش */
    .preview-mode-active {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      padding: 6px 16px;
      border-radius: 30px;
      font-size: 13px;
      font-weight: 500;
      margin-right: 16px;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
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
          <div class="font-semibold text-blue-300 mb-2">🔗 اتصال به MySQL</div>
          <p class="text-xs text-white/60">برای اتصال به MySQL واقعی، فایل <code class="text-violet-300">api/db.php</code> را روی سرور قرار دهید و در <code class="text-violet-300">arya_db.js</code> مقدار <code class="text-violet-300">USE_BACKEND = true</code> کنید.</p>
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
            <span class="font-bold text-violet-400">${v} رکورد</span>
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
            <span>${k}</span><span class="font-bold text-violet-400">${v}</span>
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

state.adminUsersList = state.adminUsersList || [];
state.adminUsersLoading = state.adminUsersLoading || false;
state.adminUserFormOpen = state.adminUserFormOpen || false;

async function loadAdminUsersList() {
  state.adminUsersLoading = true;
  render();
  try {
    const res = await fetch('Db.php?action=admin_list', { credentials: 'same-origin' });
    const json = await res.json();
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
                <td class="p-3">${u.name || ''}</td>
                <td class="p-3 text-white/60">${u.email || ''}</td>
                <td class="p-3 text-white/60">${u.phone || '-'}</td>
                <td class="p-3">${u.role === 'superadmin' ? '👑 مدیر اصلی' : 'مدیر'}</td>
                <td class="p-3">${Number(u.two_factor_enabled) === 1 ? '✅ فعال' : '—'}</td>
                <td class="p-3">
                  <div class="flex gap-2">
                    <button onclick="openEditAdminUserModal('${u.id}')" type="button" class="btn-ghost px-3 py-1.5 rounded-lg text-xs">ویرایش</button>
                    <button onclick="deleteAdminUserConfirm('${u.id}', '${(u.name || '').replace(/'/g, '')}')" type="button" class="btn-ghost text-rose-400 px-3 py-1.5 rounded-lg text-xs">حذف</button>
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
    const res = await fetch('Db.php?action=admin_create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });
    const json = await res.json();
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
          <input id="edit-admin-name" class="input-style w-full" value="${u.name || ''}">
        </div>
        <div>
          <label class="block text-white/60 mb-1 text-xs">شماره موبایل</label>
          <input id="edit-admin-phone" class="input-style w-full" dir="ltr" value="${u.phone || ''}">
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
    const res = await fetch('Db.php?action=admin_update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });
    const json = await res.json();
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
    message: `آیا از حذف حساب «${name}» مطمئن هستید؟`,
    confirmText: 'حذف',
    confirmClass: 'btn-danger',
    onConfirm: async () => {
      try {
        const res = await fetch('Db.php?action=admin_delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ id })
        });
        const json = await res.json();
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