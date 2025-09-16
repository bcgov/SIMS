import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createFakeEducationProgram,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeEducationProgramOffering,
  createFakeInstitutionLocation,
  createFakeUser,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  ApplicationData,
  ApplicationStatus,
  InstitutionLocation,
  ProgramInfoStatus,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { getUserFullName } from "../../../../utilities";

describe("ProgramInfoRequestInstitutionsController(e2e)-getProgramInfoRequest", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeFLocation: InstitutionLocation;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    // College F.
    const { institution: collegeF } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation({
      institution: collegeF,
    });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
  });

  it(
    "Should get PIR as required, returning program, and offering information provided by the student " +
      "when no program or offering was selected during the application submission.",
    async () => {
      // Arrange
      // Dynamic data used to retrieve PIR information when no program or offering was provided.
      const applicationData = {
        workflowName: "workflowName",
        programName: "Test Program",
        studystartDate: getISODateOnlyString(addDays(-30)),
        studyendDate: getISODateOnlyString(addDays(30)),
        courseDetails: [
          {
            courseName: "Test Course",
            courseCode: "TC101",
            courseStartDate: getISODateOnlyString(addDays(-29)),
            courseEndDate: getISODateOnlyString(addDays(29)),
          },
        ],
      } as ApplicationData;
      // Application with PIR required.
      const applicationRequiredPIR = await saveFakeApplication(
        db.dataSource,
        {
          institutionLocation: collegeFLocation,
        },
        {
          pirStatus: ProgramInfoStatus.required,
          applicationStatus: ApplicationStatus.InProgress,
          applicationData,
        },
      );
      // Institution token.
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );
      const endpoint = `/institutions/location/${collegeFLocation.id}/program-info-request/application/${applicationRequiredPIR.id}`;

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          institutionLocationName: collegeFLocation.name,
          applicationNumber: applicationRequiredPIR.applicationNumber,
          applicationSubmittedDate:
            applicationRequiredPIR.submittedDate.toISOString(),
          studentFullName: getUserFullName(applicationRequiredPIR.student.user),
          pirStatus: ProgramInfoStatus.required,
          studentCustomProgram: applicationData.programName,
          studentStudyStartDate: applicationData.studystartDate,
          studentStudyEndDate: applicationData.studyendDate,
          courseDetails: applicationData.courseDetails,
          otherReasonDesc: null,
          offeringIntensitySelectedByStudent:
            applicationRequiredPIR.offeringIntensity,
          programYearId: applicationRequiredPIR.programYear.id,
          isActiveProgramYear: true,
        });
    },
  );

  it(
    "Should get PIR as required, returning the existing program and offering information provided by the student " +
      "when a program was selected and an offering was not selected during the application submission.",
    async () => {
      // Arrange
      // Dynamic data used to retrieve PIR information when no offering was provided.
      const applicationData = {
        workflowName: "workflowName",
        studystartDate: getISODateOnlyString(addDays(-30)),
        studyendDate: getISODateOnlyString(addDays(30)),
      } as ApplicationData;
      // User to be the audit user for the program submission.
      const user = await db.user.save(createFakeUser());
      const pirProgram = await db.educationProgram.save(
        createFakeEducationProgram({ user }),
      );
      // Application with PIR required.
      const applicationRequiredPIR = await saveFakeApplication(
        db.dataSource,
        {
          institutionLocation: collegeFLocation,
          pirProgram: pirProgram,
        },
        {
          pirStatus: ProgramInfoStatus.required,
          applicationStatus: ApplicationStatus.InProgress,
          applicationData,
        },
      );
      // Institution token.
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );
      const endpoint = `/institutions/location/${collegeFLocation.id}/program-info-request/application/${applicationRequiredPIR.id}`;

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          institutionLocationName: collegeFLocation.name,
          applicationNumber: applicationRequiredPIR.applicationNumber,
          applicationSubmittedDate:
            applicationRequiredPIR.submittedDate.toISOString(),
          studentFullName: getUserFullName(applicationRequiredPIR.student.user),
          pirStatus: ProgramInfoStatus.required,
          studentSelectedProgram: pirProgram.name,
          studentSelectedProgramDescription: pirProgram.description,
          studentStudyStartDate: applicationData.studystartDate,
          studentStudyEndDate: applicationData.studyendDate,
          otherReasonDesc: null,
          offeringIntensitySelectedByStudent:
            applicationRequiredPIR.offeringIntensity,
          programYearId: applicationRequiredPIR.programYear.id,
          isActiveProgramYear: true,
          selectedProgram: pirProgram.id,
          isActiveProgram: true,
          isExpiredProgram: false,
        });
    },
  );

  it("Should get a completed PIR, including previous approval information, when a PIR was auto-approved based on a previously approved PIR.", async () => {
    // Arrange
    const pirAssessedDate = addDays(-1);
    // Student to be shared between applications.
    const student = await saveFakeStudent(db.dataSource);
    // User to be the audit user for the offerings.
    const savedUser = await db.user.save(createFakeUser());
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });
    const pirOffering = await db.educationProgramOffering.save(fakeOffering);
    const pirProgram = pirOffering.educationProgram;
    const previousApprovedPIR = await saveFakeApplication(
      db.dataSource,
      {
        student,
        institutionLocation: collegeFLocation,
        pirProgram,
      },
      {
        initialValues: {
          pirAssessedDate,
        },
        offeringIntensity: pirOffering.offeringIntensity,
        pirStatus: ProgramInfoStatus.completed,
        applicationStatus: ApplicationStatus.Assessment,
      },
    );
    const autoCompletedPIR = await saveFakeApplication(
      db.dataSource,
      {
        student,
        institutionLocation: collegeFLocation,
        pirProgram,
        pirApprovalReference: previousApprovedPIR,
      },
      {
        pirStatus: ProgramInfoStatus.completed,
        applicationStatus: ApplicationStatus.Completed,
        offeringIntensity: pirOffering.offeringIntensity,
      },
    );
    autoCompletedPIR.currentAssessment.offering = pirOffering;
    await db.studentAssessment.save(autoCompletedPIR.currentAssessment);
    // Institution token.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/location/${collegeFLocation.id}/program-info-request/application/${autoCompletedPIR.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        institutionLocationName: collegeFLocation.name,
        applicationNumber: autoCompletedPIR.applicationNumber,
        applicationSubmittedDate: autoCompletedPIR.submittedDate.toISOString(),
        studentFullName: getUserFullName(student.user),
        pirStatus: ProgramInfoStatus.completed,
        pirApprovalReferenceAssessedDate: pirAssessedDate.toISOString(),
        otherReasonDesc: null,
        offeringIntensitySelectedByStudent: pirOffering.offeringIntensity,
        programYearId: autoCompletedPIR.programYear.id,
        isActiveProgramYear: true,
        selectedProgram: pirProgram.id,
        studentSelectedProgram: pirProgram.name,
        studentSelectedProgramDescription: pirProgram.description,
        isActiveProgram: true,
        isExpiredProgram: false,
        // Properties expected only when assessment has an offering associated.
        selectedOffering: pirOffering.id,
        offeringName: pirOffering.name,
        offeringType: pirOffering.offeringType,
        offeringIntensity: pirOffering.offeringIntensity,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
