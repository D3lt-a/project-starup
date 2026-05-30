const db = require("../config/db");

// GET /api/bookings
exports.getBookings = async (req, res) => {
    if (req.user.role === "manager") {
        const [bookings] = await db.query(
            `SELECT bk.id, bk.seats, bk.total_rwf, bk.booked_at,
                    u.name AS customer_name, u.email AS customer_email,
                    b.plate_number, b.destination, b.departure_time, b.price_rwf
             FROM bookings bk
             JOIN users u ON u.id = bk.customer_id
             JOIN buses b ON b.id = bk.bus_id
             ORDER BY bk.booked_at DESC`
        );
        return res.json(bookings);
    }

    const [bookings] = await db.query(
        `SELECT bk.id, bk.seats, bk.total_rwf, bk.booked_at,
                b.plate_number, b.destination, b.departure_time, b.price_rwf
         FROM bookings bk
         JOIN buses b ON b.id = bk.bus_id
         WHERE bk.customer_id = ?
         ORDER BY bk.booked_at DESC`,
        [req.user.id]
    );

    res.json(bookings);
};

// POST /api/bookings (customer only) — SIMPLIFIED
exports.createBooking = async (req, res) => {
    const { busId, seats } = req.body;

    if (!busId || !seats || seats < 1) {
        return res.status(400).json({ error: "busId and seats required" });
    }

    // 1. Get the bus
    const [buses] = await db.query(
        "SELECT * FROM buses WHERE id = ?",
        [busId]
    );

    if (buses.length === 0) {
        return res.status(404).json({ error: "Bus not found" });
    }

    const bus = buses[0];

    // 2. Check departure time
    if (new Date(bus.departure_time) <= new Date()) {
        return res.status(400).json({ error: "Bus already departed" });
    }

    // 3. Check seats (simple check, no lock)
    if (seats > bus.available_seats) {
        return res.status(400).json({
            error: `Only ${bus.available_seats} seat(s) available`
        });
    }

    // 4. Decrement seats AND insert booking (two separate queries)
    await db.query(
        "UPDATE buses SET available_seats = available_seats - ? WHERE id = ?",
        [seats, busId]
    );

    const [result] = await db.query(
        `INSERT INTO bookings (bus_id, customer_id, seats, total_rwf)
         VALUES (?, ?, ?, ?)`,
        [busId, req.user.id, seats, seats * bus.price_rwf]
    );

    // 5. Return the new booking
    res.status(201).json({
        id: result.insertId,
        bus_id: busId,
        customer_id: req.user.id,
        seats,
        total_rwf: seats * bus.price_rwf,
        plate_number: bus.plate_number,
        destination: bus.destination,
        departure_time: bus.departure_time
    });
};

// DELETE /api/bookings/:id — SIMPLIFIED
exports.cancelBooking = async (req, res) => {
    // 1. Find booking and check it belongs to user
    const [bookings] = await db.query(
        `SELECT bk.*, b.departure_time
        FROM bookings bk
        JOIN buses b ON b.id = bk.bus_id
        WHERE bk.id = ? AND bk.customer_id = ?`,
        [req.params.id, req.user.id]
    );

    if (bookings.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookings[0];

    // 2. Restore seats only if bus hasn't departed
    if (new Date(booking.departure_time) > new Date()) {
        await db.query(
            "UPDATE buses SET available_seats = available_seats + ? WHERE id = ?",
            [booking.seats, booking.bus_id]
        );
    }

    // 3. Delete booking
    await db.query("DELETE FROM bookings WHERE id = ?", [req.params.id]);

    res.json({ message: "Booking cancelled" });
};