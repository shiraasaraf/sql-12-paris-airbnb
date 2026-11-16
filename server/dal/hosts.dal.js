// DAL for hosts
//
// Step 4: getListingsByHost(hostId)
//   WHERE host_id = @hostId AND price IS NOT NULL, ORDER BY price ASC
//   UPPER(host_name) AS hostName + the same card fields as Step 2

const { sql, poolPromise } = require("../config/db");
const { cardColumns } = require("./listings.dal");

async function findListingsByHost(hostId) {
  const pool = await poolPromise;

  const result = await pool.request().input("hostId", sql.Float, hostId).query(`
    SELECT ${cardColumns}, UPPER(host_name) AS hostName
    FROM dbo.Paris_Airbnb_listings
    WHERE host_id = @hostId AND price IS NOT NULL
    ORDER BY price ASC
  `);

  return result.recordset;
}

module.exports = { findListingsByHost };