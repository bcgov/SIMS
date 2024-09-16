import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { AppModule } from "../../app.module";
import { setGlobalPipes } from "../../utilities";
import { overrideImportsMetadata } from "@sims/test-utils";
import {
  createObjectStorageServiceMock,
  createZeebeModuleMock,
  QueueModuleMock,
} from "@sims/test-utils/mocks";
import { QueueModule } from "@sims/services/queue";
import { SystemUsersService, ZeebeModule } from "@sims/services";
import { DiscoveryModule } from "@golevelup/nestjs-discovery";
import { KeycloakConfig } from "@sims/auth/config";
import { ObjectStorageService } from "@sims/integrations/object-storage";

/**
 * Result from a createTestingModule to support E2E tests creation.
 */
export class CreateTestingModuleResult {
  nestApplication: INestApplication;
  module: TestingModule;
  dataSource: DataSource;
  objectStorageServiceMock: ObjectStorageService;
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
  const objectStorageServiceMock = createObjectStorageServiceMock();
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule, DiscoveryModule],
  })
    .overrideProvider(ObjectStorageService)
    .useValue(objectStorageServiceMock)
    .compile();
  const nestApplication = module.createNestApplication();
  setGlobalPipes(nestApplication);
  await nestApplication.init();

  // Load system user.
  const systemUsersService = nestApplication.get(SystemUsersService);
  await systemUsersService.loadSystemUser();

  const dataSource = module.get(DataSource);
  return {
    nestApplication,
    module,
    dataSource,
    objectStorageServiceMock,
  };
}
