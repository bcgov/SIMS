import { Global, Module } from "@nestjs/common";
import {
  BullModule,
  BullRootModuleOptions,
  BullModuleOptions,
} from "@nestjs/bull";
import Redis, { Cluster, RedisOptions } from "ioredis";
import { QUEUE_PREFIX, Queues } from "./constants/queue.constant";

/**
 * Creates root connection to redis standalone or redis cluster
 * based on environment variable.
 */
@Global()
@Module({
  imports: [
    BullModule.forRoot(getConnectionFactory()),
    BullModule.registerQueue(...getQueueModules()),
  ],
  exports: [BullModule],
})
export class QueueModule {}

/**
 * Connection factory which returns connection properties
 * to connect redis.
 * Depending upon the environment variable it uses standalone
 * or cluster connection.
 ** While running in local env make sure to set REDIS_STANDALONE_MODE as true.
 * @returns redis connection factory
 */
function getConnectionFactory(): BullRootModuleOptions {
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

/**
 * Builds the bull module options to register queues in a dynamic way.
 * @returns bull module options with all existing queues.
 */
function getQueueModules(): BullModuleOptions[] {
  return Queues.map<BullModuleOptions>((queue) => ({
    name: queue.name,
    prefix: QUEUE_PREFIX,
  }));
}
