<?php
/**
 * seed_demo.php — افزودن دسته‌بندی‌ها و محصولات واقعی (با تصویر و ویدیوی دمو)
 *
 * طریقه مصرف:
 *   ۱) اول ویزارد نصب سایت را کامل کنید (config.php ساخته شود) — یا config.php دستی
 *   ۲) php scripts/seed_demo.php
 *
 * اسکریپت idempotent است: اگر محصولی با همان id وجود داشته باشد، بروزرسانی می‌شود.
 */
if (PHP_SAPI !== 'cli') { exit("فقط از طریق CLI اجرا شود\n"); }

$root = dirname(__DIR__);
define('ARYA_GUARD', 1);

if (!is_file($root . '/config.php')) {
    exit("❌ config.php پیدا نشد. ابتدا ویزارد نصب را در index.html کامل کنید.\n");
}
require $root . '/config.php';
require $root . '/includes/security.php';
require $root . '/includes/db_engine.php';

function dbConfigForSeed(): array {
    return [
        'driver'      => defined('DB_DRIVER') ? DB_DRIVER : 'mysql',
        'host'        => defined('DB_HOST') ? DB_HOST : 'localhost',
        'port'        => defined('DB_PORT') ? DB_PORT : null,
        'name'        => defined('DB_NAME') ? DB_NAME : 'arya_store',
        'user'        => defined('DB_USER') ? DB_USER : 'root',
        'pass'        => defined('DB_PASS') ? DB_PASS : '',
        'charset'     => defined('DB_CHARSET') ? DB_CHARSET : 'utf8mb4',
        'sqlite_path' => (defined('DB_SQLITE_PATH') && DB_SQLITE_PATH) ? DB_SQLITE_PATH : (dirname(__DIR__) . '/storage/arya_store.sqlite'),
        'schema'      => defined('DB_SCHEMA') ? DB_SCHEMA : null,
    ];
}

$img = fn(string $f) => 'assets/images/products/' . $f;

$categories = [
    ['id' => 'cat_mobile',    'title' => 'موبایل و تبلت', 'icon' => '📱', 'active' => 1],
    ['id' => 'cat_audio',     'title' => 'صوتی و تصویری',  'icon' => '🎧', 'active' => 1],
    ['id' => 'cat_wearable',  'title' => 'پوشیدنی هوشمند',  'icon' => '⌚', 'active' => 1],
    ['id' => 'cat_gaming',    'title' => 'گیمینگ',          'icon' => '🎮', 'active' => 1],
    ['id' => 'cat_fashion',   'title' => 'مد و پوشاک',      'icon' => '👟', 'active' => 1],
];

$products = [
    [
        'id' => 'p_sonic_pro', 'title' => 'هدفون بی‌سیم آریا Sonic Pro',
        'category' => 'cat_audio', 'price' => 4850000, 'original_price' => 5990000,
        'stock' => 42, 'rating' => 4.7, 'sales' => 128, 'slug' => 'aria-sonic-pro-headphones',
        'description' => "هدفون over-ear بی‌سیم با نویز‌کنش فعال (ANC)، درایور ۴۰ میلی‌متری، ۳۸ ساعت پخش موسیقی، بلوتوث ۵.۳ با اتصال هم‌زمان دو دستگاه و میکروفن HD برای تماس‌های شفاف. بالشتک‌های فوم مموری با روکش پروتئینی برای استفاده طولانی راحت هستند.",
        'image' => $img('headphone-sonic-pro.jpg'),
        'images' => [$img('headphone-sonic-pro.jpg'), $img('headphone-sonic-pro-2.jpg')],
        'videos' => ['assets/media/videos/demo-headphone.mp4'],
        'article' => "<h3>طراحی و راحتی</h3><p> قاب تاشونده با بنده استیل مات، وزن ۲۵۴ گرم و کفی طبیکی که ساعت‌ها استفاده را بی‌خطر می‌کند.</p><h3>باتری و شارژ</h3><p> با ۱۰ دقیقه شارژ سریع USB-C، حدود ۵ ساعت موسیقی بگیرید؛ شارژ کامل ۹۰ دقیقه.</p>",
        'seo_title' => 'خرید هدفون بی‌سیم آریا Sonic Pro با ANC',
        'seo_description' => 'هدفون بی‌سیم Sonic Pro با نویزکنش فعال، ۳۸ ساعت پخش و کیفیت صدای Hi-Res — ارسال سریع آریا شاپ.',
    ],
    [
        'id' => 'p_watch_x3', 'title' => 'ساعت هوشمند آریا Watch X3',
        'category' => 'cat_wearable', 'price' => 3299000, 'original_price' => 3800000,
        'stock' => 65, 'rating' => 4.5, 'sales' => 93, 'slug' => 'aria-watch-x3',
        'description' => "نمایشگر AMOLED ۱.۹۶ اینچی با همیشه‌روشن، ۱۲۰+ حالت ورزشی، GPS دوباندی، پایش شبانه‌روزی ضربان و اکسیژن خون، مقاومت ۵ATM و باتری ۱۴ روزه. سازگار با اندروید ۸+ و iOS ۱۳+.",
        'image' => $img('smartwatch-x3.jpg'),
        'images' => [$img('smartwatch-x3.jpg'), $img('smartwatch-x3-2.jpg')],
        'videos' => ['assets/media/videos/demo-smartwatch.mp4'],
        'article' => "<h3>ورزش و سلامت</h3><p>خواب، استرس و بازیابی بدنی را با امتیازهای روزانه رصد کنید.</p><h3>شارژ و دوام</h3><p>شارژ بی‌سیم از ۰ تا ۱۰۰ در ۶۵ دقیقه؛ حالت کم‌مصرف تا ۲۱ روز.</p>",
        'seo_title' => 'خرید ساعت هوشمند آریا Watch X3 | GPS دو‌باند',
        'seo_description' => 'ساعت هوشمند Watch X3 با AMOLED، ۱۲۰ حالت ورزشی و باتری ۱۴ روزه — گارانتی ۱۸ ماهه آریا شاپ.',
    ],
    [
        'id' => 'p_kb_tkl', 'title' => 'کیبورد مکانیکی آریا TKL RGB',
        'category' => 'cat_gaming', 'price' => 2750000, 'original_price' => 3190000,
        'stock' => 30, 'rating' => 4.8, 'sales' => 57, 'slug' => 'aria-tkl-mechanical-keyboard',
        'description' => "کیبورد مکانیکی TKL (۸۷ کلید) با سوییچ‌های Red خطیHot-Swap، بدنه آلومینیومی، کیپ‌کاپ PBT دابل‌شات، نورپردازی RGB per-key، سه‌گانه اتصال (سیمی/۲.۴G/بلوتوث) و پوشش فوم داخلی برای صدای عمیق.",
        'image' => $img('mech-keyboard-tkl.jpg'),
        'images' => [$img('mech-keyboard-tkl.jpg')],
        'videos' => [],
        'article' => "<h3>Hot-Swap</h3><p>بدون هویه، سوییچ‌ها را عوض کنید و کیبورد را برای بازی یا تایپ تنظیم کنید.</p>",
        'seo_title' => 'کیبورد مکانیکی TKL آریا — سوییچ Red Hot-Swap',
        'seo_description' => 'کیبورد گیمینگ TKL با اتصال سه‌گانه و نورپردازی RGB — قیمت و خرید از آریا شاپ.',
    ],
    [
        'id' => 'p_phone_12', 'title' => 'گوشی موبایل آریا Phone 12 (۲۵۶ گیگ)',
        'category' => 'cat_mobile', 'price' => 28900000, 'original_price' => 31500000,
        'stock' => 18, 'rating' => 4.6, 'sales' => 214, 'slug' => 'aria-phone-12-256gb',
        'description' => "نمایشگر LTPO AMOLED ۶.۷ اینچ با نرخ نوسازی تطبیقی ۱۲۰ هرتز، تراشه ۴ نانومتری، دوربین اصلی ۵۰ مگاپیکسلی OIS + اولتراواید + تله ۳x، باتری ۵۰۰۰ میلی‌آمپر با شارژ سریع ۸۰ وای، بدنه ضدآب IP68.",
        'image' => $img('phone-aria-12.jpg'),
        'images' => [$img('phone-aria-12.jpg')],
        'videos' => [],
        'article' => "<h3>دوربین شب واقعی</h3><p>ترکیب ۴ پیکسلی و HDR ویدیویی، جزئیات را حتی در نور کم حفظ می‌کند.</p><h3>شارژ ۸۰ واتی</h3><p>در ۳۵ دقیقه کامل شارژ می‌شود؛ ۵ دقیقه شارژ معادل یک روز استفاده سبک.</p>",
        'seo_title' => 'خرید گوشی آریا Phone 12 حافظه ۲۵۶ گیگ',
        'seo_description' => 'آریا Phone 12 با AMOLED ۱۲۰Hz، دوربین ۵۰MP OIS و شارژ سریع ۸۰ وات — ارسال فوری.',
    ],
    [
        'id' => 'p_cam_m50', 'title' => 'دوربین هیبرید آریا Vision M50 + لنز ۲۵mm',
        'category' => 'cat_audio', 'price' => 41500000, 'original_price' => 0,
        'stock' => 7, 'rating' => 4.9, 'sales' => 36, 'slug' => 'aria-vision-m50-kit',
        'description' => "بدنه ۴۷۰ گرمی با سنسور APS-C ۲۶ مگاپیکسلی، ویدیوی ۴K/60 با ۱۰-bit 4:2:2، فوکوس خودکار تشخیص چشم، استابیلیزر ۵‌محوره بدنه، EVF ۳.۶۹ میلیون نقطه‌ای و لنز پرایم ۲۵mm f/1.8 داخل جعبه.",
        'image' => $img('hybrid-camera-m50.jpg'),
        'images' => [$img('hybrid-camera-m50.jpg')],
        'videos' => ['assets/media/videos/demo-camera.mp4'],
        'article' => "<h3>برای بلاگرها و فیلم‌سازان</h3><p>پروفایل F-Log داخلی با ۱۲ استاپ داینامیک رنج؛ خروجی مستقیم USB-C به‌عنوان وب‌کم ۴K.</p>",
        'seo_title' => 'دوربین بدون آینه آریا Vision M50 با لنز کیت',
        'seo_description' => 'دوربین هیبرید APS-C با 4K/60 10bit و لرزشگیر ۵‌محوره — خرید از آریا شاپ.',
    ],
    [
        'id' => 'p_shoes_flex', 'title' => 'کفش رانینگ آریا FlexRun',
        'category' => 'cat_fashion', 'price' => 1980000, 'original_price' => 2400000,
        'stock' => 88, 'rating' => 4.4, 'sales' => 176, 'slug' => 'aria-flexrun-shoes',
        'description' => "کفش دویدن با فوم فوق‌سبک EVA، رویه بافت تنفس‌پذیر، میانه TPU برای پایداری، اختلاف پاشنه ۸ میلی‌متر و زیره لاستیکی مقاوم در برابر لغزش. sizes ۳۷ تا ۴۵.",
        'image' => $img('running-shoes-flexrun.jpg'),
        'images' => [$img('running-shoes-flexrun.jpg')],
        'videos' => [],
        'article' => "<h3>مناسب تمرین روزانه</h3><p>وزن فقط ۲۴۰ گرم (سایز ۴۲) — برای پیاده‌روی سریع و پیست دویدن ایده‌آل است.</p>",
        'seo_title' => 'کفش رانینگ آریا FlexRun — فوق‌سبک',
        'seo_description' => 'کفش دویدن FlexRun با فوم EVA و توری تنفس‌پذیر، سایز ۳۷ تا ۴۵ — آریا شاپ.',
    ],
];

try {
    $eng = new AryaDbEngine(dbConfigForSeed());
    $eng->createSchema();
    $pdo = $eng->pdo();

    $counters = ['categories' => 0, 'products' => 0];
    foreach (['categories' => $categories, 'products' => $products] as $table => $rows) {
        $Q = fn(string $i) => AryaDbEngine::quoteIdent($eng->driver, $i);
        $cols = $eng->columnsOf($table);
        foreach ($rows as $row) {
            $toInsert = [];
            foreach ($cols as $col) {
                if (!array_key_exists($col, $row)) continue;
                $v = $row[$col];
                if (is_array($v)) $v = json_encode($v, JSON_UNESCAPED_UNICODE);
                $toInsert[$col] = $v;
            }
            $keys = array_keys($toInsert);
            $sql = $eng->upsertSql($table, $keys);
            $pdo->prepare($sql)->execute(array_values($toInsert));
            $counters[$table]++;
        }
    }
    echo "✅ سید انجام شد — دسته‌بندی: {$counters['categories']} | محصولات: {$counters['products']}\n";
    echo "   جدول محصولات در " . ($eng->driver === 'sqlite' ? 'فایل ' . (defined('DB_SQLITE_PATH') ? DB_SQLITE_PATH : 'storage/arya_store.sqlite') : 'پایگاه داده ' . (defined('DB_NAME') ? DB_NAME : '')) . " ذخیره شد.\n";
} catch (Throwable $e) {
    fwrite(STDERR, "❌ خطا: " . $e->getMessage() . "\n");
    exit(1);
}
