const transactionService = require("../services/transaction.service");

async function transferMoney(req, res) {
    try {
        const { receiverAccountId, amount } = req.body;

        // Validate receiver account ID
        if (!Number.isInteger(receiverAccountId)) {
            return res.status(400).json({
                message: "Receiver account ID must be an integer."
            });
        }

        // Validate amount type
        if (typeof amount !== "number" || !Number.isFinite(amount)) {
            return res.status(400).json({
                message: "Amount must be a valid number."
            });
        }

        // Validate amount value
        if (amount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than zero."
            });
        }

        // Get sender account from authenticated user's JWT
        const senderAccount =
            await transactionService.getAccountByUserId(
                req.user.userId
            );

        if (!senderAccount) {
            return res.status(404).json({
                message: "Sender account not found."
            });
        }

        // Perform transfer
        await transactionService.transferMoney(
            senderAccount.id,
            receiverAccountId,
            amount
        );

        return res.status(200).json({
            message: "Transfer successful."
        });

    } catch (err) {

        // Insufficient balance
        if (err.message === "Insufficient Balance") {
            return res.status(422).json({
                message: err.message
            });
        }

        // Account not found
        if (
            err.message === "Sender account not found" ||
            err.message === "Receiver account not found"
        ) {
            return res.status(404).json({
                message: err.message
            });
        }

        // Invalid transfer
        if (
            err.message === "Cannot transfer to the same account"
        ) {
            return res.status(400).json({
                message: err.message
            });
        }

        // Unexpected error
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


async function getUserTransactions(req, res) {
    try {
        // Get user ID from JWT
        const userId = req.user.userId;

        // Find user's account
        const account =
            await transactionService.getAccountByUserId(userId);

        if (!account) {
            return res.status(404).json({
                message: "No account found."
            });
        }

        // Get user's transactions
        const transactions =
            await transactionService.getUserTransactions(account.id);

        return res.status(200).json({
            transactions
        });

    } catch (err) {

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


module.exports = {
    transferMoney,
    getUserTransactions
};