const { Pool } = require("pg"); // PostgreSQL package
const express = require('express');
const router = express.Router();
require('dotenv').config();
 
// Database connection configuration for PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,       // Database username
    host: process.env.DB_HOST,       // Database host
    database: process.env.DB_NAME,   // Database name
    password: process.env.DB_PASSWORD, // Database password
    port: process.env.DB_PORT,
    ssl: {
      rejectUnauthorized: false // Set to true if you have a valid SSL certificate
    }               // Default PostgreSQL port
   
  });

// Fetch continuity test data for both tables
const fetchData = async (stationName, date) => {
  const validStations = ['sp_test_auto', 'sp_test_manual'];
  
  if (!validStations.includes(stationName)) {
      throw new Error("Invalid station name");
  }

  const query = `
      SELECT 
          '${stationName}' AS station, 
          date, 
          cycle_time_end, 
          ok_count, 
          ng_count 
      FROM ${stationName}
      WHERE date = $1
      ORDER BY cycle_time_end;
  `;

  try {
      const result = await pool.query(query, [date]);
      const data = result.rows;

      // Initialize hourly data
      let hourlyData = Array(24).fill().map((_, i) => ({
          hour: i,
          ok_count: 0,
          ng_count: 0
      }));

      // Process data and store last ok_count/ng_count per hour
      data.forEach(row => {
          const hour = parseInt(row.cycle_time_end.split(':')[0], 10);  // Extract hour from "HH:MM:SS"
          if (hour >= 0 && hour < 24) {
              hourlyData[hour] = {
                  hour,
                  ok_count: row.ok_count,
                  ng_count: row.ng_count
              };
          }
      });

      // Generate hourly labels
      const hourlyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

      return {
          station: stationName,
          date: date,
          hourlyLabels,
          hourlySums: hourlyData
      };

  } catch (error) {
      console.error("Error fetching data:", error.message);
      throw error;
  }
};

// API route to fetch hourly data for a specific station
router.post('/:stationName/hourly', async (req, res) => {
  const { stationName } = req.params;
  const { date } = req.body;

  if (!date) {
      return res.status(400).json({ message: "Date is required" });
  }

  try {
      const hourlySums = await fetchData(stationName, date);
      res.json(hourlySums);
  } catch (error) {
      console.error("Error processing the request:", error.message);
      res.status(500).json({ message: "Internal Server Error" });
  }
});
const fetchShiftData = async (stationName, date) => {
  const query = `
      WITH ranked_data AS (
          SELECT 
              $1 AS station, 
              shift, 
              ok_count, 
              ng_count, 
              ROW_NUMBER() OVER (PARTITION BY shift ORDER BY cycle_time_end DESC) AS rn
          FROM ${stationName}
          WHERE date = $2
      )
      SELECT station, shift, ok_count, ng_count 
      FROM ranked_data 
      WHERE rn = 1;
  `;

  try {
      const result = await pool.query(query, [stationName, date]);
      const data = result.rows;

      // Initialize shift-wise data with default values
      let shiftData = {
          'Shift A': { ok_count: 0, ng_count: 0 },
          'Shift B': { ok_count: 0, ng_count: 0 },
          'Shift C': { ok_count: 0, ng_count: 0 }
      };

      // Process the fetched data and update the shift sums
      data.forEach(row => {
          if (shiftData[`Shift ${row.shift}`]) {
              shiftData[`Shift ${row.shift}`] = {
                  ok_count: row.ok_count,
                  ng_count: row.ng_count
              };
          }
      });

      // Prepare the shiftSums array and shiftLabels
      const shiftSums = Object.keys(shiftData).map(shift => ({
          shift,
          ok_count: shiftData[shift].ok_count,
          ng_count: shiftData[shift].ng_count
      }));

      const shiftLabels = Object.keys(shiftData);

      return {
          station: stationName,
          date: date,
          shiftLabels: shiftLabels,
          shiftSums: shiftSums
      };

  } catch (error) {
      console.error("Error fetching shift-wise data:", error.message);
      throw error;
  }
};

// API route to fetch shift-wise data
router.post('/:stationName/shiftWise', async (req, res) => {
  const { stationName } = req.params;
  const { date } = req.body;

  if (!date) {
      return res.status(400).json({ message: "Date is required" });
  }

  const validStations = ['sp_test_auto', 'sp_test_manual'];  // Include valid stations
  if (!validStations.includes(stationName)) {
      return res.status(400).json({ message: "Invalid station" });
  }

  try {
      const shiftSums = await fetchShiftData(stationName, date);
      res.json(shiftSums);
  } catch (error) {
      console.error("Error processing the request:", error.message);
      res.status(500).json({ message: "Internal Server Error" });
  }
});

const fetchDayWiseData = async (stationName, fromDate, toDate) => {
  const query = `
      WITH ranked_data AS (
          SELECT 
              date, 
              ok_count, 
              ng_count, 
              ROW_NUMBER() OVER (
                  PARTITION BY date ORDER BY cycle_time_end DESC, id DESC  -- Ensure the absolute last row is picked
              ) AS rn
          FROM ${stationName}
          WHERE date BETWEEN $1 AND $2
      )
      SELECT date, ok_count, ng_count 
      FROM ranked_data 
      WHERE rn = 1;
  `;

  try {
      const result = await pool.query(query, [fromDate, toDate]);
      const data = result.rows;

      // Generate all dates in the given range
      let dailyAggregates = [];
      let dailyLabels = [];
      let currentDate = new Date(fromDate);
      let endDate = new Date(toDate);

      while (currentDate <= endDate) {
          let nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + 1); // Add 1 to the date

          const formattedDate = nextDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
          dailyLabels.push(formattedDate);
          dailyAggregates.push({ date: formattedDate, ok_count: 0, ng_count: 0 }); // Default values
          currentDate.setDate(currentDate.getDate() + 1); // Move to next day
      }

      // Fill in actual data
      data.forEach(row => {
          let nextDate = new Date(row.date);
          nextDate.setDate(nextDate.getDate() + 1); // Add 1 to the existing date

          const formattedDate = nextDate.toISOString().split('T')[0];
          const index = dailyAggregates.findIndex(d => d.date === formattedDate);
          if (index !== -1) {
              dailyAggregates[index].ok_count = row.ok_count;
              dailyAggregates[index].ng_count = row.ng_count;
          }
      });

      return {
          station: stationName,
          fromDate,
          toDate,
          dailyLabels,
          dailyAggregates
      };

  } catch (error) {
      console.error("Error fetching day-wise data:", error.message);
      throw error;
  }
};

// **API route to fetch day-wise data**
router.post('/:stationName/daywise', async (req, res) => {
  const { stationName } = req.params;
  const { fromDate, toDate } = req.body;

  if (!fromDate || !toDate) {
      return res.status(400).json({ message: "fromDate and toDate are required" });
  }

  try {
      const dayWiseData = await fetchDayWiseData(stationName, fromDate, toDate);
      res.json(dayWiseData);
  } catch (error) {
      console.error("Error processing the request:", error.message);
      res.status(500).json({ message: "Internal Server Error" });
  }
});


  router.post('/:stationName/monthWise', async (req, res) => {
    const { stationName } = req.params;
    const { fromMonth, fromYear, toMonth, toYear } = req.body;

    try {
        // Query to fetch month-wise data
        const query = `
            SELECT 
                TO_CHAR(date, 'Mon YYYY') AS month,
                ok_count, 
                ng_count
            FROM ${stationName}
            WHERE date >= TO_DATE($2 || '-' || $1, 'YYYY-MM')  
            AND date <= (DATE_TRUNC('MONTH', TO_DATE($4 || '-' || $3, 'YYYY-MM')) + INTERVAL '1 MONTH - 1 day')
            ORDER BY date ASC
        `;

        const result = await pool.query(query, [fromMonth, fromYear, toMonth, toYear]);

        // Organizing data month-wise
        const monthMap = new Map();

        result.rows.forEach(row => {
            const { month, ok_count, ng_count } = row;

            if (!monthMap.has(month)) {
                monthMap.set(month, []);
            }
            monthMap.get(month).push({ ok_count, ng_count });
        });

        // Finding last entry for each month
        const monthSums = [];
        const monthLabels = [];

        // Generate all months in the range
        let startDate = new Date(fromYear, fromMonth - 1, 1);
        let endDate = new Date(toYear, toMonth - 1, 1);

        while (startDate <= endDate) {
            let monthStr = startDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
            monthLabels.push(monthStr);

            const monthData = monthMap.get(monthStr);
            if (monthData && monthData.length > 0) {
                let lastEntry = monthData[monthData.length - 1]; // Last entry
                monthSums.push({ month: monthStr, ok_count: lastEntry.ok_count, ng_count: lastEntry.ng_count });
            } else {
                monthSums.push({ month: monthStr, ok_count: 0, ng_count: 0 });
            }

            startDate.setMonth(startDate.getMonth() + 1); // Move to next month
        }

        // Return the formatted response
        return res.json({
            station: stationName,
            monthLabels,
            monthSums
        });

    } catch (error) {
        console.error('Error fetching month-wise data:', error);
        return res.status(500).json({ error: 'Failed to fetch month-wise data' });
    }
});

  

  module.exports = router;