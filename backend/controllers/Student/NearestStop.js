
const { default: axios } = require("axios");
const pool = require("../../db.js");
const { getToken } = require("../../GetToken.js");
const { geoApi } = require("../../geoapi.js");
require("dotenv").config();


function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        0.5 - Math.cos(dLat) / 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        (1 - Math.cos(dLon)) / 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const NearestStop = async (address) => {
    
    const client = await pool.connect();
    try {
        const token = await getToken();
        const apiKey = process.env.MMI_API_KEY;
        const { latitude, longitude } = await geoApi(address);
        const addressCords = `${latitude},${longitude}`;
        // console.log(addressCords);
        

        const stopsQuery = 'SELECT id, latitude, longitude, name FROM stops;';
        const stopsResult = await client.query(stopsQuery);
        const allStops = stopsResult.rows;
        if (allStops.length === 0) {
            throw new Error('No bus stops found in the database.');
        }
        

        const nearestStopData = allStops.reduce((closest, currentStop) => {
            const distanceInKm = haversineDistance(
                latitude, longitude,
                currentStop.latitude, currentStop.longitude
            );

            
            if (!closest) {
                return { ...currentStop, distance: distanceInKm };
            }

           
            if (distanceInKm < closest.distance) {
                return { ...currentStop, distance: distanceInKm };
            }
        
            
            return closest;
        }, null);

        
        // console.log(nearestStopData);

        const routeResult = await client.query(
            "SELECT route_id FROM route_stops WHERE stop_id = $1 LIMIT 1",
            [nearestStopData.id]
        );
        // console.log(routeResult);
        
        const route_id = routeResult.rows.length > 0 ? routeResult.rows[0].route_id : null;
        // console.log(route_id);
        
        
        

        await client.query('COMMIT');
        return {
            stop_id: nearestStopData.id, 
            stop_name: nearestStopData.name,
            route_id
        };
    }
    catch (err) {
        await client.query('ROLLBACK');
        return err.message;
    } finally {
        client.release();
    }
}

module.exports = NearestStop;