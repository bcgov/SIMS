import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  getStudentByFakeStudentUserType,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  saveFakeApplicationOfferingRequestChange,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { Student, EducationProgramOffering } from "@sims/sims-db";
import { credentialTypeToDisplay } from "apps/api/src/utilities";

describe("EducationProgramOfferingStudentsController(e2e)-getOfferingSummaryDetails", () => {
  let app: INestApplication;
  let student: Student;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    student = await getStudentByFakeStudentUserType(
      FakeStudentUsersTypes.FakeStudentUserType1,
      dataSource,
    );
  });

  it("Should get the offering simplified details, not including the validations, approvals and extensive data when the provided purpose is application-offering-change.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, { student });
    await saveFakeApplicationOfferingRequestChange(db, {
      application,
    });
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const endpoint = `/students/education-program-offering/offering/${application.currentAssessment.offering.id}/summary-details?purpose=application-offering-change`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        id: application.currentAssessment.offering.id,
        offeringName: application.currentAssessment.offering.name,
        studyStartDate: application.currentAssessment.offering.studyStartDate,
        studyEndDate: application.currentAssessment.offering.studyEndDate,
        actualTuitionCosts:
          application.currentAssessment.offering.actualTuitionCosts,
        programRelatedCosts:
          application.currentAssessment.offering.programRelatedCosts,
        mandatoryFees: application.currentAssessment.offering.mandatoryFees,
        exceptionalExpenses:
          application.currentAssessment.offering.exceptionalExpenses,
        offeringDelivered:
          application.currentAssessment.offering.offeringDelivered,
        lacksStudyBreaks:
          application.currentAssessment.offering.lacksStudyBreaks,
        offeringIntensity:
          application.currentAssessment.offering.offeringIntensity,
        locationName:
          application.currentAssessment.offering.institutionLocation.name,
        programId: application.currentAssessment.offering.educationProgram.id,
        programName:
          application.currentAssessment.offering.educationProgram.name,
        programDescription:
          application.currentAssessment.offering.educationProgram.description,
        programCredential:
          application.currentAssessment.offering.educationProgram
            .credentialType,
        programCredentialTypeToDisplay: credentialTypeToDisplay(
          application.currentAssessment.offering.educationProgram
            .credentialType,
        ),
        programDelivery: deliveryMethod(application.currentAssessment.offering),
      });
  });

  it("Should throw the Not Found (404) exception when the student is not authorized for the provided offering.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    await saveFakeApplicationOfferingRequestChange(db, {
      application,
    });
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const endpoint = `/students/education-program-offering/offering/${application.currentAssessment.offering.id}/summary-details?purpose=application-offering-change`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Not able to find the Education Program offering.",
        error: "Not Found",
      });
  });

  it("Should throw the Not Found (404) exception when the offering summary purpose is not provided.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, { student });
    await saveFakeApplicationOfferingRequestChange(db, {
      application,
    });
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const endpoint = `/students/education-program-offering/offering/${application.currentAssessment.offering.id}/summary-details`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Not able to find the Education Program offering.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });

  const deliveryMethod = (offering: EducationProgramOffering) => {
    if (
      offering.educationProgram.deliveredOnline &&
      offering.educationProgram.deliveredOnSite
    ) {
      return "Blended";
    } else if (offering.educationProgram.deliveredOnSite) {
      return "Onsite";
    }
    return "Online";
  };
});
