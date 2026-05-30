const db = require("../db");

// GET /api/stock-in
// Returns all import records joined with part name
exports.getAllStockIn = async (req, res) => {
    const [rows] = await db.query(
        `SELECT
            si.id,
            si.quantity,
            si.remaining_qty,
            si.unit_price,
            si.total_price,
            si.imported_at,
            sp.id   AS spare_part_id,
            sp.name AS spare_part_name
         FROM stock_in si
         JOIN spare_parts sp ON sp.id = si.spare_part_id
         ORDER BY si.imported_at DESC`
    );
    res.json(rows);
};

// GET /api/stock-in/:id
exports.getStockInById = async (req, res) => {
    const [rows] = await db.query(
        `SELECT
            si.*,
            sp.name AS spare_part_name
         FROM stock_in si
         JOIN spare_parts sp ON sp.id = si.spare_part_id
         WHERE si.id = ?`,
        [req.params.id]
    );

    if (rows.length === 0) {
        return res.status(404).json({ error: "Stock-in record not found." });
    }

    res.json(rows[0]);
};

// POST /api/stock-in
// Creates a new import batch and increments spare_parts.quantity
exports.createStockIn = async (req, res) => {
    const { sparePartId, quantity, unitPrice } = req.body;

    if (!sparePartId || !quantity || !unitPrice) {
        return res.status(400).json({
            error: "sparePartId, quantity and unitPrice are required.",
        });
    }

    if (quantity < 1) {
        return res.status(400).json({ error: "Quantity must be at least 1." });
    }

    // Verify the spare part exists
    const [partRows] = await db.query(
        "SELECT * FROM spare_parts WHERE id = ?",
        [sparePartId]
    );

    if (partRows.length === 0) {
        return res.status(404).json({ error: "Spare part not found." });
    }

    const totalPrice = quantity * unitPrice;

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // Insert the stock-in batch
        // remaining_qty starts equal to quantity — decremented by stock-out later
        const [result] = await conn.query(
            `INSERT INTO stock_in
                (spare_part_id, quantity, remaining_qty, unit_price, total_price)
             VALUES (?, ?, ?, ?, ?)`,
            [sparePartId, quantity, quantity, unitPrice, totalPrice]
        );

        // Increment the part's total stock quantity
        await conn.query(
            "UPDATE spare_parts SET quantity = quantity + ? WHERE id = ?",
            [quantity, sparePartId]
        );

        await conn.commit();

        // Return the full record with part name
        const [rows] = await conn.query(
            `SELECT si.*, sp.name AS spare_part_name
             FROM stock_in si
             JOIN spare_parts sp ON sp.id = si.spare_part_id
             WHERE si.id = ?`,
            [result.insertId]
        );

        res.status(201).json(rows[0]);

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// DELETE /api/stock-in/:id
// Only allowed if no stock-out records reference this batch
exports.deleteStockIn = async (req, res) => {
    const [rows] = await db.query(
        "SELECT * FROM stock_in WHERE id = ?",
        [req.params.id]
    );

    if (rows.length === 0) {
        return res.status(404).json({ error: "Stock-in record not found." });
    }

    const stockIn = rows[0];

    // Block deletion if sales came out of this batch
    const [sales] = await db.query(
        "SELECT id FROM stock_out WHERE stock_in_id = ?",
        [req.params.id]
    );

    if (sales.length > 0) {
        return res.status(400).json({
            error: "Cannot delete a batch that has stock-out records.",
        });
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // Give the quantity back to the spare part
        await conn.query(
            "UPDATE spare_parts SET quantity = quantity - ? WHERE id = ?",
            [stockIn.quantity, stockIn.spare_part_id]
        );

        await conn.query("DELETE FROM stock_in WHERE id = ?", [req.params.id]);

        await conn.commit();

        res.json({ message: "Stock-in record deleted and quantity reversed." });

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
