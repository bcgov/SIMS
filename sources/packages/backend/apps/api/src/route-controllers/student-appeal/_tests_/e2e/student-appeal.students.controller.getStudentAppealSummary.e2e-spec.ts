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
  createFakeStudentAppeal,
  createFakeStudentAppealRequest,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import {
  ProgramYear,
  Student,
  StudentAppeal,
  StudentAppealRequest,
  StudentAppealStatus,
} from "@sims/sims-db";
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
    const studentAppeal = await saveFakeAppealWithAppealRequests(student, [
      { appealStatus: StudentAppealStatus.Approved, assessedDate: new Date() },
    ]);
    const [studentAppealRequest] = studentAppeal.appealRequests;
    // Create a pending student application appeal for the student.
    const studentApplicationAppeal = await saveFakeAppealWithAppealRequests(
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
            appealRequestNames: [
              studentApplicationAppealRequest.submittedFormName,
            ],
            applicationId: application.id,
            applicationNumber: application.applicationNumber,
            assessedDate: null,
          },
          {
            id: studentAppeal.id,
            appealStatus: StudentAppealStatus.Approved,
            appealRequestNames: [studentAppealRequest.submittedFormName],
            assessedDate: studentAppealRequest.assessedDate.toISOString(),
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
      const studentApplicationAppeal = await saveFakeAppealWithAppealRequests(
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
              appealRequestNames: [
                studentApplicationAppealRequest1.submittedFormName,
                studentApplicationAppealRequest2.submittedFormName,
              ],
              applicationId: application.id,
              applicationNumber: application.applicationNumber,
              assessedDate: assessedDate.toISOString(),
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

  async function saveFakeAppealWithAppealRequests(
    student: Student,
    appealRequestValues: Pick<
      StudentAppealRequest,
      "appealStatus" | "assessedDate"
    >[],
    options?: { isApplicationAppeal?: boolean; programYear?: ProgramYear },
  ): Promise<StudentAppeal> {
    const appealRequests = appealRequestValues.map((appealRequestValue) =>
      createFakeStudentAppealRequest(undefined, {
        initialValues: appealRequestValue,
      }),
    );
    const studentAppeal = createFakeStudentAppeal({
      student,
      appealRequests,
    });
    if (options?.isApplicationAppeal) {
      studentAppeal.application = await saveFakeApplication(db.dataSource, {
        student,
        programYear: options?.programYear,
      });
    }
    return db.studentAppeal.save(studentAppeal);
  }

  afterAll(async () => {
    await app?.close();
  });
});
