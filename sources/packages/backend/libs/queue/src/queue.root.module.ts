import { Module } from "@nestjs/common";
import { BullModule, BullRootModuleOptions } from "@nestjs/bull";
import Redis, { Cluster, RedisOptions } from "ioredis";
import { QUEUE_PREFIX } from "./constants/queue.constant";

/**
 * Creates root connection to redis standalone or redis cluster
 * based on environment variable.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: getConnectionFactory,
    }),
  ],
})
export class QueueRootModule {}

function getConnectionFactory():
  | Promise<BullRootModuleOptions>
  | BullRootModuleOptions {
  const redisConnectionOptions: RedisOptions = {
    host: process.env.REDIS_HOST || "localhost",
    port: +process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  };
  if (process.env.REDIS_STANDALONE_MODE === "true") {
    return {
      redis: redisConnectionOptions,
      prefix: QUEUE_PREFIX,
    };
  }
  return {
    createClient: (): Redis | Cluster => {
      return new Redis.Cluster(
        [
          {
            host: redisConnectionOptions.host,
            port: redisConnectionOptions.port,
          },
        ],
        { redisOptions: { password: process.env.REDIS_PASSWORD } },
      );
    },
    prefix: QUEUE_PREFIX,
  };
}
