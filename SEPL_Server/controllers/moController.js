const { Pool } = require("pg"); // PostgreSQL package
const express = require('express');
const router = express.Router();
require('dotenv').config();

// Database connection configuration for PostgreSQL
const pool = new Pool({
  user: 'PostgreAWS',       // Database username
  host: 'awspostgredb.celv4zrdnxgf.ap-south-1.rds.amazonaws.com',       // Database host
  database: 'SEPL',   // Database name
  password: 'Robis1234', // Database password
  port: process.env.DB_PORT, 
  ssl: {
    rejectUnauthorized: false // Set to true if you have a valid SSL certificate
  }               // Default PostgreSQL port
 
});

function hourFilterWithMissingHours(data) {
  const hourlySums = Array.from({ length: 24 }, (_, hour) => ({
    hour: hour.toString().padStart(2, '0'),
    rotor_sum: 0,
    stator_sum: 0,
  }));

  data.forEach((datum) => {
    let hour = datum.cycle_time_end.split(":")[0]; // Extract hour from time
    let hourIndex = parseInt(hour, 10); // Convert hour to an integer

    // Update the sums for the respective hour
    hourlySums[hourIndex].rotor_sum += datum.rotor_count;
    hourlySums[hourIndex].stator_sum += datum.stator_count;
  });

  const hourlyLabels = hourlySums.map((entry) => `${entry.hour}:00`);
  return { hourlyLabels, hourlySums };
}

const fetchTableData = async (tableName, date) => {
  const query = `
    SELECT 
      date,
      cycle_time_end,
      stator_count,
      rotor_count
    FROM ${tableName}
    WHERE date = $1
    ORDER BY cycle_time_end;
  `;

  try {
    const result = await pool.query(query, [date]);
    console.log(`Fetched ${result.rowCount} rows from table ${tableName} for date ${date}.`);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching data from table ${tableName}:`, error.message);
    throw error;
  }
};

router.post('/:stationName/groupby', async (req, res) => {
  const { stationName } = req.params; // Extract station name from the route parameter
  const { date } = req.body; // Extract date from the request body

  // Validate input
  if (!stationName || !date) {
    return res.status(400).json({ message: "Station name and date are required" });
  }

  // Validate station name to prevent SQL injection
  const validStations = ['stamping_station_a', 'stamping_station_b'];
  if (!validStations.includes(stationName)) {
    return res.status(400).json({ message: "Invalid station name" });
  }

  try {
    // Fetch data from the specified table
    const data = await fetchTableData(stationName, date);

    // Process data (e.g., group by hour using your custom function)
    const { hourlyLabels, hourlySums } = hourFilterWithMissingHours(data);

    res.json({
      station: stationName,
      date: date,
      hourlyLabels,
      hourlySums,
    });
  } catch (error) {
    console.error(`Error in endpoint /${stationName}/groupby:`, error.message);
    res.status(500).json({ message: "Failed to fetch grouped data", error: error.message });
  }
});



// Main function to log in, fetch data, and compareq
const processData = async () => {
  await fetch_Stamping_Station_A_Data();
};

module.exports = { processData, router };

