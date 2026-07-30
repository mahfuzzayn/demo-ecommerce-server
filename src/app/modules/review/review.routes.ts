import { Router } from "express";
import { ReviewController } from "./review.controller";
import validateRequest from "../../middleware/validateRequest";
import { ReviewValidation } from "./review.validation";
import { UserRole } from "../user/user.interface";
import auth from "../../middleware/auth";

const router = Router();

router.get("/", ReviewController.getAllReviews);

router.get("/:reviewId", ReviewController.getSingleReview);

router.post(
    "/",
    auth(UserRole.ADMIN, UserRole.CUSTOMER),
    validateRequest(ReviewValidation.createReviewValidationSchema),
    ReviewController.createReview,
);

export const ReviewRoutes = router;
