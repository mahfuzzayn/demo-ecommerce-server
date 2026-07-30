import { Router } from "express";
import { PaymentController } from "./payment.controller";
import validateRequest from "../../middleware/validateRequest";
import { PaymentValidation } from "./payment.validation";
import { UserRole } from "../user/user.interface";
import auth from "../../middleware/auth";

const router = Router();

// Stripe
router.post(
    "/:orderId/stripe/init",
    auth(UserRole.ADMIN, UserRole.CUSTOMER),
    validateRequest(PaymentValidation.stripeInitValidationSchema),
    PaymentController.initiateStripePayment,
);

// Stripe redirect callbacks — Stripe redirects the browser here after Checkout
router.all("/stripe/success", PaymentController.validateStripePayment);
router.all("/stripe/cancel", PaymentController.validateStripePayment);

// SSLCommerz
router.post(
    "/:orderId/sslcommerz/init",
    auth(UserRole.ADMIN, UserRole.CUSTOMER),
    validateRequest(PaymentValidation.sslCommerzInitValidationSchema),
    PaymentController.initiateSSLCommerzPayment,
);

// SSLCommerz — accepts POST (SSLCommerz server) and GET (browser redirect)
router.all("/sslcommerz/validate", PaymentController.validateSSLCommerzPayment);

// bKash
router.post(
    "/:orderId/bkash/init",
    auth(UserRole.ADMIN, UserRole.CUSTOMER),
    validateRequest(PaymentValidation.bkashInitValidationSchema),
    PaymentController.initiateBkashPayment,
);

router.post(
    "/bkash/validate",
    auth(UserRole.ADMIN, UserRole.CUSTOMER),
    validateRequest(PaymentValidation.bkashValidateValidationSchema),
    PaymentController.validateBkashPayment,
);

export const PaymentRoutes = router;
