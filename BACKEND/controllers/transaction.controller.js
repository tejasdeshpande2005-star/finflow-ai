const transactionService = require("../services/transaction.service");

async function transferMoney(req, res,next) {
    try {
        const { receiverAccountId, amount } = req.body;

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
        next(err);
    }
}


async function getUserTransactions(req, res,next) {
    try {
        
        const userId = req.user.userId;

        
        const account =
            await transactionService.getAccountByUserId(userId);

        if (!account) {
            return res.status(404).json({
                message: "No account found."
            });
        }

        
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