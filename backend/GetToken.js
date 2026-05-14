const axios = require("axios");
require("dotenv").config();

const CLIENT_ID = process.env.MMI_CLIENT_ID;
const CLIENT_SECRET = process.env.MMI_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiry = null;

async function getToken() {
  if (cachedToken && tokenExpiry > Date.now()) {
    return cachedToken; // Reuse cached token
  }

  try {
    const res = await axios.post(
      "https://outpost.mapmyindia.com/api/security/oauth/token",
      null,
      {
        params: {
          grant_type: "client_credentials",
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        },
      }
    );

    cachedToken = res.data.access_token;
    tokenExpiry = Date.now() + res.data.expires_in * 1000;
    console.log("Token Sucessfull")
    return cachedToken;
  } catch (err) {
    console.error("Error fetching MMI token:", err.response?.data || err.message);
    return null;
  }
}

module.exports = { getToken };
