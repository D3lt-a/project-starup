const db = require("../db");

// GET /api/stock-out
exports.getAllStockOut = async (req, res) => {
    const [rows] = await db.query(
        `SELECT
            so.id,
            so.quantity,
            so.unit_price,
            so.total_price,
            so.sold_at,
            sp.id   AS spare_part_id,
            sp.name AS spare_part_name,
            si.id           AS stock_in_id,
            si.unit_price   AS import_unit_price,
            si.imported_at
         FROM stock_out so
         JOIN stock_in   si ON si.id = so.stock_in_id
         JOIN spare_parts sp ON sp.id = so.spare_part_id
         ORDER BY so.sold_at DESC`
    );
    res.json(rows);
};

// GET /api/stock-out/:id
exports.getStockOutById = async (req, res) => {
    const [rows] = await db.query(
        `SELECT
            so.*,
            sp.name AS spare_part_name,
            si.remaining_qty,
            si.unit_price AS import_unit_price
         FROM stock_out so
         JOIN stock_in   si ON si.id = so.stock_in_id
         JOIN spare_parts sp ON sp.id = so.spare_part_id
         WHERE so.id = ?`,
        [req.params.id]
    );

    if (rows.length === 0) {
        return res.status(404).json({ error: "Stock-out record not found." });
    }

    res.json(rows[0]);
};

// POST /api/stock-out
// Validates against stock_in.remaining_qty, then decrements both
// stock_in.remaining_qty and spare_parts.quantity
exports.createStockOut = async (req, res) => {
    const { stockInId, quantity, unitPrice } = req.body;

    if (!stockInId || !quantity || !unitPrice) {
        return res.status(400).json({
            error: "stockInId, quantity and unitPrice are required.",
        });
    }

    if (quantity < 1) {
        return res.status(400).json({ error: "Quantity must be at least 1." });
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // Lock the stock_in row so two concurrent sales can't oversell the batch
        const [siRows] = await conn.query(
            `SELECT si.*, sp.id AS part_id
             FROM stock_in si
             JOIN spare_parts sp ON sp.id = si.spare_part_id
             WHERE si.id = ?
             FOR UPDATE`,
            [stockInId]
        );

        if (siRows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: "Stock-in batch not found." });
        }

        const batch = siRows[0];

        // Quantity sold must not exceed what remains in this specific batch
        if (quantity > batch.remaining_qty) {
            await conn.rollback();
            return res.status(400).json({
                error: `Only ${batch.remaining_qty} unit(s) remaining in this batch.`,
            });
        }

        const totalPrice = quantity * unitPrice;

        // Insert the sale record
        const [result] = await conn.query(
            `INSERT INTO stock_out
                (stock_in_id, spare_part_id, quantity, unit_price, total_price)
             VALUES (?, ?, ?, ?, ?)`,
            [stockInId, batch.spare_part_id, quantity, unitPrice, totalPrice]
        );

        // Decrement remaining units in this import batch
        await conn.query(
            "UPDATE stock_in SET remaining_qty = remaining_qty - ? WHERE id = ?",
            [quantity, stockInId]
        );

        // Decrement the part's total stock
        await conn.query(
            "UPDATE spare_parts SET quantity = quantity - ? WHERE id = ?",
            [quantity, batch.spare_part_id]
        );

        await conn.commit();

        // Return full record with names attached
        const [rows] = await conn.query(
            `SELECT
                so.*,
                sp.name AS spare_part_name,
                si.unit_price AS import_unit_price,
                si.remaining_qty
             FROM stock_out so
             JOIN stock_in   si ON si.id = so.stock_in_id
             JOIN spare_parts sp ON sp.id = so.spare_part_id
             WHERE so.id = ?`,
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

// DELETE /api/stock-out/:id
// Reverses the sale: restores remaining_qty on the batch and quantity on the part
exports.deleteStockOut = async (req, res) => {
    const [rows] = await db.query(
        "SELECT * FROM stock_out WHERE id = ?",
        [req.params.id]
    );

    if (rows.length === 0) {
        return res.status(404).json({ error: "Stock-out record not found." });
    }

    const sale = rows[0];
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // Restore the batch's remaining quantity
        await conn.query(
            "UPDATE stock_in SET remaining_qty = remaining_qty + ? WHERE id = ?",
            [sale.quantity, sale.stock_in_id]
        );

        // Restore the part's total stock
        await conn.query(
            "UPDATE spare_parts SET quantity = quantity + ? WHERE id = ?",
            [sale.quantity, sale.spare_part_id]
        );

        await conn.query("DELETE FROM stock_out WHERE id = ?", [sale.id]);

        await conn.commit();

        res.json({ message: "Stock-out record deleted and quantity restored." });

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
