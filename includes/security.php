<?php
// ═══════════════════════════════════════════════════════════════
// AryaStore — Security layer (shared helpers)
// File: includes/security.php
//
// این فایل توسط Db.php قبل از هر ورودی دیگری include می‌شود و
// ابزارهای مشترک امنیت را فراهم می‌کند:
//   • هدرهای امنیتی پاسخ + CORS سخت‌گیرانه (بدون ستاره)
//   • سخت‌سازی سشن (HttpOnly / SameSite / Strict mode / rotation)
//   • توکن CSRF برای عملیات حساس
//   • محدودساز نرخ (rate limiter) مبتنی بر فایل، با fallback به temp
//   • سیاست رمز عبور، مقایسه‌ی امن (hash_equals)، ورودی‌های تمیز
// ═══════════════════════════════════════════════════════════════

if (!defined('ARYA_GUARD')) { http_response_code(403); exit('Forbidden'); }

// ── Hardened session bootstrap ────────────────────────────────
function ary_session_start(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;

    $https = (($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off')
          || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    // انتخاب save_path قابل‌اطمینان: اگر مقدار پیش‌فرض PHP نوشته‌شدنی نبود،
    // از پوشه storage/sessions سایت و در نهایت از temp سیستم استفاده کن.
    $sp = (string) ini_get('session.save_path');
    if ($sp === '' || !is_dir($sp) || !is_writable($sp)) {
        $own = dirname(__DIR__) . '/storage/sessions';
        if (!is_dir($own)) @mkdir($own, 0700, true);
        if (is_dir($own) && is_writable($own)) $sp = $own;
        else $sp = rtrim(sys_get_temp_dir(), '/\\') ?: '/tmp';
        if (!is_dir($sp)) @mkdir($sp, 0700, true);
        ini_set('session.save_path', $sp);
    }

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_secure', $https ? '1' : '0');
    ini_set('session.cookie_samesite', 'Lax');
    ini_set('session.sid_length', '48');
    ini_set('session.sid_bits_per_character', '6');
    // عمر سشن: ۸ ساعت بی‌فعالیت
    ini_set('session.gc_maxlifetime', '28800');

    session_name('ARYA_SESSID');
    @session_start();

    // اگر شناسه‌ی سشن از کوکی ضعیف/قدیمی بیاید، یک‌بار بازتولید کن
    static $rotated = false;
    if (!$rotated && isset($_COOKIE['ARYA_SESSID']) && strlen((string) $_COOKIE['ARYA_SESSID']) < 32) {
        @session_regenerate_id(true);
        $rotated = true;
    }
}

function ary_session_regen(): void {
    if (session_status() === PHP_SESSION_ACTIVE) {
        @session_regenerate_id(true);
    }
}

// ── Security response headers (API) ───────────────────────────
function ary_send_headers(): void {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, max-age=0');
    header('Pragma: no-cache');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: same-origin');
    header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
    // پاسخ API نباید هرگز در <iframe>/<script> جای دیگری مصرف شود؛
    // CSP سخت‌گیرانه فقط برای خودِ پاسخ JSON (که اجرا نمی‌شود) است.
    header('Content-Security-Policy: default-src \'none\'; frame-ancestors \'self\'');
}

// ── CORS: فقط originهای مجاز (سایت خودش + لیست config) ───────
function ary_request_origin(): string {
    $origin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin === '') {
        $ref = trim((string) ($_SERVER['HTTP_REFERER'] ?? ''));
        if ($ref !== '') {
            $parts = parse_url($ref);
            if (!empty($parts['scheme']) && !empty($parts['host'])) {
                $origin = $parts['scheme'] . '://' . $parts['host']
                        . (isset($parts['port']) ? ':' . $parts['port'] : '');
            }
        }
    }
    return $origin;
}

function ary_host(): string {
    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    return preg_replace('/:\d+$/', '', $host);
}

/**
 * بررسی هم‌ریشه بودن (same-origin) به‌صورت دقیق: hostِ درخواست‌کننده
 * باید دقیقاً برابر hostِ سرور باشد (نه str_contains!) و یا در لیست
 * ALLOWED_ORIGINS (تعریف‌شده در config.php) آمده باشد.
 */
function ary_is_same_origin(): bool {
    $origin = ary_request_origin();
    if ($origin === '') {
        // درخواست بدون Origin/Referer = ابزار غیرمرورگری (curl و…)
        // فقط با توکن Bearer مجاز است؛ در اینجا «رد» می‌شود.
        return false;
    }
    $parts = parse_url($origin);
    if (empty($parts['host'])) return false;
    $ohost = strtolower($parts['host']);

    if ($ohost === ary_host()) return true;

    // localhost و 127.0.0.1 را روی پورت‌های پیش‌فرض یکسان بدان (توسعه محلی)
    if (in_array($ohost, ['127.0.0.1', 'localhost'], true)
        && in_array(ary_host(), ['127.0.0.1', 'localhost'], true)) {
        return true;
    }

    if (defined('ALLOWED_ORIGINS') && is_array(ALLOWED_ORIGINS)) {
        foreach (ALLOWED_ORIGINS as $allowed) {
            $ap = parse_url(rtrim((string) $allowed, '/'));
            if (!empty($ap['host']) && strtolower($ap['host']) === $ohost) return true;
        }
    }
    return false;
}

/** هدر Access-Control-Allow-* را فقط برای originهای مجاز ست می‌کند. */
function ary_cors_headers(): void {
    $origin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin !== '' && ary_is_same_origin()) {
        header('Access-Control-Allow-Origin: ' . $origin, false);
        header('Access-Control-Allow-Credentials: true', false);
        header('Vary: Origin', false);
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS', false);
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token', false);
        header('Access-Control-Max-Age: 600', false);
    }
}

// ── CSRF token (گرهگان در سشن) ────────────────────────────────
function ary_csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(24));
    }
    return $_SESSION['csrf_token'];
}

function ary_csrf_valid(): bool {
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if ($sent === '') {
        // پشتیبانی از فرم‌ها/قدیم‌ها: فیلد _csrf در بدنه JSON
        return false;
    }
    return is_string($sent) && isset($_SESSION['csrf_token'])
        && hash_equals($_SESSION['csrf_token'], $sent);
}

/** برای عملیات حساسِ نیازمند سشن؛ در صورت نبود توکن معتبر: 403 */
function ary_require_csrf(callable $failFn): void {
    if (!ary_csrf_valid()) {
        $failFn('توکن CSRF نامعتبر یا گم‌شده است. صفحه را تازه‌سازی کنید.', 403);
    }
}

// ── Rate limiter سبک (فایل‌محور؛ سازگار با هاست مشترک) ──────
function ary_rate_dir(): string {
    $primary = dirname(__DIR__) . '/storage/rate';
    if (!is_dir($primary)) {
        @mkdir($primary, 0700, true);
    }
    if (is_dir($primary) && is_writable($primary)) return $primary;

    $fallback = rtrim(sys_get_temp_dir(), '/\\') . '/arya-rate-' . (function_exists('posix_getuid') ? (int) posix_getuid() : getmypid() & 0xffff);
    if (!is_dir($fallback)) @mkdir($fallback, 0700, true);
    return $fallback;
}

function ary_client_ip(): string {
    // فقط از REMOTE_ADDR معتبر استفاده کن؛ سریرها (X-Forwarded-For)
    // قابل جعل‌اند مگر اینکه در config پشت CDN باشیم.
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    if (defined('TRUST_PROXY_HEADERS') && TRUST_PROXY_HEADERS === true) {
        $xff = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
        if ($xff !== '') {
            $first = trim(explode(',', $xff)[0]);
            if (filter_var($first, FILTER_VALIDATE_IP)) $ip = $first;
        }
    }
    return (string) $ip;
}

/**
 * throttle($bucket, $limit, $windowSeconds)
 * true  → مجاز   false → بیش از حد؛ باید رد شود
 */
function ary_throttle(string $bucket, int $limit, int $window): bool {
    $dir = ary_rate_dir();
    if (!is_dir($dir)) return true; // اگر امکان نوشتن نیست، سرویس را متوقف نکن
    $file = $dir . '/' . substr(sha1($bucket), 0, 40) . '.json';

    $now = time();
    $data = ['hits' => [], 'blocked_until' => 0];
    if (is_file($file)) {
        $raw = @file_get_contents($file);
        $decoded = json_decode((string) $raw, true);
        if (is_array($decoded)) $data = $decoded + $data;
    }

    if (($data['blocked_until'] ?? 0) > $now) return false;

    $hits = array_values(array_filter((array) $data['hits'], fn($t) => is_numeric($t) && $t > $now - $window));
    if (count($hits) >= $limit) {
        // پنجره‌ی تنبیهی: تا دو برابر window قفل موقت
        $data['blocked_until'] = $now + min(2 * $window, 3600);
        $data['hits'] = $hits;
        @file_put_contents($file, json_encode($data), LOCK_EX);
        return false;
    }

    $hits[] = $now;
    @file_put_contents($file, json_encode(['hits' => $hits, 'blocked_until' => 0]), LOCK_EX);
    return true;
}

function ary_throttle_fail(callable $failFn): void {
    $failFn('تعداد درخواست‌ها بیش از حد مجاز است. لطفاً چند دقیقه صبر کنید و دوباره تلاش کنید.', 429);
}

// ── رمز عبور ───────────────────────────────────────────────────
function ary_password_hash(string $plain): string {
    return password_hash($plain, PASSWORD_DEFAULT, ['cost' => 11]);
}

function ary_password_verify(string $plain, ?string $hash): bool {
    static $dummy = null;
    if ($dummy === null) $dummy = password_hash(bin2hex(random_bytes(12)), PASSWORD_DEFAULT);
    if ($plain === '' || $hash === null || $hash === '') {
        password_verify('not-the-password', $dummy); // زمان‌بندی یکنواخت
        return false;
    }
    $ok = password_verify($plain, $hash);
    if (!$ok) password_verify('not-the-password', $dummy);
    return $ok;
}

/** سیاست رمز: حداقل ۸ کاراکتر + حرف بزرگ + حرف کوچک + رقم */
function ary_password_policy_error(string $p): string {
    if (mb_strlen($p) < 8) return 'رمز عبور باید حداقل ۸ کاراکتر باشد.';
    if (!preg_match('/[A-Z]/', $p)) return 'رمز باید حداقل یک حرف بزرگ (A-Z) داشته باشد.';
    if (!preg_match('/[a-z]/', $p)) return 'رمز باید حداقل یک حرف کوچک (a-z) داشته باشد.';
    if (!preg_match('/\d/', $p)) return 'رمز باید حداقل یک رقم داشته باشد.';
    return '';
}

// ── ورودی‌ها ───────────────────────────────────────────────────
function ary_is_email(string $v): bool {
    return filter_var($v, FILTER_VALIDATE_EMAIL) !== false && strlen($v) <= 255;
}

function ary_is_ir_phone(string $v): bool {
    return (bool) preg_match('/^09\d{9}$/', $v);
}

function ary_safe_id(string $v): bool {
    return (bool) preg_match('/^[A-Za-z0-9_\-]{1,64}$/', $v);
}

function ary_clean_text($v, int $max = 0): string {
    $s = is_scalar($v) ? (string) $v : '';
    $s = trim($s);
    if ($max > 0 && mb_strlen($s) > $max) $s = mb_substr($s, 0, $max);
    return $s;
}

/** مقادیر حساس را از ردیف‌های برگشتی حذف می‌کند */
function ary_strip_secrets(array $row): array {
    foreach (['password_hash', 'two_factor_password_hash', 'API_SECRET', 'db_pass'] as $k) {
        unset($row[$k]);
    }
    return $row;
}
function ary_strip_secrets_all(array $rows): array {
    return array_map('ary_strip_secrets', $rows);
}

// ── OTP ────────────────────────────────────────────────────────
function ary_generate_otp6(): string {
    return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

function ary_otp_hash(string $otp): string {
    return hash_hmac('sha256', $otp, (string) (defined('API_SECRET') ? API_SECRET : 'arya-dev-secret'));
}

function ary_otp_verify(string $otp, string $storedHash): bool {
    return hash_equals($storedHash, ary_otp_hash($otp));
}

/** نمایش نیمه‌مخفی ایمیل/شماره برای راهنمایی کاربر */
function ary_mask_identifier(string $id): string {
    if (strpos($id, '@') !== false) {
        [$name, $domain] = explode('@', $id, 2);
        $visible = mb_substr($name, 0, 2);
        return $visible . str_repeat('*', max(1, mb_strlen($name) - 2)) . '@' . $domain;
    }
    $len = strlen($id);
    if ($len <= 4) return str_repeat('*', $len);
    return substr($id, 0, 2) . str_repeat('*', $len - 4) . substr($id, -2);
}

// ── خطای امن: جزئیات فنی را لو نده ────────────────────────────
/** DEMO_MODE فقط در نصب‌های آزمایشی فعال است (پیش‌فرض: روشن تا وقتی
 *  ادمان در config.php آن را false کند). در حالت عملیاتی، پیام‌های
 *  تفصیلی استثنائات در پاسخ نمی‌آیند، فقط در لاگ سرور. */
function ary_demo_mode(): bool {
    return defined('DEMO_MODE') && DEMO_MODE === true;
}

function ary_log(string $tag, string $detail): void {
    error_log('[arya][' . $tag . '] ' . $detail);
}

// ── getallheaders fallback (روی CGI/FastCGI بعضی هاست‌ها نیست) ─
function ary_get_header(string $name): string {
    $name = strtolower($name);
    if (function_exists('getallheaders')) {
        foreach (@getallheaders() as $k => $v) {
            if (strtolower((string) $k) === $name) return (string) $v;
        }
    }
    $key = 'HTTP_' . strtoupper(preg_replace('/[^A-Za-z0-9]/', '_', $name));
    return (string) ($_SERVER[$key] ?? '');
}
