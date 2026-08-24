const request = require("supertest");
const app = require("../app");
const pool = require("../config/db");

async function createTestUser(name, balance) {
    const email = `transaction${Date.now()}${Math.random()}@gmail.com`;
    const password = "password123";

    // Create user
    const registerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name,
            email,
            password
        });

    expect(registerResponse.statusCode).toBe(201);

    const userId = registerResponse.body.user.id;

    // Create account manually
    const accountResult = await pool.query(
        `INSERT INTO accounts (user_id, balance, currency)
         VALUES ($1, $2, 'INR')
         RETURNING id, user_id, balance, currency`,
        [userId, balance]
    );

    const account = accountResult.rows[0];

    // Login
    const loginResponse = await request(app)
        .post("/api/users/login")
        .send({
            email,
            password
        });

    expect(loginResponse.statusCode).toBe(200);

    return {
        userId,
        accountId: account.id,
        token: loginResponse.body.token
    };
}


// Cleanup test data after each test
async function cleanupUsers(users) {
    for (const user of users) {

        await pool.query(
            `DELETE FROM transactions
             WHERE sender_account_id = $1
                OR receiver_account_id = $1`,
            [user.accountId]
        );

        await pool.query(
            `DELETE FROM accounts
             WHERE id = $1`,
            [user.accountId]
        );

        await pool.query(
            `DELETE FROM users
             WHERE id = $1`,
            [user.userId]
        );
    }
}


describe("Transaction Transfer", () => {

    test("should reject transfer without authentication", async () => {

        const response = await request(app)
            .post("/api/transactions/transfer")
            .send({
                receiverAccountId: 2,
                amount: 100
            });

        expect(response.statusCode).toBe(401);
    });


    test("should reject transfer with invalid receiver account ID", async () => {

        const sender = await createTestUser(
            "Invalid Receiver Test",
            1000
        );

        try {

            const response = await request(app)
                .post("/api/transactions/transfer")
                .set("Authorization", `Bearer ${sender.token}`)
                .send({
                    receiverAccountId: "hello",
                    amount: 100
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.message)
                .toBe("Validation failed");

        } finally {

            await cleanupUsers([sender]);

        }
    });


    test("should reject transfer with invalid amount", async () => {

        const sender = await createTestUser(
            "Invalid Amount Test",
            1000
        );

        try {

            const response = await request(app)
                .post("/api/transactions/transfer")
                .set("Authorization", `Bearer ${sender.token}`)
                .send({
                    receiverAccountId: sender.accountId + 999999,
                    amount: -100
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.message)
                .toBe("Validation failed");

        } finally {

            await cleanupUsers([sender]);

        }
    });


    test("should reject transfer when receiver account does not exist", async () => {

        const sender = await createTestUser(
            "Receiver Not Found Test",
            1000
        );

        try {

            const response = await request(app)
                .post("/api/transactions/transfer")
                .set("Authorization", `Bearer ${sender.token}`)
                .send({
                    receiverAccountId: 999999,
                    amount: 100
                });

            expect(response.statusCode).toBe(404);
            expect(response.body.message)
                .toBe("Receiver account not found");

        } finally {

            await cleanupUsers([sender]);

        }
    });


    test("should reject transfer to the same account", async () => {

        const sender = await createTestUser(
            "Same Account Test",
            1000
        );

        try {

            const response = await request(app)
                .post("/api/transactions/transfer")
                .set("Authorization", `Bearer ${sender.token}`)
                .send({
                    receiverAccountId: sender.accountId,
                    amount: 100
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.message)
                .toBe("Cannot transfer to the same account");

        } finally {

            await cleanupUsers([sender]);

        }
    });


    test("should reject transfer with insufficient balance", async () => {

        const sender = await createTestUser(
            "Insufficient Balance Sender",
            100
        );

        const receiver = await createTestUser(
            "Insufficient Balance Receiver",
            500
        );

        try {

            const response = await request(app)
                .post("/api/transactions/transfer")
                .set("Authorization", `Bearer ${sender.token}`)
                .send({
                    receiverAccountId: receiver.accountId,
                    amount: 1000
                });

            expect(response.statusCode).toBe(422);
            expect(response.body.message)
                .toBe("Insufficient Balance");

        } finally {

            await cleanupUsers([sender, receiver]);

        }
    });


    test("should successfully transfer money", async () => {

        const sender = await createTestUser(
            "Successful Transfer Sender",
            1000
        );

        const receiver = await createTestUser(
            "Successful Transfer Receiver",
            500
        );

        try {

            const response = await request(app)
                .post("/api/transactions/transfer")
                .set("Authorization", `Bearer ${sender.token}`)
                .send({
                    receiverAccountId: receiver.accountId,
                    amount: 100
                });

            expect(response.statusCode).toBe(200);

            expect(response.body.message)
                .toBe("Transfer successful.");

            // Check sender balance
            const senderBalance = await pool.query(
                `SELECT balance
                 FROM accounts
                 WHERE id = $1`,
                [sender.accountId]
            );

            expect(Number(senderBalance.rows[0].balance))
                .toBe(900);

            // Check receiver balance
            const receiverBalance = await pool.query(
                `SELECT balance
                 FROM accounts
                 WHERE id = $1`,
                [receiver.accountId]
            );

            expect(Number(receiverBalance.rows[0].balance))
                .toBe(600);

        } finally {

            await cleanupUsers([sender, receiver]);

        }
    });


    test("should return user transactions", async () => {

        const sender = await createTestUser(
            "Transaction History Sender",
            1000
        );

        const receiver = await createTestUser(
            "Transaction History Receiver",
            500
        );

        try {

            // Make a transfer first
            const transferResponse = await request(app)
                .post("/api/transactions/transfer")
                .set("Authorization", `Bearer ${sender.token}`)
                .send({
                    receiverAccountId: receiver.accountId,
                    amount: 100
                });

            expect(transferResponse.statusCode).toBe(200);

            // Get transaction history
            const response = await request(app)
                .get("/api/transactions")
                .set("Authorization", `Bearer ${sender.token}`);

            expect(response.statusCode).toBe(200);

            expect(response.body)
                .toHaveProperty("transactions");

            expect(Array.isArray(response.body.transactions))
                .toBe(true);

            expect(response.body.transactions.length)
                .toBeGreaterThan(0);

        } finally {

            await cleanupUsers([sender, receiver]);

        }
    });

});