const bcrypt = require("bcrypt");
const userService = require("../services/user.service");

async function registerUser(req, res) {
    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required."
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
            user
        });

    } catch (err) {

        return res.status(500).json({
            message: err.message
        });

    }
}

module.exports = {
    registerUser
};