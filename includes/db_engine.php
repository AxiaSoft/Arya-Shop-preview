<?php
// ═══════════════════════════════════════════════════════════════
// AryaStore — Multi-driver database engine
// File: includes/db_engine.php
//
// لایه‌ی انتزاع روی PDO که جداول فروشگاه را روی موتورهای مختلف
// یکسان می‌سازد و کوئری‌ها را به گویش (dialect) همان موتور ترجمه
// می‌کند:
//
//   • mysql    — MySQL / MariaDB (پیش‌فرض؛ رایج‌ترین در cPanel/DirectAdmin)
//   • pgsql    — PostgreSQL 9.5+ (ON CONFLICT upsert)
//   • sqlite   — SQLite 3.24+ (بدون سرور؛ فایل کنار سایت — عالی برای تست/استجینگ)
//   • sqlsrv   — Microsoft SQL Server 2017+ (MERGE upsert) — نیازمند pdo_sqlsrv
//
// برای افزودن موتور تازه فقط کافی است یک کلید در SUPPORTED و سه تابع
// dsn() / createTableSql() / upsertSql() گسترش یابد.
// ═══════════════════════════════════════════════════════════════

if (!defined('ARYA_GUARD')) { http_response_code(403); exit('Forbidden'); }

final class AryaDbEngine
{
    /** موتورهای پشتیبانی‌شده + متادیتای UI/اعتبارسنجی */
    public const SUPPORTED = [
        'mysql' => ['label' => 'MySQL / MariaDB',  'needs' => ['pdo_mysql'],            'server' => true],
        'pgsql' => ['label' => 'PostgreSQL',        'needs' => ['pdo_pgsql'],            'server' => true],
        'sqlite'=> ['label' => 'SQLite (فایل محلی)','needs' => ['pdo_sqlite'],           'server' => false],
        'sqlsrv'=> ['label' => 'SQL Server',        'needs' => ['pdo_sqlsrv'],           'server' => true],
    ];

    public string $driver;
    private ?PDO $pdo = null;
    private array $cache = [];

    public function __construct(array $cfg)
    {
        $this->driver  = $cfg['driver'] ?? 'mysql';
        $this->config  = $cfg;
        if (!isset(self::SUPPORTED[$this->driver])) {
            throw new RuntimeException('پشتیبانی از موتور دیتابیس «' . $this->driver . '» تعریف نشده است.');
        }
        $need = self::SUPPORTED[$this->driver]['needs'][0];
        if ($need && !extension_loaded($need)) {
            throw new RuntimeException(
                'افزونه‌ی PHP «' . $need . '» برای استفاده از ' . self::SUPPORTED[$this->driver]['label'] . ' نصب/فعال نیست.'
            );
        }
    }

    private array $config;

    public static function isDriverAvailable(string $driver): bool
    {
        return isset(self::SUPPORTED[$driver]) && extension_loaded(self::SUPPORTED[$driver]['needs'][0]);
    }

    // ── DSN و اتصال ──────────────────────────────────────────
    public static function buildDsn(string $driver, array $c, bool $withDb = true): string
    {
        switch ($driver) {
            case 'mysql':
                $dsn = 'mysql:host=' . ($c['host'] ?? 'localhost');
                if (!empty($c['port'])) $dsn .= ';port=' . (int) $c['port'];
                if ($withDb && !empty($c['dbname'])) $dsn .= ';dbname=' . $c['dbname'];
                $dsn .= ';charset=' . ($c['charset'] ?? 'utf8mb4');
                return $dsn;

            case 'pgsql':
                $dsn = 'pgsql:host=' . ($c['host'] ?? 'localhost');
                $dsn .= ';port=' . ($c['port'] ?? 5432);
                $dsn .= ';dbname=' . (($withDb && !empty($c['dbname'])) ? $c['dbname'] : 'postgres');
                return $dsn;

            case 'sqlite':
                $path = $c['sqlite_path'] ?? (dirname(__DIR__) . '/storage/arya_store.sqlite');
                $dir  = dirname($path);
                if (!is_dir($dir)) @mkdir($dir, 0700, true);
                return 'sqlite:' . $path;

            case 'sqlsrv':
                $srv = 'sqlsrv:Server=' . ($c['host'] ?? 'localhost');
                if (!empty($c['port'])) $srv .= ',' . (int) $c['port'];
                if ($withDb && !empty($c['dbname'])) $srv .= ';Database=' . $c['dbname'];
                // Encryption بر اساس کانفیگ (روی لینوکس با unixODBC)
                $srv .= ';TrustServerCertificate=true';
                return $srv;
        }
        throw new RuntimeException('Driver unsupported: ' . $driver);
    }

    public function pdo(): PDO
    {
        if ($this->pdo) return $this->pdo;
        $c = $this->config;
        $opts = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];
        if ($this->driver === 'mysql') $opts[PDO::ATTR_EMULATE_PREPARES] = false;

        $this->pdo = new PDO(self::buildDsn($this->driver, $c, true), $c['dbuser'] ?? null, $c['dbpass'] ?? null, $opts);

        if ($this->driver === 'pgsql' && !empty($c['schema'])) {
            $this->pdo->exec('SET search_path TO ' . self::quoteIdent('pgsql', $c['schema']));
        }
        if ($this->driver === 'sqlite') {
            $this->pdo->exec('PRAGMA busy_timeout = 4000');
            $this->pdo->exec('PRAGMA foreign_keys = ON');
        }
        return $this->pdo;
    }

    /** اتصال برای مراحل نصب (بدون انتخاب دیتابیس / به دیتابیس سرویس‌دهنده) */
    public static function adminPdo(string $driver, array $c): PDO
    {
        $opts = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION];
        return new PDO(self::buildDsn($driver, $c, false), $c['dbuser'] ?? null, $c['dbpass'] ?? null, $opts);
    }

    // ── نقل‌قول شناسه‌ها به سبک هر گویش ─────────────────────
    public static function quoteIdent(string $driver, string $ident): string
    {
        // هوک امنیتی: شناسه‌ها فقط از فهرست‌های داخلی برنامه می‌آیند؛
        // با این حال کاراکترهای مشکوک را حذف می‌کنیم.
        $ident = preg_replace('/[^A-Za-z0-9_]/', '', $ident);
        if ($ident === '') throw new RuntimeException('Invalid identifier');
        switch ($driver) {
            case 'mysql':  return '`' . $ident . '`';
            case 'pgsql':
            case 'sqlite': return '"' . $ident . '"';
            case 'sqlsrv': return '[' . $ident . ']';
        }
        return $ident;
    }

    // ── ساخت دیتابیس در صورت نبود (مراحل نصب) ──────────────
    public static function ensureDatabase(string $driver, PDO $admin, string $dbname): void
    {
        switch ($driver) {
            case 'mysql':
                $safe = preg_replace('/[^A-Za-z0-9_]/', '', $dbname);
                if ($safe === '') throw new RuntimeException('نام دیتابیس نامعتبر است.');
                $admin->exec('CREATE DATABASE IF NOT EXISTS ' . self::quoteIdent('mysql', $safe)
                    . ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
                return;
            case 'pgsql':
                $safe = preg_replace('/[^A-Za-z0-9_]/', '', $dbname);
                if ($safe === '') throw new RuntimeException('نام دیتابیس نامعتبر است.');
                $exists = $admin->prepare('SELECT 1 FROM pg_database WHERE datname = ?');
                $exists->execute([$safe]);
                if (!$exists->fetchColumn()) {
                    $admin->exec('CREATE DATABASE ' . self::quoteIdent('pgsql', $safe) . ' ENCODING \'UTF8\'');
                }
                return;
            case 'sqlite':
                return; // فایل هنگام اولین اتصال ساخته می‌شود
            case 'sqlsrv':
                $safe = preg_replace('/[^A-Za-z0-9_]/', '', $dbname);
                if ($safe === '') throw new RuntimeException('نام دیتابیس نامعتبر است.');
                $admin->exec("IF DB_ID(N'{$safe}') IS NULL BEGIN CREATE DATABASE " . self::quoteIdent('sqlsrv', $safe) . '; END');
                return;
        }
    }

    // ══════════════════════════════════════════════════════════
    // طرح منطقی جداول — یک تعریف، ترجمه به هر گویش
    // نوع‌ها: id pk | str:n | text | long | num18 | int | small | ts
    // ══════════════════════════════════════════════════════════
    public static function schema(): array
    {
        return [
            'products' => [
                'cols' => [
                    ['id','str',64,'pk'], ['title','str',500], ['category','str',64],
                    ['price','num18'], ['original_price','num18'], ['stock','int'],
                    ['description','text'], ['image','text'], ['images','long'], ['article','long'],
                    ['videos','long'], ['slug','str',255], ['seo_title','str',500],
                    ['seo_description','text'], ['rating','dec31'], ['sales','int'], ['created_at','ts'],
                ],
                'indexes' => [
                    'idx_products_category' => ['category'],
                    'idx_products_slug'     => ['slug'],
                ],
            ],
            'orders' => [
                'cols' => [
                    ['id','str',64,'pk'], ['user_name','str',255], ['user_phone','str',20],
                    ['address','text'], ['delivery_slot','str',100], ['items','long'],
                    ['total','num18'], ['status','str',50], ['created_at','ts'],
                ],
                'indexes' => ['idx_orders_user_phone' => ['user_phone'], 'idx_orders_status' => ['status']],
            ],
            'users' => [
                'cols' => [
                    ['id','str',64,'pk'], ['name','str',255],
                    ['email','str',191,'unique'], ['phone','str',20,'unique'],
                    ['password_hash','str',255], ['national_id','str',20],
                    ['addresses','long'], ['avatar','long'], ['created_at','ts'],
                ],
                'indexes' => [],
            ],
            'admins' => [
                'cols' => [
                    ['id','str',64,'pk'], ['name','str',255],
                    ['email','str',191,'unique'], ['phone','str',20,'unique'],
                    ['password_hash','str',255], ['role','str',50],
                    ['two_factor_enabled','small'], ['two_factor_password_hash','str',255],
                    ['must_change_password','small'], ['created_at','ts'],
                ],
                'indexes' => [],
            ],
            'categories' => [
                'cols' => [['id','str',64,'pk'], ['title','str',255], ['icon','str',50], ['created_at','ts']],
                'indexes' => [],
            ],
            'tickets' => [
                'cols' => [
                    ['id','str',64,'pk'], ['user_phone','str',20], ['user_name','str',255],
                    ['subject','str',500], ['status','str',50], ['priority','str',20],
                    ['messages','long'], ['created_at','ts'],
                ],
                'indexes' => ['idx_tickets_user' => ['user_phone'], 'idx_tickets_status' => ['status']],
            ],
            'reviews' => [
                'cols' => [
                    ['id','str',64,'pk'], ['product_id','str',64], ['user_name','str',255],
                    ['rating','small'], ['text','text'], ['status','str',20],
                    ['likes','int'], ['dislikes','int'], ['parent','str',64],
                    ['user_id','str',64], ['created_at','ts'],
                ],
                'indexes' => ['idx_reviews_product' => ['product_id'], 'idx_reviews_status' => ['status']],
            ],
            'settings' => [
                'cols' => [['key','str',191,'pk'], ['value','long']],
                'indexes' => [],
            ],
        ];
    }

    private static function colType(string $driver, string $kind, int $len = 0): string
    {
        switch ($kind) {
            case 'str':
                if ($len <= 0) $len = 255;
                return match ($driver) {
                    'mysql'  => "VARCHAR($len)",
                    'pgsql'  => "VARCHAR($len)",
                    'sqlite' => 'TEXT',
                    'sqlsrv' => "NVARCHAR($len)",
                    default  => "VARCHAR($len)",
                };
            case 'text':
            case 'long':
                return match ($driver) {
                    'mysql'  => $kind === 'long' ? 'LONGTEXT' : 'TEXT',
                    'pgsql'   => 'TEXT',
                    'sqlite'  => 'TEXT',
                    'sqlsrv'  => 'NVARCHAR(MAX)',
                    default  => 'TEXT',
                };
            case 'num18':  return match ($driver) {
                    'sqlsrv' => 'DECIMAL(18,0)',
                    'sqlite' => 'NUMERIC(18,0)',
                    default  => 'DECIMAL(18,0)',
                };
            case 'dec31':  return match ($driver) {
                    'sqlsrv' => 'DECIMAL(3,1)',
                    'sqlite' => 'NUMERIC(3,1)',
                    default  => 'DECIMAL(3,1)',
                };
            case 'int':    return match ($driver) {
                    'mysql','pgsql','sqlsrv' => 'INT',
                    'sqlite' => 'INTEGER',
                    default  => 'INT',
                };
            case 'small':  return match ($driver) {
                    'pgsql','sqlsrv' => 'SMALLINT',
                    'sqlite' => 'INTEGER',
                    default  => 'TINYINT',
                };
            case 'ts':     return match ($driver) {
                    'mysql'  => 'DATETIME',
                    'pgsql'  => 'TIMESTAMP',
                    'sqlite' => 'TEXT',
                    'sqlsrv' => 'DATETIME2',
                    default  => 'DATETIME',
                };
        }
        return 'TEXT';
    }

    /** SQL ساخت یک جدول + ایندکس‌ها برای موتور مشخص */
    public static function createTableSql(string $driver, string $table): array
    {
        $schema = self::schema();
        if (!isset($schema[$table])) throw new RuntimeException("Unknown table: $table");
        $def = $schema[$table];
        $q   = fn(string $i) => self::quoteIdent($driver, $i);
        $cols = [];
        $pk   = null;
        $post = [];   // کلیدهای UNIQUE در گویش‌هایی که داخل ستون نمی‌شود نوشت

        foreach ($def['cols'] as $col) {
            [$name, $kind, $len, $flag] = array_pad($col, 4, null);
            $sql = $q($name) . ' ' . self::colType($driver, $kind, (int) $len);
            if ($flag === 'pk') {
                $pk = $name;
                if ($driver === 'mysql')  $sql .= ' NOT NULL';
                if ($driver === 'pgsql')  $sql .= ' NOT NULL';
            }
            if ($driver === 'mysql' && $kind === 'num18') $sql .= ' DEFAULT 0';
            if ($driver === 'pgsql' && $kind === 'num18') $sql .= ' DEFAULT 0';
            if ($kind === 'int'   && in_array($driver, ['mysql','pgsql','sqlsrv'], true)) $sql .= ' DEFAULT 0';
            if ($name === 'status' && $table === 'orders')  $sql .= " DEFAULT 'pending'";
            if ($name === 'status' && $table === 'tickets') $sql .= " DEFAULT 'open'";
            if ($name === 'priority') $sql .= " DEFAULT 'normal'";
            if ($name === 'status' && $table === 'reviews') $sql .= " DEFAULT 'pending'";
            if ($name === 'role') $sql .= " DEFAULT 'admin'";
            if ($kind === 'small' && $flag === null) $sql .= ' DEFAULT 0';
            if ($name === 'created_at') {
                $sql .= match ($driver) {
                    'mysql'  => ' DEFAULT CURRENT_TIMESTAMP',
                    'pgsql'  => ' DEFAULT CURRENT_TIMESTAMP',
                    'sqlite' => ' DEFAULT CURRENT_TIMESTAMP',
                    'sqlsrv' => ' DEFAULT SYSUTCDATETIME()',
                    default  => '',
                };
            }
            if ($flag === 'unique' && in_array($driver, ['mysql','pgsql','sqlsrv'], true)) $sql .= ' NOT NULL';
            if ($flag === 'unique' && $driver !== 'mysql') $post[] = 'u_' . $table . '_' . $name . ':' . $name;
            $cols[] = $sql;
            if ($flag === 'unique' && $driver === 'mysql') $cols[] = 'UNIQUE KEY ' . $q('u_' . $name) . ' (' . $q($name) . ')';
        }

        // توجه: محدودیت جدول باید بعد از ستون‌ها بیاید (SQLite ایجاب می‌کند؛ بقیه هم می‌پذیرند)
        if ($pk) $cols[] = match ($driver) {
            'sqlsrv' => 'CONSTRAINT ' . $q('pk_' . $table) . ' PRIMARY KEY (' . $q($pk) . ')',
            default  => 'PRIMARY KEY (' . $q($pk) . ')',
        };

        $out = [];
        $body = implode(",\n  ", $cols);
        $out[] = match ($driver) {
            'mysql'  => "CREATE TABLE IF NOT EXISTS {$q($table)} (\n  $body\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            'pgsql', 'sqlite' => "CREATE TABLE IF NOT EXISTS {$q($table)} (\n  $body\n)",
            'sqlsrv' => "IF OBJECT_ID(N'" . $table . "', N'U') IS NULL BEGIN CREATE TABLE {$q($table)} (\n  $body\n); END",
            default  => "CREATE TABLE IF NOT EXISTS {$q($table)} (\n  $body\n)",
        };

        foreach ($def['indexes'] as $iname => $icols) {
            $list = implode(', ', array_map($q, $icols));
            $out[] = match ($driver) {
                'mysql'  => "SET @s = 'CREATE INDEX {$q($iname)} ON {$q($table)} ($list)'; " .
                            "SET @ok = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='$table' AND index_name='$iname')=0, @s, 'DO 0'); PREPARE stmt FROM @ok; EXECUTE stmt; DEALLOCATE PREPARE stmt",
                'pgsql'  => "CREATE INDEX IF NOT EXISTS {$q($iname)} ON {$q($table)} ($list)",
                'sqlite' => "CREATE INDEX IF NOT EXISTS {$q($iname)} ON {$q($table)} ($list)",
                'sqlsrv' => "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='$iname' AND object_id = OBJECT_ID(N'" . $table . "')) CREATE INDEX {$q($iname)} ON {$q($table)} ($list)",
                default  => '',
            };
        }
        foreach ($post as $u) {
            [$uname, $ucol] = explode(':', $u, 2);
            $out[] = match ($driver) {
                'pgsql'  => "DO \$\$ BEGIN IF to_regclass('{$table}') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='$uname') THEN ALTER TABLE {$q($table)} ADD CONSTRAINT {$q($uname)} UNIQUE ({$q($ucol)}); END IF; END \$\$",
                'sqlite' => "CREATE UNIQUE INDEX IF NOT EXISTS {$q($uname)} ON {$q($table)} ({$q($ucol)})",
                'sqlsrv' => "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='$uname') CREATE UNIQUE INDEX {$q($uname)} ON {$q($table)} ({$q($ucol)})",
                default  => '',
            };
        }
        return $out;
    }

    /** نسخه‌ی بدون DEFAULT CURRENT_TIMESTAMP برای میزبان‌های قدیمی (MySQL 5.5 و…) */
    public static function createTableSqlFallback(string $driver, string $table): array
    {
        $sqls = self::createTableSql($driver, $table);
        return array_map(fn($s) => str_replace(
            [' DEFAULT CURRENT_TIMESTAMP', ' DEFAULT SYSUTCDATETIME()'],
            ['', ''],
            $s
        ), $sqls);
    }

    // ── فهرست ستون‌های یک جدول (برای upsert) ─────────────────
    public function columnsOf(string $table): array
    {
        if (isset($this->cache['cols'][$table])) return $this->cache['cols'][$table];
        $db = $this->pdo();
        $cols = [];
        switch ($this->driver) {
            case 'mysql':
                $rows = $db->query('DESCRIBE ' . self::quoteIdent($this->driver, $table))->fetchAll(PDO::FETCH_ASSOC);
                foreach ($rows as $r) $cols[] = $r['Field'];
                break;
            case 'pgsql':
                $st = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = ? AND table_schema = current_schema() ORDER BY ordinal_position");
                $st->execute([$table]);
                $cols = $st->fetchAll(PDO::FETCH_COLUMN);
                break;
            case 'sqlite':
                $t = self::quoteIdent('sqlite', $table);
                $rows = $db->query("PRAGMA table_info($t)")->fetchAll(PDO::FETCH_ASSOC);
                foreach ($rows as $r) $cols[] = $r['name'];
                break;
            case 'sqlsrv':
                $st = $db->prepare("SELECT c.name FROM sys.columns c WHERE c.object_id = OBJECT_ID(?) ORDER BY c.column_id");
                $st->execute([$table]);
                $cols = $st->fetchAll(PDO::FETCH_COLUMN);
                break;
        }
        return $this->cache['cols'][$table] = $cols;
    }

    public function hasColumn(string $table, string $col): bool
    {
        return in_array($col, $this->columnsOf($table), true);
    }

    // ── Upsert چندگویشی ──────────────────────────────────────
    /**
     * برمی‌گرداند [sql, type-hints]
     * $cols: آرایه‌ی ستون‌های موجود در رکورد
     */
    public function upsertSql(string $table, array $cols): string
    {
        return self::upsertSqlFor($this->driver, $table, $cols);
    }

    public static function upsertSqlFor(string $driver, string $table, array $cols): string
    {
        $q   = fn(string $i) => self::quoteIdent($driver, $i);
        $colSql  = implode(',', array_map($q, $cols));
        $pholder = implode(',', array_fill(0, count($cols), '?'));

        switch ($driver) {
            case 'mysql':
                $upd = implode(',', array_map(fn($c) => $q($c) . ' = VALUES(' . $q($c) . ')', $cols));
                return "INSERT INTO {$q($table)} ($colSql) VALUES ($pholder) ON DUPLICATE KEY UPDATE $upd";

            case 'pgsql':
            case 'sqlite':
                $ex  = $driver === 'pgsql' ? 'EXCLUDED' : 'excluded';
                $nonPk = array_values(array_diff($cols, ['id', 'key']));
                if (!$nonPk) return "INSERT INTO {$q($table)} ($colSql) VALUES ($pholder) ON CONFLICT DO NOTHING";
                $upd = implode(',', array_map(fn($c) => $q($c) . ' = ' . $ex . '.' . $q($c), $nonPk));
                $conflictCol = in_array('key', $cols, true) && $table === 'settings' ? 'key' : 'id';
                return "INSERT INTO {$q($table)} ($colSql) VALUES ($pholder) ON CONFLICT ({$q($conflictCol)}) DO UPDATE SET $upd";

            case 'sqlsrv':
                $vals = implode(',', array_map(fn($c) => 'src.' . $q($c), $cols));
                $upd  = implode(',', array_map(
                    fn($c) => "tgt.{$q($c)} = src.{$q($c)}",
                    array_values(array_diff($cols, ['id', 'key']))
                ) ?: ['tgt.' . $q($cols[0]) . ' = tgt.' . $q($cols[0])]);
                $pkCol = ($table === 'settings') ? 'key' : 'id';
                $src = 'SELECT ' . implode(', ', array_map(fn($c) => '? AS ' . $q($c), $cols));
                return "MERGE INTO {$q($table)} AS tgt USING ({$src}) AS src ON tgt.{$q($pkCol)} = src.{$q($pkCol)}
                        WHEN MATCHED THEN UPDATE SET $upd
                        WHEN NOT MATCHED THEN INSERT ($colSql) VALUES ($vals);";
        }
        throw new RuntimeException('unsupported');
    }

    public function tableExists(string $table): bool
    {
        if (isset($this->cache['exists'][$table])) return $this->cache['exists'][$table];
        $db = $this->pdo();
        $ok = false;
        try {
            switch ($this->driver) {
                case 'mysql':
                    $st = $db->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?');
                    $st->execute([$table]); $ok = (int) $st->fetchColumn() > 0; break;
                case 'pgsql':
                    $st = $db->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_name = ? AND table_schema = current_schema()');
                    $st->execute([$table]); $ok = (int) $st->fetchColumn() > 0; break;
                case 'sqlite':
                    $st = $db->prepare("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name = ?");
                    $st->execute([$table]); $ok = (int) $st->fetchColumn() > 0; break;
                case 'sqlsrv':
                    $st = $db->prepare('SELECT COUNT(*) FROM sys.tables WHERE name = ?');
                    $st->execute([$table]); $ok = (int) $st->fetchColumn() > 0; break;
            }
        } catch (Throwable $e) { $ok = false; }
        return $this->cache['exists'][$table] = $ok;
    }

    public function countRows(string $table): int
    {
        if (!$this->tableExists($table)) return 0;
        return (int) $this->pdo()->query('SELECT COUNT(*) FROM ' . self::quoteIdent($this->driver, $table))->fetchColumn();
    }

    /** ساخت تمام جداول؛ اگر موتور قدیمی DEFAULT را نپذیرفت، نسخه‌ی fallback */
    public function createSchema(): void
    {
        $db = $this->pdo();
        foreach (array_keys(self::schema()) as $table) {
            try {
                foreach (self::createTableSql($this->driver, $table) as $sql) $db->exec($sql);
            } catch (Throwable $e) {
                try {
                    foreach (self::createTableSqlFallback($this->driver, $table) as $sql) $db->exec($sql);
                } catch (Throwable $e2) {
                    throw new RuntimeException('ساخت جدول «' . $table . '» ناموفق بود: ' . $e2->getMessage(), 0, $e2);
                }
            }
        }
    }

    /** درج مدیر پیش‌فرض فقط هنگام نصب (نه هر درخواست) */
    public function ensureFirstAdmin(string $email, string $password): bool
    {
        $db = $this->pdo();
        if ($this->countRows('admins') > 0) return false;
        $st = $db->prepare('INSERT INTO ' . self::quoteIdent($this->driver, 'admins')
            . ' (id, name, email, phone, password_hash, role, two_factor_enabled, must_change_password, created_at) '
            . 'VALUES (?,?,?,?,?,?,?,1,' . $this->nowExpr() . ')');
        $st->execute([
            'admin_' . bin2hex(random_bytes(6)), 'مدیر اصلی', $email, '09120000000',
            ary_password_hash($password), 'superadmin', 0,
        ]);
        return true;
    }

    public function nowExpr(): string
    {
        return self::nowExprFor($this->driver);
    }

    public static function nowExprFor(string $driver): string
    {
        return match ($driver) {
            'mysql'  => 'NOW()',
            'pgsql'  => "CURRENT_TIMESTAMP",
            'sqlite' => "strftime('%Y-%m-%d %H:%M:%S','now')",
            'sqlsrv' => 'SYSUTCDATETIME()',
            default  => 'CURRENT_TIMESTAMP',
        };
    }

    /** برچسب وضعیت فعلی برای صفحه‌ی تنظیمات پنل */
    public function info(): array
    {
        return [
            'driver'     => $this->driver,
            'label'      => self::SUPPORTED[$this->driver]['label'] ?? $this->driver,
            'php'        => PHP_VERSION,
            'extensions' => [
                'pdo_mysql'   => extension_loaded('pdo_mysql'),
                'pdo_pgsql'   => extension_loaded('pdo_pgsql'),
                'pdo_sqlite'  => extension_loaded('pdo_sqlite'),
                'pdo_sqlsrv'  => extension_loaded('pdo_sqlsrv'),
            ],
            'server_version' => (function () { try { return (string) $this->pdo()->query($this->driver === 'sqlite' ? 'SELECT sqlite_version()' : 'SELECT 1')->fetchColumn(); } catch (Throwable $e) { return ''; } })(),
        ];
    }
}
