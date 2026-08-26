const { z } = require("zod");

const transferSchema = z.object({
    receiverAccountId: z.number().int().positive(),
    amount: z.number().positive()
});

const registerSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8)
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
});

const transactionQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    status: z.enum(["PENDING", "COMPLETED", "FAILED"]).optional(),
    transactionType: z.string().max(20).optional()
});

function validate(schema, source = "body") {
    return function (req, res, next) {

        const result = schema.safeParse(req[source]);

        if (!result.success) {
            const error = new Error("Validation failed");

            error.statusCode = 400;
            error.details = result.error.issues;

            return next(error);
        }

        req[source] = result.data;

        next();
    };
}

module.exports = {
    transferSchema,
    registerSchema,
    loginSchema,
    transactionQuerySchema,
    validate
};