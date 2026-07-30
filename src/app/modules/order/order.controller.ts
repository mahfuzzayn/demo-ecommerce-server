import { Request, Response } from "express";
import { OrderServices } from "./order.service";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { IJwtPayload } from "../auth/auth.interface";

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
    const result = await OrderServices.getAllOrders(req.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Orders retrieved successfully",
        meta: result.meta,
        data: result.result,
    });
});

const getOrderDetails = catchAsync(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const result = await OrderServices.getOrderDetails(orderId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Order details retrieved successfully",
        data: result,
    });
});

const createOrder = catchAsync(async (req: Request, res: Response) => {
    const result = await OrderServices.createOrder(
        req.body,
        req.user as IJwtPayload,
    );

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Order created successfully",
        data: result,
    });
});

const changeOrderStatus = catchAsync(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { status } = req.body;
    const result = await OrderServices.changeOrderStatus(orderId, status);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: `Order status updated to ${status}`,
        data: result,
    });
});

export const OrderController = {
    getAllOrders,
    getOrderDetails,
    createOrder,
    changeOrderStatus,
};
