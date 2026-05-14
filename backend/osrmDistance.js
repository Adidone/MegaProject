async function calculateRoadDistanceOSRM(fromLat, fromLon, toLat, toLon) {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=false`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.routes || !data.routes[0]) {
            console.log("OSRM no route found");
            return null;
        }

        return {
            distance: data.routes[0].distance / 1000,  // KM
            duration: data.routes[0].duration / 60     // MINUTES
        };
    } catch (err) {
        console.error("OSRM error:", err);
        return null;
    }
}

module.exports = calculateRoadDistanceOSRM;
