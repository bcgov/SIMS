import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { AppModule } from "../../app.module";
import { KeycloakConfig } from "../../auth";
import { setGlobalPipes } from "../../utilities";
import {
  QueueModuleMock,
  createZeebeModuleMock,
  overrideImportsMetadata,
} from "@sims/test-utils";
import { QueueModule } from "@sims/services/queue";
import { ZeebeModule } from "@sims/services";
import { DiscoveryModule } from "@golevelup/nestjs-discovery";

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
  overrideImportsMetadata(
    AppModule,
    {
      replace: QueueModule,
      by: QueueModuleMock,
    },
    {
      replace: ZeebeModule,
      by: createZeebeModuleMock(),
    },
  );
  await KeycloakConfig.load();
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule, DiscoveryModule],
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
