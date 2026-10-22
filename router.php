<?php
/**
 * router.php — امن‌سازِ سرور توسعهٔ PHP (php -S)
 * اجرا:   php -S 0.0.0.0:8080 router.php
 *
 * ۱) دسترسی وب به پوشه‌ها/پسوندهای حساس (storage, includes, scripts, tests, .git،
 *    فایل‌های لوکال دیتابیس، config.php و…) را با 404 مسدود می‌کند.
 * ۲) هدرهای امنیتی (CSP/XFO/nosniff/Referrer) را — مثل .htaccess در Apache —
 *    روی همهٔ پاسخ‌ها می‌گذارد.
 * فقط برای محیط توسعه؛ در پروداکشن همان .htaccess کافی است.
 */

$secHeaders = static function (): void {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: same-origin');
    header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
    header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; "
        . "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; "
        . "img-src 'self' data: blob: https:; media-src 'self' https: blob:; "
        . "connect-src 'self' data: blob: https://nominatim.openstreetmap.org; "
        . "frame-ancestors 'self'; base-uri 'self'; form-action 'self'");
};

$denyBody = static function (): void {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    exit("404 Not found\n");
};

$uri = rawurldecode((string) (parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/'));

// ── ۱) مسدودسازی مسیرهای حساس ──────────────────────────────────
foreach (['/storage', '/includes', '/scripts', '/tests', '/.git', '/node_modules', '/data/vendor-backup'] as $d) {
    if ($uri === rtrim($d, '/') || str_starts_with($uri, $d . '/')) $denyBody();
}
if (preg_match('~(^|/)\.(?!well-known)~', $uri)                 // فایل‌های نقطه‌دار (/.env, /.git)
    || preg_match('~\.(sqlite3?|db|log|ini|sh|bak|old|sql|env|key|pem)$~i', $uri)
    || $uri === '/config.php') {
    $denyBody();
}

// ── ۲) فایل‌های استاتیک — سرو دستی تا هدرها اعمال شوند ────────
if (!str_ends_with($uri, '.php')) {
    $base = realpath(__DIR__);
    $file = $uri === '/' ? ($base . '/index.html') : realpath($base . $uri);
    if (is_string($file) && $file !== false && str_starts_with($file, (string) $base) && is_file($file)) {
        $types = [
            'html' => 'text/html; charset=utf-8', 'js' => 'application/javascript; charset=utf-8',
            'mjs' => 'application/javascript', 'css' => 'text/css', 'json' => 'application/json',
            'svg' => 'image/svg+xml', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
            'webp' => 'image/webp', 'gif' => 'image/gif', 'ico' => 'image/x-icon', 'woff2' => 'font/woff2',
            'woff' => 'font/woff', 'ttf' => 'font/ttf', 'txt' => 'text/plain; charset=utf-8',
            'webmanifest' => 'application/manifest+json',
        ];
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
        header('Content-Length: ' . (string) filesize($file));
        header('Cache-Control: ' . ($ext === 'html' ? 'no-cache' : 'public, max-age=3600'));
        $secHeaders();
        readfile($file);
        exit;
    }
    if ($uri !== '/' && !is_file($base . $uri)) { // مسیر ناموجود SPA → index.html (router فرعی admin.html)
        $admin = preg_match('~^/admin(/|$)~', $uri) ? $base . '/admin.html' : null;
        $target = $admin ?: $base . '/index.html';
        if (is_file($target)) {
            header('Content-Type: text/html; charset=utf-8');
            header('Cache-Control: no-cache');
            $secHeaders();
            readfile($target);
            exit;
        }
    }
}

// ── ۳) Db.php: ضد کش + سپردن اجرا به built-in ─────────────────
if (str_ends_with($uri, 'Db.php')) header('Cache-Control: no-store, max-age=0');
$secHeaders();

return false; // فایل‌های PHP (Db.php) را خودِ php -S اجرا کند
