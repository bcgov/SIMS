require("../../../env_setup_apps");
import { NestFactory } from "@nestjs/core";
import { CleanDbService } from "./clean-db/clean-db.service";
import { TestDbSeedingModule } from "./test-db-seeding.module";
import { TestOrganizerService } from "./test-organizer/test-organizer.service";
// Clean db command line parameter.
const CLEAN_DB = "--task=clean-db";

async function bootstrap() {
  const app = await NestFactory.create(TestDbSeedingModule);

  // Checking for CLEAN_DB parameter.
  if (process.argv.includes(CLEAN_DB) && process.argv.length === 3) {
    // Clean db.
    await app.get(CleanDbService).onModuleInit();
    console.info("Database cleaned!!");
    return;
  }

  /**
   * Checks for db seed class name as parameter. and executes only passed classes.
   * Multiple class name is passed as a comma separated values
   * @command example: npm run db:seed:test DesignationAgreementApprovalService,DesignationAgreementPendingService
   */
  if (process.argv.length === 3) {
    {
      const testClassList = process.argv[2].split(",");
      await app.get(TestOrganizerService).onModuleInit(testClassList);
      return;
    }
  }

  // If nothing is passed as a parameter then all test seed services will be executed.
  // await app.get(TestOrganizerService).onModuleInit();
}
bootstrap();
