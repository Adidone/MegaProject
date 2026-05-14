const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const pool = require("./db");
require("dotenv").config();
const cors = require("cors");
const path = require("path");

const { geoApi } = require("./geoapi.js");

const PORT = process.env.PORT || 5555;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());

app.use(cors({
  origin: "*"
}));

// Routes
const AdminRoutes = require("./routes/AdminRoute.js");
const StudentRoutes = require("./routes/StudentRoute.js");
const DriverRoutes = require("./routes/DriverRoute.js");

// API Endpoints
app.use("/admin", AdminRoutes);
app.use("/student", StudentRoutes);
app.use("/driver", DriverRoutes);

app.use(express.static(path.join(__dirname, "driver")));
app.use(express.static(path.join(__dirname, "admin")));

// Make io accessible to routes via middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});



// WebSocket connections for real-time tracking
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('subscribe-driver', (driverId) => {
    socket.join(`driver-${driverId}`);
    console.log(`User ${socket.id} subscribed to driver-${driverId}`);
  });

  socket.on('send-location', (data) => {
    io.emit('receive-location', {
      id: data.driver_id,
      latitude: data.latitude,
      longitude: data.longitude
    });
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.get("/geoapi", async (req, res) => {
  try {
    const geo = await geoApi();
    if (geo) {
      res.json(geo);
    } else {
      res.status(500).json({ error: "Failed to fetch geo data" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/db", async (req, res) => {
  try {
    await pool.query("SELECT NOW()");
    console.log("DB Connected");
    return res.send("DB Connected");
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "database failed",
    });
  }
});

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head><title>Bus Management System 1</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>🚌 Automated Bus Management System </h1>
        <p>Server is running successfully!</p>
        <h3>Available Routes:</h3>
        <ul style="list-style: none;">
          <li><a href="/driver.html">🚗 Driver Tracking</a></li>
          <li><a href="/student-tracking.html">👨‍💼 Student Tracking</a></li>
          <li><a href="/attendance.html">👨‍🎓 Student Portal</a></li>
        </ul>
      </body>
    </html>
  `);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server with WebSockets running on port ${PORT}`);
});