const express = require("express");
const router = express.Router();

const transactionController = require("../controllers/transaction.controller");
const authenticateToken = require("../middleware/auth.middleware");

const {
    transferSchema,
    validate
} = require("../middleware/validation.middleware");



router.post(
    "/transfer",
    authenticateToken,
    validate(transferSchema),
    transactionController.transferMoney
);

router.get(
    "/",
    authenticateToken,
    transactionController.getUserTransactions
);

module.exports = router;