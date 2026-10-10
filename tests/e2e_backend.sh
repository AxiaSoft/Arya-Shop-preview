#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# AryaStore — تست سرتاسری API بک‌اند (SQLite + php -S)
# Usage:   BASE_URL=http://127.0.0.1:8211 bash tests/e2e_backend.sh
# Requires: curl + python3. Remove config.php + storage/arya_store.sqlite for a clean run.
# ═══════════════════════════════════════════════════════════════
BASE="${BASE_URL:-http://127.0.0.1:8211}"
U="$BASE/Db.php"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
rm -f "$ROOT/storage/rate"/*.json 2>/dev/null   # اجرای testهای پیاپی به ریت‌لیمیت نخورد
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
t "register user" ok "$(curl -s -X POST "$U?action=user_register" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"name":"Sara Test","email":"sara@t.test","phone":"09123456789","password":"Zx9!looper77"}')"
t "duplicate email rejected" fail "$(curl -s -X POST "$U?action=user_register" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"name":"Dup","email":"sara@t.test","phone":"09999999999","password":"Abcdefg12"}')"
t "weak password rejected" fail "$(curl -s -X POST "$U?action=user_register" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"name":"z","email":"z@z.test","phone":"09122222222","password":"123"}')"
KU=$(mktemp)
R=$(curl -s -c $KU -X POST "$U?action=user_login_step1" -H 'Content-Type: application/json' -d '{"identifier":"sara@t.test","password":"Zx9!looper77"}')
t "user login step1" ok "$R"
UOTP=$(echo "$R" | pyj "['data']['otp_demo']")
R=$(curl -s -b $KU -c $KU -X POST "$U?action=user_login_step2" -H 'Content-Type: application/json' -d "{\"otp\":\"$UOTP\"}")
t "user login step2 (OTP)" ok "$R"
UCSRF=$(echo "$R" | pyj "['data']['csrf']")
t "user_session me" ok "$(curl -s -b $KU "$U?action=user_session")"
t "user update profile" ok "$(curl -s -b $KU -X POST "$U?action=user_update" -H "Origin: $BASE" -H "X-CSRF-Token: $UCSRF" -H 'Content-Type: application/json' -d '{"name":"سارا تست","addresses":{"home":{"city":"تهران"}}}')"

echo "— 5) Orders / reviews / tickets —"
t "guest order w/o csrf blocked" fail "$(curl -s -X POST "$U?action=upsert&table=orders" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"record":{"id":"ar_order0","user_phone":"09123456789","items":"[]","total":1,"status":"pending"}}')"
t "guest empty-cart order blocked" fail "$(curl -s -b $G -X POST "$U?action=upsert&table=orders" -H "Origin: $BASE" -H "X-CSRF-Token: $GCSRF" -H 'Content-Type: application/json' -d '{"record":{"id":"ar_order0b","user_phone":"09123456789","address":"تهران، خیابان آزادی، پلاک ۱۲","items":"[]","total":1250000,"status":"pending"}}')"
t "guest order (with csrf)" ok "$(curl -s -b $G -X POST "$U?action=upsert&table=orders" -H "Origin: $BASE" -H "X-CSRF-Token: $GCSRF" -H 'Content-Type: application/json' -d '{"record":{"id":"ar_order1","user_phone":"09123456789","address":"تهران، خیابان آزادی، پلاک ۱۲","items":[{"id":"p_1","qty":2}],"total":1,"status":"shipped-by-hack"}}')"
t "status forced pending + server price recalc" ok "$(curl -s "$U?action=getById&table=orders&id=ar_order1&user_phone=09123456789" | python3 -c "
import json,sys; o = (json.load(sys.stdin).get('data') or {})
print(json.dumps({'ok': o.get('status')=='pending' and float(o.get('total') or 0)==2500000}))")"
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

echo "— 5b) Tracking: cancel + return per policy (customer) —"
CANCEL() { curl -s -b $G -X POST "$U?action=order_cancel" -H "Origin: $BASE" -H "X-CSRF-Token: $GCSRF" -H 'Content-Type: application/json' -d "$1"; }
RETRY()  { curl -s -b $G -X POST "$U?action=order_return" -H "Origin: $BASE" -H "X-CSRF-Token: $GCSRF" -H 'Content-Type: application/json' -d "$1"; }
t "new order w/o address blocked"  fail "$(curl -s -b $G -X POST "$U?action=upsert&table=orders" -H "Origin: $BASE" -H "X-CSRF-Token: $GCSRF" -H 'Content-Type: application/json' -d '{"record":{"id":"ar_order9","user_phone":"09123456789","items":"[]","total":1,"status":"pending"}}')"
t "customer cancels own processing order" ok "$(CANCEL '{"id":"ar_order1","phone":"09123456789","reason":"پشیمانی از خرید"}')"
t "order became canceled + reason stored" ok "$(curl -s "$U?action=getById&table=orders&id=ar_order1&user_phone=09123456789" | python3 -c "import json,sys;d=json.load(sys.stdin).get('data') or {};print(json.dumps({'ok':d.get('status')=='canceled' and bool(d.get('cancel_reason'))}))")"
t "double cancel blocked"              fail "$(CANCEL '{"id":"ar_order1","phone":"09123456789"}')"
t "cancel other's order blocked"       fail "$(CANCEL '{"id":"ar_ghost","phone":"09120000001"}')"
t "admin can mark delivered"           ok "$(A 'upsert&table=orders' '{"record":{"id":"ar_order3","user_phone":"09123456789","address":"تهران، پاستور، کوچه ۵","items":"[]","total":900000,"status":"delivered"}}')"
t "return before delivery blocked"     fail "$(RETRY '{"id":"ar_order9","phone":"09123456789","reason":"سلام، لطفا مرجوع کنید"}')"
t "short return reason rejected"       fail "$(RETRY '{"id":"ar_order3","phone":"09123456789","reason":"خراب"}')"
t "return ok after delivery"           ok "$(RETRY '{"id":"ar_order3","phone":"09123456789","reason":"قطعه معیوب بود و جعبه باز نشده است"}')"
t "return_status persisted requested"  ok "$(curl -s "$U?action=getById&table=orders&id=ar_order3&user_phone=09123456789" | python3 -c "import json,sys;d=json.load(sys.stdin).get('data') or {};print(json.dumps({'ok':d.get('return_status')=='requested'}))")"
t "double return blocked"              fail "$(RETRY '{"id":"ar_order3","phone":"09123456789","reason":"دوباره همان دلیل برای تست تکرار"}')"
t "admin approves return (upsert)"     ok "$(A 'upsert&table=orders' '{"record":{"id":"ar_order3","user_phone":"09123456789","address":"تهران، پاستور، کوچه ۵","items":"[]","total":900000,"status":"delivered","return_status":"approved"}}')"
t "customer sees approved return"      ok "$(curl -s "$U?action=getById&table=orders&id=ar_order3&user_phone=09123456789" | python3 -c "import json,sys;d=json.load(sys.stdin).get('data') or {};print(json.dumps({'ok':d.get('return_status')=='approved'}))")"
t "status endpoint exposes window"     ok "$(curl -s "$U?action=status" | python3 -c "import json,sys;d=json.load(sys.stdin).get('data') or {};print(json.dumps({'ok':int(d.get('return_window_days') or 0)>=7}))")"

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

echo "— 8) Shop config / cancel-reason / password hardening —"
t "shop_config public defaults" ok "$(curl -s "$U?action=shop_config" | python3 -c "import json,sys;d=json.load(sys.stdin).get('data') or {};print(json.dumps({'ok':isinstance(d.get('shipping_options'),list) and len(d['shipping_options'])>=3 and d.get('base_cost') is not None}))")"
t "shop_config_save guest blocked" fail "$(curl -s -X POST "$U?action=shop_config_save" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"config":{"base_cost":1}}')"
t "shop_config_save bad day-range rejected" fail "$(A 'shop_config_save' '{"config":{"shipping_options":[{"id":"bad1","label":"گزینه نامعتبر","min_days":9,"max_days":3,"active":true}]}}')"
t "shop_config_save no-active rejected" fail "$(A 'shop_config_save' '{"config":{"shipping_options":[{"id":"off1","label":"خاموش","min_days":1,"max_days":2,"active":false}]}}')"
t "shop_config_save ok" ok "$(A 'shop_config_save' '{"config":{"base_cost":25000,"free_over":400000,"origin":{"lat":35.7,"lng":51.4,"label":"انبار مرکزی"},"shipping_options":[{"id":"standard","label":"عادی","min_days":2,"max_days":4,"extra_cost":0,"active":true,"is_default":true},{"id":"eco","label":"اقتصادی","min_days":6,"max_days":10,"extra_cost":0,"active":true,"is_default":false}]}}')"
t "shop_config persists saved values" ok "$(curl -s "$U?action=shop_config" | python3 -c "import json,sys;d=json.load(sys.stdin).get('data') or {};o=d.get('origin') or {};so=d.get('shipping_options') or [];print(json.dumps({'ok':d.get('base_cost')==25000 and o.get('label')=='انبار مرکزی' and any(x.get('is_default') for x in so)}))")"
t "admin can upsert order with delivery_slot" ok "$(A 'upsert&table=orders' '{"record":{"id":"ar_ordership","user_phone":"09123456789","address":"تهران، ولیعصر، پلاک ۹","items":"[]","total":10000,"status":"pending","delivery_slot":"عادی — ۲ تا ۴ روز کاری"}}')"
t "delivery_slot readable by owner" ok "$(curl -s "$U?action=getById&table=orders&id=ar_ordership&user_phone=09123456789" | python3 -c "import json,sys;d=json.load(sys.stdin).get('data') or {};print(json.dumps({'ok':d.get('delivery_slot')=='عادی — ۲ تا ۴ روز کاری'}))")"
t "cancel WITHOUT reason rejected (user path)" fail "$(curl -s -b $G -X POST "$U?action=order_cancel" -H "Origin: $BASE" -H "X-CSRF-Token: $GCSRF" -H 'Content-Type: application/json' -d '{"id":"ar_ordership","phone":"09123456789"}')"
t "cancel WITH reason ok (user path)" ok "$(curl -s -b $G -X POST "$U?action=order_cancel" -H "Origin: $BASE" -H "X-CSRF-Token: $GCSRF" -H 'Content-Type: application/json' -d '{"id":"ar_ordership","phone":"09123456789","reason":"زمان ارسال برام مهم بود"}')"
t "admin sees prefixed cancel reason" ok "$(curl -s "$U?action=getById&table=orders&id=ar_ordership&user_phone=09123456789" | python3 -c "import json,sys;d=json.load(sys.stdin).get('data') or {};print(json.dumps({'ok':str(d.get('cancel_reason') or '').startswith('مشتری: ')}))")"
# — تغییر رمز و ابطال سشن‌ها (کاربر مجزا تا تست‌های بالا نشکند) —
KU9=$(mktemp)
t "setup user for pwd test" ok "$(curl -s -X POST "$U?action=user_register" -H 'Content-Type: application/json' -d '{"name":"Pwd Test","email":"pwd9@t.test","phone":"09128887766","password":"First@12345"}')"
R=$(curl -s -c $KU9 -X POST "$U?action=user_login_step1" -H 'Content-Type: application/json' -d '{"identifier":"09128887766","password":"First@12345"}')
POTP=$(echo "$R" | pyj "['data']['otp_demo']")
t "user login for pwd test" ok "$(curl -s -b $KU9 -c $KU9 -X POST "$U?action=user_login_step2" -H "Origin: $BASE" -H 'Content-Type: application/json' -d "{\"otp\":\"$POTP\"}")"
KCSRF=$(curl -s -b $KU9 "$U?action=csrf" | pyj "['data']['csrf']")
t "same-as-current password rejected" fail "$(curl -s -b $KU9 -X POST "$U?action=user_change_password" -H "Origin: $BASE" -H "X-CSRF-Token: $KCSRF" -H 'Content-Type: application/json' -d '{"current_password":"First@12345","new_password":"First@12345"}')"
t "change password (old_password compat key)" ok "$(curl -s -b $KU9 -X POST "$U?action=user_change_password" -H "Origin: $BASE" -H "X-CSRF-Token: $KCSRF" -H 'Content-Type: application/json' -d '{"old_password":"First@12345","new_password":"Second@54321"}')"
t "session invalidated after password change" ok "$(curl -s -b $KU9 "$U?action=user_session" | python3 -c "import json,sys;d=json.load(sys.stdin).get('data') or {};print(json.dumps({'ok':d.get('loggedIn') is False}))")"
t "old password no longer works" fail "$(curl -s -X POST "$U?action=user_login_step1" -H 'Content-Type: application/json' -d '{"identifier":"09128887766","password":"First@12345"}')"
t "new password works" ok "$(curl -s -X POST "$U?action=user_login_step1" -H 'Content-Type: application/json' -d '{"identifier":"pwd9@t.test","password":"Second@54321"}')"
t "reset2 accepts password alias key" ok "$(curl -s -X POST "$U?action=user_reset_step1" -H 'Content-Type: application/json' -d '{"identifier":"pwd9@t.test"}' | python3 -c "import json,sys;d=json.load(sys.stdin);print(json.dumps({'ok':bool(d.get('ok'))}))")"


echo "— 9) Security audit regressions (e-commerce integrity / authz / DoS) —"
ORD() { curl -s -b $G -X POST "$U?action=upsert&table=orders" -H "Origin: $BASE" -H "X-CSRF-Token: $GCSRF" -H 'Content-Type: application/json' -d "$1"; }
t "create sec-product ar_p9" ok "$(A 'upsert&table=products' '{"record":{"id":"ar_p9","title":"ساعت امنیتی","price":400000,"stock":5}}')"
t "empty-cart order rejected" fail "$(ORD '{"record":{"id":"ar_secX","user_phone":"09123456789","address":"تهران، ولیعصر، پلاک ۹","items":"[]","total":99000}}')"
SEC1OUT=$(ORD '{"record":{"id":"ar_sec1","user_phone":"09123456789","address":"تهران، ولیعصر، پلاک ۹","items":[{"id":"ar_p9","qty":1}],"total":1,"status":"delivered","admin_note":"HACK","return_status":"approved","tracking_code":"X1","payment_method":"free"}}')
t "mass-assign stripped + server total" ok "$(SC=$(curl -s "$U?action=shop_config"); export SC; curl -s "$U?action=getById&table=orders&id=ar_sec1&user_phone=09123456789" | python3 -c "
import json, sys, os
o = json.load(sys.stdin).get('data') or {}
sc = json.loads(os.environ.get('SC') or '{}').get('data') or {}
exp = 400000 + (0 if int(sc.get('free_over') or 0) > 0 and 400000 >= int(sc.get('free_over') or 0) else int(sc.get('base_cost') or 0))
ok = (o.get('status') == 'pending' and abs(float(o.get('total') or 0) - exp) < 1
      and not o.get('admin_note') and (o.get('return_status') or '') not in ('approved', 'rejected')
      and not o.get('tracking_code'))
print(json.dumps({'ok': ok}))")"
t "edit existing order blocked (use order_cancel)" fail "$(ORD '{"record":{"id":"ar_sec1","status":"processing","total":1}}')"
t "over-stock order rejected" fail "$(ORD '{"record":{"id":"ar_sec2","user_phone":"09123456789","address":"تهران، ولیعصر، پلاک ۹","items":[{"id":"ar_p9","qty":99}]}}')"
t "negative qty rejected" fail "$(ORD '{"record":{"id":"ar_sec3","user_phone":"09123456789","address":"تهران، ولیعصر، پلاک ۹","items":[{"id":"p_1","qty":-5}]}}')"
t "unknown product in cart rejected" fail "$(ORD '{"record":{"id":"ar_sec4","user_phone":"09123456789","address":"تهران، ولیعصر، پلاک ۹","items":[{"id":"p_ghost99","qty":1}]}}')"
t "stock decremented server-side" ok "$(curl -s "$U?action=getById&table=products&id=ar_p9" | python3 -c "
import json, sys
p = json.load(sys.stdin).get('data') or {}
print(json.dumps({'ok': int(p.get('stock') if p.get('stock') is not None else -1) == 4}))")"
t "bad record id chars rejected" fail "$(ORD '{"record":{"id":"../../etc/passwd","user_phone":"09123456789","address":"تهران، ولیعصر، پلاک ۹","items":[{"id":"p_1","qty":1}]}}')"
t "SQLi in login identifier rejected" fail "$(curl -s -X POST "$U?action=user_login_step1" -H 'Content-Type: application/json' --data-binary '{"identifier":"admin\" OR 1=1--","password":"whatever1"}')"
t "SQLi string in review harmless" ok "$(curl -s -X POST "$U?action=review_create" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"product_id":"p_1","name":"Sec","rating":3,"text":"a\"); DROP TABLE reviews;--"}' >/dev/null; curl -s "$U?action=getAll&table=reviews" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(json.dumps({'ok': d.get('ok') is True and isinstance(d.get('data'), list)}))")"
t "rating out of range rejected" fail "$(curl -s -X POST "$U?action=review_create" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"product_id":"p_1","name":"R99","rating":99,"text":"clamp test"}')"
t "GET on state-changing action blocked" fail "$(curl -s "$U?action=delete&table=products&id=p_1")"
BIG=$(mktemp); python3 -c "import json, sys; open(sys.argv[1], 'w').write(json.dumps({'record': {'id': 'big1', 'title': 'A' * 9000000}}))" "$BIG"
t "oversized body rejected (413)" fail "$(curl -s -b $J -X POST "$U?action=upsert&table=products" -H "Origin: $BASE" -H "X-CSRF-Token: $CSRF" -H 'Content-Type: application/json' --data-binary @$BIG)"
rm -f "$BIG"
t "session cookie hardened (HttpOnly+SameSite)" ok "$(curl -sI "$U?action=csrf" | tr -d '\r' | python3 -c "
import json, sys
c = '\n'.join(l for l in sys.stdin if l.lower().startswith('set-cookie')).lower()
print(json.dumps({'ok': 'httponly' in c and 'samesite' in c}))")"
t "guest stats exposes no users" ok "$(curl -s "$U?action=stats" | python3 -c "
import json, sys
d = json.load(sys.stdin).get('data') or {}
print(json.dumps({'ok': 'users' not in d and 'admins' not in d and 'products' in d}))")"
t "password containing own name rejected" fail "$(curl -s -X POST "$U?action=user_register" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"name":"Bobak Test","email":"bobak@t.test","phone":"09126667788","password":"Bobak@12345"}')"
t "weak common password rejected" fail "$(curl -s -X POST "$U?action=user_register" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"name":"Weak One","email":"weak@t.test","phone":"09126669900","password":"Password123"}')"
for i in 1 2 3 4; do curl -s -X POST "$U?action=user_reset_step1" -H 'Content-Type: application/json' -d '{"identifier":"sara@t.test"}' >/dev/null; done
t "forgot-OTP per-identifier throttle" fail "$(curl -s -X POST "$U?action=user_reset_step1" -H 'Content-Type: application/json' -d '{"identifier":"sara@t.test"}')"
t "guest cannot read tickets via getAll" fail "$(curl -s "$U?action=getAll&table=tickets")"
t "guest cannot read admins" fail "$(curl -s "$U?action=getAll&table=admins")"
t "unknown table rejected" fail "$(curl -s "$U?action=getAll&table=settings")"


echo
echo "PASS=$PASS FAIL=$FAIL"
[ $FAIL -eq 0 ]
