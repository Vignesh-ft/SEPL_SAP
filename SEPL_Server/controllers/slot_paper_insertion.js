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
      ok_sum: 0, // Renamed for ok_count
    }));
  
    data.forEach((datum) => {
      let hour = datum.cycle_time_end.split(":")[0]; // Extract hour from time
      let hourIndex = parseInt(hour, 10); // Convert hour to an integer
  
      // Update the sums for the respective hour
      hourlySums[hourIndex].ok_sum += datum.rotor_count || 0; // Use 0 if null
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
            ok_sum: 0, // Only ok_sum retained
        };
        currentDate.setDate(currentDate.getDate() + 1);
    }

    data.forEach((datum) => {
        const date = formatDate(new Date(datum.date)); // Convert to YYYY-MM-DD format

        if (dailySums[date]) {
            dailySums[date].ok_sum += datum.ok_count || 0; // Aggregate `ok_count` as ok_sum
        }
    });

    const dailyLabels = Object.keys(dailySums);
    const dailyAggregates = dailyLabels.map((date) => ({
        date,
        ok_sum: dailySums[date].ok_sum,
    }));

    return { dailyLabels, dailyAggregates };
    }

    router.post('/:stationName/dayWise', async (req, res) => {
        const { stationName } = req.params;
        const { fromDate, toDate } = req.body;

        if (!stationName || !fromDate || !toDate) {
            return res.status(400).json({ message: "Station name, fromDate, and toDate are required" });
        }

        const validStations = ['slot_paper_insertion_auto', 'slot_paper_insertion_mannual'];
        if (!validStations.includes(stationName)) {
            return res.status(400).json({ message: "Invalid station name" });
        }

        const addOneDay = (date) => {
            const d = new Date(date);
            d.setDate(d.getDate() + 1);
            return d.toISOString().split('T')[0];
        };

        try {
            const data = await fetchTableForDay(stationName, fromDate, toDate);

            const { dailyLabels, dailyAggregates } = dateFilterWithMissingDates(data, fromDate, toDate);

            const updatedFromDate = addOneDay(fromDate);
            const updatedToDate = addOneDay(toDate);
            const updatedDailyLabels = dailyLabels.map(date => addOneDay(date));
            dailyAggregates.forEach((aggregate, index) => {
                aggregate.date = updatedDailyLabels[index];
            });

            res.json({
                station: stationName,
                fromDate: updatedFromDate,
                toDate: updatedToDate,
                dailyLabels: updatedDailyLabels,
                dailyAggregates,
            });
        } catch (error) {
            console.error(`Error in endpoint /${stationName}/dayWise:`, error.message);
            res.status(500).json({ message: "Failed to fetch daily grouped data", error: error.message });
        }
    });

    //shiftwise
  const getData = async (stationName, date) => {
    const query = `
      SELECT shift, ok_count AS stator_count
      FROM ${stationName}
      WHERE date::date = $1;
    `;
    try {
      const result = await pool.query(query, [date]);
    //   console.log("Query Result:", result.rows); // Add this log
      return result.rows;
    } catch (error) {
      console.error(`Error fetching data for ${stationName} on ${date}:`, error.message);
      throw error;
    }
  };
   
  const sumCountsByShift = (data) => {
    // Initialize counts for each shift with default values
    const shiftCounts = {
      A: { ok_sum: 0 },
      B: { ok_sum: 0 },
      C: { ok_sum: 0 },
    };
  
    // If there is data, sum the counts for each shift
    if (data.length > 0) {
      data.forEach((row) => {
        const { shift, stator_count = 0 } = row; // Only using stator_count for ok_sum
        if (shiftCounts[shift]) {
          shiftCounts[shift].ok_sum += stator_count;
        }
      });
    }
  
    // Convert the object to an array for the response
    return Object.keys(shiftCounts).map((shift) => ({
      shift,
      ok_sum: shiftCounts[shift].ok_sum ?? 0, // Default to 0 if null
    }));
  };
  
  router.post('/:stationName/shiftWise', async (req, res) => {
    const { stationName } = req.params;
    const { date } = req.body;
  
    if (!stationName || !date) {
      return res.status(400).json({ message: "Station name and date are required" });
    }
  
    const validStations = ['slot_paper_insertion_auto', 'slot_paper_insertion_mannual'];
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
        shiftSums, // Returns stator counts for each shift (A, B, C)
      });
    } catch (error) {
      console.error(`Error in endpoint /${stationName}/shiftWise:`, error.message);
      res.status(500).json({ message: "Failed to fetch data", error: error.message });
    }
  });
  
 //monthwise
 const getMonthlyDataForRange = async (stationName, fromMonth, fromYear, toMonth, toYear) => {
    const query = `
      SELECT EXTRACT(MONTH FROM date) AS month, EXTRACT(YEAR FROM date) AS year,
             SUM(ok_count) AS ok_count
      FROM ${stationName}
      WHERE (EXTRACT(YEAR FROM date) > $1 OR (EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) >= $2))
        AND (EXTRACT(YEAR FROM date) < $3 OR (EXTRACT(YEAR FROM date) = $3 AND EXTRACT(MONTH FROM date) <= $4))
      GROUP BY year, month
      ORDER BY year, month;
    `;
   
    try {
      // Fetch data for the given range of months and years
      
      const result = await pool.query(query, [fromYear, fromMonth, toYear, toMonth]);
         
      return result.rows; // Returns an array of objects with year, month, rotor_count, stator_count
    } catch (error) {
      console.error(`Error fetching monthly data for ${stationName}:`, error.message);
      throw error;
    }
  };
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
   
  const getMonthName = (monthIndex) => {
    return monthNames[monthIndex - 1]; // Convert 1-based month to 0-based index
  };
   
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
        ok_count: 0,
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
        // Convert count to a number to avoid issues with string aggregation
        monthlyData[monthIndex].ok_count += parseInt(row.ok_count) || 0;
      }
    });
  
    // Return the formatted response with month names
    return monthlyData.map(monthData => ({
      month: getMonthName(monthData.month), // Convert month number to name
      year: monthData.year, // Year (e.g., 2024)
      ok_sum: monthData.ok_count,
    }));
  };
  
  router.post('/:stationName/monthWise', async (req, res) => {
    const { stationName } = req.params;
    const { fromMonth, fromYear, toMonth, toYear } = req.body;
  
    if (!stationName || !fromMonth || !fromYear || !toMonth || !toYear) {
      return res.status(400).json({ message: "Station name, fromMonth, fromYear, toMonth, and toYear are required" });
    }
  
    const validStations = ['slot_paper_insertion_auto', 'slot_paper_insertion_mannual'];
    if (!validStations.includes(stationName)) {
      return res.status(400).json({ message: "Invalid station name" });
    }
  
    if (fromMonth < 1 || fromMonth > 12 || toMonth < 1 || toMonth > 12) {
      return res.status(400).json({ message: "Invalid month. Please provide a month between 1 and 12." });
    }
  
    if (fromYear > toYear || (fromYear === toYear && fromMonth > toMonth)) {
      return res.status(400).json({ message: "From date must be earlier than to date" });
    }
  
    try {
      const data = await getMonthlyDataForRange(stationName, fromMonth, fromYear, toMonth, toYear);
      const aggregatedData = aggregateMonthlyDataForRange(data, fromMonth, fromYear, toMonth, toYear);
  
      const formattedResponse = aggregatedData.map(monthData => ({
        month: `${monthData.month} ${monthData.year}`,
        ok_sum: monthData.ok_sum,
      }));
  
      const monthLabels = aggregatedData.map(monthData => `${monthData.month} ${monthData.year}`);
  
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