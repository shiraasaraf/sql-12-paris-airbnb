// Starts the server: node server.js (or npm start / npm run dev)
const app = require("./app");
const { poolPromise } = require("./config/db");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await poolPromise;
    console.log("Connected to SQL Server");
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();