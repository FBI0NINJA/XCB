require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();

// Database Connection
let pool;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'postgres'
  });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Add Client
app.post('/api/clients', async (req, res) => {
  try {
    const { first_name, last_name, location, phone, gender } = req.body;

    if (!first_name || !last_name || !location || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'الرجاء ملء جميع الحقول المطلوبة' 
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
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
});

// Get All Clients
app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, first_name, last_name, location, phone, gender, created_at
      FROM clients
      ORDER BY created_at DESC
    `);
    
    res.json({ 
      success: true, 
      count: result.rows.length,
      data: result.rows 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
});

// Delete Client
app.delete('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING id', [id]);
    
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
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
});

// Stats
app.get('/api/stats', async (req, res) => {
  try {
    const countResult = await pool.query('SELECT COUNT(*) as total_clients FROM clients');
    const genderResult = await pool.query(`
      SELECT gender, COUNT(*) as count
      FROM clients
      WHERE gender IS NOT NULL
      GROUP BY gender
    `);
    
    res.json({ 
      success: true, 
      total_clients: parseInt(countResult.rows[0].total_clients),
      by_gender: genderResult.rows
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  pool.query('SELECT NOW()', (err) => {
    if (err) {
      console.error('❌ Database error:', err.message);
    } else {
      console.log('✅ Database connected!');
    }
  });
});

module.exports = app;
