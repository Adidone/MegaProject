const pool = require("../../db");
const axios = require("axios");

const GetETA = async (req, res) => {
    try {
        const driverId = req.params;

        const driver_id = req.params.driverId;

        // 1️⃣ Get driver current location
        const driverRes = await pool.query(
            "SELECT latitude, longitude FROM driver_live_location WHERE driver_id=$1",
            [driver_id]
        );

        if (driverRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "No live location found" });
        }

        const { latitude, longitude } = driverRes.rows[0];

        const routeRes = await pool.query(
            "SELECT route_id FROM trips WHERE driver_id=$1",
            [driver_id]
        );
        // 2️⃣ Get the NEXT incomplete stop by stop_order
        const stopRes = await pool.query(
            `SELECT s.id, s.name, s.latitude, s.longitude, rs.stop_order
             FROM route_stops rs
             JOIN stops s ON rs.stop_id = s.id
             LEFT JOIN completed_stops cs ON cs.stop_id = s.id AND cs.driver_id = $1
             WHERE rs.route_id = $2 AND cs.stop_id IS NULL
             ORDER BY rs.stop_order ASC
             LIMIT 1`,
            [driver_id,routeRes.rows[0].route_id]
        );

        if (stopRes.rows.length === 0) {
            return res.json({
                success: true,
                message: "All stops completed!",
                next_stop: "Route Complete",
                eta_minutes: 0,
                distance_km: 0
            });
        }

        const nextStop = stopRes.rows[0];

        // 3️⃣ Call ORS API for ETA
        const orsRes = await axios.post(
            "https://api.openrouteservice.org/v2/directions/driving-car",
            {
                coordinates: [
                    [longitude, latitude],
                    [nextStop.longitude, nextStop.latitude]
                ]
            },
            {
                headers: {
                    "Authorization": process.env.ORS_API_KEY || "5b3ce3597851110001cf6248060d2fdd37ed411cba69c80b4ab04135",
                    "Content-Type": "application/json"
                }
            }
        );

        const durationSeconds = orsRes.data.routes[0].summary.duration;
        const distanceMeters = orsRes.data.routes[0].summary.distance;
        const etaMinutes = (durationSeconds / 60).toFixed(1);
        const distanceKm = (distanceMeters / 1000).toFixed(2);

        return res.json({
            success: true,
            next_stop: nextStop.name,
            stop_order: nextStop.stop_order,
            eta_minutes: etaMinutes,
            distance_km: distanceKm,
            next_stop_lat: nextStop.latitude,
            next_stop_lng: nextStop.longitude
        });

    } catch (err) {
        console.error("GetETA error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = GetETA;