// Controller for /api/hosts
//
// Step 4: getHostListings(req, res)
//   - hostId is not a number -> 400, no places found -> 404
//   - try/catch -> 500 { error }

const { findListingsByHost } = require("../dal/hosts.dal");

async function getHostListings(req, res) {
  const { hostId } = req.params;
  const id = Number(hostId);

  if (hostId.trim() === "" || !Number.isFinite(id)) {
    return res.status(400).json({ error: "hostId must be a number" });
  }

  try {
    const listings = await findListingsByHost(id);

    if (listings.length === 0) {
      return res.status(404).json({ error: "No listings found for this host" });
    }

    return res.json(listings);
  } catch (err) {
    console.error("Failed to load host listings:", err.message);
    return res.status(500).json({ error: "Failed to load host listings" });
  }
}

module.exports = { getHostListings };