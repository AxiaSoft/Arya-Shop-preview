<?php
// ═══════════════════════════════════════════════════════════════
// نمونه config برای نصب دستی (بدون ویزارد)
// نام فایل را به config.php تغییر دهید و در همین پوشه کنار Db.php قرار دهید.
// فقط یک بلوک از بخش «دیتابیس» را بر اساس موتور خود باز بگذارید.
// ═══════════════════════════════════════════════════════════════
if (!defined('ARYA_GUARD')) { http_response_code(403); exit('Forbidden'); }

// ── دیتابیس: MySQL / MariaDB (پیش‌فرض در cPanel و DirectAdmin) ──
define('DB_DRIVER', 'mysql');
define('DB_HOST', 'localhost');
define('DB_PORT', 3306);
define('DB_NAME', 'myuser_shop');
define('DB_USER', 'myuser_shop');
define('DB_PASS', 'YOUR_DB_PASSWORD');
define('DB_CHARSET', 'utf8mb4');

// ── دیتابیس: PostgreSQL (مثال — کامنت بلوک بالا را بردارید و این را باز کنید) ──
// define('DB_DRIVER', 'pgsql');
// define('DB_HOST', 'localhost');
// define('DB_PORT', 5432);
// define('DB_NAME', 'arya_shop');
// define('DB_USER', 'arya');
// define('DB_PASS', 'YOUR_DB_PASSWORD');
// define('DB_SCHEMA', 'public');

// ── دیتابیس: Supabase (Postgres ابری — TLS اجباری) ──
// ساده‌ترین راه: همان ویزارد سایت را با موتور Supabase برانید.
// برای نصب دستی — مقادیر را از کنسول Supabase بردارید:
//   Settings → API  (Project ref)  و  Settings → Database (password)
// Direct : db.<REF>.supabase.co  port 5432  user: postgres
// Pooler : aws-0-<REGION>.pooler.supabase.com  port 6543  user: postgres.<REF>
// define('DB_DRIVER', 'supabase');   // دایالکت همان pgsql است؛ TLS خودکار
// define('DB_HOST', 'db.abcdefghijklmnop.supabase.co');
// define('DB_PORT', 5432);
// define('DB_NAME', 'postgres');
// define('DB_USER', 'postgres');
// define('DB_PASS', 'YOUR_SUPABASE_DB_PASSWORD');
// define('DB_SCHEMA', 'public');
// define('DB_SSLMODE', 'require');            // یا verify-full با sslrootcert
// define('DB_SSLROOTCERT', '/home/USER/supabase-root-cert.pem'); // اختیاری

// ── دیتابیس: SQLite (بدون سرور؛ مناسب تست/استجینگ) ──
// define('DB_DRIVER', 'sqlite');
// define('DB_NAME', '');
// define('DB_SQLITE_PATH', __DIR__ . '/storage/arya_store.sqlite');

// ── دیتابیس: SQL Server (نیازمند افزونه pdo_sqlsrv) ──
// define('DB_DRIVER', 'sqlsrv');
// define('DB_HOST', 'localhost');
// define('DB_PORT', 1433);
// define('DB_NAME', 'arya_shop');
// define('DB_USER', 'sa');
// define('DB_PASS', 'YOUR_DB_PASSWORD');

// ── کلید API (اختیاری) ──
// برای دسترسی ابزارهای بیرونی (توکن Bearer)؛ از ترمینال:
//   php -r "echo bin2hex(random_bytes(24));"
define('API_SECRET', 'CHANGE_ME_64_HEX_RANDOM');

// ── DEMO_MODE ──
// true  → کد OTP در پاسخ API برمی‌گردد (برای تست محلی)
// false → OTP جایی نمایش داده نمی‌شود؛ باید سرویس پیامک/ایمیل وصل شود (تولید: پیش از انتشار عمومی)
define('DEMO_MODE', false);

// ── اختیاری ──
// دامنه‌های مجاز اضافه برای CORS (API از اپ موبایل/سایت دوم):
// define('ALLOWED_ORIGINS', ['https://app.example.com']);
// اگر پشت CDN/لوودبالانسر هستید و X-Forwarded-For قابل اعتماد است:
// define('TRUST_PROXY_HEADERS', true);
