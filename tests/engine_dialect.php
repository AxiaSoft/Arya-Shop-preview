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

echo "— Supabase (پشتیبان روی PostgreSQL) —\n";
contains($E::buildDsn('supabase', ['host' => 'db.abc.supabase.co', 'dbname' => 'postgres', 'sslmode' => 'require']), 'sslmode=require', 'supa dsn keeps sslmode');
contains($E::buildDsn('supabase', ['host' => 'x', 'dbname' => 'postgres', 'sslmode' => 'verify-full', 'sslrootcert' => '/tmp/ca.pem']), 'sslrootcert=/tmp/ca.pem', 'supa dsn sslrootcert');
$ep = $E::supabaseEndpoints(['project_ref' => 'myref123', 'pool_mode' => 'direct']);
is_ok($ep['host'] === 'db.myref123.supabase.co' && $ep['port'] === 5432 && $ep['dbuser'] === 'postgres' && $ep['dbname'] === 'postgres', 'supa direct endpoint derivation');
$ep2 = $E::supabaseEndpoints(['project_ref' => 'myref123', 'pool_mode' => 'pooler', 'region' => 'eu-west-2']);
is_ok($ep2['host'] === 'aws-0-eu-west-2.pooler.supabase.com' && $ep2['port'] === 6543 && $ep2['dbuser'] === 'postgres.myref123', 'supa pooler endpoint derivation');
$ep3 = $E::supabaseEndpoints(['host' => 'pg.internal.example.com', 'port' => 5432, 'dbuser' => 'arya', 'dbname' => 'aryadb']);
is_ok($ep3['host'] === 'pg.internal.example.com' && $ep3['dbuser'] === 'arya' && $ep3['sslmode'] === 'require', 'supa manual host overrides + default ssl');
$thrown = false; try { $E::supabaseEndpoints(['project_ref' => 'myref123', 'pool_mode' => 'pooler']); } catch (Throwable $e) { $thrown = str_contains($e->getMessage(), 'Region'); }
is_ok($thrown, 'supa pooler without region -> helpful error');
is_ok($E::quoteIdent('supabase', 'products') === '"products"', 'supa quotes idents like pg');
$ddlSupa = implode("\n", $E::createTableSql('supabase', 'products'));
contains($ddlSupa, 'CREATE TABLE IF NOT EXISTS "products"', 'supa DDL = pg DDL');
contains($E::upsertSqlFor('supabase', 'products', ['id', 'title']), 'ON CONFLICT ("id") DO UPDATE', 'supa upsert = pg upsert');
is_ok(in_array('supabase', array_keys($E::SUPPORTED), true) && $E::SUPPORTED['supabase']['needs'][0] === 'pdo_pgsql', 'supabase registered in SUPPORTED');

// ── demo catalog seeder روی SQLite واقعی (منبع واحد JSON) ──
require_once $root . '/includes/demo_catalog.php';
$dbFile2 = tempnam(sys_get_temp_dir(), 'aryasup') . '.sqlite';
$eng2 = new AryaDbEngine(['driver' => 'sqlite', 'sqlite_path' => $dbFile2]);
$eng2->createSchema();
$c1 = arya_seed_demo($eng2);
is_ok($c1['products'] === 6 && $c1['categories'] === 5, 'demo seed inserts 6/5');
$c2 = arya_seed_demo($eng2);
is_ok($c2['products'] === 6 && $eng2->countRows('products') === 6, 'demo seed idempotent (no dupes)');
$r = $eng2->pdo()->query("SELECT * FROM \"products\" WHERE id='p_sonic_pro'")->fetch(PDO::FETCH_ASSOC);
$im = json_decode((string)($r['images'] ?? '[]'), true);
$vd = json_decode((string)($r['videos'] ?? '[]'), true);
is_ok($r && is_array($im) && count($im) === 2 && is_array($vd) && $vd[0] === 'assets/media/videos/demo-headphone.mp4', 'seeded row keeps images/videos JSON');
is_ok(is_file(arya_demo_catalog_path()), 'demo-catalog.json present in repo');
@unlink($dbFile2);

echo "\nPASS=$PASS FAIL=$FAIL\n";
exit($FAIL === 0 ? 0 : 1);
