import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import {
  createFakeApplicationException,
  createFakeApplicationExceptionRequest,
} from "@sims/test-utils";
import {
  ApplicationException,
  ApplicationExceptionRequest,
  ApplicationExceptionStatus,
} from "@sims/sims-db";
import { SystemUsersService } from "@sims/services";
import { getUserFullName } from "../../../../utilities";

describe(`ApplicationExceptionAESTController(e2e)-getExceptionById`, () => {
  let app: INestApplication;
  let applicationExceptionRepo: Repository<ApplicationException>;
  let applicationExceptionRequestRepo: Repository<ApplicationExceptionRequest>;
  let systemUsersService: SystemUsersService;
  let appDataSource: DataSource;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    applicationExceptionRepo = dataSource.getRepository(ApplicationException);
    applicationExceptionRequestRepo = dataSource.getRepository(
      ApplicationExceptionRequest,
    );
    systemUsersService = await module.get(SystemUsersService);
    appDataSource = dataSource;
  });

  it("Should get an application exception by id when available.", async () => {
    // Arrange
    const creator = await systemUsersService.systemUser();
    const assessedBy = await getAESTUser(
      appDataSource,
      AESTGroups.BusinessAdministrators,
    );

    let applicationException = createFakeApplicationException(
      ApplicationExceptionStatus.Approved,
      { creator, assessedBy },
    );
    applicationException = await applicationExceptionRepo.save(
      applicationException,
    );
    const applicationExceptionRequest =
      await applicationExceptionRequestRepo.save(
        createFakeApplicationExceptionRequest(applicationException, {
          creator,
        }),
      );
    const endpoint = `/aest/application-exception/${applicationException.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        exceptionStatus: applicationException.exceptionStatus,
        submittedDate: applicationException.createdAt.toISOString(),
        noteDescription: applicationException.exceptionNote.description,
        assessedByUserName: getUserFullName(applicationException.assessedBy),
        assessedDate: applicationException.assessedDate.toISOString(),
        exceptionRequests: [
          { exceptionName: applicationExceptionRequest.exceptionName },
        ],
      });
  });

  it("Should get 'not found' status and message when the application exception is not available.", async () => {
    // Arrange
    const endpoint = "/aest/application-exception/9999999";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message: "Student application exception not found.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
