import { z } from "zod";

const stripeInitValidationSchema = z.object({
    body: z.object({
        amount: z.number().min(0, "Amount must be a positive number"),
        currency: z.string().optional().default("usd"),
    }),
});

const sslCommerzInitValidationSchema = z.object({
    body: z.object({
        total_amount: z.number().min(0),
        product_name: z.string().min(1, "Product name is required"),
        product_category: z.string().optional().default("General"),
        cus_name: z.string().min(1, "Customer name is required"),
        cus_email: z.string().email("Invalid email"),
        cus_phone: z.string().min(1, "Phone is required"),
        cus_add1: z.string().min(1, "Address is required"),
        cus_city: z.string().min(1, "City is required"),
        cus_state: z.string().min(1, "State is required"),
        cus_postcode: z.string().min(1, "Postcode is required"),
        cus_country: z.string().min(1, "Country is required"),
        ship_name: z.string().min(1, "Ship name is required"),
        ship_add1: z.string().min(1, "Ship address is required"),
        ship_city: z.string().min(1, "Ship city is required"),
        ship_state: z.string().min(1, "Ship state is required"),
        ship_postcode: z.union([z.string(), z.number()]),
        ship_country: z.string().min(1, "Ship country is required"),
    }),
});

const bkashInitValidationSchema = z.object({
    body: z.object({
        amount: z.number().min(0, "Amount must be a positive number"),
        customerNumber: z.string().min(1, "Customer number is required"),
    }),
});

const stripeValidateValidationSchema = z.object({
    body: z.object({
        paymentIntentId: z.string().min(1, "Payment intent ID is required"),
    }),
});

const sslCommerzValidateValidationSchema = z.object({
    body: z.object({
        val_id: z.string().min(1, "Validation ID is required"),
        tran_id: z.string().optional(),
    }),
});

const bkashValidateValidationSchema = z.object({
    body: z.object({
        paymentID: z.string().min(1, "Payment ID is required"),
    }),
});

export const PaymentValidation = {
    stripeInitValidationSchema,
    sslCommerzInitValidationSchema,
    bkashInitValidationSchema,
    stripeValidateValidationSchema,
    sslCommerzValidateValidationSchema,
    bkashValidateValidationSchema,
};
