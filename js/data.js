/* EVHub demo data — real photos from Wikimedia Commons (freely licensed, attributed) */
window.DB = (() => {

const CITIES = [
  {id:"riyadh",  ar:"الرياض",  en:"Riyadh",  lat:24.7136, lng:46.6753, chargers:34, service:9},
  {id:"jeddah",  ar:"جدة",     en:"Jeddah",  lat:21.4858, lng:39.1925, chargers:22, service:6},
  {id:"makkah",  ar:"مكة المكرمة", en:"Makkah", lat:21.3891, lng:39.8579, chargers:9, service:3},
  {id:"madinah", ar:"المدينة المنورة", en:"Madinah", lat:24.5247, lng:39.5692, chargers:7, service:2},
  {id:"dammam",  ar:"الدمام",  en:"Dammam",  lat:26.4207, lng:50.0888, chargers:14, service:5},
  {id:"khobar",  ar:"الخبر",   en:"Khobar",  lat:26.2172, lng:50.1971, chargers:11, service:4},
  {id:"taif",    ar:"الطائف",  en:"Taif",    lat:21.2703, lng:40.4158, chargers:5,  service:2},
  {id:"buraydah",ar:"بريدة",   en:"Buraydah",lat:26.3260, lng:43.9750, chargers:4,  service:1},
  {id:"abha",    ar:"أبها",    en:"Abha",    lat:18.2465, lng:42.5117, chargers:3,  service:1},
  {id:"tabuk",   ar:"تبوك",    en:"Tabuk",   lat:28.3838, lng:36.5550, chargers:3,  service:1},
  {id:"jubail",  ar:"الجبيل",  en:"Jubail",  lat:27.0046, lng:49.6225, chargers:5,  service:1},
  {id:"hofuf",   ar:"الهفوف",  en:"Hofuf",   lat:25.3648, lng:49.5747, chargers:3,  service:1},
  {id:"yanbu",   ar:"ينبع",    en:"Yanbu",   lat:24.0895, lng:38.0618, chargers:2,  service:1},
  {id:"jizan",   ar:"جازان",   en:"Jizan",   lat:16.8892, lng:42.5511, chargers:2,  service:1},
];

const BRANDS = [
  {id:"Tesla",    logo:"https://upload.wikimedia.org/wikipedia/commons/6/62/Tesla_Motors_Logo.svg"},
  {id:"BYD",      logo:"https://upload.wikimedia.org/wikipedia/commons/e/e2/BYD_Auto_2022_logo.svg"},
  {id:"Lucid",    logo:"https://upload.wikimedia.org/wikipedia/commons/e/ec/Lucid_Motors_logo.svg"},
  {id:"ZEEKR",    logo:"https://upload.wikimedia.org/wikipedia/commons/1/1e/Zeekr_logo.svg"},
  {id:"Hyundai",  logo:"https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg"},
  {id:"Kia",      logo:"https://upload.wikimedia.org/wikipedia/commons/b/b6/KIA_logo3.svg"},
  {id:"BMW",      logo:"https://upload.wikimedia.org/wikipedia/commons/f/f4/BMW_logo_%28gray%29.svg"},
  {id:"Mercedes", logo:"https://upload.wikimedia.org/wikipedia/commons/9/9e/Mercedes-Benz_Logo_2010.svg"},
];

const IMG = {
  lucid:   {src:"https://upload.wikimedia.org/wikipedia/commons/4/44/Lucid_Air_Saudi_Arabia_Front_1.jpg", credit:"Wikimedia Commons · CC0", page:"https://commons.wikimedia.org/wiki/File:Lucid_Air_Saudi_Arabia_Front_1.jpg"},
  tesla:   {src:"https://upload.wikimedia.org/wikipedia/commons/c/ca/2025_Tesla_Model_Y_RWD_front.jpg", credit:"CC BY-SA 4.0 · LuvsMG481", page:"https://commons.wikimedia.org/wiki/File:2025_Tesla_Model_Y_RWD_front.jpg"},
  byd:     {src:"https://upload.wikimedia.org/wikipedia/commons/0/0c/BYD_Sealion_7_Performance_%E2%80%93_f_09012026.jpg", credit:"CC BY-SA 3.0 DE · © M 93", page:"https://commons.wikimedia.org/wiki/File:BYD_Sealion_7_Performance_%E2%80%93_f_09012026.jpg"},
  zeekr:   {src:"https://upload.wikimedia.org/wikipedia/commons/c/cf/Zeekr_001_front.jpg", credit:"CC BY-SA 4.0 · JustAnotherCarDesigner", page:"https://commons.wikimedia.org/wiki/File:Zeekr_001_front.jpg"},
  hyundai: {src:"https://upload.wikimedia.org/wikipedia/commons/f/fa/Hyundai_Ioniq_5_IAA_2021_1X7A0193.jpg", credit:"CC BY-SA 4.0 · Alexander Migl", page:"https://commons.wikimedia.org/wiki/File:Hyundai_Ioniq_5_IAA_2021_1X7A0193.jpg"},
  kia:     {src:"https://upload.wikimedia.org/wikipedia/commons/8/8e/Kia_EV6_004.jpg", credit:"CC BY-SA 4.0 · Ethan Llamas", page:"https://commons.wikimedia.org/wiki/File:Kia_EV6_004.jpg"},
  bmw:     {src:"https://upload.wikimedia.org/wikipedia/commons/9/9d/BMW_iX_1X7A0304.jpg", credit:"CC BY-SA 4.0 · Alexander Migl", page:"https://commons.wikimedia.org/wiki/File:BMW_iX_1X7A0304.jpg"},
  mercedes:{src:"https://upload.wikimedia.org/wikipedia/commons/b/be/2023_Mercedes-Benz_EQE_350%2B_AMG-Line_in_Graphite_Grey_Metallic%2C_front_right.jpg", credit:"CC BY-SA 4.0", page:"https://commons.wikimedia.org/wiki/File:2023_Mercedes-Benz_EQE_350%2B_AMG-Line_in_Graphite_Grey_Metallic,_front_right.jpg"},
  moto:    {src:"https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80", credit:"Unsplash", page:"https://unsplash.com"},
  bike:    {src:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Beryl%20Electric%20Bike.jpg?width=1200", credit:"CC BY 2.0 · bfishadow", page:"https://commons.wikimedia.org/wiki/File:Beryl_Electric_Bike.jpg"},
  scooter: {src:"https://s7ap1.scene7.com/is/image/ninebotstage/ap_en_segway_com_static_images_MAXG2_screen-1-logo?dpr=on%2C3&fmt=png-alpha&network=on", credit:"Segway", page:"https://www.segway.com"},
  wallbox: {src:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Portable%20EV%20Charger%20Wallbox%20Unit%20with%20Red%20CEE%20Plug%20White%20Background%20EV%20WALL%20BOX%20EVWALLBOX.png?width=1200", credit:"CC BY 2.5 · go-e", page:"https://commons.wikimedia.org/wiki/File:Portable_EV_Charger_Wallbox_Unit_with_Red_CEE_Plug_White_Background_EV_WALL_BOX_EVWALLBOX.png"},
  eactros: {src:"https://commons.wikimedia.org/wiki/Special:FilePath/EActros%20300%2C%20Nufam%202023%2C%20Rheinstetten%20(P1130644).jpg?width=1200", credit:"Wikimedia Commons · Alexander Migl", page:"https://commons.wikimedia.org/wiki/File:EActros_300,_Nufam_2023,_Rheinstetten_(P1130644).jpg"},
  volvofe: {src:"https://commons.wikimedia.org/wiki/Special:FilePath/Volvo%20Trucks%20FE%20Electric.jpg?width=1200", credit:"Wikimedia Commons · Volvo Trucks", page:"https://commons.wikimedia.org/wiki/File:Volvo_Trucks_FE_Electric.jpg"},
  semi:    {src:"https://commons.wikimedia.org/wiki/Special:FilePath/The%20Tesla%20Semi%20Truck%20(40705940423).jpg?width=1200", credit:"Wikimedia Commons · Steve Jurvetson", page:"https://commons.wikimedia.org/wiki/File:The_Tesla_Semi_Truck_(40705940423).jpg"},
  cable:   {src:"https://commons.wikimedia.org/wiki/Special:Redirect/file/EV%20Type2%20Charging%20Cable.jpg?width=1200", credit:"Wikimedia Commons", page:"https://commons.wikimedia.org/wiki/File:EV_Type2_Charging_Cable.jpg"},
};

/* mono: fallback monogram colors when a photo fails to load */
const VEHICLES = [
 {id:"lucid-air", cat:"car", brand:"Lucid", model:"Air Pure", year:2025, price:299000, cond:"new",
  city:"riyadh", odo:0, batt:88, soh:100, range:660, rangeStd:"EPA", dc:250, ac:19.2, connAC:"Type 2", connDC:"CCS2",
  t1080:31, drive:"RWD", seats:5, v2l:false, verified:true, inspected:false, featured:true, img:IMG.lucid,
  mono:["#d8c690","#5e5030"],
  warranty:{ar:"8 سنوات / 160 ألف كم — صناعة سعودية (KAEC)",en:"8 yrs / 160,000 km — Made in KSA (KAEC)"},
  source:{ar:"وكيل لوسيد السعودية",en:"Lucid Saudi Arabia"}, sellerId:"d1"},

 {id:"tesla-my", cat:"car", brand:"Tesla", model:"Model Y Long Range", year:2025, price:219990, cond:"new",
  city:"riyadh", odo:0, batt:78, soh:100, range:586, rangeStd:"WLTP", dc:250, ac:11, connAC:"Type 2", connDC:"CCS2",
  t1080:27, drive:"AWD", seats:5, v2l:false, verified:true, inspected:false, featured:true, img:IMG.tesla,
  mono:["#c8ccd4","#5a6270"],
  warranty:{ar:"بطارية 8 سنوات / 192 ألف كم",en:"Battery 8 yrs / 192,000 km"},
  source:{ar:"وكالة سعودية",en:"Saudi official import"}, sellerId:"d2"},

 {id:"byd-sealion7", cat:"car", brand:"BYD", model:"Sealion 7 Performance", year:2026, price:194900, cond:"new",
  city:"jeddah", odo:0, batt:91.3, soh:100, range:502, rangeStd:"WLTP", dc:230, ac:11, connAC:"Type 2", connDC:"CCS2",
  t1080:24, drive:"AWD", seats:5, v2l:true, verified:true, inspected:false, featured:true, img:IMG.byd,
  mono:["#7fb4d8","#274a63"],
  warranty:{ar:"بطارية Blade — 8 سنوات / 200 ألف كم",en:"Blade battery — 8 yrs / 200,000 km"},
  source:{ar:"الموزع الرسمي",en:"Official distributor"}, sellerId:"d2"},

 {id:"zeekr-001", cat:"car", brand:"ZEEKR", model:"001 Long Range", year:2024, price:189000, cond:"used",
  city:"riyadh", odo:21400, batt:100, soh:96, range:620, rangeStd:"CLTC", dc:200, ac:11, connAC:"Type 2", connDC:"CCS2",
  t1080:28, drive:"AWD", seats:5, v2l:true, verified:true, inspected:true, featured:true, img:IMG.zeekr,
  mono:["#8fd0c8","#1f4f49"],
  warranty:{ar:"بطارية 8 سنوات غير محدودة الممشى",en:"Battery 8 yrs, unlimited km"},
  source:{ar:"وكالة سعودية",en:"Saudi official import"}, sellerId:"s3"},

 {id:"ioniq5", cat:"car", brand:"Hyundai", model:"Ioniq 5 Ultimate", year:2023, price:139000, cond:"used",
  city:"khobar", odo:28400, batt:77.4, soh:93, range:507, rangeStd:"WLTP", dc:233, ac:11, connAC:"Type 2", connDC:"CCS2",
  t1080:18, drive:"AWD", seats:5, v2l:true, verified:true, inspected:true, featured:false, img:IMG.hyundai,
  mono:["#b9c3cf","#4a5560"],
  warranty:{ar:"بطارية 8 سنوات / 160 ألف كم",en:"Battery 8 yrs / 160,000 km"},
  source:{ar:"وكالة سعودية",en:"Saudi official import"}, sellerId:"s5"},

 {id:"kia-ev6", cat:"car", brand:"Kia", model:"EV6 GT-Line", year:2023, price:132500, cond:"used",
  city:"dammam", odo:36200, batt:77.4, soh:92, range:528, rangeStd:"WLTP", dc:233, ac:11, connAC:"Type 2", connDC:"CCS2",
  t1080:18, drive:"AWD", seats:5, v2l:true, verified:true, inspected:true, featured:false, img:IMG.kia,
  mono:["#d8b790","#63482a"],
  warranty:{ar:"بطارية 7 سنوات / 150 ألف كم",en:"Battery 7 yrs / 150,000 km"},
  source:{ar:"وكالة سعودية",en:"Saudi official import"}, sellerId:"s4"},

 {id:"bmw-ix", cat:"car", brand:"BMW", model:"iX xDrive40", year:2023, price:245000, cond:"used",
  city:"jeddah", odo:19800, batt:76.6, soh:94, range:425, rangeStd:"WLTP", dc:150, ac:11, connAC:"Type 2", connDC:"CCS2",
  t1080:31, drive:"AWD", seats:5, v2l:false, verified:true, inspected:true, featured:true, img:IMG.bmw,
  mono:["#9fb4c8","#33465a"],
  warranty:{ar:"بطارية 8 سنوات / 160 ألف كم",en:"Battery 8 yrs / 160,000 km"},
  source:{ar:"وكالة سعودية",en:"Saudi official import"}, sellerId:"d3"},

 {id:"merc-eqe", cat:"car", brand:"Mercedes", model:"EQE 350+", year:2023, price:255000, cond:"used",
  city:"riyadh", odo:24600, batt:90.6, soh:93, range:639, rangeStd:"WLTP", dc:170, ac:11, connAC:"Type 2", connDC:"CCS2",
  t1080:32, drive:"RWD", seats:5, v2l:false, verified:true, inspected:true, featured:false, img:IMG.mercedes,
  mono:["#b8bcc2","#4c5158"],
  warranty:{ar:"بطارية 8 سنوات / 160 ألف كم",en:"Battery 8 yrs / 160,000 km"},
  source:{ar:"وكالة سعودية",en:"Saudi official import"}, sellerId:"d3"},

 {id:"eactros-300", cat:"truck", brand:"Mercedes", model:"eActros 300", year:2025, price:585000, cond:"new",
  city:"riyadh", odo:0, batt:336, soh:100, range:330, rangeStd:"WLTP", dc:160, ac:22, connAC:"Type 2", connDC:"CCS2",
  t1080:75, drive:"6x2", seats:2, v2l:false, verified:true, inspected:false, featured:false, img:IMG.eactros,
  mono:["#c6ccd2","#3f4a52"],
  warranty:{ar:"بطارية 6 سنوات / 600 ألف كم",en:"Battery 6 yrs / 600,000 km"},
  source:{ar:"وكالة سعودية — قطاع الأساطيل",en:"Saudi fleet-sector import"}, sellerId:"d3"},

 {id:"volvo-fe-e", cat:"truck", brand:"Volvo", model:"FE Electric", year:2023, price:365000, cond:"used",
  city:"dammam", odo:48000, batt:265, soh:91, range:275, rangeStd:"City", dc:150, ac:22, connAC:"Type 2", connDC:"CCS2",
  t1080:90, drive:"6x2", seats:2, v2l:false, verified:true, inspected:true, featured:false, img:IMG.volvofe,
  mono:["#9fb8ce","#2b4356"],
  warranty:{ar:"بطارية سنتان متبقيتان",en:"2 yrs battery warranty left"},
  source:{ar:"أسطول توزيع محلي",en:"Local distribution fleet"}, sellerId:"d3"},

 {id:"tesla-semi", cat:"truck", brand:"Tesla", model:"Semi 500", year:2026, price:890000, cond:"new",
  city:"jeddah", odo:0, batt:850, soh:100, range:800, rangeStd:"EPA", dc:750, ac:22, connAC:"Type 2", connDC:"MCS",
  t1080:45, drive:"6x4", seats:2, v2l:false, verified:true, inspected:false, featured:false, img:IMG.semi,
  mono:["#b8bec6","#3c434c"],
  warranty:{ar:"بطارية 8 سنوات / مليون كم",en:"Battery 8 yrs / 1M km"},
  source:{ar:"طلب مسبق — استيراد مباشر",en:"Pre-order — direct import"}, sellerId:"d2"},

 {id:"livewire", cat:"motorcycle", brand:"LiveWire", model:"One", year:2024, price:62000, cond:"used",
  city:"riyadh", odo:4200, batt:15.4, soh:97, range:235, rangeStd:"City", dc:25, ac:1.4, connAC:"Type 2", connDC:"CCS2",
  t1080:45, drive:"RWD", seats:1, v2l:false, verified:true, inspected:true, featured:false, img:IMG.moto,
  mono:["#e0a060","#5c3a14"],
  warranty:{ar:"بطارية 5 سنوات غير محدودة",en:"Battery 5 yrs unlimited"},
  source:{ar:"استيراد شخصي (أمريكا)",en:"Personal import (US)"}, sellerId:"s1"},

 {id:"ninebot-g2", cat:"scooter", brand:"Segway", model:"Ninebot Max G2", year:2024, price:3350, cond:"new",
  city:"riyadh", odo:0, batt:0.55, soh:100, range:70, rangeStd:"—", dc:0, ac:0.4, connAC:"Home plug", connDC:"—",
  t1080:0, drive:"RWD", seats:1, v2l:false, verified:true, inspected:false, featured:false, img:IMG.scooter,
  mono:["#a8b2ba","#3c454c"],
  warranty:{ar:"سنة",en:"1 year"}, source:{ar:"موزع معتمد",en:"Authorized dealer"}, sellerId:"d2"},

 {id:"beryl-bike", cat:"bike", brand:"Urban", model:{ar:"دراجة كهربائية حضرية",en:"City e-bike"}, year:2024, price:6900, cond:"new",
  city:"jeddah", odo:0, batt:0.4, soh:100, range:80, rangeStd:"—", dc:0, ac:0.25, connAC:"Home plug", connDC:"—",
  t1080:0, drive:"Mid", seats:1, v2l:false, verified:true, inspected:false, featured:false, img:IMG.bike,
  mono:["#9fd0a8","#2c5a34"],
  warranty:{ar:"سنتان",en:"2 years"}, source:{ar:"موزع معتمد",en:"Authorized dealer"}, sellerId:"d2"},
];

const PRODUCTS = [
 {id:"wb-pulsar7", cat:"charger", name:{ar:"شاحن جداري 7.4 كيلوواط",en:"Wallbox charger — 7.4 kW"},
  price:2450, power:7.4, compat:["Type 2"], img:IMG.wallbox, tag:{ar:"الأنسب للشقق والفلل الصغيرة",en:"Best for apartments & small villas"}},
 {id:"wb-pulsar11", cat:"charger", name:{ar:"شاحن جداري 11 كيلوواط",en:"Wallbox charger — 11 kW"},
  price:3150, power:11, compat:["Type 2"], img:IMG.wallbox, tag:{ar:"التوازن الأمثل سعرًا وسرعة",en:"The sweet spot of price & speed"}},
 {id:"autel-22", cat:"charger", name:{ar:"شاحن جداري 22 كيلوواط",en:"Wallbox charger — 22 kW"},
  price:4600, power:22, compat:["Type 2"], img:IMG.wallbox, tag:{ar:"لسيارات الشحن السريع AC",en:"For 22 kW AC-capable cars"}},
 {id:"cable-t2", cat:"charger", name:{ar:"كابل شحن Type 2 — 5 أمتار",en:"Type 2 charging cable — 5 m"},
  price:520, power:22, compat:["Type 2"], img:IMG.cable, tag:{ar:"ضروري للمحطات العامة AC",en:"Essential for public AC stations"}},
 {id:"gbt-adapter", cat:"charger", name:{ar:"محوّل GB/T إلى Type 2",en:"GB/T to Type 2 adapter"},
  price:890, power:7, compat:["GB/T"], img:null, tag:{ar:"لسيارات الاستيراد الصيني",en:"For Chinese-import vehicles"}},
 {id:"v2l-adapter", cat:"charger", name:{ar:"وصلة V2L لتشغيل الأجهزة",en:"V2L discharge adapter"},
  price:640, power:3.6, compat:["Type 2"], img:null, tag:{ar:"شغّل أجهزتك من بطارية سيارتك",en:"Power devices from your car"}},
 {id:"sunshade", cat:"parts", name:{ar:"عازل حراري متكامل للمقصورة والبطارية",en:"Full thermal shield kit"},
  price:780, power:0, compat:["Type 2","GB/T","Home plug"], img:null, tag:{ar:"صُمم لصيف المملكة",en:"Built for Saudi summers"}},
 {id:"tire-ev", cat:"parts", name:{ar:"إطارات EV هادئة 19 بوصة (طقم)",en:"19\" EV-rated quiet tyres (set)"},
  price:2900, power:0, compat:["Type 2","GB/T"], img:null, tag:{ar:"مقاومة تدحرج منخفضة لمدى أطول",en:"Low rolling resistance, more range"}},
];

const STATIONS = [
 {id:"st1", city:"riyadh", name:{ar:"إيفيك — طريق الملك فهد",en:"EVIQ — King Fahd Rd"}, op:"EVIQ",
  lat:24.7423, lng:46.6551, power:180, conns:["CCS2"], tariff:1.20, tariffEst:false, hours:"24/7", status:"ok",
  amen:{ar:"مقهى · دورات مياه · مصلى",en:"Café · Restrooms · Prayer room"}, verified:"2026-06-28"},
 {id:"st2", city:"riyadh", name:{ar:"إلكترومين — العليا",en:"Electromin — Olaya"}, op:"Electromin",
  lat:24.6941, lng:46.6858, power:120, conns:["CCS2","Type 2"], tariff:1.10, tariffEst:false, hours:"24/7", status:"busy",
  amen:{ar:"مطاعم · سوبرماركت",en:"Restaurants · Supermarket"}, verified:"2026-07-02"},
 {id:"st3", city:"riyadh", name:{ar:"إيفيك — النخيل مول",en:"EVIQ — Nakheel Mall"}, op:"EVIQ",
  lat:24.7614, lng:46.6293, power:60, conns:["CCS2","Type 2"], tariff:0.95, tariffEst:true, hours:"09:00–00:00", status:"ok",
  amen:{ar:"مول · مواقف مظللة",en:"Mall · Shaded parking"}, verified:"2026-06-15"},
 {id:"st4", city:"riyadh", name:{ar:"محطة الدائري الشرقي",en:"Eastern Ring Rd Station"}, op:"Petromin",
  lat:24.7803, lng:46.7712, power:350, conns:["CCS2"], tariff:1.35, tariffEst:false, hours:"24/7", status:"ok",
  amen:{ar:"محطة وقود · متجر",en:"Fuel station · Store"}, verified:"2026-07-05"},
 {id:"st5", city:"jeddah", name:{ar:"إيفيك — كورنيش جدة",en:"EVIQ — Jeddah Corniche"}, op:"EVIQ",
  lat:21.5433, lng:39.1568, power:150, conns:["CCS2"], tariff:1.20, tariffEst:false, hours:"24/7", status:"ok",
  amen:{ar:"كورنيش · مقاهي",en:"Corniche · Cafés"}, verified:"2026-06-30"},
 {id:"st6", city:"jeddah", name:{ar:"ردسي مول — مواقف A",en:"Red Sea Mall — Parking A"}, op:"Electromin",
  lat:21.6231, lng:39.1301, power:60, conns:["Type 2","CCS2"], tariff:0.90, tariffEst:true, hours:"10:00–00:00", status:"busy",
  amen:{ar:"مول · سينما",en:"Mall · Cinema"}, verified:"2026-05-22"},
 {id:"st7", city:"makkah", name:{ar:"محطة طريق الهجرة",en:"Hijrah Rd Station"}, op:"EVIQ",
  lat:21.4266, lng:39.8256, power:120, conns:["CCS2"], tariff:1.25, tariffEst:false, hours:"24/7", status:"ok",
  amen:{ar:"استراحة · مصلى",en:"Rest area · Prayer room"}, verified:"2026-06-20"},
 {id:"st8", city:"taif", name:{ar:"محطة الهدا",en:"Al Hada Station"}, op:"Electromin",
  lat:21.3623, lng:40.2841, power:60, conns:["CCS2","Type 2"], tariff:1.05, tariffEst:true, hours:"06:00–23:00", status:"ok",
  amen:{ar:"مطل جبلي · مقهى",en:"Mountain view · Café"}, verified:"2026-04-18"},
 {id:"st9", city:"dammam", name:{ar:"إيفيك — الشاطئ الغربي",en:"EVIQ — West Beach"}, op:"EVIQ",
  lat:26.4515, lng:50.1042, power:180, conns:["CCS2"], tariff:1.20, tariffEst:false, hours:"24/7", status:"off",
  amen:{ar:"كورنيش · مطاعم",en:"Corniche · Restaurants"}, verified:"2026-07-01"},
 {id:"st10", city:"khobar", name:{ar:"الظهران مول",en:"Dhahran Mall"}, op:"Electromin",
  lat:26.3033, lng:50.1583, power:120, conns:["CCS2","Type 2"], tariff:1.00, tariffEst:false, hours:"09:00–01:00", status:"ok",
  amen:{ar:"مول · مواقف مظللة",en:"Mall · Shaded parking"}, verified:"2026-06-25"},
 {id:"st11", city:"madinah", name:{ar:"طريق الملك عبدالله",en:"King Abdullah Rd"}, op:"EVIQ",
  lat:24.4961, lng:39.5847, power:150, conns:["CCS2"], tariff:1.20, tariffEst:false, hours:"24/7", status:"ok",
  amen:{ar:"استراحة · متجر",en:"Rest area · Store"}, verified:"2026-06-10"},
 {id:"st12", city:"buraydah", name:{ar:"طريق القصيم السريع",en:"Qassim Expressway"}, op:"Petromin",
  lat:26.3418, lng:43.9022, power:350, conns:["CCS2"], tariff:1.30, tariffEst:true, hours:"24/7", status:"ok",
  amen:{ar:"محطة وقود · مسجد",en:"Fuel station · Mosque"}, verified:"2026-05-30"},
];

const HOSTS = [
 {id:"h1", name:{ar:"أبو خالد",en:"Abu Khalid"}, city:"riyadh", district:{ar:"حي الياسمين",en:"Al Yasmin"},
  power:11, conn:"Type 2", priceKwh:0.55, rating:4.9, sessions:132, lat:24.8231, lng:46.6421,
  slots:["08:00","10:00","13:00","16:00","20:00"], busy:[1,3]},
 {id:"h2", name:{ar:"م. سارة",en:"Eng. Sarah"}, city:"riyadh", district:{ar:"حي النرجس",en:"Al Narjis"},
  power:22, conn:"Type 2", priceKwh:0.65, rating:5.0, sessions:98, lat:24.8511, lng:46.7013,
  slots:["09:00","12:00","15:00","18:00","21:00"], busy:[0]},
 {id:"h3", name:{ar:"عبدالعزيز",en:"Abdulaziz"}, city:"riyadh", district:{ar:"حي الملقا",en:"Al Malqa"},
  power:7.4, conn:"Type 2", priceKwh:0.45, rating:4.7, sessions:210, lat:24.8042, lng:46.6122,
  slots:["07:00","11:00","14:00","19:00","22:00"], busy:[2,4]},
 {id:"h4", name:{ar:"أم فهد",en:"Umm Fahad"}, city:"jeddah", district:{ar:"حي الشاطئ",en:"Ash Shati"},
  power:11, conn:"Type 2", priceKwh:0.60, rating:4.8, sessions:76, lat:21.5891, lng:39.1102,
  slots:["08:00","12:00","16:00","20:00"], busy:[]},
 {id:"h5", name:{ar:"ناصر",en:"Nasser"}, city:"jeddah", district:{ar:"حي النعيم",en:"An Naim"},
  power:7.4, conn:"Type 2", priceKwh:0.50, rating:4.6, sessions:154, lat:21.6103, lng:39.1421,
  slots:["09:00","13:00","17:00","21:00"], busy:[1]},
 {id:"h6", name:{ar:"محمد الدوسري",en:"Mohammed Aldossari"}, city:"khobar", district:{ar:"حي العقربية",en:"Al Aqrabiyah"},
  power:11, conn:"Type 2", priceKwh:0.55, rating:4.9, sessions:61, lat:26.2851, lng:50.2003,
  slots:["08:00","11:00","15:00","19:00"], busy:[3]},
];

const SELLERS = {
 s1:{name:{ar:"فهد العتيبي",en:"Fahad Alotaibi"}, type:"ind", since:2025, rating:4.8, listings:1, verified:true},
 s3:{name:{ar:"معرض المستقبل للسيارات الكهربائية",en:"Future EV Motors"}, type:"dealer", since:2024, rating:4.7, listings:12, verified:true},
 s4:{name:{ar:"سلطان القحطاني",en:"Sultan Alqahtani"}, type:"ind", since:2026, rating:4.5, listings:1, verified:true},
 s5:{name:{ar:"خالد باوزير",en:"Khalid Bawazir"}, type:"ind", since:2025, rating:4.6, listings:2, verified:true},
 d1:{name:{ar:"وكيل لوسيد المعتمد",en:"Lucid Authorized Dealer"}, type:"dealer", since:2024, rating:4.9, listings:8, verified:true},
 d2:{name:{ar:"إي موبيليتي ستور",en:"E-Mobility Store"}, type:"dealer", since:2024, rating:4.8, listings:24, verified:true},
 d3:{name:{ar:"معرض النخبة للسيارات الفاخرة",en:"Elite Premium Motors"}, type:"dealer", since:2023, rating:4.7, listings:15, verified:true},
};

const REVIEWS = {
 "tesla-my":[
  {name:{ar:"عبدالله — الرياض",en:"Abdullah — Riyadh"}, stars:5, owned:{ar:"سنتان",en:"2 years"}, driven:"38,000",
   summer:{ar:"17.5 ك.و.س/100كم صيفًا",en:"17.5 kWh/100km in summer"}, charging:{ar:"سوبرتشارجر + منزلي",en:"Supercharger + home"},
   text:{ar:"المدى في الصيف ينخفض تقريبًا 15٪ مع التكييف، لكن التجربة ممتازة. الشحن المنزلي غطّى 90٪ من احتياجي.",
         en:"Summer range drops ~15% with AC, but the experience is excellent. Home charging covered 90% of my needs."}},
  {name:{ar:"ريم — جدة",en:"Reem — Jeddah"}, stars:4, owned:{ar:"سنة",en:"1 year"}, driven:"21,000",
   summer:{ar:"18 ك.و.س/100كم",en:"18 kWh/100km"}, charging:{ar:"منزلي 11كو",en:"Home 11kW"},
   text:{ar:"الرطوبة في جدة ما أثرت على البطارية. أنصح بعازل حراري للمقصورة — يفرق كثيرًا في الصيف.",
         en:"Jeddah humidity didn't affect the battery. Get a cabin thermal shield — it makes a real difference in summer."}}],
 "byd-sealion7":[
  {name:{ar:"محمد — الرياض",en:"Mohammed — Riyadh"}, stars:5, owned:{ar:"٦ أشهر",en:"6 months"}, driven:"11,000",
   summer:{ar:"18 ك.و.س/100كم",en:"18 kWh/100km"}, charging:{ar:"منزلي + إيفيك",en:"Home + EVIQ"},
   text:{ar:"بطارية Blade ممتازة مع الحرارة. استخدمت V2L في البر لتشغيل القهوة والإضاءة — ميزة لا تقدر بثمن.",
         en:"The Blade battery handles heat brilliantly. Used V2L on desert trips for coffee and lights — priceless."}}],
 "ioniq5":[
  {name:{ar:"تركي — الخبر",en:"Turki — Khobar"}, stars:5, owned:{ar:"سنتان",en:"2 years"}, driven:"45,000",
   summer:{ar:"19 ك.و.س/100كم",en:"19 kWh/100km"}, charging:{ar:"منزلي + عام",en:"Home + public"},
   text:{ar:"الشحن السريع حقيقي: 18 دقيقة من 10 إلى 80٪ على شاحن 350. الصيانة شبه معدومة.",
         en:"Fast charging is real: 18 min from 10–80% on a 350 kW charger. Maintenance is near zero."}}],
 "kia-ev6":[
  {name:{ar:"سعود — الدمام",en:"Saud — Dammam"}, stars:4, owned:{ar:"سنتان ونصف",en:"2.5 years"}, driven:"52,000",
   summer:{ar:"18.5 ك.و.س/100كم",en:"18.5 kWh/100km"}, charging:{ar:"منزلي فقط",en:"Home only"},
   text:{ar:"بعد 52 ألف كم البطارية 92٪ — أفضل مما توقعت بكثير في مناخنا. منصة 800 فولت تختصر وقت الرحلات الطويلة فعليًا.",
         en:"After 52,000 km the battery is at 92% — far better than expected in our climate. The 800V platform genuinely shortens long trips."}}],
 "zeekr-001":[
  {name:{ar:"ماجد — الرياض",en:"Majed — Riyadh"}, stars:5, owned:{ar:"سنة ونصف",en:"1.5 years"}, driven:"21,000",
   summer:{ar:"19.5 ك.و.س/100كم",en:"19.5 kWh/100km"}, charging:{ar:"منزلي 11كو + عام",en:"Home 11kW + public"},
   text:{ar:"مساحة وفخامة بسعر منافس. رقم CLTC متفائل — احسب 15٪ أقل واقعيًا، ومع ذلك المدى ممتاز.",
         en:"Space and luxury at a competitive price. The CLTC figure is optimistic — expect ~15% less in reality, still excellent range."}}],
};

const OWNERS = [
 {id:"o1", name:{ar:"عبدالله ن.",en:"Abdullah N."}, car:"Tesla Model Y", city:"riyadh", rating:4.9, sessions:14, fee:49},
 {id:"o2", name:{ar:"ريم س.",en:"Reem S."}, car:"BYD Sealion 7", city:"jeddah", rating:5.0, sessions:9, fee:39},
 {id:"o3", name:{ar:"تركي ع.",en:"Turki A."}, car:"Hyundai Ioniq 5", city:"khobar", rating:4.8, sessions:11, fee:49},
 {id:"o4", name:{ar:"محمد ق.",en:"Mohammed Q."}, car:"ZEEKR 001", city:"riyadh", rating:4.9, sessions:7, fee:59},
 {id:"o5", name:{ar:"سارة م.",en:"Sarah M."}, car:"Lucid Air", city:"jeddah", rating:5.0, sessions:5, fee:79},
];

const TECHS = [
 {id:"t1", name:{ar:"شركة فولت للتركيبات",en:"Volt Installations Co."}, city:"riyadh", rating:4.9, jobs:340, price:850},
 {id:"t2", name:{ar:"مؤسسة الطاقة الذكية",en:"Smart Energy Est."}, city:"jeddah", rating:4.8, jobs:215, price:800},
 {id:"t3", name:{ar:"كهرباء المستقبل",en:"Future Electric"}, city:"dammam", rating:4.7, jobs:180, price:780},
];

const STORIES = [
 {who:{ar:"مجموعة تليجرام — نقاش الأسبوع",en:"Telegram group — this week"},
  text:{ar:"«جربت الشحن من الرياض إلى الدمام بتوقف واحد فقط في بريدة… الوضع تغيّر تمامًا عن 2024»",
        en:"\"Drove Riyadh to Dammam with just one stop in Buraydah… things have completely changed since 2024\""}},
 {who:{ar:"استطلاع المجتمع",en:"Community poll"},
  text:{ar:"٧٣٪ من الأعضاء قالوا إن أهم عامل عند شراء مستعملة هو شهادة فحص البطارية",
        en:"73% of members said a battery certificate is the #1 factor when buying used"}},
 {who:{ar:"تجربة عضو",en:"Member experience"},
  text:{ar:"«أجّرت شاحني المنزلي عبر التجربة المبكرة للشحن التشاركي — غطّى فاتورة الكهرباء كاملة»",
        en:"\"Listed my home charger in the P2P early trial — it covered my whole electricity bill\""}},
];

return {CITIES, BRANDS, IMG, VEHICLES, PRODUCTS, STATIONS, HOSTS, SELLERS, REVIEWS, OWNERS, TECHS, STORIES};
})();
