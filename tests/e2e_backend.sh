#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# AryaStore — تست سرتاسری API بک‌اند (SQLite + php -S)
# Usage:   BASE_URL=http://127.0.0.1:8211 bash tests/e2e_backend.sh
# Requires: curl + python3. Remove config.php + storage/arya_store.sqlite for a clean run.
# ═══════════════════════════════════════════════════════════════
BASE="${BASE_URL:-http://127.0.0.1:8211}"
U="$BASE/Db.php"
J=$(mktemp)
PASS=0; FAIL=0
pyj() { python3 -c "import json,sys;d=json.load(sys.stdin);print(d$1)" 2>/dev/null; }
okof() { python3 -c "import json,sys
try: print('ok' if json.load(sys.stdin).get('ok') else 'fail')
except Exception: print('badjson')" 2>/dev/null; }
t() { # t <name> <expected ok|fail> <json>
  local name="$1" want="$2" body="$3" got
  got=$(echo "$body" | okof)
  if [ "$got" = "$want" ]; then PASS=$((PASS+1)); echo "  ✔ $name"
  else FAIL=$((FAIL+1)); echo "  ✘ $name (want=$want got=$got) → $(echo "$body" | head -c 200)"; fi
}

echo "— 0) Guest CSRF token —"
G=$(mktemp)
R=$(curl -s -c $G "$U?action=csrf" -H "Origin: $BASE")
GCSRF=$(echo "$R" | pyj "['data']['csrf']")

echo "— 1) Setup wizard (sqlite, demo_mode) —"
R=$(curl -s --max-time 40 -X POST "$U?action=setup" -H 'Content-Type: application/json' \
  -d '{"driver":"sqlite","demo_mode":true,"admin_email":"admin@arya.test","admin_pass":"Admin@12345"}')
t "setup creates DB" ok "$R"
t "setup twice blocked" fail "$(curl -s -X POST "$U?action=setup" -H 'Content-Type: application/json' -d '{"driver":"sqlite"}')"

echo "— 2) Admin login (3-step + OTP demo) —"
t "wrong password rejected" fail "$(curl -s -c $J -X POST "$U?action=admin_login_step1" -H 'Content-Type: application/json' -d '{"identifier":"admin@arya.test","password":"WRONGpass1"}')"
R=$(curl -s -c $J -X POST "$U?action=admin_login_step1" -H 'Content-Type: application/json' -d '{"identifier":"admin@arya.test","password":"Admin@12345"}')
t "step1 sends OTP" ok "$R"
OTP=$(echo "$R" | pyj "['data']['otp_demo']")
t "step2 rejects bad OTP" fail "$(curl -s -b $J -X POST "$U?action=admin_login_step2" -H 'Content-Type: application/json' -d '{"otp":"000000"}')"
R=$(curl -s -b $J -c $J -X POST "$U?action=admin_login_step2" -H 'Content-Type: application/json' -d "{\"otp\":\"$OTP\"}")
t "step2 issues session+csrf" ok "$R"
CSRF=$(echo "$R" | pyj "['data']['csrf']")

A()  { curl -s -b $J -X POST "$U?action=$1" -H "Origin: $BASE" -H "X-CSRF-Token: $CSRF" -H 'Content-Type: application/json' -d "$2"; }
AG() { curl -s -b $J "$U?action=$1"; }

echo "— 3) Catalog + policies —"
t "upsert product (admin)"     ok   "$(A 'upsert&table=products' '{"record":{"id":"p_1","title":"هدفون","price":1250000,"stock":40,"category":"audio"}}')"
t "upsert w/o CSRF → blocked"  fail "$(curl -s -b $J -X POST "$U?action=upsert&table=products" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"record":{"id":"p_x","title":"x"}}')"
t "upsert foreign Origin"      fail "$(curl -s -b $J -X POST "$U?action=upsert&table=products" -H "Origin: http://evil.test" -H "X-CSRF-Token: $CSRF" -H 'Content-Type: application/json' -d '{"record":{"id":"p_y","title":"y"}}')"
t "guest cannot write products" fail "$(curl -s -X POST "$U?action=upsert&table=products" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"record":{"id":"p_g","title":"g"}}')"
t "guest cannot read users"    fail "$(curl -s "$U?action=getAll&table=users")"
t "admin can read users"       ok   "$(AG 'getAll&table=users')"
t "upsert to users blocked"    fail "$(A 'upsert&table=users' '{"record":{"id":"u_hack","email":"h@h.h"}}')"
t "admin_create weak pw rejected" fail "$(A 'admin_create' '{"name":"x","email":"x@y.test","password":"abc"}')"
t "admin_create ok"            ok   "$(A 'admin_create' '{"name":"modir2","email":"second@arya.test","password":"Abcdefg12","phone":"09121110000"}')"
t "admin_list has 2 admins"    ok   "$(curl -s -b $J "$U?action=admin_list" | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(json.dumps({'ok': isinstance(d.get('data'), list) and len(d['data'])==2}))")"
t "admin_list hides password_hash" ok "$(curl -s -b $J "$U?action=admin_list" | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(json.dumps({'ok': all('password_hash' not in r for r in d.get('data',[]))}))")"

echo "— 4) User registration / login —"
t "register user" ok "$(curl -s -X POST "$U?action=user_register" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"name":"Sara Test","email":"sara@t.test","phone":"09123456789","password":"Sara@12345"}')"
t "duplicate email rejected" fail "$(curl -s -X POST "$U?action=user_register" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"name":"Dup","email":"sara@t.test","phone":"09999999999","password":"Abcdefg12"}')"
t "weak password rejected" fail "$(curl -s -X POST "$U?action=user_register" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"name":"z","email":"z@z.test","phone":"09122222222","password":"123"}')"
KU=$(mktemp)
R=$(curl -s -c $KU -X POST "$U?action=user_login_step1" -H 'Content-Type: application/json' -d '{"identifier":"sara@t.test","password":"Sara@12345"}')
t "user login step1" ok "$R"
UOTP=$(echo "$R" | pyj "['data']['otp_demo']")
R=$(curl -s -b $KU -c $KU -X POST "$U?action=user_login_step2" -H 'Content-Type: application/json' -d "{\"otp\":\"$UOTP\"}")
t "user login step2 (OTP)" ok "$R"
UCSRF=$(echo "$R" | pyj "['data']['csrf']")
t "user_session me" ok "$(curl -s -b $KU "$U?action=user_session")"
t "user update profile" ok "$(curl -s -b $KU -X POST "$U?action=user_update" -H "Origin: $BASE" -H "X-CSRF-Token: $UCSRF" -H 'Content-Type: application/json' -d '{"name":"سارا تست","addresses":{"home":{"city":"تهران"}}}')"

echo "— 5) Orders / reviews / tickets —"
t "guest order w/o csrf blocked" fail "$(curl -s -X POST "$U?action=upsert&table=orders" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"record":{"id":"ar_order0","user_phone":"09123456789","items":"[]","total":1,"status":"pending"}}')"
t "guest order (with csrf)" ok "$(curl -s -b $G -X POST "$U?action=upsert&table=orders" -H "Origin: $BASE" -H "X-CSRF-Token: $GCSRF" -H 'Content-Type: application/json' -d '{"record":{"id":"ar_order1","user_phone":"09123456789","items":"[]","total":500000,"status":"shipped-by-hack"}}')"
t "guest status forced to pending" ok "$(curl -s "$U?action=getById&table=orders&id=ar_order1&user_phone=09123456789" | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(json.dumps({'ok': d.get('data',{}).get('status')=='pending'}))")"
t "guest fetch own order" ok "$(curl -s "$U?action=getById&table=orders&id=ar_order1&user_phone=09123456789")"
t "guest fetch w/o phone blocked" fail "$(curl -s "$U?action=getById&table=orders&id=ar_order1")"
t "wrong-phone fetch cannot see" ok "$(curl -s "$U?action=getById&table=orders&id=ar_order1&user_phone=09120000001" | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(json.dumps({'ok': d.get('data') is None}))")"
t "admin update order status" ok "$(A 'upsert&table=orders' '{"record":{"id":"ar_order1","user_phone":"09123456789","items":"[]","total":500000,"status":"processing"}}')"
t "review create" ok "$(curl -s -X POST "$U?action=review_create" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"product_id":"p_1","name":"Sara","rating":5,"text":"Great"}')"
t "pending review hidden from public" ok "$(curl -s "$U?action=getAll&table=reviews" | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(json.dumps({'ok': all(r.get('status')!='pending' for r in d.get('data',[]))}))")"
RID=""  # filled below
R=$(curl -s -b $J "$U?action=getAll&table=reviews&status=pending")
RID=$(echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data'][0]['id'] if d.get('data') else '')")
RID=$(echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data'][0]['id'] if d.get('data') else '')")
t "admin sees pending review" ok "$(echo "$R" | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(json.dumps({'ok': bool(d.get('data'))}))")"
t "approve review" ok "$(A 'admin_review_moderate' "{\"id\":\"$RID\",\"status\":\"approved\"}")"
t "approved review public" ok "$(curl -s "$U?action=getAll&table=reviews" | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(json.dumps({'ok': any(r.get('id')=='$RID' for r in d.get('data',[]))}))")"
t "review vote like" ok "$(curl -s -X POST "$U?action=review_vote" -H "Origin: $BASE" -H 'Content-Type: application/json' -d "{\"id\":\"$RID\",\"kind\":\"like\"}")"
t "review vote injection blocked" fail "$(curl -s -X POST "$U?action=review_vote" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"id":"1; DROP TABLE users","kind":"like"}')"
t "ticket create" ok "$(curl -s -X POST "$U?action=ticket_create" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"name":"Sara","phone":"09123456789","email":"sara@t.test","subject":"Question","message":"Hi"}')"
R=$(curl -s -b $J "$U?action=getAll&table=tickets")
TID=$(echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data'][0]['id'] if d.get('data') else '')")
t "admin replies ticket" ok "$(A 'ticket_reply' "{\"id\":\"$TID\",\"reply\":\"AdminAnswer\"}")"
t "wrong phone cannot reply" fail "$(curl -s -X POST "$U?action=ticket_reply" -H "Origin: $BASE" -H 'Content-Type: application/json' -d "{\"id\":\"$TID\",\"reply\":\"spam\",\"user_phone\":\"09000000000\"}")"
t "right phone can reply (guest+csrf)" ok "$(curl -s -b $G -X POST "$U?action=ticket_reply" -H "Origin: $BASE" -H 'Content-Type: application/json' -d "{\"id\":\"$TID\",\"reply\":\"Thanks\",\"user_phone\":\"09123456789\"}")"
t "ticket visible to owner" ok "$(curl -s "$U?action=getById&table=tickets&id=$TID&user_phone=09123456789" | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(json.dumps({'ok': bool(d.get('data'))}))")"

echo "— 6) Import / stats / delete / locks —"
t "import small batch" ok "$(A 'import&table=categories' '{"records":[{"id":"cat_a","name":"Audio","ic":"🎧","active":1},{"id":"cat_b","name":"Mobile","ic":"📱","active":1}]}')"
python3 -c "import json; recs=[{'id':'cat_x%d'%i,'name':'n','ic':'x','active':1} for i in range(501)]; open('/tmp/big_import.json','w').write(json.dumps({'records':recs}))"
t "import over 500 rejected" fail "$(curl -s -b $J -X POST "$U?action=import&table=categories" -H "Origin: $BASE" -H "X-CSRF-Token: $CSRF" -H 'Content-Type: application/json' --data @/tmp/big_import.json)"
t "stats" ok "$(curl -s "$U?action=stats")"
t "delete product (admin)" ok "$(A 'delete&table=products' '{"id":"p_1"}')"
t "deleted product gone" ok "$(curl -s "$U?action=getById&table=products&id=p_1" | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(json.dumps({'ok': not d.get('data')}))")"
t "IDOR: guest user_delete blocked" fail "$(curl -s -X POST "$U?action=user_delete" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"id":"u_whatever"}')"
t "forgot: unknown email → uniform ok" ok "$(curl -s -X POST "$U?action=user_reset_step1" -H 'Content-Type: application/json' -d '{"identifier":"nobody@nope.test"}')"
t "panel actions locked after install" fail "$(curl -s -X POST "$U?action=panel_probe" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"kind":"cpanel","host":"x","user":"y","password":"z"}')"
t "csrf token endpoint (same-origin)" ok "$(curl -s "$U?action=csrf" -H "Origin: $BASE")"

echo "— 7) Rate limiting (login OTP throttle) —"
N=0
for i in $(seq 1 12); do
  curl -s -X POST "$U?action=admin_login_step1" -H 'Content-Type: application/json' -d '{"identifier":"throttle@target.test","password":"Any@12345"}' | grep -q "بیش از حد" && N=$((N+1))
done
t "throttle engaged" ok "{\"ok\": $( [ $N -gt 0 ] && echo true || echo false )}"

echo
echo "PASS=$PASS FAIL=$FAIL"
[ $FAIL -eq 0 ]
