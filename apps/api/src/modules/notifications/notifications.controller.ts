import type { RequestHandler } from "express";
import {
  listNotifications,
  markNotificationAsRead,
} from "./notifications.service.js";

export const getNotifications: RequestHandler = async (req, res, next) => {
  try {
    const data = await listNotifications(req.user!.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const readNotification: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await markNotificationAsRead(id, req.user!.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
