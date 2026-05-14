const pool = require("../../db");

const LiveTrips = async (req, res) => {
  const { search, shift } = req.query;
  const client = await pool.connect();
  try {
    // Step 1: Get all live (scheduled) trips with filtering
    let tripsQuery = `
      SELECT 
        t.id AS trip_id,
        t.status AS trip_status,
        t.shift AS trip_shift,
        r.id AS route_id,
        r.name AS route_name,
        d.id AS driver_id,
        d.name AS driver_name,
        b.id AS bus_id,
        b.bus_number,
        b.status AS bus_status
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN drivers d ON t.driver_id = d.id
      JOIN buses b ON t.bus_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (shift && shift !== 'All') {
      params.push(`${shift}`);
      tripsQuery += ` AND t.shift::text ILIKE $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      tripsQuery += ` AND (r.name ILIKE $${params.length} OR b.bus_number ILIKE $${params.length})`;
    }

    tripsQuery += ` ORDER BY t.id DESC;`;

    const tripResult = await client.query(tripsQuery, params);

    if (tripResult.rows.length === 0) {
      return res.status(200).json({
        message: "No active or scheduled trips found",
        success: true,
        data: []
      });
    }

    // Step 2: Fetch all stops for the routes in these trips
    const routeIds = tripResult.rows.map((t) => t.route_id);
    const routeStopsQuery = `
      SELECT 
        rs.route_id,
        rs.stop_order,
        rs.distance_from_previous_stop,
        s.name AS stop_name,
        s.latitude,
        s.longitude
      FROM route_stops rs
      JOIN stops s ON rs.stop_id = s.id
      WHERE rs.route_id = ANY($1::int[])
      ORDER BY rs.route_id, rs.stop_order;
    `;
    const routeStops = await client.query(routeStopsQuery, [routeIds]);

    // Step 3: Organize stops per route
    const routeStopMap = {};
    routeStops.rows.forEach((stop) => {
      if (!routeStopMap[stop.route_id]) routeStopMap[stop.route_id] = [];
      routeStopMap[stop.route_id].push({
        order: stop.stop_order,
        name: stop.stop_name,
        lat: stop.latitude,
        lng: stop.longitude,
        distance_from_prev_km: stop.distance_from_previous_stop || 0,
      });
    });

    // Step 4: Combine trips + stops
    const liveTrips = tripResult.rows.map((trip) => ({
      id: trip.trip_id,
      route_id: trip.route_id,
      route_name: trip.route_name,
      driver_name: trip.driver_name,
      bus_id: trip.bus_id,
      bus_number: trip.bus_number,
      bus_status: trip.bus_status,
      shift: trip.trip_shift,
      status: trip.trip_status,
      stops: routeStopMap[trip.route_id] || [],
    }));

    // Step 5: Send response
    return res.status(200).json({
      message: "Live trips fetched successfully",
      success: true,
      total_trips: liveTrips.length,
      data: liveTrips,
    });

  } catch (error) {
    console.error("Error fetching live trips:", error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  } finally {
    client.release();
  }
};

module.exports = LiveTrips;
