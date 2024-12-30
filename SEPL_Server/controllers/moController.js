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
  console.log(stationName);

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
    console.log("Formatted from date:", formattedFromDate);
    console.log("Formatted to date:", formattedToDate);

    // Adjust date to handle time zone difference
  const fromDateAdjusted = new Date(fromDate); // Convert string to Date object
  fromDateAdjusted.setUTCHours(0, 0, 0, 0); // Set to midnight UTC

  const toDateAdjusted = new Date(toDate);
  toDateAdjusted.setUTCHours(23, 59, 59, 999); // Set to the end of the day UTC

  // Fetch data using the adjusted dates
  const result = await pool.query(query, [fromDateAdjusted, toDateAdjusted]);


    console.log("Fetched data:", result.rows); // Log the fetched data to verify
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
    A: { rotor_count: 0, stator_count: 0 },
    B: { rotor_count: 0, stator_count: 0 },
    C: { rotor_count: 0, stator_count: 0 },
  };

  // If there is data, sum the counts for each shift
  if (data.length > 0) {
    data.forEach(row => {
      if (shiftCounts[row.shift]) {
        shiftCounts[row.shift].rotor_count += row.rotor_count;
        shiftCounts[row.shift].stator_count += row.stator_count;
      }
    });
  }

  return shiftCounts;
};

router.post('/:stationName/singleDay', async (req, res) => {
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

    // Step 2: Group the data by shift and sum the counts
    const shiftCounts = sumCountsByShift(data);

    // Step 3: Send the response with the summed counts for each shift
    res.json({
      station: stationName,
      date,
      shiftCounts,  // Returns rotor and stator counts for each shift (A, B, C)
    });
  } catch (error) {
    console.error(`Error in endpoint /${stationName}/singleDay:`, error.message);
    res.status(500).json({ message: "Failed to fetch data", error: error.message });
  }
});



// Main function to log in, fetch data, and compareq
const processData = async () => {
  await fetch_Stamping_Station_A_Data();
};

module.exports = { processData, router };

