import { Router } from "express";
import { SettingsController } from "./settings.controller";
import validateRequest from "../../middleware/validateRequest";
import { SettingsValidation } from "./settings.validation";
import { UserRole } from "../user/user.interface";
import auth from "../../middleware/auth";
import { multerUpload } from "../../config/multer.config";
import { parseBody } from "../../middleware/bodyParser";

const router = Router();

router.get("/", SettingsController.getSettings);

router.post(
    "/",
    auth(UserRole.ADMIN),
    multerUpload.single("logo"),
    parseBody,
    validateRequest(SettingsValidation.createSettingsValidationSchema),
    SettingsController.createSettings,
);

router.patch(
    "/:id",
    auth(UserRole.ADMIN),
    multerUpload.single("logo"),
    parseBody,
    validateRequest(SettingsValidation.updateSettingsValidationSchema),
    SettingsController.updateSettings,
);

router.patch(
    "/:id/section/:sectionKey",
    auth(UserRole.ADMIN),
    multerUpload.single("image"),
    parseBody,
    SettingsController.updateSettingsSection,
);

router.delete(
    "/:id",
    auth(UserRole.ADMIN),
    SettingsController.deleteSettings,
);

export const SettingsRoutes = router;
