const db = require("../config/db");

// GET /api/bookings
// Manager → all bookings with customer + bus details
// Customer → only their own bookings
exports.getBookings = async (req, res) => {
    if (req.user.role === "manager") {
        const [bookings] = await db.query(
            `SELECT
                bk.id,
                bk.seats,
                bk.total_rwf,
                bk.booked_at,
                u.name  AS customer_name,
                u.email AS customer_email,
                b.plate_number,
                b.destination,
                b.departure_time,
                b.price_rwf
                FROM bookings bk
                JOIN users u ON u.id = bk.customer_id
                JOIN buses  b ON b.id = bk.bus_id
                ORDER BY bk.booked_at DESC`
        );
        return res.json(bookings);
    }

    // Customer: only their rows
    const [bookings] = await db.query(
        `SELECT
            bk.id,
            bk.seats,
            bk.total_rwf,
            bk.booked_at,
            b.plate_number,
            b.destination,
            b.departure_time,
            b.price_rwf
         FROM bookings bk
         JOIN buses b ON b.id = bk.bus_id
         WHERE bk.customer_id = ?
         ORDER BY bk.booked_at DESC`,
        [req.user.id]
    );

    res.json(bookings);
};

// POST /api/bookings  (customer only)
exports.createBooking = async (req, res) => {
    const { busId, seats } = req.body;

    if (!busId || !seats || seats < 1) {
        return res.status(400).json({ error: "busId and seats (≥ 1) are required." });
    }

    // ── Critical section: read and update in one atomic step ───────────────
    // We use a transaction so two customers can't both grab the last seat.
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // Lock this bus row for the duration of the transaction (FOR UPDATE)
        // This prevents another request from reading stale available_seats
        const [rows] = await conn.query(
            "SELECT * FROM buses WHERE id = ? FOR UPDATE",
            [busId]
        );

        if (rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: "Bus not found." });
        }

        const bus = rows[0];

        if (new Date(bus.departure_time) <= new Date()) {
            await conn.rollback();
            return res.status(400).json({ error: "This bus has already departed." });
        }

        if (seats > bus.available_seats) {
            await conn.rollback();
            return res.status(400).json({
                error: `Only ${bus.available_seats} seat(s) available.`,
            });
        }

        // Decrement available_seats
        await conn.query(
            "UPDATE buses SET available_seats = available_seats - ? WHERE id = ?",
            [seats, busId]
        );

        // Insert the booking record
        const [result] = await conn.query(
            `INSERT INTO bookings (bus_id, customer_id, seats, total_rwf)
             VALUES (?, ?, ?, ?)`,
            [busId, req.user.id, seats, seats * bus.price_rwf]
        );

        await conn.commit();

        // Return the new booking with bus details attached
        const [booking] = await conn.query(
            `SELECT
                bk.id,
                bk.seats,
                bk.total_rwf,
                bk.booked_at,
                b.plate_number,
                b.destination,
                b.departure_time
             FROM bookings bk
             JOIN buses b ON b.id = bk.bus_id
             WHERE bk.id = ?`,
            [result.insertId]
        );

        res.status(201).json(booking[0]);

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();  // always return connection to pool
    }
};

// DELETE /api/bookings/:id  (customer only — own bookings)
exports.cancelBooking = async (req, res) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // Find the booking AND confirm it belongs to this customer
        const [rows] = await conn.query(
            "SELECT * FROM bookings WHERE id = ? AND customer_id = ?",
            [req.params.id, req.user.id]
        );

        if (rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: "Booking not found." });
        }

        const booking = rows[0];

        // Restore seats only if bus hasn't departed yet
        const [busRows] = await conn.query(
            "SELECT departure_time FROM buses WHERE id = ?",
            [booking.bus_id]
        );

        if (busRows.length > 0 && new Date(busRows[0].departure_time) > new Date()) {
            await conn.query(
                "UPDATE buses SET available_seats = available_seats + ? WHERE id = ?",
                [booking.seats, booking.bus_id]
            );
        }

        await conn.query("DELETE FROM bookings WHERE id = ?", [booking.id]);

        await conn.commit();

        res.json({ message: "Booking cancelled. Seats have been restored." });

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
