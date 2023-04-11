import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { QueueConsumersModule } from "../../../src/queue-consumers.module";
import { createZeebeModuleMock } from "@sims/test-utils/mocks/zeebe-client.mock";
import { ZBClient } from "zeebe-node";
import { SshService } from "@sims/integrations/services";
import { createSSHServiceMock } from "@sims/test-utils";

/**
 * Result from a createTestingModule to support E2E tests creation.
 */
export class CreateTestingModuleResult {
  nestApplication: INestApplication;
  module: TestingModule;
  dataSource: DataSource;
  zbClient: ZBClient;
  sshService: SshService;
}

/**
 * Created the Queue Consumers root module needed to perform the E2E tests.
 * @returns creation results with objects to support E2E tests.
 */
export async function createTestingAppModule(): Promise<CreateTestingModuleResult> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [QueueConsumersModule, createZeebeModuleMock()],
  })
    .overrideProvider(SshService)
    .useValue(createSSHServiceMock())
    .compile();
  const nestApplication = module.createNestApplication();
  await nestApplication.init();
  const dataSource = module.get(DataSource);
  const zbClient = nestApplication.get(ZBClient);
  const sshService = nestApplication.get(SshService);
  return {
    nestApplication,
    module,
    dataSource,
    zbClient,
    sshService,
  };
}
