const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// PostgreSQL Connection Setup
const pool = new Pool({
  user: 'postgres',      // Replace with your DB user
  host: 'localhost',         // Replace with your DB host
  database: 'Traceability',  // Replace with your DB name
  password: 'robis@123',  // Replace with your DB password
  port: 5432,                // PostgreSQL default port
});

app.post('/api/stock', async (req, res) => {
  console.log('Incoming request body:', req.body); // Add this line
  try {
    const {
      model,
      variant,
      part_description,
      fg_barcode,
      shift,
      process,
      inward_data,
      inward_time,
      inward_count,
      outward_data,
      outward_time,
      outward_count,
      remaining_count,
      batch_num,
      stator_count,
      rotor_count
    } = req.body;

    // SQL query to insert data into the table
    const query = `
      INSERT INTO data_traceability (
        model, variant, part_description, fg_barcode, shift, process, inward_date, inward_time, inward_count, outward_date, outward_time, outward_count, remaining_count, batch_num, stator_count, rotor_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *;
    `;

    const values = [
      model,
      variant,
      part_description,
      fg_barcode,
      shift,
      process,
      inward_data,
      inward_time,
      inward_count,
      outward_data,
      outward_time,
      outward_count,
      remaining_count,
      batch_num,
      stator_count,
      rotor_count
    ];

    // Execute query
    const result = await pool.query(query, values);

    // Send response
    res.status(201).json({
      message: 'Data successfully inserted!',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error inserting data:', error.message);
    res.status(500).json({ error: 'Failed to insert data' });
  }
});

  
  // Start the Server
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });