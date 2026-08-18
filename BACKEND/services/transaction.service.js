const pool = require("../config/db");

async function getAccountByUserId(userId){
    const query = 'SELECT * FROM accounts WHERE user_id = $1;';//parameterized query
    const result = await pool.query(query,[userId]);
    return result.rows[0];
}

async function transferMoney(senderAccountId, receiverAccountId, amount) {
    const client = await pool.connect();
    try{
        if (senderAccountId === receiverAccountId) {
            throw new Error("Cannot transfer to the same account");
        }
        if(amount <= 0){
            throw new Error("Amount must be greater than zero.");
        }
        await client.query("BEGIN");
        const result = await client.query('SELECT balance FROM accounts WHERE id = $1 FOR UPDATE',[senderAccountId]);
        if(result.rows.length === 0){
            throw new Error("Sender account not found");
        }
        const balance = Number(result.rows[0].balance);
        if(balance<amount){
            throw new Error("Insufficient Balance");
        }
        const receiverResult = await client.query("SELECT id FROM accounts WHERE id = $1 FOR UPDATE",[receiverAccountId])
        if(receiverResult.rows.length === 0){
            throw new Error("Receiver account not found");
        }
        await client.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2",[amount,senderAccountId]);
        await client.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2",[amount,receiverAccountId]);
        await client.query(`INSERT INTO transactions(sender_account_id, receiver_account_id, amount, transaction_type, status) 
        VALUES ($1, $2, $3, 'TRANSFER', 'COMPLETED')`,[senderAccountId, receiverAccountId, amount]);
        await client.query("COMMIT");

    }
    catch (err) {
        await client.query("ROLLBACK");
        throw err;
    }
    finally{
        client.release();
    }
    
}

async function getUserTransactions(accountId) {
    const query = `
        SELECT *
        FROM transactions
        WHERE sender_account_id = $1
           OR receiver_account_id = $1
        ORDER BY created_at DESC;
    `;

    const result = await pool.query(query, [accountId]);

    return result.rows;
}

module.exports = {getAccountByUserId,
    transferMoney,
    getUserTransactions
};