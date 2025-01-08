import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { ApplicationStatus } from "@sims/sims-db";
import { addDays, getPSTPDTDateHourMinute } from "@sims/utilities";

describe("ApplicationAESTController(e2e)-getApplicationVersionHistory", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should get an array of application versions when there are an overwritten application and a completed application associated with the given application.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      submittedDate: new Date(),
    });

    const overwrittenApplication = await saveFakeApplication(
      db.dataSource,
      {
        institution:
          application.currentAssessment.offering.institutionLocation
            .institution,
        institutionLocation:
          application.currentAssessment.offering.institutionLocation,
        student: application.student,
        program: application.currentAssessment.offering.educationProgram,
        offering: application.currentAssessment.offering,
        programYear: application.programYear,
      },
      {
        applicationStatus: ApplicationStatus.Overwritten,
        applicationNumber: application.applicationNumber,
        offeringIntensity:
          application.currentAssessment.offering.offeringIntensity,
        pirStatus: application.pirStatus,
        submittedDate: addDays(-10),
      },
    );

    const completedApplication = await saveFakeApplication(
      db.dataSource,
      {
        institution:
          application.currentAssessment.offering.institutionLocation
            .institution,
        institutionLocation:
          application.currentAssessment.offering.institutionLocation,
        student: application.student,
        program: application.currentAssessment.offering.educationProgram,
        offering: application.currentAssessment.offering,
        programYear: application.programYear,
      },
      {
        applicationStatus: ApplicationStatus.Completed,
        applicationNumber: application.applicationNumber,
        offeringIntensity:
          application.currentAssessment.offering.offeringIntensity,
        pirStatus: application.pirStatus,
        submittedDate: addDays(-5),
      },
    );

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    const endpoint = `/aest/application/${application.id}/versions`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        const applicationHistory = response.body;
        expect(applicationHistory).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: overwrittenApplication.id,
              submittedDate: getPSTPDTDateHourMinute(
                overwrittenApplication.submittedDate,
              ),
            }),
            expect.objectContaining({
              id: completedApplication.id,
              submittedDate: getPSTPDTDateHourMinute(
                completedApplication.submittedDate,
              ),
            }),
          ]),
        );
      });
  });

  it("Should get an empty array of application versions when there is a draft application associated with the given application.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      submittedDate: new Date(),
    });

    // Create a draft application
    await saveFakeApplication(
      db.dataSource,
      {
        institution:
          application.currentAssessment.offering.institutionLocation
            .institution,
        institutionLocation:
          application.currentAssessment.offering.institutionLocation,
        student: application.student,
        program: application.currentAssessment.offering.educationProgram,
        offering: application.currentAssessment.offering,
        programYear: application.programYear,
      },
      {
        applicationStatus: ApplicationStatus.Draft,
        applicationNumber: application.applicationNumber,
        offeringIntensity:
          application.currentAssessment.offering.offeringIntensity,
        pirStatus: application.pirStatus,
        submittedDate: addDays(-10),
      },
    );

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    const endpoint = `/aest/application/${application.id}/versions`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([]);
  });

  it("Should throw not found error when an application is not found.", async () => {
    // Arrange
    const endpoint = "/aest/application/99999999/progress-details";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Application id 99999999 was not found.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
