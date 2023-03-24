import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { Repository } from "typeorm";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  createFakeApplicationException,
  createFakeApplicationExceptionRequest,
} from "@sims/test-utils";
import {
  ApplicationException,
  ApplicationExceptionRequest,
  ApplicationExceptionStatus,
  User,
} from "@sims/sims-db";
import { ClientTypeBaseRoute } from "../../../../types";
import { SystemUsersService } from "@sims/services";
import { getUserFullName } from "../../../../utilities";

describe(`${ClientTypeBaseRoute.AEST}-ApplicationExceptionAESTController(e2e)-getExceptionById`, () => {
  let app: INestApplication;
  let applicationExceptionRepo: Repository<ApplicationException>;
  let applicationExceptionRequestRepo: Repository<ApplicationExceptionRequest>;
  let systemUsersService: SystemUsersService;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    applicationExceptionRepo = dataSource.getRepository(ApplicationException);
    applicationExceptionRequestRepo = dataSource.getRepository(
      ApplicationExceptionRequest,
    );
    systemUsersService = await module.get(SystemUsersService);
    userRepo = dataSource.getRepository(User);
  });

  it("Should get an application exception by id when available.", async () => {
    // Arrange
    const creator = await systemUsersService.systemUser();
    const assessedBy = await userRepo.findOneBy({
      userName: process.env.E2E_TEST_AEST_BUSINESS_ADMINISTRATORS_USER,
    });
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

    // Act/Assert
    await request(app.getHttpServer())
      .get(`/aest/application-exception/${applicationException.id}`)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
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
    // Act/Assert
    await request(app.getHttpServer())
      .get("/aest/application-exception/9999999")
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
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
