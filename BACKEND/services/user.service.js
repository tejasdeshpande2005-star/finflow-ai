const pool = require("../config/db");

async function createUser(name, email, passwordHash) {
    const query = `
        INSERT INTO users(name, email, password_hash)
        VALUES($1, $2, $3)
        RETURNING id, name, email, role, created_at;
    `;

    const values = [name, email, passwordHash];

    const result = await pool.query(query, values);

    return result.rows[0];
}

module.exports = {
    createUser
};