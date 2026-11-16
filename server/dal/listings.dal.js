// DAL for listings - runs the SQL through the pool and returns the rows. No req / res here.
// Always pass values with .input(...) and use @name in the query.
//
// Step 2: getListings({ neighbourhood, roomType, minPrice, maxPrice, orderBy, limit })
//   SELECT TOP (@limit) ... FROM dbo.Paris_Airbnb_listings WHERE price IS NOT NULL ... ORDER BY ...
//   Build the fields in SQL: CONCAT (title), UPPER (propertyType), CAST ... AS INT, ROUND (stars)
//
// Step 3: getListingById(id)
//   DATEADD (hostSince), YEAR (hostSinceYear), DATEDIFF + GETDATE (yearsHosting), LEN (aboutLength)

const { sql, poolPromise } = require("../config/db");

const cardColumns = `
  CAST(id AS INT) AS id,
  CONCAT(room_type, ' in ', neighbourhood_cleansed) AS title,
  UPPER(property_type) AS propertyType,
  room_type AS roomType,
  neighbourhood_cleansed AS neighbourhood,
  CAST(price AS INT) AS pricePerNight,
  ROUND(review_scores_rating / 20.0, 1) AS stars,
  CAST(number_of_reviews AS INT) AS reviewsCount,
  CAST(bedrooms AS INT) AS bedrooms,
  CAST(beds AS INT) AS beds,
  CAST(accommodates AS INT) AS accommodates
`;

async function findListings({
  neighbourhood,
  roomType,
  minPrice,
  maxPrice,
  orderBy,
  limit,
}) {
  const pool = await poolPromise;
  const request = pool.request().input("limit", sql.Int, limit);
  const conditions = ["price IS NOT NULL"];

  const filters = [
    ["neighbourhood", sql.NVarChar, neighbourhood, "neighbourhood_cleansed = @neighbourhood"],
    ["roomType", sql.NVarChar, roomType, "room_type = @roomType"],
    ["minPrice", sql.Float, minPrice, "price >= @minPrice"],
    ["maxPrice", sql.Float, maxPrice, "price <= @maxPrice"],
  ];

  for (const [name, type, value, condition] of filters) {
    if (value === undefined) continue;

    request.input(name, type, value);
    conditions.push(condition);
  }

  // The controller picks orderBy from two fixed SQL fragments.
  const result = await request.query(`
    SELECT TOP (@limit) ${cardColumns}
    FROM dbo.Paris_Airbnb_listings
    WHERE ${conditions.join(" AND ")}
    ORDER BY ${orderBy}
  `);

  return result.recordset;
}

async function findListingById(id) {
  const pool = await poolPromise;

  const result = await pool.request().input("id", sql.Float, id).query(`
    SELECT ${cardColumns},
      CAST(bathrooms AS INT) AS bathrooms,
      latitude,
      longitude,
      CAST(host_id AS INT) AS hostId,
      host_name AS hostName,
      host_is_superhost AS hostIsSuperhost,
      dates.hostSince AS hostSince,
      YEAR(dates.hostSince) AS hostSinceYear,
      DATEDIFF(year, dates.hostSince, GETDATE()) AS yearsHosting,
      host_about AS hostAbout,
      CAST(LEN(host_about) AS INT) AS aboutLength
    FROM dbo.Paris_Airbnb_listings
    CROSS APPLY (
      VALUES (DATEADD(day, host_since - 2, '1900-01-01'))
    ) AS dates(hostSince)
    WHERE id = @id
  `);

  return result.recordset[0];
}

module.exports = { cardColumns, findListings, findListingById };