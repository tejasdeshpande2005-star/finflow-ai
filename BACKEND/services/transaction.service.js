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
            const error =  new Error("Cannot transfer to the same account");
            error.statusCode = 400;
            throw error;
        }
        if(amount <= 0){
            const error = new Error("Amount must be greater than zero.");
            error.statusCode = 400;
            throw error;
        }
        await client.query("BEGIN");
        const result = await client.query('SELECT balance FROM accounts WHERE id = $1 FOR UPDATE',[senderAccountId]);
        if(result.rows.length === 0){
           const error = new Error("Sender account not found");
           error.statusCode = 404;
           throw error;
        }
        const balance = Number(result.rows[0].balance);
        if(balance<amount){
            const error = new Error("Insufficient Balance");
            error.statusCode = 422;
            throw error;
        }
        const receiverResult = await client.query("SELECT id FROM accounts WHERE id = $1 FOR UPDATE",[receiverAccountId])
        if(receiverResult.rows.length === 0){
            const error = new Error("Receiver account not found");
            error.statusCode = 404;
            throw error;
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

async function getUserTransactions(accountId, options = {}) {
    const {
        page = 1,
        limit = 10,
        status,
        transactionType
    } = options;

    const offset = (page - 1) * limit;

    const values = [accountId];
    const conditions = [
        `(sender_account_id = $1 OR receiver_account_id = $1)`
    ];

    let parameterIndex = 2;

    if (status) {
        conditions.push(`status = $${parameterIndex}`);
        values.push(status);
        parameterIndex++;
    }

    if (transactionType) {
        conditions.push(`transaction_type = $${parameterIndex}`);
        values.push(transactionType);
        parameterIndex++;
    }

    const countQuery = `
        SELECT COUNT(*)
        FROM transactions
        WHERE ${conditions.join(" AND ")};
    `;

    const countResult = await pool.query(
        countQuery,
        values
    );

    const total = Number(countResult.rows[0].count);

    const transactionQuery = `
        SELECT *
        FROM transactions
        WHERE ${conditions.join(" AND ")}
        ORDER BY created_at DESC
        LIMIT $${parameterIndex}
        OFFSET $${parameterIndex + 1};
    `;

    const transactionValues = [
        ...values,
        limit,
        offset
    ];

    const result = await pool.query(
        transactionQuery,
        transactionValues
    );

    return {
        transactions: result.rows,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

module.exports = {getAccountByUserId,
    transferMoney,
    getUserTransactions
};