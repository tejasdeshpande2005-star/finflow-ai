const bcrypt = require("bcrypt");
const userService = require("../services/user.service");

const jwt = require("jsonwebtoken");

async function registerUser(req, res) {
    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long."
            });
        }

        if (!/[A-Za-z]/.test(password)) {
            return res.status(400).json({
                message: "Password must contain at least one letter."
            });
        }

        if (!/[0-9]/.test(password)) {
            return res.status(400).json({
                message: "Password must contain at least one number."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await userService.createUser(
            name,
            email,
            passwordHash
        );
        return res.status(201).json({
            message: "User registered successfully.",
            user:{
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {

    if (err.code === "23505") {
        return res.status(409).json({
            message: "Email already registered."
        });
    }

    return res.status(500).json({
        message: "Internal server error"
    });
    } 
}

async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const user = await userService.findUserByEmail(email);

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign({
            userId: user.id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h"
        }
        );

        return res.status(200).json({
            message: "Login successful.",
            token
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
}

function getProfile(req, res) {
    return res.status(200).json({
        message: "Authenticated successfully.",
        user: req.user
    });
}

module.exports = {
    registerUser,
    loginUser,
    getProfile
};