const express = require("express");
const router = express.Router();

const transactionController = require("../controllers/transaction.controller");
const authenticateToken = require("../middleware/auth.middleware");

router.post(
    "/transfer",
    authenticateToken,
    transactionController.transferMoney
);

router.get(
    "/",
    authenticateToken,
    transactionController.getUserTransactions
);

module.exports = router;