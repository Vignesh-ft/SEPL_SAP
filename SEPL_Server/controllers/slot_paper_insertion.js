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


    const fetchData = async (tableName, date) => {
    const query = `
  SELECT
    date,
    cycle_time_end,
    ok_count AS rotor_count -- Alias to match expected property
  FROM ${tableName}
  WHERE date = $1
  ORDER BY cycle_time_end;
`;

    try {
      const result = await pool.query(query, [date]);
      return result.rows; // Return the raw data
    } catch (error) {
      console.error("Error fetching data from continuity_test:", error.message);
      throw error;
    }
  };

  //hourly
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
      hourlySums[hourIndex].rotor_sum += datum.rotor_count || 0; // Use 0 if null
      hourlySums[hourIndex].stator_sum += datum.stator_count || 0; // Use 0 if null
    });
  
    const hourlyLabels = hourlySums.map((entry) => `${entry.hour}:00`);
    return { hourlyLabels, hourlySums };
  }
  
  router.post('/:stationName/hourly', async (req, res) => {
    const { stationName } = req.params; // Extract station name from the route parameter
    const { date } = req.body; // Extract date from the request body
  
    // Validate input
    if (!stationName || !date) {
      return res.status(400).json({ message: "Station name and date are required" });
    }
  
    console.log
    // Validate station name to prevent SQL injection
    const validStations = ['slot_paper_insertion_auto', 'slot_paper_insertion_mannual'];
    if (!validStations.includes(stationName)) {
      return res.status(400).json({ message: "Invalid station name" });
    }
  
    try {
      // Fetch raw data from the specified table
      const rawData = await fetchData(stationName, date);
  
      // Process data with the hourFilterWithMissingHours function
      const { hourlyLabels, hourlySums } = hourFilterWithMissingHours(rawData);
  
      res.json({
        station: stationName,
        date: date,
        hourlyLabels,
        hourlySums,
      });
    } catch (error) {
      console.error(`Error in endpoint /${stationName}/hourly:`, error.message);
      res.status(500).json({ message: "Failed to fetch hourly data", error: error.message });
    }
  });

  //daywise
  const fetchTableForDay = async (stationName, fromDate, toDate) => {
 
    // Format the dates for comparison
    const formatDate = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`; // Normalize to YYYY-MM-DD format (no time)
    };
   
   
    const query = `
      SELECT date, ok_count
      FROM ${stationName}
      WHERE date::date BETWEEN $1 AND $2
      ORDER BY date;
    `;
   
    try {
        // Adjust date to handle time zone difference
        const fromDateAdjusted = new Date(fromDate); // Convert string to Date object
        fromDateAdjusted.setUTCHours(0, 0, 0, 0); // Set to midnight UTC
   
        const toDateAdjusted = new Date(toDate);
        toDateAdjusted.setUTCHours(23, 59, 59, 999); // Set to the end of the day UTC
   
        // Fetch data using the adjusted dates
        const result = await pool.query(query, [fromDateAdjusted, toDateAdjusted]);
   
      return result.rows;
    } catch (error) {
      console.error(`Error fetching data from table ${stationName}:`, error.message);
      throw error;
    }
  };

  function dateFilterWithMissingDates(data, fromDate, toDate) {
    const dailySums = {};
  
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  
    const formatDate = (date) => date.toISOString().split('T')[0];
  
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const formattedDate = formatDate(currentDate);
      dailySums[formattedDate] = {
        rotor_sum: 0,
        stator_sum: 0,
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    data.forEach((datum) => {
      const date = formatDate(new Date(datum.date)); // Convert to YYYY-MM-DD format
  
      if (dailySums[date]) {
        dailySums[date].rotor_sum += datum.ok_count; // Use `ok_count` for rotor_sum
        dailySums[date].stator_sum += datum.ng_count; // Use `ng_count` for stator_sum
      }
    });
  
    const dailyLabels = Object.keys(dailySums);
    const dailyAggregates = dailyLabels.map((date) => ({
      date,
      rotor_sum: dailySums[date].rotor_sum,
      stator_sum: dailySums[date].stator_sum,
    }));
  
    return { dailyLabels, dailyAggregates };
  }  

  router.post('/:stationName/dayWise', async (req, res) => {
    const { stationName } = req.params;
    const { fromDate, toDate } = req.body;
   
    if (!stationName || !fromDate || !toDate) {
      return res.status(400).json({ message: "Station name, fromDate, and toDate are required" });
    }
   
    const validStations = ['slot_paper_insertion_auto', 'slot_paer_insertion_mannual'];
    if (!validStations.includes(stationName)) {
      return res.status(400).json({ message: "Invalid station name" });
    }
   
    // Helper function to add one day to a date
    const addOneDay = (date) => {
      const d = new Date(date);
      d.setDate(d.getDate() + 1); // Add one day
      return d.toISOString().split('T')[0]; // Return in YYYY-MM-DD format
    };
   
    try {
      // Fetch the data for the specified date range
      const data = await fetchTableForDay(stationName, fromDate, toDate);
   
      // Process the data for daily aggregation
      const { dailyLabels, dailyAggregates } = dateFilterWithMissingDates(data, fromDate, toDate);
   
      // Add one day to fromDate, toDate and all dailyLabels
      const updatedFromDate = addOneDay(fromDate);
      const updatedToDate = addOneDay(toDate);
      const updatedDailyLabels = dailyLabels.map(date => addOneDay(date));
      dailyAggregates.map((data, index)=> {
        data.date = updatedDailyLabels[index]
      })
   
   
      res.json({
        station: stationName,
        fromDate: updatedFromDate,
        toDate: updatedToDate,
        dailyLabels: updatedDailyLabels,
        dailyAggregates
      });
    } catch (error) {
      console.error(`Error in endpoint /${stationName}/groupby:`, error.message);
      res.status(500).json({ message: "Failed to fetch daily grouped data", error: error.message });
    }
  });


module.exports = router;