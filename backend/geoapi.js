const axios = require("axios");
const { getToken } = require("./GetToken.js");

async function geoApi(address) {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token available");

    
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "MyBusApp/1.0 (adidone07@gmail.com)", 
      },
    });

    if (response.data.length === 0) {
      throw new Error("No results found for this address");
    }
    // console.log(response)

    const { lat, lon } = response.data[0];
    return { latitude: parseFloat(lat), longitude: parseFloat(lon) };

  } catch (err) {
    console.error("MMI API Error:", err.response?.data || err.message);
    return null;
  }
}

module.exports = { geoApi };