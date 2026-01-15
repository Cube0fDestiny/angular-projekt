import express from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import userRoutes from "./routes/users.js"; // <-- .js !!!
import pino from "pino";
import { errorHandler } from "./middleware/errorHandler.js";

const logger = pino({
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty" }
      : undefined,
});

const app = express();
app.use(pinoHttp({ logger }));
app.use(cors());
app.use(express.json());

app.use("/users", userRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => logger.info(`User service running on port ${PORT}`));
