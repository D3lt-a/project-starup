const db = require("../db");

// GET /api/parts
exports.getAllParts = async (req, res) => {
    const [parts] = await db.query("SELECT * FROM spare_parts ORDER BY name ASC");
    res.json(parts);
};

// GET /api/parts/:id
exports.getPartById = async (req, res) => {
    const [parts] = await db.query("SELECT * FROM spare_parts WHERE id = ?", [req.params.id]);

    if (parts.length === 0) {
        return res.status(404).json({ error: "Spare part not found" });
    }

    res.json(parts[0]);
};

// POST /api/parts
exports.createPart = async (req, res) => {
    const { name, quantity, unitPrice } = req.body;

    if (!name || quantity == null || !unitPrice) {
        return res.status(400).json({ error: "name, quantity and unitPrice required" });
    }

    if (quantity < 0) {
        return res.status(400).json({ error: "Quantity cannot be negative" });
    }

    const [result] = await db.query(
        "INSERT INTO spare_parts (name, quantity, unit_price) VALUES (?, ?, ?)",
        [name.trim(), quantity, unitPrice]
    );

    const [parts] = await db.query("SELECT * FROM spare_parts WHERE id = ?", [result.insertId]);
    res.status(201).json(parts[0]);
};

// PUT /api/parts/:id
exports.updatePart = async (req, res) => {
    const [parts] = await db.query("SELECT * FROM spare_parts WHERE id = ?", [req.params.id]);

    if (parts.length === 0) {
        return res.status(404).json({ error: "Spare part not found" });
    }

    const { name, unitPrice } = req.body;

    await db.query(
        `UPDATE spare_parts SET
            name = COALESCE(?, name),
            unit_price = COALESCE(?, unit_price)
         WHERE id = ?`,
        [name || null, unitPrice || null, req.params.id]
    );

    const [updated] = await db.query("SELECT * FROM spare_parts WHERE id = ?", [req.params.id]);
    res.json(updated[0]);
};

// DELETE /api/parts/:id — SIMPLIFIED (removed stock-in check)
exports.deletePart = async (req, res) => {
    const [result] = await db.query("DELETE FROM spare_parts WHERE id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Spare part not found" });
    }

    res.json({ message: "Spare part deleted" });
};