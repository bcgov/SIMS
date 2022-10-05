require("../../../env_setup_apps");
import { NestFactory } from "@nestjs/core";
import { WorkersModule } from "./workers.module";
import { ZeebeTransportStrategy } from "./zeebe/zeebe-transport-strategy";

async function bootstrap() {
  const workers = await NestFactory.createMicroservice(WorkersModule, {
    strategy: new ZeebeTransportStrategy(),
  });
  await workers.listen();
}
bootstrap();
