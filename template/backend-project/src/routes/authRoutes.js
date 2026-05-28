const express = require("express");

const {
    register,
    login,
    logout,
    getMe,
} = require("../controllers/authCont");

const isAuthenticated = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.get("/me", getMe);

router.get(
    "/protected",
    isAuthenticated,
    (req, res) => {
        res.json({
            message: "Protected route accessed",
        });
    }
);

module.exports = router;