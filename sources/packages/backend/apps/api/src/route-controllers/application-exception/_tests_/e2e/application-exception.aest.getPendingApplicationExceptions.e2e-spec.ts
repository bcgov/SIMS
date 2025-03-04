import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { ApplicationExceptionStatus, ApplicationStatus } from "@sims/sims-db";
import { saveFakeApplicationWithApplicationException } from "../application-exception-helper";
import { createE2EDataSources, E2EDataSources } from "@sims/test-utils";

describe("ApplicationExceptionAESTController(e2e)-getPendingApplicationExceptions", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should get pending application exceptions when available.", async () => {
    // Arrange
    const application1Promise = saveFakeApplicationWithApplicationException(
      db.dataSource,
      undefined,
      { applicationExceptionStatus: ApplicationExceptionStatus.Pending },
    );
    const application2Promise = saveFakeApplicationWithApplicationException(
      db.dataSource,
      undefined,
      { applicationExceptionStatus: ApplicationExceptionStatus.Pending },
    );
    const application3Promise = saveFakeApplicationWithApplicationException(
      db.dataSource,
      undefined,
      { applicationExceptionStatus: ApplicationExceptionStatus.Approved },
    );
    const application4Promise = saveFakeApplicationWithApplicationException(
      db.dataSource,
      undefined,
      { applicationExceptionStatus: ApplicationExceptionStatus.Declined },
    );
    const application5Promise = saveFakeApplicationWithApplicationException(
      db.dataSource,
      undefined,
      { applicationExceptionStatus: ApplicationExceptionStatus.Pending },
    );
    const [
      application1,
      application2,
      application3,
      application4,
      application5,
    ] = await Promise.all([
      application1Promise,
      application2Promise,
      application3Promise,
      application4Promise,
      application5Promise,
    ]);

    application5.applicationStatus = ApplicationStatus.Edited;
    await db.application.save(application5);

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
              givenNames: application1.student.user.firstName,
              lastName: application1.student.user.lastName,
            }),
            expect.objectContaining({
              applicationId: application2.id,
              studentId: application2.student.id,
              applicationNumber: application2.applicationNumber,
              submittedDate:
                application2.applicationException.createdAt.toISOString(),
              givenNames: application2.student.user.firstName,
              lastName: application2.student.user.lastName,
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
            givenNames: application3.student.user.firstName,
            lastName: application3.student.user.lastName,
          }),
        );
        expect(applicationExceptionList).not.toContainEqual(
          expect.objectContaining({
            applicationId: application4.id,
            studentId: application4.student.id,
            applicationNumber: application4.applicationNumber,
            submittedDate:
              application4.applicationException.createdAt.toISOString(),
            givenNames: application4.student.user.firstName,
            lastName: application4.student.user.lastName,
          }),
        );
        expect(applicationExceptionList).not.toContainEqual(
          expect.objectContaining({
            applicationId: application5.id,
            studentId: application5.student.id,
            applicationNumber: application5.applicationNumber,
            submittedDate:
              application5.applicationException.createdAt.toISOString(),
            givenNames: application5.student.user.firstName,
            lastName: application5.student.user.lastName,
          }),
        );
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
