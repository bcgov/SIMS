import "../../../env-setup";
import { NestFactory } from "@nestjs/core";
import { LoadTestModule } from "./load-test.module";
import { ConfigService } from "@sims/utilities/config";
import { KeycloakConfig } from "@sims/auth/config";

async function bootstrap() {
  await KeycloakConfig.load();
  const app = await NestFactory.create(LoadTestModule);
  app.setGlobalPrefix("load-test");
  const config = app.get<ConfigService>(ConfigService);
  await app.listen(config.loadTestAPIPort);
}
bootstrap();
