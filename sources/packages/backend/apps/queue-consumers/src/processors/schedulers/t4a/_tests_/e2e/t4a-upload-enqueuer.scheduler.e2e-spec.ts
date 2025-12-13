import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../../test/helpers";
import { T4AUploadEnqueuerScheduler } from "../../t4a-upload-enqueuer.scheduler";
import {
  T4AUploadEnqueuerQueueInDTO,
  T4AUploadQueueInDTO,
} from "@sims/services/queue";
import { DeepMocked } from "@golevelup/ts-jest";
import * as Client from "ssh2-sftp-client";
import { Queue } from "bull";
import { getQueueProviderName } from "@sims/test-utils/mocks";
import MockDate from "mockdate";
import { uuidV4Matcher } from "@sims/test-utils/matchers";

describe(describeProcessorRootTest(QueueNames.T4AUploadEnqueuer), () => {
  let app: INestApplication;
  let processor: T4AUploadEnqueuerScheduler;
  let sftpClientMock: DeepMocked<Client>;
  let t4aUploadQueueMock: Queue<T4AUploadQueueInDTO>;

  beforeAll(async () => {
    process.env.T4A_FOLDER = "T4A_E2E_TEST_FOLDER";
    const { nestApplication, sshClientMock } = await createTestingAppModule();
    app = nestApplication;
    sftpClientMock = sshClientMock;
    // Processor under test.
    processor = app.get(T4AUploadEnqueuerScheduler);
    // Mocked T4AUploadQueue queue.
    t4aUploadQueueMock = app.get(getQueueProviderName(QueueNames.T4AUpload));
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    MockDate.reset();
  });

  it("Should enqueue 3 batches when the batch size is default 100 and there are 2 folders, one with 100 files and the other with 101 files.", async () => {
    // Arrange
    // Queued job.
    const mockedJob = mockBullJob<T4AUploadEnqueuerQueueInDTO>({
      // Ensure the default batch size defined on DB configuration is used.
      maxFileUploadsPerBatch: 100,
    });
    // Mock directories and a file on SFTP where the file must be ignored.
    // Directories must be returned ordered by name.
    sftpClientMock.list.mockResolvedValueOnce([
      { name: "2024-B" },
      { name: "2024-A" },
    ] as Client.FileInfo[]);
    // Mock the files available in the first directory: 2024-A.
    sftpClientMock.list.mockResolvedValueOnce(createSFTPListFilesResult(100));
    // Mock the files available in the second directory: 2024-B.
    sftpClientMock.list.mockResolvedValueOnce(createSFTPListFilesResult(101));
    const now = new Date();
    MockDate.set(now);

    // Act
    const result = await processor.processQueue(mockedJob.job);

    // Assert
    expect(result).toStrictEqual(["T4A files process completed."]);
    expect(t4aUploadQueueMock.addBulk).toHaveBeenCalledTimes(2);
    expect(t4aUploadQueueMock.addBulk).toHaveBeenNthCalledWith(1, [
      createT4AUploadQueueInDTO(now, "2024-A", { numberOfFiles: 100 }),
    ]);
    expect(t4aUploadQueueMock.addBulk).toHaveBeenNthCalledWith(2, [
      // Second batch created with 100 files in 2024-B.
      createT4AUploadQueueInDTO(now, "2024-B", { numberOfFiles: 100 }),
      // Third batch created with the remaining 1 file in 2024-B.
      createT4AUploadQueueInDTO(now, "2024-B", {
        numberOfFiles: 1,
        startingIndex: 100,
      }),
    ]);
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Create a T4A file name based on the number of files and the file number.
 * For example, for fileNumber 5, it will return 000000005.pdf
 * @param fileNumber File number to create the name.
 * @returns T4A file name.
 */
function createT4AFileName(fileNumber: number): string {
  return `${fileNumber.toString().padStart(9, "0")}.pdf`;
}

/**
 * Creates a list of SFTP file info objects to be returned by the SFTP mock.
 * @param numberOfFiles Number of files to be created in the result.
 * @returns An array of SFTP FileInfo objects.
 */
function createSFTPListFilesResult(numberOfFiles: number): Client.FileInfo[] {
  return Array.from(
    { length: numberOfFiles },
    (_, i) =>
      ({
        name: createT4AFileName(i),
      }) as Client.FileInfo,
  );
}

/**
 * Creates a T4AUploadQueueInDTO for test validation using jest matchers.
 * @param referenceDate Reference date expected to be the same for all files.
 * @param folderName Folder name where the files are located.
 * @param options Additional options for file creation.
 * - `numberOfFiles` - Number of files to be created.
 * - `startingIndex` - Index to start the file numbering (default: 0).
 * @returns Object for validation.
 */
function createT4AUploadQueueInDTO(
  referenceDate: Date,
  folderName: string,
  options: {
    numberOfFiles: number;
    startingIndex?: number;
  },
): unknown {
  const startingIndex = options.startingIndex ?? 0;
  const files = Array.from({ length: options.numberOfFiles }, (_, i) => ({
    relativeFilePath: `${folderName}\\${createT4AFileName(i + startingIndex)}`,
    uniqueID: uuidV4Matcher,
  }));
  return {
    data: {
      referenceDate,
      files,
    },
  };
}
