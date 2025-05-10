import { Scores } from "@prisma/client";
import fs from "fs";

export function generateId(prefix: string, length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = prefix;
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export function getRandomTimestamp(): Date {
  const now = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const randomPast = now - Math.floor(Math.random() * threeDays);
  return new Date(randomPast);
}

export function logToWAL(score: Scores) {
  const logEntry = `${score.timeStamp},${score.user_id},${score.game_id},${score.score}\n`;
  fs.appendFileSync("wal.log", logEntry, "utf-8");
}
