import "../../../env-setup";
import { NestFactory } from "@nestjs/core";
import { CleanDatabase } from "./clean-db/clean-db";
import { TestDbSeedingModule } from "./test-db-seeding.module";
import { SeedExecutor } from "./seed-executors/seed-executor";
import { ConfigService } from "@sims/utilities/config";
import { SystemUsersService } from "@sims/services";
import { LoggerService } from "@sims/utilities/logger";

/**
 * Clean db command line identifier.
 */
const CLEAN_DB = "task=clean-db";
/**
 * Filter classes to be seeded command line identifier.
 */
const FILTER_CLASSES = "filter=";
/**
 * Checks if the database being purged contains the value defined
 * in this const to avoid cleaning a wrong DB by mistake.
 */
const TEST_DB_NAME = "_TESTS";

(async () => {
  const app = await NestFactory.create(TestDbSeedingModule);
  const logger = await app.resolve(LoggerService);
  // Config instance.
  const configService = app.get(ConfigService);
  // Checking for CLEAN_DB parameter.
  if (process.argv.includes(CLEAN_DB)) {
    // Clean db.
    if (
      configService.database.databaseName?.toUpperCase().includes(TEST_DB_NAME)
    ) {
      logger.log("Starting database cleaning process.");
      await app.get(CleanDatabase).cleanDatabase();
      logger.log("Database cleaned.");
    }
    await app.close();
    return;
  }

  /**
   * Checks for db seed class name as parameter and executes only passed classes.
   * Multiple class name is passed as a comma separated values without space.
   * @command example: npm run db:seed:test DesignationAgreementApprovalService,DesignationAgreementPendingService
   * If nothing is passed as a parameter then all test seed services will be executed.
   */
  let testClassList = undefined;
  const filterClassesIndex = process.argv.findIndex((element) => {
    if (element.includes(FILTER_CLASSES)) {
      return true;
    }
  });

  if (filterClassesIndex !== -1) {
    // Array contains substring match.
    testClassList = process.argv[filterClassesIndex]
      .replace(FILTER_CLASSES, "")
      .split(",");
  }

  logger.log("Loading system user.");
  const systemUsersService = app.get(SystemUsersService);
  await systemUsersService.loadSystemUser();
  logger.log("Executing seed services.");
  if (testClassList) {
    logger.log(`Using filtered classes: ${testClassList.join(", ")}`);
  }
  await app.get(SeedExecutor).executeSeed(testClassList);
  await app.close();
})();
