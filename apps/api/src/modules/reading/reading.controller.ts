import type { RequestHandler } from "express";
import { listReadingPassages } from "./reading.service.js";

export const getReadingPassageList: RequestHandler = async (
  _req,
  res,
  next,
) => {
  try {
    const result = await listReadingPassages();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
