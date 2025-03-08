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
import * as Client from "ssh2-sftp-client";
import * as path from "path";
import { CRAResponseIntegrationScheduler } from "../cra-response-integration.scheduler";
import {
  createFileFromStructuredRecords,
  getStructuredRecords,
  mockDownloadFiles,
} from "@sims/test-utils/mocks";
import { ApplicationStatus } from "@sims/sims-db";

const CRA_FILENAME = "CRA_200_PBCSA00000.TXT";

describe(describeProcessorRootTest(QueueNames.CRAResponseIntegration), () => {
  let app: INestApplication;
  let processor: CRAResponseIntegrationScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;
  let craResponseFolder: string;

  beforeAll(async () => {
    craResponseFolder = path.join(__dirname, "cra-receive-files");
    process.env.CRA_RESPONSE_FOLDER = craResponseFolder;
    const { nestApplication, dataSource, sshClientMock } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sftpClientMock = sshClientMock;
    processor = app.get(CRAResponseIntegrationScheduler);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it("Should process SIN response file ignoring non-SIMS records when the file contains responses from requests that were not created by SIMS.", async () => {
    // Arrange.
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
      file.records[2] = file.records[2].replace(
        "CRA_INCOME_VERIFICATION",
        studentCRAIncomeVerification.id.toString().padStart(9, "0"),
      );
      return createFileFromStructuredRecords(file);
    });

    // Act
    const processResult = await processor.processQueue(mockedJob.job);
    // Assert
    const downloadedFile = path.join(
      process.env.CRA_RESPONSE_FOLDER,
      CRA_FILENAME,
    );

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
  });
});
