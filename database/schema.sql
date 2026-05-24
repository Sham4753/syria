PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_ar TEXT NOT NULL, name_en TEXT NOT NULL, code TEXT UNIQUE,
    flag_emoji TEXT, currency_ar TEXT, currency_en TEXT, currency_symbol TEXT,
    phone_code TEXT, is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS admin_levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_id INTEGER, level_number INTEGER,
    name_ar TEXT, name_en TEXT,
    FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER, admin_level_id INTEGER, country_id INTEGER,
    name_ar TEXT NOT NULL, name_en TEXT, code TEXT,
    center_lat REAL, center_lng REAL, population INTEGER,
    is_active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (parent_id) REFERENCES regions(id),
    FOREIGN KEY (admin_level_id) REFERENCES admin_levels(id),
    FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS main_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_ar TEXT, name_en TEXT, icon TEXT, slug TEXT UNIQUE,
    is_active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sub_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    main_category_id INTEGER, name_ar TEXT, name_en TEXT, icon TEXT, slug TEXT,
    is_active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (main_category_id) REFERENCES main_categories(id)
);

CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    region_id INTEGER, sub_category_id INTEGER,
    name_ar TEXT NOT NULL, name_en TEXT, description_ar TEXT,
    phone TEXT, whatsapp TEXT, logo TEXT,
    latitude REAL, longitude REAL,
    delivery_available INTEGER DEFAULT 0,
    average_rating REAL DEFAULT 0, total_ratings INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    is_verified INTEGER DEFAULT 0, is_featured INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (region_id) REFERENCES regions(id),
    FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id)
);

CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER, name_ar TEXT, name_en TEXT,
    price REAL, image TEXT,
    is_available INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE TABLE IF NOT EXISTS product_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_ar TEXT, name_en TEXT, icon TEXT, slug TEXT UNIQUE,
    is_active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER, product_category_id INTEGER,
    name_ar TEXT, name_en TEXT, price REAL,
    condition TEXT DEFAULT 'new', is_active INTEGER DEFAULT 1, is_sold INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id),
    FOREIGN KEY (product_category_id) REFERENCES product_categories(id)
);

CREATE TABLE IF NOT EXISTS orders_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE, business_id INTEGER,
    customer_name TEXT, customer_phone TEXT, customer_address TEXT,
    subtotal REAL, delivery_fee REAL DEFAULT 0, total REAL,
    payment_method TEXT DEFAULT 'cash', payment_status TEXT DEFAULT 'pending',
    order_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER, reviewer_name TEXT,
    rating REAL, comment_ar TEXT,
    is_approved INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE, password_hash TEXT,
    full_name TEXT, phone TEXT, role TEXT DEFAULT 'user',
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE, setting_value TEXT
);

CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_ar TEXT, name_en TEXT, code TEXT UNIQUE, icon TEXT,
    is_active INTEGER DEFAULT 1
);

-- فهارس
CREATE INDEX IF NOT EXISTS idx_regions_parent ON regions(parent_id);
CREATE INDEX IF NOT EXISTS idx_regions_level ON regions(admin_level_id);
CREATE INDEX IF NOT EXISTS idx_businesses_region ON businesses(region_id);
CREATE INDEX IF NOT EXISTS idx_businesses_name ON businesses(name_ar);

-- بيانات
INSERT INTO countries (id, name_ar, name_en, code, flag_emoji, currency_ar, currency_symbol, phone_code) VALUES (1, 'سوريا', 'Syria', 'sy', '🇸🇾', 'ليرة سورية', 'ل.س', '+963');

INSERT INTO admin_levels (id, country_id, level_number, name_ar, name_en) VALUES
(1, 1, 1, 'محافظات', 'Governorates'),
(2, 1, 2, 'مناطق', 'Districts'),
(3, 1, 3, 'نواحي', 'Subdistricts'),
(4, 1, 4, 'قرى وأحياء', 'Villages');

INSERT INTO regions (id, parent_id, admin_level_id, country_id, name_ar, name_en, code, center_lat, center_lng, population, sort_order) VALUES
(1, NULL, 1, 1, 'دمشق', 'Damascus', 'damascus', 33.51, 36.27, 1750000, 1),
(2, NULL, 1, 1, 'حلب', 'Aleppo', 'aleppo', 36.20, 37.13, 4868000, 2),
(3, NULL, 1, 1, 'حمص', 'Homs', 'homs', 34.73, 36.71, 1803000, 3),
(4, NULL, 1, 1, 'اللاذقية', 'Latakia', 'latakia', 35.52, 35.79, 1008000, 4),
(5, NULL, 1, 1, 'حماة', 'Hama', 'hama', 35.13, 36.75, 1628000, 5),
(6, NULL, 1, 1, 'طرطوس', 'Tartous', 'tartous', 34.89, 35.88, 797000, 6),
(7, NULL, 1, 1, 'دير الزور', 'Deir ez-Zor', 'deir', 35.33, 40.14, 1239000, 7),
(8, NULL, 1, 1, 'إدلب', 'Idlib', 'idlib', 35.93, 36.63, 1501000, 8),
(9, NULL, 1, 1, 'الحسكة', 'Hasakah', 'hasakah', 36.50, 40.74, 1512000, 9),
(10, NULL, 1, 1, 'الرقة', 'Raqqa', 'raqqa', 35.95, 39.01, 944000, 10),
(11, NULL, 1, 1, 'درعا', 'Daraa', 'daraa', 32.62, 36.10, 1027000, 11),
(12, NULL, 1, 1, 'السويداء', 'Suwayda', 'suwayda', 32.70, 36.56, 370000, 12),
(13, NULL, 1, 1, 'القنيطرة', 'Quneitra', 'quneitra', 33.12, 35.82, 90000, 13),
(14, NULL, 1, 1, 'ريف دمشق', 'Rif Dimashq', 'rif-dimashq', 33.51, 36.27, 2836000, 14);

INSERT INTO main_categories (id, name_ar, name_en, icon, slug, sort_order) VALUES
(1, 'مطاعم ومقاهي', 'Restaurants & Cafes', '🍽️', 'food', 1),
(2, 'تسوق وبيع', 'Shopping', '🛍️', 'shopping', 2),
(3, 'صحة وطب', 'Health', '🏥', 'health', 3),
(4, 'نقل ومواصلات', 'Transport', '🚌', 'transport', 4),
(5, 'تعليم', 'Education', '🎓', 'education', 5),
(6, 'خدمات', 'Services', '🔧', 'services', 6);

INSERT INTO payment_methods (id, name_ar, name_en, code, icon, is_active) VALUES
(1, 'نقداً', 'Cash', 'cash', '💵', 1),
(2, 'كاش موبايل', 'Cash Mobile', 'cash_mobile', '📱', 1),
(3, 'حوالات', 'Hawalat', 'hawalat', '🏦', 1);
