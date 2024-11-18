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
import { BullBoardModule } from "@bull-board/nestjs";
import { ExpressAdapter } from "@bull-board/express";
import { BullBoardQueuesModule } from "@sims/services/queue";
import { BULL_BOARD_ROUTE } from "@sims/services/constants";
import * as basicAuth from "express-basic-auth";

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
    BullBoardModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: bullBoardModuleFactory,
      inject: [ConfigService],
    }),
    BullBoardQueuesModule,
  ],
  providers: [QueueService],
  exports: [BullModule, QueueService],
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

/**
 * Builds the Bull Board module options to register the dashboard in a dynamic way.
 * @param configService service with the configuration of the application.
 * @returns Bull Board module options with the dashboard route,
 * authentication middleware and the board options.
 */
async function bullBoardModuleFactory(configService: ConfigService) {
  const queueDashboardUsers = {};
  queueDashboardUsers[configService.queueDashboardCredential.userName] =
    configService.queueDashboardCredential.password;
  const authMiddleware = basicAuth({
    users: queueDashboardUsers,
    challenge: true,
  });
  return {
    route: BULL_BOARD_ROUTE,
    adapter: ExpressAdapter,
    middleware: authMiddleware,
    boardOptions: {
      uiConfig: {
        boardTitle: "SIMS-Queues",
        boardLogo: {
          path: "https://sims.studentaidbc.ca/favicon-32x32.png",
        },
        favIcon: {
          default: "https://sims.studentaidbc.ca/favicon-16x16.png",
          alternative: "https://sims.studentaidbc.ca/favicon-32x32.png",
        },
      },
    },
  };
}
