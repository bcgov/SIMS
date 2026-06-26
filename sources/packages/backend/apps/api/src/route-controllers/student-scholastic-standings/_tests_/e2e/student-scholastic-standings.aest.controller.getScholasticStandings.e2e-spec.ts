import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentScholasticStanding,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  mockJWTToken,
} from "../../../../testHelpers";
import request from "supertest";
import { TestingModule } from "@nestjs/testing";
import {
  OfferingIntensity,
  StudentScholasticStandingChangeType,
} from "@sims/sims-db";
import { AuthorizedParties, Role } from "../../../../auth";

describe("StudentScholasticStandingsAESTController(e2e)-getScholasticStandings.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    appModule = module;
  });

  it("Should get scholastic standing history details for the provided student.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      initialValues: {
        offeringIntensity: OfferingIntensity.fullTime,
      },
    });
    const firstScholasticStanding = createFakeStudentScholasticStanding(
      { submittedBy: application.student.user, application },
      {
        initialValues: {
          changeType:
            StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
          submittedData: {
            dateOfWithdrawal: "2026-01-15",
            scholasticStandingChangeType:
              StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
          },
        },
      },
    );
    const secondScholasticStanding = createFakeStudentScholasticStanding(
      { submittedBy: application.student.user, application },
      {
        initialValues: {
          changeType:
            StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
          reversalDate: new Date(),
          submittedData: {
            scholasticStandingChangeType:
              StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
          },
        },
      },
    );

    const savedScholasticStandings = await db.studentScholasticStanding.save([
      firstScholasticStanding,
      secondScholasticStanding,
    ]);

    await mockJWTToken(appModule, (payload) => {
      payload.resource_access[AuthorizedParties.aest]?.roles.push(
        Role.StudentViewScholasticStandingHistory,
      );
    });

    const endpoint = `/aest/scholastic-standing/student/${application.student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    expect(response.body).toHaveLength(2);
    const firstItem = response.body.find(
      (item: { scholasticStandingId: number }) =>
        item.scholasticStandingId === savedScholasticStandings[0].id,
    );
    const secondItem = response.body.find(
      (item: { scholasticStandingId: number }) =>
        item.scholasticStandingId === savedScholasticStandings[1].id,
    );

    expect(firstItem).toEqual(
      expect.objectContaining({
        scholasticStandingId: savedScholasticStandings[0].id,
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        scholasticStandingChangeType:
          StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
      }),
    );
    expect(firstItem).not.toHaveProperty("reversalDate");
    expect(secondItem).toEqual(
      expect.objectContaining({
        scholasticStandingId: savedScholasticStandings[1].id,
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        scholasticStandingChangeType:
          StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
        reversalDate: expect.any(String),
      }),
    );
  });

  it("Should return Not Found (404) when student is not found.", async () => {
    // Arrange
    await mockJWTToken(appModule, (payload) => {
      payload.resource_access[AuthorizedParties.aest]?.roles.push(
        Role.StudentViewScholasticStandingHistory,
      );
    });
    const endpoint = "/aest/scholastic-standing/student/9999999";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Student does not exists.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw forbidden error when ministry user does not have the required permission(s) to get scholastic standing history.", async () => {
    // Arrange
    const endpoint = "/aest/scholastic-standing/student/9999999";
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "Forbidden resource",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });
});
