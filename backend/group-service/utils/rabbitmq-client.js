import amqp from "amqplib";
import { logger } from "../server.js";

let channel = null;
const exchange = "app_events";

export const connectRabbitMQ = async () => {
    if (channel) {
        logger.info("RabbitMQ already connected");
        return;
    }
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertExchange(exchange, "topic", { durable: true });
        logger.info("RabbitMQ connected");
    } catch (err) {
        logger.error({ error: err }, "RabbitMQ connection failed");
        process.exit(1);
    }
};

export const publishEvent = (routingKey, data) => {
    if (!channel) {
        logger.warn("RabbitMQ not connected, event not published");
        return;
    }
    const message = Buffer.from(JSON.stringify(data));
    channel.publish(exchange, routingKey, message, { persistent: true });
    logger.info({ routingKey }, "Event published");
};
