import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { LessThan, MoreThanOrEqual } from "typeorm";
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
  saveFakeAppealWithAppealRequests,
  saveFakeStudent,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import { ProgramYear, StudentAppealStatus } from "@sims/sims-db";
import { PROGRAM_YEAR_2025_26_START_DATE } from "../../../../services/student-appeal/constants";

describe("StudentAppealStudentsController(e2e)-getStudentAppealSummary", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let eligibleProgramYear: ProgramYear;
  let LegacyChangeRequestProgramYear: ProgramYear;
  const endpoint = "/students/appeal";

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    eligibleProgramYear = await db.programYear.findOne({
      where: { startDate: MoreThanOrEqual(PROGRAM_YEAR_2025_26_START_DATE) },
    });
    LegacyChangeRequestProgramYear = await db.programYear.findOne({
      where: { startDate: LessThan(PROGRAM_YEAR_2025_26_START_DATE) },
    });
  });

  beforeEach(async () => {
    await resetMockJWTUserInfo(appModule);
  });

  it(`Should get student appeal summary when the student has one student appeal in status ${StudentAppealStatus.Approved} and one application appeal in status ${StudentAppealStatus.Pending}.`, async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Create an approved student appeal for the student.
    const studentAppeal = await saveFakeAppealWithAppealRequests(db, student, [
      { appealStatus: StudentAppealStatus.Approved, assessedDate: new Date() },
    ]);
    const [studentAppealRequest] = studentAppeal.appealRequests;
    // Create a pending student application appeal for the student.
    const studentApplicationAppeal = await saveFakeAppealWithAppealRequests(
      db,
      student,
      [
        {
          appealStatus: StudentAppealStatus.Pending,
        },
      ],
      { isApplicationAppeal: true, programYear: eligibleProgramYear },
    );
    const [studentApplicationAppealRequest] =
      studentApplicationAppeal.appealRequests;
    const application = studentApplicationAppeal.application;
    // Create a legacy change request appeal that should not be returned in the summary.
    await saveFakeAppealWithAppealRequests(
      db,
      student,
      [
        {
          appealStatus: StudentAppealStatus.Approved,
        },
      ],
      {
        isApplicationAppeal: true,
        programYear: LegacyChangeRequestProgramYear,
      },
    );
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
        appeals: [
          {
            id: studentApplicationAppeal.id,
            appealStatus: StudentAppealStatus.Pending,
            appealRequests: [
              {
                submittedFormName:
                  studentApplicationAppealRequest.submittedFormName,
                appealStatus: StudentAppealStatus.Pending,
              },
            ],
            applicationId: application.id,
            applicationNumber: application.applicationNumber,
            assessedDate: null,
            submittedDate: studentApplicationAppeal.submittedDate.toISOString(),
          },
          {
            id: studentAppeal.id,
            appealStatus: StudentAppealStatus.Approved,
            appealRequests: [
              {
                submittedFormName: studentAppealRequest.submittedFormName,
                appealStatus: StudentAppealStatus.Approved,
              },
            ],
            assessedDate: studentAppealRequest.assessedDate.toISOString(),
            submittedDate: studentAppeal.submittedDate.toISOString(),
          },
        ],
      });
  });

  it(
    `Should get student appeal summary when the student has one application appeal in status ${StudentAppealStatus.Approved} with 2 appeal requests` +
      ` where one appeal request is in ${StudentAppealStatus.Approved} status and the other is in ${StudentAppealStatus.Declined} status.`,
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      const assessedDate = new Date();
      // Create an approved student application appeal for the student
      // with 2 appeal requests.
      const studentApplicationAppeal = await saveFakeAppealWithAppealRequests(
        db,
        student,
        [
          {
            appealStatus: StudentAppealStatus.Approved,
            assessedDate,
          },
          {
            appealStatus: StudentAppealStatus.Declined,
            assessedDate,
          },
        ],
        { isApplicationAppeal: true, programYear: eligibleProgramYear },
      );
      const [
        studentApplicationAppealRequest1,
        studentApplicationAppealRequest2,
      ] = studentApplicationAppeal.appealRequests;
      const application = studentApplicationAppeal.application;
      // Create a legacy change request appeal that should not be returned in the summary.
      await saveFakeAppealWithAppealRequests(
        db,
        student,
        [
          {
            appealStatus: StudentAppealStatus.Approved,
          },
        ],
        { isApplicationAppeal: true },
      );
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
          appeals: [
            {
              id: studentApplicationAppeal.id,
              appealStatus: StudentAppealStatus.Approved,
              appealRequests: [
                {
                  submittedFormName:
                    studentApplicationAppealRequest1.submittedFormName,
                  appealStatus: StudentAppealStatus.Approved,
                },
                {
                  submittedFormName:
                    studentApplicationAppealRequest2.submittedFormName,
                  appealStatus: StudentAppealStatus.Declined,
                },
              ],
              applicationId: application.id,
              applicationNumber: application.applicationNumber,
              assessedDate: assessedDate.toISOString(),
              submittedDate:
                studentApplicationAppeal.submittedDate.toISOString(),
            },
          ],
        });
    },
  );

  it("Should return empty list when the student has no appeals.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
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
        appeals: [],
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
