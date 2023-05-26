import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { ApplicationExceptionStatus } from "@sims/sims-db";
import { getUserFullName } from "../../../../utilities";
import { saveFakeApplicationWithApplicationException } from "../application-exception-helper";

describe("ApplicationExceptionAESTController(e2e)-getPendingApplicationExceptions", () => {
  let app: INestApplication;
  let appDataSource: DataSource;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
  });

  it("Should get pending application exceptions when available.", async () => {
    // Arrange
    const application1Promise = saveFakeApplicationWithApplicationException(
      appDataSource,
      undefined,
      { applicationExceptionStatus: ApplicationExceptionStatus.Pending },
    );
    const application2Promise = saveFakeApplicationWithApplicationException(
      appDataSource,
      undefined,
      { applicationExceptionStatus: ApplicationExceptionStatus.Pending },
    );
    const application3Promise = saveFakeApplicationWithApplicationException(
      appDataSource,
      undefined,
      { applicationExceptionStatus: ApplicationExceptionStatus.Approved },
    );
    const application4Promise = saveFakeApplicationWithApplicationException(
      appDataSource,
      undefined,
      { applicationExceptionStatus: ApplicationExceptionStatus.Declined },
    );
    const [application1, application2, application3, application4] =
      await Promise.all([
        application1Promise,
        application2Promise,
        application3Promise,
        application4Promise,
      ]);
    const endpoint =
      "/aest/application-exception?page=0&pageLimit=100&sortField=submittedDate&sortOrder=DESC";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        const applicationExceptionList = response.body.results;
        expect(applicationExceptionList).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              applicationId: application1.id,
              studentId: application1.student.id,
              applicationNumber: application1.applicationNumber,
              submittedDate:
                application1.applicationException.createdAt.toISOString(),
              fullName: getUserFullName(application1.student.user),
            }),
            expect.objectContaining({
              applicationId: application2.id,
              studentId: application2.student.id,
              applicationNumber: application2.applicationNumber,
              submittedDate:
                application2.applicationException.createdAt.toISOString(),
              fullName: getUserFullName(application2.student.user),
            }),
          ]),
        );
        expect(applicationExceptionList).not.toContainEqual(
          expect.objectContaining({
            applicationId: application3.id,
            studentId: application3.student.id,
            applicationNumber: application3.applicationNumber,
            submittedDate:
              application3.applicationException.createdAt.toISOString(),
            fullName: getUserFullName(application3.student.user),
          }),
        );
        expect(applicationExceptionList).not.toContainEqual(
          expect.objectContaining({
            applicationId: application4.id,
            studentId: application4.student.id,
            applicationNumber: application4.applicationNumber,
            submittedDate:
              application4.applicationException.createdAt.toISOString(),
            fullName: getUserFullName(application4.student.user),
          }),
        );
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
