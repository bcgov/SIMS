import { E2EDataSources, createE2EDataSources } from "@sims/test-utils";
import {
  createFileFromStructuredRecords,
  getStructuredRecords,
  mockDownloadFiles,
} from "@sims/test-utils/mocks";
import {
  createTestingAppModule,
  describeQueueProcessorRootTest,
  mockBullJob,
} from "../../../../../../test/helpers";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import { DeepMocked } from "@golevelup/ts-jest";
import * as Client from "ssh2-sftp-client";
import * as path from "path";
import { ECertCancellationResponseIntegrationScheduler } from "../ecert-cancellation-response-integration.scheduler";
import { In } from "typeorm";

const PART_TIME_CANCELLATION_RESPONSE_FILE = "EDU.PBC.CAN.ECRT.20250516.001";
const SHARED_DOCUMENT_NUMBERS = [7777, 8888];

describe(
  describeQueueProcessorRootTest(
    QueueNames.ECertCancellationResponseIntegration,
  ),
  () => {
    let app: INestApplication;
    let processor: ECertCancellationResponseIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;

    beforeAll(async () => {
      // Set the ESDC response folder to the mock folder.
      process.env.ESDC_RESPONSE_FOLDER = path.join(
        __dirname,
        "e-cert-cancellation-response-files",
      );
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(ECertCancellationResponseIntegrationScheduler);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      // Ensure the document number used along the tests will be unique to the test scope.
      await db.disbursementSchedule.update(
        { documentNumber: In(SHARED_DOCUMENT_NUMBERS) },
        { documentNumber: null },
      );
    });

    it("Should log warning and abort the process when the record type of header is invalid.", async () => {
      // Arrange
      mockDownloadFiles(
        sftpClientMock,
        [PART_TIME_CANCELLATION_RESPONSE_FILE],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Set the record type in header to be wrong.
          file.header = file.header.replace("100BC", "200BC");
          return createFileFromStructuredRecords(file);
        },
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      expect(result).toStrictEqual([
        "Process finalized with success.",
        "Processed cancellation files: 1.",
        "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
        "Error(s): 0, Warning(s): 1, Info: 6",
      ]);
      const downloadedFile = path.join(
        process.env.ESDC_RESPONSE_FOLDER,
        PART_TIME_CANCELLATION_RESPONSE_FILE,
      );
      // Check for the log messages.
      expect(
        mockedJob.containLogMessages([
          "Found 1 e-cert cancellation response file(s) to process.",
          `The e-cert cancellation response file ${downloadedFile} has an invalid record type on header 200.`,
        ]),
      ).toBe(true);
      // The file is not expected to be archived on SFTP.
      expect(sftpClientMock.rename).not.toHaveBeenCalled();
    });
  },
);
