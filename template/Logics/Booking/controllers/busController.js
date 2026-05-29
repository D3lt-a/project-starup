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
    const [rows] = await db.query(
        "SELECT * FROM buses WHERE id = ?",
        [req.params.id]
    );

    if (rows.length === 0) {
        return res.status(404).json({ error: "Bus not found." });
    }

    res.json(rows[0]);
};

// POST /api/buses  (manager only)
exports.createBus = async (req, res) => {
    const { plateNumber, destination, maxSeats, departureTime, priceRwf } = req.body;

    if (!plateNumber || !destination || !maxSeats || !departureTime || !priceRwf) {
        return res.status(400).json({ error: "All fields are required." });
    }

    if (new Date(departureTime) <= new Date()) {
        return res.status(400).json({ error: "Departure time must be in the future." });
    }

    // Check for duplicate plate number
    const [existing] = await db.query(
        "SELECT id FROM buses WHERE plate_number = ?",
        [plateNumber]
    );

    if (existing.length > 0) {
        return res.status(400).json({ error: "Plate number already exists." });
    }

    const [result] = await db.query(
        `INSERT INTO buses
            (plate_number, destination, max_seats, available_seats, departure_time, price_rwf)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [plateNumber, destination, maxSeats, maxSeats, departureTime, priceRwf]
        //                                   ^ available_seats starts equal to max_seats
    );

    // Fetch and return the newly created row
    const [rows] = await db.query(
        "SELECT * FROM buses WHERE id = ?",
        [result.insertId]
    );

    res.status(201).json(rows[0]);
};

// PUT /api/buses/:id  (manager only)
exports.updateBus = async (req, res) => {
    const { plateNumber, destination, maxSeats, departureTime, priceRwf } = req.body;

    // Fetch current state first so we can calculate available_seats correctly
    const [rows] = await db.query(
        "SELECT * FROM buses WHERE id = ?",
        [req.params.id]
    );

    if (rows.length === 0) {
        return res.status(404).json({ error: "Bus not found." });
    }

    const bus = rows[0];

    // If maxSeats is being changed, recalculate available_seats:
    //   available = newMax - (oldMax - oldAvailable)  ← keeps already-booked seats
    let newAvailable = bus.available_seats;

    if (maxSeats) {
        const booked = bus.max_seats - bus.available_seats;
        if (parseInt(maxSeats) < booked) {
            return res.status(400).json({
                error: `Cannot reduce max seats below already booked count (${booked}).`,
            });
        }
        newAvailable = parseInt(maxSeats) - booked;
    }

    await db.query(
        `UPDATE buses SET
            plate_number    = COALESCE(?, plate_number),
            destination     = COALESCE(?, destination),
            max_seats       = COALESCE(?, max_seats),
            available_seats = ?,
            departure_time  = COALESCE(?, departure_time),
            price_rwf       = COALESCE(?, price_rwf)
         WHERE id = ?`,
        [
            plateNumber  || null,
            destination  || null,
            maxSeats     || null,
            newAvailable,
            departureTime|| null,
            priceRwf     || null,
            req.params.id,
        ]
    );

    // Return updated row
    const [updated] = await db.query("SELECT * FROM buses WHERE id = ?", [req.params.id]);
    res.json(updated[0]);
};

// DELETE /api/buses/:id  (manager only)
exports.deleteBus = async (req, res) => {
    // Check if any bookings exist for this bus
    const [bookings] = await db.query(
        "SELECT id FROM bookings WHERE bus_id = ?",
        [req.params.id]
    );

    if (bookings.length > 0) {
        return res.status(400).json({
            error: "Cannot delete a bus that has existing bookings.",
        });
    }

    const [result] = await db.query(
        "DELETE FROM buses WHERE id = ?",
        [req.params.id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Bus not found." });
    }

    res.json({ message: "Bus deleted." });
};
