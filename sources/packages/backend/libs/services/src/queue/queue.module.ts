import { Global, Logger, Module, OnApplicationShutdown } from "@nestjs/common";
import {
  BullModule,
  BullRootModuleOptions,
  BullModuleOptions,
  BullModuleAsyncOptions,
  getQueueToken,
} from "@nestjs/bull";
import { ModuleRef } from "@nestjs/core";
import { Queue } from "bull";
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
export class QueueModule implements OnApplicationShutdown {
  private readonly logger = new Logger(QueueModule.name);

  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Invoked during application shutdown. Intercepts and closes each registered
   * Bull queue while logging the teardown sequence.
   */
  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.log(`Signal (${signal}) received: Closing queue connections.`);

    const queueNames = Object.values(QueueNames);

    await Promise.allSettled(
      queueNames.map(async (queueName: string) => {
        try {
          const queue = this.moduleRef.get<Queue>(getQueueToken(queueName), {
            strict: false,
          });

          if (!queue) {
            this.logger.warn(
              `Queue '${queueName}' token not found during shutdown.`,
            );
            return;
          }

          this.logger.log(
            `Closing queue '${queueName}' and its Redis connections...`,
          );

          // Closing the queue stops processing and closes all underlying Redis clients
          await queue.close();

          this.logger.log(`Queue '${queueName}' successfully closed.`);
        } catch (error) {
          this.logger.error(`Error closing queue '${queueName}':`, error);
        }
      }),
    );

    this.logger.log(`Queue client connections closed.`);
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
