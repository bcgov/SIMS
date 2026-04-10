import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  Application,
  ApplicationStatus,
  OfferingIntensity,
  ProgramInfoStatus,
  Student,
} from "@sims/sims-db";
import { getDateOnlyFormat } from "@sims/utilities";
import { TestingModule } from "@nestjs/testing";

describe("ApplicationStudentsController(e2e)-getApplication", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;
  let student: Student;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    appModule = module;
    student = await saveFakeStudent(db.dataSource);
  });

  beforeEach(async () => {
    await resetMockJWTUserInfo(appModule);
  });

  it("Should throw not found error when application is not found.", async () => {
    const endpoint = `/students/application/99999999`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND);
  });

  it("Should get the student application details when the application status is 'Draft'.", async () => {
    // Arrange
    const application = await saveFakeApplication(
      db.dataSource,
      { student },
      {
        applicationStatus: ApplicationStatus.Draft,
        offeringIntensity: OfferingIntensity.partTime,
        applicationData: {
          programName: "My Program",
          programDescription: "This is my program.",
          workflowName: "",
        },
      },
    );

    await db.application.save(application);
    const endpoint = `/students/application/${application.id}`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    await mockJWTUserInfo(appModule, application.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        id: application.id,
        isArchived: false,
        data: {
          programName: "My Program",
          workflowName: "",
          programDescription: "This is my program.",
        },
        applicationStatus: application.applicationStatus,
        applicationEditStatus: application.applicationEditStatus,
        applicationStatusUpdatedOn:
          application.applicationStatusUpdatedOn.toISOString(),
        applicationNumber: application.applicationNumber,
        applicationOfferingIntensity: application.offeringIntensity,
        applicationPIRStatus: null,
        applicationFormName: "SFAA2022-23",
        applicationProgramYearID: application.programYear.id,
        programYearStartDate: application.programYear.startDate,
        programYearEndDate: application.programYear.endDate,
        submittedDate: null,
        isChangeRequestAllowedForPY: false,
        hasPreviouslyCompletedPIR: false,
      });
  });

  it(
    "Should get the student application details when the application status is 'In-Progress'" +
      " and the PIR has status Required.",
    async () => {
      // Arrange
      const application = await saveFakeApplication(
        db.dataSource,
        { student },
        {
          applicationStatus: ApplicationStatus.InProgress,
          offeringIntensity: OfferingIntensity.partTime,
          applicationData: {
            programName: "My Program",
            programDescription: "This is my program.",
            workflowName: "",
          },
          pirStatus: ProgramInfoStatus.required,
        },
      );

      await db.application.save(application);
      const endpoint = `/students/application/${application.id}`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      await mockJWTUserInfo(appModule, application.student.user);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          id: application.id,
          isArchived: false,
          assessmentId: application.currentAssessment?.id,
          data: {
            programName: "My Program",
            workflowName: "",
            programDescription: "This is my program.",
          },
          applicationStatus: application.applicationStatus,
          applicationEditStatus: application.applicationEditStatus,
          applicationStatusUpdatedOn:
            application.applicationStatusUpdatedOn.toISOString(),
          applicationNumber: application.applicationNumber,
          applicationOfferingIntensity: application.offeringIntensity,
          applicationInstitutionName: application.location.name,
          applicationPIRStatus: application.pirStatus,
          applicationAssessmentStatus: null,
          applicationFormName: "SFAA2022-23",
          applicationProgramYearID: application.programYear.id,
          programYearStartDate: application.programYear.startDate,
          programYearEndDate: application.programYear.endDate,
          submittedDate: application.submittedDate?.toISOString(),
          isChangeRequestAllowedForPY: false,
          hasPreviouslyCompletedPIR: false,
        });
    },
  );

  it(
    "Should get the student application details when the application status is 'Assessment'" +
      " and the PIR has status Completed.",
    async () => {
      // Arrange
      const application = await saveFakeApplication(
        db.dataSource,
        { student },
        {
          applicationStatus: ApplicationStatus.Assessment,
          offeringIntensity: OfferingIntensity.partTime,
          applicationData: {
            programName: "My Program",
            programDescription: "This is my program.",
            workflowName: "",
          },
          pirStatus: ProgramInfoStatus.completed,
        },
      );

      await db.application.save(application);
      const endpoint = `/students/application/${application.id}`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      await mockJWTUserInfo(appModule, application.student.user);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          id: application.id,
          isArchived: false,
          assessmentId: application.currentAssessment?.id,
          data: {
            programName: "My Program",
            workflowName: "",
            programDescription: "This is my program.",
          },
          applicationStatus: application.applicationStatus,
          applicationEditStatus: application.applicationEditStatus,
          applicationStatusUpdatedOn:
            application.applicationStatusUpdatedOn.toISOString(),
          applicationNumber: application.applicationNumber,
          applicationOfferingIntensity: application.offeringIntensity,
          applicationStartDate: getDateOnlyFormat(
            application.currentAssessment?.offering?.studyStartDate,
          ),
          applicationEndDate: getDateOnlyFormat(
            application.currentAssessment?.offering?.studyEndDate,
          ),
          applicationInstitutionName: application.location.name,
          applicationPIRStatus: application.pirStatus,
          applicationAssessmentStatus: null,
          applicationFormName: "SFAA2022-23",
          applicationProgramYearID: application.programYear.id,
          programYearStartDate: application.programYear.startDate,
          programYearEndDate: application.programYear.endDate,
          submittedDate: application.submittedDate?.toISOString(),
          isChangeRequestAllowedForPY: false,
          hasPreviouslyCompletedPIR: true,
        });
    },
  );

  it(
    "Should get the student application details when the application status is 'Assessment'" +
      " and it has a previous version with PIR in 'Completed' status.",
    async () => {
      // Arrange
      // First application with 'Completed' PIR status.
      const firstApplication = await saveFakeApplication(
        db.dataSource,
        { student },
        {
          applicationStatus: ApplicationStatus.Edited,
          offeringIntensity: OfferingIntensity.fullTime,
          applicationData: {
            programName: "My Program",
            programDescription: "This is my program.",
            workflowName: "",
          },
          pirStatus: ProgramInfoStatus.completed,
        },
      );
      // Current application with PIR 'Not Required' status.
      const currentApplication = await saveFakeApplication(
        db.dataSource,
        {
          student,
          parentApplication: { id: firstApplication.id } as Application,
          precedingApplication: { id: firstApplication.id } as Application,
        },
        {
          applicationStatus: ApplicationStatus.Assessment,
          offeringIntensity: OfferingIntensity.partTime,
          applicationNumber: firstApplication.applicationNumber,
          applicationData: {
            workflowName: "",
          },
          pirStatus: ProgramInfoStatus.notRequired,
        },
      );

      const endpoint = `/students/application/${currentApplication.id}`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      await mockJWTUserInfo(appModule, currentApplication.student.user);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          id: currentApplication.id,
          isArchived: false,
          assessmentId: currentApplication.currentAssessment?.id,
          data: {
            workflowName: "",
          },
          applicationStatus: currentApplication.applicationStatus,
          applicationEditStatus: currentApplication.applicationEditStatus,
          applicationStatusUpdatedOn:
            currentApplication.applicationStatusUpdatedOn.toISOString(),
          applicationNumber: currentApplication.applicationNumber,
          applicationOfferingIntensity: currentApplication.offeringIntensity,
          applicationStartDate: getDateOnlyFormat(
            currentApplication.currentAssessment?.offering?.studyStartDate,
          ),
          applicationEndDate: getDateOnlyFormat(
            currentApplication.currentAssessment?.offering?.studyEndDate,
          ),
          applicationInstitutionName: currentApplication.location.name,
          applicationPIRStatus: ProgramInfoStatus.notRequired,
          applicationAssessmentStatus: null,
          applicationFormName: "SFAA2022-23",
          applicationProgramYearID: currentApplication.programYear.id,
          programYearStartDate: currentApplication.programYear.startDate,
          programYearEndDate: currentApplication.programYear.endDate,
          submittedDate: currentApplication.submittedDate?.toISOString(),
          isChangeRequestAllowedForPY: false,
          hasPreviouslyCompletedPIR: true,
        });
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});
