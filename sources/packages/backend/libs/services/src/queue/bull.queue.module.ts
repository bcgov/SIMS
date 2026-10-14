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
import { QueueOptions } from "bullmq";
const BULL_MQ_QUEUES: {
  name: string;
  queueOptions: Pick<QueueOptions, "defaultJobOptions">;
}[] = [
  {
    name: "start-application",
    queueOptions: {
      defaultJobOptions: {
        attempts: 3,
        backoff: 180000,
        removeOnComplete: { age: 86400000 },
      },
    },
  },
];

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
export class BulMQModule implements OnApplicationShutdown {
  private readonly logger = new Logger(BulMQModule.name);

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
    { redisOptions: { password: redisConnectionOptions.password } },
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
  return BULL_MQ_QUEUES.map<RegisterQueueAsyncOptions>((queue) => ({
    name: queue.name,
    imports: [ConfigModule],
    useFactory: async (
      configService: ConfigService,
    ): Promise<RegisterQueueOptions> => {
      return {
        prefix: configService.queuePrefix,
        defaultJobOptions: queue.queueOptions.defaultJobOptions,
      };
    },
    inject: [ConfigService],
  }));
}
