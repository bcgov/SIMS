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
} from "@sims/test-utils";
import { createFakeStudentLoanBalance } from "@sims/test-utils/factories/student-loan-balance";
import { addToDateOnlyString } from "@sims/utilities";

describe("StudentLoanBalanceAESTController(e2e)-getStudentLoanBalance", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it(
    "Should get all the student loan balance records," +
      ` when a student has loan balance records less than ${MAXIMUM_ESSENTIAL_LOAN_BALANCE_RECORDS}.`,
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      const studentBalanceRecords = createStudentBalanceRecords(4, 100);
      const studentLoanBalance = studentBalanceRecords.map((record) => {
        return createFakeStudentLoanBalance(
          { student },
          {
            initialValues: {
              cslBalance: record.cslBalance,
              balanceDate: record.balanceDate,
            },
          },
        );
      });
      await db.studentLoanBalance.save(studentLoanBalance);
      const endpoint = `/aest/student-loan-balance/student/${student.id}`;
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body.loanBalanceDetails).toStrictEqual(
            studentBalanceRecords,
          );
        });
    },
  );

  it(
    `Should get the student loan balance up to recent ${MAXIMUM_ESSENTIAL_LOAN_BALANCE_RECORDS}` +
      ` records, when a student has loan balance records more than ${MAXIMUM_ESSENTIAL_LOAN_BALANCE_RECORDS}.`,
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      const studentBalanceRecords = createStudentBalanceRecords(
        MAXIMUM_ESSENTIAL_LOAN_BALANCE_RECORDS + 2,
        100,
      );
      const studentLoanBalance = studentBalanceRecords.map((record) => {
        return createFakeStudentLoanBalance(
          { student },
          {
            initialValues: {
              cslBalance: record.cslBalance,
              balanceDate: record.balanceDate,
            },
          },
        );
      });
      await db.studentLoanBalance.save(studentLoanBalance);
      const expectedStudentBalanceRecords = createStudentBalanceRecords(
        MAXIMUM_ESSENTIAL_LOAN_BALANCE_RECORDS,
        100,
      );
      const endpoint = `/aest/student-loan-balance/student/${student.id}`;
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body.loanBalanceDetails).toStrictEqual(
            expectedStudentBalanceRecords,
          );
        });
    },
  );

  afterAll(async () => {
    await app?.close();
  });

  /**
   * Created student loan balance records.
   * @param numberOfRecords number of records to create.
   * @param cslBalance loan balance amount.
   * @returns student loan balance records.
   */
  function createStudentBalanceRecords(
    numberOfRecords: number,
    cslBalance: number,
  ): { cslBalance: number; balanceDate: string }[] {
    const loanBalanceRecords: { cslBalance: number; balanceDate: string }[] =
      [];
    for (let i = 1; i <= numberOfRecords; i++) {
      loanBalanceRecords.push({
        cslBalance,
        balanceDate: addToDateOnlyString(new Date(), -i, "month"),
      });
    }
    return loanBalanceRecords;
  }
});
