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

/**
 * Student loan balances received file mocks.
 */
const STUDENT_LOAN_BALANCES_FILENAME = "PEDU.PBC.PT.MBAL.20240302.001";
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
      // Updates all loan balances to a student that will not interfere in any test scenario.
      await db.dataSource.query("TRUNCATE TABLE sims.student_loan_balances");
      await db.user.update(
        { lastName: RESERVED_USER_LAST_NAME },
        { lastName: faker.datatype.uuid() },
      );
    });

    it("Should add monthly loan balance record for the student when the student matches SIN, DOB, and last name.", async () => {
      // Arrange
      // Create user.
      const fakeUser = createFakeUser();
      fakeUser.lastName = RESERVED_USER_LAST_NAME;
      const user = await db.user.save(fakeUser);
      // Student
      const student = await saveFakeStudent(
        db.dataSource,
        { user },
        {
          initialValue: { birthDate: "1998-03-24" },
          sinValidationInitialValue: { sin: "900041310" },
        },
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [STUDENT_LOAN_BALANCES_FILENAME]);
      // Act
      const result = await processor.processStudentLoanBalancesFiles(
        mockedJob.job,
      );
      // Assert
      expect(result.length).toBe(1);
      expect(
        mockedJob.containLogMessages([
          `File contains 1 Student Loan balances.`,
          `Inserted Student Loan balances file ${STUDENT_LOAN_BALANCES_FILENAME}.`,
        ]),
      ).toBe(true);
      expect(result).toContain("Process finalized with success.");
      // Expect the file was deleted from SFTP.
      expect(sftpClientMock.delete).toHaveBeenCalled();
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
          cslBalance: 148154,
        },
      ]);
    });

    it("Should not add monthly loan balance record when the student is not found.", async () => {
      // Arrange
      // Create Student.
      const student = await saveFakeStudent(db.dataSource, undefined, {
        initialValue: { birthDate: "1998-03-24" },
        sinValidationInitialValue: { sin: "900041310" },
      });
      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [STUDENT_LOAN_BALANCES_FILENAME]);
      // Act
      const result = await processor.processStudentLoanBalancesFiles(
        mockedJob.job,
      );
      // Assert
      expect(result.length).toBe(1);
      expect(result).toContain("Process finalized with success.");
      // Expect the file was deleted from SFTP.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      const studentLoanBalancesCount = await db.studentLoanBalance.count({
        where: {
          student: { id: student.id },
        },
      });
      // Expect student loan balance contains the student record.
      expect(studentLoanBalancesCount).toBe(0);
    });

    it("Should add a zero balance record for a student with a positive balance in the previous month when the same student is no longer in the most recently received file.", async () => {
      // Arrange
      const previousBalanceDate = "2023-11-30";
      const currentBalanceDate = "2023-12-31";
      // Student with a random name that will not be present in the file
      // and should have a zero balance record created.
      const student = await saveFakeStudent(db.dataSource, undefined, {
        userInitialValue: { lastName: faker.datatype.uuid() },
      });
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
      const result = await processor.processStudentLoanBalancesFiles(
        mockedJob.job,
      );

      // Assert
      expect(result).toContain("Process finalized with success.");
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
  },
);
