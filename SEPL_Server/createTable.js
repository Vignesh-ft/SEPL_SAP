// createTable.js
const client = require('./config/dbConfig'); // Import the database client

const createTables = async () => {
  try {
    await client.connect();
    console.log("Connected to the database...");

    // SQL query to create tables with foreign keys
    const query = `
    -- Create ct_pf_pickreceipt table
    CREATE TABLE IF NOT EXISTS ct_pf_pickreceipt (
        id SERIAL PRIMARY KEY,
        object TEXT NOT NULL,
        status TEXT NOT NULL,
        u_date TIMESTAMP NOT NULL,
        with_defaults BOOLEAN NOT NULL,
        udf_shift_date TIMESTAMP,
        udf_shift_type TEXT,
        udf_pick_receipt INTEGER
    );

    -- Create required_items table with foreign key reference to ct_pf_pickreceipt
    CREATE TABLE IF NOT EXISTS required_items (
        id SERIAL PRIMARY KEY,
        pickreceipt_id INTEGER REFERENCES ct_pf_pickreceipt(id) ON DELETE CASCADE,
        u_doc_type TEXT,
        u_item_code TEXT NOT NULL,
        u_planned_qty FLOAT,
        u_receipted_qty FLOAT,
        u_picked_qty FLOAT,
        u_dst_whs_code TEXT,
        u_acc_code TEXT,
        u_base_type TEXT,
        u_base_entry INTEGER,
        u_base_line_no INTEGER,
        u_base_ref TEXT,
        u_ref_line INTEGER,
        u_revision_code TEXT,
        u_price FLOAT,
        u_line_num INTEGER,
        with_defaults BOOLEAN NOT NULL
    );

    -- Create picked_items table with foreign key reference to required_items
    CREATE TABLE IF NOT EXISTS picked_items (
        id SERIAL PRIMARY KEY,
        required_item_id INTEGER REFERENCES required_items(id) ON DELETE CASCADE,
        u_item_code TEXT NOT NULL,
        u_lic_plate_item_code INTEGER,
        u_revision TEXT,
        u_receipted TEXT,
        u_bn_dist_number TEXT,
        u_quantity FLOAT,
        u_bn_in_date TIMESTAMP,
        u_bn_mnf_date TIMESTAMP,
        u_bn_exp_date TIMESTAMP,
        u_bn_exp_time TIMESTAMP,
        u_bn_w_exp_date TIMESTAMP,
        u_bn_cons_date TIMESTAMP,
        u_bn_w_cons_date TIMESTAMP,
        u_bn_insp_date TIMESTAMP,
        u_bn_l_insp_date TIMESTAMP,
        u_bn_n_insp_date TIMESTAMP,
        u_bn_status TEXT,
        u_bn_qc_status TEXT,
        u_sup_number TEXT,
        u_best_bef_date TIMESTAMP
    );
    `;

    // Execute the query
    await client.query(query);
    console.log("Tables created successfully with foreign keys!");

  } catch (error) {
    console.error("Error creating tables:", error.message);
  } finally {
    // Close the database connection
    await client.end();
    console.log("Database connection closed.");
  }
};

// Run the function
createTables();