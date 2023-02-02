import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { AppModule } from "../../app.module";
import { KeycloakConfig } from "../../auth";
import { setGlobalPipes } from "../../utilities";
import { MockedQueueModule } from "../mocked-providers/queue-module-mock";
import { createMockedZeebeModule } from "../mocked-providers/zeebe-client-mock";

export class CreateTestingModuleResult {
  nestApplication: INestApplication;
  module: TestingModule;
  dataSource: DataSource;
}

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
