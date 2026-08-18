const express = require("express");

const userRoutes = require("./routes/user.routes");

const app = express();

const transactionRoutes = require("./routes/transaction.routes");

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});