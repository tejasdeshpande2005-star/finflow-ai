const pool = require("./config/db");

async function testConnection() {
    try {
        const result = await pool.query("SELECT NOW();");

        console.log("✅ Database Connected Successfully!");
        console.log(result.rows);

    } catch (err) {
        console.error("❌ Database Connection Failed!");
        console.error(err.message);

    } finally {
        await pool.end();
    }
}

testConnection();