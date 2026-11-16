// The Express app (without listen - server.js starts it, and the tests use this file directly)
const express = require("express");

const app = express();
app.use(express.json());

app.use("/api/listings", require("./routes/listings.routes"));
app.use("/api/hosts", require("./routes/hosts.routes"));

app.use("/api", (req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

module.exports = app;