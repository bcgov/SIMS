require("../../../env_setup_apps");
import { NestFactory } from "@nestjs/core";
import { DesignationAgreementPendingService } from "./designation-agreement/designation-agreement-pending.service";
import { TestDbSeedingModule } from "./test-db-seeding.module";

async function bootstrap() {
  const app = await NestFactory.create(TestDbSeedingModule);
  console.log("here !");
  app
    .get(DesignationAgreementPendingService)
    .createPendingDesignationAgreement();
}
bootstrap();
