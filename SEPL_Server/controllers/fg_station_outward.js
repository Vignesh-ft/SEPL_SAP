const { Pool } = require("pg");
const express = require('express');
const router = express.Router();
require('dotenv').config();

// Database connection configuration for PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

// 🔹 HOURLY COUNT API
const fetchHourlyData = async (tableName, date, stationName) => {
    const query = `
        SELECT 
            EXTRACT(HOUR FROM outward_time) AS hour,
            COUNT(*) AS entry_count
        FROM ${tableName}
        WHERE outward_date = $1
        GROUP BY hour
        ORDER BY hour;
    `;

    try {
        const result = await pool.query(query, [date]);
        const data = result.rows;

        // Initialize hourlyData with all hours set to 0
        let hourlyData = [];
        for (let i = 0; i < 24; i++) {
            hourlyData.push({ hour: `${String(i).padStart(2, '0')}`, entry_count: 0 });
        }

        // Update with actual data
        for (let row of data) {
            const hourIndex = parseInt(row.hour, 10);
            if (hourIndex >= 0 && hourIndex < 24) {
                hourlyData[hourIndex].entry_count = parseInt(row.entry_count, 10);
            }
        }
        const hourlyLabels = Array.from({ length: 24 }, (_, i) => {
            return String(i).padStart(2, '0') + ":00";
        });
        return {
            station: stationName,
            date: date,
            hourlyLabels: hourlyLabels,
            hourlySums: hourlyData
        };
    } catch (error) {
        console.error("Error fetching hourly data:", error.message);
        throw error;
    }
};

router.post('/:stationName/hourly', async (req, res) => {
    const { stationName } = req.params;
    const { date } = req.body;

    if (!stationName || !date) {
        return res.status(400).json({ message: "Station and date are required" });
    }

    try {
        const data = await fetchHourlyData(stationName, date, stationName);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 🔹 SHIFT-WISE COUNT API
const fetchShiftWiseData = async (tableName, date, stationName) => {
    const query = `
        SELECT 
            shift,
            COUNT(*) AS entry_count
        FROM ${tableName}
        WHERE outward_date = $1
        GROUP BY shift
        ORDER BY shift;
    `;

    try {
        const result = await pool.query(query, [date]);
        const data = result.rows;

        let shiftData = { "A": 0, "B": 0, "C": 0 };

        // Update with actual counts
        data.forEach(row => {
            shiftData[row.shift] = parseInt(row.entry_count, 10);
        });

        return {
            station: stationName,
            date: date,
            shiftLabels: ["Shift A", "Shift B", "Shift C"],
            shiftSums: [
                { shift: "Shift A", entry_count: shiftData["A"] },
                { shift: "Shift B", entry_count: shiftData["B"] },
                { shift: "Shift C", entry_count: shiftData["C"] }
            ]
        };
    } catch (error) {
        console.error("Error fetching shift-wise data:", error.message);
        throw error;
    }
};

router.post('/:stationName/shiftWise', async (req, res) => {
    const { stationName } = req.params;
    const { date } = req.body;

    if (!stationName || !date) {
        return res.status(400).json({ message: "Station and date are required" });
    }

    try {
        const data = await fetchShiftWiseData(stationName, date, stationName);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 🔹 DAY-WISE COUNT API
const fetchDayWiseData = async (tableName, fromDate, toDate, stationName) => {
    const query = `
        SELECT 
            outward_date::TEXT AS date,
            COUNT(*) AS entry_count
        FROM ${tableName}
        WHERE outward_date BETWEEN $1 AND $2
        GROUP BY outward_date
        ORDER BY outward_date;
    `;

    try {
        const result = await pool.query(query, [fromDate, toDate]);
        const data = result.rows;
  
        const start = new Date(fromDate);
        const end = new Date(toDate);
        let dateRange = [];
        
        while (start <= end) {
            dateRange.push(start.toISOString().split("T")[0]); // Correct date format
            start.setDate(start.getDate() + 1); // Move forward properly
        }
        
        // Initialize dailyAggregates with all dates set to 0
        let dailyAggregates = dateRange.map(date => ({ date, entry_count: 0 }));

        // Track last entry_count for each date
        let lastCountMap = {};

        for (let row of data) {
            let date = new Date(row.date);
            date.setDate(date.getDate() ); // Decrement the date by 1 to match correctly
            const formattedDate = date.toISOString().split("T")[0]; // Extract YYYY-MM-DD

            // Always store the last entry_count for each date
            lastCountMap[formattedDate] = row.entry_count;
        }

        // Populate dailyAggregates with actual values
        dailyAggregates = dailyAggregates.map(item => ({
            date: item.date,
            entry_count: lastCountMap[item.date] || 0 // Default to 0 if no data
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
        console.error("Error fetching day-wise data:", error.message);
        throw error;
    }
};


router.post('/:stationName/dayWise', async (req, res) => {
    const { stationName } = req.params;
    const { fromDate, toDate } = req.body;

    if (!stationName || !fromDate || !toDate) {
        return res.status(400).json({ message: "Station, fromDate, and toDate are required" });
    }

    try {
        const data = await fetchDayWiseData(stationName, fromDate, toDate, stationName);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// MONTH-WISE COUNT API
const fetchMonthWiseData = async (tableName, fromMonth, fromYear, toMonth, toYear, stationName) => {
    const query = `
        SELECT 
    TO_CHAR(outward_date, 'Mon YYYY') AS month,
    COUNT(*) AS entry_count
FROM ${tableName}
WHERE 
    (EXTRACT(YEAR FROM outward_date) > $1 OR 
    (EXTRACT(YEAR FROM outward_date) = $1 AND EXTRACT(MONTH FROM outward_date) >= $3))
    AND
    (EXTRACT(YEAR FROM outward_date) < $2 OR
    (EXTRACT(YEAR FROM outward_date) = $2 AND EXTRACT(MONTH FROM outward_date) <= $4))
GROUP BY month
ORDER BY MIN(outward_date);

    `;

    try {
        const result = await pool.query(query, [fromYear, toYear, fromMonth, toMonth]);
        const data = result.rows;

        // Generate all months in the range
        let start = new Date(fromYear, fromMonth - 1, 1); // Month index starts from 0
        let end = new Date(toYear, toMonth, 0); // Last day of the last month
        let months = [];
        let monthData = {};

        // Generate months for the range and initialize monthData to 0
        while (start <= end) {
            let year = start.getFullYear();
            let monthName = start.toLocaleString("en-US", { month: "short" }); // Convert to "Jan", "Feb"
            let monthKey = `${monthName} ${year}`;
            months.push(monthKey);
            monthData[monthKey] = 0; // Initialize with 0 for each month
            start.setMonth(start.getMonth() + 1);
        }

        // Populate monthData with actual entry counts from the query results
        data.forEach(row => {
            monthData[row.month] = parseInt(row.entry_count, 10); // Assign entry_count
        });

        // Return the structured response
        return {
            station: stationName,
            monthLabels: months,
            monthSums: months.map(month => ({
                month,
                entry_count: monthData[month] // Use 0 if no data is found
            }))
        };
    } catch (error) {
        console.error("Error fetching month-wise data:", error.message);
        throw error;
    }
};

router.post('/:stationName/monthWise', async (req, res) => {
    const { stationName } = req.params;
    const { fromMonth, fromYear, toMonth, toYear } = req.body;

    if (!stationName || !fromMonth || !fromYear || !toMonth || !toYear) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const data = await fetchMonthWiseData(stationName, fromMonth, fromYear, toMonth, toYear, stationName);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});


module.exports = router;
