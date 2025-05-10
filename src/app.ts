import "./config/globalSetup";
import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import cors from "cors";
import swaggerUI from "swagger-ui-express";
import morgan from "morgan";

import { limiter } from "./config/rateLimiter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import swaggerSpec from "./config/swagger";
import scoreRoutes from "./routes/score.routes";

const app = express();

app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(limiter);
app.use(cors<Request>());

app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));

app.get("/", (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    message: "Server is up and running in port 8000",
    timeStamp: new Date().toISOString(),
  });
});

app.use("/api/v1", scoreRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
