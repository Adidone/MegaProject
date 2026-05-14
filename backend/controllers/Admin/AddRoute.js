const pool = require("../../db");
const { getToken } = require("../../GetToken");
const axios = require("axios");
require("dotenv").config();

const MMI_API_KEY = process.env.MMI_API_KEY;

const AddRoute = async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, start_stop_id, end_stop_id, middle_stop_ids = [], shift } = req.body;

    await client.query('BEGIN');

    if (!name || !start_stop_id || !end_stop_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: "All fields are required (name, start_stop_id, end_stop_id)",
        success: false,
      });
    }

    const existingRoute = await client.query(
      "SELECT * FROM routes WHERE name = $1",
      [name]
    );
    if (existingRoute.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: "Route with this name already exists",
        success: false,
      });
    }

    const allStopIds = [Number(start_stop_id), ...middle_stop_ids.map(Number), Number(end_stop_id)];

    const stopsQuery = await client.query(
      "SELECT id, latitude, longitude, name FROM stops WHERE id = ANY($1::int[])",
      [allStopIds]
    );

    const stopsMap = {};
    stopsQuery.rows.forEach(stop => {
      stopsMap[stop.id] = stop;
    });

    for (let id of allStopIds) {
      if (!stopsMap[id]) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `Invalid stop ID: ${id}`,
          success: false,
        });
      }
    }

    const coordsArray = allStopIds.map(id => `${stopsMap[id].longitude},${stopsMap[id].latitude}`);
    const coordsString = coordsArray.join(';');

    console.log(` Route Coordinates: ${coordsString}`);

    const token = await getToken();
    if (!token) {
      await client.query('ROLLBACK');
      return res.status(500).json({ message: "Failed to get MMI token" });
    }

    const url = `https://apis.mapmyindia.com/advancedmaps/v1/${MMI_API_KEY}/route_adv/driving/${coordsString}?geometries=polyline&overview=full`;
    console.log("MMI API URL:", url);

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.data.routes || response.data.routes.length === 0) {
      throw new Error("No route found for these stops");
    }

    const routeData = response.data.routes[0];
    const totalDistance = (routeData.distance / 1000).toFixed(2);
    const legs = routeData.legs || [];

    console.log(" Total Distance (km):", totalDistance);

    const addRouteQuery = `
      INSERT INTO routes (name, start_stop_id, end_stop_id, total_distance, shift)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const result = await client.query(addRouteQuery, [
      name,
      start_stop_id,
      end_stop_id,
      totalDistance,
      shift || 'Morning'
    ]);

    const newRoute = result.rows[0];

    // Insert all stops into route_stops
    for (let i = 0; i < allStopIds.length; i++) {
      let distFromPrev = 0;
      if (i > 0 && legs[i - 1]) {
        distFromPrev = (legs[i - 1].distance / 1000).toFixed(2);
      }
      await client.query(
        `INSERT INTO route_stops (route_id, stop_id, stop_order, distance_from_previous_stop)
         VALUES ($1, $2, $3, $4)`,
        [newRoute.id, allStopIds[i], i + 1, distFromPrev]
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({
      message: "Route added successfully",
      route: newRoute,
      success: true,
    });
  } catch (error) {
    console.error("Error adding route:", error.message);

    if (error.response) {
      await client.query('ROLLBACK');
      console.error("MMI API Error:", error.response.data);
      return res.status(error.response.status).json({
        message: error.response.data.error || "Error with MMI API",
        success: false,
      });
    }
    await client.query('ROLLBACK');
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
  } finally {
    client.release();
  }
};

module.exports = AddRoute;
