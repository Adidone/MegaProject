const pool = require("../../db");

const AdminLogin = async (req,res) =>{
    const client = await pool.connect();
    try{
        const{username,password} = req.body;
        
        if(username == "admin" && password == "123456"){
            await client.query('COMMIT');
            return res.status(201).json({
                success:true,
                message:"Logged In Successfully",
                username,
                password
            })
        }
        else{
            await client.query('ROLLBACK');
            return res.status(409).json({
                success:false,
                message:"Invalid Credentials",
                
            })
        }
    }
    catch(err){
        await client.query('ROLLBACK');
        return res.status(500).json({
            message:err.message,
            success:false
        })
    } finally {
        client.release();
    }
}

module.exports = AdminLogin;