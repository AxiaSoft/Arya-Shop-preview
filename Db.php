<?php
// ═══════════════════════════════════════════════════════════════
// AryaStore — Backend API (چندنماته، امن‌سازی‌شده)
// File: Db.php
// ═══════════════════════════════════════════════════════════════
// این نسخه نسبت به نسخه قبلی:
//
// ۱) پشتیبانی از همه دیتابیس‌ها از طریق لایه‌ی PDO (includes/db_engine.php):
//    MySQL/MariaDB (پیش‌فرض)، PostgreSQL، SQLite، SQL Server.
//    گویش هر موتور (DDL، upsert، نقل‌قول شناسه‌ها) خودکار ترجمه می‌شود.
//
// ۲) پشتیبانی از پنل‌های میزبانی هنگام نصب (includes/panels.php):
//    cPanel (UAPI) ، DirectAdmin (API2) ، Plesk (XML API) و حالت دستی.
//    ویزارد می‌تواند دیتابیس+کاربر+دسترسی را خودش در پنل بسازد.
//
// ۳) رفع اشکالات امنیتی (SECURITY-REPORT.md را ببینید):
//    • حذف CORS ستاره‌دار + حذف ارسال جزئیات خطای اتصال دیتابیس
//    • مقایسه‌ی امن رمز/توکن/OTP با hash_equals و timing-safe
//    • شمارش تلاش (rate limit) برای ورود، ثبت‌نام، نصب و پنل
//    • توکن CSRF برای عملیات وابسته به سشن
//    • هاردنینگ سشن (HttpOnly/SameSite/Strict + چرخش شناسه پس از ورود)
//    • حذف OTP از پاسخ (فقط در DEMO_MODE) + هش‌شدن OTP در سشن
//    • حذف رمزهای عبور از خروجی کوئری‌ها (password_hash در هیچ
//      پاسخ GET برای عموم نیست)
//    • سیاست دسترسی به هر جدول (products: خواندن عمومی/نوشتن فقط ادمین،
//      users: فقط اکشن‌های اختصاصی احراز هویت، …) → بستن IDOR و upsert
//    • حساب مدیر پیش‌فرض فقط در لحظه نصب ساخته می‌شود (نه هر درخواست)
//      و تا تغییر رمز اولیه، پرچم «باید رمز را عوض کنی» دارد
//    • config.php با گارد مستقیم‌خوانده‌شدن + .htaccess محافظت‌شده
//
// نکته: در حالت واقعی، برای ارسال OTP باید به سرویس پیامک/ایمیل وصل
// شوید (بخش «TODO: ارسال واقعی OTP») و DEMO_MODE را در config.php روی
// false بگذارید تا کد در پاسخ برنگردد.
// ═══════════════════════════════════════════════════════════════

define('ARYA_GUARD', 1);
define('ARYA_VERSION', '2.0.0');
define('CONFIG_FILE', __DIR__ . '/config.php');
define('OTP_TTL_SECONDS', 180);
define('OTP_MAX_ATTEMPTS', 5);

require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/includes/db_engine.php';
require_once __DIR__ . '/includes/panels.php';

ary_session_start();
ary_send_headers();
ary_cors_headers();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') { exit(0); }

// config را همان ابتدا بارگذاری کن تا API_SECRET و DEMO_MODE در همه‌جا
// (حتی اکشن‌های قبل از اتصال به DB) تعریف‌شده باشند.
loadConfig();

// ── Response helpers ──────────────────────────────────────────
function ok($data = [], string $msg = 'success') {
    echo json_encode(['ok' => true, 'data' => $data, 'msg' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}
function fail(string $msg = 'error', int $code = 400) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'msg' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

function isConfigured(): bool { return file_exists(CONFIG_FILE); }

// هر استثنای مهارنشده → پاسخ JSON عمومی (جزئیات فقط در لاگ؛ DEMO_MODE پیام را اضافه می‌کند)
set_exception_handler(function (Throwable $e) {
    ary_log('fatal', (string) $e);
    if (!headers_sent()) http_response_code(500);
    echo json_encode(['ok' => false, 'msg' => 'خطای داخلی سرور. جزئیات در لاگ ثبت شد.'
        . (ary_demo_mode() ? ' (' . $e->getMessage() . ')' : '')], JSON_UNESCAPED_UNICODE);
    exit;
});

/** خواندن config با گاردِ ARYA_GUARD (config.php بیرون از app قابل اجرا نیست) */
function loadConfig(): bool {
    static $loaded = null;
    static $required = false;
    if ($loaded === true) return true;
    if (!isConfigured()) return $loaded = false;
    if (!$required) {                 // config ممکن است همین درخواست ساخته شده باشد
        require_once CONFIG_FILE;
        $required = true;
    }
    return $loaded = defined('DB_HOST') || defined('DB_SQLITE_PATH') || defined('DB_DRIVER');
}

/** نگاشت config.php → آرایه‌ی کانفیگ موتور */
function dbConfig(): array {
    return [
        'driver'      => defined('DB_DRIVER') ? DB_DRIVER : 'mysql',
        'host'        => defined('DB_HOST') ? DB_HOST : 'localhost',
        'port'        => defined('DB_PORT') ? DB_PORT : null,
        'dbname'      => defined('DB_NAME') ? DB_NAME : '',
        'dbuser'      => defined('DB_USER') ? DB_USER : null,
        'dbpass'      => defined('DB_PASS') ? DB_PASS : '',
        'charset'     => defined('DB_CHARSET') ? DB_CHARSET : 'utf8mb4',
        'sqlite_path' => (defined('DB_SQLITE_PATH') && DB_SQLITE_PATH) ? DB_SQLITE_PATH : (__DIR__ . '/storage/arya_store.sqlite'),
        'schema'      => defined('DB_SCHEMA') ? DB_SCHEMA : null,
    ];
}

function engine(): AryaDbEngine {
    static $eng = null;
    if ($eng) return $eng;
    if (!loadConfig()) fail('دیتابیس هنوز پیکربندی نشده است. ابتدا از صفحه اصلی سایت، دیتابیس را متصل کنید.', 503);
    try {
        $eng = new AryaDbEngine(dbConfig());
        $eng->pdo();
        return $eng;
    } catch (Throwable $e) {
        ary_log('db', 'connection failed: ' . $e->getMessage());
        fail('اتصال به دیتابیس برقرار نشد. اطلاعات اتصال را در config.php بررسی کنید.'
            . (ary_demo_mode() ? ' (' . $e->getMessage() . ')' : ''), 500);
    }
}

function db(): PDO { return engine()->pdo(); }

// ── احراز هویت سطح فروشگاه (کوئری‌های غیراداری) ─────────────
// دو راه معتبر: توکن Bearer (کلید API) یا درخواست هم‌ریشه از مرورگر
// خودِ سایت (Origin/Referer دقیقاً همان host). دیگر str_contains نیست.
function write_guard(): void {
    // نوشتن‌ها یا با توکن API مجازند، یا same-origin + CSRF معتبر
    if (str_starts_with(ary_get_header('Authorization'), 'Bearer ')) { checkRequestAuth(); return; }
    if (!ary_is_same_origin()) fail('Unauthorized: origin', 401);
    if (!ary_csrf_valid()) fail('توکن CSRF معتبر لازم است (action=csrf).', 403);
}

function checkRequestAuth(): string {
    $auth = ary_get_header('Authorization');
    if (str_starts_with($auth, 'Bearer ')) {
        $token = substr($auth, 7);
        if (!defined('API_SECRET') || !preg_match('/^[a-f0-9]{32,128}$/i', (string) API_SECRET)
            || !hash_equals((string) API_SECRET, $token)) {
            fail('Unauthorized', 401);
        }
        return 'api';
    }
    if (!ary_is_same_origin()) fail('Unauthorized: origin', 401);
    return 'same-origin';
}

function requireAdminSession(bool $csrf = true): string {
    if (empty($_SESSION['admin_id'])) fail('Unauthorized: admin session required', 401);
    if ($csrf) ary_require_csrf('fail');
    return (string) $_SESSION['admin_id'];
}

function currentAdminId(): ?string { return isset($_SESSION['admin_id']) ? (string) $_SESSION['admin_id'] : null; }
function currentUserId(): ?string  { return isset($_SESSION['user_id'])  ? (string) $_SESSION['user_id']  : null; }

// ── ساخت جداول (idempotent) ───────────────────────────────────
function createSchema(AryaDbEngine $eng): void {
    static $done = false;
    if ($done) return;
    $eng->createSchema();
    $done = true;
}

/** آیا جدول admins ستون must_change_password را دارد؟ (ارتقای بی‌سروصدا) */
function ensureAdminUpgrade(AryaDbEngine $eng): void {
    static $done = false;
    if ($done) return;
    $done = true;
    try {
        if ($eng->tableExists('admins') && !$eng->hasColumn('admins', 'must_change_password')) {
            $col = AryaDbEngine::quoteIdent($eng->driver, 'must_change_password');
            $t   = AryaDbEngine::quoteIdent($eng->driver, 'admins');
            $def = match ($eng->driver) {
                'mysql'  => 'TINYINT DEFAULT 0',
                'pgsql'  => 'SMALLINT DEFAULT 0',
                'sqlite' => 'INTEGER DEFAULT 0',
                default  => 'TINYINT DEFAULT 0',
            };
            $eng->pdo()->exec("ALTER TABLE $t ADD COLUMN $col $def");
        }
    } catch (Throwable $e) { ary_log('upgrade', $e->getMessage()); }
}

// ── سیاست دسترسی به جداول عمومی ───────────────────────────────
const ALLOWED_TABLES = ['products','orders','users','categories','tickets','reviews','settings'];

// جداول حساس: هرگز از مسیر عمومی CRUD قابل نوشتن نیستند
const ADMIN_ONLY_TABLES = ['products','categories','settings','users','admins'];

function validateTable(string $t): string {
    if (!in_array($t, ALLOWED_TABLES, true)) fail('Invalid table: ' . $t);
    return $t;
}

// ── OTP و ابزار مشترک لاگین ───────────────────────────────────
function rememberPendingOtp(string $key, string $id, string $otp, string $target): void {
    $_SESSION["pending_{$key}_id"]   = $id;
    $_SESSION["pending_{$key}_otp"] = ary_otp_hash($otp);
    $_SESSION["pending_{$key}_at"]  = time();
    $_SESSION["pending_{$key}_tries"] = 0;
}

function checkPendingOtp(string $key, string $otp): array {
    if (empty($_SESSION["pending_{$key}_id"])) return [false, 'ابتدا مرحله اول ورود را انجام دهید.'];
    $age = time() - (int) ($_SESSION["pending_{$key}_at"] ?? 0);
    if ($age > OTP_TTL_SECONDS) {
        clearPending($key);
        return [false, 'کد تایید منقضی شده است. دوباره تلاش کنید.'];
    }
    $tries = (int) ($_SESSION["pending_{$key}_tries"] ?? 0);
    if ($tries >= OTP_MAX_ATTEMPTS) {
        clearPending($key);
        return [false, 'تعداد تلاش با کد اشتباه بیش از حد شد. از ابتدا وارد شوید.'];
    }
    if (!ary_otp_verify($otp, (string) $_SESSION["pending_{$key}_otp"])) {
        $_SESSION["pending_{$key}_tries"] = $tries + 1;
        return [false, 'کد تایید اشتباه است.'];
    }
    return [true, '', $_SESSION["pending_{$key}_id"]];
}

function clearPending(string $key): void {
    unset($_SESSION["pending_{$key}_id"], $_SESSION["pending_{$key}_otp"],
          $_SESSION["pending_{$key}_at"], $_SESSION["pending_{$key}_tries"]);
}

/**
 * نقطه اتصال سرویس واقعی: در این تابع (و rememberPendingOtp) به‌جای شبیه‌سازی،
 * API سرویس پیامک/ایمیل را صدا بزنید و otp_demo را حذف کنید.
 */
function otpResponse(string $otp, string $target): array {
    $data = [
        'otp_required'  => true,
        'target_masked' => ary_mask_identifier($target),
    ];
    // ⚠️ فقط در حالت آزمایشی: سرویس پیامک/ایمیل که وصل شد، DEMO_MODE=false
    if (ary_demo_mode()) $data['otp_demo'] = $otp;
    return $data;
}

// TODO: ارسال واقعی OTP — فراخوانی سرویس پیامک/ایمیل:
//   sms($target, $otp)  /  mail($target, $subject, $body)
// در صورت نبود سرویس، DEMO_MODE=true تنها گزینه است و انتشار عمومی
// با آن ممنوع است.

// ── بدنه درخواست ──────────────────────────────────────────────
$rawBody = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($rawBody)) $rawBody = $_POST;
$action  = $_GET['action'] ?? $rawBody['action'] ?? 'getAll';

// سیل امنیتی کلی (سقف درخواست‌های تغییردهنده به ازای هر IP)
if (in_array($method, ['POST','PUT','DELETE'], true) && !in_array($action, ['status','csrf'], true)) {
    if (!ary_throttle('api:' . $action . ':' . ary_client_ip(), 90, 60)) ary_throttle_fail('fail');
}

// ═══════════════════════════════════════════════════════════════
// اکشن‌های بدون نیاز به دیتابیس: status / csrf / setup / panel_*
// ═══════════════════════════════════════════════════════════════
if ($action === 'status') {
    $out = [
        'configured'  => isConfigured(),
        'demo_mode'   => ary_demo_mode(),
        'api_version' => ARYA_VERSION,
        'drivers'     => array_keys(AryaDbEngine::SUPPORTED),
    ];
    if (isConfigured() && loadConfig()) {
        $out['db'] = ['driver' => defined('DB_DRIVER') ? DB_DRIVER : 'mysql',
                      'name'   => defined('DB_NAME') ? DB_NAME : null];
    }
    ok($out);
}

if ($action === 'csrf') { ok(['csrf' => ary_csrf_token()]); }

// ── تست اتصال پنل (فقط پیش از نصب) ───────────────────────────
if ($action === 'panel_probe') {
    if (isConfigured()) fail('سایت پیکربندی شده است؛ دسترسی به این اکشن بسته است.', 403);
    if (!ary_is_same_origin()) fail('Unauthorized: origin', 401);
    if (!ary_throttle('panel-probe:' . ary_client_ip(), 10, 600)) ary_throttle_fail('fail');

    $p = $rawBody['panel'] ?? [];
    $type = (string) ($p['type'] ?? 'none');
    try {
        $panel = AryaPanel::make($type, [
            'host' => $p['host'] ?? '', 'port' => $p['port'] ?? null, 'scheme' => $p['scheme'] ?? 'https',
            'user' => $p['user'] ?? '', 'pass' => $p['pass'] ?? '', 'token' => $p['token'] ?? '',
            'domain' => $p['domain'] ?? '', 'insecure' => !empty($p['insecure']),
        ]);
        $info = $panel->testConnection();
        ok($info, 'اتصال پنل برقرار است.');
    } catch (Throwable $e) {
        ary_log('panel', $e->getMessage());
        fail('اتصال پنل ناموفق بود: ' . $e->getMessage(), 502);
    }
}

// ── ساخت خودکار دیتابیس/کاربر در پنل (فقط پیش از نصب) ───────
if ($action === 'panel_provision') {
    if (isConfigured()) fail('سایت پیکربندی شده است؛ دسترسی به این اکشن بسته است.', 403);
    if (!ary_is_same_origin()) fail('Unauthorized: origin', 401);
    if (!ary_throttle('panel-prov:' . ary_client_ip(), 5, 600)) ary_throttle_fail('fail');

    $p = $rawBody['panel'] ?? [];
    $type = (string) ($p['type'] ?? '');
    if ($type === '' || $type === 'none') fail('نوع پنل مشخص نشده است.');

    $dbName = (string) ($rawBody['dbname'] ?? '');
    $dbUser = (string) ($rawBody['dbuser'] ?? '');
    $dbPass = (string) ($rawBody['dbpass'] ?? '');
    if ($dbPass === '') $dbPass = bin2hex(random_bytes(9)); // ۱۸ کاراکتر تصادفی
    if (strlen($dbPass) < 10) fail('رمز کاربر دیتابیس باید حداقل ۱۰ کاراکتر باشد.');

    try {
        $panel = AryaPanel::make($type, [
            'host' => $p['host'] ?? '', 'port' => $p['port'] ?? null, 'scheme' => $p['scheme'] ?? 'https',
            'user' => $p['user'] ?? '', 'pass' => $p['pass'] ?? '', 'token' => $p['token'] ?? '',
            'domain' => $p['domain'] ?? '', 'insecure' => !empty($p['insecure']),
        ]);
        $res = AryaPanel::provision($panel, $dbName, $dbUser, $dbPass);
        ok([
            'dbname' => $res['dbname'],
            'dbuser' => $res['dbuser'],
            'dbpass' => $res['dbpass'],          // برای پر کردن فیلدهای فرم — ذخیره در پنل نیست
            'dbhost' => $p['db_host'] ?? 'localhost',
        ], 'دیتابیس و کاربر در پنل ساخته شد. حالا اتصال را تکمیل کنید.');
    } catch (Throwable $e) {
        ary_log('panel', $e->getMessage());
        fail('ساخت دیتابیس در پنل ناموفق بود: ' . $e->getMessage(), 502);
    }
}

// ── ویزارد نصب چندموتوره ───────────────────────────────────────
if ($action === 'setup') {
    if (isConfigured()) fail('دیتابیس از قبل پیکربندی شده است. برای نصب مجدد، config.php را حذف کنید.', 409);
    if (!ary_throttle('setup:' . ary_client_ip(), 6, 600)) ary_throttle_fail('fail');

    $driver = strtolower(trim((string) ($rawBody['driver'] ?? 'mysql')));
    if (!isset(AryaDbEngine::SUPPORTED[$driver])) fail('موتور دیتابیس نامعتبر است: ' . $driver);
    if (!AryaDbEngine::isDriverAvailable($driver)) {
        fail('پشتیبانی PHP از این موتور فعال نیست (' . AryaDbEngine::SUPPORTED[$driver]['needs'][0] . ' را روی سرور فعال کنید).');
    }

    $host   = trim((string) ($rawBody['host']   ?? $_POST['host']   ?? ''));
    $port   = (int) ($rawBody['port'] ?? $_POST['port'] ?? 0);
    $dbname = trim((string) ($rawBody['dbname'] ?? $_POST['dbname'] ?? ''));
    $dbuser = trim((string) ($rawBody['dbuser'] ?? $_POST['dbuser'] ?? ''));
    $dbpass = (string) ($rawBody['dbpass'] ?? $_POST['dbpass'] ?? '');
    $schema = trim((string) ($rawBody['schema'] ?? ''));
    $sqlitePath = trim((string) ($rawBody['sqlite_path'] ?? ''));
    $demoMode = array_key_exists('demo_mode', $rawBody) ? (bool) $rawBody['demo_mode'] : true;

    if ($driver === 'sqlite') {
        if ($sqlitePath === '') $sqlitePath = __DIR__ . '/storage/arya_store.sqlite';
        // فقط مسیر داخل پروژه یا temp مجاز است (جلوگیری از نوشتن دلخواه روی سرور)
        $real = realpath(dirname($sqlitePath)) ?: dirname($sqlitePath);
        $allowedRoots = [realpath(__DIR__) ?: __DIR__, realpath(sys_get_temp_dir()) ?: sys_get_temp_dir()];
        $okPath = false;
        foreach ($allowedRoots as $root) if ($root && str_starts_with($real, $root)) $okPath = true;
        if (!$okPath) fail('مسیر فایل SQLite فقط می‌تواند داخل پوشه‌ی سایت یا پوشه موقت سرور باشد.');
    } else {
        if ($host === '' || $dbname === '' || $dbuser === '') fail('میزبان، نام دیتابیس و نام کاربری الزامی است.');
    }
    if ($driver === 'pgsql' && $schema === '') $schema = 'public';

    $cfg = [
        'driver' => $driver, 'host' => $host, 'port' => $port ?: null,
        'dbname' => $dbname, 'dbuser' => $dbuser, 'dbpass' => $dbpass,
        'charset' => 'utf8mb4', 'sqlite_path' => $sqlitePath, 'schema' => $schema ?: null,
    ];

    // مرحله ۱: تست اتصال
    try {
        if ($driver === 'sqlite') {
            $admin = AryaDbEngine::adminPdo($driver, $cfg);
        } else {
            $admin = AryaDbEngine::adminPdo($driver, $cfg);
        }
    } catch (Throwable $e) {
        ary_log('setup', 'connect failed: ' . $e->getMessage());
        fail('اتصال به سرور دیتابیس ناموفق بود. میزبان/پورت/کاربر/رمز را بررسی کنید.'
            . (ary_demo_mode() ? ' (' . $e->getMessage() . ')' : ''), 500);
    }

    // مرحله ۲: ساخت دیتابیس در صورت نبود
    try {
        if ($cfg['dbname'] !== '') AryaDbEngine::ensureDatabase($driver, $admin, $dbname);
    } catch (Throwable $e) {
        ary_log('setup', 'create db failed: ' . $e->getMessage());
        fail('ساخت دیتابیس ناموفق بود (ممکن است کاربر اجازه CREATE DATABASE نداشته باشد؛ در پنل بسازید و دوباره تلاش کنید).'
            . (ary_demo_mode() ? ' (' . $e->getMessage() . ')' : ''), 500);
    }

    // مرحله ۳: ساخت جداول روی کانفیک جدید (قبل از نوشتن config؛ تا در خطا نیمه‌کاره نماند)
    try {
        $eng = new AryaDbEngine($cfg);
        createSchema($eng);
    } catch (Throwable $e) {
        ary_log('setup', 'schema failed: ' . $e->getMessage());
        fail('ساخت جداول ناموفق بود: ' . $e->getMessage(), 500);
    }

    // مرحله ۴: نوشتن config.php با گارد + رمزنگاری‌نشده‌ی فقط‌محلی
    $apiSecret = bin2hex(random_bytes(24));
    $g = static fn($v) => var_export($v, true);
    $lines = "<?php\n"
        . "// این فایل توسط ویزارد نصب آریا ساخته شده است. دسترسی وب به آن با .htaccess و گارد بسته است.\n"
        . "// برای نصب مجدد: این فایل را حذف کنید.\n"
        . "if (!defined('ARYA_GUARD')) { http_response_code(403); exit('Forbidden'); }\n"
        . "define('DB_DRIVER', " . $g($driver) . ");\n"
        . "define('DB_HOST', " . $g($host ?: 'localhost') . ");\n"
        . "define('DB_PORT', " . $g($port ?: ($driver === 'pgsql' ? 5432 : ($driver === 'sqlsrv' ? 1433 : 3306))) . ");\n"
        . "define('DB_NAME', " . $g($dbname) . ");\n"
        . "define('DB_USER', " . $g($dbuser) . ");\n"
        . "define('DB_PASS', " . $g($dbpass) . ");\n"
        . "define('DB_CHARSET', 'utf8mb4');\n"
        . "define('DB_SQLITE_PATH', " . $g($sqlitePath) . ");\n"
        . ($schema ? "define('DB_SCHEMA', " . $g($schema) . ");\n" : '')
        . "define('API_SECRET', " . $g($apiSecret) . ");\n"
        . "// ⚠️ DEMO_MODE کد تایید را در پاسخ API برمی‌گرداند. پیش از انتشار عمومی: false\n"
        . "define('DEMO_MODE', " . $g($demoMode) . ");\n"
        // اختیاری: "define('ALLOWED_ORIGINS', ['https://example.com']);"
        // اختیاری: "define('TRUST_PROXY_HEADERS', true);" (فقط پشت CDN/لوودبالانسر)
        ;
    if (@file_put_contents(CONFIG_FILE, $lines) === false) {
        fail('نوشتن فایل config.php ناموفق بود. مطمئن شوید پوشه‌ی سایت قابل نوشتن است (chmod 755 یا 775 برای گروه وب).');
    }
    @chmod(CONFIG_FILE, 0640);

    // مرحله ۵: مدیر پیش‌فرض (فقط همین‌جا؛ در هر درخواست اجرا نمی‌شود)
    $adminEmail = trim((string) ($rawBody['admin_email'] ?? 'admin@arya.ir'));
    $adminPass  = (string) ($rawBody['admin_pass'] ?? '');
    $defaultAdminCreated = false;
    if ($adminPass === '') {
        $adminPass = 'Admin@' . random_int(100000, 999999); // رمز پیش‌فرض تصادفی در نسخه ۲
        $defaultAdminCreated = true;
    }
    $policyErr = ary_password_policy_error($adminPass);
    if ($policyErr !== '') fail('رمز مدیر: ' . $policyErr);
    try {
        $eng->ensureFirstAdmin($adminEmail, $adminPass);
    } catch (Throwable $e) {
        ary_log('setup', 'admin bootstrap failed: ' . $e->getMessage());
        fail('ساخت حساب مدیر اولیه ناموفق بود: ' . $e->getMessage(), 500);
    }

    ok([
        'connected' => true,
        'db' => ['driver' => $driver, 'name' => $driver === 'sqlite' ? basename($sqlitePath) : $dbname],
        'default_admin' => [
            'email'    => $adminEmail,
            'password' => $defaultAdminCreated ? $adminPass : '(رمزی که خودتان تعیین کردید)',
            'note'     => 'این رمز فقط همین یک‌بار نمایش داده می‌شود؛ پس از اولین ورود آن را عوض کنید.',
        ],
        'demo_mode' => $demoMode,
    ], 'دیتابیس متصل و جداول ساخته شدند.');
}

// ═══════════════════════════════════════════════════════════════
// ورود پنل مدیریت — ۳ مرحله‌ای: رمز عبور → کد تایید → رمز دومرحله‌ای
// ═══════════════════════════════════════════════════════════════
if ($action === 'admin_login_step1') {
    $eng = engine();
    ensureAdminUpgrade($eng);
    if (!ary_throttle('admin-login:' . sha1(strtolower(ary_clean_text($rawBody['identifier'] ?? '')) . '|' . ary_client_ip()), 8, 600)) {
        ary_throttle_fail('fail');
    }

    $identifier = ary_clean_text($rawBody['identifier'] ?? '');
    $password   = (string) ($rawBody['password'] ?? '');
    if ($identifier === '' || $password === '') fail('شناسه و رمز عبور الزامی است.');

    $db = $eng->pdo();
    $stmt = $db->prepare('SELECT * FROM ' . AryaDbEngine::quoteIdent($eng->driver, 'admins')
        . ' WHERE email = ? OR phone = ? LIMIT 1');
    $stmt->execute([$identifier, $identifier]);
    $admin = $stmt->fetch();

    if (!$admin || !ary_password_verify($password, $admin['password_hash'] ?? null)) {
        fail('شناسه یا رمز عبور اشتباه است.', 401);
    }

    $otp = ary_generate_otp6();
    // اگر سرویس واقعی وصل کردید، همین‌جا ارسال کنید و otp_demo را خاموش کنید.
    rememberPendingOtp('admin', (string) $admin['id'], $otp, (string) ($admin['phone'] ?: $admin['email']));

    ok(otpResponse($otp, (string) ($admin['phone'] ?: $admin['email'])) + [
        'must_change_password' => !empty($admin['must_change_password'] ?? null),
    ], 'کد تایید ارسال شد.');
}

if ($action === 'admin_login_step2') {
    if (!ary_throttle('admin-otp:' . ary_client_ip(), 25, 600)) ary_throttle_fail('fail');
    $otp = preg_replace('/\D/', '', ary_clean_text($rawBody['otp'] ?? ''));
    $chk = checkPendingOtp('admin', $otp);
    if ($chk[0] !== true) fail($chk[1], 401);
    $adminId = (string) $chk[2];

    $eng = engine();
    $stmt = $eng->pdo()->prepare('SELECT * FROM ' . AryaDbEngine::quoteIdent($eng->driver, 'admins') . ' WHERE id = ? LIMIT 1');
    $stmt->execute([$adminId]);
    $admin = $stmt->fetch();
    if (!$admin) { clearPending('admin'); fail('حساب یافت نشد.', 401); }

    if (!empty($admin['two_factor_enabled'])) {
        $_SESSION['pending_admin_2fa'] = true;
        ok(['two_factor_required' => true], 'کد تایید درست بود. رمز دومرحله‌ای را وارد کنید.');
    }

    ary_session_regen();
    unset($_SESSION['pending_admin_2fa'], $_SESSION['pending_admin_id'],
          $_SESSION['pending_admin_otp'], $_SESSION['pending_admin_otp_at'], $_SESSION['pending_admin_otp_tries']);
    $_SESSION['admin_id'] = (string) $admin['id'];
    ok([
        'two_factor_required' => false,
        'csrf' => ary_csrf_token(),
        'must_change_password' => !empty($admin['must_change_password'] ?? null),
        'admin' => ['id' => $admin['id'], 'name' => $admin['name'], 'email' => $admin['email'],
                    'phone' => $admin['phone'], 'role' => $admin['role']],
    ], 'ورود موفقیت‌آمیز بود.');
}

if ($action === 'admin_login_step3') {
    if (empty($_SESSION['pending_admin_id']) || empty($_SESSION['pending_admin_2fa'])) fail('درخواست نامعتبر است.', 401);
    $pass2fa = (string) ($rawBody['two_factor_password'] ?? '');
    $eng = engine();
    $stmt = $eng->pdo()->prepare('SELECT * FROM ' . AryaDbEngine::quoteIdent($eng->driver, 'admins') . ' WHERE id = ? LIMIT 1');
    $stmt->execute([(string) $_SESSION['pending_admin_id']]);
    $admin = $stmt->fetch();
    if (!$admin || empty($admin['two_factor_password_hash']) || !ary_password_verify($pass2fa, $admin['two_factor_password_hash'])) {
        fail('رمز دومرحله‌ای اشتباه است.', 401);
    }
    clearPending('admin');
    unset($_SESSION['pending_admin_2fa']);
    ary_session_regen();
    $_SESSION['admin_id'] = (string) $admin['id'];
    ok([
        'csrf' => ary_csrf_token(),
        'must_change_password' => !empty($admin['must_change_password'] ?? null),
        'admin' => ['id' => $admin['id'], 'name' => $admin['name'], 'email' => $admin['email'],
                    'phone' => $admin['phone'], 'role' => $admin['role']],
    ], 'ورود موفقیت‌آمیز بود.');
}

if ($action === 'admin_session') {
    if (empty($_SESSION['admin_id'])) ok(['loggedIn' => false]);
    $eng = engine();
    ensureAdminUpgrade($eng);
    $stmt = $eng->pdo()->prepare('SELECT * FROM ' . AryaDbEngine::quoteIdent($eng->driver, 'admins') . ' WHERE id = ? LIMIT 1');
    $stmt->execute([(string) $_SESSION['admin_id']]);
    $admin = $stmt->fetch();
    if (!$admin) { unset($_SESSION['admin_id']); ok(['loggedIn' => false]); }
    ok([
        'loggedIn' => true,
        'csrf' => ary_csrf_token(),
        'must_change_password' => !empty($admin['must_change_password'] ?? null),
        'admin' => ['id' => $admin['id'], 'name' => $admin['name'], 'email' => $admin['email'],
                    'phone' => $admin['phone'], 'role' => $admin['role']],
    ]);
}

if ($action === 'admin_logout') {
    unset($_SESSION['admin_id'], $_SESSION['pending_admin_id'], $_SESSION['pending_admin_2fa'],
          $_SESSION['pending_admin_otp'], $_SESSION['pending_admin_otp_at'], $_SESSION['pending_admin_otp_tries']);
    ok([], 'خارج شدید.');
}

// ── وضعیت سرور/دیتابیس برای پنل (فقط مدیر) ──────────────────
if ($action === 'admin_review_moderate') {
    requireAdminSession();
    $eng = engine(); createSchema($eng);
    $id = ary_clean_text($rawBody['id'] ?? '');
    $status = (string) ($rawBody['status'] ?? '');
    if (!ary_safe_id($id) || !in_array($status, ['approved', 'rejected', 'pending'], true)) fail('پارامترها نامعتبرند.');
    $q = AryaDbEngine::quoteIdent($eng->driver, 'reviews');
    $st = $eng->pdo()->prepare("UPDATE $q SET status = ? WHERE id = ?");
    $st->execute([$status, $id]);
    if ($st->rowCount() === 0) {
        $chk = $eng->pdo()->prepare("SELECT 1 FROM $q WHERE id = ? LIMIT 1");
        $chk->execute([$id]);
        if (!$chk->fetch()) fail('نظر یافت نشد.', 404);
    }
    ok(['id' => $id, 'status' => $status], 'وضعیت نظر ثبت شد.');
}

if ($action === 'system_status') {
    requireAdminSession(false); // GET — بدون CSRF
    $eng = engine();
    $stats = [];
    foreach (['products','orders','users','categories','tickets','reviews'] as $t) {
        try { $stats[$t] = $eng->countRows($t); } catch (Throwable $e) { $stats[$t] = 0; }
    }
    ok($eng->info() + [
        'tables'     => $stats,
        'demo_mode'  => ary_demo_mode(),
        'writable'   => [
            'root'   => is_writable(__DIR__),
            'config' => is_file(CONFIG_FILE) ? (is_writable(CONFIG_FILE) ? 'writable' : 'locked') : 'missing',
        ],
        'panel_support' => array_keys(AryaPanel::SUPPORTED),
        'db_driver_support' => array_map(fn($k) => ['label' => AryaDbEngine::SUPPORTED[$k]['label'], 'available' => AryaDbEngine::isDriverAvailable($k)], array_keys(AryaDbEngine::SUPPORTED)),
    ]);
}

// ── تغییر رمز عبور مدیر لاگین‌شده (اولین کار پس از نصب) ─────
if ($action === 'admin_change_password') {
    $adminId = requireAdminSession();
    $eng = engine();
    ensureAdminUpgrade($eng);
    $old = (string) ($rawBody['current_password'] ?? '');
    $new = (string) ($rawBody['new_password'] ?? '');
    if (ary_password_policy_error($new) !== '') fail(ary_password_policy_error($new));

    $stmt = $eng->pdo()->prepare('SELECT * FROM ' . AryaDbEngine::quoteIdent($eng->driver, 'admins') . ' WHERE id = ? LIMIT 1');
    $stmt->execute([$adminId]);
    $admin = $stmt->fetch();
    if (!$admin || !ary_password_verify($old, $admin['password_hash'] ?? null)) fail('رمز فعلی اشتباه است.', 401);

    $q = AryaDbEngine::quoteIdent($eng->driver, 'admins');
    $upd = $eng->pdo()->prepare("UPDATE $q SET password_hash = ?, must_change_password = 0 WHERE id = ?");
    $upd->execute([ary_password_hash($new), $adminId]);
    ok([], 'رمز عبور تغییر کرد.');
}

// ── مدیریت حساب‌های ادمین (فقط مدیر لاگین‌شده) ──────────────
if ($action === 'admin_list') {
    requireAdminSession(false); // GET — بدون CSRF
    $eng = engine();
    ensureAdminUpgrade($eng);
    $q = AryaDbEngine::quoteIdent($eng->driver, 'admins');
    $rows = $eng->pdo()->query("SELECT id, name, email, phone, role, two_factor_enabled, created_at FROM $q ORDER BY created_at ASC")->fetchAll();
    ok($rows);
}

if ($action === 'admin_create') {
    requireAdminSession();
    $eng = engine();
    $name  = ary_clean_text($rawBody['name'] ?? '', 255);
    $email = mb_strtolower(ary_clean_text($rawBody['email'] ?? '', 255));
    $phone = ary_clean_text($rawBody['phone'] ?? '', 20);
    $password = (string) ($rawBody['password'] ?? '');
    $twoFactorPassword = (string) ($rawBody['two_factor_password'] ?? '');

    if ($name === '' || $email === '' || $password === '') fail('نام، ایمیل و رمز عبور الزامی است.');
    if (!ary_is_email($email)) fail('ایمیل نامعتبر است.');
    if ($phone !== '' && !ary_is_ir_phone($phone)) fail('شماره موبایل باید با ۰۹ و ۱۱ رقم باشد.');
    $err = ary_password_policy_error($password);
    if ($err !== '') fail($err);

    $q = AryaDbEngine::quoteIdent($eng->driver, 'admins');
    $chk = $eng->pdo()->prepare("SELECT id FROM $q WHERE email = ? OR (phone <> '' AND phone = ?) LIMIT 1");
    $chk->execute([$email, $phone ?: '-']);
    if ($chk->fetch()) fail('حسابی با این ایمیل یا شماره قبلاً وجود دارد.');

    $st = $eng->pdo()->prepare("INSERT INTO $q (id, name, email, phone, password_hash, role, two_factor_enabled, two_factor_password_hash, must_change_password, created_at)
        VALUES (?,?,?,?,?,?,?,?,0,{$eng->nowExpr()})");
    $st->execute([
        'admin_' . bin2hex(random_bytes(6)), $name, $email, $phone,
        ary_password_hash($password), 'admin',
        $twoFactorPassword !== '' ? 1 : 0,
        $twoFactorPassword !== '' ? ary_password_hash($twoFactorPassword) : null,
    ]);
    ok([], 'حساب مدیر جدید ایجاد شد.');
}

if ($action === 'admin_update') {
    $adminId = requireAdminSession();
    $eng = engine();
    $id = ary_clean_text($rawBody['id'] ?? $_GET['id'] ?? '');
    if ($id === '') fail('شناسه الزامی است.');
    $q = AryaDbEngine::quoteIdent($eng->driver, 'admins');

    $fields = []; $params = [$id];
    if (($v = ary_clean_text($rawBody['name'] ?? '', 255)) !== '')  { $fields[] = 'name = ?';   $params[] = $v; }
    if (($v = ary_clean_text($rawBody['phone'] ?? '', 20)) !== '')  { $fields[] = 'phone = ?';  $params[] = $v; }
    if (!empty($rawBody['password'])) {
        $err = ary_password_policy_error((string) $rawBody['password']);
        if ($err !== '') fail($err);
        $fields[] = 'password_hash = ?'; $params[] = ary_password_hash((string) $rawBody['password']);
        $fields[] = 'must_change_password = 0';
    }
    if (array_key_exists('two_factor_password', $rawBody)) {
        $tfa = (string) $rawBody['two_factor_password'];
        if ($tfa === '') {
            $fields[] = 'two_factor_enabled = 0';
            $fields[] = 'two_factor_password_hash = NULL';
        } else {
            $fields[] = 'two_factor_enabled = 1';
            $fields[] = 'two_factor_password_hash = ?';
            $params[] = ary_password_hash($tfa);
        }
    }
    if (!$fields) fail('هیچ فیلدی برای بروزرسانی ارسال نشده است.');

    $st = $eng->pdo()->prepare("UPDATE $q SET " . implode(', ', $fields) . ' WHERE id = ?');
    $st->execute($params);
    ok([], 'حساب بروزرسانی شد.');
}

if ($action === 'admin_delete') {
    $adminId = requireAdminSession();
    $eng = engine();
    $id = ary_clean_text($rawBody['id'] ?? $_GET['id'] ?? '');
    if ($id === '') fail('شناسه الزامی است.');
    if ($id === $adminId) fail('نمی‌توانید حساب خودتان را حذف کنید.');
    $q = AryaDbEngine::quoteIdent($eng->driver, 'admins');
    $cnt = (int) $eng->pdo()->query("SELECT COUNT(*) FROM $q")->fetchColumn();
    if ($cnt <= 1) fail('حذف آخرین حساب مدیر مجاز نیست.');

    $st = $eng->pdo()->prepare("DELETE FROM $q WHERE id = ?");
    $st->execute([$id]);
    ok(['deleted' => $st->rowCount() > 0]);
}

// ═══════════════════════════════════════════════════════════════
// احراز هویت کاربران فروشگاه (سمت سرور) — ثبت‌نام/ورود/بازیابی
// ═══════════════════════════════════════════════════════════════
function userRowPublic(array $u): array {
    return [
        'id' => $u['id'] ?? null, 'name' => $u['name'] ?? null, 'email' => $u['email'] ?? null,
        'phone' => $u['phone'] ?? null, 'national_id' => $u['national_id'] ?? null,
        'avatar' => $u['avatar'] ?? null, 'created_at' => $u['created_at'] ?? null,
    ];
}

if ($action === 'user_register') {
    $eng = engine(); createSchema($eng);
    if (!ary_throttle('user-register:' . ary_client_ip(), 8, 600)) ary_throttle_fail('fail');

    $name  = ary_clean_text($rawBody['name'] ?? '', 255);
    $email = mb_strtolower(ary_clean_text($rawBody['email'] ?? '', 255));
    $phone = preg_replace('/\D/', '', ary_clean_text($rawBody['phone'] ?? ''));
    if (str_starts_with($phone, '98')) $phone = '0' . $phone;
    if (str_starts_with($phone, '0098')) $phone = '0' . substr($phone, 4);
    $password = (string) ($rawBody['password'] ?? '');

    if (mb_strlen($name) < 3) fail('نام باید حداقل ۳ کاراکتر باشد.');
    if (!ary_is_email($email)) fail('ایمیل نامعتبر است.');
    if (!ary_is_ir_phone($phone)) fail('شماره موبایل باید ۱۱ رقمی و با ۰۹ شروع شود.');
    $err = ary_password_policy_error($password);
    if ($err !== '') fail($err);

    $q = AryaDbEngine::quoteIdent($eng->driver, 'users');
    $chk = $eng->pdo()->prepare("SELECT id FROM $q WHERE email = ? OR phone = ? LIMIT 1");
    $chk->execute([$email, $phone]);
    if ($chk->fetch()) fail('کاربری با این ایمیل یا شماره قبلاً ثبت‌نام کرده است.');

    $id = 'user_' . bin2hex(random_bytes(8));
    $st = $eng->pdo()->prepare("INSERT INTO $q (id, name, email, phone, password_hash, addresses, created_at)
        VALUES (?,?,?,?,?,'[]',{$eng->nowExpr()})");
    $st->execute([$id, $name, $email, $phone, ary_password_hash($password)]);

    ok(['user' => ['id' => $id, 'name' => $name, 'email' => $email, 'phone' => $phone]], 'ثبت‌نام انجام شد.');
}

if ($action === 'user_login_step1') {
    $eng = engine();
    if (!ary_throttle('user-login:' . strtolower(ary_client_ip()), 10, 600)) ary_throttle_fail('fail');
    $identifier = ary_clean_text($rawBody['identifier'] ?? '');
    $password   = (string) ($rawBody['password'] ?? '');
    if ($identifier === '' || $password === '') fail('شناسه و رمز عبور الزامی است.');

    $q = AryaDbEngine::quoteIdent($eng->driver, 'users');
    $st = $eng->pdo()->prepare("SELECT * FROM $q WHERE email = ? OR phone = ? LIMIT 1");
    $st->execute([$identifier, $identifier]);
    $user = $st->fetch();
    if (!$user || !ary_password_verify($password, $user['password_hash'] ?? null)) fail('شناسه یا رمز عبور اشتباه است.', 401);

    $otp = ary_generate_otp6();
    // TODO: ارسال واقعی پیامک به $user['phone']
    rememberPendingOtp('user', (string) $user['id'], $otp, (string) ($user['phone'] ?: $user['email']));
    ok(otpResponse($otp, (string) ($user['phone'] ?: $user['email'])) , 'کد تایید ارسال شد.');
}

if ($action === 'user_login_step2') {
    if (!ary_throttle('user-otp:' . ary_client_ip(), 25, 600)) ary_throttle_fail('fail');
    $eng = engine();
    $otp = preg_replace('/\D/', '', ary_clean_text($rawBody['otp'] ?? ''));
    $chk = checkPendingOtp('user', $otp);
    if ($chk[0] !== true) fail($chk[1], 401);
    $userId = (string) $chk[2];

    $q = AryaDbEngine::quoteIdent($eng->driver, 'users');
    $st = $eng->pdo()->prepare("SELECT * FROM $q WHERE id = ? LIMIT 1");
    $st->execute([$userId]);
    $user = $st->fetch();
    clearPending('user');
    if (!$user) fail('حساب یافت نشد.', 401);

    ary_session_regen();
    $_SESSION['user_id'] = (string) $user['id'];
    ok([
        'csrf' => ary_csrf_token(),
        'user' => array_merge(userRowPublic($user), ['addresses' => json_decode((string) ($user['addresses'] ?? '[]'), true) ?: []]),
    ], 'ورود موفق بود.');
}

if ($action === 'user_reset_step1') {
    $eng = engine();
    if (!ary_throttle('user-reset:' . strtolower(ary_client_ip()), 8, 600)) ary_throttle_fail('fail');
    $identifier = ary_clean_text($rawBody['identifier'] ?? '');
    if ($identifier === '') fail('شناسه را وارد کنید.');
    $q = AryaDbEngine::quoteIdent($eng->driver, 'users');
    $st = $eng->pdo()->prepare("SELECT * FROM $q WHERE email = ? OR phone = ? LIMIT 1");
    $st->execute([$identifier, $identifier]);
    $user = $st->fetch();
    // پاسخ یکسان برای موجود/ناموجود تا شمارش اکلوژر نشود
    if (!$user) ok(otpResponse('000000', $identifier), 'اگر حسابی وجود داشته باشد، کد بازیابی ارسال می‌شود.');

    $otp = ary_generate_otp6();
    // TODO: ارسال واقعی ایمیل/پیامک
    rememberPendingOtp('userreset', (string) $user['id'], $otp, (string) ($user['phone'] ?: $user['email']));
    ok(otpResponse($otp, (string) ($user['phone'] ?: $user['email'])), 'کد بازیابی ارسال شد.');
}

if ($action === 'user_reset_step2') {
    $eng = engine();
    $otp  = preg_replace('/\D/', '', ary_clean_text($rawBody['otp'] ?? ''));
    $chk  = checkPendingOtp('userreset', $otp);
    if ($chk[0] !== true) fail($chk[1], 401);
    $userId = (string) $chk[2];

    $new = (string) ($rawBody['new_password'] ?? '');
    $err = ary_password_policy_error($new);
    if ($err !== '') fail($err);

    $q = AryaDbEngine::quoteIdent($eng->driver, 'users');
    $st = $eng->pdo()->prepare("UPDATE $q SET password_hash = ? WHERE id = ?");
    $st->execute([ary_password_hash($new), $userId]);
    clearPending('userreset');
    ok([], 'رمز عبور تازه شد. حالا وارد شوید.');
}

if ($action === 'user_session') {
    if (empty($_SESSION['user_id'])) ok(['loggedIn' => false]);
    $eng = engine(); createSchema($eng);
    $q = AryaDbEngine::quoteIdent($eng->driver, 'users');
    $st = $eng->pdo()->prepare("SELECT * FROM $q WHERE id = ? LIMIT 1");
    $st->execute([(string) $_SESSION['user_id']]);
    $user = $st->fetch();
    if (!$user) { unset($_SESSION['user_id']); ok(['loggedIn' => false]); }
    ok([
        'loggedIn' => true,
        'csrf' => ary_csrf_token(),
        'user' => array_merge(userRowPublic($user), ['addresses' => json_decode((string) ($user['addresses'] ?? '[]'), true) ?: []]),
    ]);
}

if ($action === 'user_logout') {
    unset($_SESSION['user_id']);
    ok([], 'خارج شدید.');
}

if ($action === 'user_update') {
    $userId = currentUserId();
    if (!$userId) fail('ابتدا وارد حساب خود شوید.', 401);
    ary_require_csrf('fail');
    $eng = engine();
    $q = AryaDbEngine::quoteIdent($eng->driver, 'users');

    $fields = []; $params = [];
    if (($v = ary_clean_text($rawBody['name'] ?? '', 255)) !== '') { $fields[] = 'name = ?'; $params[] = $v; }
    if (array_key_exists('national_id', $rawBody)) {
        $v = preg_replace('/\D/', '', ary_clean_text($rawBody['national_id'] ?? ''));
        if ($v !== '' && strlen($v) > 10) fail('کد ملی نامعتبر است.');
        $fields[] = 'national_id = ?'; $params[] = $v;
    }
    if (array_key_exists('phone', $rawBody)) {
        $v = preg_replace('/\D/', '', ary_clean_text((string) $rawBody['phone']));
        if ($v !== '') {
            if (!ary_is_ir_phone($v)) fail('شماره موبایل معتبر نیست.');
            $dup = $eng->pdo()->prepare("SELECT id FROM $q WHERE phone = ? AND id <> ? LIMIT 1");
            $dup->execute([$v, $userId]);
            if ($dup->fetch()) fail('این شماره موبایل روی حساب دیگری ثبت شده است.');
            $fields[] = 'phone = ?'; $params[] = $v;
        }
    }
    if (array_key_exists('addresses', $rawBody)) {
        $raw = is_array($rawBody['addresses']) ? $rawBody['addresses'] : [];
        if (count($raw) > 20) fail('حداکثر ۲۰ نشانی ذخیره می‌شود.');
        $list = [];
        foreach ($raw as $a) {
            if (is_array($a)) {
                $row = [];
                foreach (['title', 'full', 'postal', 'plaque', 'unit'] as $k) {
                    if (isset($a[$k]) && !is_array($a[$k])) {
                        $row[$k] = ary_clean_text((string) $a[$k], $k === 'full' ? 1000 : 100);
                    }
                }
                if (($row['full'] ?? '') !== '') $list[] = $row;
            } else {
                $t = ary_clean_text((string) $a, 1000);
                if ($t !== '') $list[] = ['full' => $t];
            }
        }
        $fields[] = 'addresses = ?'; $params[] = json_encode($list, JSON_UNESCAPED_UNICODE);
    }
    if (array_key_exists('avatar', $rawBody)) {
        $av = (string) ($rawBody['avatar'] ?? '');
        if ($av !== '' && !preg_match('/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]{1,400000}$/', $av) && !preg_match('#^/(assets/|uploads/)#', $av)) {
            fail('تصویر پروفایل نامعتبر است.');
        }
        $fields[] = 'avatar = ?'; $params[] = $av;
    }
    if (!$fields) fail('چیزی برای ذخیره ارسال نشد.');
    $params[] = $userId;
    $eng->pdo()->prepare("UPDATE $q SET " . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    ok([], 'پروفایل به‌روز شد.');
}

if ($action === 'user_change_password') {
    $userId = currentUserId();
    if (!$userId) fail('ابتدا وارد حساب خود شوید.', 401);
    ary_require_csrf('fail');
    $eng = engine();
    $q = AryaDbEngine::quoteIdent($eng->driver, 'users');
    $st = $eng->pdo()->prepare("SELECT * FROM $q WHERE id = ? LIMIT 1");
    $st->execute([$userId]);
    $user = $st->fetch();
    if (!$user) fail('حساب یافت نشد.', 401);
    if (!ary_password_verify((string) ($rawBody['current_password'] ?? ''), $user['password_hash'] ?? null)) fail('رمز فعلی اشتباه است.', 401);
    $new = (string) ($rawBody['new_password'] ?? '');
    $err = ary_password_policy_error($new);
    if ($err !== '') fail($err);
    $eng->pdo()->prepare("UPDATE $q SET password_hash = ? WHERE id = ?")->execute([ary_password_hash($new), $userId]);
    ok([], 'رمز عبور تغییر کرد.');
}

// حذف دائمی حساب توسط خود کاربر: حالا الزاماً تطبیق شناسه + سشن لازم است
if ($action === 'user_delete') {
    $eng = engine();
    $id = ary_clean_text($rawBody['id'] ?? $_GET['id'] ?? '');
    $identifier = ary_clean_text($rawBody['identifier'] ?? '');
    if ($id === '' || !ary_safe_id($id)) fail('شناسه کاربر نامعتبر است.');

    $userId = currentUserId();
    $isSelf = ($userId !== null && $userId === $id);
    $isAdmin = currentAdminId() !== null;
    if (!$isSelf && !$isAdmin) {
        // بدون سشن: حداقل تطبیق کامل شناسه + توکن Bearer الزامی است
        $auth = ary_get_header('Authorization');
        $hasBearer = str_starts_with($auth, 'Bearer ') && defined('API_SECRET')
                  && hash_equals((string) API_SECRET, substr($auth, 7));
        if (!$hasBearer) fail('برای حذف حساب، وارد شوید یا شناسه را دقیق وارد کنید.', 403);
    }
    if (!$isSelf && !$isAdmin && $identifier === '') fail('برای اطمینان، ایمیل یا شماره حساب را هم وارد کنید.', 403);

    $q = AryaDbEngine::quoteIdent($eng->driver, 'users');
    if (!$isSelf || $identifier !== '') {
        $check = $eng->pdo()->prepare("SELECT id FROM $q WHERE id = ? AND (email = ? OR phone = ?) LIMIT 1");
        $check->execute([$id, $identifier, $identifier]);
        if (!$check->fetch() && !$isAdmin) fail('اطلاعات کاربر مطابقت ندارد.', 403);
    }
    $del = $eng->pdo()->prepare("DELETE FROM $q WHERE id = ?");
    $del->execute([$id]);
    if ($isSelf) unset($_SESSION['user_id']);
    ok(['deleted' => $del->rowCount() > 0], 'حساب کاربری حذف شد.');
}

// ═══════════════════════════════════════════════════════════════
// اکشن‌های تخصصی سراسری (نظر/رأی/تیکت) — ورودی‌های عمومی
// ═══════════════════════════════════════════════════════════════
if ($action === 'review_create') {
    checkRequestAuth();
    $eng = engine(); createSchema($eng);
    if (!ary_throttle('review:' . ary_client_ip(), 10, 600)) ary_throttle_fail('fail');

    $productId = ary_clean_text($rawBody['product_id'] ?? '');
    $text = ary_clean_text($rawBody['text'] ?? '', 3000);
    $rating = (int) ($rawBody['rating'] ?? 0);
    $parent = ary_clean_text($rawBody['parent'] ?? '');
    if (!ary_safe_id($productId)) fail('product_id نامعتبر است.');
    $hasParent = $parent !== '' && ary_safe_id($parent);
    if ($text === '' || $rating < ($hasParent ? 0 : 1) || $rating > 5) fail('امتیاز ۱ تا ۵ و متن نظر الزامی است.');

    $uid = currentUserId();
    $userName = ary_clean_text($rawBody['user_name'] ?? 'کاربر', 100);
    if ($uid) {
        $q = AryaDbEngine::quoteIdent($eng->driver, 'users');
        $st = $eng->pdo()->prepare("SELECT name FROM $q WHERE id = ? LIMIT 1");
        $st->execute([$uid]);
        $row = $st->fetch();
        if ($row) $userName = (string) $row['name'];
    }

    $q = AryaDbEngine::quoteIdent($eng->driver, 'reviews');
    $id = 'rev_' . bin2hex(random_bytes(8));
    $eng->pdo()->prepare("INSERT INTO $q (id, product_id, user_name, rating, text, status, likes, dislikes, parent, user_id, created_at)
        VALUES (?,?,?,?,?, 'pending', 0, 0, ?, ?, {$eng->nowExpr()})")
        ->execute([$id, $productId, $userName, $rating, $text, $hasParent ? $parent : null, $uid]);
    ok(['id' => $id, 'status' => 'pending'], 'نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود.');
}

if ($action === 'review_vote') {
    checkRequestAuth();
    $eng = engine(); createSchema($eng);
    if (!ary_throttle('review-vote:' . ary_client_ip(), 30, 60)) ary_throttle_fail('fail');
    $id = ary_clean_text($rawBody['id'] ?? '');
    $kind = (string) ($rawBody['kind'] ?? 'like');
    $map = ['like' => ['likes', '+'], 'unlike' => ['likes', '-'],
            'dislike' => ['dislikes', '+'], 'undislike' => ['dislikes', '-']];
    if (!isset($map[$kind]) || !ary_safe_id($id)) fail('پارامترها نامعتبرند.');
    [$col, $op] = $map[$kind];
    $q = AryaDbEngine::quoteIdent($eng->driver, 'reviews');
    $eng->pdo()->prepare("UPDATE $q SET $col = CASE WHEN $col $op 1 < 0 THEN 0 ELSE $col $op 1 END WHERE id = ? AND status = 'approved'")
        ->execute([$id]);
    ok(['voted' => true]);
}

if ($action === 'ticket_create') {
    checkRequestAuth();
    $eng = engine(); createSchema($eng);
    if (!ary_throttle('ticket:' . ary_client_ip(), 6, 600)) ary_throttle_fail('fail');
    $phone = preg_replace('/\D/', '', ary_clean_text((string) ($rawBody['user_phone'] ?? $rawBody['phone'] ?? '')));
    $name = ary_clean_text((string) ($rawBody['user_name'] ?? $rawBody['name'] ?? ''), 255);
    $subject = ary_clean_text($rawBody['subject'] ?? '', 500);
    $msg = ary_clean_text($rawBody['message'] ?? '', 4000);
    if (!ary_is_ir_phone($phone)) fail('شماره موبایل معتبر لازم است تا پاسخ تیکت به شما برسد.');
    if ($subject === '' || $msg === '') fail('موضوع و متن تیکت الزامی است.');
    $id = 'tkt_' . bin2hex(random_bytes(8));
    $q = AryaDbEngine::quoteIdent($eng->driver, 'tickets');
    $messages = json_encode([['from' => 'user', 'text' => $msg, 'at' => date('c')]], JSON_UNESCAPED_UNICODE);
    $eng->pdo()->prepare("INSERT INTO $q (id, user_phone, user_name, subject, status, priority, messages, created_at)
        VALUES (?,?,?,?,'open','normal',?,{$eng->nowExpr()})")
        ->execute([$id, $phone, $name, $subject, $messages]);
    ok(['id' => $id], 'تیکت ثبت شد.');
}

if ($action === 'ticket_reply') {
    $eng = engine(); createSchema($eng);
    $id = ary_clean_text($rawBody['id'] ?? '');
    $text = ary_clean_text((string) ($rawBody['text'] ?? $rawBody['reply'] ?? $rawBody['message'] ?? ''), 4000);
    $from = (string) ($rawBody['from'] ?? 'user');
    $phone = preg_replace('/\D/', '', ary_clean_text((string) ($rawBody['user_phone'] ?? $rawBody['phone'] ?? '')));
    if (!ary_safe_id($id) || $text === '') fail('شناسه تیکت یا متن نامعتبر است.');
    $uid = currentAdminId();
    if (!$uid) {
        checkRequestAuth();
        if (!ary_throttle('ticket-reply:' . ary_client_ip(), 12, 600)) ary_throttle_fail('fail');
        $from = 'user';
    } else {
        // پاسخ ادمین: CSRF لازم است (از سشن)
        if (!ary_csrf_valid()) { // در body هم می‌تواند باشد
            $bodyCsrf = (string) ($rawBody['_csrf'] ?? '');
            if ($bodyCsrf === '' || !hash_equals((string) ($_SESSION['csrf_token'] ?? ''), $bodyCsrf)) fail('توکن CSRF لازم است.', 403);
        }
        $from = 'admin';
    }
    $q = AryaDbEngine::quoteIdent($eng->driver, 'tickets');
    $sel = $eng->pdo()->prepare("SELECT messages, user_phone FROM $q WHERE id = ? LIMIT 1");
    $sel->execute([$id]);
    $row = $sel->fetch();
    if (!$row) fail('تیکت یافت نشد.', 404);
    if ($from === 'user' && (!ary_is_ir_phone($phone) || $phone !== (string) $row['user_phone'])) {
        fail('شما فقط می‌توانید به تیکت شماره خودتان پاسخ دهید.', 403);
    }
    $msgs = json_decode((string) $row['messages'], true) ?: [];
    $msgs[] = ['from' => $from, 'text' => $text, 'at' => date('c')];
    $eng->pdo()->prepare("UPDATE $q SET messages = ? WHERE id = ?")
        ->execute([json_encode(array_slice($msgs, -200), JSON_UNESCAPED_UNICODE), $id]);
    ok(['count' => count($msgs)]);
}

// ═══════════════════════════════════════════════════════════════
// عملیات عمومی CRUD (با سیاست دسترسی هر جدول)
// ═══════════════════════════════════════════════════════════════
$table = validateTable((string) ($_GET['table'] ?? $rawBody['table'] ?? 'products'));
$id    = ary_clean_text($_GET['id'] ?? $rawBody['id'] ?? '');
$eng   = engine();
createSchema($eng);
$Q     = fn(string $t) => AryaDbEngine::quoteIdent($eng->driver, $t);
$isAdmin = currentAdminId() !== null;

switch ($action) {

    case 'getAll': {
        if (($table === 'settings' || $table === 'users') && !$isAdmin) fail('دسترسی به این جدول فقط برای مدیر پنل است.', 403);
        $where = '1=1'; $params = [];

        // سیاست خواندن برای کاربران مهمان
        if (!$isAdmin) {
            if ($table === 'reviews') { $where .= " AND status = 'approved'"; }
            if ($table === 'orders') {
                if (!empty($_GET['user_phone']) && ary_is_ir_phone((string) $_GET['user_phone'])) {
                    $where .= ' AND user_phone = ?'; $params[] = preg_replace('/\D/', '', (string) $_GET['user_phone']);
                } else {
                    fail('برای مشاهده سفارش‌ها شماره موبایل خود را وارد کنید (یا وارد پنل مدیریت شوید).', 403);
                }
            }
            if ($table === 'tickets') {
                if (!empty($_GET['user_phone']) && ary_is_ir_phone((string) $_GET['user_phone'])) {
                    $where .= ' AND user_phone = ?'; $params[] = preg_replace('/\D/', '', (string) $_GET['user_phone']);
                } else {
                    fail('برای مشاهده تیکت‌ها شماره موبایل خود را وارد کنید.', 403);
                }
            }
        }
        if ($isAdmin && !empty($_GET['status'])) {
            $where .= ' AND status = ?'; $params[] = ary_clean_text((string) $_GET['status'], 50);
        }

        $order = $eng->hasColumn($table, 'created_at') ? ' ORDER BY ' . $Q('created_at') . ' DESC' : '';
        $stmt = $eng->pdo()->prepare("SELECT * FROM {$Q($table)} WHERE $where$order LIMIT 500");
        $stmt->execute($params);
        ok(ary_strip_secrets_all($stmt->fetchAll()));
    }

    case 'getById': {
        if (($table === 'settings' || $table === 'users') && !$isAdmin) fail('دسترسی به این جدول فقط برای مدیر پنل است.', 403);
        if (!ary_safe_id($id)) fail('id نامعتبر است.');
        $stmt = $eng->pdo()->prepare("SELECT * FROM {$Q($table)} WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$isAdmin && $table === 'reviews' && $row && ($row['status'] ?? '') !== 'approved') $row = null;
        if (!$isAdmin && in_array($table, ['orders', 'tickets'], true)) {
            $gPhone = preg_replace('/\D/', '', ary_clean_text((string) ($_GET['user_phone'] ?? '')));
            if (!ary_is_ir_phone($gPhone)) fail('برای مشاهده این رکورد شماره موبایل حساب خود را ارسال کنید.', 403);
            if ($row && (string) ($row['user_phone'] ?? '') !== $gPhone) $row = null; // متعلق به شما نیست
        }
        ok($row ? ary_strip_secrets($row) : null);
    }

    case 'upsert': {
        if ($table === 'users' || $table === 'tickets') fail('برای این جدول از اکشن‌های اختصاصی (user_*/ticket_*) استفاده کنید.', 403);
        if (in_array($table, ADMIN_ONLY_TABLES, true) && !$isAdmin) fail('این عملیات فقط برای مدیر پنل است.', 403);
        write_guard();

        $record = $rawBody['record'] ?? $rawBody;
        $rid = ary_clean_text((string) ($record['id'] ?? ''));
        if (!ary_safe_id($rid)) fail('record.id نامعتبر است (حروف/ارقام/_- تا ۶۴ کاراکتر).');

        $cols = $eng->columnsOf($table);
        $toInsert = [];
        foreach ($cols as $col) {
            if ($col === 'password_hash' || $col === 'two_factor_password_hash') continue; // هرگز از این مسیر نه
            if (!array_key_exists($col, $record)) continue;
            $val = $record[$col];
            if (is_array($val) || is_object($val)) $val = json_encode($val, JSON_UNESCAPED_UNICODE);
            if ($val === null) { $toInsert[$col] = null; continue; }
            if (is_string($val) && $col !== 'created_at' && mb_strlen($val) > 1_000_000) fail('مقدار «' . $col . '» بیش از حد بزرگ است.');
            $toInsert[$col] = $val;
        }
        if (!$toInsert) fail('No valid fields');

        // سیاست نوشتن روی فیلدهای سفارش/تیکت توسط کاربر
        if (!$isAdmin) {
            if ($table === 'orders') {
                if (!empty($toInsert['status']) && !in_array($toInsert['status'], ['pending', 'processing'], true)) {
                    $toInsert['status'] = 'pending';
                }
                // ثبت سفارش فقط با قیمت مجاز: total از مجموع آیتم‌ها (سمت سرور) محاسبه نشدنی است
                // چون قیمت در رکورد نیست؛ ولی status/votes محافظت می‌شوند.
            }
            if ($table === 'reviews') $toInsert['status'] = 'pending';
        }

        $keys = array_keys($toInsert);
        $sql = $eng->upsertSql($table, $keys);
        $vals = array_values($toInsert);
        try {
            $eng->pdo()->prepare($sql)->execute($vals);
        } catch (Throwable $e) {
            ary_log('upsert', $e->getMessage());
            fail('ذخیره‌سازی ناموفق بود. نام فیلدها را با ساختار جدول مطابقت دهید.', 422);
        }
        ok(['id' => $rid]);
    }

    case 'delete': {
        if ($table === 'users' || $table === 'settings') fail('حذف این جدول از این مسیر مجاز نیست.', 403);
        if (!$isAdmin) fail('حذف فقط با حساب مدیر ممکن است.', 403);
        if (!str_starts_with(ary_get_header('Authorization'), 'Bearer ')) { if (!ary_csrf_valid()) fail('توکن CSRF معتبر لازم است.', 403); }
        if (!ary_safe_id($id)) fail('id نامعتبر است.');
        $stmt = $eng->pdo()->prepare("DELETE FROM {$Q($table)} WHERE id = ?");
        $stmt->execute([$id]);
        ok(['deleted' => $stmt->rowCount() > 0]);
    }

    case 'import': {
        if (!$isAdmin) fail('واردات دسته‌جمعی فقط برای مدیر است.', 403);
        if (!str_starts_with(ary_get_header('Authorization'), 'Bearer ')) { if (!ary_csrf_valid()) fail('توکن CSRF معتبر لازم است.', 403); }
        $records = $rawBody['records'] ?? [];
        if (!is_array($records) || !$records) fail('No records provided');
        if (count($records) > 500) fail('حداکثر ۵۰۰ رکورد در هر واردات.');

        $pdo = $eng->pdo();
        $pdo->beginTransaction();
        $count = 0;
        try {
            $cols = $eng->columnsOf($table);
            foreach ($records as $record) {
                if (!is_array($record)) continue;
                $rid = ary_clean_text((string) ($record['id'] ?? ''));
                if (!ary_safe_id($rid)) continue;
                $toInsert = [];
                foreach ($cols as $col) {
                    if ($col === 'password_hash') continue;
                    if (!array_key_exists($col, $record)) continue;
                    $val = $record[$col];
                    if (is_array($val) || is_object($val)) $val = json_encode($val, JSON_UNESCAPED_UNICODE);
                    $toInsert[$col] = $val;
                }
                if (!$toInsert) continue;
                $pdo->prepare($eng->upsertSql($table, array_keys($toInsert)))->execute(array_values($toInsert));
                $count++;
            }
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            ary_log('import', $e->getMessage());
            fail('واردات ناموفق بود و لغو شد.', 422);
        }
        ok(['imported' => $count]);
    }

    case 'stats': {
        if (!$isAdmin) { // آمار عمومی فروشگاه برای صفحه اصلی (بدون جدول‌های حساس)
            ok(['products' => $eng->countRows('products'), 'reviews' => $eng->countRows('reviews')]);
        }
        $stats = [];
        foreach (ALLOWED_TABLES as $t) $stats[$t] = $eng->countRows($t);
        ok($stats);
    }

    default:
        fail("Unknown action: " . preg_replace('/[^a-z0-9_]/i', '', $action));
}
