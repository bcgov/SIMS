import { INestApplication } from "@nestjs/common";
import { Test, TestingModule, TestingModuleBuilder } from "@nestjs/testing";
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
import { UserService } from "../../services";
import { UserLoginInfo } from "../../services/user/user.model";

/**
 * Result from a createTestingModule to support E2E tests creation.
 */
export class CreateTestingModuleResult {
  nestApplication: INestApplication;
  module: TestingModule;
  dataSource: DataSource;
  mockedMethods: MockedMethods;
}

/**
 *
 */
export class MockedMethods {
  getUserLoginInfoReturn: UserLoginInfo;
}

/**
 *
 */
const mockedMethods = {
  getUserLoginInfoReturn: undefined,
};

/**
 *
 */
class mockedUserService extends UserService {
  async getUserLoginInfo(): Promise<UserLoginInfo> {
    return Promise.resolve(mockedMethods.getUserLoginInfoReturn);
  }
}

/**
 * Created the API root module needed to perform the E2E tests.
 * @returns creation results with objects to support E2E tests.
 */
export async function createTestingAppModule(options?: {
  mockGetUserLoginInfo?: boolean;
}): Promise<CreateTestingModuleResult> {
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
  const moduleBuilder: TestingModuleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });
  if (options?.mockGetUserLoginInfo) {
    moduleBuilder.overrideProvider(UserService).useClass(mockedUserService);
  }
  const module: TestingModule = await moduleBuilder.compile();

  const nestApplication = module.createNestApplication();
  setGlobalPipes(nestApplication);
  await nestApplication.init();
  const dataSource = module.get(DataSource);
  return {
    nestApplication,
    module,
    dataSource,
    mockedMethods: mockedMethods,
  };
}
