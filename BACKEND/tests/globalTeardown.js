const { Pool } = require("pg");
const dotenv = require("dotenv");

module.exports = async () => {
    dotenv.config({
        path: ".env.test"
    });

    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT
    });

    try {
        await pool.query(`
            TRUNCATE TABLE
                transactions,
                accounts,
                users
            RESTART IDENTITY CASCADE
        `);

        console.log("Test database cleaned successfully.");
    } finally {
        await pool.end();
    }
};