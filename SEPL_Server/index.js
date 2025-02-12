const express = require('express');
const cors = require('cors');
const { router } = require('./controllers/moController'); // Import processData and router from the controller
const continuityTestRoutes = require('./controllers/continuity');
const slot_paper = require('./controllers/slot_paper_insertion');
const sp_test = require('./controllers/sp_test');
const varnish_stator_assembly = require('./controllers/varnish_stator');
const pdi_station = require('./controllers/pdi_station');
const fg_stocktable_inward = require('./controllers/fg_station_inward');
const fg_stocktable_outward = require('./controllers/fg_station_outward');
const rotor_shaft_assembly = require('./controllers/rotor_shaft');
const final_assembly_traceability = require('./controllers/final_assembly');

const app = express();
const PORT = 3000;

// Use JSON middleware to parse JSON data from requests
app.use(express.json());
app.use(cors());

// Register the router with your Express app
app.use('/stamping_station', router);
app.use('/continuity', continuityTestRoutes);
app.use('/slot_paper', slot_paper);
app.use('/sp_test', sp_test);
app.use('/varnish_stator_assembly', varnish_stator_assembly);
app.use('/pdi_station', pdi_station);
app.use('/fg_stocktable/inward', fg_stocktable_inward);
app.use('/fg_stocktable/outward', fg_stocktable_outward);
app.use('/rotorShaft', rotor_shaft_assembly);
app.use('/final_assembly', final_assembly_traceability);

// Start the process when the server starts
const start = async () => {
  try {
    // Example: Add your startup logic here (e.g., database connection)
    console.log("Server initialization completed");
  } catch (error) {
    console.error("Error in start:", error.message);
  }
};

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  start();  // Start the process after the server is running
});
