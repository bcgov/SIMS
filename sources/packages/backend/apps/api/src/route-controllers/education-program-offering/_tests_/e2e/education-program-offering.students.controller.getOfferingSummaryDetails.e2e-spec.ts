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
  createFakeApplication,
  createFakeEducationProgramOffering,
  createFakeStudentAssessment,
  saveFakeApplicationOfferingRequestChange,
  createFakeUser,
  E2EDataSources,
} from "@sims/test-utils";
import {
  Application,
  StudentAssessment,
  Student,
  EducationProgramOffering,
} from "@sims/sims-db";
import { Repository } from "typeorm";

describe("EducationProgramOfferingStudentsController(e2e)-getOfferingSummaryDetails", () => {
  let app: INestApplication;
  let student: Student;
  let db: E2EDataSources;
  let applicationRepo: Repository<Application>;
  let assessmentRepo: Repository<StudentAssessment>;

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

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    applicationRepo = dataSource.getRepository(Application);
    assessmentRepo = dataSource.getRepository(StudentAssessment);
    student = await getStudentByFakeStudentUserType(
      FakeStudentUsersTypes.FakeStudentUserType1,
      dataSource,
    );
  });

  it("Should get the offering simplified details, not including the validations, approvals and extensive data when the provided purpose is application-offering-change.", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });
    const offering = await db.educationProgramOffering.save(fakeOffering);
    const fakeApplication = createFakeApplication({ student });
    const application = await applicationRepo.save(fakeApplication);
    const fakeAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
      application,
      offering,
    });
    fakeApplication.currentAssessment = fakeAssessment;
    await applicationRepo.save(fakeApplication);
    await assessmentRepo.save(fakeAssessment);
    await saveFakeApplicationOfferingRequestChange(db, {
      application,
    });
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const endpoint = `/students/education-program-offering/offering/${fakeOffering.id}/summary-details?purpose=application-offering-change`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        id: offering.id,
        offeringName: offering.name,
        studyStartDate: offering.studyStartDate,
        studyEndDate: offering.studyEndDate,
        actualTuitionCosts: offering.actualTuitionCosts,
        programRelatedCosts: offering.programRelatedCosts,
        mandatoryFees: offering.mandatoryFees,
        exceptionalExpenses: offering.exceptionalExpenses,
        offeringDelivered: offering.offeringDelivered,
        lacksStudyBreaks: offering.lacksStudyBreaks,
        offeringIntensity: offering.offeringIntensity,
        locationName: offering.institutionLocation.name,
        programId: offering.educationProgram.id,
        programName: offering.educationProgram.name,
        programDescription: offering.educationProgram.description,
        programCredential: offering.educationProgram.credentialType,
        programDelivery: deliveryMethod(offering),
      });
  });

  it("Should throw the Not Found (404) exception when the student is not authorized for the provided offering.", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });
    const offering = await db.educationProgramOffering.save(fakeOffering);
    const fakeApplication = createFakeApplication();
    const application = await applicationRepo.save(fakeApplication);
    const fakeAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
      application,
      offering,
    });
    fakeApplication.currentAssessment = fakeAssessment;
    await applicationRepo.save(fakeApplication);
    await assessmentRepo.save(fakeAssessment);
    await saveFakeApplicationOfferingRequestChange(db, {
      application,
    });
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const endpoint = `/students/education-program-offering/offering/${fakeOffering.id}/summary-details?purpose=application-offering-change`;
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
    const savedUser = await db.user.save(createFakeUser());
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });
    const offering = await db.educationProgramOffering.save(fakeOffering);
    const fakeApplication = createFakeApplication({ student });
    const application = await applicationRepo.save(fakeApplication);
    const fakeAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
      application,
      offering,
    });
    fakeApplication.currentAssessment = fakeAssessment;
    await applicationRepo.save(fakeApplication);
    await assessmentRepo.save(fakeAssessment);
    await saveFakeApplicationOfferingRequestChange(db, {
      application,
    });
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const endpoint = `/students/education-program-offering/offering/${fakeOffering.id}/summary-details`;
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
});
