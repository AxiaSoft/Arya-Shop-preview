<?php
// ═══════════════════════════════════════════════════════════════
// ابزار ساخت هش رمز عبور برای وارد کردن دستی در phpMyAdmin
// File: generate-password-hash.php
//
// نحوه استفاده:
// 1. این فایل را باز کنید: http://localhost/site/generate-password-hash.php
// 2. رمز دلخواه خود را وارد کنید
// 3. مقدار خروجی (هش) را کپی کنید
// 4. در phpMyAdmin، جدول admins، ستون password_hash همان ردیف را باز کنید
//    و مقدار کپی‌شده را جایگزین کنید (نه خودِ رمز ساده!)
//
// ⚠️ امنیتی: بعد از استفاده، حتماً این فایل را از روی سرور پاک کنید
// یا حداقل از دسترس عموم خارج کنید — چون تولید هش رمز، خودش نباید
// همیشه در دسترس عمومی باشد.
// ═══════════════════════════════════════════════════════════════

$hash = null;
$plain = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $plain = $_POST['password'] ?? '';
    if ($plain !== '') {
        $hash = password_hash($plain, PASSWORD_DEFAULT);
    }
}
?>
<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>ساخت هش رمز عبور</title>
  <style>
    body { font-family: Tahoma, sans-serif; background:#0f172a; color:#fff; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
    .box { background:#1e293b; padding:2rem; border-radius:16px; width:100%; max-width:480px; box-shadow:0 20px 40px rgba(0,0,0,.4); }
    h1 { font-size:1.2rem; margin-bottom:1.5rem; }
    input[type=text] { width:100%; padding:12px; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#fff; box-sizing:border-box; font-size:1rem; }
    button { width:100%; padding:12px; margin-top:12px; border:none; border-radius:8px; background:#6366f1; color:#fff; font-size:1rem; cursor:pointer; }
    button:hover { background:#4f46e5; }
    .result { margin-top:1.5rem; padding:1rem; background:#0f172a; border:1px solid #334155; border-radius:8px; word-break:break-all; font-family:monospace; font-size:.85rem; color:#a7f3d0; }
    .warn { margin-top:1rem; font-size:.8rem; color:#fca5a5; line-height:1.8; }
  </style>
</head>
<body>
  <div class="box">
    <h1>🔑 ساخت هش رمز عبور برای جدول admins</h1>
    <form method="post">
      <input type="text" name="password" placeholder="رمز دلخواه خود را وارد کنید" value="<?php echo htmlspecialchars($plain); ?>" required>
      <button type="submit">تولید هش</button>
    </form>
    <?php if ($hash): ?>
      <div class="result"><?php echo htmlspecialchars($hash); ?></div>
      <p style="font-size:.8rem;color:#94a3b8;margin-top:.5rem">
        این مقدار را کپی کنید و در phpMyAdmin → جدول admins → ستون password_hash جایگزین کنید.
      </p>
    <?php endif; ?>
    <div class="warn">
      ⚠️ بعد از استفاده، این فایل (generate-password-hash.php) را از روی سرور پاک کنید یا نام آن را عوض کنید تا کسی دیگری نتواند از آن استفاده کند.
    </div>
  </div>
</body>
</html>
