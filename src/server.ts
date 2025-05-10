import app from "./app";
import logger from "./config/logger";
import prisma from "./config/prisma";
import { recoverFromCrash } from "./utils/recoverFromCrash";

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    await prisma.$connect();
    logger.info("Connected to Database");

    await recoverFromCrash();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

startServer();
