const { Int32 } = require("mongodb");
const fetch = require("node-fetch");
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
  port: process.env.DB_PORT,                // Default PostgreSQL port
});

// API URLs
const loginUrl = process.env.MANUFACTURING_LOGIN_URI; // Manufacturing Data - Login
const dataUrl = process.env.MANUFACTURING_GET_URI; // Manufacturing Data - GET
const pick_loginUrl = process.env.PICKUP_LOGIN_URL // Pickup Receipt Data - Login
const pick_dataUrl = process.env.PICKUP_POST_URL // Pickup Receipt Data - POST

let sessionId = '';
const matchingRecords = 0

// Manufacturing Data - Login credentials
const credentials = {
  CompanyDB: "SEPL_TEST",
  UserName: "TMICLOUD\\sepl.user01",
  Password: "Sastika@121120",
};

//Pickup Receipt Data - Login credentials
const data_credentials = {
  SLDServer: "newton.tmicloud.net:443",
  ServerInstance: "COL@columbus.tmicloud.net:30013",
  CompanySchema: "SEPL_TEST",
  UserName: "TMICLOUD\\sepl.user01",
  Password: "Sastika@121120"
}






// Fetch data from the PostgreSQL fg_stocktable
// const fetchFGStockData = async () => {
//   const query = 'SELECT * FROM data_traceability'; // Modify this to your actual query

//   try {
//     const result = await pool.query(query);
//     console.log(`Step 1: Fetched ${result.rowCount} rows from fg_stocktable.`);
//     return result.rows; // Return the fetched data
//   } catch (error) {
//     console.error("Error fetching data from fg_stocktable:", error.message);
//     throw error;
//   }
// };

// // Define the GET route to fetch data from the database
// router.get('/get-fg-stock', async (req, res) => {
//   try {
//     const fgStockData = await fetchFGStockData(); // Fetch the data from the table
//     res.json(fgStockData);  // Send the data back to the client as JSON
//     console.log(fgStockData);
    
//   } catch (error) {
//     console.error("Error in GET route:", error.message);
//     res.status(500).json({ message: "Failed to fetch data", error: error.message });  // Return an error response
//   }
// });


const fetch_Stamping_Station_A_Data = async () => {
  const query = 'SELECT * FROM stamping_station'; // Modify this to your actual query

  try {
    const result = await pool.query(query);
    console.log(`Step 1: Fetched ${result.rowCount} rows from fg_stocktable.`);
    return result.rows; // Return the fetched data
  } catch (error) {
    console.error("Error fetching data from fg_stocktable:", error.message);
    throw error;
  }
};

// Define the GET route to fetch data from the database
router.get('/stamping-station-a', async (req, res) => {
  try {
    const stampStation = await fetch_Stamping_Station_A_Data(); // Fetch the data from the table
    res.json(stampStation);  // Send the data back to the client as JSON
    // console.log(stampStation);
    
  } catch (error) {
    console.error("Error in GET route:", error.message);
    res.status(500).json({ message: "Failed to fetch data", error: error.message });  // Return an error response
  }
});


















// Function to log in and get session ID for Manufacturing Data
const ManufacturingOrderLogin = async () => {
  try {
    const response = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error(`Failed to log in: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Step 2: Login Successful for MO API");
    return data.SessionId; // Return the session ID
  } catch (error) {
    console.error("Login Error:", error.message);
    throw error;
  }
};

// Function to fetch data using the session ID
const getManufacturingOrder = async (sessionId) => {
  try {
    const response = await fetch(dataUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: `B1SESSION=${sessionId}`, // Session ID in the Cookie header
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Step 3: Manufacturing API Data : ${data.value.length}`);
   // console.log(data)

    // Filter data where UpdateDate matches today's date
    const currentDate = "2024-07-30"; // Replace with dynamic date or current date
    const filteredData = data.value.filter((item) => item.UpdateDate === currentDate);
  
    
    console.log(`Step 4: Filtered Manufacturing API Data Count: ${filteredData.length}`);
   //console.log("Filtered Data:", filteredData);

    return filteredData;
  } catch (error) {
    console.error("Data Fetch Error:", error.message);
    throw error;
  }
};

const compareData = (fgStockData, apiData) => {
  // Helper function to normalize strings
  const normalizeString = (str) =>
    (str || "")
      .trim() // Remove leading/trailing spaces
      .replace(/\s+/g, " ") // Replace multiple spaces with a single space
      .replace(/[\u00A0\u200B-\u200D\uFEFF]/g, "") // Remove invisible spaces
      .toLowerCase(); // Convert to lowercase

  // Helper function to generate keys
  const generateKey = (part1, part2) =>
    `${normalizeString(part1)}|${normalizeString(part2)}`;

  const fgStockMap = new Map();
  fgStockData.forEach((fgItem) => {
    const key = generateKey(fgItem.variant, fgItem.part_description);
    fgStockMap.set(key, fgItem);
  });

  const matchingRecords = [];
  apiData.forEach((apiItem) => {
    const key = generateKey(apiItem.U_ItemCode, apiItem.U_Description);
    if (fgStockMap.has(key)) {
      matchingRecords.push({
        fgStockRecord: fgStockMap.get(key),
        apiRecord: apiItem,
      });
    }
  });

  console.log(`\n Step 5 - Matching Records Found: ${matchingRecords.length}`);

  
  if (matchingRecords.length <= 0) {
    console.log("No matching records found. Please check the data.");
    //process.exit(1); // Kill the process with exit code 1 (indicating failure)
  }

  const combinedData = matchingRecords.map((record) => ({
    fgStockData: record.fgStockRecord,
    apiData: record.apiRecord,
  }));
   
  // Return the combined data
  return { matchedData: combinedData };
};

const pickReceiptLogin = async () => {
  try {

    const response = await fetch(pick_loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data_credentials),
    });
    sessionId = response.headers.get('Set-Cookie');
    // console.log(sessionId);
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }
    sessiondata = response.sessionId
    console.log("Step 6: Login Verified. Authorization granted to POST.");
    return // Indicate successful login
  } catch (error) {
    console.error("Login Error:", error.message);
    throw error;
  }
};

const postPickreceipt = async (mappedData) => {
  const client = await pool.connect();
  try {
  

    // POST request to send the dummy pick receipt data
    const postResponse = await fetch(pick_dataUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie" : sessionId
        //Cookie: `CTSessionId=AQAAANCMnd8BFdERjHoAwE_Cl-sBAAAAdtHbSuAxXk64Sq0qACbgQwAAAAACAAAAAAADZgAAwAAAABAAAAC66UkuxdGeOaiMS_nMRN8NAAAAAASAAACgAAAAEAAAAMswMQMAa0x4V4nxhx8V9tX4AAAA1rs1yeLtLV_tZBSRLUsUfj0iDYEkde5qUB30eTdtzKUSHyxvVDTyzUYeJ5HrxaAnKDXgojMpBpkYvyZXgagV_r9P7BBxaFmGw4pn7u1M290QqZEzhtlcW-Z_a082XBLPrzcPh8R24d84lufUW_QhXdkWTtTwqsClo-knGKwUiBAJmAnOgEjblsQxpqrv3vfyJvobRkKm9f7bVqDGOiqVII_1_MNwX2NjF5mPaLY_sWagVCMTfogHJZVCJ8t135QWMehEQAqPeoE8o9kz6aRUZFM3yOwyY6PPb3DwEZB-_reWQWZ2Ou1Ety1mwHC5_zOiRdf8ayZPppMUAAAAiu9hgXC2Cp32UzV-0kj8IxpOXpk`, // Session ID in the Cookie header
      },
      body: JSON.stringify(mappedData),
      credentials: "include",
    });

    if (!postResponse.ok) {
      throw new Error(`Failed to post pick receipt data: ${postResponse.statusText}`);
    }

    const result = await postResponse.json();
    console.log("Step 6: Pick receipt data posted successfully:");
  
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error inserting data or posting API:", error.message);
    throw error;
  } finally {
    client.release();
  }
};

// Main function to log in, fetch data, and compareq
const processData = async () => {
  try {
    const fgStockData = await fetchFGStockData(); // Step 1: Fetch fg_stocktable data from PostgreSQL
    const sessionId = await ManufacturingOrderLogin(); // Step 2: Login to get session ID
    const apiData = await getManufacturingOrder(sessionId); // Step 3: Fetch data from SAP API
    if(matchingRecords !== 0){
      
    }
    const { matchedData } = await compareData(fgStockData, apiData); // Step 4: Compare data
    await pickReceiptLogin(); 
    const formatDate = (date) => {
      return new Date(date).toISOString(); // Formats the date in the "YYYY-MM-DDTHH:mm:ssZ" format
    };
    
    // Assuming U_Date is being set as Date.now() (a timestamp)
    const formattedDate = formatDate(Date.now());
    const formatString = (any)=> {
      return String(any)
    }
  
     // Map the combined data to match the expected structure for insertData
     const mappedData = matchedData.map(record => ({
      "Object": "CT_PF_PickReceipt",
      "Status": "O",
      "U_Date": formattedDate,
      "RequiredItems": [
          {
              "U_DocType": "59",
              "U_ItemCode": String(record.apiData.U_ItemCode),
              "U_PlannedQty": 1.0,
              "U_ReceiptedQty": 0.0,
              "U_PickedQty": 1.0,
              "U_DstWhsCode": "QC",
              "U_AccCode": "110301009",
              "U_BaseType": "999000001",
              "U_BaseEntry": String(record.apiData.DocEntry),
              "U_BaseLineNo": 0,
              "U_BaseRef": "HR",
              "U_RefLine": 0,
              "U_RevisionCode": "code00",
              "U_Price": 0.00,
              "U_LineNum": 1,
              "PickedItems": [
                  {
                      "U_ItemCode": String(record.apiData.U_ItemCode),
                      "U_LicPlateItemCode": 0,
                      "U_Revision": "code00",
                      "U_Receipted": "N",
                      "U_BnDistNumber": String(record.fgStockData.batch_num),
                      "U_Quantity": 1.0,
                      "U_BnInDate": formattedDate,
                      "U_BnMnfDate": formattedDate,
                      "U_BnExpDate": "0001-01-01T00:00:00Z",
                      "U_BnExpTime": formattedDate,
                      "U_BnWExpDate": "0001-01-01T00:00:00Z",
                      "U_BnConsDate": "0001-01-01T00:00:00Z",
                      "U_BnWConsDate": "0001-01-01T00:00:00Z",
                      "U_BnInspDate": "0001-01-01T00:00:00Z",
                      "U_BnLInspDate": "0001-01-01T00:00:00Z",
                      "U_BnNInspDate": "0001-01-01T00:00:00Z",
                      "U_BnStatus": "Released",
                      "U_BnQCStatus": "Passed",
                      "U_SupNumber": "131120243227",
                      "U_BestBefDate": "0001-01-01T00:00:00Z"
                  }
              ],
              "WithDefauls": false,
              "UDFs": {}
          }
      ],
      "WithDefauls": false,
      "UDFs": {
          "U_ShiftDate": "0001-01-01T00:00:00Z",
          "U_ShiftType": String(record.fgStockData.shift),
          "U_PickReceipt": 1
      }
  }));
  for (let index = 0; index < mappedData.length; index++)   {
    console.log("Step 7 - Data being sent to API:", JSON.stringify(mappedData[index], null, 2));

    await postPickreceipt(mappedData[index]); 
  }

  } catch (error) {
    console.error("Error during process:", error.message);
  }
};

module.exports = { processData, router };

