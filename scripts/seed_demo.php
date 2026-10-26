<?php
/**
 * seed_demo.php — افزودن کاتالوگ نمونه به دیتابیس پیکربندی‌شده (CLI)
 *
 * طریقه مصرف:
 *   ۱) ویزارد نصب را کامل کنید (config.php ساخته شود)
 *   ۲) php scripts/seed_demo.php
 *
 * همان فایل assets/data/demo-catalog.json را می‌خواند که ویزارد (گزینه «نمونه‌سازی»)
 * و حالت دمو در مرورگر از آن استفاده می‌کنند — منبع واحد، رفتار idempotent.
 * اگر از ویزارد با گزینه نمونه‌سازی استفاده کرده‌اید، اجرای این اسکریپت بی‌اثر است (تکراری نمی‌سازد).
 */
if (PHP_SAPI !== 'cli') { exit("فقط از طریق CLI اجرا شود\n"); }

$root = dirname(__DIR__);
define('ARYA_GUARD', 1);

if (!is_file($root . '/config.php')) {
    exit("❌ config.php پیدا نشد. ابتدا ویزارد نصب را در index.html کامل کنید.\n");
}
require $root . '/config.php';
require $root . '/includes/security.php';
require $root . '/includes/db_engine.php';
require $root . '/includes/demo_catalog.php';

function dbConfigForSeed(): array {
    return [
        'driver'      => defined('DB_DRIVER') ? DB_DRIVER : 'mysql',
        'host'        => defined('DB_HOST') ? DB_HOST : 'localhost',
        'port'        => defined('DB_PORT') ? DB_PORT : null,
        'name'        => defined('DB_NAME') ? DB_NAME : 'arya_store',
        'user'        => defined('DB_USER') ? DB_USER : 'root',
        'pass'        => defined('DB_PASS') ? DB_PASS : '',
        'charset'     => defined('DB_CHARSET') ? DB_CHARSET : 'utf8mb4',
        'sqlite_path' => (defined('DB_SQLITE_PATH') && DB_SQLITE_PATH) ? DB_SQLITE_PATH : (dirname(__DIR__) . '/storage/arya_store.sqlite'),
        'schema'      => defined('DB_SCHEMA') ? DB_SCHEMA : null,
        'sslmode'     => defined('DB_SSLMODE') ? DB_SSLMODE : null,
        'sslrootcert' => defined('DB_SSLROOTCERT') ? DB_SSLROOTCERT : null,
        // کلیدهای سازگار با ary_demo_mode/driver نام‌ها (dbname/dbuser)
        'dbname'      => defined('DB_NAME') ? DB_NAME : 'arya_store',
        'dbuser'      => defined('DB_USER') ? DB_USER : 'root',
        'dbpass'      => defined('DB_PASS') ? DB_PASS : '',
    ];
}

try {
    $eng = new AryaDbEngine(dbConfigForSeed());
    $eng->createSchema();
    $counts = arya_seed_demo($eng);
    echo "✅ سید انجام شد — دسته‌بندی: {$counts['categories']} | محصولات: {$counts['products']}\n";
    echo "   (منبع: assets/data/demo-catalog.json — اجرای مجدد، رکوردها را به‌روزرسانی می‌کند نه تکثیر)\n";
} catch (Throwable $e) {
    fwrite(STDERR, "❌ خطا: " . $e->getMessage() . "\n");
    exit(1);
}
