import createHttpError from "http-errors";
import prisma from "../config/prisma";
import { Prisma, Scores } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { Cache } from "../utils/cache";
import { logToWAL } from "../utils";
import logger from "../config/logger";

const cache = Cache.getInstance();

const writeQueue: Scores[] = [];
let isProcessing = false;
let queueResolvers: (() => void)[] = [];

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    while (writeQueue.length > 0) {
      const batch = writeQueue.splice(0, 5000);

      try {
        await prisma.scores.createMany({
          data: batch,
        });
      } catch (error) {
        throw createHttpError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Internal Server Error"
        );
      }

      const uniqueGameIds = [...new Set(batch.map((s) => s.game_id))];
      uniqueGameIds.forEach((gameId) => {
        cache.evict("top-k-leaders", [gameId]);
      });

      batch.forEach((score) => {
        cache.evict("user-rank", [score.game_id, score.user_id]);
      });
    }
  } finally {
    isProcessing = false;
    queueResolvers.forEach((resolve) => resolve());
    queueResolvers = [];
  }
}

export const ingestScores = async (score: Scores | Scores[]) => {
  const scoresArray = Array.isArray(score) ? score : [score];
  scoresArray.forEach(logToWAL);

  logger.info("Backup created to wal.log file");

  writeQueue.push(...scoresArray);

  processQueue();

  await new Promise<void>((resolve) => {
    queueResolvers.push(resolve);
  });

  return {
    message: `${scoresArray.length} score(s) successfully processed.`,
  };
};

export const getTopKLeadersService = async (game_id: string, limit: number) => {
  const cacheKey = `${game_id}-${limit}`;

  const cached = cache.get("top-k-leaders", cacheKey);
  if (cached) return cached;

  const result = await prisma.scores.findMany({
    where: { game_id },
    take: limit,
    orderBy: {
      score: "desc",
    },
  });

  cache.set("top-k-leaders", cacheKey, result, 300);

  return result;
};

export const getUserRankService = async (
  game_id: string,
  user_id: string,
  windowHours?: number
) => {
  const cacheKey = `${game_id}-${user_id}-${windowHours ?? "all"}`;
  const cached = cache.get("user-rank", cacheKey);
  if (cached) return cached;

  const result = await prisma.$queryRaw<
    {
      rank: number;
      percentile: string;
      total_players: number;
    }[]
  >`
    WITH ranked_scores AS (
      SELECT 
        user_id,
        score,
        "timeStamp",
        RANK() OVER (
          PARTITION BY game_id 
          ORDER BY score DESC
        ) AS rank,
        COUNT(*) OVER (PARTITION BY game_id) AS total_players
      FROM "Scores"
      WHERE 
        game_id = ${game_id}
        ${
          windowHours
            ? Prisma.sql` AND "timeStamp" >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '${windowHours} hours'`
            : Prisma.empty
        }
    )
    SELECT 
      rank,
      CASE
        WHEN total_players = 0 THEN '100.00'::VARCHAR
        ELSE 
          ROUND(
            ((total_players - rank)::NUMERIC / GREATEST(total_players - 1, 1)) * 100, 
            2
          )::VARCHAR
      END AS percentile,
      total_players
    FROM ranked_scores
    WHERE user_id = ${user_id}
  `;

  if (!result.length) {
    throw createHttpError(
      StatusCodes.NOT_FOUND,
      "User not found in leaderboard"
    );
  }

  const data = {
    ...result[0],
    percentile: parseFloat(result[0].percentile),
  };

  cache.set("user-rank", cacheKey, data, 300);

  return data;
};
