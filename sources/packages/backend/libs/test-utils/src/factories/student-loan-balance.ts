import { Student, StudentLoanBalances, User } from "@sims/sims-db";
import { addToDateOnlyString, getISODateOnlyString } from "@sims/utilities";
import * as faker from "faker";

/**
 * Create fake student loan balance.
 * @param relations student loan balance dependencies.
 * - `student` student who has the loan balance.
 * - `auditUser` audit user for student loan balance.
 * @param options student loan balance options.
 * - `initialValues` initial values to be used to create the
 * student loan balance.
 * @returns student loan balance to be persisted.
 */
export function createFakeStudentLoanBalance(
  relations: {
    student: Student;
    auditUser?: User;
  },
  options?: { initialValues: Partial<StudentLoanBalances> },
): StudentLoanBalances {
  const studentLoanBalance = new StudentLoanBalances();
  studentLoanBalance.student = relations.student;
  studentLoanBalance.cslBalance =
    options?.initialValues?.cslBalance ??
    faker.datatype.number({
      min: 500,
      max: 50000,
    });
  studentLoanBalance.balanceDate =
    options?.initialValues?.balanceDate ?? getISODateOnlyString(new Date());
  studentLoanBalance.creator = relations.auditUser;
  return studentLoanBalance;
}

/**
 * Created student loan balance records.
 * @param numberOfRecords number of records to create.
 * @param options options.
 * - `cslBalance` loan balance amount.
 * @returns student loan balance records.
 */
export function createStudentBalanceRecords(
  studentId: number,
  numberOfRecords: number,
  options?: { cslBalance?: number },
): StudentLoanBalances[] {
  [];
  const cslBalance =
    options?.cslBalance ??
    faker.datatype.number({
      min: 100,
      max: 900,
    });
  return Array.from(Array(numberOfRecords).keys()).map((recordIndex) => {
    return createFakeStudentLoanBalance(
      {
        student: { id: studentId } as Student,
      },
      {
        initialValues: {
          cslBalance,
          balanceDate: addToDateOnlyString(
            new Date(),
            (recordIndex + 1) * -1,
            "month",
          ),
        },
      },
    );
  });
}
