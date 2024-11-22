import { Global, Module } from "@nestjs/common";
import {
  BullModule,
  BullRootModuleOptions,
  BullModuleOptions,
  BullModuleAsyncOptions,
} from "@nestjs/bull";
import Redis, { Cluster, RedisOptions } from "ioredis";
import { ConfigModule, ConfigService } from "@sims/utilities/config";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "./queue.service";
import { DatabaseModule } from "@sims/sims-db";

/**
 * Creates root connection to redis standalone or redis cluster
 * based on environment variable.
 */
@Global()
@Module({
  imports: [
    DatabaseModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getConnectionFactory,
      inject: [ConfigService],
    }),
    BullModule.registerQueueAsync(...getQueueModules()),
  ],
  providers: [QueueService],
  exports: [BullModule, QueueService],
})
export class QueueModule {}

/**
 * Shared client connection to redis cluster.
 * @see https://github.com/OptimalBits/bull/blob/develop/PATTERNS.md#reusing-redis-connections
 */
let sharedClientRedisCluster: Cluster;
/**
 * Shared subscriber connection to redis cluster.
 * @see https://github.com/OptimalBits/bull/blob/develop/PATTERNS.md#reusing-redis-connections
 */
let sharedSubscriberClientRedisCluster: Cluster;

/**
 * Creates a Redis cluster connection.
 * @param options the redis connection options.
 * @returns a new instance of Redis cluster connection.
 */
function createdRedisClusterConnection(options: RedisOptions): Cluster {
  return new Redis.Cluster(
    [
      {
        host: options.host,
        port: options.port,
      },
    ],
    { redisOptions: { password: options.password } },
  );
}

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
    createClient: (
      type: "client" | "subscriber" | "bclient",
    ): Redis | Cluster => {
      switch (type) {
        case "client":
          if (!sharedClientRedisCluster) {
            sharedClientRedisCluster = createdRedisClusterConnection(
              redisConnectionOptions,
            );
          }
          return sharedClientRedisCluster;
        case "subscriber":
          if (!sharedSubscriberClientRedisCluster) {
            sharedSubscriberClientRedisCluster = createdRedisClusterConnection(
              redisConnectionOptions,
            );
          }
          return sharedSubscriberClientRedisCluster;
        case "bclient":
          // bclient types should always create a new connection.
          // @see https://github.com/OptimalBits/bull/blob/develop/PATTERNS.md#reusing-redis-connections
          return createdRedisClusterConnection(redisConnectionOptions);
      }
    },
  };
}

/**
 * Builds the bull module options to register queues in a dynamic way.
 * @returns bull module options with all existing queues.
 */
function getQueueModules(): BullModuleAsyncOptions[] {
  return Object.values(QueueNames).map<BullModuleAsyncOptions>((queue) => ({
    name: queue,
    imports: [ConfigModule],
    useFactory: async (
      configService: ConfigService,
      queueService: QueueService,
    ): Promise<BullModuleOptions> => {
      const queueConfig = await queueService.getQueueConfiguration(queue);
      const settings = await queueService.getQueueSetting(queue);
      return {
        prefix: configService.queuePrefix,
        defaultJobOptions: queueConfig,
        settings,
      };
    },
    inject: [ConfigService, QueueService],
  }));
}
