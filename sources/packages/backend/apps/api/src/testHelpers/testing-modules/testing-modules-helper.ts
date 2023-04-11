import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { AppModule } from "../../app.module";
import { KeycloakConfig } from "../../auth";
import { setGlobalPipes } from "../../utilities";
import { MockedQueueModule } from "../mocked-providers/queue-module-mock";
import { createZeebeModuleMock } from "@sims/test-utils";

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
    imports: [AppModule, createZeebeModuleMock(), MockedQueueModule],
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
