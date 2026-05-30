-- Run once to set up the database:
--   mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS spareparts_db;
USE spareparts_db;

-- ─── Spare Parts ──────────────────────────────────────────────────────────────
-- Master catalogue of every part.
-- `quantity` is the current stock level — updated by stock-in and stock-out.
CREATE TABLE IF NOT EXISTS spare_parts (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(150) NOT NULL,
    quantity   INT NOT NULL DEFAULT 0,   -- current total stock on hand
    unit_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Stock In ─────────────────────────────────────────────────────────────────
-- Each row records one import/purchase transaction.
-- `remaining_qty` tracks how many units from this specific batch are still
-- available to sell — decremented by stock-out operations (FIFO model).
CREATE TABLE IF NOT EXISTS stock_in (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    spare_part_id INT NOT NULL,
    quantity      INT NOT NULL,           -- units imported in this batch
    remaining_qty INT NOT NULL,           -- units still available from this batch
    unit_price    DECIMAL(12,2) NOT NULL, -- price paid per unit at import
    total_price   DECIMAL(12,2) NOT NULL, -- quantity × unit_price
    imported_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id) ON DELETE CASCADE
);

-- ─── Stock Out ────────────────────────────────────────────────────────────────
-- Each row records one sale transaction drawn from a specific stock_in batch.
CREATE TABLE IF NOT EXISTS stock_out (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    stock_in_id   INT NOT NULL,           -- which batch was sold from
    spare_part_id INT NOT NULL,           -- denormalised for easy reporting
    quantity      INT NOT NULL,           -- units sold
    unit_price    DECIMAL(12,2) NOT NULL, -- selling price per unit
    total_price   DECIMAL(12,2) NOT NULL, -- quantity × unit_price
    sold_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_in_id)   REFERENCES stock_in(id)    ON DELETE CASCADE,
    FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id) ON DELETE CASCADE
);

-- ─── Seed data ────────────────────────────────────────────────────────────────
INSERT IGNORE INTO spare_parts (name, quantity, unit_price) VALUES
    ('Brake Pads',        50,  12000),
    ('Oil Filter',        80,   4500),
    ('Air Filter',        60,   5800),
    ('Spark Plugs',      120,   2200),
    ('Timing Belt',       30,  18000);
