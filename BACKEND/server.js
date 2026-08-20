const express = require("express");

const userRoutes = require("./routes/user.routes");

const app = express();

const transactionRoutes = require("./routes/transaction.routes");

const accountRoutes = require("./routes/account.routes");
const helmet = require("helmet");

const errorHandler = require("./middleware/error.middleware");

app.use(helmet());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/accounts", accountRoutes);

app.use(errorHandler);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});