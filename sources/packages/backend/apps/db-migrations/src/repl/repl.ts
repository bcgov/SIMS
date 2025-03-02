import "../../../../env-setup";
import { repl } from "@nestjs/core";
import { REPLModule } from "./repl.module";

async function bootstrap() {
  console.info("DB Migrations REPL(Read-Eval-Print-Loop) started.");
  console.info("Please use the associated terminal to interact with the REPL.");
  console.info("Once on terminal type: npm run migration:repl");
  console.info("Some available commands:");
  console.info("await $(DBMigrationsService).list()");
  console.info("await $(DBMigrationsService).run()");
  console.info("await $(DBMigrationsService).rollback()");
  console.info("Use the command debug() for a list of providers.");
  console.info(
    "Use the command methods(provider name) for a list of available methods.",
  );
  console.info(
    "To see more about Nestjs REPL visit https://docs.nestjs.com/recipes/repl",
  );
  await repl(REPLModule);
}
bootstrap();
