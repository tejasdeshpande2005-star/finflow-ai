const transactionService = require("../services/transaction.service");

async function transferMoney(req, res) {
    try {
        const { receiverAccountId, amount } = req.body;

        if (!receiverAccountId) {
            return res.status(400).json({
                message: "Receiver account is required."
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than zero."
            });
        }

        const senderAccount =
            await transactionService.getAccountByUserId(
                req.user.userId
            );

        if (!senderAccount) {
            return res.status(404).json({
                message: "Sender account not found."
            });
        }

        await transactionService.transferMoney(
            senderAccount.id,
            receiverAccountId,
            amount
        );

        return res.status(200).json({
            message: "Transfer successful."
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
}

async function getUserTransactions(req, res) {
    try {
        const user = req.user.userId;

        const account =
            await transactionService.getAccountByUserId(user);

        if (!account) {
            return res.status(404).json({
                message: "No account found"
            });
        }

        const transactions =
            await transactionService.getUserTransactions(account.id);

        return res.status(200).json({
            transactions
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
}

module.exports = {
    transferMoney,
    getUserTransactions
};