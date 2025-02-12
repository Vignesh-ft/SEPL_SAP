const { Client } = require('pg');

const sourceDbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'SAP',
  password: 'robis@123',
  port: 5432,
};

const targetDbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'Backup',
  password: 'robis@123',
  port: 5432,
};

const fetchDataAndInsert = async () => {
    const sourceClient = new Client(sourceDbConfig);
    const targetClient = new Client(targetDbConfig);
  
    try {
      await sourceClient.connect();
      await targetClient.connect();
  
      const res = await sourceClient.query('SELECT * FROM fg_packing_station');
      const rows = res.rows;
  
      let index = 0;
      const interval = setInterval(async () => {
        if (index >= rows.length) {
          clearInterval(interval);
          console.log('All data transferred successfully');
          await sourceClient.end();
          await targetClient.end();
          return;
        }
  
        const row = rows[index];
        try {
          await targetClient.query(
            `INSERT INTO fg_packing_station (id, model, variant, part_description, motor_barcode, fg_barcode, date, shift, time_cycle_end, process_time, set_box_count, ok_count, completed_count, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [row.id, row.model, row.variant, row.part_description, row.motor_barcode, row.fg_barcode, row.date, row.shift, row.time_cycle_end, row.process_time, row.set_box_count, row.ok_count, row.completed_count, row.status]
          );
          console.log(`Data transferred for row ${index + 1}`);
        } catch (err) {
          console.error(`Error inserting row ${index + 1}:`, err);
        }
        index++;
      }, 1000);
    } catch (err) {
      console.error('Error during data transfer:', err);
      await sourceClient.end();
      await targetClient.end();
    }
  };
  
  fetchDataAndInsert();
