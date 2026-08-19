const pool = require("../config/db");

async function getAccountByUserId(userId) {
    const result = await pool.query(
        `SELECT id, balance, currency
         FROM accounts
         WHERE user_id = $1`,
        [userId]
    );

    return result.rows[0];
}

module.exports = {
    getAccountByUserId
};