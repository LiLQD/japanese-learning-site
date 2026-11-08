import type { RequestHandler } from "express";
import { getDashboardStatistics } from "./dashboard.service.js";

export const getDashboardStatisticsHandler: RequestHandler = async (
  _req,
  res,
  next,
) => {
  try {
    const statistics = await getDashboardStatistics();
    res.status(200).json({ statistics });
  } catch (error) {
    next(error);
  }
};
