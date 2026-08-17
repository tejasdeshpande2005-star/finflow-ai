const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get(
    "/profile",
    authenticateToken,
    userController.getProfile
);

router.get(
    "/admin-test",
    authenticateToken,
    authorizeRole("admin"),
    (req, res) => {
        res.status(200).json({
            message: "Welcome Admin"
        });
    }
);

module.exports = router;