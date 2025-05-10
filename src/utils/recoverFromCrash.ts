// src/utils/recoverFromCrash.ts
import fs from "fs";
import path from "path";
import logger from "../config/logger";
import prisma from "../config/prisma";
import type { Scores } from "@prisma/client";

const WAL_PATH = path.resolve(__dirname, "../../wal.log");

export async function recoverFromCrash(): Promise<void> {
  if (!fs.existsSync(WAL_PATH)) {
    logger.info("No wal.log found; nothing to recover.");
    return;
  }

  const raw = fs.readFileSync(WAL_PATH, "utf-8").trim();
  if (!raw) {
    fs.unlinkSync(WAL_PATH);
    logger.info("wal.log was empty; deleted.");
    return;
  }

  const lines = raw.split("\n");
  const records: Scores[] = [];

  for (const line of lines) {
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length !== 4) {
      logger.warn(
        `Skipping malformed WAL line (${parts.length} cols): ${line}`
      );
      continue;
    }
    const [timestamp, user_id, game_id, scoreStr] = parts;
    const score = Number(scoreStr);
    if (isNaN(score)) {
      logger.warn(`Skipping WAL line with invalid score: ${line}`);
      continue;
    }
    records.push({
      user_id,
      game_id,
      score,
      timeStamp: new Date(timestamp),
      id: undefined!,
      createdAt: undefined!,
      updatedAt: undefined!,
    });
  }

  if (records.length === 0) {
    fs.unlinkSync(WAL_PATH);
    logger.info("No valid records to recover; wal.log deleted.");
    return;
  }

  try {
    await prisma.scores.createMany({
      data: records,
      skipDuplicates: true,
    });

    logger.info(`Recovered ${records.length} scores from wal.log`);
  } catch (err) {
    logger.error("Batch recovery failed; falling back to single inserts", err);
    for (const rec of records) {
      try {
        await prisma.scores.create({ data: rec });
      } catch (innerErr) {
        logger.error(
          `Failed to insert recovered score for ${rec.user_id}@${rec.game_id}`,
          innerErr
        );
      }
    }
  } finally {
    try {
      fs.unlinkSync(WAL_PATH);
      logger.info("wal.log deleted after recovery");
    } catch (unlinkErr) {
      logger.error("Failed to delete wal.log after recovery", unlinkErr);
    }
  }
}
