import Settings from "../settings/settings.model";
import { SETTINGS_ID } from "../settings/settings.constant";
import AppError from "../../errors/appError";
import { StatusCodes } from "http-status-codes";

// Resolves the delivery charge for a selected option name from the store's
// brand settings. The customer never sends an amount — only the option name.
export const resolveDeliveryCharge = async (
    optionName: string,
): Promise<number> => {
    const settings = await Settings.findById(SETTINGS_ID).select("brand");
    const option = settings?.brand?.deliveryOptions?.find(
        (opt: any) => opt.name === optionName && opt.isActive !== false,
    );

    if (!option) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            `Delivery option "${optionName}" is not available!`,
        );
    }

    return option.charge as number;
};
