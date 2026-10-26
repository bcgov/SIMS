import { Global, Logger, Module, OnApplicationShutdown } from "@nestjs/common";
import {
  BullModule,
  BullRootModuleOptions,
  RegisterQueueAsyncOptions,
  RegisterQueueOptions,
} from "@nestjs/bullmq";
import Redis, { RedisOptions } from "ioredis";
import { ConfigModule, ConfigService } from "@sims/utilities/config";
import { QueueService } from "./queue.service";
import { DatabaseModule } from "@sims/sims-db";
import { QueueNames, BULL_MQ_MIGRATED_QUEUE_NAMES } from "@sims/utilities";

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
export class QueueModule implements OnApplicationShutdown {
  private readonly logger = new Logger(QueueModule.name);

  /**
   * Logs the shutdown signal. Each Bull queue closes itself automatically
   * during shutdown through its own hook registered by `@nestjs/bull`.
   * @param signal signal that triggered the shutdown.
   */
  onApplicationShutdown(signal?: string): void {
    this.logger.log(
      `Signal (${signal}) received: Closing Queue connections...`,
    );
  }
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
      connection: redisConnectionOptions,
    };
  }
  const clusterConnection = new Redis.Cluster(
    [
      {
        host: redisConnectionOptions.host,
        port: redisConnectionOptions.port,
      },
    ],
    {
      redisOptions: {
        password: redisConnectionOptions.password,
        maxRetriesPerRequest: null,
      },
    },
  );
  return {
    connection: clusterConnection,
  };
}

/**
 * Builds the bull module options to register queues in a dynamic way.
 * @returns bull module options with all existing queues.
 */
function getQueueModules(): RegisterQueueAsyncOptions[] {
  return Object.values(QueueNames)
    .filter((queue) => BULL_MQ_MIGRATED_QUEUE_NAMES.includes(queue))
    .map<RegisterQueueAsyncOptions>((queue) => ({
      name: queue,
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService,
        queueService: QueueService,
      ): Promise<RegisterQueueOptions> => {
        const queueConfiguration =
          await queueService.queueConfigurationDetails(queue);
        if (!queueConfiguration.queueConfiguration.defaultJobOptions) {
          throw new Error(
            `Default job options not found in queue configuration for queue ${queue}.`,
          );
        }
        return {
          prefix: configService.queuePrefix,
          defaultJobOptions:
            queueConfiguration.queueConfiguration.defaultJobOptions,
        };
      },
      inject: [ConfigService, QueueService],
    }));
}
