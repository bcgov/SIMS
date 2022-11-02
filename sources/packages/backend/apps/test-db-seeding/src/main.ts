require("../../../env_setup_apps");
import { NestFactory } from "@nestjs/core";
import { TestDbSeedingModule } from "./test-db-seeding.module";
import { TestOrganizerService } from "./test-organizer/test-organizer.service";

async function bootstrap() {
  const app = await NestFactory.create(TestDbSeedingModule);
  await app.get(TestOrganizerService).onModuleInit();
}
bootstrap();
