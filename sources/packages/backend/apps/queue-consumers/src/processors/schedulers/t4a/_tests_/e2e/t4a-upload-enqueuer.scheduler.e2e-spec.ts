import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../../test/helpers";
import { T4AUploadEnqueuerScheduler } from "../../../../";
import {
  T4AUploadEnqueuerQueueInDTO,
  T4AUploadQueueInDTO,
} from "@sims/services/queue";
import { DeepMocked } from "@golevelup/ts-jest";
import * as Client from "ssh2-sftp-client";
import { Queue } from "bull";
import { getQueueProviderName } from "@sims/test-utils/mocks";
import MockDate from "mockdate";
import {
  createSFTPListFilesResult,
  createT4AUploadQueueInDTO,
} from "./t4a-upload-enqueuer-utils";
import { join } from "node:path";

const T4A_FOLDER = "T4A_FOLDER";

describe(describeProcessorRootTest(QueueNames.T4AUploadEnqueuer), () => {
  let app: INestApplication;
  let processor: T4AUploadEnqueuerScheduler;
  let sftpClientMock: DeepMocked<Client>;
  let t4aUploadQueueMock: Queue<T4AUploadQueueInDTO>;

  beforeAll(async () => {
    process.env.T4A_FOLDER = T4A_FOLDER;
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

  it("Should enqueue 3 batches when the batch size is 100, and there are 2 folders, one with 100 files and the other with 101 files.", async () => {
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
    const FOLDER_A_FULL_PATH = join(T4A_FOLDER, "2024-A");
    const FOLDER_B_FULL_PATH = join(T4A_FOLDER, "2024-B");

    // Act
    const result = await processor.processQueue(mockedJob.job);

    // Assert
    expect(result).toStrictEqual(["T4A files process completed."]);
    expect(
      mockedJob.containLogMessages([
        "Max file uploads per batch configured as 100.",
        `Found T4A directories: ${FOLDER_A_FULL_PATH},${FOLDER_B_FULL_PATH}.`,
        `Processing T4A files in ${FOLDER_A_FULL_PATH}.`,
        `Found 100 files in ${FOLDER_A_FULL_PATH}`,
        `Processing T4A files in ${FOLDER_B_FULL_PATH}.`,
        `Found 101 files in ${FOLDER_B_FULL_PATH}`,
      ]),
    ).toBe(true);
    expect(t4aUploadQueueMock.addBulk).toHaveBeenCalledTimes(2);
    expect(t4aUploadQueueMock.addBulk).toHaveBeenNthCalledWith(1, [
      // First batch created with 100 files in 2024-A.
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

  it("Should log that no directories were found when no directories were listed from the SFTP.", async () => {
    // Arrange
    // Queued job.
    const mockedJob = mockBullJob<T4AUploadEnqueuerQueueInDTO>({
      // Ensure the default batch size defined on DB configuration is used.
      maxFileUploadsPerBatch: 100,
    });
    sftpClientMock.list.mockResolvedValueOnce([]);

    // Act
    const result = await processor.processQueue(mockedJob.job);

    // Assert
    expect(result).toStrictEqual(["T4A files process completed."]);
    expect(
      mockedJob.containLogMessages(["No T4A directories found to process."]),
    ).toBe(true);
  });

  it("Should not try to add bulk jobs when a directory was found from the SFTP, but no files were found.", async () => {
    // Arrange
    // Queued job.
    const mockedJob = mockBullJob<T4AUploadEnqueuerQueueInDTO>({
      // Ensure the default batch size defined on DB configuration is used.
      maxFileUploadsPerBatch: 100,
    });
    sftpClientMock.list.mockResolvedValueOnce([
      { name: "9999" },
    ] as Client.FileInfo[]);
    // Mock an empty list of files available in the first directory: 9999.
    sftpClientMock.list.mockResolvedValueOnce([]);

    // Act
    const result = await processor.processQueue(mockedJob.job);

    // Assert
    expect(result).toStrictEqual(["T4A files process completed."]);
    expect(
      mockedJob.containLogMessages([
        `No T4A files found in directory ${join(T4A_FOLDER, "9999")}.`,
      ]),
    ).toBe(true);
    expect(t4aUploadQueueMock.addBulk).not.toHaveBeenCalled();
  });

  afterAll(async () => {
    await app?.close();
  });
});
