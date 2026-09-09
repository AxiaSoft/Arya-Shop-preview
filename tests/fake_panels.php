<?php
/**
 * سرور پنل جعلی برای تست — cPanel + DirectAdmin + Plesk را روی یک پورت شبیه‌سازی می‌کند.
 * اجرا:   php -S 127.0.0.1:8212 tests/fake_panels.php
 * وضعیت ساخته‌شده در FAKE_STATE (پیش‌فرض /tmp/arya_fake_state.json) ثبت می‌شود تا تست آن را بررسی کند.
 */
$state = getenv('FAKE_STATE') ?: '/tmp/arya_fake_state.json';
$s = is_file($state) ? (json_decode((string) file_get_contents($state), true) ?: []) : [];
$log = function (array $entry) use (&$s, $state) {
    $s['calls'][] = $entry;
    file_put_contents($state, json_encode($s, JSON_UNESCAPED_UNICODE));
};
$save = function () use (&$s, $state) { file_put_contents($state, json_encode($s, JSON_UNESCAPED_UNICODE)); };

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$body = file_get_contents('php://input') ?: '';
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

function out(int $code, string $body, string $type = 'application/json') {
    http_response_code($code);
    header('Content-Type: ' . $type);
    echo $body;
    exit;
}

/* ═══ cPanel UAPI: /execute/<Module>/<func> ═══ */
if (preg_match('#^/execute/([A-Za-z]+)/([A-Za-z_]+)$#', $uri, $m)) {
    $authorized = ($auth === 'b64hash=' . ($s['cpanel_token'] ?? 'TESTTOKEN'))
        || (isset($_SERVER['PHP_AUTH_USER'])); // basic هم می‌پذیرد
    if (!$authorized && !isset($s['allow_noauth_cpanel'])) out(401, json_encode(['status' => 0, 'errors' => ['Auth required']]));
    [$mod, $fn] = [$m[1], $m[2]];
    $params = $method === 'POST' ? array_merge($_GET, (function () use ($body) { parse_str($body, $p); return $p; })()) : $_GET;
    $log(['panel' => 'cpanel', 'call' => "$mod/$fn", 'params' => $params]);

    if ($mod === 'Email' && $fn === 'disk_usage')
        out(200, json_encode(['apiversion' => 3, 'status' => 1, 'result' => ['username' => 'u111', 'total' => 0]]));
    if ($mod === 'Mysql') {
        switch ($fn) {
            case 'list_databases':
                out(200, json_encode(['status' => 1, 'result' => $s['cpanel_dbs'] ?? ['u111_existing']]));
            case 'create_database':
                $name = (string) ($params['name'] ?? '');
                if ($name === '' || !preg_match('/^[a-z0-9_]+$/i', $name))
                    out(200, json_encode(['status' => 0, 'errors' => ['Invalid database name'], 'result' => []]));
                $s['cpanel_dbs'][] = $name; $save();
                out(200, json_encode(['status' => 1, 'result' => ['created' => 1, 'dbname' => $name]]));
            case 'create_user':
                $name = (string) ($params['name'] ?? '');
                if (strlen((string) ($params['password'] ?? '')) < 2)
                    out(200, json_encode(['status' => 0, 'errors' => ['Password too short'], 'result' => []]));
                $s['cpanel_users'][] = $name; $save();
                out(200, json_encode(['status' => 1, 'result' => ['created' => 1]]));
            case 'add_privileges_to_database':
                $s['cpanel_grants'][] = ($params['database'] ?? '') . '=>' . ($params['user'] ?? '');
                $save();
                out(200, json_encode(['status' => 1, 'result' => ['grants' => ['ALL PRIVILEGES']]]));
            case 'delete_database':
                $s['cpanel_dbs'] = array_values(array_diff((array) ($s['cpanel_dbs'] ?? []), [(string) ($params['name'] ?? '')]));
                $save();
                out(200, json_encode(['status' => 1, 'result' => ['deleted' => 1]]));
        }
    }
    out(200, json_encode(['status' => 1, 'result' => []]));
}

/* ═══ DirectAdmin API2: /API/<CMD> ═══ */
if (preg_match('#^/API/([A-Z_]+)$#', $uri, $m)) {
    $cmd = $m[1];
    $params = $_GET;
    if ($method === 'POST') { parse_str($body, $p); $params = array_merge($params, $p); }
    $hasKey = (($params['login-key'] ?? '') === ($s['da_key'] ?? 'DAKEY')) || str_contains($auth, 'Basic ');
    if (!$hasKey) out(200, '<html><body>Login Error</body></html>', 'text/html'); // پاسخ واقعی DA هم HTML است
    $log(['panel' => 'directadmin', 'call' => $cmd, 'params' => array_diff_key($params, ['login-key' => 1, 'json' => 1])]);

    switch ($cmd) {
        case 'COMMAND_INFO':
            out(200, json_encode(['result' => 'success', 'text' => 'DirectAdmin fake 1.629']));
        case 'DB_USER_LIST':
            out(200, json_encode(['result' => 'success', 'data' => [['user' => 'demo', 'dbs' => array_map(fn($n) => ['name' => $n], (array) ($s['da_dbs'] ?? ['demo_old']))]]]));
        case 'DB_CREATE':
            $db = (string) ($params['db'] ?? ''); $u = (string) ($params['db_user'] ?? '');
            if ($db === '' || $u === '' || strlen((string) ($params['db_passwd'] ?? '')) < 2)
                out(200, json_encode(['result' => 'error', 'error' => 'Invalid database information.']));
            $s['da_dbs'][] = $db; $s['da_users'][$db] = $u; $save();
            out(200, json_encode(['result' => 'success', 'text' => "Successfully created database $db for $u."]));
        case 'DB_DELETE':
            $s['da_dbs'] = array_values(array_diff((array) ($s['da_dbs'] ?? []), [(string) ($params['selectdatabases'] ?? '')]));
            $save();
            out(200, json_encode(['result' => 'success', 'text' => 'success']));
        case 'DB_USER_ADD':
            out(200, json_encode(['result' => 'success', 'text' => 'success']));
        case 'DB_LINK':
            out(200, json_encode(['result' => 'success', 'text' => 'success']));
        default:
            out(200, json_encode(['result' => 'error', 'error' => 'Unknown command ' . $cmd]));
    }
}

/* ═══ Plesk XML webservice: POST /webservice-control.php ═══ */
if ($uri === '/webservice-control.php') {
    if (($s['plesk_apikey'] ?? 'PLESKKEY') !== (($_SERVER['HTTP_X_API_KEY'] ?? ''))
        && !isset($_SERVER['PHP_AUTH_USER'])) {
        out(401, '<packet><system_err>Access denied</system_err></packet>', 'application/xml');
    }
    $xml = preg_replace('/<!DOCTYPE[^>]*>/', '', $body) ?? '';
    $sx = @simplexml_load_string($xml);
    if (!$sx) out(400, '<packet><system_err>Malformed</system_err></packet>', 'application/xml');
    $log(['panel' => 'plesk', 'calls' => array_keys((array) $sx)]);

    $resp = '<packet><stat>ok</stat>';
    if (isset($sx->version)) {
        $resp = '<packet><version><get><ver>18.0.59-fake</ver><revision>fake</revision></get></version><stat>ok</stat>';
    } elseif (isset($sx->site)) {
        $resp .= '<site><get><sites-info><site-info><id>42</id><name>shop.test</name></site-info></sites-info></get></site>';
    } elseif (isset($sx->database)) {
        $db = $sx->database;
        if (isset($db->get)) {
            $names = $s['plesk_dbs'] ?? ['shop_existing'];
            $inner = '';
            foreach ($names as $n) $inner .= "<database-info><name>$n</name></database-info>";
            $resp .= "<database><get>$inner</get></database>";
        } elseif (isset($db->add) || isset($db->add_user) || isset($db->update) || isset($db->delete)) {
            $name = trim((string) ($db->add->values->name ?? $db->add_user->values->name ?? ''));
            if ($name !== '' && isset($db->add)) { $s['plesk_dbs'][] = $name; $save(); }
        }
    }
    $resp .= '</packet>';
    out(200, $resp, 'application/xml');
}

/* ═══ endpoint کمکی تست: تنظیم وضعیت پنل جعلی ═══ */
if ($uri === '/_setup') {
    parse_str($body, $p);
    foreach (['cpanel_token', 'da_key', 'plesk_apikey', 'allow_noauth_cpanel'] as $k) if (array_key_exists($k, $p)) $s[$k] = $p[$k];
    if (!empty($p['reset'])) $s = ['calls' => []];
    $save();
    out(200, json_encode(['ok' => 1]));
}
if ($uri === '/_state') out(200, json_encode($s, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

out(404, json_encode(['error' => 'no route ' . $uri]));
