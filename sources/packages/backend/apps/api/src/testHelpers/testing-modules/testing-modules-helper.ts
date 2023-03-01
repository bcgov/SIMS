import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@sims/utilities/config";
import { DataSource } from "typeorm";
import { AppModule } from "../../app.module";
import { KeycloakConfig } from "../../auth";
import { ConfigController } from "../../route-controllers";
import { setGlobalPipes } from "../../utilities";
import { MockedQueueModule } from "../mocked-providers/queue-module-mock";
import { createMockedZeebeModule } from "../mocked-providers/zeebe-client-mock";

/**
 * Result from a createTestingModule to support E2E tests creation.
 */
export class CreateTestingModuleResult {
  nestApplication: INestApplication;
  module: TestingModule;
  dataSource: DataSource;
}

/**
 * Created the API root module needed to perform the E2E tests.
 * @returns creation results with objects to support E2E tests.
 */
export async function createTestingAppModule(): Promise<CreateTestingModuleResult> {
  await KeycloakConfig.load();
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule, createMockedZeebeModule(), MockedQueueModule],
  }).compile();
  const nestApplication = module.createNestApplication();
  setGlobalPipes(nestApplication);
  await nestApplication.init();
  const dataSource = module.get(DataSource);
  return {
    nestApplication,
    module,
    dataSource,
  };
}

/**
 * API root module only with config module and config controller.
 ** This module allows to mock any environment variable including
 ** keycloak environment variables.
 ** This module is exclusively for Config e2e tests.
 * @returns test config module as root application module.
 */
export async function createTestingConfigModule(): Promise<CreateTestingModuleResult> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [ConfigModule],
    controllers: [ConfigController],
  }).compile();
  const nestApplication = module.createNestApplication();
  setGlobalPipes(nestApplication);
  await nestApplication.init();
  return {
    nestApplication,
    module,
  } as CreateTestingModuleResult;
}
