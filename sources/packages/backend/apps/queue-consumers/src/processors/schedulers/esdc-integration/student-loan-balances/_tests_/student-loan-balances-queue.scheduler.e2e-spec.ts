import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames, getISODateOnlyString } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../../test/helpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import { mockDownloadFiles } from "@sims/test-utils/mocks";
import * as Client from "ssh2-sftp-client";
import { Job } from "bull";
import * as path from "path";
import { StudentLoanBalancesScheduler } from "../student-loan-balances-queue.scheduler";
import { StudentLoanBalance } from "@sims/sims-db";

// Student loan balances received file mocks.
const STUDENT_LOAN_BALANCES_FILENAME = "PEDU.PBC.PT.MBAL.20240302.001";

describe(describeProcessorRootTest(QueueNames.StudentLoanBalances), () => {
  let app: INestApplication;
  let processor: StudentLoanBalancesScheduler;
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
    processor = app.get(StudentLoanBalancesScheduler);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it("Should add monthly loan balance record for the student when the student matches SIN, DOB, and last name.", async () => {
    // Arrange
    // Create student if it doesn't exist.
    let student = await db.student.findOne({
      where: {
        birthDate: getISODateOnlyString(new Date("1998-03-24")),
        user: { lastName: "LASTNAME" },
        sinValidation: { sin: "900041310" },
      },
    });
    if (!student) {
      student = await saveFakeStudent(db.dataSource);
      // Update the student to ensure that the student receiving loan balance is the same student as the one created above.
      student.birthDate = getISODateOnlyString(new Date("1998-03-24"));
      student.user.lastName = "LASTNAME";
      student.sinValidation.sin = "900041310";
      await db.student.save(student);
    }
    await db.studentLoanBalances.delete({ studentId: student.id });
    // Queued job.
    const { job } = mockBullJob<void>();
    mockDownloadFiles(sftpClientMock, [STUDENT_LOAN_BALANCES_FILENAME]);
    // Act
    const result = await processor.processStudentLoanBalancesFiles(job);
    // Assert
    expect(result.length).toBe(1);
    expect(result).toContain("Process finalized with success.");
    // Expect the file was deleted from SFTP.
    expect(sftpClientMock.delete).toHaveBeenCalled();
    const studentLoanBalances: StudentLoanBalance[] =
      await db.studentLoanBalances.find({
        where: {
          studentId: student.id,
        },
      });
    // Expect student loan balance contains the student record.
    expect(studentLoanBalances.length).toBe(1);
    expect(studentLoanBalances).toStrictEqual([
      {
        balanceDate: "2023-12-31",
        cslBalance: 148154.0,
      },
    ]);
  });

  it("Should not add monthly loan balance record if the student is not found.", async () => {
    // Arrange
    // Queued job.
    const job = createMock<Job<void>>();
    mockDownloadFiles(sftpClientMock, [STUDENT_LOAN_BALANCES_FILENAME]);
    // Act
    const result = await processor.processStudentLoanBalancesFiles(job);
    // Assert
    expect(result.length).toBe(3);
    expect(result).toContain(
      "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
    );
    // Expect the file was deleted from SFTP.
    expect(sftpClientMock.delete).toHaveBeenCalled();
    const studentLoanBalancesCount = await db.studentLoanBalances.count({
      where: {
        studentId: 25,
      },
    });
    // Expect student loan balance contains the student record.
    expect(studentLoanBalancesCount).toBe(0);
  });
});
