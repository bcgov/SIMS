import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames, getISODateOnlyString } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
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
import { Student } from "@sims/sims-db";
import { StudentLoanBalancesScheduler } from "../student-loan-balances-queue.scheduler";

// Student loan balances received file mocks.
const STUDENT_LOAN_BALANCES_FILENAME = "PEDU.PBC.PT.MBAL.20240302.001";

describe(describeProcessorRootTest(QueueNames.StudentLoanBalances), () => {
  let app: INestApplication;
  let processor: StudentLoanBalancesScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;
  let studentLoanBalancesDownloadFolder: string;
  let sharedStudent: Student;

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
    // Create student if it doesn't exist.
    sharedStudent = await db.student.findOne({
      where: {
        birthDate: getISODateOnlyString(new Date("1998-03-24")),
        user: { lastName: "FOUR" },
        sinValidation: { sin: "900041310" },
      },
    });
    if (!sharedStudent) {
      sharedStudent = await saveFakeStudent(db.dataSource);
      // Update the student to ensure that the student receiving loan balance is the same student as the one created above.
      sharedStudent.birthDate = getISODateOnlyString(new Date("1998-03-24"));
      sharedStudent.user.lastName = "FOUR";
      sharedStudent.sinValidation.sin = "900041310";
      await db.student.save(sharedStudent);
    }
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it("Should add loan balance for the student.;", async () => {
    // Arrange
    // Queued job.
    const job = createMock<Job<void>>();
    mockDownloadFiles(sftpClientMock, [STUDENT_LOAN_BALANCES_FILENAME]);
    // Act
    await processor.processStudentLoanBalancesFiles(job);
    // Assert
    // Expect the file was deleted from SFTP.
    expect(sftpClientMock.delete).toHaveBeenCalled();
    const studentLoanBalancesCount = await db.studentLoanBalances.count({
      where: {
        student: { id: sharedStudent.id },
      },
    });
    // Expect student loan balance contains the student record.
    expect(studentLoanBalancesCount).toBeGreaterThan(0);
  });
});
