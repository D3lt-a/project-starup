const express = require("express");

const router = express.Router();

const bookingController = require("../controllers/bookingController");

const {
    requireAuth,
    requireRole,
} = require("../middleware/authMiddleware");

router.get("/", requireAuth, bookingController.getBookings);

router.post(
    "/",
    requireAuth,
    requireRole("customer"),
    bookingController.createBooking
);

router.delete(
    "/:id",
    requireAuth,
    requireRole("customer"),
    bookingController.cancelBooking
);

module.exports = router;