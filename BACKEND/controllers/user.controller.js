const bcrypt = require("bcrypt");
const userService = require("../services/user.service");
const jwt = require("jsonwebtoken");


async function registerUser(req, res, next) {
    try {
        const { name, email, password } = req.body;

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await userService.createUser(
            name,
            email,
            passwordHash
        );

        return res.status(201).json({
            message: "User registered successfully.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        next(err);
    }
}


async function loginUser(req, res, next) {
    try {
        const { email, password } = req.body;

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

        const token = jwt.sign(
            {
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
        next(err);
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