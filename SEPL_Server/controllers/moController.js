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

//hourly - stamping stations
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

const fetchTableForHour = async (tableName, date) => {
  console.log(tableName)
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

router.post('/:stationName/hourly', async (req, res) => {
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
    const data = await fetchTableForHour(stationName, date);

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


//daywise - stamping stations
function dateFilterWithMissingDates(data, fromDate, toDate) {
  // Initialize an object to store the sum of rotor_count and stator_count for each day
  const dailySums = {};

  // Parse the fromDate and toDate to ensure they are Date objects
  const startDate = new Date(fromDate);
  const endDate = new Date(toDate);

  // Normalize both fromDate and toDate to the start of the day (midnight) and the end of the day (11:59 PM)
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  // Ensure the dates are correctly formatted as YYYY-MM-DD (for easy comparison)
  const formatDate = (date) => date.toISOString().split('T')[0];

  // Function to convert UTC date to local date and format it to YYYY-MM-DD
  const convertToLocalDate = (dateString) => {
    const localDate = new Date(dateString);
    localDate.setHours(localDate.getHours() + new Date().getTimezoneOffset() / 60); // Adjust for time zone
    return formatDate(localDate);
  };

  // Loop over the date range and initialize sums for each day
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const formattedDate = formatDate(currentDate);
    dailySums[formattedDate] = {
      rotor_sum: 0,
      stator_sum: 0,
    };
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Loop through the data and aggregate rotor_count and stator_count for each day
  data.forEach((datum) => {
    const date = convertToLocalDate(datum.date); // Convert the date to local date in YYYY-MM-DD format

    // Check if the date falls within the specified range (ignoring time)
    if (dailySums[date]) {
      dailySums[date].rotor_sum += datum.rotor_count;
      dailySums[date].stator_sum += datum.stator_count;
    }
  });

  // Prepare the result with labels and sums for each day
  const dailyLabels = Object.keys(dailySums); // These are the dates
  const dailyAggregates = dailyLabels.map((date) => ({
    date,
    rotor_sum: dailySums[date].rotor_sum,
    stator_sum: dailySums[date].stator_sum,
  }));

  return { dailyLabels, dailyAggregates };
}

const fetchTableForDay = async (stationName, fromDate, toDate) => {
  
  // Format the dates for comparison
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // Normalize to YYYY-MM-DD format (no time)
  };

  const formattedFromDate = formatDate(fromDate);
  const formattedToDate = formatDate(toDate);

  const query = `
    SELECT date, rotor_count, stator_count
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

router.post('/:stationName/dayWise', async (req, res) => {
  const { stationName } = req.params;
  const { fromDate, toDate } = req.body;

  if (!stationName || !fromDate || !toDate) {
    return res.status(400).json({ message: "Station name, fromDate, and toDate are required" });
  }

  const validStations = ['stamping_station_a', 'stamping_station_b'];
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

//shiftwise - stamping stations
const getData = async (stationName, date) => {
  const query = `
    SELECT shift, rotor_count, stator_count
    FROM ${stationName}
    WHERE date::date = $1;
  `;
  
  try {
    const result = await pool.query(query, [date]);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching data for ${stationName} on ${date}:`, error.message);
    throw error;
  }
};

const sumCountsByShift = (data) => {
  // Initialize the counts for each shift with default 0 values
  const shiftCounts = {
    A: { rotor_sum: 0, stator_sum: 0 },
    B: { rotor_sum: 0, stator_sum: 0 },
    C: { rotor_sum: 0, stator_sum: 0 },
  };

  // If there is data, sum the counts for each shift
  if (data.length > 0) {
    data.forEach(row => {
      if (shiftCounts[row.shift]) {
        shiftCounts[row.shift].rotor_sum += row.rotor_count;
        shiftCounts[row.shift].stator_sum += row.stator_count;
      }
    });
  }

  // Convert the object to an array
  return Object.keys(shiftCounts).map(shift => ({
    shift,
    ...shiftCounts[shift],
  }));
};

router.post('/:stationName/shiftWise', async (req, res) => {
  const { stationName } = req.params;
  const { date } = req.body;

  if (!stationName || !date) {
    return res.status(400).json({ message: "Station name and date are required" });
  }

  const validStations = ['stamping_station_a', 'stamping_station_b'];
  if (!validStations.includes(stationName)) {
    return res.status(400).json({ message: "Invalid station name" });
  }

  try {
    // Step 1: Fetch the data for the given date
    const data = await getData(stationName, date);

    const shiftLabels = [`${date}Shift A`, `${date}Shift B`, `${date}Shift C`]

    // Step 2: Group the data by shift and sum the counts
    const shiftSums = sumCountsByShift(data);
    // Step 3: Send the response with the summed counts for each shift
    res.json({
      station: stationName,
      date,
      shiftLabels,
      shiftSums,  // Returns rotor and stator counts for each shift (A, B, C)
    });
  } catch (error) {
    console.error(`Error in endpoint /${stationName}/singleDay:`, error.message);
    res.status(500).json({ message: "Failed to fetch data", error: error.message });
  }
});

//monthwise - stamping stations
const getMonthlyDataForRange = async (stationName, fromMonth, fromYear, toMonth, toYear) => {
  const query = `
    SELECT EXTRACT(MONTH FROM date) AS month, EXTRACT(YEAR FROM date) AS year, 
           SUM(rotor_count) AS rotor_count, SUM(stator_count) AS stator_count
    FROM ${stationName}
    WHERE (EXTRACT(YEAR FROM date) > $1 OR (EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) >= $2))
      AND (EXTRACT(YEAR FROM date) < $3 OR (EXTRACT(YEAR FROM date) = $3 AND EXTRACT(MONTH FROM date) <= $4))
    GROUP BY year, month
    ORDER BY year, month;
  `;

  try {
    // Fetch data for the given range of months and years
    const result = await pool.query(query, [fromYear, fromMonth, toYear, toMonth]);
    console.log(result.rows); // Log the fetched data
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

  while (
    currentYear < toYear ||
    (currentYear === toYear && currentMonth <= toMonth)
  ) {
    monthlyData.push({
      year: currentYear,
      month: currentMonth,
      rotor_count: 0,
      stator_count: 0
    });

    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  data.forEach(row => {
    const monthIndex = (row.year - fromYear) * 12 + (row.month - fromMonth);
    if (monthIndex >= 0 && monthIndex < monthlyData.length) {
      monthlyData[monthIndex].rotor_count += parseInt(row.rotor_count) || 0;
      monthlyData[monthIndex].stator_count += parseInt(row.stator_count) || 0;
    }
  });

  // Format the response with separate month and year
  return monthlyData.map(monthData => ({
    month: getMonthName(monthData.month), // Month name (e.g., "Jan", "Feb")
    year: monthData.year, // Year (e.g., 2024)
    rotor_sum: monthData.rotor_count,
    stator_sum: monthData.stator_count,
  }));
};

router.post('/:stationName/monthWise', async (req, res) => {
  const { stationName } = req.params;
  const { fromMonth, fromYear, toMonth, toYear } = req.body;

  if (!stationName || !fromMonth || !fromYear || !toMonth || !toYear) {
    return res.status(400).json({ message: "Station name, fromMonth, fromYear, toMonth, and toYear are required" });
  }

  const validStations = ['stamping_station_a', 'stamping_station_b'];
  if (!validStations.includes(stationName)) {
    return res.status(400).json({ message: "Invalid station name" });
  }

  // Check if the months and years are valid
  if (fromMonth < 1 || fromMonth > 12 || toMonth < 1 || toMonth > 12) {
    return res.status(400).json({ message: "Invalid month. Please provide a month between 1 and 12." });
  }

  if (fromYear > toYear || (fromYear === toYear && fromMonth > toMonth)) {
    return res.status(400).json({ message: "From date must be earlier than to date" });
  }

  try {
    // Step 1: Fetch data for the given range of months and years
    const data = await getMonthlyDataForRange(stationName, fromMonth, fromYear, toMonth, toYear);

    // Step 2: Aggregate the data for the range
    const aggregatedData = aggregateMonthlyDataForRange(data, fromMonth, fromYear, toMonth, toYear);

    // Step 3: Format the response
    const formattedResponse = aggregatedData.map(monthData => ({
      month: `${monthData.month} ${monthData.year}`,
      rotor_sum: monthData.rotor_sum,
      stator_sum: monthData.stator_sum,
    }));

    // const temp = [...temp, formattedResponse]
    const monthLabels = aggregatedData.map(monthData => `${monthData.month} ${monthData.year}`)

    // Step 4: Send the response with the aggregated data
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



// Main function to log in, fetch data, and compareq
const processData = async () => {
  await fetch_Stamping_Station_A_Data();
};

module.exports = { processData, router };

