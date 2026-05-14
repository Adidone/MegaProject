const pool = require("../../db.js");

const ExportData = async (req, res) => {
    try {
        const { module } = req.params;
        let csvContent = "";
        let filename = `${module}_report_${new Date().toISOString().split('T')[0]}.csv`;

        const escapeCSV = (val) => {
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        };

        if (module === "students") {
            const result = await pool.query(`
                SELECT s.id, s.roll_no, s.name, s.email, s.phone, r1.name as morning_route, r2.name as evening_route, st.name as stop, s.status
                FROM students s
                LEFT JOIN routes r1 ON s.morning_route_id = r1.id
                LEFT JOIN routes r2 ON s.evening_route_id = r2.id
                LEFT JOIN stops st ON s.stop_id = st.id
            `);
            const headers = ["ID", "Roll No", "Name", "Email", "Phone", "Morning Route", "Evening Route", "Stop", "Status"];
            csvContent = headers.join(",") + "\n" +
                result.rows.map(r => [
                    r.id, r.roll_no, r.name, r.email, r.phone, r.morning_route, r.evening_route, r.stop, r.status
                ].map(escapeCSV).join(",")).join("\n");

        } else if (module === "drivers") {
            const result = await pool.query(`
                SELECT d.id, d.name, d.email, d.phone, d.liscence_no as license, d.status, b.bus_number
                FROM drivers d
                LEFT JOIN trips t ON d.id = t.driver_id
                LEFT JOIN buses b ON t.bus_id = b.id
            `);
            const headers = ["ID", "Name", "Email", "Phone", "License", "Status", "Assigned Bus"];
            csvContent = headers.join(",") + "\n" +
                result.rows.map(r => [
                    r.id, r.name, r.email, r.phone, r.license, r.status, r.bus_number
                ].map(escapeCSV).join(",")).join("\n");

        } else if (module === "buses") {
            const result = await pool.query(`
                SELECT b.id, b.bus_number, b.capacity, b.status, d.name as driver, r.name as route
                FROM buses b
                LEFT JOIN trips t ON b.id = t.bus_id
                LEFT JOIN drivers d ON t.driver_id = d.id
                LEFT JOIN routes r ON t.route_id = r.id
            `);
            const headers = ["ID", "Bus Number", "Capacity", "Status", "Driver", "Route"];
            csvContent = headers.join(",") + "\n" +
                result.rows.map(r => [
                    r.id, r.bus_number, r.capacity, r.status, r.driver, r.route
                ].map(escapeCSV).join(",")).join("\n");

        } else if (module === "routes") {
            const result = await pool.query(`
                SELECT r.id, r.name, r.shift, s1.name as start_stop, s2.name as end_stop
                FROM routes r
                LEFT JOIN stops s1 ON r.start_stop_id = s1.id
                LEFT JOIN stops s2 ON r.end_stop_id = s2.id
            `);
            const headers = ["ID", "Route Name", "Shift", "Start Stop", "End Stop"];
            csvContent = headers.join(",") + "\n" +
                result.rows.map(r => [
                    r.id, r.name, r.shift, r.start_stop, r.end_stop
                ].map(escapeCSV).join(",")).join("\n");

        } else if (module === "trips") {
            const result = await pool.query(`
                SELECT t.id, r.name as route, b.bus_number, d.name as driver, t.shift, t.status
                FROM trips t
                JOIN routes r ON t.route_id = r.id
                JOIN buses b ON t.bus_id = b.id
                JOIN drivers d ON t.driver_id = d.id
            `);
            const headers = ["ID", "Route", "Bus", "Driver", "Shift", "Status"];
            csvContent = headers.join(",") + "\n" +
                result.rows.map(r => [
                    r.id, r.route, r.bus_number, r.driver, r.shift, r.status
                ].map(escapeCSV).join(",")).join("\n");
        } else {
            return res.status(400).json({ success: false, message: "Invalid module" });
        }

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
        return res.status(200).send(csvContent);

    } catch (err) {
        console.error("Export error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = ExportData;
