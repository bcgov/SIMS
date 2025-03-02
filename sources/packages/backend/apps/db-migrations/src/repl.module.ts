import { Logger, Module, OnModuleInit } from "@nestjs/common";
import { DBMigrationsService } from "./db-migrations.service";

@Module({
  providers: [DBMigrationsService],
})
export class REPLModule implements OnModuleInit {
  onModuleInit() {
    const logger = new Logger();
    logger.log("DB Migrations REPL(Read-Eval-Print-Loop) started.");
    logger.warn(`Current version: ${process.env.VERSION}`);
    logger.log("Please use the associated terminal to interact with the REPL.");
    logger.log("Once on terminal type: npm run migration:repl");
    logger.log("Some available commands:");
    logger.log("await get(DBMigrationsService).list()");
    logger.log("await get(DBMigrationsService).run()");
    logger.log("await get(DBMigrationsService).revert()");
    logger.log("Use '.exit' to leave the REPL.");
  }
}
