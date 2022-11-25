import { Global, Module } from "@nestjs/common";
import {
  BullModule,
  BullRootModuleOptions,
  BullModuleOptions,
} from "@nestjs/bull";
import Redis, { Cluster, RedisOptions } from "ioredis";
import { QUEUE_PREFIX, Queues } from "./constants/queue.constant";
import { ConfigModule, ConfigService } from "@sims/utilities/config";

/**
 * Creates root connection to redis standalone or redis cluster
 * based on environment variable.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getConnectionFactory,
      inject: [ConfigService],
    }),
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
async function getConnectionFactory(
  configService: ConfigService,
): Promise<BullRootModuleOptions> {
  const redisConnectionOptions: RedisOptions = {
    host: configService.redis.redisHost || "localhost",
    port: configService.redis.redisPort || 6379,
    password: configService.redis.redisPassword,
  };
  if (configService.redis.redisStandaloneMode) {
    return {
      redis: redisConnectionOptions,
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
        { redisOptions: { password: redisConnectionOptions.password } },
      );
    },
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
