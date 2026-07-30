import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import Order from "../order/order.model";
import {
    stripeInit,
    stripeValidate,
    sslCommerzInit,
    sslCommerzValidate,
    bkashInit,
    bkashValidate,
    generateTransactionId,
} from "./payment.utils";
import { ISSLCommerzInitData, PaymentGatewayStatus } from "./payment.interface";
import config from "../../config";

// ----------------------------------------------------------------
// Stripe Payment
// ----------------------------------------------------------------
const initiateStripePayment = async (
    orderId: string,
    body: { amount: number; currency?: string },
) => {
    const order = await Order.findById(orderId)
        .populate("user", "name email")
        .populate("products.product", "name");

    if (!order) {
        throw new AppError(StatusCodes.NOT_FOUND, "Order not found!");
    }

    const productName = (order.products || [])
        .map((p: any) => p.product?.name || "Product")
        .join(", ");

    const result = await stripeInit({
        amount: body.amount || order.finalAmount,
        currency: body.currency || "usd",
        orderId: order._id.toString(),
        productName,
    });

    // Store session ID on the order for callback validation
    if (result.sessionId) {
        order.set("stripeSessionId", result.sessionId);
        await order.save();
    }

    return result;
};

const validateStripePayment = async (body: { sessionId: string }) => {
    const result = await stripeValidate(body.sessionId);

    if (result.success && result.status === PaymentGatewayStatus.SUCCESS) {
        const order = await Order.findOne({
            stripeSessionId: body.sessionId,
        });

        if (order) {
            order.paymentStatus = "Paid" as any;
            order.status = "Processing" as any;
            await order.save();
        }
    }

    return result;
};

// ----------------------------------------------------------------
// SSLCommerz Payment
// ----------------------------------------------------------------
const initiateSSLCommerzPayment = async (
    orderId: string,
    body: Omit<
        ISSLCommerzInitData,
        "tran_id" | "success_url" | "fail_url" | "cancel_url" | "ipn_url"
    >,
) => {
    const order = await Order.findById(orderId).populate(
        "user",
        "name email phone cus_add1 cus_city cus_state cus_postcode cus_country",
    );

    if (!order) {
        throw new AppError(StatusCodes.NOT_FOUND, "Order not found!");
    }

    const user = order.user as any;
    const tran_id = generateTransactionId();

    const initData: ISSLCommerzInitData = {
        total_amount: body.total_amount || order.finalAmount,
        currency: body.currency || "BDT",
        tran_id,
        success_url: `${config.ssl.validation_url}?tran_id=${tran_id}`,
        fail_url: config.ssl.failed_url as string,
        cancel_url: config.ssl.cancel_url as string,
        ipn_url: `${config.server_url}/api/v1/payment/sslcommerz/validate`,
        product_name: body.product_name || "E-commerce Order",
        product_category: body.product_category || "General",
        cus_name: body.cus_name || user?.name || "Customer",
        cus_email: body.cus_email || user?.email || "customer@example.com",
        cus_phone: body.cus_phone || user?.phone || "01700000000",
        cus_add1: body.cus_add1 || user?.address || "Dhaka",
        cus_add2: body.cus_add2 || user?.address || "Dhaka",
        cus_city: body.cus_city || "Dhaka",
        cus_state: body.cus_state || "Dhaka",
        cus_postcode: body.cus_postcode || "1200",
        cus_country: body.cus_country || "Bangladesh",
        ship_name: body.ship_name || user?.name || "Customer",
        ship_add1: body.ship_add1 || user?.address || "Dhaka",
        ship_add2: body.ship_add2 || user?.address || "Dhaka",
        ship_city: body.ship_city || "Dhaka",
        ship_state: body.ship_state || "Dhaka",
        ship_postcode: body.ship_postcode || "1200",
        ship_country: body.ship_country || "Bangladesh",
    };

    const result = await sslCommerzInit(initData);

    // Store tran_id and session key on the order for webhook validation
    order.set("sslTransactionId", tran_id);
    if (result.sessionId) {
        order.set("sslSessionKey", result.sessionId);
    }
    await order.save();

    return result;
};

const validateSSLCommerzPayment = async (body: {
    val_id: string;
    tran_id?: string;
}) => {
    const result = await sslCommerzValidate(body);

    if (result.success && result.status === PaymentGatewayStatus.SUCCESS) {
        // Find order by stored tran_id
        const order = await Order.findOne({
            sslTransactionId: body.tran_id || result.transactionId,
        });

        if (order) {
            order.paymentStatus = "Paid" as any;
            order.status = "Processing" as any;
            await order.save();
        }
    }

    return result;
};

// ----------------------------------------------------------------
// bKash Payment
// ----------------------------------------------------------------
const initiateBkashPayment = async (
    orderId: string,
    body: { amount: number; customerNumber: string },
) => {
    const order = await Order.findById(orderId);

    if (!order) {
        throw new AppError(StatusCodes.NOT_FOUND, "Order not found!");
    }

    const result = await bkashInit({
        amount: body.amount || order.finalAmount,
        orderId: order._id.toString(),
        customerNumber: body.customerNumber,
    });

    return result;
};

const validateBkashPayment = async (body: { paymentID: string }) => {
    const result = await bkashValidate(body.paymentID);

    if (result.success && result.status === PaymentGatewayStatus.SUCCESS) {
        // Update order status
        const order = await Order.findOne().sort({ createdAt: -1 });

        if (order) {
            order.paymentStatus = "Paid" as any;
            order.status = "Processing" as any;
            await order.save();
        }
    }

    return result;
};

export const PaymentServices = {
    initiateStripePayment,
    validateStripePayment,
    initiateSSLCommerzPayment,
    validateSSLCommerzPayment,
    initiateBkashPayment,
    validateBkashPayment,
};
