
const express = require("express");
const AddDriver = require("../controllers/Driver/AddDriver.js");
const StopStudents = require("../controllers/Driver/StopStudents.js");
const DriverTrip = require(".././controllers/Driver/DriverTrip.js");
const UpdateLocation = require("../controllers/Driver/UpdateLocation.js");
const GetETA = require("../controllers/Driver/GetEta.js");
const ResetRoute = require("../controllers/Driver/ResetRoute.js");
const GetCompletedStops = require("../controllers/Driver/GetCompletedStops.js");
const GetLiveLocations = require("../controllers/Driver/GetLiveLocations.js");
const ClearLocation = require("../controllers/Driver/ClearLocation.js");
const GetStopStudentCount = require("../controllers/Driver/GetStopStudentCount.js");
const DriverLogin = require("../controllers/Driver/DriverLogin.js");
const GetDriverNotifications = require("../controllers/Driver/GetDriverNotifications.js");
const GetDriverDashboard = require("../controllers/Driver/GetDriverDashboard.js");
const GetDriverHistory = require("../controllers/Driver/GetDriverHistory.js");
const GetDriverProfile = require("../controllers/Driver/GetDriverProfile.js");
const router = express.Router();

router.post("/add",AddDriver);
router.post("/login", DriverLogin);
router.post("/stopstudents",StopStudents);
router.get("/driver-routes/:id",DriverTrip);
router.post("/update-location", UpdateLocation);
router.get("/eta/:driverId", GetETA);
router.post("/reset-route", ResetRoute);
router.get("/completed-stops/:driverId", GetCompletedStops);
router.get("/location/:driverId", GetLiveLocations);
router.post("/clear-location", ClearLocation);
router.get("/stop-student-count", GetStopStudentCount);
router.get("/notifications/:driverId", GetDriverNotifications);
router.get("/dashboard/:driverId", GetDriverDashboard);
router.get("/history/:driverId", GetDriverHistory);
router.get("/profile/:driverId", GetDriverProfile);

module.exports = router;