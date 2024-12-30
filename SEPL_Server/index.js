const express = require('express');
const cors = require('cors');
const { router } = require('./controllers/moController'); // Import processData and router from the controller


const app = express();
const PORT = 3000;

// Use JSON middleware to parse JSON data from requests
app.use(express.json());
app.use(cors());

// Register the router with your Express app
app.use('/api', router);

// Start the process when the server starts
const start = async () => {
  try {
  
  } catch (error) {
    console.error("Error in start:", error.message);
  }
};

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  start();  // Start the process after the server is running
});
