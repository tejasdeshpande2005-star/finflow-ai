const request = require("supertest");
const app = require("../app");

describe("User Registration", ()=>{
    test("should reject registration when fields are missing", async () =>{
        const response = await request(app).post("/api/users/register").send({
            email: "test@gmail.com"
        });
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Validation failed");
    });

    test("should reject registration with invalid email",async () =>{
        const response = await request(app).post("/api/users/register").send({
            name: "Test user",
            email: "invalid-email",
            password: "password123"
        });
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Validation failed");
    });
    test("should reject registration with weak password",async () =>{
        const response = await request(app).post("/api/users/register").send({
            name: "Test user",
            email: "testweak@gmail.com",
            password: "abc"
        });
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Validation failed");

    });

    test("should reject duplicate email",async () =>{
        const email = `duplicate${Date.now()}@gmail.com`;
        const firstResponse = await request(app).post("/api/users/register").send({
            name: "First User",
            email,
            password: "password123"
        });
        expect(firstResponse.statusCode).toBe(201);
        const secondResponse = await request(app).post("/api/users/register").send({
            name: "Second User",
            email,
            password: "password123"
        });
        expect(secondResponse.statusCode).toBe(409);
        expect(secondResponse.body.message).toBe("Email already registered.");
    });
    test("should register a new user successfully", async () =>{
        const email = `newuser${Date.now()}@gmail.com`;
        const response =  await request(app).post("/api/users/register").send({
            name: "New User",
            email,
            password: "password123"
        });
        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe("User registered successfully.");
        expect(response.body.user).toHaveProperty("id");
        expect(response.body.user.name).toBe("New User");
        expect(response.body.user.email).toBe(email);
        expect(response.body.user).not.toHaveProperty("password_hash");
    });


});

describe("User Login", () => {

    test("should reject login with invalid credentials", async () => {
        const response = await request(app)
            .post("/api/users/login")
            .send({
                email: "doesnotexist@gmail.com",
                password: "password123"
            });

        expect(response.statusCode).toBe(401);

        expect(response.body.message)
            .toBe("Invalid email or password.");
    });

    test("should reject login with wrong password", async () => {
    const email = `loginwrong${Date.now()}@gmail.com`;

    const registerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Login Test User",
            email,
            password: "password123"
        });

    expect(registerResponse.statusCode).toBe(201);

    const response = await request(app)
        .post("/api/users/login")
        .send({
            email,
            password: "wrongpassword123"
        });

    expect(response.statusCode).toBe(401);

    expect(response.body.message)
        .toBe("Invalid email or password.");
    });

    test("should login successfully and return JWT", async () => {
    const email = `loginsuccess${Date.now()}@gmail.com`;
    const password = "password123";

    const registerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Login Success User",
            email,
            password
        });

    expect(registerResponse.statusCode).toBe(201);

    const response = await request(app)
        .post("/api/users/login")
        .send({
            email,
            password
        });

    expect(response.statusCode).toBe(200);

    expect(response.body.message)
        .toBe("Login successful.");

    expect(response.body.token).toBeDefined();
    expect(typeof response.body.token).toBe("string");
    });

    test("should access profile with valid JWT", async () => {
    const email = `profile${Date.now()}@gmail.com`;
    const password = "password123";

    const registerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Profile Test User",
            email,
            password
        });

    expect(registerResponse.statusCode).toBe(201);

    const loginResponse = await request(app)
        .post("/api/users/login")
        .send({
            email,
            password
        });

    expect(loginResponse.statusCode).toBe(200);

    const token = loginResponse.body.token;

    // Access protected profile
    const profileResponse = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${token}`);

    expect(profileResponse.statusCode).toBe(200);

    expect(profileResponse.body.message)
        .toBe("Authenticated successfully.");

    expect(profileResponse.body.user).toHaveProperty("userId");
    expect(profileResponse.body.user).toHaveProperty("role");
    });

    test("should reject profile request without JWT", async () => {
    const response = await request(app)
        .get("/api/users/profile");

    expect(response.statusCode).toBe(401);

    expect(response.body.message)
        .toBe("Unauthorized");
});


test("should reject profile request with invalid JWT", async () => {
    const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", "Bearer invalid-token");

    expect(response.statusCode).toBe(401);

    expect(response.body.message)
        .toBe("Unauthorized");
    });
});