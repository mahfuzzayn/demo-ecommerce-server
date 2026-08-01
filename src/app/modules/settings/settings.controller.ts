import { Request, Response } from "express";
import { SettingsServices } from "./settings.service";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { IJwtPayload } from "../auth/auth.interface";
import { IImageFile } from "../../interface/IImageFile";

const getSettings = catchAsync(async (_req: Request, res: Response) => {
    const result = await SettingsServices.getSettings();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Settings retrieved successfully",
        data: result,
    });
});

const createSettings = catchAsync(async (req: Request, res: Response) => {
    const result = await SettingsServices.createSettings(
        req.body,
        req.user as IJwtPayload,
        req.file as IImageFile,
    );

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Settings created successfully",
        data: result,
    });
});

const updateSettings = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await SettingsServices.updateSettings(
        id,
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

const updateSettingsSection = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const sectionKey = req.params.sectionKey as string;
    const result = await SettingsServices.updateSettingsSection(
        id,
        sectionKey,
        req.body,
        req.file as IImageFile,
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Section updated successfully",
        data: result,
    });
});

const deleteSettings = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await SettingsServices.deleteSettings(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Settings deleted successfully",
        data: result,
    });
});

export const SettingsController = {
    getSettings,
    createSettings,
    updateSettings,
    updateSettingsSection,
    deleteSettings,
};
