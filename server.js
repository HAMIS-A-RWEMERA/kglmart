const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// 1. FIXED: Corrected Permanent Database Path Configuration for Andasy
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/data/kgl_mart.db' 
    : path.join(__dirname, 'kgl_mart.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database connection error:', err.message);
    else console.log(`Connected to physical SQL database file at: ${dbPath}`);
});

// 2. Create tables
db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    items TEXT,
    total REAL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// NEW: Products table initialization for your inventory store
db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT
)`);

// 3. Middlewares
app.use(express.json()); 
app.use(express.static('public')); 

// 4. The "Order Receiver" Route
app.post('/api/place-order', (req, res) => {
    const { cartItems, totalAmount } = req.body;
    const sql = `INSERT INTO orders (items, total) VALUES (?, ?)`;
    
    db.run(sql, [JSON.stringify(cartItems), totalAmount], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ 
            message: "Order placed successfully!", 
            orderId: this.lastID 
        });
    });
});

// NEW: Highly-scalable Product Search API Route using SQL LIKE
app.get('/api/products/search', (req, res) => {
    const searchTerm = req.query.q;
    
    if (!searchTerm) {
        return res.json([]);
    }

    const sql = `SELECT * FROM products WHERE name LIKE ? OR description LIKE ?`;
    const queryParam = `%${searchTerm}%`;

    db.all(sql, [queryParam, queryParam], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// A secret route to see your orders in the browser
app.get('/view-orders-kgl-admin', (req, res) => {
    db.all("SELECT * FROM orders ORDER BY order_date DESC", [], (err, rows) => {
        if (err) return res.status(500).send(err.message);
        
        let html = '<h1>KGL Mart - Received Orders</h1><table border="1"><tr><th>ID</th><th>Items</th><th>Total (RWF)</th><th>Date</th></tr>';
        rows.forEach(row => {
            html += `<tr><td>${row.id}</td><td>${row.items}</td><td>${row.total}</td><td>${row.order_date}</td></tr>`;
        });
        html += '</table>';
        res.send(html);
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '::', () => {
    console.log(`Server securely running on dual-stack IPv4/IPv6 port ${PORT}`);
});
