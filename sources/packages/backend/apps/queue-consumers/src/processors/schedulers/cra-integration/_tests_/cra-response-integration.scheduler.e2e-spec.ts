import { DeepMocked } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeCRAIncomeVerification,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import Client from "ssh2-sftp-client";
import { join } from "node:path";
import { CRAResponseIntegrationScheduler } from "../cra-response-integration.scheduler";
import {
  createFileFromStructuredRecords,
  getStructuredRecords,
  mockDownloadFiles,
  StructuredFile,
} from "@sims/test-utils/mocks";
import { ApplicationStatus, CRAIncomeVerification, User } from "@sims/sims-db";
import MockDate from "mockdate";

const CRA_FILENAME = "CRA_200_PBCSA00000.TXT";
const FILE_INCOME = 50099;

describe(describeProcessorRootTest(QueueNames.CRAResponseIntegration), () => {
  let app: INestApplication;
  let processor: CRAResponseIntegrationScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;
  let craResponseFolder: string;
  let systemUser: User;

  beforeAll(async () => {
    craResponseFolder = join(__dirname, "cra-receive-files");
    process.env.CRA_RESPONSE_FOLDER = craResponseFolder;
    const { nestApplication, dataSource, sshClientMock, systemUsersService } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sftpClientMock = sshClientMock;
    systemUser = systemUsersService.systemUser;
    processor = app.get(CRAResponseIntegrationScheduler);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    MockDate.reset();
  });

  it("Should process SIN response file ignoring non-SIMS records when the file contains responses from requests that were not created by SIMS.", async () => {
    // Arrange.
    const now = new Date();
    MockDate.set(now);
    const student = await saveFakeStudent(db.dataSource);
    const application = await saveFakeApplication(
      db.dataSource,
      { student },
      { applicationStatus: ApplicationStatus.InProgress },
    );

    // Create CRA income verifications for student.
    const studentCRAIncomeVerification = createFakeCRAIncomeVerification({
      application,
      applicationEditStatusUpdatedBy: student.user,
    });
    await db.craIncomeVerification.save([studentCRAIncomeVerification]);
    // Queued job.
    const mockedJob = mockBullJob<void>();
    mockDownloadFiles(sftpClientMock, [CRA_FILENAME]);

    mockDownloadFiles(sftpClientMock, [CRA_FILENAME], (fileContent: string) => {
      const file = getStructuredRecords(fileContent);
      replaceCRAIncomeVerificationId(file, studentCRAIncomeVerification.id);
      return createFileFromStructuredRecords(file);
    });

    // Act
    const processResult = await processor.processQueue(mockedJob.job);

    // Assert
    const downloadedFile = join(process.env.CRA_RESPONSE_FOLDER, CRA_FILENAME);
    expect(processResult).toEqual(["Processed CRA response files."]);
    expect(
      mockedJob.containLogMessages([
        "CRA response files processed: 1",
        `Processing file ${downloadedFile}.`,
        "File contains 2 verifications.",
        "Processed income verification. Total income record line 5. Status record from line 4.",
      ]),
    ).toBe(true);
    // Validated updated data.
    const updatedStudentCRAIncomeVerification = await getUpdatedCRAIncome(
      studentCRAIncomeVerification.id,
    );
    expect(updatedStudentCRAIncomeVerification).toEqual({
      id: studentCRAIncomeVerification.id,
      craReportedIncome: FILE_INCOME,
      fileReceived: CRA_FILENAME,
      matchStatusCode: "01",
      requestStatusCode: "01",
      inactiveCode: "00",
      modifier: systemUser,
      updatedAt: now,
    });
  });

  it("Should process SIN response file with a negative income when the file contains a negative 15000 line negative income.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);
    const student = await saveFakeStudent(db.dataSource);
    const formattedIncome = FILE_INCOME.toString().padStart(9, "0");
    const application = await saveFakeApplication(
      db.dataSource,
      { student },
      { applicationStatus: ApplicationStatus.InProgress },
    );

    // Create CRA income verifications for student.
    const studentCRAIncomeVerification = createFakeCRAIncomeVerification({
      application,
      applicationEditStatusUpdatedBy: student.user,
    });
    await db.craIncomeVerification.save([studentCRAIncomeVerification]);
    // Queued job.
    const mockedJob = mockBullJob<void>();
    mockDownloadFiles(sftpClientMock, [CRA_FILENAME]);

    mockDownloadFiles(sftpClientMock, [CRA_FILENAME], (fileContent: string) => {
      const file = getStructuredRecords(fileContent);
      replaceCRAIncomeVerificationId(file, studentCRAIncomeVerification.id);
      file.records[3] = file.records[3].replace(
        `${formattedIncome} `,
        `${formattedIncome}-`,
      );
      return createFileFromStructuredRecords(file);
    });

    // Act
    const processResult = await processor.processQueue(mockedJob.job);
    // Assert
    const downloadedFile = join(process.env.CRA_RESPONSE_FOLDER, CRA_FILENAME);

    // Assert
    expect(processResult).toEqual(["Processed CRA response files."]);
    expect(
      mockedJob.containLogMessages([
        "CRA response files processed: 1",
        `Processing file ${downloadedFile}.`,
        "File contains 2 verifications.",
        "Processed income verification. Total income record line 5. Status record from line 4.",
      ]),
    ).toBe(true);
    // Validated updated data.
    const updatedStudentCRAIncomeVerification = await getUpdatedCRAIncome(
      studentCRAIncomeVerification.id,
    );
    expect(updatedStudentCRAIncomeVerification).toEqual({
      id: studentCRAIncomeVerification.id,
      craReportedIncome: -FILE_INCOME,
      fileReceived: CRA_FILENAME,
      matchStatusCode: "01",
      requestStatusCode: "01",
      inactiveCode: "00",
      modifier: systemUser,
      updatedAt: now,
    });
  });

  /**
   * Load the updated CRA income verification record to validate the saved values.
   * @param incomeVerificationId income verification ID.
   * @returns partial CRA income to be validated.
   */
  async function getUpdatedCRAIncome(
    incomeVerificationId: number,
  ): Promise<Partial<CRAIncomeVerification>> {
    return db.craIncomeVerification.findOne({
      select: {
        id: true,
        craReportedIncome: true,
        fileReceived: true,
        matchStatusCode: true,
        requestStatusCode: true,
        inactiveCode: true,
        modifier: { id: true },
        updatedAt: true,
      },
      relations: {
        modifier: true,
      },
      where: {
        id: incomeVerificationId,
      },
      loadEagerRelations: false,
    });
  }

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Associate the fake CRA income verification ID to the file to be processed.
 * @param file file to be mocked to be processed.
 * @param craIncomeVerification CRA income verification ID to be associated to the file.
 */
function replaceCRAIncomeVerificationId(
  file: StructuredFile,
  craIncomeVerification: number,
): void {
  file.records[2] = file.records[2].replace(
    "CRA_INCOME_VERIFICATION",
    craIncomeVerification.toString().padStart(9, "0"),
  );
}
