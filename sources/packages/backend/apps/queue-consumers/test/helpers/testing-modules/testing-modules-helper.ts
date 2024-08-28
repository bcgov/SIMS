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
import { ClamAVService, SystemUsersService, ZeebeModule } from "@sims/services";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";
import { createCASServiceMock } from "../mock-utils/cas-service.mock";
import { CASService } from "@sims/integrations/cas/cas.service";
import { createObjectStorageServiceMock } from "../mock-utils/object-storage-service-mock";
import { ObjectStorageService } from "@sims/integrations/object-storage";

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
  clamAVServiceMock: ClamAVService;
  objectStorageServiceMock: ObjectStorageService;
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
  const clamAVServiceMock = createClamAVServiceMock();
  const objectStorageServiceMock = createObjectStorageServiceMock();

  const module: TestingModule = await Test.createTestingModule({
    imports: [QueueConsumersModule, DiscoveryModule],
  })
    .overrideProvider(SshService)
    .useValue(createSSHServiceMock(sshClientMock))
    .overrideProvider(CASService)
    .useValue(casServiceMock)
    .overrideProvider(ClamAVService)
    .useValue(clamAVServiceMock)
    .overrideProvider(ObjectStorageService)
    .useValue(objectStorageServiceMock)
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
    clamAVServiceMock,
    objectStorageServiceMock,
  };
}

/**
 * Creates a mocked Clam anti-virus service.
 * @returns a mocked Clam anti-virus service.
 */
function createClamAVServiceMock(): ClamAVService {
  const mockedClamAVService = {} as ClamAVService;
  mockedClamAVService.scanFile = jest.fn(() => Promise.resolve(false));
  return mockedClamAVService;
}
