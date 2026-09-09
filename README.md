# 🛍️ Arya Shop Preview

فروشگاه فارسی‌زبان استاتیک (HTML/JS) + یک API تکی PHP با پشتیبانی از **همه موتورهای دیتابیس** و **پنل‌های هاستینگ**.

> گزارش کامل امنیتی و تغییرات: `SECURITY-REPORT.md`

## ویژگی‌ها

- **دیتابیس چندموتوره:** MySQL/MariaDB، PostgreSQL، SQLite و SQL Server — فقط با PDO و افزونه مربوطه؛ ترجمه DDL/UPSERT خودکار (لایه `includes/db_engine.php`).
- **پنل هاستینگ:** ویزارد نصب می‌تواند دیتابیس + کاربر را به‌صورت خودکار روی **cPanel/WHM**، **DirectAdmin** یا **Plesk** بسازد (یا دستی پر کنید). حالت «بدون پنل» روی هر سرور PHP کار می‌کند.
- **احراز هویت واقعی:** bcrypt سمت سرور، ورود کاربر ۲ مرحله‌ای (رمز + OTP)، ورود مدیر ۳ مرحله‌ای (+2FA)، بازیابی رمز با OTP، CSRF، Rate-Limit و هاردنینگ نشست.
- **بدون سرور هم کار می‌کند:** اگر `config.php` نباشد، فروشگاه با دمای محلی (IndexedDB) و برچسب «آزمایشی» ادامه می‌دهد — مناسب طراحی و دمو.

## راه‌اندازی سریع

1. فایل‌ها را روی هاست PHP (≥ 8.0) بارگذاری کنید (`.htaccess` هم آپلود شود — روی nginx نمونه پایین را ببینید).
2. به `index.html` بروید → ویزارد نصب باز می‌شود.
3. موتور دیتابیس را انتخاب کنید:
   - **هاست پنل‌دار:** بخش «پنل هاستینگ» را باز کنید، اطلاعات cPanel/DA/Plesk را بزنید → «ساخت خودکار دیتابیس» → فرم خودش پر می‌شود.
   - **دستی:** نام دیتابیس/کاربر/رمز را از پنل هاست یا phpMyAdmin بگیرید.
   - **تست محلی:** `php -S 127.0.0.1:8000 -t .` و درایور SQLite.
4. ایمیل/رمز مدیر را تعیین کنید (خالی = رمز تصادفی، فقط یک‌بار نمایش داده می‌شود) → «اتصال و راه‌اندازی». جداول و حساب مدیر خودکار ساخته می‌شوند.
5. ورود مدیر: `admin.html`.

### نصب دستی (بدون ویزارد)

`config.sample.php` را به `config.php` تغییر نام دهید و مقادیر را پر کنید. حداقل: `DB_DRIVER` + پارامترهای اتصال + `API_SECRET` تصادفی (`php -r "echo bin2hex(random_bytes(24));"`).

### nginx (جایگزین .htaccess)

```nginx
location ^~ /includes/    { return 404; }
location ^~ /storage/     { return 404; }
location ~ /\.(ht|git)    { return 404; }
location = /config.php    { return 404; }
location ~* (config\.local\.php|.*\.(sqlite|db|sql|log))$ { return 404; }

location ~ \.php$ {
    include fastcgi_params;
    fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```

## اکشن‌های API (`Db.php?action=...`)

| گروه | اکشن‌ها |
|---|---|
| عمومی | `status` `csrf` `stats` |
| نصب/پنل (فقط پیش‌از‌نصب) | `setup` `panel_probe` `panel_provision` |
| مدیر | `admin_login_step1/2/3` `admin_session` `admin_logout` `admin_change_password` `admin_list` `admin_create` `admin_update` `admin_delete` `system_status` `admin_review_moderate` |
| کاربر | `user_register` `user_login_step1/2` `user_reset_step1/2` `user_session` `user_logout` `user_update` `user_change_password` `user_delete` |
| محتوا | `review_create` `review_vote` `ticket_create` `ticket_reply` |
| CRUD با سیاست | `getAll` `getById` `upsert` `delete` `import` (جدول‌های مجاز؛ نوشتن فقط با CSRF/توکن؛ `users` از این مسیر قفل) |

حالت برنامه‌های بیرونی: هدر `Authorization: Bearer <API_SECRET>` (نیازمند توکن؛ بدون آن فقط same-origin).

## افزودن درایور/پنل تازه

- **دیتابیس:** در `includes/db_engine.php` → رجیستری `SUPPORTED` + `buildDsn()` + `colType()/createTableSql()/upsertSqlFor()/columnsOf()` (نمونه‌ها موجودند؛ ~۱۰۰ خط).
- **پنل:** در `includes/panels.php` → پیاده‌سازی `IAryaPanel` (۶ متد) + ثبت در `AryaPanel::SUPPORTED`.

## تست‌ها

```bash
php tests/engine_dialect.php                                # ۳۹ تست یونیت SQL
php -S 127.0.0.1:8211 -t . &                                 # برای E2E
rm -f config.php storage/arya_store.sqlite
BASE_URL=http://127.0.0.1:8211 bash tests/e2e_backend.sh     # ۵۳ تست سرتاسری
PHP_BIN=php bash tests/panels_e2e.sh                         # ۱۶ تست پنل (سرور جعلی)
```

## ساختار

```
index.html / admin.html      صفحات اصلی + ویزارد نصب
Db.php                       API تک‌نقطه‌ای
includes/                    security.php · db_engine.php · panels.php
assets/js/                   Arya_api.js (کلاینت سرور) · Arya_db.js (کش محلی) · pages.js · adminP.js · ...
storage/                     rate/ logs/ sessions/ (خودکار ساخته می‌شوند)
config.php                   فایل تنظیمات (ساخته ویزارد؛ در گیت قرار نمی‌گیرد)
tests/                       تست یونیت + E2E API + پنل جعلی
```

## نکات امنیتی (خلاصه)

- تا وصل‌نشدن سرویس پیامک/ایمیل، `DEMO_MODE=true` فقط برای محیط تست مجاز است.
- `config.php` و `storage/` نباید از وب قابل‌دسترسی باشند (گارد + .htaccess تعبیه شده؛ روی nginx هم blocking لازم است).
- HTTPS را فعال کنید؛ `API_SECRET` تصادفی باشد؛ رمز مدیر پیش‌فرض اولین ورود عوض می‌شود (اجباری).
- جزئیات کامل: `SECURITY-REPORT.md`
