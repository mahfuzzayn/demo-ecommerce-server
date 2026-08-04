import { Request, Response } from "express";
import { SettingsServices } from "./settings.service";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { SETTINGS_SECTIONS } from "./settings.constant";
import { IImageFile } from "../../interface/IImageFile";
import AppError from "../../errors/appError";

const getSettings = catchAsync(async (_req: Request, res: Response) => {
    const result = await SettingsServices.getSettings();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Settings retrieved successfully",
        data: result,
    });
});

const updateBrandFields = catchAsync(async (req: Request, res: Response) => {
    const result = await SettingsServices.updateBrandFields(
        req.body,
        req.file as IImageFile,
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Settings updated successfully",
        data: result,
    });
});

const updateSection = catchAsync(async (req: Request, res: Response) => {
    const { section } = req.params;

    if (!SETTINGS_SECTIONS.includes(section as any)) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid settings section!");
    }

    const result = await SettingsServices.updateSection(
        section as any,
        req.body,
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: `${section} settings updated successfully`,
        data: result,
    });
});

export const SettingsController = {
    getSettings,
    updateBrandFields,
    updateSection,
};
