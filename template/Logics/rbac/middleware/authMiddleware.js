// With express-session there is no token to look up.
// The session middleware already parsed the cookie and populated req.session
// before this function runs — we just check what's in it.

function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated. Please log in." });
    }
    // Attach user to req so controllers can use req.user (same API as before)
    req.user = req.session.user;
    next();
}

// Role guard — unchanged, still works exactly the same way
function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error:    "Access denied.",
                yourRole: req.user.role,
                required: roles,
            });
        }
        next();
    };
}

module.exports = { requireAuth, requireRole };
