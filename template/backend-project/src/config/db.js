const mysql = require("mysql2/promise");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "root",
    database: "project_starter_db",
});

db.getConnection((err) => {
    if (err) {
        console.log("Database connection failed");
        return;
    }

    console.log("Database connected");
});

module.exports = db;