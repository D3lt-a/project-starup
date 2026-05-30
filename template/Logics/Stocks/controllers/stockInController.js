const db = require("../db");

// GET /api/stock-in
exports.getAllStockIn = async (req, res) => {
    const [rows] = await db.query(
        `SELECT si.id, si.quantity, si.remaining_qty, si.unit_price, si.total_price, 
                si.imported_at, sp.id AS spare_part_id, sp.name AS spare_part_name
         FROM stock_in si
         JOIN spare_parts sp ON sp.id = si.spare_part_id
         ORDER BY si.imported_at DESC`
    );
    res.json(rows);
};

// GET /api/stock-in/:id
exports.getStockInById = async (req, res) => {
    const [rows] = await db.query(
        `SELECT si.*, sp.name AS spare_part_name
         FROM stock_in si
         JOIN spare_parts sp ON sp.id = si.spare_part_id
         WHERE si.id = ?`,
        [req.params.id]
    );

    if (rows.length === 0) {
        return res.status(404).json({ error: "Stock-in record not found" });
    }

    res.json(rows[0]);
};

// POST /api/stock-in — SIMPLIFIED (no transaction)
exports.createStockIn = async (req, res) => {
    const { sparePartId, quantity, unitPrice } = req.body;

    if (!sparePartId || !quantity || !unitPrice) {
        return res.status(400).json({ error: "sparePartId, quantity and unitPrice required" });
    }

    if (quantity < 1) {
        return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    // Verify part exists
    const [parts] = await db.query("SELECT * FROM spare_parts WHERE id = ?", [sparePartId]);
    if (parts.length === 0) {
        return res.status(404).json({ error: "Spare part not found" });
    }

    const totalPrice = quantity * unitPrice;

    // Insert stock-in batch
    const [result] = await db.query(
        `INSERT INTO stock_in (spare_part_id, quantity, remaining_qty, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?)`,
        [sparePartId, quantity, quantity, unitPrice, totalPrice]
    );

    // Increment part's total stock
    await db.query(
        "UPDATE spare_parts SET quantity = quantity + ? WHERE id = ?",
        [quantity, sparePartId]
    );

    // Return full record with part name
    const [rows] = await db.query(
        `SELECT si.*, sp.name AS spare_part_name
         FROM stock_in si
         JOIN spare_parts sp ON sp.id = si.spare_part_id
         WHERE si.id = ?`,
        [result.insertId]
    );

    res.status(201).json(rows[0]);
};

// DELETE /api/stock-in/:id — SIMPLIFIED (no transaction, no stock-out check)
exports.deleteStockIn = async (req, res) => {
    const [rows] = await db.query("SELECT * FROM stock_in WHERE id = ?", [req.params.id]);

    if (rows.length === 0) {
        return res.status(404).json({ error: "Stock-in record not found" });
    }

    const stockIn = rows[0];

    // Give quantity back to spare part
    await db.query(
        "UPDATE spare_parts SET quantity = quantity - ? WHERE id = ?",
        [stockIn.quantity, stockIn.spare_part_id]
    );

    await db.query("DELETE FROM stock_in WHERE id = ?", [req.params.id]);

    res.json({ message: "Stock-in deleted and quantity reversed" });
};