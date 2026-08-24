const express = require("express");
const helmet = require("helmet");
const userRoutes = require("./routes/user.routes");
const transactionRoutes = require("./routes/transaction.routes");
const accountRoutes = require("./routes/account.routes");

const errorHandler = require("./middleware/error.middleware");

const app = express();
app.use(helmet());
app.use(express.json());
app.use("/api/users",userRoutes);
app.use("/api/transactions",transactionRoutes);
app.use("/api/accounts",accountRoutes);
app.use(errorHandler);
module.exports = app;