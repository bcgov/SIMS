import "../../../../env-setup";
import { repl } from "@nestjs/core";
import { REPLModule } from "./repl.module";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  const logger = new Logger();
  logger.log("DB Migrations REPL(Read-Eval-Print-Loop) started.");
  logger.warn(`Current version: ${process.env.VERSION}`);
  logger.log("Please use the associated terminal to interact with the REPL.");
  logger.log("Once on terminal type: npm run migration:repl");
  logger.log("Available commands:");
  logger.log("await $(DBMigrationsService).list()");
  logger.log("await $(DBMigrationsService).run()");
  logger.log("await $(DBMigrationsService).rollback()");
  logger.log("Use '.exit' to leave the REPL.");
  await repl(REPLModule);
}
bootstrap();
