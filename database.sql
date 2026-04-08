-- ✅ إنشاء قاعدة البيانات
CREATE DATABASE company_clients;

-- ✅ الاتصال بقاعدة البيانات
\c company_clients

-- ✅ إنشاء جدول العملاء
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  location VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  gender VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ إنشاء فهرس للبحث السريع
CREATE INDEX idx_phone ON clients(phone);
CREATE INDEX idx_created_at ON clients(created_at);

-- ✅ إنشاء جدول للتطبيق (الحذف يترك في سجل)
CREATE TABLE clients_archive (
  id SERIAL PRIMARY KEY,
  client_id INTEGER,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  location VARCHAR(200),
  phone VARCHAR(20),
  gender VARCHAR(10),
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ مثال على البيانات الأولية (اختياري)
INSERT INTO clients (first_name, last_name, location, phone, gender) VALUES
('أحمد', 'محمد', 'القاهرة', '01001234567', 'ذكر'),
('فاطمة', 'علي', 'الجيزة', '01201234567', 'أنثى'),
('سارة', 'حسن', 'الإسكندرية', '01501234567', 'أنثى');

-- ✅ عرض جميع العملاء
SELECT * FROM clients;

-- ✅ إحصائيات حسب النوع
SELECT gender, COUNT(*) as count FROM clients GROUP BY gender;

-- ✅ البحث عن عميل برقم هاتفه
SELECT * FROM clients WHERE phone = '01001234567';
