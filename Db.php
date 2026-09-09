<?php
// ═══════════════════════════════════════════════════════════════
// AryaStore — PHP/MySQL Backend API
// File: Db.php
// ═══════════════════════════════════════════════════════════════
// این نسخه شامل یک ویزارد نصب (setup) است:
// - وقتی فایل config.php کنار همین فایل وجود نداشته باشد، دیتابیس
//   «پیکربندی نشده» تلقی می‌شود و فرانت‌اند صفحه «اتصال دیتابیس» را
//   نشان می‌دهد.
// - بعد از تکمیل فرم اتصال (میزبان/نام دیتابیس/کاربر/رمز)، این فایل
//   اتصال را تست می‌کند، خودِ دیتابیس را (در صورت نبودن) می‌سازد،
//   جداول لازم را ایجاد می‌کند، یک حساب مدیر پیش‌فرض می‌سازد و در
//   نهایت config.php را روی سرور می‌نویسد.
//
// نکته امنیتی مهم: کد تایید (OTP) در این نسخه به دلیل نبود سرویس
// واقعی پیامک/ایمیل، در پاسخ سرور (فیلد otp_demo) برگردانده می‌شود تا
// در حالت آزمایشی قابل استفاده باشد. پیش از استفاده واقعی/انتشار
// عمومی سایت، حتماً باید:
//   1) فراخوانی یک سرویس واقعی ارسال پیامک/ایمیل را جایگزین بخش
//      «TODO: ارسال واقعی OTP» در پایین همین فایل کنید.
//   2) خط مربوط به «otp_demo» در پاسخ را حذف کنید.
// ═══════════════════════════════════════════════════════════════

session_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

define('CONFIG_FILE', __DIR__ . '/config.php');
define('DB_CHARSET', 'utf8mb4');
define('OTP_TTL_SECONDS', 180); // مدت اعتبار کد تایید

// ── Response helpers ──
function ok($data = [], $msg = 'success') {
    echo json_encode(['ok' => true, 'data' => $data, 'msg' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}
function fail($msg = 'error', $code = 400) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'msg' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

function isConfigured() {
    return file_exists(CONFIG_FILE);
}

function loadConfig() {
    if (!isConfigured()) return false;
    require_once CONFIG_FILE;
    return defined('DB_HOST');
}

// ── DB Connection ──
function getDB() {
    static $pdo = null;
    if ($pdo) return $pdo;
    if (!loadConfig()) fail('دیتابیس هنوز پیکربندی نشده است. ابتدا از صفحه اصلی سایت، دیتابیس را متصل کنید.', 503);
    try {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        fail('Database connection failed: ' . $e->getMessage(), 500);
    }
}

// ── Auth check (برای عملیات CRUD فروشگاه؛ مجزا از لاگین پنل ادمین) ──
function checkAuth() {
    if (!loadConfig()) fail('دیتابیس هنوز پیکربندی نشده است.', 503);
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (strpos($auth, 'Bearer ') === 0) {
        $token = substr($auth, 7);
        if (!defined('API_SECRET') || $token !== API_SECRET) fail('Unauthorized', 401);
    } else {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
        $host = $_SERVER['HTTP_HOST'] ?? '';
        if (!str_contains($origin, $host) && $origin !== '') {
            fail('Unauthorized', 401);
        }
    }
}

// ── فقط برای عملیات پنل مدیریت: باید از قبل با سشن لاگین کرده باشد ──
function requireAdminSession() {
    if (empty($_SESSION['admin_id'])) fail('Unauthorized: admin session required', 401);
    return $_SESSION['admin_id'];
}

// ── Create tables if not exist ──
function createTables() {
    $db = getDB();
    $tables = [
        "CREATE TABLE IF NOT EXISTS `products` (
            `id` VARCHAR(64) PRIMARY KEY,
            `title` VARCHAR(500),
            `category` VARCHAR(64),
            `price` DECIMAL(18,0) DEFAULT 0,
            `original_price` DECIMAL(18,0) DEFAULT 0,
            `stock` INT DEFAULT 0,
            `description` TEXT,
            `image` TEXT,
            `images` LONGTEXT,
            `article` LONGTEXT,
            `videos` LONGTEXT,
            `slug` VARCHAR(255),
            `seo_title` VARCHAR(500),
            `seo_description` TEXT,
            `rating` DECIMAL(3,1) DEFAULT 0,
            `sales` INT DEFAULT 0,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_category (`category`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS `orders` (
            `id` VARCHAR(64) PRIMARY KEY,
            `user_name` VARCHAR(255),
            `user_phone` VARCHAR(20),
            `address` TEXT,
            `delivery_slot` VARCHAR(100),
            `items` LONGTEXT,
            `total` DECIMAL(18,0) DEFAULT 0,
            `status` VARCHAR(50) DEFAULT 'pending',
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_phone (`user_phone`),
            INDEX idx_status (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS `users` (
            `id` VARCHAR(64) PRIMARY KEY,
            `name` VARCHAR(255),
            `email` VARCHAR(255) UNIQUE,
            `phone` VARCHAR(20) UNIQUE,
            `password_hash` VARCHAR(255),
            `national_id` VARCHAR(20),
            `addresses` LONGTEXT,
            `avatar` LONGTEXT,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // نکته: ثبت‌نام عمومی ادمین حذف شده؛ حساب‌های ادمین فقط به‌صورت
        // دستی (از طریق phpMyAdmin یا بخش «کاربران مدیر» داخل پنل، توسط
        // یک مدیر از قبل واردشده) ایجاد می‌شوند.
        "CREATE TABLE IF NOT EXISTS `admins` (
            `id` VARCHAR(64) PRIMARY KEY,
            `name` VARCHAR(255),
            `email` VARCHAR(255) UNIQUE,
            `phone` VARCHAR(20) UNIQUE,
            `password_hash` VARCHAR(255),
            `role` VARCHAR(50) DEFAULT 'admin',
            `two_factor_enabled` TINYINT(1) DEFAULT 0,
            `two_factor_password_hash` VARCHAR(255) DEFAULT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS `categories` (
            `id` VARCHAR(64) PRIMARY KEY,
            `title` VARCHAR(255),
            `icon` VARCHAR(50)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS `tickets` (
            `id` VARCHAR(64) PRIMARY KEY,
            `user_phone` VARCHAR(20),
            `user_name` VARCHAR(255),
            `subject` VARCHAR(500),
            `status` VARCHAR(50) DEFAULT 'open',
            `priority` VARCHAR(20) DEFAULT 'normal',
            `messages` LONGTEXT,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (`user_phone`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS `reviews` (
            `id` VARCHAR(64) PRIMARY KEY,
            `product_id` VARCHAR(64),
            `user_name` VARCHAR(255),
            `rating` TINYINT DEFAULT 0,
            `text` TEXT,
            `status` VARCHAR(20) DEFAULT 'pending',
            `likes` INT DEFAULT 0,
            `dislikes` INT DEFAULT 0,
            `parent` VARCHAR(64),
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_product (`product_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    ];

    foreach ($tables as $sql) {
        $db->exec($sql);
    }

    // اگر هیچ حساب مدیری وجود ندارد، یک حساب مدیر پیش‌فرض بساز
    $count = (int) $db->query("SELECT COUNT(*) FROM `admins`")->fetchColumn();
    if ($count === 0) {
        $stmt = $db->prepare(
            "INSERT INTO `admins` (id, name, email, phone, password_hash, role, two_factor_enabled)
             VALUES (:id, :name, :email, :phone, :password_hash, 'superadmin', 0)"
        );
        $stmt->execute([
            ':id'            => 'admin_' . bin2hex(random_bytes(6)),
            ':name'          => 'مدیر اصلی',
            ':email'         => 'admin@arya.ir',
            ':phone'         => '09120000000',
            ':password_hash' => password_hash('Admin@1234', PASSWORD_DEFAULT),
        ]);
    }
}

// ── Allowed tables (برای عملیات عمومی CRUD فروشگاه) ──
const ALLOWED_TABLES = ['products','orders','users','categories','tickets','reviews'];

function validateTable($t) {
    if (!in_array($t, ALLOWED_TABLES)) fail('Invalid table: ' . $t);
    return $t;
}

function maskIdentifier($id) {
    // برای نمایش امن مقصد کد تایید، بخشی از ایمیل/شماره را مخفی می‌کند
    if (strpos($id, '@') !== false) {
        [$name, $domain] = explode('@', $id, 2);
        $visible = mb_substr($name, 0, 2);
        return $visible . str_repeat('*', max(1, mb_strlen($name) - 2)) . '@' . $domain;
    }
    $len = strlen($id);
    if ($len <= 4) return str_repeat('*', $len);
    return substr($id, 0, 2) . str_repeat('*', $len - 4) . substr($id, -2);
}

function generateOtp6() {
    return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

// ── Request handling ──
$method = $_SERVER['REQUEST_METHOD'];
$rawBody = json_decode(file_get_contents('php://input'), true) ?? [];
$action  = $_GET['action'] ?? $rawBody['action'] ?? 'getAll';

// ═══════════════════════════════════════════════════════════════
// اکشن‌هایی که نیاز به دیتابیس پیکربندی‌شده ندارند
// ═══════════════════════════════════════════════════════════════
if ($action === 'status') {
    ok(['configured' => isConfigured()]);
}

if ($action === 'setup') {
    if (isConfigured()) fail('Database has already been configured.', 409);

    $host   = trim($rawBody['host']   ?? $_POST['host']   ?? '');
    $dbname = trim($rawBody['dbname'] ?? $_POST['dbname'] ?? '');
    $dbuser = trim($rawBody['dbuser'] ?? $_POST['dbuser'] ?? '');
    $dbpass = (string) ($rawBody['dbpass'] ?? $_POST['dbpass'] ?? '');

    if ($host === '' || $dbname === '' || $dbuser === '') {
        fail('میزبان، نام دیتابیس و نام کاربری الزامی است.');
    }

    // مرحله ۱: اتصال به سرور MySQL بدون انتخاب دیتابیس (برای تست اطلاعات ورود)
    try {
        $testPdo = new PDO("mysql:host=$host;charset=utf8mb4", $dbuser, $dbpass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);
    } catch (PDOException $e) {
        fail('اتصال به MySQL ناموفق بود. اطلاعات میزبان/کاربری/رمز را بررسی کنید. (' . $e->getMessage() . ')', 500);
    }

    // مرحله ۲: ساخت دیتابیس در صورت نبودن
    $safeDbName = preg_replace('/[^A-Za-z0-9_]/', '', $dbname);
    if ($safeDbName === '') fail('نام دیتابیس نامعتبر است.');
    try {
        $testPdo->exec("CREATE DATABASE IF NOT EXISTS `$safeDbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    } catch (PDOException $e) {
        fail('ساخت دیتابیس ناموفق بود: ' . $e->getMessage(), 500);
    }

    // مرحله ۳: نوشتن config.php روی سرور
    $apiSecret = bin2hex(random_bytes(24));
    $configContent = "<?php\n" .
        "// این فایل به‌صورت خودکار توسط ویزارد نصب ساخته شده است.\n" .
        "define('DB_HOST', " . var_export($host, true) . ");\n" .
        "define('DB_NAME', " . var_export($safeDbName, true) . ");\n" .
        "define('DB_USER', " . var_export($dbuser, true) . ");\n" .
        "define('DB_PASS', " . var_export($dbpass, true) . ");\n" .
        "define('API_SECRET', " . var_export($apiSecret, true) . ");\n";

    if (@file_put_contents(CONFIG_FILE, $configContent) === false) {
        fail('نوشتن فایل config.php ناموفق بود. مطمئن شوید پوشه سایت قابل نوشتن (writable) است.', 500);
    }

    // مرحله ۴: ساخت جداول + حساب مدیر پیش‌فرض
    try {
        createTables();
    } catch (Exception $e) {
        @unlink(CONFIG_FILE); // اگر ساخت جداول شکست خورد، config.php را پاک کن تا setup دوباره قابل اجرا باشد
        fail('ساخت جداول ناموفق بود: ' . $e->getMessage(), 500);
    }

    ok([
        'connected' => true,
        'default_admin' => [
            'email' => 'admin@arya.ir',
            'password' => 'Admin@1234',
            'note' => 'لطفاً بلافاصله پس از اولین ورود، رمز عبور را تغییر دهید.'
        ]
    ], 'دیتابیس با موفقیت متصل و پیکربندی شد.');
}

// ═══════════════════════════════════════════════════════════════
// لاگین پنل مدیریت (۳ مرحله‌ای: رمز عبور → کد تایید ۶ رقمی → رمز دومرحله‌ای در صورت فعال بودن)
// ═══════════════════════════════════════════════════════════════
if ($action === 'admin_login_step1') {
    $db = getDB();
    $identifier = trim($rawBody['identifier'] ?? '');
    $password   = (string) ($rawBody['password'] ?? '');

    if ($identifier === '' || $password === '') fail('شناسه و رمز عبور الزامی است.');

    $stmt = $db->prepare("SELECT * FROM `admins` WHERE email = :id1 OR phone = :id2 LIMIT 1");
    $stmt->execute([':id1' => $identifier, ':id2' => $identifier]);
    $admin = $stmt->fetch();

    if (!$admin || !password_verify($password, $admin['password_hash'])) {
        fail('شناسه یا رمز عبور اشتباه است.', 401);
    }

    $otp = generateOtp6();
    $_SESSION['pending_admin_id']    = $admin['id'];
    $_SESSION['pending_admin_otp']   = $otp;
    $_SESSION['pending_admin_otp_at'] = time();

    $target = $admin['phone'] ?: $admin['email'];

    // TODO: ارسال واقعی OTP — اینجا باید به یک سرویس پیامک/ایمیل واقعی وصل شود.
    // مثال (پیامک با کاوه‌نگار/ملی‌پیامک) یا ایمیل با PHPMailer را اینجا صدا بزنید.
    // فعلاً به دلیل نبود سرویس واقعی، کد در پاسخ (otp_demo) برگردانده می‌شود.

    ok([
        'otp_required' => true,
        'target_masked' => maskIdentifier($target),
        'otp_demo' => $otp, // ⚠️ فقط برای حالت آزمایشی — پیش از انتشار واقعی حذف شود
    ], 'کد تایید ارسال شد.');
}

if ($action === 'admin_login_step2') {
    if (empty($_SESSION['pending_admin_id'])) fail('ابتدا باید مرحله اول ورود را انجام دهید.', 401);

    $otp = trim($rawBody['otp'] ?? '');
    $age = time() - (int) ($_SESSION['pending_admin_otp_at'] ?? 0);

    if ($age > OTP_TTL_SECONDS) {
        unset($_SESSION['pending_admin_id'], $_SESSION['pending_admin_otp'], $_SESSION['pending_admin_otp_at']);
        fail('کد تایید منقضی شده است. دوباره تلاش کنید.', 401);
    }

    if ($otp === '' || $otp !== $_SESSION['pending_admin_otp']) {
        fail('کد تایید اشتباه است.', 401);
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM `admins` WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $_SESSION['pending_admin_id']]);
    $admin = $stmt->fetch();

    unset($_SESSION['pending_admin_otp'], $_SESSION['pending_admin_otp_at']);

    if (!$admin) { unset($_SESSION['pending_admin_id']); fail('حساب یافت نشد.', 401); }

    if (!empty($admin['two_factor_enabled'])) {
        // هنوز لاگین نهایی نشده؛ منتظر رمز دومرحله‌ای می‌مانیم
        $_SESSION['pending_admin_2fa'] = true;
        ok(['two_factor_required' => true], 'کد تایید درست بود. رمز دومرحله‌ای را وارد کنید.');
    }

    // بدون نیاز به 2FA — ورود نهایی
    unset($_SESSION['pending_admin_id']);
    $_SESSION['admin_id'] = $admin['id'];
    ok([
        'two_factor_required' => false,
        'admin' => [
            'id' => $admin['id'], 'name' => $admin['name'],
            'email' => $admin['email'], 'phone' => $admin['phone'], 'role' => $admin['role']
        ]
    ], 'ورود موفقیت‌آمیز بود.');
}

if ($action === 'admin_login_step3') {
    if (empty($_SESSION['pending_admin_id']) || empty($_SESSION['pending_admin_2fa'])) {
        fail('درخواست نامعتبر است.', 401);
    }

    $pass2fa = (string) ($rawBody['two_factor_password'] ?? '');
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM `admins` WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $_SESSION['pending_admin_id']]);
    $admin = $stmt->fetch();

    if (!$admin || empty($admin['two_factor_password_hash']) || !password_verify($pass2fa, $admin['two_factor_password_hash'])) {
        fail('رمز دومرحله‌ای اشتباه است.', 401);
    }

    unset($_SESSION['pending_admin_id'], $_SESSION['pending_admin_2fa']);
    $_SESSION['admin_id'] = $admin['id'];

    ok([
        'admin' => [
            'id' => $admin['id'], 'name' => $admin['name'],
            'email' => $admin['email'], 'phone' => $admin['phone'], 'role' => $admin['role']
        ]
    ], 'ورود موفقیت‌آمیز بود.');
}

if ($action === 'admin_session') {
    if (empty($_SESSION['admin_id'])) ok(['loggedIn' => false]);
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM `admins` WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $_SESSION['admin_id']]);
    $admin = $stmt->fetch();
    if (!$admin) { unset($_SESSION['admin_id']); ok(['loggedIn' => false]); }
    ok([
        'loggedIn' => true,
        'admin' => [
            'id' => $admin['id'], 'name' => $admin['name'],
            'email' => $admin['email'], 'phone' => $admin['phone'], 'role' => $admin['role']
        ]
    ]);
}

if ($action === 'admin_logout') {
    unset($_SESSION['admin_id'], $_SESSION['pending_admin_id'], $_SESSION['pending_admin_otp'], $_SESSION['pending_admin_otp_at'], $_SESSION['pending_admin_2fa']);
    ok([], 'خارج شدید.');
}

// ── مدیریت حساب‌های ادمین (فقط برای مدیر لاگین‌شده — جایگزین ثبت‌نام عمومی) ──
if ($action === 'admin_list') {
    requireAdminSession();
    $db = getDB();
    $rows = $db->query("SELECT id, name, email, phone, role, two_factor_enabled, created_at FROM `admins` ORDER BY created_at ASC")->fetchAll();
    ok($rows);
}

if ($action === 'admin_create') {
    requireAdminSession();
    $db = getDB();
    $name  = trim($rawBody['name'] ?? '');
    $email = trim($rawBody['email'] ?? '');
    $phone = trim($rawBody['phone'] ?? '');
    $password = (string) ($rawBody['password'] ?? '');
    $twoFactorPassword = (string) ($rawBody['two_factor_password'] ?? '');

    if ($name === '' || $email === '' || $password === '') fail('نام، ایمیل و رمز عبور الزامی است.');
    if (strlen($password) < 8) fail('رمز عبور باید حداقل ۸ کاراکتر باشد.');

    $stmt = $db->prepare(
        "INSERT INTO `admins` (id, name, email, phone, password_hash, role, two_factor_enabled, two_factor_password_hash, created_at)
         VALUES (:id, :name, :email, :phone, :password_hash, 'admin', :tfa_enabled, :tfa_hash, NOW())"
    );
    $stmt->execute([
        ':id' => 'admin_' . bin2hex(random_bytes(6)),
        ':name' => $name,
        ':email' => $email,
        ':phone' => $phone,
        ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ':tfa_enabled' => $twoFactorPassword !== '' ? 1 : 0,
        ':tfa_hash' => $twoFactorPassword !== '' ? password_hash($twoFactorPassword, PASSWORD_DEFAULT) : null,
    ]);
    ok([], 'حساب مدیر جدید ایجاد شد.');
}

if ($action === 'admin_update') {
    requireAdminSession();
    $db = getDB();
    $id = trim($rawBody['id'] ?? '');
    if ($id === '') fail('شناسه الزامی است.');

    $fields = [];
    $params = [':id' => $id];

    if (!empty($rawBody['name']))  { $fields[] = 'name = :name';   $params[':name']  = $rawBody['name']; }
    if (!empty($rawBody['phone'])) { $fields[] = 'phone = :phone'; $params[':phone'] = $rawBody['phone']; }
    if (!empty($rawBody['password'])) {
        $fields[] = 'password_hash = :ph';
        $params[':ph'] = password_hash((string) $rawBody['password'], PASSWORD_DEFAULT);
    }
    if (array_key_exists('two_factor_password', $rawBody)) {
        $tfa = (string) $rawBody['two_factor_password'];
        if ($tfa === '') {
            $fields[] = 'two_factor_enabled = 0';
            $fields[] = 'two_factor_password_hash = NULL';
        } else {
            $fields[] = 'two_factor_enabled = 1';
            $fields[] = 'two_factor_password_hash = :tfa_hash';
            $params[':tfa_hash'] = password_hash($tfa, PASSWORD_DEFAULT);
        }
    }

    if (empty($fields)) fail('هیچ فیلدی برای بروزرسانی ارسال نشده است.');

    $sql = "UPDATE `admins` SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    ok([], 'حساب بروزرسانی شد.');
}

if ($action === 'admin_delete') {
    $currentAdminId = requireAdminSession();
    $db = getDB();
    $id = trim($rawBody['id'] ?? $_GET['id'] ?? '');
    if ($id === '') fail('شناسه الزامی است.');
    if ($id === $currentAdminId) fail('نمی‌توانید حساب خودتان را حذف کنید.');

    $stmt = $db->prepare("DELETE FROM `admins` WHERE id = :id");
    $stmt->execute([':id' => $id]);
    ok(['deleted' => $stmt->rowCount() > 0]);
}

// ── حذف دائمی حساب کاربر عادی (توسط خود کاربر) ──
if ($action === 'user_delete') {
    checkAuth();
    $db = getDB();
    $id = trim($rawBody['id'] ?? $_GET['id'] ?? '');
    if ($id === '') fail('شناسه کاربر الزامی است.');

    // برای اطمینان بیشتر، ایمیل یا شماره موبایل هم باید مطابقت داشته باشد
    $identifier = trim($rawBody['identifier'] ?? '');
    if ($identifier !== '') {
        $check = $db->prepare("SELECT id FROM `users` WHERE id = :id AND (email = :idf OR phone = :idf2) LIMIT 1");
        $check->execute([':id' => $id, ':idf' => $identifier, ':idf2' => $identifier]);
        if (!$check->fetch()) fail('اطلاعات کاربر مطابقت ندارد.', 403);
    }

    $stmt = $db->prepare("DELETE FROM `users` WHERE id = :id");
    $stmt->execute([':id' => $id]);

    // سفارش‌ها و تیکت‌های کاربر برای حفظ سوابق مالی/پشتیبانی حذف نمی‌شوند،
    // فقط حساب کاربری او پاک می‌شود.
    ok(['deleted' => $stmt->rowCount() > 0], 'حساب کاربری با موفقیت حذف شد.');
}

// ═══════════════════════════════════════════════════════════════
// عملیات عمومی CRUD فروشگاه (محصولات/سفارشات/...)
// ═══════════════════════════════════════════════════════════════
$table = validateTable($_GET['table'] ?? $rawBody['table'] ?? 'products');
$id    = $_GET['id'] ?? $rawBody['id'] ?? null;

try {
    createTables();
} catch (Exception $e) {
    fail('Table creation failed: ' . $e->getMessage(), 500);
}

$db = getDB();

switch ($action) {

    case 'getAll': {
        $where = '1=1';
        $params = [];
        if (!empty($_GET['status'])) {
            $where .= ' AND status = :status';
            $params[':status'] = $_GET['status'];
        }
        if (!empty($_GET['user_phone'])) {
            $where .= ' AND user_phone = :up';
            $params[':up'] = $_GET['user_phone'];
        }
        $stmt = $db->prepare("SELECT * FROM `$table` WHERE $where ORDER BY created_at DESC LIMIT 500");
        $stmt->execute($params);
        ok($stmt->fetchAll());
    }

    case 'getById': {
        if (!$id) fail('id required');
        $stmt = $db->prepare("SELECT * FROM `$table` WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        ok($stmt->fetch() ?: null);
    }

    case 'upsert': {
        checkAuth();
        $record = $rawBody['record'] ?? $rawBody;
        if (empty($record['id'])) fail('record.id required');

        $cols = $db->query("DESCRIBE `$table`")->fetchAll(PDO::FETCH_COLUMN);
        $toInsert = [];
        foreach ($cols as $col) {
            if (isset($record[$col])) {
                $val = $record[$col];
                $toInsert[$col] = is_array($val) || is_object($val) ? json_encode($val, JSON_UNESCAPED_UNICODE) : $val;
            }
        }
        if (empty($toInsert)) fail('No valid fields');

        $keys = array_keys($toInsert);
        $placeholders = array_map(fn($k) => ":$k", $keys);
        $updates = array_map(fn($k) => "`$k` = VALUES(`$k`)", $keys);

        $sql = "INSERT INTO `$table` (`" . implode('`,`', $keys) . "`) VALUES (" . implode(',', $placeholders) . ")
                ON DUPLICATE KEY UPDATE " . implode(',', $updates);

        $stmt = $db->prepare($sql);
        $params = [];
        foreach ($toInsert as $k => $v) $params[":$k"] = $v;
        $stmt->execute($params);
        ok(['id' => $toInsert['id']]);
    }

    case 'delete': {
        checkAuth();
        if (!$id) fail('id required');
        $stmt = $db->prepare("DELETE FROM `$table` WHERE id = :id");
        $stmt->execute([':id' => $id]);
        ok(['deleted' => $stmt->rowCount() > 0]);
    }

    case 'import': {
        checkAuth();
        $records = $rawBody['records'] ?? [];
        if (empty($records)) fail('No records provided');

        $db->beginTransaction();
        $count = 0;
        foreach ($records as $record) {
            if (empty($record['id'])) continue;
            $cols = $db->query("DESCRIBE `$table`")->fetchAll(PDO::FETCH_COLUMN);
            $toInsert = [];
            foreach ($cols as $col) {
                if (isset($record[$col])) {
                    $val = $record[$col];
                    $toInsert[$col] = is_array($val) || is_object($val) ? json_encode($val, JSON_UNESCAPED_UNICODE) : $val;
                }
            }
            if (empty($toInsert)) continue;
            $keys = array_keys($toInsert);
            $placeholders = array_map(fn($k) => ":$k", $keys);
            $updates = array_map(fn($k) => "`$k` = VALUES(`$k`)", $keys);
            $sql = "INSERT INTO `$table` (`" . implode('`,`', $keys) . "`) VALUES (" . implode(',', $placeholders) . ")
                    ON DUPLICATE KEY UPDATE " . implode(',', $updates);
            $stmt = $db->prepare($sql);
            $params = [];
            foreach ($toInsert as $k => $v) $params[":$k"] = $v;
            $stmt->execute($params);
            $count++;
        }
        $db->commit();
        ok(['imported' => $count]);
    }

    case 'stats': {
        $stats = [];
        foreach (ALLOWED_TABLES as $t) {
            try {
                $stats[$t] = $db->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
            } catch(Exception $e) { $stats[$t] = 0; }
        }
        ok($stats);
    }

    default:
        fail("Unknown action: $action");
}
