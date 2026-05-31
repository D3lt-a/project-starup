const express = require("express");

const router = express.Router();

const busController = require("../controllers/busController");

const {
    requireAuth,
    requireRole,
} = require("../middleware/authMiddleware");

router.get("/", requireAuth, busController.getAllBuses);

router.get("/:id", requireAuth, busController.getBusById);

router.post(
    "/",
    requireAuth,
    requireRole("manager"),
    busController.createBus
);

router.put(
    "/:id",
    requireAuth,
    requireRole("manager"),
    busController.updateBus
);

router.delete(
    "/:id",
    requireAuth,
    requireRole("manager"),
    busController.deleteBus
);

module.exports = router;