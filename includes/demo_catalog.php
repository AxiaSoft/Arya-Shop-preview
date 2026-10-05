<?php
/**
 * includes/demo_catalog.php — سید کاتالوگ نمونه (منبع واحد: assets/data/demo-catalog.json)
 *
 * مصرف‌کننده‌ها:
 *   • Db.php?action=setup با demo_seed=true  (ویزارد نصب — نمونه‌سازی هم‌زمان با اتصال دیتابیس)
 *   • scripts/seed_demo.php                  (CLI)
 *
 * idempotent: با upsert بر اساس id؛ اجرای مجدد تکراری‌سازی نمی‌کند.
 */
if (!defined('ARYA_GUARD')) { http_response_code(403); exit('Forbidden'); }

function arya_demo_catalog_path(): string {
    return dirname(__DIR__) . '/assets/data/demo-catalog.json';
}

/**
 * @return array{categories:int,products:int} تعداد ردیف‌های نوشته‌شده
 * @throws RuntimeException در صورت نبود/نامعتبری فایل JSON
 */
function arya_seed_demo(AryaDbEngine $eng): array {
    $file = arya_demo_catalog_path();
    if (!is_file($file)) throw new RuntimeException('فایل کاتالوگ نمونه پیدا نشد: ' . $file);
    $data = json_decode((string)file_get_contents($file), true);
    if (!is_array($data) || empty($data['products'])) throw new RuntimeException('ساختار demo-catalog.json نامعتبر است.');

    $counts = ['categories' => 0, 'products' => 0];
    $pdo = $eng->pdo();
    foreach (['categories' => $data['categories'] ?? [], 'products' => $data['products']] as $table => $rows) {
        $cols = $eng->columnsOf($table);
        foreach ($rows as $row) {
            if (!is_array($row) || empty($row['id'])) continue;
            $toInsert = [];
            foreach ($cols as $col) {
                if (!array_key_exists($col, $row)) continue;
                $v = $row[$col];
                if (is_array($v) || is_object($v)) $v = json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                $toInsert[$col] = $v;
            }
            if (!$toInsert) continue;
            $pdo->prepare($eng->upsertSql($table, array_keys($toInsert)))->execute(array_values($toInsert));
            $counts[$table]++;
        }
    }
    return $counts;
}
