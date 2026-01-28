import amqp from "amqplib";
import { logger } from "../server.js";
import dotenv from "dotenv";
dotenv.config();

let channel = null;
const exchange = "app_events";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectRabbitMQ = async (retries = 10, delay = 5000) => {
  if (channel) {
    logger.info("RabbitMQ already connected");
    return;
  }

  const url = process.env.RABBITMQ_URL;
  if (!url) {
    logger.error(
      "[Group-Service] RABBITMQ_URL environment variable is not set",
    );
    throw new Error("RABBITMQ_URL environment variable is not set");
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info({ attempt, url }, "Attempting to connect to RabbitMQ...");

      const connection = await amqp.connect(url);
      channel = await connection.createChannel();
      await channel.assertExchange(exchange, "topic", { durable: true });

      connection.on("error", (err) => {
        logger.error(
          { message: err?.message, stack: err?.stack },
          "RabbitMQ connection error",
        );
      });

      connection.on("close", () => {
        logger.warn("RabbitMQ connection closed");
        channel = null;
      });

      logger.info("✅ RabbitMQ connected successfully");
      return;
    } catch (err) {
      logger.warn(
        { attempt, maxRetries: retries, message: err?.message, stack: err?.stack },
        `RabbitMQ connection attempt ${attempt}/${retries} failed`,
      );

      if (attempt === retries) {
        logger.error(
          { message: err?.message, stack: err?.stack },
          "❌ All RabbitMQ connection attempts failed",
        );
        throw err;
      }

      logger.info(`Waiting ${delay / 1000}s before retry...`);
      await sleep(delay);
    }
  }
};

export const publishEvent = (routingKey, data) => {
  if (!channel) {
    logger.warn({ routingKey }, "RabbitMQ not connected, event not published");
    return false;
  }
  try {
    const message = Buffer.from(JSON.stringify(data));
    channel.publish(exchange, routingKey, message, { persistent: true });
    logger.info({ routingKey }, "Event published");
    return true;
  } catch (err) {
    logger.error({ error: err.message, routingKey }, "Failed to publish event");
    return false;
  }
};
