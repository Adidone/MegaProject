const pool = require("../../db");

const GetDashboardStats = async (req, res) => {
    try {
        // 1. Total counts
        const countsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM buses) as total_buses,
                (SELECT COUNT(*) FROM routes) as total_routes,
                (SELECT COUNT(*) FROM students) as total_students,
                (SELECT COUNT(*) FROM drivers) as total_drivers
        `;
        const countsRes = await pool.query(countsQuery);
        const counts = countsRes.rows[0];

        // 2. Bus Status Distribution
        const busStatusQuery = `
            SELECT status, COUNT(*) as count 
            FROM buses 
            GROUP BY status
        `;
        const busStatusRes = await pool.query(busStatusQuery);
        
        // 3. Route-wise Student Occupancy
        // We'll join routes with the count of students assigned to them (morning_route_id)
        const routeOccupancyQuery = `
            SELECT 
                r.name, 
                COUNT(s.id) as students,
                COALESCE((SELECT SUM(capacity) FROM buses b JOIN trips t ON b.id = t.bus_id WHERE t.route_id = r.id), 0) as capacity
            FROM routes r
            LEFT JOIN students s ON r.id = s.morning_route_id
            GROUP BY r.id, r.name
            LIMIT 10
        `;
        const routeOccupancyRes = await pool.query(routeOccupancyQuery);

        // 4. Latest Critical Alerts
        const alertsQuery = `
            SELECT id, title, message, created_at, target
            FROM alerts 
            ORDER BY created_at DESC 
            LIMIT 5
        `;
        const alertsRes = await pool.query(alertsQuery);

        return res.status(200).json({
            success: true,
            data: {
                stats: {
                    buses: parseInt(counts.total_buses),
                    routes: parseInt(counts.total_routes),
                    students: parseInt(counts.total_students),
                    drivers: parseInt(counts.total_drivers)
                },
                busStatus: busStatusRes.rows,
                routeOccupancy: routeOccupancyRes.rows.map(r => ({
                    name: r.name,
                    students: parseInt(r.students),
                    capacity: parseInt(r.capacity) || 50 // Default capacity if no bus assigned
                })),
                latestAlerts: alertsRes.rows
            }
        });

    } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetDashboardStats;
