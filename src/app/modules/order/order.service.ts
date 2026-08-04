import { IOrder } from "./order.interface";
import Order from "./order.model";
import Product from "../product/product.model";
import Coupon from "../coupon/coupon.model";
import { DiscountType } from "../coupon/coupon.interface";
import { Currency } from "../../constants/currency";
import AppError from "../../errors/appError";
import { StatusCodes } from "http-status-codes";
import { OrderSearchableFields } from "./order.constant";
import QueryBuilder from "../../builder/QueryBuilder";
import { IJwtPayload } from "../auth/auth.interface";
import mongoose from "mongoose";

// Validate products (exist, active, not deleted, sufficient stock) and compute
// the true line totals from the DB prices — client-supplied unitPrice is ignored.
const validateAndPriceProducts = async (
    items: { product: mongoose.Types.ObjectId | string; quantity: number }[],
) => {
    const priced: {
        product: mongoose.Types.ObjectId;
        quantity: number;
        unitPrice: number;
    }[] = [];

    let total = 0;
    let currency: Currency | null = null;

    for (const item of items) {
        const product = await Product.findOne({
            _id: item.product,
            isDeleted: false,
        });

        if (!product) {
            throw new AppError(
                StatusCodes.NOT_FOUND,
                `Product with ID ${item.product} not found!`,
            );
        }
        if (!product.isActive) {
            throw new AppError(
                StatusCodes.BAD_REQUEST,
                `Product "${product.name}" is not available!`,
            );
        }
        if (product.stock < item.quantity) {
            throw new AppError(
                StatusCodes.BAD_REQUEST,
                `Insufficient stock for "${product.name}". Available: ${product.stock}`,
            );
        }

        // All products in an order must share the same currency
        if (currency && product.currency !== currency) {
            throw new AppError(
                StatusCodes.BAD_REQUEST,
                "All products in an order must have the same currency!",
            );
        }
        currency = product.currency;

        priced.push({
            product: product._id,
            quantity: item.quantity,
            unitPrice: product.price,
        });

        total += product.price * item.quantity;
    }

    return { priced, totalAmount: total, currency: currency || Currency.USD };
};

// Verify a coupon code and return the computed discount (0 if no coupon)
const applyCoupon = async (
    couponCode: string | null | undefined,
    totalAmount: number,
) => {
    if (!couponCode) {
        return { coupon: null, discount: 0 };
    }

    const coupon = await Coupon.findOne({
        code: { $regex: new RegExp(`^${couponCode}$`, "i") },
        isDeleted: { $ne: true },
    });

    if (!coupon) {
        throw new AppError(StatusCodes.NOT_FOUND, "Coupon not found!");
    }
    if (!coupon.isActive) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Coupon is not active!");
    }

    const now = new Date();
    if (now < coupon.startDate) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Coupon is not yet active!",
        );
    }
    if (now > coupon.endDate) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Coupon has expired!");
    }
    if (totalAmount < coupon.minOrderAmount) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            `Minimum order amount for this coupon is ${coupon.minOrderAmount}`,
        );
    }

    let discount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
        discount = (totalAmount * coupon.discountValue) / 100;
        if (
            coupon.maxDiscountAmount > 0 &&
            discount > coupon.maxDiscountAmount
        ) {
            discount = coupon.maxDiscountAmount;
        }
    } else {
        discount = coupon.discountValue;
    }

    // Never discount below zero / more than the total
    discount = Math.min(discount, totalAmount);

    return { coupon: coupon.code, discount };
};

const getAllOrders = async (query: Record<string, unknown>) => {
    const orderQuery = new QueryBuilder(
        Order.find()
            .populate("user", "name email")
            .populate("products.product", "name price imageUrls"),
        query,
    )
        .search(OrderSearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await orderQuery.modelQuery;
    const meta = await orderQuery.countTotal();
    return {
        result,
        meta,
    };
};

// Authenticated customer's own orders
const getMyOrders = async (
    authUser: IJwtPayload,
    query: Record<string, unknown>,
) => {
    const orderQuery = new QueryBuilder(
        Order.find({ user: authUser.userId })
            .populate("user", "name email")
            .populate("products.product", "name price imageUrls"),
        query,
    )
        .search(OrderSearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await orderQuery.modelQuery;
    const meta = await orderQuery.countTotal();
    return {
        result,
        meta,
    };
};

const getOrderDetails = async (orderId: string, authUser: IJwtPayload) => {
    const order = await Order.findById(orderId)
        .populate("user", "name email")
        .populate("products.product", "name price imageUrls");

    if (!order) {
        throw new AppError(StatusCodes.NOT_FOUND, "Order not found!");
    }

    // Capture the raw owner id BEFORE it is replaced by the populated user doc
    const ownerId = (order.user as any)._id?.toString() || order.user.toString();

    // Admin sees everything; the user who placed the order can see their own
    if (authUser.role !== "admin" && ownerId !== authUser.userId) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized!");
    }

    return order;
};

const createOrder = async (payload: IOrder, authUser: IJwtPayload) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // 1. Validate products + compute server-side total
        const { priced, totalAmount, currency } =
            await validateAndPriceProducts(payload.products);

        // 2. Verify coupon and compute discount
        const { coupon, discount } = await applyCoupon(
            payload.coupon,
            totalAmount,
        );

        const deliveryCharge = payload.deliveryCharge || 0;
        if (deliveryCharge < 0) {
            throw new AppError(
                StatusCodes.BAD_REQUEST,
                "Delivery charge cannot be negative!",
            );
        }

        const finalAmount = totalAmount - discount + deliveryCharge;

        // 3. Build the order with server-computed values
        const order = new Order({
            user: authUser.userId,
            products: priced,
            coupon,
            totalAmount,
            discount,
            deliveryCharge,
            finalAmount,
            currency,
            status: payload.status || undefined,
            shippingAddress: payload.shippingAddress,
            paymentMethod: payload.paymentMethod,
            paymentStatus: payload.paymentStatus || undefined,
        });

        const createdOrder = await order.save({ session });

        // 4. Decrement stock (inside the transaction)
        for (const item of priced) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: -item.quantity } },
                { session },
            );
        }

        await session.commitTransaction();

        const populatedOrder = await Order.findById(createdOrder._id)
            .populate("user", "name email")
            .populate("products.product", "name price imageUrls");

        return populatedOrder;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

const updateOrder = async (
    orderId: string,
    payload: Partial<IOrder>,
    authUser: IJwtPayload,
) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new AppError(StatusCodes.NOT_FOUND, "Order not found!");
    }

    // Only the owner or an admin can update an order
    if (
        authUser.role !== "admin" &&
        order.user.toString() !== authUser.userId
    ) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized!");
    }

    // Once paid/completed/cancelled, prevent edits to the financial core
    if (["Completed", "Cancelled"].includes(order.status)) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            `Cannot modify a ${order.status.toLowerCase()} order!`,
        );
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // Re-validate + re-price the product list if provided (full recompute)
        if (payload.products && payload.products.length > 0) {
            const { priced, totalAmount, currency } =
                await validateAndPriceProducts(payload.products);

            // Restore previous stock, then decrement for the new quantities
            for (const item of order.products) {
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock: item.quantity } },
                    { session },
                );
            }

            order.products = priced as any;
            order.totalAmount = totalAmount;
            order.currency = currency;
        }

        if (payload.coupon !== undefined) {
            const { coupon, discount } = await applyCoupon(
                payload.coupon,
                order.totalAmount,
            );
            order.coupon = coupon;
            order.discount = discount;
        }

        if (payload.deliveryCharge !== undefined) {
            if (payload.deliveryCharge < 0) {
                throw new AppError(
                    StatusCodes.BAD_REQUEST,
                    "Delivery charge cannot be negative!",
                );
            }
            order.deliveryCharge = payload.deliveryCharge;
        }

        order.finalAmount =
            order.totalAmount - order.discount + order.deliveryCharge;

        if (payload.shippingAddress) {
            order.shippingAddress = payload.shippingAddress;
        }
        if (payload.paymentMethod) {
            order.paymentMethod = payload.paymentMethod;
        }

        await order.save({ session });

        // Decrement stock for the new product list
        for (const item of order.products) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: -item.quantity } },
                { session },
            );
        }

        await session.commitTransaction();

        const populatedOrder = await Order.findById(order._id)
            .populate("user", "name email")
            .populate("products.product", "name price imageUrls");

        return populatedOrder;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

const changeOrderStatus = async (orderId: string, status: string) => {
    const order = await Order.checkOrderExist(orderId);

    if (order.status === "Cancelled" || order.status === "Completed") {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            `Cannot change status of a ${order.status.toLowerCase()} order!`,
        );
    }

    const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true },
    )
        .populate("user", "name email")
        .populate("products.product", "name price imageUrls");

    return updatedOrder;
};

export const OrderServices = {
    getAllOrders,
    getMyOrders,
    getOrderDetails,
    createOrder,
    updateOrder,
    changeOrderStatus,
};
