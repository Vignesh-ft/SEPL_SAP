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

  const fetchData = async (tableName, date) => {
    const query = `
    SELECT
        inward_date,
        inward_time,
        COUNT(id) AS count  -- Count entries per hour
    FROM ${tableName}
    WHERE inward_date = $1
    GROUP BY inward_date, inward_time
    ORDER BY inward_time;
    `;

    try {
        const result = await pool.query(query, [date]);
        return result.rows;
    } catch (error) {
        console.error(`Error fetching data from ${tableName}:`, error.message);
        throw error;
    }
};

// Hourly aggregation with missing hours handled
function hourFilterWithMissingHours(data) {
    const hourlySums = Array.from({ length: 24 }, (_, hour) => ({
        hour: hour.toString().padStart(2, '0'),
        count: 0, // Initialize count
    }));

    data.forEach((datum) => {
        let hour = datum.inward_time.split(":")[0]; // Extract hour from time
        let hourIndex = parseInt(hour, 10); // Convert to integer

        // Update the counts for the respective hour
        hourlySums[hourIndex].count += parseInt(datum.count, 10) || 0;
    });

    const hourlyLabels = hourlySums.map((entry) => `${entry.hour}:00`);
    return { hourlyLabels, hourlySums };
}

router.post('/:stationName/hourly', async (req, res) => {
    const { stationName } = req.params;
    const { date } = req.body;

    // Validate input
    if (!stationName || !date) {
        return res.status(400).json({ message: "Station name and date are required" });
    }

    // Validate station name to prevent SQL injection
    const validStations = ['fg_stocktable_inward'];
    if (!validStations.includes(stationName)) {
        return res.status(400).json({ message: "Invalid station name" });
    }

    try {
        // Fetch raw data
        const rawData = await fetchData(stationName, date);

        // Process data with the function
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
      SELECT inward_date, COUNT(id) AS count
      FROM ${stationName}
      WHERE inward_date::date BETWEEN $1 AND $2
      GROUP BY inward_date
      ORDER BY inward_date;
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

// Function to aggregate daily data
function dateFilterWithMissingDates(data, fromDate, toDate) {
    const dailySums = {};

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const formatDate = (date) => date.toISOString().split('T')[0];

    // Initialize daily sums for each day within the date range
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const formattedDate = formatDate(currentDate);
        dailySums[formattedDate] = {
            count_sum: 0, // Aggregated count (equivalent to ok_sum)
        };
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate the data
    data.forEach((datum) => {
        const date = formatDate(new Date(datum.inward_date)); // Convert to YYYY-MM-DD format

        if (dailySums[date]) {
            dailySums[date].count_sum += datum.count || 0; // Aggregate count (derived from id)
        }
    });

    const dailyLabels = Object.keys(dailySums);
    const dailyAggregates = dailyLabels.map((date) => ({
        date,
        count_sum: dailySums[date].count_sum, // Display aggregated count
    }));

    return { dailyLabels, dailyAggregates };
}

// Example usage
router.post('/:stationName/dayWise', async (req, res) => {
    const { stationName } = req.params;
    const { fromDate, toDate } = req.body;

    // Validate input
    if (!stationName || !fromDate || !toDate) {
        return res.status(400).json({ message: "Station name, fromDate, and toDate are required" });
    }

    // Validate station name to prevent SQL injection
    const validStations = ['fg_stocktable_inward'];
    if (!validStations.includes(stationName)) {
        return res.status(400).json({ message: "Invalid station name" });
    }

    try {
        // Fetch raw data from the database
        const rawData = await fetchTableForDay(stationName, fromDate, toDate);

        // Process data
        const { dailyLabels, dailyAggregates } = dateFilterWithMissingDates(rawData, fromDate, toDate);

        res.json({
            station: stationName,
            fromDate,
            toDate,
            dailyLabels,
            dailyAggregates,
        });
    } catch (error) {
        console.error(`Error in endpoint /${stationName}/daily:`, error.message);
        res.status(500).json({ message: "Failed to fetch daily data", error: error.message });
    }
});

// Get data for the given station and date
const getData = async (stationName, date) => {
  const query = `
    SELECT shift, COUNT(id) AS stator_count  -- Using COUNT(id) as stator_count
    FROM ${stationName}
    WHERE inward_date::date = $1  -- Replace date with inward_date for filtering
    GROUP BY shift;  -- Group by shift
  `;
  try {
    const result = await pool.query(query, [date]);
    return result.rows;  // Return the data
  } catch (error) {
    console.error(`Error fetching data for ${stationName} on ${date}:`, error.message);
    throw error;
  }
};

// Sum counts by shift for shift-wise aggregation
const sumCountsByShift = (data) => {
  // Initialize counts for each shift with default values
  const shiftCounts = {
      A: { ok_sum: 0 },
      B: { ok_sum: 0 },
      C: { ok_sum: 0 },
  };

  // Sum the counts for each shift
  if (data.length > 0) {
      data.forEach((row) => {
          const { shift, stator_count = 0 } = row;  // Use stator_count as the aggregated count
          if (shiftCounts[shift]) {
              shiftCounts[shift].ok_sum += stator_count;
          }
      });
  }

  // Return the shift-wise aggregated sums
  return Object.keys(shiftCounts).map((shift) => ({
      shift,
      ok_sum: shiftCounts[shift].ok_sum ?? 0,  // Default to 0 if stator_count is null
  }));
};

// API endpoint to fetch shift-wise data
router.post('/:stationName/shiftWise', async (req, res) => {
  const { stationName } = req.params;
  const { date } = req.body;

  // Validate the input
  if (!stationName || !date) {
      return res.status(400).json({ message: "Station name and date are required" });
  }

  const validStations = ['fg_stocktable_inward'];  // List of valid stations
  if (!validStations.includes(stationName)) {
      return res.status(400).json({ message: "Invalid station name" });
  }

  try {
      // Step 1: Fetch the data for the given date
      const data = await getData(stationName, date);

      const shiftLabels = [`${date} Shift A`, `${date} Shift B`, `${date} Shift C`];

      // Step 2: Group the data by shift and sum the counts
      const shiftSums = sumCountsByShift(data);

      // Step 3: Send the response with the summed counts for each shift
      res.json({
          station: stationName,
          date,
          shiftLabels,
          shiftSums,  // Return stator counts for each shift (A, B, C)
      });
  } catch (error) {
      console.error(`Error in endpoint /${stationName}/shiftWise:`, error.message);
      res.status(500).json({ message: "Failed to fetch data", error: error.message });
  }
});

 //monthwise
const getMonthlyDataForRange = async (stationName, fromMonth, fromYear, toMonth, toYear) => {
  const query = `
    SELECT EXTRACT(MONTH FROM inward_date) AS month, EXTRACT(YEAR FROM inward_date) AS year,
           COUNT(id) AS ok_count  -- Assuming COUNT(id) as ok_count, adjust if necessary
    FROM ${stationName}
    WHERE (EXTRACT(YEAR FROM inward_date) > $1 OR (EXTRACT(YEAR FROM inward_date) = $1 AND EXTRACT(MONTH FROM inward_date) >= $2))
      AND (EXTRACT(YEAR FROM inward_date) < $3 OR (EXTRACT(YEAR FROM inward_date) = $3 AND EXTRACT(MONTH FROM inward_date) <= $4))
    GROUP BY year, month
    ORDER BY year, month;
  `;

  try {
    // Fetch data for the given range of months and years
    const result = await pool.query(query, [fromYear, fromMonth, toYear, toMonth]);
    return result.rows;  // Returns an array of objects with year, month, and ok_count
  } catch (error) {
    console.error(`Error fetching monthly data for ${stationName}:`, error.message);
    throw error;
  }
};

// Month names array for converting month number to name
const monthNames = [
'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Get month name by month index (1-based)
const getMonthName = (monthIndex) => {
return monthNames[monthIndex - 1];  // Convert 1-based month to 0-based index
};

// Aggregate monthly data for the given date range
const aggregateMonthlyDataForRange = (data, fromMonth, fromYear, toMonth, toYear) => {
const monthlyData = [];
let currentYear = fromYear;
let currentMonth = fromMonth;

// Create an empty array for each month in the given range
while (
  currentYear < toYear ||
  (currentYear === toYear && currentMonth <= toMonth)
) {
  monthlyData.push({
    year: currentYear,
    month: currentMonth,
    ok_count: 0,  // Initialize ok_count to 0 for each month
  });

  currentMonth++;
  if (currentMonth > 12) {
    currentMonth = 1;
    currentYear++;
  }
}

// Aggregate data for each month
data.forEach(row => {
  const monthIndex = (row.year - fromYear) * 12 + (row.month - fromMonth);
  if (monthIndex >= 0 && monthIndex < monthlyData.length) {
    monthlyData[monthIndex].ok_count += parseInt(row.ok_count) || 0;  // Aggregate ok_count
  }
});

// Return the formatted response with month names
return monthlyData.map(monthData => ({
  month: getMonthName(monthData.month),  // Convert month number to name
  year: monthData.year,  // Year (e.g., 2024)
  ok_sum: monthData.ok_count,  // Total ok_count for the month
}));
};

// API endpoint to fetch monthly grouped data
router.post('/:stationName/monthWise', async (req, res) => {
const { stationName } = req.params;
const { fromMonth, fromYear, toMonth, toYear } = req.body;

// Validate input parameters
if (!stationName || !fromMonth || !fromYear || !toMonth || !toYear) {
  return res.status(400).json({ message: "Station name, fromMonth, fromYear, toMonth, and toYear are required" });
}

const validStations = ['fg_stocktable_inward'];
if (!validStations.includes(stationName)) {
  return res.status(400).json({ message: "Invalid station name" });
}

// Validate month range
if (fromMonth < 1 || fromMonth > 12 || toMonth < 1 || toMonth > 12) {
  return res.status(400).json({ message: "Invalid month. Please provide a month between 1 and 12." });
}

// Validate from and to date range
if (fromYear > toYear || (fromYear === toYear && fromMonth > toMonth)) {
  return res.status(400).json({ message: "From date must be earlier than to date" });
}

try {
  // Step 1: Fetch the monthly data for the given range
  const data = await getMonthlyDataForRange(stationName, fromMonth, fromYear, toMonth, toYear);

  // Step 2: Aggregate the monthly data
  const aggregatedData = aggregateMonthlyDataForRange(data, fromMonth, fromYear, toMonth, toYear);

  // Step 3: Format the response
  const formattedResponse = aggregatedData.map(monthData => ({
    month: `${monthData.month} ${monthData.year}`,  // Combine month and year in the response
    ok_sum: monthData.ok_sum,  // Sum of ok_count for the month
  }));

  const monthLabels = aggregatedData.map(monthData => `${monthData.month} ${monthData.year}`);

  // Send the response
  res.json({
    station: stationName,
    monthLabels,
    monthSums: formattedResponse
  });
} catch (error) {
  console.error(`Error in endpoint /${stationName}/monthWise:`, error.message);
  res.status(500).json({ message: "Failed to fetch monthly grouped data", error: error.message });
}
});


module.exports = router;