const express          = require("express");
const router           = express.Router();
const demoController   = require("../controllers/demoController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// Any logged-in user
router.get(
    "/customer",
    requireAuth,
    demoController.customerArea
);

// Manager or Admin
router.get(
    "/manager",
    requireAuth,
    requireRole("manager", "admin"),
    demoController.managerArea
);

// Admin only
router.get(
    "/admin",
    requireAuth,
    requireRole("admin"),
    demoController.adminArea
);

// Admin only — lists all users
router.get(
    "/users",
    requireAuth,
    requireRole("admin"),
    demoController.listUsers
);

module.exports = router;
