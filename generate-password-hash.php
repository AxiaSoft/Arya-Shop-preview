<?php
// ═══════════════════════════════════════════════════════════════
// ابزار ساخت هش رمز عبور (فقط برای مدیریت دستی از طریق phpMyAdmin)
// File: generate-password-hash.php
//
// ✅ نسخه ۲ — امن‌سازی‌شده:
//   • بعد از پیکربندی شدن سایت (وجود config.php)، نسخه‌ی وب این فایل
//     کاملاً بسته می‌شود — چون پنل مدیریت از داخل خودش امکان تغییر رمز
//     دارد (حساب‌های مدیر → تغییر رمز).
//   • پیش از نصب یا روی سرور محلی، می‌توانید از CLI استفاده کنید:
//       php generate-password-hash.php "MyNewP@ss1"
//     و خروجی را در phpMyAdmin → جدول admins → password_hash قرار دهید.
// ═══════════════════════════════════════════════════════════════

$cli = (PHP_SAPI === 'cli');
$configured = file_exists(__DIR__ . '/config.php');

if ($cli) {
    $plain = $argv[1] ?? '';
    if ($plain === '') {
        fwrite(STDERR, "استفاده: php generate-password-hash.php <رمز-عبور>\n");
        exit(1);
    }
    echo "hash: " . password_hash($plain, PASSWORD_DEFAULT, ['cost' => 11]) . "\n";
    exit(0);
}

// ── حالت وب ──
if ($configured) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'msg' => 'این ابزار پس از پیکربندی سایت از طریق وب غیرفعال شده است. از پنل مدیریت (بخش حساب‌های مدیر) برای تغییر رمز استفاده کنید.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$hash = null;
$plain = '';
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $plain = (string) ($_POST['password'] ?? '');
    if ($plain !== '') $hash = password_hash($plain, PASSWORD_DEFAULT, ['cost' => 11]);
}
?>
<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex,nofollow">
  <title>ساخت هش رمز عبور</title>
  <style>
    body { font-family: Tahoma, sans-serif; background:#0f172a; color:#fff; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
    .box { background:#1e293b; padding:2rem; border-radius:16px; width:100%; max-width:480px; box-shadow:0 20px 40px rgba(0,0,0,.4); }
    h1 { font-size:1.2rem; margin-bottom:1.5rem; }
    input[type=password],input[type=text] { width:100%; padding:12px; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#fff; box-sizing:border-box; font-size:1rem; }
    button { width:100%; padding:12px; margin-top:12px; border:none; border-radius:8px; background:#6366f1; color:#fff; font-size:1rem; cursor:pointer; }
    .result { margin-top:1.5rem; padding:1rem; background:#0f172a; border:1px solid #334155; border-radius:8px; word-break:break-all; font-family:monospace; font-size:.85rem; color:#a7f3d0; }
    .warn { margin-top:1rem; font-size:.8rem; color:#fca5a5; line-height:1.8; }
  </style>
</head>
<body>
  <div class="box">
    <h1>🔑 ساخت هش رمز عبور برای جدول admins</h1>
    <form method="post">
      <input type="password" name="password" placeholder="رمز دلخواه (حداقل ۸ کاراکتر، حرف بزرگ، رقم)" required>
      <button type="submit">تولید هش</button>
    </form>
    <?php if ($hash): ?>
      <div class="result"><?php echo htmlspecialchars($hash); ?></div>
      <p style="font-size:.8rem;color:#94a3b8;margin-top:.5rem">
        این مقدار را در phpMyAdmin → جدول admins → ستون password_hash جایگزین کنید.
      </p>
    <?php endif; ?>
    <div class="warn">
      ⚠️ به‌محض اتصال دیتابیس (ساخته‌شدن config.php) نسخه‌ی وب این ابزار مسدود می‌شود؛
      تغییر رمز از داخل پنل مدیریت انجام شود.
    </div>
  </div>
</body>
</html>
