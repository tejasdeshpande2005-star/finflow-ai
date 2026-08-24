const request = require("supertest");
const app = require("../app");
const pool = require("../config/db");

async function createTestUser() {
    const email = `account${Date.now()}${Math.random()}@gmail.com`;
    const password = "password123";

    const registerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Account Test User",
            email,
            password
        });

    expect(registerResponse.statusCode).toBe(201);

    const userId = registerResponse.body.user.id;

    const accountResult = await pool.query(
        `INSERT INTO accounts (user_id, balance, currency)
         VALUES ($1, $2, 'INR')
         RETURNING id, user_id, balance, currency`,
        [userId, 1500]
    );

    const account = accountResult.rows[0];

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

async function cleanupUser(user) {
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


describe("Account Balance", () => {

    test("should reject balance request without authentication", async () => {
        const response = await request(app)
            .get("/api/accounts/balance");

        expect(response.statusCode).toBe(401);
    });


    test("should reject balance request with invalid JWT", async () => {
        const response = await request(app)
            .get("/api/accounts/balance")
            .set("Authorization", "Bearer invalid-token");

        expect(response.statusCode).toBe(401);
    });


    test("should return account balance for authenticated user", async () => {
        const user = await createTestUser();

        try {
            const response = await request(app)
                .get("/api/accounts/balance")
                .set("Authorization", `Bearer ${user.token}`);

            expect(response.statusCode).toBe(200);

            expect(response.body.accountId)
                .toBe(user.accountId);

            expect(Number(response.body.balance))
                .toBe(1500);

            expect(response.body.currency)
                .toBe("INR");

        } finally {
            await cleanupUser(user);
        }
    });


    test("should return 404 when authenticated user has no account", async () => {
        const email = `noaccount${Date.now()}${Math.random()}@gmail.com`;
        const password = "password123";

        const registerResponse = await request(app)
            .post("/api/users/register")
            .send({
                name: "No Account User",
                email,
                password
            });

        expect(registerResponse.statusCode).toBe(201);

        const userId = registerResponse.body.user.id;

        const loginResponse = await request(app)
            .post("/api/users/login")
            .send({
                email,
                password
            });

        expect(loginResponse.statusCode).toBe(200);

        const token = loginResponse.body.token;

        try {
            const response = await request(app)
                .get("/api/accounts/balance")
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(404);

            expect(response.body.message)
                .toBe("Account not found.");

        } finally {
            await pool.query(
                `DELETE FROM users WHERE id = $1`,
                [userId]
            );
        }
    });

});