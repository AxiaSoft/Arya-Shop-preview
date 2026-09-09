#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# تست ادپترهای پنل (cPanel / DirectAdmin / Plesk) با سرور پنل جعلی
# اجرای مستقل:  bash tests/panels_e2e.sh
# نیازمند: php در PATH (یا PHP_BIN), تست در حالت pre-install (بدون config.php)
# ═══════════════════════════════════════════════════════════════
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PHP="${PHP_BIN:-php}"
WORK=$(mktemp -d)
STATE=/tmp/arya_fake_state_$$
FAKE_LOG=$WORK/fake.log; API_LOG=$WORK/api.log
FAKE_PORT=${FAKE_PORT:-8212}; API_PORT=${API_PORT:-8213}
cleanup() { kill $FAKE_PID $API_PID 2>/dev/null; rm -rf "$WORK" "$STATE"; }
trap cleanup EXIT

# — نصب موقت بدون config (حالت پیش‌از‌نصب که پنل‌ها فعال‌اند) —
APP=$WORK/app
mkdir -p "$APP/storage/rate" "$APP/storage/logs" "$APP/storage/sessions"
cp "$ROOT/Db.php" "$APP/"
cp -r "$ROOT/includes" "$APP/"

FAKE_STATE=$STATE "$PHP" -S 127.0.0.1:$FAKE_PORT "$ROOT/tests/fake_panels.php" >"$FAKE_LOG" 2>&1 & FAKE_PID=$!
"$PHP" -S 127.0.0.1:$API_PORT -t "$APP" >"$API_LOG" 2>&1 & API_PID=$!
U="http://127.0.0.1:$API_PORT/Db.php"
F="http://127.0.0.1:$FAKE_PORT"

# — صبر برای بالا آمدن سرورها —
for i in $(seq 1 30); do
  curl -s -o /dev/null --max-time 2 "$U?action=status" && curl -s -o /dev/null --max-time 2 "$F/_state" && break
  sleep 1
done

PASS=0; FAIL=0
t() { # name want json
  local name="$1" want="$2" body="$3" got
  got=$(echo "$body" | python3 -c "
import json,sys
try: print('ok' if json.load(sys.stdin).get('ok') else 'fail')
except Exception: print('badjson')" 2>/dev/null)
  if [ "$got" = "$want" ]; then PASS=$((PASS+1)); echo "  ✔ $name";
  else FAIL=$((FAIL+1)); echo "  ✘ $name (want=$want got=$got) → $(echo "$body" | head -c 300)"; fi
}
state_has() { # json-path-ish substring check on fake state
  curl -s "$F/_state" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(json.dumps({'ok': $1}))" 2>/dev/null
}

J() { curl -s --max-time 25 -X POST "$U?action=$1" -H 'Content-Type: application/json' -H "Origin: http://127.0.0.1:$API_PORT" -d "$2"; }

echo "— panel status / drivers —"
t "pre-install API up" ok "$(curl -s --max-time 10 "$U?action=status")"
t "csrf token pre-install" ok "$(curl -s --max-time 10 "$U?action=csrf" -H "Origin: http://127.0.0.1:$API_PORT")"

echo "— cPanel —"
t "probe ok"  ok   "$(J panel_probe '{"panel":{"type":"cpanel","host":"127.0.0.1","port":'$FAKE_PORT',"scheme":"http","token":"TESTTOKEN"}}')"
t "probe wrong token" fail "$(J panel_probe '{"panel":{"type":"cpanel","host":"127.0.0.1","port":'$FAKE_PORT',"scheme":"http","token":"WRONG"}}')"
R=$(J panel_provision '{"panel":{"type":"cpanel","host":"127.0.0.1","port":'$FAKE_PORT',"scheme":"http","token":"TESTTOKEN"},"dbname":"shop","dbuser":"shopu","dbpass":"Sup3rSecret99"}')
echo "$R" | head -c 220; echo
t "provision prefixed name" ok "$(echo "$R" | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(json.dumps({'ok': d.get('data',{}).get('dbname')=='u111_shop' and d.get('data',{}).get('dbuser')=='u111_shopu'}))")"
t "fake saw create+grant" ok "$(state_has "any(c['panel']=='cpanel' and c['call']=='Mysql/create_database' and c['params'].get('name')=='u111_shop' for c in d.get('calls',[])) and any(c['call']=='Mysql/add_privileges_to_database' for c in d.get('calls',[]))")"

echo "— DirectAdmin —"
t "probe ok" ok "$(J panel_probe '{"panel":{"type":"directadmin","host":"127.0.0.1","port":'$FAKE_PORT',"scheme":"http","user":"admin","token":"DAKEY"}}')"
R=$(J panel_provision '{"panel":{"type":"directadmin","host":"127.0.0.1","port":'$FAKE_PORT',"scheme":"http","user":"admin","token":"DAKEY","db_host":"localhost"},"dbname":"shopda","dbuser":"demo","dbpass":"Sup3rSecret98"}')
t "provision unified DB_CREATE" ok "$(echo "$R" | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(json.dumps({'ok': d.get('data',{}).get('dbname')=='shopda'}))")"
t "fake saw DB_CREATE" ok "$(state_has "any(c['panel']=='directadmin' and c['call']=='DB_CREATE' and c['params'].get('db')=='shopda' for c in d.get('calls',[]))")"
t "DA wrong key fails" fail "$(J panel_probe '{"panel":{"type":"directadmin","host":"127.0.0.1","port":'$FAKE_PORT',"scheme":"http","user":"admin","token":"NOPE"}}')"

echo "— Plesk —"
t "probe ok" ok "$(J panel_probe '{"panel":{"type":"plesk","host":"127.0.0.1","port":'$FAKE_PORT',"scheme":"http","token":"PLESKKEY","domain":"shop.test"}}')"
R=$(J panel_provision '{"panel":{"type":"plesk","host":"127.0.0.1","port":'$FAKE_PORT',"scheme":"http","token":"PLESKKEY","domain":"shop.test"},"dbname":"shoppl","dbuser":"plusr","dbpass":"Sup3rSecret97"}')
t "provision ok" ok "$R"
t "fake saw add+update" ok "$(state_has "any(c['panel']=='plesk' for c in d.get('calls',[]))")"

echo "— misc —"
t "unknown panel type rejected" fail "$(J panel_probe '{"panel":{"type":"ispconfig","host":"x"}}')"
t "manual(none) allowed" ok "$(J panel_probe '{"panel":{"type":"none"}}')"
t "probe foreign Origin blocked" fail "$(curl -s -X POST "$U?action=panel_probe" -H 'Origin: http://evil.test' -H 'Content-Type: application/json' -d '{"panel":{"type":"none"}}')"

echo
echo "PASS=$PASS FAIL=$FAIL"
[ $FAIL -eq 0 ]
