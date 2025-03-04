import { DeepMocked } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../../test/helpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentLoanBalance,
  createFakeUser,
  saveFakeStudent,
} from "@sims/test-utils";
import { mockDownloadFiles } from "@sims/test-utils/mocks";
import * as Client from "ssh2-sftp-client";
import * as path from "path";
import { StudentLoanBalancesPartTimeIntegrationScheduler } from "../student-loan-balances-part-time-integration.scheduler";
import * as faker from "faker";
import { Student } from "@sims/sims-db";

/**
 * Student loan balances received file mocks.
 */
const STUDENT_LOAN_BALANCES_FILENAME = "PEDU.PBC.PT.MBAL.20240302.001";
const STUDENT_LOAN_BALANCES_STUDENT_NOT_FOUND_FILENAME =
  "PEDU.PBC.PT.MBAL.20240102.001";
const STUDENT_LOAN_BALANCES_RECORDS_MISMATCH_FILENAME =
  "PEDU.PBC.PT.MBAL.20240202.001";
/**
 * Allow the creation of new students reusing the same last name.
 */
const RESERVED_USER_LAST_NAME = "STUDENT_LOAN_BALANCE_LAST_NAME";

describe(
  describeProcessorRootTest(QueueNames.StudentLoanBalancesPartTimeIntegration),
  () => {
    let app: INestApplication;
    let processor: StudentLoanBalancesPartTimeIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;
    let studentLoanBalancesDownloadFolder: string;

    beforeAll(async () => {
      studentLoanBalancesDownloadFolder = path.join(
        __dirname,
        "student-loan-balances-files",
      );
      // Set the ESDC response folder to the files mocks folders.
      process.env.ESDC_RESPONSE_FOLDER = studentLoanBalancesDownloadFolder;
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(StudentLoanBalancesPartTimeIntegrationScheduler);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      // Reset all student balances.
      await db.dataSource.query("TRUNCATE TABLE sims.student_loan_balances");
      // Allow importing the same balances for new students reusing the same
      // last name to match the expected file records.
      await db.user.update(
        { lastName: RESERVED_USER_LAST_NAME },
        { lastName: faker.datatype.uuid() },
      );
    });

    it("Should add monthly loan balance record for the student when the student matches SIN, DOB, and last name.", async () => {
      // Arrange
      // Create user.
      const student = await createStudentWithSpecificLastName("reserved");
      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [STUDENT_LOAN_BALANCES_FILENAME]);
      // Act
      const result = await processor.processQueue(mockedJob.job);
      // Assert
      expect(result.length).toBe(1);
      expect(
        mockedJob.containLogMessages([
          "File contains 1 Student Loan balances.",
          `Inserted Student Loan balances file ${STUDENT_LOAN_BALANCES_FILENAME}.`,
        ]),
      ).toBe(true);
      expect(result).toStrictEqual(["Process finalized with success."]);
      // Expect the file was archived on SFTP.
      expect(sftpClientMock.rename).toHaveBeenCalled();
      const studentLoanBalance = await db.studentLoanBalance.find({
        select: {
          balanceDate: true,
          cslBalance: true,
        },
        where: {
          student: { id: student.id },
        },
      });
      // Expect student loan balance contains the student record.
      expect(studentLoanBalance).toEqual([
        {
          balanceDate: "2023-12-31",
          cslBalance: 1481.54,
        },
      ]);
    });

    it("Should not add monthly loan balance record when the student is not found.", async () => {
      // Arrange
      // Create Student.
      const student = await createStudentWithSpecificLastName("random");
      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [
        STUDENT_LOAN_BALANCES_STUDENT_NOT_FOUND_FILENAME,
      ]);
      // Act
      const result = await processor.processQueue(mockedJob.job);
      // Assert
      expect(result.length).toBe(1);
      expect(result).toStrictEqual(["Process finalized with success."]);
      expect(
        mockedJob.containLogMessages(["Student not found for line 2."]),
      ).toBe(true);
      // Expect the file was archived on SFTP.
      expect(sftpClientMock.rename).toHaveBeenCalled();
      const studentLoanBalancesCount = await db.studentLoanBalance.count({
        where: {
          student: { id: student.id },
        },
      });
      // Expect student loan balance contains the student record.
      expect(studentLoanBalancesCount).toBe(0);
    });

    it("Should throw an error for number of records mismatch when the records in the trailer does not match the number of records.", async () => {
      // Arrange
      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [
        STUDENT_LOAN_BALANCES_RECORDS_MISMATCH_FILENAME,
      ]);

      // Act/Assert
      await expect(processor.processQueue(mockedJob.job)).rejects.toThrowError(
        "One or more errors were reported during the process, please see logs for details.",
      );
      // Assert log has the extra details.
      expect(
        mockedJob.containLogMessage(
          "Records in footer does not match the number of records.",
        ),
      ).toBe(true);
    });

    it("Should add a zero balance record for a student with a positive balance in the previous month when the same student is no longer in the most recently received file.", async () => {
      // Arrange
      const previousBalanceDate = "2023-11-30";
      const currentBalanceDate = "2023-12-31";
      // Student with a random name that will not be present in the file
      // and should have a zero balance record created.
      const student = await createStudentWithSpecificLastName("random");

      // Create an existing balance for the student.
      await db.studentLoanBalance.insert(
        createFakeStudentLoanBalance(
          { student },
          {
            initialValues: {
              balanceDate: previousBalanceDate,
              cslBalance: 1234,
            },
          },
        ),
      );

      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [STUDENT_LOAN_BALANCES_FILENAME]);

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      expect(result).toStrictEqual(["Process finalized with success."]);
      expect(
        mockedJob.containLogMessages([
          "Checking if zero balance records must be inserted.",
          "Amount of zero balance records inserted: 1.",
        ]),
      ).toBe(true);
      const studentLoanBalance = await db.studentLoanBalance.find({
        select: {
          balanceDate: true,
          cslBalance: true,
        },
        where: {
          student: { id: student.id },
          balanceDate: currentBalanceDate,
        },
      });
      // Expect student loan balance to be zero for the newly imported file.
      expect(studentLoanBalance).toEqual([
        {
          balanceDate: currentBalanceDate,
          cslBalance: 0,
        },
      ]);
    });

    it("Should ignore a student with a zero balance in the previous month when a new file is imported and the student is not in the file records.", async () => {
      // Arrange
      const previousBalanceDate = "2023-11-30";
      // Student with a random name that will not be present in the file
      // and should have a zero balance record created.
      const student = await createStudentWithSpecificLastName("random");
      // Create an existing zero balance for the student.
      await db.studentLoanBalance.insert(
        createFakeStudentLoanBalance(
          { student },
          {
            initialValues: {
              balanceDate: previousBalanceDate,
              cslBalance: 0,
            },
          },
        ),
      );

      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [STUDENT_LOAN_BALANCES_FILENAME]);

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      expect(result).toStrictEqual(["Process finalized with success."]);
      expect(
        mockedJob.containLogMessages([
          "Checking if zero balance records must be inserted.",
          "Amount of zero balance records inserted: 0.",
        ]),
      ).toBe(true);
      const studentLoanBalance = await db.studentLoanBalance.find({
        select: {
          balanceDate: true,
          cslBalance: true,
        },
        where: {
          student: { id: student.id },
        },
      });
      // Student with an already zero balance record with a previous balance date will not be inserted with another zero balance entry.
      expect(studentLoanBalance).toEqual([
        {
          balanceDate: previousBalanceDate,
          cslBalance: 0,
        },
      ]);
    });

    it("Should create a new balance when the student has a zero balance record in the previous balance and a new positive balance is received.", async () => {
      // Arrange
      const previousBalanceDate = "2023-11-30";
      const currentBalanceDate = "2023-12-31";
      // Student
      const student = await createStudentWithSpecificLastName("reserved");
      // Create an existing zero balance for the student.
      await db.studentLoanBalance.insert(
        createFakeStudentLoanBalance(
          { student },
          {
            initialValues: {
              balanceDate: previousBalanceDate,
              cslBalance: 0,
            },
          },
        ),
      );

      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [STUDENT_LOAN_BALANCES_FILENAME]);

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      expect(result).toStrictEqual(["Process finalized with success."]);
      expect(
        mockedJob.containLogMessages([
          "Checking if zero balance records must be inserted.",
          "Amount of zero balance records inserted: 0.",
        ]),
      ).toBe(true);
      const studentLoanBalances = await db.studentLoanBalance.find({
        select: {
          balanceDate: true,
          cslBalance: true,
        },
        where: {
          student: { id: student.id },
        },
        order: {
          cslBalance: "ASC",
        },
      });
      // Expect student loan balance to be positive again after it had a zero balance in the previous imported file.
      expect(studentLoanBalances).toEqual([
        {
          balanceDate: previousBalanceDate,
          cslBalance: 0,
        },
        {
          balanceDate: currentBalanceDate,
          cslBalance: 1481.54,
        },
      ]);
    });

    /**
     * Create a user and a student with the required last name.
     * @param lastNameType type of last name.
     * - `random` will create a student with a random generated GUID.
     * - `reserved` will create the student with the name as {@link RESERVED_USER_LAST_NAME}
     * to match with a imported file.
     * @returns student with the specific last name.
     */
    async function createStudentWithSpecificLastName(
      lastNameType: "random" | "reserved",
    ): Promise<Student> {
      const user = createFakeUser();
      user.lastName =
        lastNameType === "reserved"
          ? RESERVED_USER_LAST_NAME
          : faker.datatype.uuid();
      return saveFakeStudent(
        db.dataSource,
        { user },
        {
          initialValue: { birthDate: "1998-03-24" },
          sinValidationInitialValue: { sin: "900041310" },
        },
      );
    }
  },
);
