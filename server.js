// npm install express pg body-parser cors dotenv
// ثم: node server.js

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// إعدادات قاعدة البيانات
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'company_clients'
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// اختبار الاتصال بقاعدة البيانات
pool.on('error', (err) => {
  console.error('خطأ في قاعدة البيانات:', err);
});

// ✅ API - إضافة عميل جديد
app.post('/api/clients', async (req, res) => {
  try {
    const { first_name, last_name, location, phone, gender } = req.body;

    // التحقق من البيانات المطلوبة
    if (!first_name || !last_name || !location || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'الرجاء ملء جميع الحقول المطلوبة' 
      });
    }

    // التحقق من صحة رقم الهاتف
    if (!/^\d{10,}$/.test(phone.replace(/[-\s]/g, ''))) {
      return res.status(400).json({ 
        success: false, 
        message: 'رقم الهاتف غير صحيح' 
      });
    }

    const query = `
      INSERT INTO clients (first_name, last_name, location, phone, gender, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, first_name, last_name, location, phone, gender, created_at
    `;

    const result = await pool.query(query, [first_name, last_name, location, phone, gender || null]);
    
    res.status(201).json({ 
      success: true, 
      message: 'تم إضافة العميل بنجاح ✅',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('خطأ في الخادم:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
});

// ✅ API - الحصول على جميع العملاء
app.get('/api/clients', async (req, res) => {
  try {
    const query = `
      SELECT id, first_name, last_name, location, phone, gender, created_at
      FROM clients
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({ 
      success: true, 
      count: result.rows.length,
      data: result.rows 
    });
  } catch (error) {
    console.error('خطأ في الخادم:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
});

// ✅ API - الحصول على عميل واحد
app.get('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT id, first_name, last_name, location, phone, gender, created_at
      FROM clients
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'العميل غير موجود' 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('خطأ في الخادم:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
});

// ✅ API - تحديث بيانات عميل
app.put('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, location, phone, gender } = req.body;

    if (!first_name || !last_name || !location || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'الرجاء ملء جميع الحقول المطلوبة' 
      });
    }

    const query = `
      UPDATE clients
      SET first_name = $1, last_name = $2, location = $3, phone = $4, gender = $5
      WHERE id = $6
      RETURNING id, first_name, last_name, location, phone, gender, created_at
    `;
    
    const result = await pool.query(query, [first_name, last_name, location, phone, gender || null, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'العميل غير موجود' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'تم تحديث بيانات العميل بنجاح ✅',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('خطأ في الخادم:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
});

// ✅ API - حذف عميل
app.delete('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM clients WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'العميل غير موجود' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'تم حذف العميل بنجاح ✅' 
    });
  } catch (error) {
    console.error('خطأ في الخادم:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
});

// ✅ صفحة الإحصائيات
app.get('/api/stats', async (req, res) => {
  try {
    const countQuery = 'SELECT COUNT(*) as total_clients FROM clients';
    const countResult = await pool.query(countQuery);
    
    const genderQuery = `
      SELECT gender, COUNT(*) as count
      FROM clients
      WHERE gender IS NOT NULL
      GROUP BY gender
    `;
    const genderResult = await pool.query(genderQuery);
    
    res.json({ 
      success: true, 
      total_clients: parseInt(countResult.rows[0].total_clients),
      by_gender: genderResult.rows
    });
  } catch (error) {
    console.error('خطأ في الخادم:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
});

// بدء الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل على: http://localhost:${PORT}`);
  console.log(`📝 أضف عميل جديد: POST http://localhost:${PORT}/api/clients`);
  console.log(`📋 شوف جميع العملاء: GET http://localhost:${PORT}/api/clients`);
});

module.exports = app;
