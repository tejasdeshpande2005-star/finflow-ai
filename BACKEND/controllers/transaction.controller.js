const transactionService = require("../services/transaction.service");

async function transferMoney(req, res,next) {
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
        next(err);
    }
}


async function getUserTransactions(req, res,next) {
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
        next(err);
    }
}


module.exports = {
    transferMoney,
    getUserTransactions
};