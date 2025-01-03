import { Module } from "@nestjs/common";
import { BullBoardModule, BullBoardModuleOptions } from "@bull-board/nestjs";
import { ConfigModule, ConfigService } from "@sims/utilities/config";
import * as basicAuth from "express-basic-auth";
import { ExpressAdapter } from "@bull-board/express";
import { BULL_BOARD_ROUTE } from "../constants";
import { BullBoardQueuesRegistrationModule } from "./bull-board-queues-registration.module";

/**
 * Bull board related modules to allow the dashboard to be registered.
 */
@Module({
  imports: [
    BullBoardModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: bullBoardModuleFactory,
      inject: [ConfigService],
    }),
    BullBoardQueuesRegistrationModule,
  ],
  exports: [BullBoardModule, BullBoardQueuesRegistrationModule],
})
export class BullBoardQueuesModule {}

/**
 * Builds the Bull Board module options to register the dashboard in a dynamic way.
 * @param configService service with the configuration of the application.
 * @returns Bull Board module options with the dashboard route,
 * authentication middleware and the board options.
 */
async function bullBoardModuleFactory(
  configService: ConfigService,
): Promise<BullBoardModuleOptions> {
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
