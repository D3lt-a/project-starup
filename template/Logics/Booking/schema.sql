-- Run this file once to set up your database:
--   mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS fleet_db;
USE fleet_db;

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('manager', 'customer') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Buses ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS buses (
    id               INT PRIMARY KEY AUTO_INCREMENT,
    plate_number     VARCHAR(20) UNIQUE NOT NULL,
    destination      VARCHAR(100) NOT NULL,
    max_seats        INT NOT NULL,
    available_seats  INT NOT NULL,
    departure_time   DATETIME NOT NULL,
    price_rwf        INT NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Bookings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    bus_id      INT NOT NULL,
    customer_id INT NOT NULL,
    seats       INT NOT NULL,
    total_rwf   INT NOT NULL,
    booked_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id)      REFERENCES buses(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Sessions ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    token      VARCHAR(255) PRIMARY KEY,
    user_id    INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
