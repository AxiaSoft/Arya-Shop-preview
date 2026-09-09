<?php
/**
 * تست یونیتی لایه‌ی دایالکت SQL — اجرا:  php tests/engine_dialect.php
 * ۱) رشته‌های DDL/UPSERT برای هر چهار موتور (سطح SQL — بدون نیاز به سرور)
 * ۲) رفت‌وبرگشت کامل روی SQLite واقعی (ساخت اسکیما، درج، upsert، hasColumn، upsert settings)
 */
if (PHP_SAPI !== 'cli') { exit(1); }
define('ARYA_GUARD', 1);
$root = dirname(__DIR__);
require $root . '/includes/security.php';
require $root . '/includes/db_engine.php';

$PASS = 0; $FAIL = 0;
function is_ok(bool $c, string $name) { global $PASS, $FAIL;
    if ($c) { $GLOBALS['PASS']++; echo "  ✔ $name\n"; }
    else    { $GLOBALS['FAIL']++; echo "  ✘ $name\n"; }
}
function contains(string $hay, string $needle, string $name) { is_ok(str_contains($hay, $needle), $name . " (contains: $needle)"); }

$E = 'AryaDbEngine';

echo "— DDL: MySQL —\n";
$ddl = implode("\n", $E::createTableSql('mysql', 'admins'));
contains($ddl, 'CREATE TABLE IF NOT EXISTS `admins`', 'mysql backticks');
contains($ddl, 'PRIMARY KEY (`id`)', 'mysql pk');
contains($ddl, '`email` VARCHAR(191) NOT NULL', 'mysql email varchar191');
contains($ddl, 'UNIQUE KEY', 'mysql unique key for users');
contains($ddl, 'utf8mb4', 'mysql charset');
$ddlU = implode("\n", $E::createTableSql('mysql', 'users'));
contains($ddlU, 'UNIQUE KEY `u_email` (`email`)', 'mysql users unique email');

echo "— DDL: PostgreSQL —\n";
$ddl = implode("\n", $E::createTableSql('pgsql', 'admins'));
contains($ddl, 'CREATE TABLE IF NOT EXISTS "admins"', 'pg double-quotes');
contains($ddl, 'TIMESTAMP', 'pg timestamp');
contains($ddl, 'SMALLINT', 'pg smallint');
contains($ddl, 'IF NOT EXISTS', 'pg index if-not-exists');
$ddl = implode("\n", $E::createTableSql('pgsql', 'users'));
contains($ddl, "ADD CONSTRAINT \"u_users_email\" UNIQUE", 'pg users unique constraint');

echo "— DDL: SQLite —\n";
$ddl = implode("\n", $E::createTableSql('sqlite', 'products'));
contains($ddl, 'CREATE TABLE IF NOT EXISTS "products"', 'sqlite quote style');
is_ok(!str_contains($ddl, 'ENGINE='), 'sqlite no mysql-isms');
is_ok(str_contains($ddl, 'PRIMARY KEY ("id")') && strpos($ddl, 'PRIMARY KEY') > strpos($ddl, '"id" TEXT'), 'sqlite pk AFTER columns');

echo "— DDL: SQL Server —\n";
$ddl = implode("\n", $E::createTableSql('sqlsrv', 'products'));
contains($ddl, 'IF OBJECT_ID', 'sqlsrv existence guard');
contains($ddl, '[products]', 'sqlsrv brackets');
contains($ddl, 'NVARCHAR', 'sqlsrv nvarchar');
contains($ddl, 'DATETIME2', 'sqlsrv datetime2');
contains($ddl, 'CONSTRAINT [pk_products] PRIMARY KEY ([id])', 'sqlsrv named pk');

echo "— UPSERT SQL —\n";
$u = $E::upsertSqlFor('mysql', 'products', ['id', 'title', 'price']);
contains($u, 'ON DUPLICATE KEY UPDATE', 'mysql upsert clause');
contains($u, '`title` = VALUES(`title`)', 'mysql values() update');
is_ok(substr_count($u, '?') === 3, 'mysql placeholder sanity (3 params)');
$u = $E::upsertSqlFor('pgsql', 'products', ['id', 'title']);
contains($u, 'ON CONFLICT ("id") DO UPDATE SET', 'pg conflict target');
$u = $E::upsertSqlFor('sqlite', 'products', ['id', 'title']);
contains($u, 'ON CONFLICT ("id") DO UPDATE SET', 'sqlite conflict target');
$u = $E::upsertSqlFor('sqlsrv', 'products', ['id', 'title']);
contains($u, 'MERGE INTO [products]', 'sqlsrv merge');
contains($u, 'WHEN MATCHED THEN UPDATE', 'sqlsrv matched');
contains($u, 'WHEN NOT MATCHED THEN INSERT', 'sqlsrv not-matched');
$u = $E::upsertSqlFor('mysql', 'settings', ['key', 'value']);
contains($u, 'ON DUPLICATE KEY UPDATE', 'settings mysql upsert');

echo "— quoting / helpers —\n";
is_ok($E::quoteIdent('mysql', 'or') === '`or`', 'mysql ident quoted');
is_ok($E::quoteIdent('sqlite', 'a"b') === '"ab"', 'ident sanitization strips quotes');
is_ok($E::nowExprFor('mysql') === 'NOW()' && $E::nowExprFor('sqlsrv') === 'SYSUTCDATETIME()', 'nowExpr per driver');

echo "— SQLite end-to-end روی موتور واقعی —\n";
$dbFile = sys_get_temp_dir() . '/arya_engine_test_' . getmypid() . '.sqlite';
@unlink($dbFile);
$eng = new $E(['driver' => 'sqlite', 'name' => 'test', 'sqlite_path' => $dbFile]);
$eng->createSchema();
is_ok($eng->tableExists('products') && $eng->tableExists('settings'), 'tables created');
$cols = $eng->columnsOf('products');
is_ok(in_array('title', $cols, true) && in_array('images', $cols, true), 'columnsOf products');
is_ok($eng->hasColumn('products', 'slug') && !$eng->hasColumn('products', 'nope'), 'hasColumn');

$pdo = $eng->pdo();
$pdo->prepare($eng->upsertSql('products', ['id', 'title', 'price', 'images']))
    ->execute(['p1', 'هدفون', 1250000, json_encode(['a.png'])]);
$pdo->prepare($eng->upsertSql('products', ['id', 'title', 'price', 'images']))
    ->execute(['p1', 'هدفون v2', 1300000, json_encode(['a.png', 'b.png'])]); // upsert conflict
$row = $pdo->query("SELECT * FROM \"products\" WHERE id='p1'")->fetch(PDO::FETCH_ASSOC);
is_ok(($row['title'] ?? '') === 'هدفون v2', 'sqlite upsert updated (not duplicated)');
is_ok($eng->countRows('products') === 1, 'countRows after upsert');

$pdo->prepare($eng->upsertSql('settings', ['key', 'value']))->execute(['skin', 'dark']);
$pdo->prepare($eng->upsertSql('settings', ['key', 'value']))->execute(['skin', 'light']);
$setRow = $pdo->query("SELECT value FROM \"settings\" WHERE \"key\"='skin'")->fetch(PDO::FETCH_ASSOC);
is_ok(($setRow['value'] ?? '') === 'light', 'settings pk=key upsert');

$ts = $eng->nowExpr();
$row = $pdo->query("SELECT created_at FROM \"products\"")->fetch();
is_ok(!empty($row['created_at']), 'created_at default populated');

// info() / ensureDatabase (sqlite: no-op path با PDO ادمین خالی)
AryaDbEngine::ensureDatabase('sqlite', new PDO('sqlite::memory:'), 'x');
$info = $eng->info();
is_ok(($info['driver'] ?? '') === 'sqlite' && isset($info['server_version']), 'info() payload');
@unlink($dbFile);

echo "\nPASS=$PASS FAIL=$FAIL\n";
exit($FAIL === 0 ? 0 : 1);
