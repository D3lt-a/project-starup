const db = require("../db");

// GET /api/parts
exports.getAllParts = async (req, res) => {
    const [parts] = await db.query(
        "SELECT * FROM spare_parts ORDER BY name ASC"
    );
    res.json(parts);
};

// GET /api/parts/:id
exports.getPartById = async (req, res) => {
    const [rows] = await db.query(
        "SELECT * FROM spare_parts WHERE id = ?",
        [req.params.id]
    );

    if (rows.length === 0) {
        return res.status(404).json({ error: "Spare part not found." });
    }

    res.json(rows[0]);
};

// POST /api/parts
exports.createPart = async (req, res) => {
    const { name, quantity, unitPrice } = req.body;

    if (!name || quantity == null || !unitPrice) {
        return res.status(400).json({ error: "name, quantity and unitPrice are required." });
    }

    if (quantity < 0) {
        return res.status(400).json({ error: "Quantity cannot be negative." });
    }

    const [result] = await db.query(
        "INSERT INTO spare_parts (name, quantity, unit_price) VALUES (?, ?, ?)",
        [name.trim(), quantity, unitPrice]
    );

    const [rows] = await db.query(
        "SELECT * FROM spare_parts WHERE id = ?",
        [result.insertId]
    );

    res.status(201).json(rows[0]);
};

// PUT /api/parts/:id
exports.updatePart = async (req, res) => {
    const [rows] = await db.query(
        "SELECT * FROM spare_parts WHERE id = ?",
        [req.params.id]
    );

    if (rows.length === 0) {
        return res.status(404).json({ error: "Spare part not found." });
    }

    const { name, unitPrice } = req.body;
    // Note: quantity is managed by stock-in / stock-out, not edited directly

    await db.query(
        `UPDATE spare_parts SET
            name       = COALESCE(?, name),
            unit_price = COALESCE(?, unit_price)
         WHERE id = ?`,
        [name || null, unitPrice || null, req.params.id]
    );

    const [updated] = await db.query(
        "SELECT * FROM spare_parts WHERE id = ?",
        [req.params.id]
    );

    res.json(updated[0]);
};

// DELETE /api/parts/:id
exports.deletePart = async (req, res) => {
    // Block deletion if there are any stock-in records for this part
    const [stockIns] = await db.query(
        "SELECT id FROM stock_in WHERE spare_part_id = ?",
        [req.params.id]
    );

    if (stockIns.length > 0) {
        return res.status(400).json({
            error: "Cannot delete a part that has stock-in records.",
        });
    }

    const [result] = await db.query(
        "DELETE FROM spare_parts WHERE id = ?",
        [req.params.id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Spare part not found." });
    }

    res.json({ message: "Spare part deleted." });
};
