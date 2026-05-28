const isAuthenticated = (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            message: "Server error",
        });
    }
};

module.exports = isAuthenticated;