import { IOrder } from "./order.interface";
import Order from "./order.model";
import Product from "../product/product.model";
import AppError from "../../errors/appError";
import { StatusCodes } from "http-status-codes";
import { OrderSearchableFields } from "./order.constant";
import QueryBuilder from "../../builder/QueryBuilder";
import { IJwtPayload } from "../auth/auth.interface";

const getAllOrders = async (query: Record<string, unknown>) => {
    const orderQuery = new QueryBuilder(
        Order.find().populate("user").populate("products.product"),
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

const getOrderDetails = async (orderId: string) => {
    const order = await Order.findById(orderId)
        .populate("user")
        .populate("products.product");

    if (!order) {
        throw new AppError(StatusCodes.NOT_FOUND, "Order not found!");
    }

    return order;
};

const createOrder = async (
    payload: IOrder,
    authUser: IJwtPayload,
) => {
    // Validate all products exist and are active
    for (const item of payload.products) {
        const product = await Product.findById(item.product);
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
    }

    // Attach the authenticated user
    payload.user = authUser.userId as any;

    const order = new Order(payload);
    const createdOrder = await order.save();

    // Decrement stock for each product
    for (const item of payload.products) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity },
        });
    }

    const populatedOrder = await Order.findById(createdOrder._id)
        .populate("user")
        .populate("products.product");

    return populatedOrder;
};

const changeOrderStatus = async (
    orderId: string,
    status: string,
) => {
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
        .populate("user")
        .populate("products.product");

    return updatedOrder;
};

export const OrderServices = {
    getAllOrders,
    getOrderDetails,
    createOrder,
    changeOrderStatus,
};
