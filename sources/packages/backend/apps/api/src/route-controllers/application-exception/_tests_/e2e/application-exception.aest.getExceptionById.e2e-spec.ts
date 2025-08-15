import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { ApplicationExceptionStatus } from "@sims/sims-db";
import { getUserFullName } from "../../../../utilities";
import { saveFakeApplicationWithApplicationException } from "../application-exception-helper";
import {
  createE2EDataSources,
  createFakeApplicationException,
  createFakeApplicationExceptionRequest,
  E2EDataSources,
} from "@sims/test-utils";

describe("ApplicationExceptionAESTController(e2e)-getExceptionById", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should get an application exception by id when available.", async () => {
    // Arrange
    const application = await saveFakeApplicationWithApplicationException(
      db.dataSource,
      undefined,
      { applicationExceptionStatus: ApplicationExceptionStatus.Approved },
    );
    const [firstExceptionRequest] =
      application.applicationException.exceptionRequests;
    const endpoint = `/aest/application-exception/${application.applicationException.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        exceptionStatus: application.applicationException.exceptionStatus,
        submittedDate: application.applicationException.createdAt.toISOString(),
        noteDescription:
          application.applicationException.exceptionNote.description,
        assessedByUserName: getUserFullName(
          application.applicationException.assessedBy,
        ),
        assessedDate:
          application.applicationException.assessedDate.toISOString(),
        exceptionRequests: [
          {
            exceptionName: firstExceptionRequest.exceptionName,
            exceptionDescription: firstExceptionRequest.exceptionDescription,
          },
        ],
      });
  });

  it("Should get a previously approved application exception by id when available.", async () => {
    // Arrange
    const application = await saveFakeApplicationWithApplicationException(
      db.dataSource,
      undefined,
      { applicationExceptionStatus: ApplicationExceptionStatus.Approved },
    );
    const [firstExceptionRequest] =
      application.applicationException.exceptionRequests;

    const now = new Date();
    const approvedException = createFakeApplicationException();
    approvedException.exceptionStatus = ApplicationExceptionStatus.Approved;
    approvedException.application = application;
    approvedException.assessedDate = now;
    approvedException.exceptionRequests = [
      createFakeApplicationExceptionRequest({
        applicationException: approvedException,
      }),
    ];
    await db.applicationException.save(approvedException);
    firstExceptionRequest.approvalExceptionRequest =
      approvedException.exceptionRequests[0];
    await db.applicationExceptionRequest.save(firstExceptionRequest);

    const endpoint = `/aest/application-exception/${application.applicationException.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        exceptionStatus: application.applicationException.exceptionStatus,
        submittedDate: application.applicationException.createdAt.toISOString(),
        noteDescription:
          application.applicationException.exceptionNote.description,
        assessedByUserName: getUserFullName(
          application.applicationException.assessedBy,
        ),
        assessedDate:
          application.applicationException.assessedDate.toISOString(),
        exceptionRequests: [
          {
            exceptionName: firstExceptionRequest.exceptionName,
            exceptionDescription: firstExceptionRequest.exceptionDescription,
            previouslyApprovedOn: now.toISOString(),
          },
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
