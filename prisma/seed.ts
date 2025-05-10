import prisma from "../src/config/prisma";
import { generateId, getRandomTimestamp } from "../src/utils/index";
import logger from "../src/config/logger";

async function main(count: number = 10000) {
  const gameIds = ["game1", "game2", "game3"];
  const userIds = Array.from({ length: 1000 }, () => generateId("user"));

  const scoresData = Array.from({ length: count }).map(() => ({
    user_id: userIds[Math.floor(Math.random() * userIds.length)],
    game_id: gameIds[Math.floor(Math.random() * gameIds.length)],
    score: parseFloat((Math.random() * 1000).toFixed(2)),
    timeStamp: getRandomTimestamp(),
  }));

  console.time(`Seeding ${count} scores`);
  for (let i = 0; i < scoresData.length; i += 1000) {
    const batch = scoresData.slice(i, i + 1000);
    await prisma.scores.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
  console.timeEnd(`Seeding ${count} scores`);
}

main().then(() => {
  logger.info("Seeding completed");
  prisma.$disconnect();
});
