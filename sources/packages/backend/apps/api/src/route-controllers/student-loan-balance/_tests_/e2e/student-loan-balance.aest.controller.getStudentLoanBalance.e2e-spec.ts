import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { MAXIMUM_ESSENTIAL_LOAN_BALANCE_RECORDS } from "../../../../utilities";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeStudent,
  createFakeStudentBalances,
} from "@sims/test-utils";

describe("StudentLoanBalanceAESTController(e2e)-getStudentLoanBalance", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it(
    "Should get all the student loan balance records" +
      ` when a student has less than ${MAXIMUM_ESSENTIAL_LOAN_BALANCE_RECORDS} loan balance records.`,
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      // Create loan balance records less than maximum essential records in recent for the student.
      const studentBalanceRecords = createFakeStudentBalances(
        student.id,
        MAXIMUM_ESSENTIAL_LOAN_BALANCE_RECORDS - 1,
        { cslBalance: 100 },
      );
      await db.studentLoanBalance.save(studentBalanceRecords);
      const endpoint = `/aest/student-loan-balance/student/${student.id}`;
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect((response) => {
          // Expected loan balance records.
          const expectedStudentBalanceRecords = studentBalanceRecords.map(
            (record) => ({
              cslBalance: record.cslBalance,
              balanceDate: record.balanceDate,
            }),
          );
          expect(response.body.loanBalanceDetails).toStrictEqual(
            expectedStudentBalanceRecords,
          );
        });
    },
  );

  it(
    `Should get the student loan balance up to recent ${MAXIMUM_ESSENTIAL_LOAN_BALANCE_RECORDS}` +
      ` records when a student has more than ${MAXIMUM_ESSENTIAL_LOAN_BALANCE_RECORDS} loan balance records.`,
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      // Create loan balance records more than maximum essential records in recent for the student.
      const studentBalanceRecords = createFakeStudentBalances(
        student.id,
        MAXIMUM_ESSENTIAL_LOAN_BALANCE_RECORDS + 1,
        { cslBalance: 100 },
      );
      await db.studentLoanBalance.save(studentBalanceRecords);
      // Maximum essential recent loan balance records.
      const essentialStudentLoanBalanceRecords = createFakeStudentBalances(
        student.id,
        MAXIMUM_ESSENTIAL_LOAN_BALANCE_RECORDS,
        { cslBalance: 100 },
      );
      const endpoint = `/aest/student-loan-balance/student/${student.id}`;
      const token = await getAESTToken(AESTGroups.Operations);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect((response) => {
          // Expected loan balance records based on maximum essential count of records.
          const expectedStudentBalanceRecords =
            essentialStudentLoanBalanceRecords.map((record) => ({
              cslBalance: record.cslBalance,
              balanceDate: record.balanceDate,
            }));
          expect(response.body.loanBalanceDetails).toStrictEqual(
            expectedStudentBalanceRecords,
          );
        });
    },
  );

  it("Should throw not found error when the student id is not valid.", async () => {
    // Arrange
    const endpoint = "/aest/student-loan-balance/student/99999";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Student not found.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
