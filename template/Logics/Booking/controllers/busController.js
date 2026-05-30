const db = require("../config/db");

// GET /api/buses
exports.getAllBuses = async (req, res) => {
    const [buses] = await db.query(
        "SELECT * FROM buses ORDER BY departure_time ASC"
    );
    res.json(buses);
};

// GET /api/buses/:id
exports.getBusById = async (req, res) => {
    const [buses] = await db.query(
        "SELECT * FROM buses WHERE id = ?",
        [req.params.id]
    );

    if (buses.length === 0) {
        return res.status(404).json({ error: "Bus not found" });
    }

    res.json(buses[0]);
};

// POST /api/buses (manager only) — SIMPLIFIED
exports.createBus = async (req, res) => {
    const { plateNumber, destination, maxSeats, departureTime, priceRwf } = req.body;

    if (!plateNumber || !destination || !maxSeats || !departureTime || !priceRwf) {
        return res.status(400).json({ error: "All fields required" });
    }

    if (new Date(deploymentTime) <= new Date()) {
        return res.status(400).json({ error: "Departure time must be in future" });
    }

    const [result] = await db.query(
        `INSERT INTO buses 
         (plate_number, destination, max_seats, available_seats, departure_time, price_rwf)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [plateNumber, destination, maxSeats, maxSeats, departureTime, priceRwf]
    );

    const [buses] = await db.query(
        "SELECT * FROM buses WHERE id = ?",
        [result.insertId]
    );

    res.status(201).json(buses[0]);
};

// PUT /api/buses/:id (manager only) — SIMPLIFIED
exports.updateBus = async (req, res) => {
    const { plateNumber, destination, departureTime, priceRwf } = req.body;

    await db.query(
        `UPDATE buses SET
            plate_number  = COALESCE(?, plate_number),
            destination   = COALESCE(?, destination),
            departure_time = COALESCE(?, departure_time),
            price_rwf     = COALESCE(?, price_rwf)
         WHERE id = ?`,
        [plateNumber, destination, departureTime, priceRwf, req.params.id]
    );

    const [buses] = await db.query(
        "SELECT * FROM buses WHERE id = ?",
        [req.params.id]
    );

    res.json(buses[0]);
};

// DELETE /api/buses/:id (manager only)
exports.deleteBus = async (req, res) => {
    const [bookings] = await db.query(
        "SELECT id FROM bookings WHERE bus_id = ?",
        [req.params.id]
    );

    if (bookings.length > 0) {
        return res.status(400).json({ error: "Cannot delete bus with bookings" });
    }

    const [result] = await db.query(
        "DELETE FROM buses WHERE id = ?",
        [req.params.id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Bus not found" });
    }

    res.json({ message: "Bus deleted" });
};