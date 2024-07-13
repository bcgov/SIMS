import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { QueueConsumersModule } from "../../../src/queue-consumers.module";
import { SshService } from "@sims/integrations/services";
import { overrideImportsMetadata } from "@sims/test-utils";
import {
  QueueModuleMock,
  createSSHServiceMock,
  createZeebeModuleMock,
} from "@sims/test-utils/mocks";
import * as Client from "ssh2-sftp-client";
import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { DiscoveryModule } from "@golevelup/nestjs-discovery";
import { QueueModule } from "@sims/services/queue";
import { SystemUsersService, ZeebeModule } from "@sims/services";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";
import { CASService } from "../../../src/services";
import { createCASServiceMock } from "../mock-utils/cas-service.mock";

/**
 * Result from a createTestingModule to support E2E tests creation.
 */
export class CreateTestingModuleResult {
  nestApplication: INestApplication;
  module: TestingModule;
  dataSource: DataSource;
  zbClient: ZeebeGrpcClient;
  sshClientMock: DeepMocked<Client>;
  casServiceMock: CASService;
}

/**
 * Created the Queue Consumers root module needed to perform the E2E tests.
 * @returns creation results with objects to support E2E tests.
 */
export async function createTestingAppModule(): Promise<CreateTestingModuleResult> {
  overrideImportsMetadata(
    QueueConsumersModule,
    {
      replace: QueueModule,
      by: QueueModuleMock,
    },
    {
      replace: ZeebeModule,
      by: createZeebeModuleMock(),
    },
  );
  const sshClientMock = createMock<Client>();
  const casServiceMock = createCASServiceMock();
  const module: TestingModule = await Test.createTestingModule({
    imports: [QueueConsumersModule, DiscoveryModule],
  })
    .overrideProvider(SshService)
    .useValue(createSSHServiceMock(sshClientMock))
    .overrideProvider(CASService)
    .useValue(casServiceMock)
    .compile();

  const nestApplication = module.createNestApplication();
  await nestApplication.init();

  const dataSource = module.get(DataSource);
  const zbClient = nestApplication.get(ZeebeGrpcClient);

  // Load system user.
  const systemUsersService = nestApplication.get(SystemUsersService);
  await systemUsersService.loadSystemUser();

  return {
    nestApplication,
    module,
    dataSource,
    zbClient,
    sshClientMock,
    casServiceMock,
  };
}
