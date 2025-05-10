import { NextFunction, Request, Response } from "express";
import {
  getTopKLeadersService,
  getUserRankService,
  ingestScores,
} from "../services/score.service";
import { StatusCodes } from "http-status-codes";
import createHttpError from "http-errors";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const scoreInput = req.body;

    // Validate input
    if (!scoreInput || (!Array.isArray(scoreInput) && !scoreInput.user_id)) {
      throw createHttpError(StatusCodes.BAD_REQUEST, "Invalid score data");
    }
    const score = await ingestScores(scoreInput);
    res.status(StatusCodes.CREATED).json({ score });
  } catch (error) {
    next(error);
  }
};

export const getTopKLeaders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { game_id } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    const score = await getTopKLeadersService(game_id, limit);
    res.status(StatusCodes.OK).json({ score });
  } catch (error) {
    next(error);
  }
};

export const getUserRank = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { game_id, user_id } = req.params;

    const windowHours = parseInt(req.query.window as string);

    const user = await getUserRankService(
      game_id.trim(),
      user_id.trim(),
      windowHours
    );
    res.status(StatusCodes.OK).json({ user });
  } catch (error) {
    next(error);
  }
};
