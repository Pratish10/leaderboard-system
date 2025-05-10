import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import logger from "../config/logger";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err.message);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode < 500 ? err.message : "Internal Server Error";

  res.status(statusCode).json({
    error: {
      status: statusCode,
      message,
    },
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next(createHttpError.NotFound("Route Not Found"));
};
