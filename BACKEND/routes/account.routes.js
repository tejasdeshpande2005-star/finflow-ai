const express = require("express");
const router = express.Router();

const accountController = require("../controllers/account.controller");
const authenticateToken = require("../middleware/auth.middleware");

router.get(
    "/balance",
    authenticateToken,
    accountController.getBalance
);

module.exports = router;