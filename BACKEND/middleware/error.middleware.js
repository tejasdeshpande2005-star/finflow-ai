function errorHandler(err, req, res, next) {
    console.error(err);

    if (err.message === "Insufficient Balance") {
        return res.status(422).json({
            message: err.message
        });
    }

    if (
        err.message === "Sender account not found" ||
        err.message === "Receiver account not found"
    ) {
        return res.status(404).json({
            message: err.message
        });
    }

    if (err.message === "Cannot transfer to the same account") {
        return res.status(400).json({
            message: err.message
        });
    }

    if (err.code === "23505") {
        return res.status(409).json({
            message: "Email already registered."
        });
    }

    return res.status(500).json({
        message: "Internal server error"
    });
}

module.exports = errorHandler;