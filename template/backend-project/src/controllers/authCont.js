const bcrypt = require("bcryptjs");
const db = require("../config/db");

const register = async (req, res) => {
    try {
        const {
            username,
            useremail,
            userpassword,
        } = req.body;

        const [existingUser] = await db.query(
            "SELECT * FROM users WHERE useremail = ?",
            [useremail]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                message: "Email already exists",
            });
        }

        const hashedPassword =
            await bcrypt.hash(userpassword, 10);

        await db.query(
            `
            INSERT INTO users
            (username, useremail, userpassword)
            VALUES (?, ?, ?)
            `,
            [
                username,
                useremail,
                hashedPassword,
            ]
        );

        res.status(201).json({
            message:
                "User registered successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: "Registration failed",
        });
    }
};

const login = async (req, res) => {
    try {
        const {
            useremail,
            userpassword,
        } = req.body;

        const [users] = await db.query(
            "SELECT * FROM users WHERE useremail = ?",
            [useremail]
        );

        if (users.length === 0) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        const user = users[0];

        const isMatch =
            await bcrypt.compare(
                userpassword,
                user.userpassword
            );

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            useremail: user.useremail,
        };

        res.json({
            message: "Login successful",
            user: req.session.user,
        });
    } catch (error) {
        res.status(500).json({
            message: "Login failed",
        });
    }
};

const logout = async (req, res) => {
    try {
        req.session.destroy();

        res.clearCookie("connect.sid");

        res.json({
            message: "Logout successful",
        });
    } catch (error) {
        res.status(500).json({
            message: "Logout failed",
        });
    }
};

const getMe = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        res.json(req.session.user);
    } catch (error) {
        res.status(500).json({
            message: "Server error",
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    getMe,
};