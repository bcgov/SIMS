import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentScholasticStanding,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  BEARER_AUTH_TYPE,
  FakeStudentUsersTypes,
  createTestingAppModule,
  getStudentToken,
  mockUserLoginInfo,
} from "../../../../testHelpers";
import * as request from "supertest";
import { TestingModule } from "@nestjs/testing";
import { OfferingIntensity } from "@sims/sims-db";
import { deliveryMethod } from "../../../../utilities";

describe("StudentScholasticStandingsStudentsController(e2e)-getScholasticStanding.", () => {
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

  it("Should get the student scholastic standing details for the provided scholastic standing id.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Mock user service to return the saved student.
    await mockUserLoginInfo(appModule, student);
    const application = await saveFakeApplication(
      db.dataSource,
      {
        student,
      },
      {
        initialValues: {
          offeringIntensity: OfferingIntensity.fullTime,
        },
      },
    );
    const scholasticStanding = createFakeStudentScholasticStanding(
      { submittedBy: student.user, application },
      {
        initialValues: {
          unsuccessfulWeeks: 5,
          referenceOffering: application.currentAssessment.offering,
        },
      },
    );
    const savedScholasticStanding = await db.studentScholasticStanding.save(
      scholasticStanding,
    );
    const endpoint = `/students/scholastic-standing/${savedScholasticStanding.id}`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        applicationStatus: application.applicationStatus,
        applicationNumber: application.applicationNumber,
        applicationOfferingIntensity:
          application.currentAssessment.offering.offeringIntensity,
        applicationOfferingStartDate:
          application.currentAssessment.offering.studyStartDate,
        applicationOfferingEndDate:
          application.currentAssessment.offering.studyEndDate,
        applicationLocationName:
          application.currentAssessment.offering.institutionLocation.name,
        applicationStudentName:
          application.student.user.firstName +
          " " +
          application.student.user.lastName,
        applicationOfferingName: application.currentAssessment.offering.name,
        applicationProgramDescription:
          application.currentAssessment.offering.educationProgram.description,
        applicationProgramName:
          application.currentAssessment.offering.educationProgram.name,
        applicationProgramCredential:
          application.currentAssessment.offering.educationProgram
            .credentialType,
        applicationProgramDelivery: deliveryMethod(
          application.currentAssessment.offering.educationProgram
            .deliveredOnline,
          application.currentAssessment.offering.educationProgram
            .deliveredOnSite,
        ),
        applicationOfferingStudyDelivery:
          application.currentAssessment.offering.offeringDelivered,
        applicationOfferingTuition:
          application.currentAssessment.offering.actualTuitionCosts,
        applicationOfferingProgramRelatedCosts:
          application.currentAssessment.offering.programRelatedCosts,
        applicationOfferingMandatoryFess:
          application.currentAssessment.offering.mandatoryFees,
        applicationOfferingExceptionalExpenses:
          application.currentAssessment.offering.exceptionalExpenses,
      });
  });

  it("Should return Not Found (404) when scholastic standing is not found.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Mock user service to return the saved student.
    await mockUserLoginInfo(appModule, student);
    const scholasticStandingId = 999999;
    const endpoint = `/students/scholastic-standing/${scholasticStandingId}`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Scholastic Standing not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });
});
