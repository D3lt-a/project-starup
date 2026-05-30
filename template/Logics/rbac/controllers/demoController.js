// These are demo endpoints that exist purely to show RBAC in action.
// In a real app you'd replace these with your actual business routes.

// GET /api/demo/customer — any logged-in user
exports.customerArea = (req, res) => {
    res.json({
        message: `Hello ${req.user.name}! You reached the customer area.`,
        access:  "all authenticated users",
        you:     req.user,
    });
};

// GET /api/demo/manager — manager or admin only
exports.managerArea = (req, res) => {
    res.json({
        message: `Hello ${req.user.name}! You reached the manager area.`,
        access:  "manager + admin",
        you:     req.user,
    });
};

// GET /api/demo/admin — admin only
exports.adminArea = (req, res) => {
    res.json({
        message: `Hello ${req.user.name}! You reached the admin area.`,
        access:  "admin only",
        you:     req.user,
    });
};

// GET /api/demo/users — admin only: list all users
exports.listUsers = async (req, res) => {
    const db    = require("../db");
    const [rows] = await db.query(
        "SELECT id, name, email, role, created_at FROM users ORDER BY id"
    );
    res.json(rows);
};
