const bcrypt = require("bcrypt");

const register = async (userData) => {

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    console.log("Original:", userData.password);
    console.log("Hash:", hashedPassword);

    return {
        success: true,
        message: "User Registered"
    };
};

module.exports = { register };