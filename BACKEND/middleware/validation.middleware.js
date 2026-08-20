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

function validate(schema) {
    return function (req, res, next) {

        const result = schema.safeParse(req.body);

        if (!result.success) {
            const error = new Error("Validation failed");

            error.statusCode = 400;
            error.details = result.error.issues;

            return next(error);
        }

        req.body = result.data;

        next();
    };
}

module.exports = {
    transferSchema,
    registerSchema,
    loginSchema,
    validate
};