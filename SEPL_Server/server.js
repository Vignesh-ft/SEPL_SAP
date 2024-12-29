const express = require("express");
const cors = require("cors");

// Create the Express app
const app = express();
const port = 3000;

// Middleware
app.use(cors());

// Function to generate random chart data
const generateRandomData = () => ({
  time: new Date().toISOString().split("")[0],
  value: Math.floor(Math.random() * 5000), // Random value between 0 and 100
});

// Endpoint to get random chart data
app.get("/chart-data", (req, res) => {
  const data = generateRandomData();
  res.json(data);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
