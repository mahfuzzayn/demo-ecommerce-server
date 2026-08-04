import { Router } from "express";
import { OrderController } from "./order.controller";
import validateRequest from "../../middleware/validateRequest";
import { OrderValidation } from "./order.validation";
import { UserRole } from "../user/user.interface";
import auth from "../../middleware/auth";

const router = Router();

router.get("/", auth(UserRole.ADMIN), OrderController.getAllOrders);

router.get(
    "/my-orders",
    auth(UserRole.CUSTOMER),
    OrderController.getMyOrders,
);

router.get(
    "/:orderId",
    auth(UserRole.ADMIN, UserRole.CUSTOMER),
    OrderController.getOrderDetails,
);

router.post(
    "/",
    auth(UserRole.ADMIN, UserRole.CUSTOMER),
    validateRequest(OrderValidation.createOrderValidationSchema),
    OrderController.createOrder,
);

router.patch(
    "/:orderId",
    auth(UserRole.ADMIN, UserRole.CUSTOMER),
    validateRequest(OrderValidation.updateOrderValidationSchema),
    OrderController.updateOrder,
);

router.patch(
    "/:orderId/status",
    auth(UserRole.ADMIN),
    validateRequest(OrderValidation.updateOrderStatusValidationSchema),
    OrderController.changeOrderStatus,
);

export const OrderRoutes = router;
