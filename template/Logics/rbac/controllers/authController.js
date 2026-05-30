const bcrypt = require("bcrypt");
const db     = require("../db");

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const [rows] = await db.query(
        "SELECT * FROM users WHERE email = ?", [email]
    );

    if (rows.length === 0) {
        return res.status(401).json({ error: "Invalid email or password." });
    }

    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        return res.status(401).json({ error: "Invalid email or password." });
    }

    // Store only the safe user fields in the session — never the password hash
    req.session.user = {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
    };

    // express-session saves the session and sends the Set-Cookie header
    // automatically — we just respond with the user object for the frontend
    res.json({ user: req.session.user });
};

exports.logout = (req, res) => {
    // Destroys the session row in MySQL and clears the cookie
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: "Could not log out." });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out." });
    });
};

exports.me = (req, res) => {
    res.json(req.user);
};
