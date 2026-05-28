create database project_starter_db;

use project_starter_db;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL,
    useremail VARCHAR(255) UNIQUE NOT NULL,
    userpassword VARCHAR(255) NOT NULL
);