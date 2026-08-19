const accountService = require("../services/account.service");

async function getBalance(req, res) {
    try {
        const account = await accountService.getAccountByUserId(
            req.user.userId
        );

        if (!account) {
            return res.status(404).json({
                message: "Account not found."
            });
        }

        return res.status(200).json({
            accountId: account.id,
            balance: account.balance,
            currency: account.currency
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
}

module.exports = {
    getBalance
};