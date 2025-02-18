import { Module } from "@nestjs/common";
import { BullBoardModule, BullBoardModuleOptions } from "@bull-board/nestjs";
import { ConfigModule } from "@sims/utilities/config";
import { ExpressAdapter } from "@bull-board/express";
import { BULL_BOARD_ROUTE } from "../constants";
import { BullBoardQueuesRegistrationModule } from "./bull-board-queues-registration.module";
import { JwtModule } from "@nestjs/jwt";
import { BullBoardAuthenticationMiddleware } from "./bull-board-authentication.middleware";

/**
 * Bull board related modules to allow the dashboard to be registered.
 */
@Module({
  imports: [
    BullBoardModule.forRootAsync({
      imports: [ConfigModule, JwtModule],
      useFactory: bullBoardModuleFactory,
    }),
    BullBoardQueuesRegistrationModule,
  ],
  exports: [BullBoardModule, BullBoardQueuesRegistrationModule],
})
export class BullBoardQueuesModule {}

/**
 * Builds the Bull Board module options to register the dashboard in a dynamic way.
 * @returns Bull Board module options with the dashboard route,
 * authentication middleware and the board options.
 */
async function bullBoardModuleFactory(): Promise<BullBoardModuleOptions> {
  return {
    route: BULL_BOARD_ROUTE,
    adapter: ExpressAdapter,
    middleware: BullBoardAuthenticationMiddleware,
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
