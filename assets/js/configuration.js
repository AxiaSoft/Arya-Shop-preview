// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// File: assets/js/configuration.js
// ═══════════════════════════════════════════════════════════════
const defaultConfig = {
  store_name: 'فروشگاه آکسیاسافت',
  hero_title: 'سایت فروشگاهی آریا آماده خدمت رسانی!',
  hero_subtitle: 'مدرن ، زیبا ، راحت در سایت فروشگاهی آریا راحت بخر و راحت بفروش!',
  primary_color: '#6366f1',
  secondary_color: '#8b5cf6',
  accent_color: '#a855f7',
  bg_color: '#0f172a',
  text_color: '#ffffff'
};
let config = { ...defaultConfig };

const socialLinks = {
  telegram: "https://t.me/YOUR_CHANNEL",
  instagram: "https://instagram.com/YOUR_PAGE",
  whatsapp: "https://wa.me/YOUR_NUMBER"
};

// اسلایدر صفحهٔ اصلی: img = مسیر تصویر (نسبی)، link = 'shop' یا آدرس دلخواه
window.aryHeroSlides = window.aryHeroSlides || [
  { img: 'assets/img/home/hero-slide-1.jpg', link: 'shop' },
  { img: 'assets/img/home/hero-slide-2.jpg', link: 'shop' }
];

// پلاک‌های فوتر: برای هر مجوز، لینک تأیید عمومی را در «url» بگذارید
// نمونه اینماد   : https://enamad.ir/<شناسه‌ی‌اعتماد>   (از پنل اینماد کپی کنید)
// نمونه ساماندهی: https://www.samandehi.ir/Users/ShowUser/<شناسه>.aspx
const trustBadges = [
  //{ img: "assets/img/badges/enamad.png", alt: "نماد اعتماد الکترونیکی" },
  //{ img: "assets/img/badges/samandehi.png", alt: "نماد ساماندهی" },
  //{ img: "assets/img/badges/digital-media.png", alt: "رسانه‌های دیجیتال" },
  { img: "assets/img/logo/Arya-White.png", alt: "لوگوی آریا" },
  
];