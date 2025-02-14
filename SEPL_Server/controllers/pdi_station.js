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
          date, 
          cycle_time_end, 
          ok_count
      FROM ${tableName}
      WHERE date = $1
      ORDER BY cycle_time_end;
  `;

  try {
      const result = await pool.query(query, [date]);
      const data = result.rows;

      // Initialize hourlyData with all hours set to 0
      let hourlyData = [];
      for (let i = 0; i < 24; i++) {
          hourlyData.push({ hour: i, ok_count: 0 });
      }

      // Loop through the data and update the ok_count for each hour
      for (let row of data) {
          const cycleTime = new Date(`${row.date}T${row.cycle_time_end}`);
          const hour = cycleTime.getHours();

          // Update ok_count for the corresponding hour
          hourlyData[hour].ok_count = row.ok_count;
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
  const validStations = ['fg_packing_station'];  // Add more valid station names if needed
  if (!validStations.includes(stationName)) {
    return res.status(400).json({ message: "Invalid station" });
  }

  try {
    const hourlySums = await fetchData(stationName, date);  // Assuming fetchData returns the hourly data


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
      ok_count: 0  // Initialize with 0
    }));

    // Fill in the count_sum based on hourlyData
    hourlyData.forEach(data => {
      const hourIndex = data.hour;  // Assuming `data.hour` is a number from 0-23
      if (hourIndex >= 0 && hourIndex < 24) {
        const formattedHour = String(hourIndex).padStart(2, '0');  // Format hour as a 2-digit string
        formattedHourlySums[hourIndex].hour = formattedHour;  // Update the hour in formattedHourlySums
        formattedHourlySums[hourIndex].ok_count = data.ok_count;  // Assign ok_count to the corresponding hour
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


//daywise report


router.post('/:stationName/dayWise', async (req, res) => {
  const { stationName } = req.params;
  const { fromDate, toDate } = req.body;

  // Validate input
  if (!stationName || !fromDate || !toDate) {
    return res.status(400).json({ message: "Station name, fromDate, and toDate are required" });
  }

  const validStations = ['fg_packing_station']; 
  if (!validStations.includes(stationName)) {
    return res.status(400).json({ message: "Invalid station name" });
  }

  const fetchDayWiseData = async (stationName, fromDate, toDate) => {
    const query = `
      SELECT 
        date, 
        ok_count
      FROM ${stationName}
      WHERE date BETWEEN $1 AND $2
      ORDER BY date, cycle_time_end;
    `;
    
    try {
      const result = await pool.query(query, [fromDate, toDate]);
      const data = result.rows;
  
      let dayWiseData = [];
      let currentDate = null;
      let lastOkCount = null;
  
      // Loop through the data to store the last ok_count for each day
      for (let row of data) {
        const rowDate = row.date;
  
        if (currentDate !== rowDate) {
          if (currentDate !== null) {
            dayWiseData.push({ date: currentDate, ok_count: lastOkCount });
          }
          currentDate = rowDate;
        }
  
        lastOkCount = row.ok_count;
      }
  
      // Add the last day's data if available
      if (currentDate !== null) {
        dayWiseData.push({ date: currentDate, ok_count: lastOkCount });
      }
  
      // Handle missing dates
      let startDate = new Date(fromDate);
      let endDate = new Date(toDate);
      let missingDates = [];
  
      while (startDate <= endDate) {
        const formattedDate = startDate.toISOString().split('T')[0]; // Format as yyyy-mm-dd
  
        if (!dayWiseData.some(data => data.date === formattedDate)) {
          missingDates.push({ date: formattedDate, ok_count: 0 });
        }
  
        startDate.setDate(startDate.getDate() + 1);
      }
  
      // Combine existing data with missing dates and sort by date
      dayWiseData = [...dayWiseData, ...missingDates];
      dayWiseData.sort((a, b) => new Date(a.date) - new Date(b.date));
  
      // Create daily labels (formatted as yyyy-mm-dd)
      let dailyLabels = [];
      startDate = new Date(fromDate);
      while (startDate <= endDate) {
        const formattedDate = startDate.toISOString().split('T')[0]; // Format as yyyy-mm-dd
        dailyLabels.push(formattedDate);
        startDate.setDate(startDate.getDate() + 1);
      }
  
      // Return the structured response
      return {
        station: stationName,
        fromDate: fromDate,
        toDate: toDate,
        dailyLabels: dailyLabels,
        dailyAggregates: dayWiseData
      };
  
    } catch (error) {
      console.error("Error fetching day-wise data:", error.message);
      throw error;
    }
  };
  

  try {
    const dayWiseData = await fetchDayWiseData(stationName, fromDate, toDate);
    if (dayWiseData.length === 0) {
      return res.status(404).json({ message: "No data found for the given date range" });
    }
    res.json(dayWiseData);
  } catch (error) {
    console.error("Error processing the request:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// Shift-wise report
router.post('/:stationName/shiftWise', async (req, res) => {
  const { stationName } = req.params;
  const { date } = req.body;

  // Validate input
  if (!stationName || !date) {
    return res.status(400).json({ message: "Station name and date are required" });
  }

  const validStations = ['fg_packing_station']; 
  if (!validStations.includes(stationName)) {
    return res.status(400).json({ message: "Invalid station name" });
  }

  // Fetch the data for the given date
  const fetchShiftWiseData = async (tableName, date) => {
    const query = `
      SELECT 
        date, 
        shift, 
        ok_count
      FROM ${tableName}
      WHERE date = $1
      ORDER BY shift, cycle_time_end;
    `;

    try {
      const result = await pool.query(query, [date]);
      const data = result.rows;


      // Initialize shiftWiseData with all shifts set to 0
      let shiftWiseData = [
        { shift: 'A', ok_count: 0 },
        { shift: 'B', ok_count: 0 },
        { shift: 'C', ok_count: 0 }
      ];

      // Loop through the data and update the ok_count for each shift
      for (let row of data) {
        const shift = row.shift;

        // Update ok_count for the corresponding shift
        if (shift === 'A') {
          shiftWiseData[0].ok_count = row.ok_count;
        } else if (shift === 'B') {
          shiftWiseData[1].ok_count = row.ok_count;
        } else if (shift === 'C') {
          shiftWiseData[2].ok_count = row.ok_count;
        }
      }

      return shiftWiseData;

    } catch (error) {
      console.error("Error fetching shift-wise data:", error.message);
      throw error;
    }
  };

  try {
    const shiftWiseData = await fetchShiftWiseData(stationName, date);
    if (shiftWiseData.length === 0) {
      return res.status(404).json({ message: "No data found for the given date" });
    }

    const shiftLabels = [`${date} Shift A`, `${date} Shift B`, `${date} Shift C`];
    res.json({
      station: stationName,
      date: date,
      shiftLabels: shiftLabels,
      shiftSums: shiftWiseData
    });
  } catch (error) {
    console.error("Error processing the request:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post('/:stationName/monthWise', async (req, res) => {
  const { stationName } = req.params;
  const { fromMonth, fromYear, toMonth, toYear } = req.body;

  if (!stationName || !fromMonth || !fromYear || !toMonth || !toYear) {
    return res.status(400).json({ message: "Station name, fromMonth, fromYear, toMonth, and toYear are required" });
  }

  const validStations = ['fg_packing_station'];
  if (!validStations.includes(stationName)) {
    return res.status(400).json({ message: "Invalid station name" });
  }

  const fetchMonthWiseData = async (tableName, fromYear, fromMonth, toYear, toMonth) => {
    const query = `
      SELECT 
        TO_CHAR(date::date, 'YYYY-MM') AS month,  -- Corrected casting
        ok_count
      FROM ${tableName}
      WHERE date BETWEEN $1 AND $2
      ORDER BY date;
    `;

    try {
      const result = await pool.query(query, [
        `${fromYear}-${String(fromMonth).padStart(2, '0')}-01`,
        `${toYear}-${String(toMonth).padStart(2, '0')}-31`
      ]);

      const data = result.rows;

      // Store the last ok_count per month
      let lastCountMap = {};
      for (let row of data) {
        lastCountMap[row.month] = row.ok_count;
      }

      return lastCountMap;
    } catch (error) {
      console.error("Error fetching month-wise data:", error.message);
      throw error;
    }
  };

  try {
    const monthCounts = await fetchMonthWiseData(stationName, fromYear, fromMonth, toYear, toMonth);

    // Generate all months in the given range
    let start = new Date(fromYear, fromMonth - 1, 1); // Convert to Date object
    let end = new Date(toYear, toMonth - 1, 1);
    let months = [];

    while (start <= end) {
      let year = start.getFullYear();
      let month = start.getMonth() + 1; // Convert to 1-based index
      let monthStr = `${year}-${String(month).padStart(2, '0')}`;
      months.push(monthStr);
      start.setMonth(start.getMonth() + 1);
    }

    // Ensure all months exist in output (missing months get ok_count = 0)
    const monthAggregates = months.map(month => ({
      month,
      ok_count: monthCounts[month] || 0
    }));

    // Convert YYYY-MM to "MMM YYYY" (e.g., "Jan 2025")
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthLabels = months.map(month => {
      const [year, monthNum] = month.split('-');
      return `${monthNames[parseInt(monthNum, 10) - 1]} ${year}`;
    });

    // Return response
    res.json({
      station: stationName,
      monthLabels,
      monthSums: monthAggregates.map((item, index) => ({
        month: monthLabels[index],
        ok_count: item.ok_count
      }))
    });

  } catch (error) {
    console.error("Error processing the request:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});




module.exports = router;
