const { register } = require("../services/auth.service");

const registerUser = (req, res) => {

    const result = register(req.body);

    res.status(201).json(result);

};

module.exports = {
    registerUser
};