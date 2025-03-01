import "../../../../env-setup";
import { repl } from "@nestjs/core";
import { REPLModule } from "./repl.module";

async function bootstrap() {
  await repl(REPLModule);
}
bootstrap();
