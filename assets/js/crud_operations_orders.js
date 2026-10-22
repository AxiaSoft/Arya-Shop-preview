// ═══════════════════════════════════════════════════════════════
// CRUD OPERATIONS ORDERS
// File: assets/js/crud operations orders.js
// ═══════════════════════════════════════════════════════════════

(function () {
  // Helper: sanitize string inputs
  function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>]/g, '');
  }

  // Normalize order fields (support aliases) — PRESERVE EXISTING ID
  function normalizeOrderFields(order) {
    const safeOrder = {
      id: sanitize(order.id) || utils.generateId(),
      user_name: sanitize(order.user_name || order.name || ''),
      user_phone: sanitize(order.user_phone || order.userPhone || ''),
      address: sanitize(order.address || ''),
      items: Array.isArray(order.items) ? order.items : [],
      total: Number(order.total) || 0,
      status: order.status || 'pending',
      created_at: order.created_at || order.createdAt || new Date().toISOString()
    };
    return safeOrder;
  }

  // Create order
  function createOrder(order) {
    const safeOrder = normalizeOrderFields(order || {});
    state.orders.push(safeOrder);
    toast('سفارش جدید ثبت شد');
    render();
    return safeOrder;
  }

  // Read orders (with optional filter)
  function getOrders(filter = {}) {
    let result = [...state.orders];
    if (filter.status) {
      result = result.filter(o => o.status === filter.status);
    }
    if (filter.user_phone || filter.userPhone) {
      const phone = filter.user_phone || filter.userPhone;
      result = result.filter(o => o.user_phone === phone);
    }
    if (filter.dateFrom || filter.dateTo) {
      result = result.filter(o => {
        const d = new Date(o.created_at);
        if (filter.dateFrom && d < new Date(filter.dateFrom)) return false;
        if (filter.dateTo && d > new Date(filter.dateTo)) return false;
        return true;
      });
    }
    return result;
  }

  // Update order — DO NOT REPLACE ID
  function updateOrder(idOrOrder, updates) {
    let order = null;

    if (idOrOrder && typeof idOrOrder === 'object' && idOrOrder.id) {
      order = state.orders.find(o => o.id === idOrOrder.id);
    } else {
      order = state.orders.find(o => o.id === idOrOrder);
    }

    if (!order) {
      toast('سفارش یافت نشد');
      return null;
    }

    const normalized = normalizeOrderFields({ ...order, ...updates, id: order.id });

    Object.keys(normalized).forEach(key => {
      order[key] = normalized[key];
    });

    toast('سفارش بروزرسانی شد');
    render();
    return order;
  }

  // Delete order
  function deleteOrder(id) {
    const index = state.orders.findIndex(o => o.id === id);
    if (index === -1) {
      toast('سفارش یافت نشد');
      return false;
    }

    state.orders.splice(index, 1);
    toast('سفارش حذف شد');
    render();
    return true;
  }

  // Expose to global scope
  window.createOrder = createOrder;
  window.getOrders = getOrders;
  window.updateOrder = updateOrder;
  window.deleteOrder = deleteOrder;
})();