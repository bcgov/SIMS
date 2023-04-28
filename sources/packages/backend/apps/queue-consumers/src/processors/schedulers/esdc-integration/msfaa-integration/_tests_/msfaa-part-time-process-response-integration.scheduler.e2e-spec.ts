import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames, getISODateOnlyString } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../../../test/helpers";
import { PartTimeMSFAAProcessResponseIntegrationScheduler } from "../msfaa-part-time-process-response-integration.scheduler";
import {
  E2EDataSources,
  createE2EDataSources,
  createFileFromStructuredRecords,
  getStructuredRecords,
  mockDownloadFiles,
  MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD,
  MSFAA_PART_TIME_RECEIVE_FILE_WITH_INVALID_RECORDS_COUNT,
  MSFAA_PART_TIME_RECEIVE_FILE_WITH_INVALID_SIN_HASH_TOTAL,
} from "@sims/test-utils";
import * as Client from "ssh2-sftp-client";
import { Job } from "bull";
import * as path from "path";
import {
  MSFAA_PART_TIME_MARRIED,
  MSFAA_PART_TIME_OTHER_COUNTRY,
  MSFAA_PART_TIME_RELATIONSHIP_OTHER,
} from "./msfaa-part-time-process-integration.scheduler.models";
import { saveMSFAATestInputsData } from "./msfaa-factory";
import { In, IsNull } from "typeorm";

describe(
  describeProcessorRootTest(QueueNames.PartTimeMSFAAProcessResponseIntegration),
  () => {
    let app: INestApplication;
    let processor: PartTimeMSFAAProcessResponseIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;

    beforeAll(async () => {
      // Set the ESDC response folder to the files mocks folders.
      process.env.ESDC_RESPONSE_FOLDER = path.join(
        __dirname,
        "msfaa-receive-files",
      );
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(PartTimeMSFAAProcessResponseIntegrationScheduler);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      // Force any not signed MSFAA to be signed to ensure that new
      // ones created will be the only ones available to be updated.
      await db.msfaaNumber.update(
        { dateSigned: IsNull() },
        { dateSigned: getISODateOnlyString(new Date()) },
      );
      // Cancel any pending MSFAA.
      await db.msfaaNumber.update(
        { cancelledDate: IsNull() },
        { cancelledDate: getISODateOnlyString(new Date()) },
      );
    });

    it("Should process an MSFAA response with confirmations and a cancellation and update all records when the file is received as expected.", async () => {
      // Arrange
      const msfaaInputData = [
        MSFAA_PART_TIME_MARRIED,
        MSFAA_PART_TIME_OTHER_COUNTRY,
        MSFAA_PART_TIME_RELATIONSHIP_OTHER,
      ];
      const createdMSFAARecords = await saveMSFAATestInputsData(
        db,
        msfaaInputData,
      );

      // Queued job.
      const job = createMock<Job<void>>();

      mockDownloadFiles(sftpClientMock, [
        MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD,
      ]);

      // Act
      const processResult = await processor.processMSFAAResponses(job);

      // Assert
      expect(processResult).toStrictEqual([
        {
          processSummary: [
            "Processing file msfaa-part-time-receive-file-with-cancelation-record.dat.",
            "File contains:",
            "Confirmed MSFAA (type R): 2.",
            "Cancelled MSFAA (type C): 1.",
            "Record from line 1, updated as confirmed.",
            "Record from line 3, updated as confirmed.",
            "Record from line 2, updated as canceled.",
          ],
          errorsSummary: [],
        },
      ]);
      // Assert that the file was deleted from SFTP.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Find the updated MSFAA records previously created.
      const msfaaIDs = createdMSFAARecords.map((msfaa) => msfaa.id);
      const msfaaUpdatedRecords = await db.msfaaNumber.find({
        select: {
          msfaaNumber: true,
          dateSigned: true,
          serviceProviderReceivedDate: true,
          cancelledDate: true,
          newIssuingProvince: true,
        },
        where: {
          id: In(msfaaIDs),
        },
        order: {
          msfaaNumber: "ASC",
        },
      });
      expect(msfaaUpdatedRecords).toHaveLength(msfaaInputData.length);
      const [fistSignedMSFAA, cancelledMSFAA, secondSignedMSFAA] =
        msfaaUpdatedRecords;
      // Validate fist confirmed record.
      expect(fistSignedMSFAA.dateSigned).toBe("2021-11-20");
      expect(fistSignedMSFAA.serviceProviderReceivedDate).toBe("2021-11-21");
      // Validate cancelled record.
      expect(cancelledMSFAA.cancelledDate).toBe("2021-11-24");
      expect(cancelledMSFAA.newIssuingProvince).toBe("ON");
      // Validate second confirmed record.
      expect(secondSignedMSFAA.dateSigned).toBe("2021-11-22");
      expect(secondSignedMSFAA.serviceProviderReceivedDate).toBe("2021-11-23");
    });

    it("Should successfully process 2 MSFAA records when a file has 3 records but one contains an error.", async () => {
      // Arrange
      // Crate only 2 records instead of 3 to force an error while updating the missing record.
      const msfaaInputData = [
        MSFAA_PART_TIME_OTHER_COUNTRY,
        MSFAA_PART_TIME_RELATIONSHIP_OTHER,
      ];
      const createdMSFAARecords = await saveMSFAATestInputsData(
        db,
        msfaaInputData,
      );

      // Queued job.
      const job = createMock<Job<void>>();

      mockDownloadFiles(sftpClientMock, [
        MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD,
      ]);

      // Act
      const processResults = await processor.processMSFAAResponses(job);

      // Assert
      // TODO: Validate the processResults.
      // Assert that the file was deleted from SFTP.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Find the updated MSFAA records previously created.
      const msfaaIDs = createdMSFAARecords.map((msfaa) => msfaa.id);
      const msfaaUpdatedRecords = await db.msfaaNumber.find({
        select: {
          msfaaNumber: true,
          dateSigned: true,
          serviceProviderReceivedDate: true,
          cancelledDate: true,
          newIssuingProvince: true,
        },
        where: {
          id: In(msfaaIDs),
        },
        order: {
          msfaaNumber: "ASC",
        },
      });
      expect(msfaaUpdatedRecords).toHaveLength(msfaaInputData.length);
      const [cancelledMSFAA, secondSignedMSFAA] = msfaaUpdatedRecords;
      // Validate cancelled record.
      expect(cancelledMSFAA.cancelledDate).toBe("2021-11-24");
      expect(cancelledMSFAA.newIssuingProvince).toBe("ON");
      // Validate second confirmed record.
      expect(secondSignedMSFAA.dateSigned).toBe("2021-11-22");
      expect(secondSignedMSFAA.serviceProviderReceivedDate).toBe("2021-11-23");
    });

    it("Should throw an error when the MSFAA file contains a invalid SIN hash total.", async () => {
      // Arrange
      // Queued job.
      const job = createMock<Job<void>>();

      mockDownloadFiles(sftpClientMock, [
        MSFAA_PART_TIME_RECEIVE_FILE_WITH_INVALID_SIN_HASH_TOTAL,
      ]);

      // Act
      const processResult = await processor.processMSFAAResponses(job);

      // Assert
      expect(processResult).toStrictEqual([
        {
          processSummary: [
            "Processing file msfaa-part-time-receive-file-with-invalid-sin-hash-total.dat.",
          ],
          errorsSummary: [
            "Error downloading file msfaa-part-time-receive-file-with-invalid-sin-hash-total.dat. Error: The MSFAA file has TotalSINHash inconsistent with the total sum of sin in the records",
          ],
        },
      ]);
      // Assert that the file was not deleted from SFTP.
      expect(sftpClientMock.delete).not.toHaveBeenCalled();
    });

    it("Should throw an error when the MSFAA file contains a invalid record count.", async () => {
      // Arrange
      // Queued job.
      const job = createMock<Job<void>>();

      mockDownloadFiles(sftpClientMock, [
        MSFAA_PART_TIME_RECEIVE_FILE_WITH_INVALID_RECORDS_COUNT,
      ]);

      // Act
      const processResult = await processor.processMSFAAResponses(job);

      // Assert
      expect(processResult).toStrictEqual([
        {
          processSummary: [
            "Processing file msfaa-part-time-receive-file-with-invalid-records-count.dat.",
          ],
          errorsSummary: [
            "Error downloading file msfaa-part-time-receive-file-with-invalid-records-count.dat. Error: The MSFAA file has invalid number of records",
          ],
        },
      ]);
      // Assert that the file was not deleted from SFTP.
      expect(sftpClientMock.delete).not.toHaveBeenCalled();
    });

    it("Should throw an error when the MSFAA file contains a invalid header code.", async () => {
      // Arrange
      // Queued job.
      const job = createMock<Job<void>>();

      mockDownloadFiles(
        sftpClientMock,
        [MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD],
        (fileContent: string) => {
          // Force the header to be wrong.
          return fileContent.replace("100", "999");
        },
      );

      // Act
      const processResult = await processor.processMSFAAResponses(job);

      // Assert
      expect(processResult).toStrictEqual([
        {
          processSummary: [
            "Processing file msfaa-part-time-receive-file-with-cancelation-record.dat.",
          ],
          errorsSummary: [
            "Error downloading file msfaa-part-time-receive-file-with-cancelation-record.dat. Error: The MSFAA file has an invalid transaction code on header",
          ],
        },
      ]);
      // Assert that the file was not deleted from SFTP.
      expect(sftpClientMock.delete).not.toHaveBeenCalled();
    });

    it("Should throw an error when the MSFAA file contains a invalid footer code.", async () => {
      // Arrange
      // Queued job.
      const job = createMock<Job<void>>();

      mockDownloadFiles(
        sftpClientMock,
        [MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Force the footer to be wrong.
          file.footer = file.footer.replace("999", "001");
          return createFileFromStructuredRecords(file);
        },
      );

      // Act
      const processResult = await processor.processMSFAAResponses(job);

      // Assert
      expect(processResult).toStrictEqual([
        {
          processSummary: [
            "Processing file msfaa-part-time-receive-file-with-cancelation-record.dat.",
          ],
          errorsSummary: [
            "Error downloading file msfaa-part-time-receive-file-with-cancelation-record.dat. Error: The MSFAA file has an invalid transaction code on trailer",
          ],
        },
      ]);
      // Assert that the file was not deleted from SFTP.
      expect(sftpClientMock.delete).not.toHaveBeenCalled();
    });
  },
);
