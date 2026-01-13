import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chats.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[Chat-Service] Otrzymano: ${req.method} ${req.url}`);
    next();
});

app.use("/chats", chatRoutes);

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => console.log(`🚀 Chat-Service running on port ${PORT}`));

app.use(errorHandler);