const pool = require("../../db.js");

const DriverLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const result = await pool.query(
            "SELECT * FROM drivers WHERE email = $1 AND password = $2",
            [email, password]
        );

        if (result.rows.length > 0) {
            const driver = result.rows[0];
            // Remove password from response
            delete driver.password;

            return res.status(200).json({
                success: true,
                message: "Logged in successfully",
                data: driver
            });
        } else {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
    } catch (err) {
        console.error("Driver login error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = DriverLogin;
