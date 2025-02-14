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
    } // Default PostgreSQL port
});


const fetchData = async (tableName, date, stationName) => {
  const query = `
      SELECT 
          outward_date, 
          outward_time, 
          outward_count 
      FROM ${tableName}
      WHERE outward_date = $1
      ORDER BY outward_time;
  `;

  try {
      const result = await pool.query(query, [date]);
      const data = result.rows;

      
      // Initialize hourlyData with all hours set to 0
      let hourlyData = [];
      for (let i = 0; i < 24; i++) {
          hourlyData.push({ hour: i, outward_count: 0 });
      }

      // Loop through the data and update outward_count for each hour (store last value)
      for (let row of data) {
          const fullDate = new Date(row.outward_date);
          const fullDateTime = new Date(`${fullDate.toISOString().split('T')[0]}T${row.outward_time}`);

          const hour = fullDateTime.getHours();

          // Ensure the hour is valid
          if (hour >= 0 && hour < 24) {
              hourlyData[hour].outward_count = row.outward_count;  // Replace previous value with the latest one
          } else {
              console.error("Invalid hour:", hour);
          }
      }

      // Hourly labels formatted as "HH:00"
      const hourlyLabels = Array.from({ length: 24 }, (_, i) => {
          return String(i).padStart(2, '0') + ":00";
      });

      // Return the structured response
      return {
          stationName: stationName,
          date: date,
          hourlyLabels: hourlyLabels,
          hourlyData: hourlyData
      };

  } catch (error) {
      console.error("Error fetching data:", error.message);
      throw error;
  }
};


router.post('/:stationName/hourly', async (req, res) => {
  const { stationName } = req.params;
  const { date } = req.body;

  // Validate input
  if (!stationName || !date) {
    return res.status(400).json({ message: "Station and date are required" });
  }

  // Validate station name to prevent SQL injection
  const validStations = ['fg_stocktable_outward'];  // Add more valid station names if needed
  if (!validStations.includes(stationName)) {
    return res.status(400).json({ message: "Invalid station" });
  }

  try {
    const hourlySums = await fetchData(stationName, date); 

    // If hourlySums is an object with `hourlyData`, access that array
    const hourlyData = hourlySums.hourlyData || [];

    if (hourlyData.length === 0) {
      return res.status(404).json({ message: "No data found for the given date" });
    }

    // Prepare hourlyLabels
    const hourlyLabels = [
      "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", 
      "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", 
      "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
    ];

    // Initialize the hourlySums structure
    const formattedHourlySums = hourlyLabels.map(hour => ({
      hour: hour,  // Maintain the hour label (string format)
      outward_count: 0  // Initialize with 0
    }));

    // Fill in the count_sum based on hourlyData
    hourlyData.forEach(data => {
      const hourIndex = data.hour;  // Assuming `data.hour` is a number from 0-23
      if (hourIndex >= 0 && hourIndex < 24) {
        const formattedHour = String(hourIndex).padStart(2, '0');  // Format hour as a 2-digit string
        formattedHourlySums[hourIndex].hour = formattedHour;  // Update the hour in formattedHourlySums
        formattedHourlySums[hourIndex].outward_count = data.outward_count;  // Assign ok_count to the corresponding hour
      }
    });

    // Format the response
    const responseData = {
      station: stationName,
      date: date,
      hourlyLabels: hourlyLabels,
      hourlySums: formattedHourlySums
    };

    res.json(responseData);

  } catch (error) {
    console.error("Error processing the request:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
const fetchDayWiseData = async (tableName, fromDate, toDate, stationName) => {
  const query = `
      SELECT 
          outward_date, 
          outward_time, 
          outward_count 
      FROM ${tableName}
      WHERE outward_date BETWEEN $1 AND $2
      ORDER BY outward_date, outward_time;
  `;

  try {
      const result = await pool.query(query, [fromDate, toDate]);
      const data = result.rows;


      // Generate a list of all dates between fromDate and toDate
      const start = new Date(fromDate);
      const end = new Date(toDate);
      let dateRange = [];

      while (start <= end) {
          let nextDay = new Date(start);
          nextDay.setDate(nextDay.getDate() + 1); // Increment the date by 1
          dateRange.push(nextDay.toISOString().split("T")[0]); // Format as YYYY-MM-DD
          start.setDate(start.getDate() + 1);
      }

      // Initialize dailyAggregates with all dates set to 0
      let dailyAggregates = dateRange.map(date => ({ date, outward_count: 0 }));

      // Track last outward_count for each date
      let lastCountMap = {};

      for (let row of data) {
          let date = new Date(row.outward_date);
          date.setDate(date.getDate() + 1); // Increment the date by 1
          const formattedDate = date.toISOString().split("T")[0]; // Extract YYYY-MM-DD

          // Always store the last outward_count for each date
          lastCountMap[formattedDate] = row.outward_count;
      }

      // Populate dailyAggregates with actual values
      dailyAggregates = dailyAggregates.map(item => ({
          date: item.date,
          outward_count: lastCountMap[item.date] || 0 // Default to 0 if no data
      }));

      // Return the structured response
      return {
          station: stationName,
          fromDate: fromDate,
          toDate: toDate,
          dailyLabels: dateRange,
          dailyAggregates: dailyAggregates
      };

  } catch (error) {
      console.error("Error fetching data:", error.message);
      throw error;
  }
};

router.post('/:stationName/dayWise', async (req, res) => {
  const { stationName } = req.params;
  const { fromDate, toDate } = req.body;

  // Validate input
  if (!stationName || !fromDate || !toDate) {
      return res.status(400).json({ message: "Station, fromDate, and toDate are required" });
  }

  // Validate station name to prevent SQL injection
  const validStations = ['fg_stocktable_outward']; // Add more valid station names if needed
  if (!validStations.includes(stationName)) {
      return res.status(400).json({ message: "Invalid station" });
  }

  try {
      const dailyData = await fetchDayWiseData(stationName, fromDate, toDate, stationName);


      res.json(dailyData);

  } catch (error) {
      console.error("Error processing the request:", error.message);
      res.status(500).json({ message: "Internal Server Error" });
  }
});


const fetchShiftWiseData = async (tableName, selectedDate, stationName) => {
  const query = `
      SELECT 
          outward_date, 
          outward_time, 
          outward_count 
      FROM ${tableName}
      WHERE outward_date = $1
      ORDER BY outward_date, outward_time;
  `;

  try {
      const result = await pool.query(query, [selectedDate]);
      const data = result.rows;


      // Define shifts with the new naming convention
      const shifts = [
          { name: "Shift A", start: "06:00:00", end: "13:59:59" },
          { name: "Shift B", start: "14:00:00", end: "21:59:59" },
          { name: "Shift C", start: "22:00:00", end: "05:59:59" } // Next day early morning
      ];

      // Initialize shift-wise data with default 0
      let shiftData = {
          "Shift A": 0,
          "Shift B": 0,
          "Shift C": 0
      };

      // Track last outward_count for each shift
      let lastCountMap = {};

      for (let row of data) {
          const time = row.outward_time;
          const outwardCount = row.outward_count;

          // Determine which shift the record belongs to
          for (let shift of shifts) {
              if (
                  (shift.name !== "Shift C" && time >= shift.start && time <= shift.end) ||
                  (shift.name === "Shift C" && (time >= "22:00:00" || time <= "05:59:59"))
              ) {
                  lastCountMap[shift.name] = outwardCount; // Store last count for shift
              }
          }
      }

      // Populate shift-wise aggregates
      shifts.forEach(shift => {
          shiftData[shift.name] = lastCountMap[shift.name] || 0; // Default to 0 if no data
      });

      // Return structured response
      return {
          station: stationName,
          date: selectedDate,
          shiftLabels: ["Shift A", "Shift B", "Shift C"],
          shiftSums: [
              { shift: "Shift A", ok_count: shiftData["Shift A"] },
              { shift: "Shift B", ok_count: shiftData["Shift B"] },
              { shift: "Shift C", ok_count: shiftData["Shift C"] }
          ]
      };

  } catch (error) {
      console.error("Error fetching shift-wise data:", error.message);
      throw error;
  }
};

// Express Route
router.post('/:stationName/shiftWise', async (req, res) => {
  const { stationName } = req.params;
  const { date } = req.body;

  // Validate input
  if (!stationName || !date) {
      return res.status(400).json({ message: "Station and date are required" });
  }

  // Validate station name to prevent SQL injection
  const validStations = ['fg_stocktable_outward']; // Add more valid station names if needed
  if (!validStations.includes(stationName)) {
      return res.status(400).json({ message: "Invalid station" });
  }

  try {
      const shiftData = await fetchShiftWiseData(stationName, date, stationName);
      res.json(shiftData);
  } catch (error) {
      console.error("Error processing shift-wise request:", error.message);
      res.status(500).json({ message: "Internal Server Error" });
  }
});
const fetchMonthWiseData = async (tableName, fromMonth, fromYear, toMonth, toYear, stationName) => {
  const query = `
      SELECT 
          outward_date, 
          outward_count
      FROM ${tableName}
      WHERE 
          EXTRACT(YEAR FROM outward_date) BETWEEN $1 AND $2
      ORDER BY outward_date;
  `;

  try {
      const result = await pool.query(query, [fromYear, toYear]);
      const data = result.rows;

      // Generate all months in the range
      let start = new Date(fromYear, fromMonth - 1, 1); // Month index starts from 0
      let end = new Date(toYear, toMonth, 0); // Last day of the last month
      let months = [];

      while (start <= end) {
          let year = start.getFullYear();
          let monthName = start.toLocaleString("en-US", { month: "short" }); // Convert to "Jan", "Feb"
          months.push(`${monthName} ${year}`);
          start.setMonth(start.getMonth() + 1);
      }

      // Initialize monthly data with default 0
      let monthData = {};
      months.forEach(month => {
          monthData[month] = 0;
      });

      // Track last outward_count per month
      let lastCountMap = {};

      for (let row of data) {
          let outwardDate = new Date(row.outward_date);
          let monthKey = outwardDate.toLocaleString("en-US", { month: "short", year: "numeric" });
          lastCountMap[monthKey] = row.outward_count; // Store last outward_count per month
      }

      // Populate final data
      months.forEach(month => {
          monthData[month] = lastCountMap[month] || 0;
      });

      // Return structured response
      return {
          station: stationName,
          fromMonth: fromMonth,
          fromYear: fromYear,
          toMonth: toMonth,
          toYear: toYear,
          monthLabels: months,
          monthSums: months.map(month => ({
              month: month,
              ok_count: monthData[month]
          }))
      };

  } catch (error) {
      console.error("Error fetching month-wise data:", error.message);
      throw error;
  }
};

// Express Route
router.post('/:stationName/monthWise', async (req, res) => {
  const { stationName } = req.params;
  const { fromMonth, fromYear, toMonth, toYear } = req.body;

  // Validate input
  if (!stationName || !fromMonth || !fromYear || !toMonth || !toYear) {
      return res.status(400).json({ message: "All fields are required" });
  }

  // Validate station name to prevent SQL injection
  const validStations = ['fg_stocktable_outward']; // Add more valid station names if needed
  if (!validStations.includes(stationName)) {
      return res.status(400).json({ message: "Invalid station" });
  }

  try {
      const monthData = await fetchMonthWiseData(stationName, fromMonth, fromYear, toMonth, toYear, stationName);
      res.json(monthData);
  } catch (error) {
      console.error("Error processing month-wise request:", error.message);
      res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;


