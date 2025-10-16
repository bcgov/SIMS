import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, MoreThanOrEqual } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import {
  Application,
  ApplicationStatus,
  OfferingIntensity,
  ProgramYear,
  Student,
} from "@sims/sims-db";
import { PROGRAM_YEAR_2025_26_START_DATE } from "../../../../services/student-appeal/constants";

describe("StudentAppealStudentsController(e2e)-getEligibleApplicationsForAppeal", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let eligibleProgramYear: ProgramYear;
  const endpoint = "/students/appeal/eligible-applications";

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    appModule = module;
    db = createE2EDataSources(dataSource);
    eligibleProgramYear = await db.programYear.findOne({
      where: { startDate: MoreThanOrEqual(PROGRAM_YEAR_2025_26_START_DATE) },
    });
  });

  beforeEach(async () => {
    await resetMockJWTUserInfo(appModule);
  });

  it("Should get eligible applications for an appeal when it matches all the conditions.", async () => {
    // Arrange
    // Create two applications for the same student to validate
    // the ordering by application number ASC.
    const applicationA = await saveEligibleApplicationForAppeal({
      applicationNumber: "0000000002",
    });
    const student = applicationA.student;
    const applicationB = await saveEligibleApplicationForAppeal({
      applicationNumber: "0000000001",
      student,
    });
    // Create an invalid application to validate that it is not returned.
    await saveEligibleApplicationForAppeal({
      applicationNumber: "0000000003",
      student,
      offeringIntensity: OfferingIntensity.partTime,
    });
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    await mockJWTUserInfo(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        applications: [
          {
            id: applicationB.id,
            applicationNumber: applicationB.applicationNumber,
          },
          {
            id: applicationA.id,
            applicationNumber: applicationA.applicationNumber,
          },
        ],
      });
  });

  it("Should not get any eligible application for appeal when the student does not have a valid SIN.", async () => {
    // Arrange
    const application = await saveEligibleApplicationForAppeal({
      isValidSIN: false,
    });
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    await mockJWTUserInfo(appModule, application.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        applications: [],
      });
  });

  it("Should not get any eligible application for appeal when application is not completed.", async () => {
    // Arrange
    const application = await saveEligibleApplicationForAppeal({
      applicationStatus: ApplicationStatus.InProgress,
    });
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    await mockJWTUserInfo(appModule, application.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        applications: [],
      });
  });

  it("Should not get any eligible application for appeal when application is archived.", async () => {
    // Arrange
    const application = await saveEligibleApplicationForAppeal({
      isArchived: true,
    });
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    await mockJWTUserInfo(appModule, application.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        applications: [],
      });
  });

  /**
   * Saves an eligible application for an appeal, with options
   * to force it to fail eligibility criteria.
   * @param options options to create the application.
   * - `applicationNumber` application number to be assigned.
   * - `applicationStatus` application status to be assigned.
   * - `offeringIntensity` offering intensity to be assigned.
   * - `isValidSIN` if the student should have a valid SIN.
   * - `isArchived` if the application is archived.
   * - `student` student to be associated with the application.
   * @returns the saved application.
   */
  async function saveEligibleApplicationForAppeal(options?: {
    applicationNumber?: string;
    applicationStatus?: ApplicationStatus;
    offeringIntensity?: OfferingIntensity;
    isValidSIN?: boolean;
    isArchived?: boolean;
    student?: Student;
  }): Promise<Application> {
    const student =
      options?.student ??
      (await saveFakeStudent(appDataSource, undefined, {
        sinValidationInitialValue: { isValidSIN: options?.isValidSIN ?? true },
      }));
    return saveFakeApplication(
      db.dataSource,
      {
        student,
        programYear: eligibleProgramYear,
      },
      {
        applicationNumber: options?.applicationNumber,
        applicationStatus:
          options?.applicationStatus ?? ApplicationStatus.Completed,
        offeringIntensity:
          options?.offeringIntensity ?? OfferingIntensity.fullTime,
        isArchived: options?.isArchived ?? false,
      },
    );
  }

  afterAll(async () => {
    await app?.close();
  });
});
