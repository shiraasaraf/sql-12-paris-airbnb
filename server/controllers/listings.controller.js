// Controller for /api/listings - reads req.query / req.params, validates, calls the DAL,
// sets the status code and sends JSON. No SQL here.
//
// Step 2: getListings(req, res)
//   - read neighbourhood, roomType, minPrice, maxPrice, sort, limit from req.query
//   - validate: limit (default 20, max 50), minPrice/maxPrice are numbers, sort is "price" or "rating"
//     (anything else -> 400 { error })
//   - map sort to a column name here: ORDER BY can't be a parameter
//
// Step 3: getListingById(req, res)
//   - id is not a number -> 400, no such id -> 404
//   - convert hostIsSuperhost 't' / 'f' to true / false
//
// Every controller: try/catch -> 500 { error } when the DAL throws.
const { findListings, findListingById } = require("../dal/listings.dal");

const sortOptions = new Map([
  ["price", "price ASC"],
  ["rating", "review_scores_rating DESC"],
]);

function parseNumber(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return NaN;
  }

  return Number(value);
}

async function getListings(req, res) {
  const {
    neighbourhood,
    roomType,
    minPrice,
    maxPrice,
    sort = "price",
    limit = "20",
  } = req.query;

  const orderBy = sortOptions.get(sort);

  if ([neighbourhood, roomType].some((value) => value !== undefined && typeof value !== "string")) {
    return res.status(400).json({
      error: "neighbourhood and roomType must be strings",
    });
  }

  if (orderBy === undefined) {
    return res.status(400).json({ error: "sort must be price or rating" });
  }

  const parsedLimit = parseNumber(limit);

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    return res.status(400).json({ error: "limit must be a positive integer" });
  }

  const filters = {
    neighbourhood,
    roomType,
    orderBy,
    limit: Math.min(parsedLimit, 50),
  };

  for (const [name, value] of Object.entries({ minPrice, maxPrice })) {
    if (value === undefined) continue;

    const price = parseNumber(value);

    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({
        error: `${name} must be a non-negative number`,
      });
    }

    filters[name] = price;
  }

  try {
    const listings = await findListings(filters);
    return res.json(listings);
  } catch (err) {
    console.error("Failed to load listings:", err.message);
    return res.status(500).json({ error: "Failed to load listings" });
  }
}

async function getListingById(req, res) {
  const id = parseNumber(req.params.id);

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "id must be a number" });
  }

  try {
    const listing = await findListingById(id);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    return res.json({
      ...listing,
      hostIsSuperhost: listing.hostIsSuperhost === "t",
    });
  } catch (err) {
    console.error("Failed to load listing:", err.message);
    return res.status(500).json({ error: "Failed to load listing" });
  }
}

module.exports = { getListings, getListingById };