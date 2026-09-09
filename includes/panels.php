<?php
// ═══════════════════════════════════════════════════════════════
// AryaStore — Hosting panel integrations
// File: includes/panels.php
//
// پشتیبانی از پنل‌های میزبانی برای «راه‌اندازی خودکار»:
// ساخت دیتابیس + ساخت کاربر دیتابیس + اعطای دسترسی از داخل ویزارد
// نصب سایت، بدون باز کردن دستی phpMyAdmin.
//
//   • cPanel / WHM   — UAPI (پورت 2083 HTTPS / 2082) با API Token یا رمز
//   • DirectAdmin    — API2 (پورت 2222) با Login Key یا رمز
//   • Plesk          — XML API (پورت 8443) با API Token یا رمز
//   • manual/none    — بدون پنل (خودتان دیتابیس را می‌سازید)
//
// افزودن پنل تازه = یک کلاس کوچک با ۶ متد (نگاه کنید به AryaPanelCustom
// در انتهای همین فایل) + ثبت در AryaPanel::SUPPORTED.
//
// ⚠️ نکته امنیتی: اعتبارنامه پنل (رمز/API Token) هیچ‌گاه در config.php
// ذخیره نمی‌شود؛ فقط برای همان درخواست استفاده می‌شود. حتماً روی HTTPS
// استفاده شود (این کتابخانه در صورت امکان بررسی گواهی TLS را روشن نگه
// می‌دارد؛ گزینه insecure فقط برای تست داخلی است).
// ═══════════════════════════════════════════════════════════════

if (!defined('ARYA_GUARD')) { http_response_code(403); exit('Forbidden'); }

/** هدر/پاسخ‌دهی HTTP سبک با curl یا stream fallback */
final class AryaHttp
{
    public static function request(string $method, string $url, array $opts = []): array
    {
        $timeout = $opts['timeout'] ?? 20;
        $headers = $opts['headers'] ?? [];
        $body    = $opts['body'] ?? null;
        $basic   = $opts['basic'] ?? null;   // [user, pass]
        $insecure= !empty($opts['insecure']);

        $hdrLines = [];
        foreach ($headers as $k => $v) $hdrLines[] = "$k: $v";
        if ($basic) $hdrLines[] = 'Authorization: Basic ' . base64_encode($basic[0] . ':' . $basic[1]);

        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS      => 3,
                CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_TIMEOUT        => $timeout,
                CURLOPT_CUSTOMREQUEST  => strtoupper($method),
                CURLOPT_HTTPHEADER     => $hdrLines,
                CURLOPT_SSL_VERIFYPEER => !$insecure,
                CURLOPT_SSL_VERIFYHOST => $insecure ? 0 : 2,
            ]);
            if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
            $resp = curl_exec($ch);
            $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err  = curl_error($ch);
            curl_close($ch);
            if ($resp === false) throw new RuntimeException('خطای اتصال به پنل: ' . $err);
            return ['status' => $code ?: 200, 'body' => (string) $resp];
        }

        $ctx = stream_context_create([
            'http' => [
                'method'        => strtoupper($method),
                'header'        => implode("\r\n", $hdrLines),
                'content'       => $body ?? '',
                'timeout'       => $timeout,
                'ignore_errors' => true,
            ],
            'ssl' => [
                'verify_peer'      => !$insecure,
                'verify_peer_name' => !$insecure,
                'allow_self_signed'=> $insecure,
            ],
        ]);
        $resp = @file_get_contents($url, false, $ctx);
        if ($resp === false) throw new RuntimeException('خطای اتصال به پنل (سرور در دسترس نیست یا گواهی TLS نامعتبر است).');
        $status = 0;
        foreach ($http_response_header ?? [] as $line) {
            if (preg_match('#^HTTP/\S+\s+(\d{3})#', $line, $m)) { $status = (int) $m[1]; break; }
        }
        return ['status' => $status ?: 200, 'body' => $resp];
    }
}

interface IAryaPanel
{
    public function testConnection(): array;                    // → ok? + شناسه کاربر
    public function listDatabases(): array;                     // → [names...]
    public function createDatabase(string $name): array;        // → ['name' => نام نهایی با پیشوند]
    public function createDatabaseUser(string $name, string $pass): array;
    public function grantPrivileges(string $db, string $user): array;
    public function deleteDatabase(string $name): array;
}

// ═══════════════════════════════════════════════════════════════
// cPanel — UAPI (execute endpoint)
// ═══════════════════════════════════════════════════════════════
final class AryaPanelCpanel implements IAryaPanel
{
    private string $base;
    private ?string $token;
    private ?array $basic;
    private bool $insecure;
    private ?string $cpanelUser = null;

    public function __construct(array $o)
    {
        $scheme  = !empty($o['insecure']) || (!empty($o['scheme']) && $o['scheme'] === 'http') ? 'http' : 'https';
        $host    = trim((string) ($o['host'] ?? ''));
        $port    = (int) ($o['port'] ?? ($scheme === 'https' ? 2083 : 2082));
        if ($host === '') throw new RuntimeException('آدرس میزبان پنل (cPanel host) الزامی است.');
        $this->base = "$scheme://$host:$port";
        $this->token = trim((string) ($o['token'] ?? '')) ?: null;
        $u = trim((string) ($o['user'] ?? ''));
        $p = (string) ($o['pass'] ?? '');
        $this->basic = ($u !== '' && $p !== '') ? [$u, $p] : null;
        if (!$this->token && !$this->basic) throw new RuntimeException('برای cPanel، API Token یا نام‌کاربری+رمز لازم است.');
        $this->insecure = !empty($o['insecure']);
    }

    private function uapi(string $module, string $func, array $params = [], string $method = 'GET'): array
    {
        $qs = http_build_query($params);
        $url = $this->base . '/execute/' . rawurlencode($module) . '/' . rawurlencode($func) . ($qs !== '' && $method === 'GET' ? "?$qs" : '');
        $headers = ['Accept: application/json'];
        if ($this->token) $headers['Authorization'] = 'b64hash=' . $this->token;
        $opts = ['headers' => $headers, 'insecure' => $this->insecure];
        if ($method === 'POST') $opts['body'] = $qs;
        $resp = AryaHttp::request($method, $url, $opts);
        $data = json_decode($resp['body'], true);
        if (!is_array($data)) {
            throw new RuntimeException('پاسخ ناخوانا از cPanel (HTTP ' . $resp['status'] . '). آدرس/پورت/اعتبارنامه را بررسی کنید.');
        }
        if (($data['status'] ?? 1) !== 1 && !($resp['status'] >= 200 && $resp['status'] < 300)) {
            throw new RuntimeException('خطای cPanel: ' . ($data['messages']['stderr'][0] ?? $data['errors'][0] ?? 'نامشخص'));
        }
        if (($data['status'] ?? 0) !== 1) {
            $msg = $data['messages']['stderr'][0] ?? ($data['messages'][0] ?? 'درخواست ناموفق');
            throw new RuntimeException('خطای cPanel: ' . $msg);
        }
        return ['result' => $data['result'] ?? null, 'messages' => $data['messages'] ?? []];
    }

    public function accountUser(): string
    {
        if ($this->cpanelUser !== null) return $this->cpanelUser;
        // Email/disk_usage شیوه‌ای سبک و مستند برای خواندن نام حساب جاری است
        try {
            $acct = $this->uapi('Email', 'disk_usage');
            $u = trim((string) ($acct['result']['username'] ?? ''));
        } catch (Throwable $e) {
            $u = '';
        }
        if ($u === '' && $this->basic) $u = $this->basic[0];
        if ($u === '' && $this->token && str_contains($this->token, ':')) {
            // توکن‌های قدیمی cPanel به شکل user:token هستند
            $u = substr($this->token, 0, strpos($this->token, ':'));
        }
        return $this->cpanelUser = $u;
    }

    public function testConnection(): array
    {
        // فراخوانی سبک: فهرست دیتابیس‌ها
        $dbs = $this->listDatabases();
        return ['ok' => true, 'user' => $this->accountUser(), 'databases' => $dbs];
    }

    public function listDatabases(): array
    {
        $r = $this->uapi('Mysql', 'list_databases');
        return array_values(array_map('strval', (array) ($r['result'] ?? [])));
    }

    private function withPrefix(string $name): string
    {
        $user = $this->accountUser();
        $name = preg_replace('/[^A-Za-z0-9_]/', '', $name);
        if ($user !== '' && !str_starts_with($name, $user . '_')) $name = $user . '_' . $name;
        return substr($name, 0, 64);
    }

    public function createDatabase(string $name): array
    {
        $final = $this->withPrefix($name);
        $this->uapi('Mysql', 'create_database', ['name' => $final], 'POST');
        return ['name' => $final];
    }

    public function createDatabaseUser(string $name, string $pass): array
    {
        $final = $this->withPrefix($name);
        $this->uapi('Mysql', 'create_user', ['name' => $final, 'password' => $pass], 'POST');
        return ['name' => $final];
    }

    public function grantPrivileges(string $db, string $user): array
    {
        $this->uapi('Mysql', 'add_privileges_to_database', [
            'database' => $db, 'user' => $user, 'privileges' => 'ALL',
        ], 'POST');
        return ['granted' => true];
    }

    public function deleteDatabase(string $name): array
    {
        $this->uapi('Mysql', 'delete_database', ['name' => $name], 'POST');
        return ['deleted' => true];
    }
}

// ═══════════════════════════════════════════════════════════════
// DirectAdmin — API2 (JSON) روی پورت 2222
// ═══════════════════════════════════════════════════════════════
final class AryaPanelDirectadmin implements IAryaPanel
{
    private string $base;
    private ?array $basic;
    private ?string $loginKey;
    private bool $insecure;
    private string $user;

    public function __construct(array $o)
    {
        $scheme = !empty($o['insecure']) || (!empty($o['scheme']) && $o['scheme'] === 'http') ? 'http' : 'https';
        $host   = trim((string) ($o['host'] ?? ''));
        $port   = (int) ($o['port'] ?? ($scheme === 'https' ? 2222 : 2222));
        if ($host === '') throw new RuntimeException('آدرس میزبان پنل (DirectAdmin host) الزامی است.');
        $this->base = "$scheme://$host:$port";
        $this->loginKey = trim((string) ($o['token'] ?? '')) ?: null; // login-key
        $u = trim((string) ($o['user'] ?? ''));
        $p = (string) ($o['pass'] ?? '');
        $this->basic = ($u !== '' && $p !== '') ? [$u, $p] : null;
        $this->user  = $u;
        if (!$this->loginKey && !$this->basic) throw new RuntimeException('برای DirectAdmin، Login Key یا نام‌کاربری+رمز لازم است.');
        $this->insecure = !empty($o['insecure']);
    }

    /** فراخوانی API2: /API/<CMD>?params&json=yes&login-key=... */
    private function api2(string $cmd, array $params = [], string $method = 'GET'): array
    {
        $params['json'] = 'yes';
        if ($this->loginKey && $method === 'GET') $params['login-key'] = $this->loginKey;
        $qs  = http_build_query($params);
        $url = $this->base . '/API/' . rawurlencode($cmd) . ($method === 'GET' && $qs !== '' ? "?$qs" : '');
        $opts = ['insecure' => $this->insecure];
        if ($this->loginKey && $method === 'POST') {
            $qs = 'login-key=' . rawurlencode($this->loginKey) . '&' . $qs;
        }
        if ($method === 'POST') $opts['body'] = $qs;
        $resp = AryaHttp::request($method, $url, $opts);
        $data = json_decode($resp['body'], true);
        if (!is_array($data)) {
            // پاسخ HTML = خطای لاگین یا API2 غیرفعال
            throw new RuntimeException('پاسخ ناخوانا از DirectAdmin (HTTP ' . $resp['status'] . '). اگر از رمز عبور استفاده می‌کنید، «CLI/API with login key» باید فعال باشد یا از Login Key استفاده کنید.');
        }
        if (($data['result'] ?? '') === 'error') {
            throw new RuntimeException('خطای DirectAdmin: ' . ($data['error'] ?? ($data['text'] ?? 'نامشخص')));
        }
        return $data;
    }

    public function testConnection(): array
    {
        $r = $this->api2('COMMAND_INFO', []); // سبک‌ترین نقطه‌ی قابل‌احراز API2
        return ['ok' => true, 'user' => $this->user, 'databases' => $this->listDatabases()];
    }

    public function listDatabases(): array
    {
        $r = $this->api2('DB_USER_LIST');
        $out = [];
        foreach ((array) ($r['data'] ?? []) as $row) {
            foreach ((array) ($row['dbs'] ?? []) as $db) $out[] = is_array($db) ? (string) ($db['name'] ?? '') : (string) $db;
        }
        return array_values(array_filter($out));
    }

    public function createDatabase(string $name): array
    {
        $name = preg_replace('/[^A-Za-z0-9_]/', '', $name);
        $this->api2('DB_CREATE', ['db' => $name], 'POST');
        return ['name' => $name];
    }

    public function createDatabaseUser(string $name, string $pass): array
    {
        $name = preg_replace('/[^A-Za-z0-9_]/', '', $name);
        $this->api2('DB_USER_ADD', ['dbuser' => $name, 'passwd' => $pass, 'passwd2' => $pass, 'level' => '10'], 'POST');
        return ['name' => $name];
    }

    public function grantPrivileges(string $db, string $user): array
    {
        // DB_LINK grant می‌کند؛ اگر دیتابیس تازه ساخته شده و لینک ندارد:
        $this->api2('DB_LINK', ['db' => $db, 'dbuser' => $user], 'POST');
        return ['granted' => true];
    }

    public function deleteDatabase(string $name): array
    {
        $this->api2('DB_DELETE', ['selectdatabases' => $name], 'POST');
        return ['deleted' => true];
    }

    /** DirectAdmin دیتابیس و کاربر را با یک فراخوانی DB_CREATE می‌سازد */
    public function createDatabaseWithUser(string $db, string $user, string $pass): array
    {
        $db   = preg_replace('/[^A-Za-z0-9_]/', '', $db);
        $user = preg_replace('/[^A-Za-z0-9_.@-]/', '', $user);
        $this->api2('DB_CREATE', [
            'type' => 'mysql', 'db' => $db, 'db_user' => $user,
            'db_passwd' => $pass, 'db_passwd2' => $pass, 'notify' => 'no', 'ascii_pwd' => 'yes',
        ], 'POST');
        return ['dbname' => $db, 'dbuser' => $user, 'unified' => true];
    }
}

// ═══════════════════════════════════════════════════════════════
// Plesk — XML Web Service API (پورت 8443)
// ═══════════════════════════════════════════════════════════════
final class AryaPanelPlesk implements IAryaPanel
{
    private string $base;
    private ?string $token;
    private ?array $basic;
    private bool $insecure;
    private ?int $siteId = null;
    private ?string $domain;

    public function __construct(array $o)
    {
        $scheme  = !empty($o['insecure']) || (!empty($o['scheme']) && $o['scheme'] === 'http') ? 'http' : 'https';
        $host    = trim((string) ($o['host'] ?? ''));
        $port    = (int) ($o['port'] ?? 8443);
        if ($host === '') throw new RuntimeException('آدرس میزبان پنل (Plesk host) الزامی است.');
        $this->base = "$scheme://$host:$port";
        $this->token = trim((string) ($o['token'] ?? '')) ?: null;
        $u = trim((string) ($o['user'] ?? ''));
        $p = (string) ($o['pass'] ?? '');
        $this->basic = ($u !== '' && $p !== '') ? [$u, $p] : null;
        if (!$this->token && !$this->basic) throw new RuntimeException('برای Plesk، API Token (کلید دسترسی) یا نام‌کاربری+رمز لازم است.');
        $this->insecure = !empty($o['insecure']);
        $this->domain = trim((string) ($o['domain'] ?? '')) ?: null; // دامنه‌ی سایت در Plesk
    }

    private function packet(string $xml, string $method = 'POST'): SimpleXMLElement
    {
        $headers = ['Content-Type: text/xml'];
        if ($this->token) $headers['HTTP_AUTHORIZATION'] = 'x-api-key: ' . $this->token; // Plesk: header x-api-key
        $opts = [
            'headers'  => ['Content-Type: text/xml', 'Accept: text/xml'] + ($this->token ? ['X-API-Key' => $this->token] : []),
            'insecure' => $this->insecure,
        ];
        if (!$this->token && $this->basic) $opts['basic'] = $this->basic;
        $opts['body'] = '<?xml version="1.0" encoding="utf-8" standalone="no" ?>
<!DOCTYPE web-service-request PUBLIC "-//SPRINT//DTD Plesk PHP API 3.4//EN" "http://127.0.0.1/dotd/PHP30WebSvc.dtd">
<packet>' . $xml . '</packet>';
        $resp = AryaHttp::request('POST', $this->base . '/webservice-control.php', $opts);
        $sx = @simplexml_load_string(preg_replace('/<!DOCTYPE[^>]*>/', '', $resp['body']) ?: '');
        if (!$sx) throw new RuntimeException('پاسخ ناخوانا از Plesk (HTTP ' . $resp['status'] . ').');
        if (!empty($sx->system_err)) {
            throw new RuntimeException('خطای Plesk: ' . trim((string) $sx->system_err));
        }
        $status = (string) ($sx->stat ?? '');
        if ($status !== 'ok') {
            $msg = (string) ($sx->system_err ?? $sx->xpath('//err')[0] ?? 'خطای نامشخص');
            throw new RuntimeException('خطای Plesk: ' . $msg);
        }
        return $sx;
    }

    private function resolveSiteId(): int
    {
        if ($this->siteId !== null) return $this->siteId;
        $filter = $this->domain
            ? '<filter><name>' . htmlspecialchars($this->domain, ENT_XML1) . '</name></filter>'
            : '<filter/>';
        $sx = $this->packet('<site><get>' . $filter . '</get></site>');
        $site = $sx->xpath('//site-info')[0] ?? null;
        if (!$site) throw new RuntimeException($this->domain
            ? 'سایتی با دامنه «' . $this->domain . '» در Plesk پیدا نشد.'
            : 'هیچ سایتی در حساب Plesk شما پیدا نشد.');
        return $this->siteId = (int) $site->id;
    }

    public function testConnection(): array
    {
        $sx = $this->packet('<version><get/></version>');
        return ['ok' => true, 'version' => trim((string) ($sx->version->get->ver ?? '')), 'databases' => $this->listDatabases()];
    }

    public function listDatabases(): array
    {
        try { $id = $this->resolveSiteId(); } catch (Throwable $e) { return []; }
        $sx = $this->packet('<database><get><filter><site-id>' . $id . '</site-id></filter></get></database>');
        $out = [];
        foreach ($sx->xpath('//database-name') as $n) $out[] = trim((string) $n);
        return $out;
    }

    public function createDatabase(string $name): array
    {
        $id = $this->resolveSiteId();
        $name = preg_replace('/[^A-Za-z0-9_]/', '', $name);
        $this->packet('<database><add><values><site-id>' . $id . '</site-id><name>' . $name . '</name><type>mysql</type></values></add></database>');
        return ['name' => $name, 'site_id' => $id];
    }

    public function createDatabaseUser(string $name, string $pass): array
    {
        $id = $this->resolveSiteId();
        $name = preg_replace('/[^A-Za-z0-9_]/', '', $name);
        $this->packet('<database><add_user><values><site-id>' . $id . '</site-id><name>' . $name . '</name><passwd>' . htmlspecialchars($pass, ENT_XML1) . '</passwd></values></add_user></database>');
        return ['name' => $name];
    }

    public function grantPrivileges(string $db, string $user): array
    {
        $id = $this->resolveSiteId();
        $this->packet('<database><update><values><site-id>' . $id . '</site-id><name>' . $db . '</name><users><add-user>' . $user . '</add-user></users><default_right>all</default_right></values></update></database>');
        return ['granted' => true];
    }

    public function deleteDatabase(string $name): array
    {
        $id = $this->resolveSiteId();
        $this->packet('<database><delete><filter><site-id>' . $id . '</site-id><name>' . $name . '</name></filter></delete></database>');
        return ['deleted' => true];
    }
}

/**
 * قالب توسعه: برای افزودن پنل تازه (ISPConfig، CloudPanel، ISPmanager،
 * Vestа…) این کلاس را الگو قرار دهید: ۶ متد IAryaPanel + ثبت در SUPPORTED.
 */
final class AryaPanelCustom implements IAryaPanel
{
    public function __construct(array $o) {
        throw new RuntimeException('پنل سفارشی هنوز پیاده‌سازی نشده است؛ از «manual» استفاده کنید یا ادپتر تازه بسازید (includes/panels.php).');
    }
    public function testConnection(): array { return ['ok' => false]; }
    public function listDatabases(): array { return []; }
    public function createDatabase(string $name): array { return []; }
    public function createDatabaseUser(string $name, string $pass): array { return []; }
    public function grantPrivileges(string $db, string $user): array { return []; }
    public function deleteDatabase(string $name): array { return []; }
}

final class AryaPanel
{
    public const SUPPORTED = [
        'none'       => 'اتصال دستی (بدون پنل)',
        'cpanel'     => 'cPanel / WHM (UAPI)',
        'directadmin'=> 'DirectAdmin (API2)',
        'plesk'      => 'Plesk (XML API)',
    ];

    public static function make(string $type, array $opts): IAryaPanel
    {
        return match ($type) {
            'cpanel'      => new AryaPanelCpanel($opts),
            'directadmin'  => new AryaPanelDirectadmin($opts),
            'plesk'        => new AryaPanelPlesk($opts),
            'none', ''      => new class implements IAryaPanel {
                public function testConnection(): array { return ['ok' => true, 'manual' => true]; }
                public function listDatabases(): array { return []; }
                public function createDatabase(string $name): array { return ['name' => $name]; }
                public function createDatabaseUser(string $name, string $pass): array { return ['name' => $name]; }
                public function grantPrivileges(string $db, string $user): array { return ['granted' => true]; }
                public function deleteDatabase(string $name): array { return ['deleted' => true]; }
            },
            default => throw new RuntimeException('پنل میزبانی ناشناخته: ' . $type . ' (مجااز: ' . implode(', ', array_keys(self::SUPPORTED)) . ')'),
        };
    }

    /**
     * مسیر کامل «ساخت خودکار» در ویزارد نصب:
     * دیتابیس + کاربر + دسترسی‌ها.
     */
    public static function provision(IAryaPanel $panel, string $dbName, string $dbUser, string $dbPass): array
    {
        if (method_exists($panel, 'createDatabaseWithUser')) {
            $r = $panel->createDatabaseWithUser($dbName, $dbUser, $dbPass);
            return [
                'dbname' => (string) ($r['dbname'] ?? $dbName),
                'dbuser' => (string) ($r['dbuser'] ?? $dbUser),
                'dbpass' => $dbPass, // فقط همین لحظه در پاسخ است تا ویزارد فیلدها را پر کند؛ ذخیره نمی‌شود
            ];
        }
        $db = $panel->createDatabase($dbName);
        $us = $panel->createDatabaseUser($dbUser, $dbPass);
        $panel->grantPrivileges($db['name'], $us['name']);
        return [
            'dbname' => $db['name'],
            'dbuser' => $us['name'],
            'dbpass' => $dbPass,   // فقط همین لحظه در پاسخ است تا ویزارد فیلدها را پر کند؛ ذخیره نمی‌شود
        ];
    }
}
