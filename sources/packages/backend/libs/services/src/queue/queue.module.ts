import { Global, Module } from "@nestjs/common";
import {
  BullModule,
  BullRootModuleOptions,
  BullModuleOptions,
  BullModuleAsyncOptions,
} from "@nestjs/bull";
import Redis, { Cluster, RedisOptions } from "ioredis";
import { Queues } from "./constants/queue.constant";
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
    BullModule.registerQueueAsync(...getQueueModules()),
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
 * @param configService
 * @returns redis connection factory
 */
async function getConnectionFactory(
  configService: ConfigService,
): Promise<BullRootModuleOptions> {
  const redisConnectionOptions: RedisOptions = {
    host: configService.redis.redisHost,
    port: configService.redis.redisPort,
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
function getQueueModules(): BullModuleAsyncOptions[] {
  return Queues.map<BullModuleAsyncOptions>((queue) => ({
    name: queue.name,
    imports: [ConfigModule],
    useFactory: async (
      configService: ConfigService,
    ): Promise<BullModuleOptions> => ({
      prefix: configService.queuePrefix,
    }),
    inject: [ConfigService],
  }));
}
