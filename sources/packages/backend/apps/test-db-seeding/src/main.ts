require("../../../env_setup_apps");
import { NestFactory } from "@nestjs/core";
import { CleanDbService } from "./clean-db/clean-db.service";
import { DesignationAgreementApprovalService } from "./designation-agreement/designation-agreement-approval.service";
import { TestDbSeedingModule } from "./test-db-seeding.module";
import { TestOrganizerService } from "./test-organizer/test-organizer.service";
const CLEAN_DB = "--task=clean-db";

async function bootstrap() {
  const app = await NestFactory.create(TestDbSeedingModule);

  console.log(process.argv, process.argv.length);
  if (process.argv.includes(CLEAN_DB) && process.argv.length === 3) {
    // Clean db.
    await app.get(CleanDbService).onModuleInit();
    console.log("cleaned db");
    return;
  }
  // todo: ann update below comment.
  // todo: ann accept comma seperated.
  // command: npm run db:seed:test DesignationAgreementApprovalService
  console.log(process.argv, process.argv.length);
  if (process.argv.length === 3) {
    {
      const testClassList = process.argv[2].split(",");
      console.log(testClassList);
      await app.get(TestOrganizerService).onModuleInit(testClassList);
      return;
    }

    // await app.get(TestOrganizerService).onModuleInit();
    // await app.get(CleanDbService).onModuleInit();
  }
}
bootstrap();
