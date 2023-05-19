import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { WorkersModule } from "../../../src/workers.module";
import {
  createZeebeModuleMock,
  overrideImportsMetadata,
} from "@sims/test-utils";
import { ZeebeModule } from "@sims/services";

/**
 * Result from a createTestingModule to support E2E tests creation.
 */
export class CreateTestingModuleResult {
  nestApplication: INestApplication;
  module: TestingModule;
  dataSource: DataSource;
}

/**
 * Created the Workers root module needed to perform the E2E tests.
 * @returns creation results with objects to support E2E tests.
 */
export async function createTestingAppModule(): Promise<CreateTestingModuleResult> {
  overrideImportsMetadata(WorkersModule, {
    replace: ZeebeModule,
    by: createZeebeModuleMock(),
  });
  const module: TestingModule = await Test.createTestingModule({
    imports: [WorkersModule],
  }).compile();

  const nestApplication = module.createNestApplication();
  await nestApplication.init();
  const dataSource = module.get(DataSource);
  return {
    nestApplication,
    module,
    dataSource,
  };
}
