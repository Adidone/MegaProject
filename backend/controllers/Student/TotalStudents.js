const pool = require("../../db");

const TotalStudents = async(req, res) => {
    const client = await pool.connect();

    try{
        const{route_id} = req.body;
        if(!route_id){
            await client.query('ROLLBACK');
            return res.status(400).json({message: "Missing required field: route_id", success: false});
        }
        const totalStudentsQuery = `
            SELECT COUNT(*) AS total_students
            FROM students
            WHERE route_id = $1     
        `;
        const totalStudentsResult = await client.query(totalStudentsQuery, [route_id]);
        const totalStudents = totalStudentsResult.rows[0].total_students;
        return res.status(200).json({
            success: true,
            total_students: totalStudents
        });
    }
    catch(error){   
        console.error("Error fetching total students:", error);
        res.status(500).json({ message: "Internal server error", success: false });
    } finally {
        client.release();
    }
}  
module.exports = TotalStudents;