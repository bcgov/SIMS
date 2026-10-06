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
import Client from "ssh2-sftp-client";
import { join } from "node:path";
import { ReturnedLoansResponseIntegrationScheduler } from "../returned-loans-response-integration.scheduler";
import { ReturnedLoansResponseRecordType } from "@sims/integrations/esdc-integration/returned-loans-response/models/returned-loans-response.model";

const OTH_RETURNED_LOANS_RESPONSE_FILE = "EDU.PBC.RTG.OTH.D2026222.001";
const PDD_RETURNED_LOANS_RESPONSE_FILE = "EDU.PBC.RTG.PDD.D2026222.001";

describe(
  describeQueueProcessorRootTest(QueueNames.ReturnedLoansResponseIntegration),
  () => {
    let app: INestApplication;
    let processor: ReturnedLoansResponseIntegrationScheduler;
    let sftpClientMock: DeepMocked<Client>;

    beforeAll(async () => {
      // Set the ESDC response folder to the mock folder.
      process.env.ESDC_RESPONSE_FOLDER = join(
        __dirname,
        "returned-loans-response-files",
      );
      const { nestApplication, sshClientMock } = await createTestingAppModule();
      app = nestApplication;
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(ReturnedLoansResponseIntegrationScheduler);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
    });

    it("Should log error and abort the process when the record type of header is invalid for a returned loans response file.", async () => {
      // Arrange
      const headerRecordTypeSearchSuffix = "67890222";
      const headerRecordTypeSearch = `${ReturnedLoansResponseRecordType.Header}${headerRecordTypeSearchSuffix}`;
      const headerRecordTypeReplace = `77${headerRecordTypeSearchSuffix}`;
      mockDownloadFiles(
        sftpClientMock,
        [OTH_RETURNED_LOANS_RESPONSE_FILE],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Set the record type in header to be wrong.
          // Header record type replaced from 00 to 77.
          file.header = file.header.replace(
            headerRecordTypeSearch,
            headerRecordTypeReplace,
          );
          return createFileFromStructuredRecords(file);
        },
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act/Assert
      await expect(processor.processQueue(mockedJob.job)).rejects.toThrow(
        "One or more errors were reported during the process, please see logs for details.",
      );
      const downloadedFile = join(
        process.env.ESDC_RESPONSE_FOLDER,
        OTH_RETURNED_LOANS_RESPONSE_FILE,
      );
      // Check for the log messages.
      expect(
        mockedJob.containLogMessages([
          "Received 1 returned loans response file(s) to process.",
          `The returned loans response file ${downloadedFile} has an invalid record type on header 77.`,
        ]),
      ).toBe(true);
      // Assert that the file is not expected to be archived on SFTP.
      expect(sftpClientMock.rename).not.toHaveBeenCalled();
    });

    it("Should log error and abort the process when the record type of footer is invalid for a returned loans response file.", async () => {
      // Arrange
      const footerRecordTypeSearchSuffix = "00001";
      const footerRecordTypeSearch = `${ReturnedLoansResponseRecordType.Footer}${footerRecordTypeSearchSuffix}`;
      const footerRecordTypeReplace = `88${footerRecordTypeSearchSuffix}`;
      mockDownloadFiles(
        sftpClientMock,
        [OTH_RETURNED_LOANS_RESPONSE_FILE],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Set the record type in header to be wrong.
          file.footer = file.footer.replace(
            footerRecordTypeSearch,
            footerRecordTypeReplace,
          );
          return createFileFromStructuredRecords(file);
        },
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act/Assert
      await expect(processor.processQueue(mockedJob.job)).rejects.toThrow(
        "One or more errors were reported during the process, please see logs for details.",
      );
      const downloadedFile = join(
        process.env.ESDC_RESPONSE_FOLDER,
        OTH_RETURNED_LOANS_RESPONSE_FILE,
      );
      // Check for the log messages.
      expect(
        mockedJob.containLogMessages([
          "Received 1 returned loans response file(s) to process.",
          `The returned loans response file ${downloadedFile} has an invalid record type on footer 88.`,
        ]),
      ).toBe(true);
      // Assert that the file is not expected to be archived on SFTP.
      expect(sftpClientMock.rename).not.toHaveBeenCalled();
    });

    it(
      "Should log error and abort the process when the total record count in footer does not match" +
        " the total detail record count of the file for a returned loans response file.",
      async () => {
        // Arrange
        mockDownloadFiles(
          sftpClientMock,
          [OTH_RETURNED_LOANS_RESPONSE_FILE],
          (fileContent: string) => {
            const file = getStructuredRecords(fileContent);
            // Set the total record count in the footer to be incorrect.
            // Value set to 11 instead of the correct 10.
            file.footer = file.footer.replace("000010", "000011");
            return createFileFromStructuredRecords(file);
          },
        );
        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act/Assert
        await expect(processor.processQueue(mockedJob.job)).rejects.toThrow(
          "One or more errors were reported during the process, please see logs for details.",
        );
        const downloadedFile = join(
          process.env.ESDC_RESPONSE_FOLDER,
          OTH_RETURNED_LOANS_RESPONSE_FILE,
        );
        // Check for the log messages.
        expect(
          mockedJob.containLogMessages([
            "Received 1 returned loans response file(s) to process.",
            `The total number of detail records 11 in the footer does not match the total count of detail records 10 in the returned loans response file ${downloadedFile}.`,
          ]),
        ).toBe(true);
        // Assert that the file is not expected to be archived on SFTP.
        expect(sftpClientMock.rename).not.toHaveBeenCalled();
      },
    );

    it(
      "Should log error for the detail record and continue to process other detail record(s) when the returned loans response file" +
        " has 10 detail records where the detail record at line 3 has invalid record type.",
      async () => {
        // Arrange
        const loanRecordTypeSearchSuffix = "621604933";
        const loanRecordTypeSearch = `${ReturnedLoansResponseRecordType.ReturnedLoanDetail}${loanRecordTypeSearchSuffix}`;
        const loanRecordTypeReplace = `20${loanRecordTypeSearchSuffix}`;
        mockDownloadFiles(
          sftpClientMock,
          [OTH_RETURNED_LOANS_RESPONSE_FILE],
          (fileContent: string) => {
            const file = getStructuredRecords(fileContent);
            // Replacing the record type 200 to 400 to simulate a wrong record type.
            file.records[1] = file.records[1].replace(
              loanRecordTypeSearch,
              loanRecordTypeReplace,
            );
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
          "Received files: 1.",
        ]);
        const downloadedFile = join(
          process.env.ESDC_RESPONSE_FOLDER,
          OTH_RETURNED_LOANS_RESPONSE_FILE,
        );
        // Check for the log messages.
        expect(
          mockedJob.containLogMessages([
            "Received 1 returned loans response file(s) to process.",
            `The downloaded file ${downloadedFile} contains 10 detail records.`,
            "Received address detail record at line 2.",
            "Invalid detail record type 20 at line 3.",
            "Received address detail record at line 4.",
            "Received returned loan detail record with return reason A270 at line 5.",
            `Finished processing records for the returned loans response file ${downloadedFile}.`,
          ]),
        ).toBe(true);
        // Assert that the file is not expected to be archived on SFTP.
        expect(sftpClientMock.rename).not.toHaveBeenCalled();
      },
    );

    it("Should process all the detail record(s) and log the return reason for each returned loan detail record when the OTH returned loans response file is valid.", async () => {
      // Arrange
      mockDownloadFiles(sftpClientMock, [OTH_RETURNED_LOANS_RESPONSE_FILE]);
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      expect(result).toStrictEqual([
        "Process finalized with success.",
        "Received files: 1.",
      ]);
      const downloadedFile = join(
        process.env.ESDC_RESPONSE_FOLDER,
        OTH_RETURNED_LOANS_RESPONSE_FILE,
      );
      // Check for the log messages.
      expect(
        mockedJob.containLogMessages([
          "Received 1 returned loans response file(s) to process.",
          `The downloaded file ${downloadedFile} contains 10 detail records.`,
          "Received address detail record at line 2.",
          "Received returned loan detail record with return reason A270 at line 3.",
          "Received address detail record at line 4.",
          "Received returned loan detail record with return reason A270 at line 5.",
          "Received address detail record at line 6.",
          "Received returned loan detail record with return reason A270 at line 7.",
          "Received address detail record at line 8.",
          "Received returned loan detail record with return reason HRDC at line 9.",
          "Received address detail record at line 10.",
          "Received returned loan detail record with return reason HRDC at line 11.",
          `Finished processing records for the returned loans response file ${downloadedFile}.`,
        ]),
      ).toBe(true);
      // Assert that the file is not expected to be archived on SFTP.
      expect(sftpClientMock.rename).not.toHaveBeenCalled();
    });

    it("Should process all the detail record(s) and log the return reason for each returned loan detail record when the PDD returned loans response file is valid.", async () => {
      // Arrange
      mockDownloadFiles(sftpClientMock, [PDD_RETURNED_LOANS_RESPONSE_FILE]);
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      expect(result).toStrictEqual([
        "Process finalized with success.",
        "Received files: 1.",
      ]);
      const downloadedFile = join(
        process.env.ESDC_RESPONSE_FOLDER,
        PDD_RETURNED_LOANS_RESPONSE_FILE,
      );
      // Check for the log messages.
      expect(
        mockedJob.containLogMessages([
          "Received 1 returned loans response file(s) to process.",
          `The downloaded file ${downloadedFile} contains 10 detail records.`,
          "Received address detail record at line 2.",
          "Received returned loan detail record with return reason DIR at line 3.",
          "Received address detail record at line 4.",
          "Received returned loan detail record with return reason DIR at line 5.",
          "Received address detail record at line 6.",
          "Received returned loan detail record with return reason PD at line 7.",
          "Received address detail record at line 8.",
          "Received returned loan detail record with return reason PD at line 9.",
          "Received address detail record at line 10.",
          "Received returned loan detail record with return reason PD at line 11.",
          `Finished processing records for the returned loans response file ${downloadedFile}.`,
        ]),
      ).toBe(true);
      // Assert that the file is not expected to be archived on SFTP.
      expect(sftpClientMock.rename).not.toHaveBeenCalled();
    });

    afterAll(async () => {
      await app?.close();
    });
  },
);
