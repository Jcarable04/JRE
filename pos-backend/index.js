const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createPool({
  host: process.env.DB_HOST || 'sql210.infinityfree.com',
  user: process.env.DB_USER || 'if0_40493128',
  password: process.env.DB_PASS || 'WVigmt4WwfFL',
  database: process.env.DB_NAME || 'if0_40493128_pos_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
// Test connection
db.getConnection()
  .then(conn => {
    console.log('✅ Database connected!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ DB Connection Error:', err.message);
  });

// Routes
app.get('/', (req, res) => {
  res.send('POS Backend Running');
});

// Get all products
app.get('/products', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    console.error('GET /products Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// SIMPLIFIED CHECKOUT - TEST VERSION
// Updated test endpoint to verify structure
app.post('/sales-test', async (req, res) => {
  console.log('\n🔵 ========== TEST CHECKOUT CALLED ==========');
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { customer_name, customer_address, sale_items } = req.body;
    
    // Validate the structure frontend is sending
    if (sale_items && sale_items.length > 0) {
      console.log('\n📋 Checking item structure:');
      sale_items.forEach((item, index) => {
        console.log(`Item ${index + 1}:`);
        console.log(`  product_id: ${item.product_id}`);
        console.log(`  product_name: ${item.product_name || '(missing)'}`);
        console.log(`  quantity: ${item.quantity}`);
        console.log(`  unit_price: ${item.unit_price || '(missing - using price: ' + item.price + ')'}`);
      });
    }
    
    res.json({ 
      success: true,
      message: 'Test checkout successful - structure verified',
      expected_structure: {
        customer_name: 'string',
        customer_address: 'string',
        sale_items: [{
          product_id: 'number',
          product_name: 'string',
          quantity: 'number',
          unit_price: 'number'
        }]
      }
    });
    
  } catch (err) {
    console.error('Test checkout error:', err);
    res.status(500).json({ error: 'Test failed', details: err.message });
  }
});
// In backend
app.get('/sales-history', async (req, res) => {
  try {
    const [sales] = await db.query(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
      FROM sales s 
      ORDER BY s.created_at DESC
    `);
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// In frontend
app.get('/sale-details/:id', async (req, res) => {
  try {
    const [sale] = await db.query('SELECT * FROM sales WHERE id = ?', [req.params.id]);
    const [items] = await db.query(`
      SELECT si.*, p.name as product_name 
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `, [req.params.id]);
    
    res.json({ sale: sale[0], items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Add product (for testing)
app.post('/products', async (req, res) => {
  try {
    const { name, service_type, container_type, price, stocks } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO products (name, service_type, container_type, price, stocks) VALUES (?, ?, ?, ?, ?)',
      [name, service_type, container_type, price || 0, stocks || 0]
    );
    
    res.json({
      id: result.insertId,
      name,
      service_type,
      container_type,
      price: price || 0,
      stocks: stocks || 0
    });
  } catch (err) {
    console.error('POST /products Error:', err.message);
    res.status(500).json({ error: 'Failed to add product' });
  }
});
app.get('/sales-history', async (req, res) => {
  try {
    const [sales] = await db.query(`
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
      FROM sales s
      ORDER BY s.created_at DESC
      LIMIT 100
    `);
    res.json(sales);
  } catch (err) {
    console.error('Error fetching sales history:', err);
    res.status(500).json({ error: err.message });
  }
});
// Get today's sales
app.get('/sales-today', async (req, res) => {
  try {
    const [sales] = await db.query(`
      SELECT * FROM sales 
      WHERE DATE(created_at) = CURDATE()
      ORDER BY created_at DESC
    `);
    res.json(sales);
  } catch (err) {
    console.error('Error fetching today sales:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get dashboard statistics
app.get('/dashboard-stats', async (req, res) => {
  try {
    // Total sales amount
    const [[totalSales]] = await db.query(
      'SELECT SUM(total_amount) as total FROM sales'
    );
    
    // Today's sales
    const [[todaySales]] = await db.query(
      'SELECT SUM(total_amount) as total FROM sales WHERE DATE(created_at) = CURDATE()'
    );
    
    // Total products
    const [[productCount]] = await db.query(
      'SELECT COUNT(*) as count FROM products'
    );
    
    // Low stock products
    const [lowStock] = await db.query(
      'SELECT * FROM products WHERE stocks < 10 ORDER BY stocks ASC'
    );
    
    // Recent sales
    const [recentSales] = await db.query(
      'SELECT * FROM sales ORDER BY created_at DESC LIMIT 5'
    );
    
    res.json({
      totalSales: totalSales.total || 0,
      todaySales: todaySales.total || 0,
      productCount: productCount.count || 0,
      lowStock,
      recentSales
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: err.message });
  }
});
// Add product
app.post('/products', async (req, res) => {
  try {
    const { name, service_type, container_type, price, stocks } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO products (name, service_type, container_type, price, stocks) VALUES (?, ?, ?, ?, ?)',
      [name, service_type, container_type, price || 0, stocks || 0]
    );
    
    const [newProduct] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    
    res.json(newProduct[0]);
  } catch (err) {
    console.error('POST /products Error:', err.message);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Update product
app.put('/products/:id', async (req, res) => {
  try {
    const { name, service_type, container_type, price, stocks } = req.body;
    const productId = req.params.id;
    
    const [result] = await db.query(
      `UPDATE products 
       SET name = ?, service_type = ?, container_type = ?, price = ?, stocks = ?
       WHERE id = ?`,
      [name, service_type, container_type, price || 0, stocks || 0, productId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const [updated] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    res.json(updated[0]);
  } catch (err) {
    console.error('PUT /products/:id Error:', err.message);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
app.delete('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Check if product exists in any sale
    const [saleCheck] = await db.query(
      'SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?',
      [productId]
    );
    
    if (saleCheck[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete product. It exists in sales records.' 
      });
    }
    
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [productId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('DELETE /products/:id Error:', err.message);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});
// Update sale status endpoint
// Update sale status endpoint - MySQL version
app.put('/sales/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status. Must be: pending, processing, completed, or cancelled' 
      });
    }
    
    // Update in database - MySQL uses db.query()
    const query = 'UPDATE sales SET status = ? WHERE id = ?';
    const [result] = await db.query(query, [status, id]);
    
    if (result.affectedRows > 0) {
      res.json({ 
        success: true, 
        message: 'Status updated successfully',
        saleId: id,
        newStatus: status
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Sale not found' 
      });
    }
  } catch (error) {
    console.error('Error updating sale status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update sale status' 
    });
  }
});
// Update stock
app.patch('/products/:id/stock', async (req, res) => {
  try {
    const { stocks } = req.body;
    const productId = req.params.id;
    
    const [result] = await db.query(
      'UPDATE products SET stocks = ? WHERE id = ?',
      [stocks || 0, productId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const [updated] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    res.json(updated[0]);
  } catch (err) {
    console.error('PATCH /products/:id/stock Error:', err.message);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});
// Get single sale with items
app.get('/sales/:id', async (req, res) => {
  try {
    const [sale] = await db.query('SELECT * FROM sales WHERE id = ?', [req.params.id]);
    
    if (sale.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    const [items] = await db.query('SELECT * FROM sale_items WHERE sale_id = ?', [req.params.id]);
    
    res.json({ 
      sale: sale[0], 
      items 
    });
  } catch (err) {
    console.error('Error fetching sale:', err);
    res.status(500).json({ error: err.message });
  }
});
// Check database tables
// CORRECTED sales endpoint
app.post('/sales', async (req, res) => {
  console.log('\n🔵 ========== CHECKOUT REQUEST ==========');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { customer_name, customer_address, sale_items } = req.body;
    
    // Validate
    if (!customer_name || !customer_address) {
      return res.status(400).json({ error: 'Customer name and address required' });
    }
    
    if (!sale_items || !Array.isArray(sale_items) || sale_items.length === 0) {
      return res.status(400).json({ error: 'No items in cart' });
    }
    
    console.log('Checking products in database...');
    
    // Get all products to check what exists
    const [allProducts] = await db.query('SELECT id, name, stocks, price FROM products');
    console.log('Products in DB:', allProducts);
    
    // Check each product
    for (const item of sale_items) {
      console.log(`Checking product ID ${item.product_id}...`);
      const product = allProducts.find(p => p.id === item.product_id);
      
      if (!product) {
        console.error(`❌ Product ID ${item.product_id} not found!`);
        console.log('Available product IDs:', allProducts.map(p => p.id));
        return res.status(400).json({ 
          error: `Product ID ${item.product_id} not found in database`,
          available_product_ids: allProducts.map(p => p.id)
        });
      }
      
      console.log(`✅ Found: ${product.name}, Stock: ${product.stocks}`);
      
      if (product.stocks < item.quantity) {
        return res.status(400).json({ 
          error: `Not enough ${product.name} in stock. Available: ${product.stocks}` 
        });
      }
    }
    
    // Calculate total
    let total_amount = 0;
    for (const item of sale_items) {
      const product = allProducts.find(p => p.id === item.product_id);
      const price = product.price;
      const subtotal = price * item.quantity;
      total_amount += subtotal;
    }
    
    console.log(`Total amount: ${total_amount}`);
    
    // Insert sale
    const [saleResult] = await db.query(
      'INSERT INTO sales (customer_name, customer_address, total_amount, status) VALUES (?, ?, ?, ?)',
      [customer_name, customer_address, total_amount, 'pending']
    );
    
    const saleId = saleResult.insertId;
    console.log(`Sale inserted with ID: ${saleId}`);
    
    // CORRECTED: Insert sale items with proper column names
    for (const item of sale_items) {
      const product = allProducts.find(p => p.id === item.product_id);
      const unit_price = product.price;
      
      // Use the product_name from the frontend OR get from DB
      const product_name = item.product_name || product.name;
      
      // CORRECT QUERY: sale_items has unit_price, not price
      await db.query(
        'INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
        [saleId, item.product_id, product_name, item.quantity, unit_price]
      );
      
      // Update stock
      await db.query(
        'UPDATE products SET stocks = stocks - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
      
      console.log(`Processed ${item.quantity}x product ${item.product_id}`);
    }
    
    console.log('✅ Checkout completed successfully!');
    
    res.json({
      success: true,
      message: 'Sale completed successfully',
      sale_id: saleId,
      total_amount: total_amount
    });
    
  } catch (err) {
    console.error('\n❌ CHECKOUT ERROR:', err.message);
    console.error('MySQL Error:', err.sqlMessage);
    console.error('Error code:', err.code);
    console.error('Full error:', err);
    
    // Check if it's a column error
    if (err.message.includes('Unknown column')) {
      console.error('\n⚠️ COLUMN ERROR DETECTED!');
      console.error('Please check sale_items table structure.');
    }
    
    res.status(500).json({
      error: 'Failed to process sale',
      details: err.message,
      mysql_error: err.sqlMessage || 'No MySQL error',
      mysql_code: err.code || 'No error code'
    });
  }
});
// ========== INVENTORY DATABASE SETUP ==========
const createInventoryTables = async () => {
  try {
    // Create companies table
    await db.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        notes TEXT,
        item_count INT DEFAULT 0,
        stock_status VARCHAR(50) DEFAULT 'Good',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create inventory_items table
    await db.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        company_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        quantity DECIMAL(10,2) DEFAULT 0,
        unit VARCHAR(50) DEFAULT 'pcs',
        unit_price DECIMAL(10,2) DEFAULT 0,
        description TEXT,
        sku VARCHAR(100),
        low_stock_threshold DECIMAL(10,2) DEFAULT 10,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);

    // Create stock_history table for tracking changes
    await db.query(`
      CREATE TABLE IF NOT EXISTS stock_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        item_id INT NOT NULL,
        action VARCHAR(50),
        quantity_change DECIMAL(10,2),
        new_quantity DECIMAL(10,2),
        reason VARCHAR(100),
        notes TEXT,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Inventory tables created/verified');
  } catch (err) {
    console.error('❌ Error creating inventory tables:', err.message);
  }
};

// Initialize inventory tables
createInventoryTables();

// ========== INVENTORY ROUTES ==========

// 1. COMPANIES ENDPOINTS

// Get all companies with item count
app.get('/companies', async (req, res) => {
  try {
    const [companies] = await db.query(`
      SELECT c.*, 
        COUNT(i.id) as item_count,
        CASE 
          WHEN COUNT(i.id) = 0 THEN 'Good'
          WHEN SUM(CASE WHEN i.quantity <= i.low_stock_threshold AND i.quantity > 0 THEN 1 ELSE 0 END) > 0 THEN 'Warning'
          WHEN SUM(CASE WHEN i.quantity = 0 THEN 1 ELSE 0 END) > 0 THEN 'Critical'
          ELSE 'Good'
        END as stock_status
      FROM companies c
      LEFT JOIN inventory_items i ON c.id = i.company_id
      GROUP BY c.id
      ORDER BY c.name
    `);
    res.json(companies);
  } catch (err) {
    console.error('GET /companies Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Get single company with items
app.get('/companies/:id', async (req, res) => {
  try {
    const [companies] = await db.query('SELECT * FROM companies WHERE id = ?', [req.params.id]);
    
    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const [items] = await db.query('SELECT * FROM inventory_items WHERE company_id = ?', [req.params.id]);
    
    res.json({ 
      ...companies[0], 
      items,
      itemCount: items.length
    });
  } catch (err) {
    console.error('GET /companies/:id Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});



// Update company
app.put('/companies/:id', async (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const [result] = await db.query(
      `UPDATE companies 
       SET name = ?, email = ?, phone = ?, address = ?, notes = ?
       WHERE id = ?`,
      [name, email || null, phone || null, address || null, notes || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const [updatedCompany] = await db.query('SELECT * FROM companies WHERE id = ?', [req.params.id]);
    const [items] = await db.query('SELECT * FROM inventory_items WHERE company_id = ?', [req.params.id]);
    
    res.json({
      ...updatedCompany[0],
      itemCount: items.length,
      items
    });
  } catch (err) {
    console.error('PUT /companies/:id Error:', err.message);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// Delete company
app.delete('/companies/:id', async (req, res) => {
  try {
    // Check if company has items
    const [items] = await db.query('SELECT COUNT(*) as count FROM inventory_items WHERE company_id = ?', [req.params.id]);
    
    if (items[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete company that has inventory items. Delete items first.' 
      });
    }

    const [result] = await db.query('DELETE FROM companies WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (err) {
    console.error('DELETE /companies/:id Error:', err.message);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// Search companies
app.get('/companies/search/:query', async (req, res) => {
  try {
    const query = `%${req.params.query}%`;
    const [companies] = await db.query(`
      SELECT c.*, 
        COUNT(i.id) as item_count,
        CASE 
          WHEN COUNT(i.id) = 0 THEN 'Good'
          WHEN SUM(CASE WHEN i.quantity <= i.low_stock_threshold AND i.quantity > 0 THEN 1 ELSE 0 END) > 0 THEN 'Warning'
          WHEN SUM(CASE WHEN i.quantity = 0 THEN 1 ELSE 0 END) > 0 THEN 'Critical'
          ELSE 'Good'
        END as stock_status
      FROM companies c
      LEFT JOIN inventory_items i ON c.id = i.company_id
      WHERE c.name LIKE ? OR c.email LIKE ? OR c.address LIKE ?
      GROUP BY c.id
      ORDER BY c.name
    `, [query, query, query]);
    
    res.json(companies);
  } catch (err) {
    console.error('GET /companies/search Error:', err.message);
    res.status(500).json({ error: 'Failed to search companies' });
  }
});

// 2. INVENTORY ITEMS ENDPOINTS

// Get items for a company
app.get('/companies/:companyId/items', async (req, res) => {
  try {
    const { filter = 'all', search = '' } = req.query;
    
    let query = 'SELECT * FROM inventory_items WHERE company_id = ?';
    let params = [req.params.companyId];
    
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    switch (filter) {
      case 'low-stock':
        query += ' AND quantity <= low_stock_threshold AND quantity > 0';
        break;
      case 'out-of-stock':
        query += ' AND quantity = 0';
        break;
      case 'in-stock':
        query += ' AND quantity > low_stock_threshold';
        break;
    }
    
    query += ' ORDER BY name';
    
    const [items] = await db.query(query, params);
    res.json(items);
  } catch (err) {
    console.error('GET /companies/:companyId/items Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Create new item
app.post('/companies/:companyId/items', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      name, category, quantity, unit, unit_price, 
      description, sku, low_stock_threshold 
    } = req.body;
    
    if (!name || unit_price === undefined) {
      throw new Error('Item name and unit price are required');
    }

    // Insert item
    const [result] = await connection.query(
      `INSERT INTO inventory_items 
       (company_id, name, category, quantity, unit, unit_price, description, sku, low_stock_threshold) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.companyId, 
        name, 
        category || null,
        quantity || 0,
        unit || 'pcs',
        unit_price,
        description || null,
        sku || null,
        low_stock_threshold || 10
      ]
    );

    // Record history
    await connection.query(
      `INSERT INTO stock_history 
       (item_id, action, quantity_change, new_quantity, reason, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        result.insertId,
        'create',
        quantity || 0,
        quantity || 0,
        'initial_stock',
        'Item created',
        'system'
      ]
    );

    // Update company item count
    await connection.query(
      'UPDATE companies SET item_count = item_count + 1 WHERE id = ?',
      [req.params.companyId]
    );

    await connection.commit();

    const [newItem] = await db.query('SELECT * FROM inventory_items WHERE id = ?', [result.insertId]);
    
    res.status(201).json(newItem[0]);
  } catch (err) {
    await connection.rollback();
    console.error('POST /companies/:companyId/items Error:', err.message);
    res.status(500).json({ error: 'Failed to create item', details: err.message });
  } finally {
    connection.release();
  }
});

// Update item
app.put('/items/:id', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      name, category, quantity, unit, unit_price, 
      description, sku, low_stock_threshold 
    } = req.body;
    
    // Get current quantity
    const [current] = await connection.query(
      'SELECT quantity FROM inventory_items WHERE id = ?',
      [req.params.id]
    );
    
    if (current.length === 0) {
      throw new Error('Item not found');
    }
    
    const oldQuantity = current[0].quantity;
    const quantityChange = quantity - oldQuantity;

    // Update item
    const [result] = await connection.query(
      `UPDATE inventory_items 
       SET name = ?, category = ?, quantity = ?, unit = ?, unit_price = ?, 
           description = ?, sku = ?, low_stock_threshold = ?, last_updated = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name, 
        category || null,
        quantity,
        unit || 'pcs',
        unit_price,
        description || null,
        sku || null,
        low_stock_threshold || 10,
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error('Item not found');
    }

    // Record history if quantity changed
    if (quantityChange !== 0) {
      await connection.query(
        `INSERT INTO stock_history 
         (item_id, action, quantity_change, new_quantity, reason, notes, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.params.id,
          quantityChange > 0 ? 'increase' : 'decrease',
          Math.abs(quantityChange),
          quantity,
          'manual_update',
          'Item quantity updated',
          'system'
        ]
      );
    }

    await connection.commit();

    const [updatedItem] = await db.query('SELECT * FROM inventory_items WHERE id = ?', [req.params.id]);
    res.json(updatedItem[0]);
  } catch (err) {
    await connection.rollback();
    console.error('PUT /items/:id Error:', err.message);
    res.status(500).json({ error: 'Failed to update item', details: err.message });
  } finally {
    connection.release();
  }
});

// Delete item
app.delete('/items/:id', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get company_id before deleting
    const [item] = await connection.query(
      'SELECT company_id FROM inventory_items WHERE id = ?',
      [req.params.id]
    );
    
    if (item.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const companyId = item[0].company_id;

    // Delete item
    const [result] = await connection.query(
      'DELETE FROM inventory_items WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Update company item count
    await connection.query(
      'UPDATE companies SET item_count = GREATEST(0, item_count - 1) WHERE id = ?',
      [companyId]
    );

    await connection.commit();
    
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('DELETE /items/:id Error:', err.message);
    res.status(500).json({ error: 'Failed to delete item', details: err.message });
  } finally {
    connection.release();
  }
});

// Adjust item stock
app.post('/items/:id/adjust-stock', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { action, quantity, reason, notes, created_by = 'system' } = req.body;
    
    if (!['increase', 'decrease'].includes(action)) {
      throw new Error('Action must be "increase" or "decrease"');
    }
    
    if (!quantity || quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    // Get current item
    const [items] = await connection.query(
      'SELECT * FROM inventory_items WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    
    if (items.length === 0) {
      throw new Error('Item not found');
    }
    
    const item = items[0];
    const newQuantity = action === 'increase' 
      ? item.quantity + quantity 
      : item.quantity - quantity;
    
    if (newQuantity < 0) {
      throw new Error('Cannot reduce stock below zero');
    }

    // Update item quantity
    const [result] = await connection.query(
      'UPDATE inventory_items SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
      [newQuantity, req.params.id]
    );

    // Record history
    await connection.query(
      `INSERT INTO stock_history 
       (item_id, action, quantity_change, new_quantity, reason, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.id,
        action,
        quantity,
        newQuantity,
        reason || 'stock_adjustment',
        notes || null,
        created_by
      ]
    );

    await connection.commit();

    const [updatedItem] = await db.query('SELECT * FROM inventory_items WHERE id = ?', [req.params.id]);
    res.json(updatedItem[0]);
  } catch (err) {
    await connection.rollback();
    console.error('POST /items/:id/adjust-stock Error:', err.message);
    res.status(500).json({ error: 'Failed to adjust stock', details: err.message });
  } finally {
    connection.release();
  }
});

// Get item history
app.get('/items/:id/history', async (req, res) => {
  try {
    const [history] = await db.query(
      'SELECT * FROM stock_history WHERE item_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(history);
  } catch (err) {
    console.error('GET /items/:id/history Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// 3. INVENTORY ANALYTICS ENDPOINTS

// Get company statistics
app.get('/companies/:id/stats', async (req, res) => {
  try {
    // Get total items count
    const [itemCount] = await db.query(
      'SELECT COUNT(*) as count FROM inventory_items WHERE company_id = ?',
      [req.params.id]
    );

    // Get total inventory value
    const [totalValue] = await db.query(
      'SELECT SUM(quantity * unit_price) as total FROM inventory_items WHERE company_id = ?',
      [req.params.id]
    );

    // Get low stock count
    const [lowStock] = await db.query(
      `SELECT COUNT(*) as count FROM inventory_items 
       WHERE company_id = ? AND quantity <= low_stock_threshold AND quantity > 0`,
      [req.params.id]
    );

    // Get out of stock count
    const [outOfStock] = await db.query(
      'SELECT COUNT(*) as count FROM inventory_items WHERE company_id = ? AND quantity = 0',
      [req.params.id]
    );

    // Get top items by value
    const [topItems] = await db.query(
      `SELECT * FROM inventory_items 
       WHERE company_id = ? 
       ORDER BY (quantity * unit_price) DESC 
       LIMIT 5`,
      [req.params.id]
    );

    // Get stock distribution
    const [stockDist] = await db.query(
      `SELECT 
        SUM(CASE WHEN quantity > low_stock_threshold THEN 1 ELSE 0 END) as in_stock,
        SUM(CASE WHEN quantity <= low_stock_threshold AND quantity > 0 THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock
       FROM inventory_items WHERE company_id = ?`,
      [req.params.id]
    );

    res.json({
      itemCount: itemCount[0].count,
      totalValue: totalValue[0].total || 0,
      lowStockCount: lowStock[0].count,
      outOfStockCount: outOfStock[0].count,
      topItems,
      stockDistribution: stockDist[0]
    });
  } catch (err) {
    console.error('GET /companies/:id/stats Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get global inventory statistics
app.get('/inventory/stats', async (req, res) => {
  try {
    // Total companies
    const [companyCount] = await db.query('SELECT COUNT(*) as count FROM companies');
    
    // Total items across all companies
    const [totalItems] = await db.query('SELECT COUNT(*) as count FROM inventory_items');
    
    // Total inventory value
    const [totalValue] = await db.query('SELECT SUM(quantity * unit_price) as total FROM inventory_items');
    
    // Low stock items
    const [lowStock] = await db.query(
      `SELECT COUNT(*) as count FROM inventory_items 
       WHERE quantity <= low_stock_threshold AND quantity > 0`
    );
    
    // Recent items
    const [recentItems] = await db.query(
      `SELECT i.*, c.name as company_name 
       FROM inventory_items i
       JOIN companies c ON i.company_id = c.id
       ORDER BY i.last_updated DESC 
       LIMIT 10`
    );

    res.json({
      totalCompanies: companyCount[0].count,
      totalItems: totalItems[0].count,
      totalInventoryValue: totalValue[0].total || 0,
      lowStockItems: lowStock[0].count,
      recentItems
    });
  } catch (err) {
    console.error('GET /inventory/stats Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch inventory statistics' });
  }
});

// Export company inventory
app.get('/companies/:id/export', async (req, res) => {
  try {
    // Get company info
    const [companies] = await db.query('SELECT * FROM companies WHERE id = ?', [req.params.id]);
    
    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get all items
    const [items] = await db.query(
      `SELECT 
        name, category, quantity, unit, unit_price, 
        description, sku, low_stock_threshold, last_updated,
        (quantity * unit_price) as total_value,
        CASE 
          WHEN quantity = 0 THEN 'Out of Stock'
          WHEN quantity <= low_stock_threshold THEN 'Low Stock'
          ELSE 'In Stock'
        END as stock_status
       FROM inventory_items 
       WHERE company_id = ?`,
      [req.params.id]
    );

    const exportData = {
      company: companies[0],
      exportDate: new Date().toISOString(),
      totalItems: items.length,
      totalValue: items.reduce((sum, item) => sum + (item.total_value || 0), 0),
      items: items
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${companies[0].name.replace(/\s+/g, '_')}_inventory_${new Date().toISOString().split('T')[0]}.json"`);
    
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    console.error('GET /companies/:id/export Error:', err.message);
    res.status(500).json({ error: 'Failed to export inventory' });
  }
});

// ========== TEST INVENTORY DATA ==========
app.get('/inventory/test-data', async (req, res) => {
  try {
    // Create test companies if they don't exist
    const [companies] = await db.query('SELECT COUNT(*) as count FROM companies');
    
    if (companies[0].count === 0) {
      // Create test companies
      await db.query(`
        INSERT INTO companies (name, email, phone, address, notes) VALUES
        ('ABC Corporation', 'contact@abccorp.com', '+63 912 345 6789', '123 Business Ave, Makati City', 'Regular customer, bulk orders'),
        ('XYZ Distributors', 'orders@xyzdis.com', '+63 917 654 3210', '456 Trade St, Quezon City', 'Wholesale distributor'),
        ('Sample Corp', 'sample@corp.com', '+63 900 000 0000', '789 Sample St, Sample City', 'Sample company for testing')
      `);
      
      // Get company IDs
      const [companyList] = await db.query('SELECT id FROM companies ORDER BY id');
      
      // Create test items
      await db.query(`
        INSERT INTO inventory_items (company_id, name, category, quantity, unit, unit_price, description, sku, low_stock_threshold) VALUES
        (?, 'Premium Water Bottles', 'Finished Goods', 500, 'pcs', 25.50, '500ml premium drinking water', 'WB-500-PRE', 100),
        (?, 'Water Gallon Containers', 'Packaging', 200, 'pcs', 80.00, '5-gallon water containers', 'GC-5GAL', 50),
        (?, 'Mineral Water Cases', 'Finished Goods', 25, 'cases', 350.00, '24 bottles per case', 'MW-CASE24', 10),
        (?, 'Sample Product A', 'Finished Goods', 100, 'pcs', 50.00, 'Sample product description', 'SAMPLE-001', 20),
        (?, 'Sample Product B', 'Raw Materials', 500, 'kg', 15.75, 'Raw material sample', 'SAMPLE-002', 100),
        (?, 'Sample Product C', 'Packaging', 5, 'boxes', 120.00, 'Low stock sample', 'SAMPLE-003', 10)
      `, [
        companyList[0].id, companyList[0].id, 
        companyList[1].id, 
        companyList[2].id, companyList[2].id, companyList[2].id
      ]);
      
      // Update company item counts
      await db.query('UPDATE companies SET item_count = 2 WHERE id = ?', [companyList[0].id]);
      await db.query('UPDATE companies SET item_count = 1 WHERE id = ?', [companyList[1].id]);
      await db.query('UPDATE companies SET item_count = 3 WHERE id = ?', [companyList[2].id]);
    }
    
    res.json({ success: true, message: 'Test data created/verified' });
  } catch (err) {
    console.error('GET /inventory/test-data Error:', err.message);
    res.status(500).json({ error: 'Failed to create test data', details: err.message });
  }
});
// Debug endpoint to check database status
app.get('/debug/db-status', async (req, res) => {
  try {
    // Check all tables
    const [tables] = await db.query("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    const tableDetails = {};
    
    for (const tableName of tableNames) {
      const [columns] = await db.query(`SHOW COLUMNS FROM ${tableName}`);
      const [rowCount] = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const [sampleData] = await db.query(`SELECT * FROM ${tableName} LIMIT 5`);
      
      tableDetails[tableName] = {
        columns: columns.map(c => c.Field),
        rowCount: rowCount[0].count,
        sampleData: sampleData
      };
    }
    
    res.json({
      database: process.env.DB_NAME || 'pos_db',
      tables: tableNames,
      details: tableDetails
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/companies', async (req, res) => {
  console.log('\n📝 ========== CREATE COMPANY REQUEST ==========');
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('Headers:', req.headers);
  
  try {
    const { name, email, phone, address, notes } = req.body;
    
    console.log('Parsed data:', { name, email, phone, address, notes });
    
    if (!name) {
      console.log('❌ Validation failed: Name is required');
      return res.status(400).json({ 
        error: 'Company name is required',
        received_data: req.body
      });
    }
    
    console.log('📊 Checking current companies in database...');
    
    // First check what's already in the database
    const [existingCompanies] = await db.query('SELECT * FROM companies');
    console.log(`Currently ${existingCompanies.length} companies in database`);
    
    // Insert the new company
    console.log('💾 Inserting into database...');
    const [result] = await db.query(
      'INSERT INTO companies (name, email, phone, address, notes) VALUES (?, ?, ?, ?, ?)',
      [name, email || null, phone || null, address || null, notes || null]
    );
    
    console.log(`✅ Company inserted with ID: ${result.insertId}`);
    
    // Verify the insertion
    const [newCompany] = await db.query('SELECT * FROM companies WHERE id = ?', [result.insertId]);
    
    if (newCompany.length === 0) {
      console.log('❌ Failed to retrieve inserted company!');
      return res.status(500).json({ error: 'Failed to retrieve created company' });
    }
    
    console.log('✅ Retrieved company from database:', newCompany[0]);
    
    // Check again how many companies are in DB
    const [updatedCompanies] = await db.query('SELECT COUNT(*) as count FROM companies');
    console.log(`📊 Now ${updatedCompanies[0].count} companies in database`);
    
    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      company: newCompany[0],
      totalCompanies: updatedCompanies[0].count
    });
    
  } catch (err) {
    console.error('\n❌ CREATE COMPANY ERROR:', err.message);
    console.error('MySQL Error Code:', err.code);
    console.error('MySQL Error Message:', err.sqlMessage);
    console.error('Full error:', err);
    
    // Check specific error types
    if (err.code === 'ER_NO_SUCH_TABLE') {
      console.error('⚠️ Table "companies" does not exist!');
      console.error('Creating table now...');
      
      try {
        await db.query(`
          CREATE TABLE IF NOT EXISTS companies (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(50),
            address TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Created companies table');
        
        // Retry the request
        return res.redirect(307, req.originalUrl);
      } catch (createErr) {
        console.error('Failed to create table:', createErr.message);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to create company',
      details: err.message,
      mysql_code: err.code,
      mysql_message: err.sqlMessage
    });
  }
});
// Debug endpoint for companies specifically
app.get('/debug/companies', async (req, res) => {
  try {
    // Check what companies table exists
    const [tables] = await db.query("SHOW TABLES LIKE 'companies'");
    
    if (tables.length === 0) {
      return res.json({ error: 'companies table does not exist' });
    }
    
    // Check structure
    const [columns] = await db.query("SHOW COLUMNS FROM companies");
    const [count] = await db.query("SELECT COUNT(*) as total FROM companies");
    const [companies] = await db.query("SELECT * FROM companies ORDER BY id DESC LIMIT 10");
    
    res.json({
      tableExists: true,
      structure: columns.map(c => ({
        name: c.Field,
        type: c.Type,
        nullable: c.Null === 'YES',
        default: c.Default
      })),
      totalCompanies: count[0].total,
      recentCompanies: companies
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Products: http://localhost:${PORT}/products`);
  console.log(`💰 Sales: http://localhost:${PORT}/sales`);
    console.log(`🏢 Inventory API: http://localhost:${PORT}/companies`);
  console.log(`🧪 Sales Test: http://localhost:${PORT}/sales-test`);
  console.log(`🔍 Check Tables: http://localhost:${PORT}/check-tables`);
});