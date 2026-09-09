// ═══════════════════════════════════════════════════════════════
// CRUD OPERATIONS PRODUCTS (نسخه اصلاح شده - با پشتیبانی از ویدیو)
// File: assets/js/crud operations products.js
// ═══════════════════════════════════════════════════════════════

(function () {
  // Helper: sanitize string inputs
  function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>]/g, '');
  }

  // Helper: normalize images input (array or comma-separated string)
  function normalizeImages(images) {
    if (Array.isArray(images)) return images.map(sanitize);
    if (typeof images === 'string') {
      return images
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(sanitize);
    }
    return [];
  }

  // Helper: pick known fields with alias support (اصلاح شده برای پشتیبانی از ویدیو)
  function normalizeProductFields(src) {
    const title = sanitize(src.title);
    const price = Number(src.price) || 0;
    const stock = Number(src.stock) || 0;
    const category = sanitize(src.category || '');
    const description = sanitize(src.description || '');
    
    // === اضافه کردن فیلد مقاله و ویدیو ===
    const article = src.article || '';
    const videos = Array.isArray(src.videos) ? src.videos : []; // مهم: ذخیره ویدیوها
    
    const image = sanitize(
      src.main_image || 
      src.image || 
      src.mainImage || 
      (src.images && src.images[0]) || 
      ''
    );
    
    const original_price = Number(src.original_price) || undefined;
    const images = normalizeImages(src.images);

    const out = {
      title,
      price,
      stock,
      category,
      description,
      images,
      article,
      videos // اضافه کردن ویدیو به خروجی
    };

    // ذخیره تصویر در هر دو فیلد برای سازگاری
    if (image) {
      out.image = image;
      out.main_image = image;
      out.mainImage = image;
    }
    
    // Preserve original_price if provided
    if (Number.isFinite(original_price)) out.original_price = original_price;

    return out;
  }

  // Create product (اصلاح شده)
  function createProduct(product) {
    const normalized = normalizeProductFields(product || {});
    const safeProduct = {
      id: utils.generateId(),
      ...normalized,
      created_at: new Date().toISOString()
    };

    // لاگ برای دیباگ
    console.log('✅ محصول جدید ایجاد شد:', safeProduct.title);
    console.log('   مقاله:', safeProduct.article ? 'دارد' : 'ندارد');
    console.log('   ویدیو:', safeProduct.videos?.length ? `${safeProduct.videos.length} ویدیو` : 'ندارد');
    
    state.products.push(safeProduct);
    toast('محصول جدید اضافه شد ✅');
    render();
    return safeProduct;
  }

  // Update product (اصلاح شده)
  function updateProduct(targetOrId, updates) {
    let product = null;

    if (targetOrId && typeof targetOrId === 'object' && targetOrId.id) {
      product = state.products.find(p => p.id === targetOrId.id);
    } else {
      product = state.products.find(p => p.id === targetOrId);
    }

    if (!product) {
      toast('محصول یافت نشد ❌');
      return null;
    }

    // لاگ برای دیباگ
    console.log('🔄 به‌روزرسانی محصول:', product.title);
    console.log('   ویدیو قبلی:', product.videos?.length || 0);
    console.log('   ویدیو جدید:', updates.videos?.length || 0);

    // Normalize incoming updates
    const normalized = normalizeProductFields(updates || {});

    // Apply only known keys
    Object.keys(normalized).forEach(key => {
      product[key] = normalized[key];
    });

    toast('محصول بروزرسانی شد ✨');
    render();
    return product;
  }

  // Delete product
  function deleteProduct(id) {
    const index = state.products.findIndex(p => p.id === id);
    if (index === -1) {
      toast('محصول یافت نشد ❌');
      return false;
    }

    state.products.splice(index, 1);
    toast('محصول حذف شد 🗑️');
    render();
    return true;
  }

  // Read products (with optional filter)
  function getProducts(filter = {}) {
    let result = [...state.products];
    if (filter.category) {
      result = result.filter(p => p.category === filter.category);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(q));
    }
    return result;
  }

  // Expose to global scope
  window.createProduct = createProduct;
  window.getProducts = getProducts;
  window.updateProduct = updateProduct;
  window.deleteProduct = deleteProduct;
})();