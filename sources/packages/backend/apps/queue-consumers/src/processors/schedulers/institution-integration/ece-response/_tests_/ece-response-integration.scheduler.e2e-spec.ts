import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  formatDate,
} from "../../../../../../test/helpers";
import { ECEResponseIntegrationScheduler } from "../ece-response-integration.scheduler";
import {
  E2EDataSources,
  createE2EDataSources,
  mockDownloadFiles,
  saveFakeApplicationDisbursements,
} from "@sims/test-utils";
import * as Client from "ssh2-sftp-client";
import { Job } from "bull";
import * as path from "path";

import { InstitutionLocationService } from "@sims/integrations/services";
import { ECE_RESPONSE_FILE_NAME } from "@sims/integrations/constants";
import { ProcessSummaryResult } from "@sims/integrations/models";
import { ApplicationStatus } from "@sims/sims-db";

describe(
  describeProcessorRootTest(QueueNames.ECEProcessResponseIntegration),
  () => {
    let app: INestApplication;
    let processor: ECEResponseIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;
    let eceResponseMockDownloadFolder: string;
    let institutionLocationService: InstitutionLocationService;

    beforeAll(async () => {
      eceResponseMockDownloadFolder = path.join(
        __dirname,
        "ece-response-files",
      );
      // Set the institution response folder to the mock folder.
      process.env.INSTITUTION_RESPONSE_FOLDER = eceResponseMockDownloadFolder;
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      // Processor to be tested.
      processor = app.get(ECEResponseIntegrationScheduler);
      institutionLocationService = app.get(InstitutionLocationService);
    });

    it("Should process an ECE response file and confirm the enrolment when the disbursement and application is valid.", async () => {
      // Arrange
      // Mock institution code to confirm the enrolment.
      const confirmEnrolmentInstitutionCode = "CONF";
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        confirmEnrolmentInstitutionCode,
        ECE_RESPONSE_FILE_NAME,
      );
      // Institution location service mock to return mocked institution code.
      institutionLocationService.getAllIntegrationEnabledInstitutionCodes =
        async () => {
          return [confirmEnrolmentInstitutionCode];
        };

      // Create disbursement to confirm enrolment.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        undefined,
        {
          applicationStatus: ApplicationStatus.Enrolment,
        },
      );

      const [disbursement] =
        application.currentAssessment.disbursementSchedules;

      // Queued job.
      const job = createMock<Job<void>>();

      // Modify the data in mock file to have the correct values for
      // disbursement and application number.
      mockDownloadFiles(
        sftpClientMock,
        [ECE_RESPONSE_FILE_NAME],
        (fileContent: string) => {
          return fileContent
            .replace("DISBNUMBER", disbursement.id.toString().padStart(10, "0"))
            .replace("APPLNUMBER", application.applicationNumber)
            .replace("ENRLDATE", formatDate(new Date(), "YYYYMMDD"));
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);

      // Assert
      const expectedResult: ProcessSummaryResult = new ProcessSummaryResult();
      expectedResult.summary = [
        `Starting download of file ${confirmEnrolmentResponseFile}.`,
        `Disbursement ${disbursement.id}, enrolment confirmed.`,
        "Total disbursements found: 1",
        "Disbursements successfully updated: 1",
        "Disbursements skipped to be processed: 0",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 0",
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
    });

    it("Should process an ECE response file and decline the enrolment when the disbursement and application is valid.", async () => {
      // Arrange
      // Mock institution code to decline the enrolment.
      const confirmEnrolmentInstitutionCode = "DECL";
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        confirmEnrolmentInstitutionCode,
        ECE_RESPONSE_FILE_NAME,
      );
      // Mock the implementation to return the mocked institution code.
      institutionLocationService.getAllIntegrationEnabledInstitutionCodes =
        async () => {
          return [confirmEnrolmentInstitutionCode];
        };

      // Create disbursement to confirm enrolment.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        undefined,
        {
          applicationStatus: ApplicationStatus.Enrolment,
        },
      );

      const [disbursement] =
        application.currentAssessment.disbursementSchedules;

      // Queued job.
      const job = createMock<Job<void>>();

      // Modify the data in mock file to have the correct values for
      // disbursement and application number.
      mockDownloadFiles(
        sftpClientMock,
        [ECE_RESPONSE_FILE_NAME],
        (fileContent: string) => {
          return fileContent
            .replace("DISBNUMBER", disbursement.id.toString().padStart(10, "0"))
            .replace("APPLNUMBER", application.applicationNumber);
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);
      // Assert
      const expectedResult: ProcessSummaryResult = new ProcessSummaryResult();
      expectedResult.summary = [
        `Starting download of file ${confirmEnrolmentResponseFile}.`,
        `Disbursement ${disbursement.id}, enrolment declined.`,
        "Total disbursements found: 1",
        "Disbursements successfully updated: 1",
        "Disbursements skipped to be processed: 0",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 0",
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
    });

    it("Should skip the ECE disbursement when the enrolment is already completed.", async () => {
      // Arrange
      const confirmEnrolmentInstitutionCode = "CONF";
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        confirmEnrolmentInstitutionCode,
        ECE_RESPONSE_FILE_NAME,
      );
      // Mock the implementation to return the mocked institution code.
      institutionLocationService.getAllIntegrationEnabledInstitutionCodes =
        async () => {
          return [confirmEnrolmentInstitutionCode];
        };

      // Create disbursement to confirm enrolment.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        undefined,
        {
          applicationStatus: ApplicationStatus.Completed,
        },
      );

      const [disbursement] =
        application.currentAssessment.disbursementSchedules;

      // Queued job.
      const job = createMock<Job<void>>();

      // Modify the data in mock file to have the correct values for
      // disbursement and application number.
      mockDownloadFiles(
        sftpClientMock,
        [ECE_RESPONSE_FILE_NAME],
        (fileContent: string) => {
          return fileContent
            .replace("DISBNUMBER", disbursement.id.toString().padStart(10, "0"))
            .replace("APPLNUMBER", application.applicationNumber)
            .replace("ENRLDATE", formatDate(new Date(), "YYYYMMDD"));
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);

      // Assert
      const expectedResult: ProcessSummaryResult = new ProcessSummaryResult();
      expectedResult.summary = [
        `Starting download of file ${confirmEnrolmentResponseFile}.`,
        "Total disbursements found: 1",
        "Disbursements successfully updated: 0",
        "Disbursements skipped to be processed: 0",
        "Disbursements considered duplicate and skipped: 1",
        "Disbursements failed to process: 0",
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
      ];
      expectedResult.warnings = [
        `Disbursement ${disbursement.id}, record is considered as duplicate and skipped due to reason: Enrolment already completed and can neither be confirmed nor declined`,
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
    });

    it("Should skip the ECE disbursement when disbursement and disbursement does not belong to the system.", async () => {
      // Arrange
      const confirmEnrolmentInstitutionCode = "CONF";
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        confirmEnrolmentInstitutionCode,
        ECE_RESPONSE_FILE_NAME,
      );
      // Mock the implementation to return the mocked institution code.
      institutionLocationService.getAllIntegrationEnabledInstitutionCodes =
        async () => {
          return [confirmEnrolmentInstitutionCode];
        };

      const fakeDisbursementId = "1111111111";

      // Queued job.
      const job = createMock<Job<void>>();

      // Modify the data in mock file to have fake disbursement id.
      mockDownloadFiles(
        sftpClientMock,
        [ECE_RESPONSE_FILE_NAME],
        (fileContent: string) => {
          return fileContent.replace("DISBNUMBER", fakeDisbursementId);
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);

      // Assert
      const expectedResult: ProcessSummaryResult = new ProcessSummaryResult();
      expectedResult.summary = [
        `Starting download of file ${confirmEnrolmentResponseFile}.`,
        "Total disbursements found: 1",
        "Disbursements successfully updated: 0",
        "Disbursements skipped to be processed: 1",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 0",
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
      ];
      expectedResult.warnings = [
        `Disbursement ${fakeDisbursementId}, record skipped due to reason: Enrolment not found.`,
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
    });

    it("Should skip the ECE disbursement when disbursement and application does not belong to the system.", async () => {
      // Arrange
      const confirmEnrolmentInstitutionCode = "CONF";
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        confirmEnrolmentInstitutionCode,
        ECE_RESPONSE_FILE_NAME,
      );
      // Mock the implementation to return the mocked institution code.
      institutionLocationService.getAllIntegrationEnabledInstitutionCodes =
        async () => {
          return [confirmEnrolmentInstitutionCode];
        };

      // Create disbursement to confirm enrolment.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        undefined,
        {
          applicationStatus: ApplicationStatus.Completed,
        },
      );

      const [disbursement] =
        application.currentAssessment.disbursementSchedules;

      const fakeApplicationNumber = "AAAAAAAAAA";

      // Queued job.
      const job = createMock<Job<void>>();

      // Modify the data in mock file to have the correct disbursement
      // and fake application number.
      mockDownloadFiles(
        sftpClientMock,
        [ECE_RESPONSE_FILE_NAME],
        (fileContent: string) => {
          return fileContent
            .replace("DISBNUMBER", disbursement.id.toString().padStart(10, "0"))
            .replace("APPLNUMBER", fakeApplicationNumber);
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);

      // Assert
      const expectedResult: ProcessSummaryResult = new ProcessSummaryResult();
      expectedResult.summary = [
        `Starting download of file ${confirmEnrolmentResponseFile}.`,
        "Total disbursements found: 1",
        "Disbursements successfully updated: 0",
        "Disbursements skipped to be processed: 1",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 0",
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
      ];
      expectedResult.warnings = [
        `Disbursement ${disbursement.id}, record skipped due to reason: Enrolment for the given application not found.`,
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
    });

    it("Should stop processing the ECE response file when the header record is not valid.", async () => {
      // Arrange
      const confirmEnrolmentInstitutionCode = "FAIL";
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        confirmEnrolmentInstitutionCode,
        ECE_RESPONSE_FILE_NAME,
      );
      // Mock the implementation to return the mocked institution code.
      institutionLocationService.getAllIntegrationEnabledInstitutionCodes =
        async () => {
          return [confirmEnrolmentInstitutionCode];
        };

      // Queued job.
      const job = createMock<Job<void>>();

      // Modify the data in mock file to have invalid header.
      mockDownloadFiles(
        sftpClientMock,
        [ECE_RESPONSE_FILE_NAME],
        (fileContent: string) => {
          return fileContent.replace("1AJAA", "2AJAA");
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);

      // Assert
      const expectedResult: ProcessSummaryResult = new ProcessSummaryResult();
      expectedResult.summary = [
        `Starting download of file ${confirmEnrolmentResponseFile}.`,
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
      ];
      expectedResult.errors = [
        `Error processing the file ${confirmEnrolmentResponseFile}. Error: The ECE response file has an invalid record type on header: 2`,
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
    });

    it("Should stop processing the ECE response file when the detail record is not valid.", async () => {
      // Arrange
      const confirmEnrolmentInstitutionCode = "FAIL";
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        confirmEnrolmentInstitutionCode,
        ECE_RESPONSE_FILE_NAME,
      );
      // Mock the implementation to return the mocked institution code.
      institutionLocationService.getAllIntegrationEnabledInstitutionCodes =
        async () => {
          return [confirmEnrolmentInstitutionCode];
        };

      // Queued job.
      const job = createMock<Job<void>>();

      // Modify the data in mock file to have invalid detail.
      mockDownloadFiles(
        sftpClientMock,
        [ECE_RESPONSE_FILE_NAME],
        (fileContent: string) => {
          return fileContent.replace("2AJBH", "3AJBH");
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);

      // Assert
      const expectedResult: ProcessSummaryResult = new ProcessSummaryResult();
      expectedResult.summary = [
        `Starting download of file ${confirmEnrolmentResponseFile}.`,
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
      ];
      expectedResult.errors = [
        "Invalid record type on detail: 3 at line 1.",
        `Error processing the file ${confirmEnrolmentResponseFile}. Error: The file consists invalid data and cannot be processed.`,
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
    });

    it("Should stop processing the ECE response file when the footer record is not valid.", async () => {
      // Arrange
      const confirmEnrolmentInstitutionCode = "FAIL";
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        confirmEnrolmentInstitutionCode,
        ECE_RESPONSE_FILE_NAME,
      );
      // Mock the implementation to return the mocked institution code.
      institutionLocationService.getAllIntegrationEnabledInstitutionCodes =
        async () => {
          return [confirmEnrolmentInstitutionCode];
        };

      // Queued job.
      const job = createMock<Job<void>>();

      // Modify the data in mock file to have invalid footer.
      mockDownloadFiles(
        sftpClientMock,
        [ECE_RESPONSE_FILE_NAME],
        (fileContent: string) => {
          return fileContent.replace("3000001", "4000001");
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);

      // Assert
      const expectedResult: ProcessSummaryResult = new ProcessSummaryResult();
      expectedResult.summary = [
        `Starting download of file ${confirmEnrolmentResponseFile}.`,
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
      ];
      expectedResult.errors = [
        `Error processing the file ${confirmEnrolmentResponseFile}. Error: The ECE response file has an invalid record type on footer: 4`,
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
    });

    it("Should stop processing the ECE response file when the count of detail in the footer record is incorrect.", async () => {
      // Arrange
      const confirmEnrolmentInstitutionCode = "FAIL";
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        confirmEnrolmentInstitutionCode,
        ECE_RESPONSE_FILE_NAME,
      );
      // Mock the implementation to return the mocked institution code.
      institutionLocationService.getAllIntegrationEnabledInstitutionCodes =
        async () => {
          return [confirmEnrolmentInstitutionCode];
        };

      // Queued job.
      const job = createMock<Job<void>>();

      // Modify the data in mock file to have invalid footer.
      mockDownloadFiles(
        sftpClientMock,
        [ECE_RESPONSE_FILE_NAME],
        (fileContent: string) => {
          return fileContent.replace("3000001", "3000002");
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);

      // Assert
      const expectedResult: ProcessSummaryResult = new ProcessSummaryResult();
      expectedResult.summary = [
        `Starting download of file ${confirmEnrolmentResponseFile}.`,
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
      ];
      expectedResult.errors = [
        `Error processing the file ${confirmEnrolmentResponseFile}. Error: The total count of detail records mentioned in the footer record does not match with the actual total details records count.`,
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
    });

    it("Should stop processing the ECE response file when one of the detail records have invalid data.", async () => {
      // Arrange
      const confirmEnrolmentInstitutionCode = "CONF";
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        confirmEnrolmentInstitutionCode,
        ECE_RESPONSE_FILE_NAME,
      );
      // Mock the implementation to return the mocked institution code.
      institutionLocationService.getAllIntegrationEnabledInstitutionCodes =
        async () => {
          return [confirmEnrolmentInstitutionCode];
        };

      // Queued job.
      const job = createMock<Job<void>>();

      // Modify the data in mock file to have invalid application number.
      // Note: The disbursement id is already an invalid value in file
      // due to the placeholder DISBNUMBER.
      mockDownloadFiles(
        sftpClientMock,
        [ECE_RESPONSE_FILE_NAME],
        (fileContent: string) => {
          return fileContent.replace("APPLNUMBER", "          ");
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);

      // Assert
      const expectedResult: ProcessSummaryResult = new ProcessSummaryResult();
      expectedResult.summary = [
        `Starting download of file ${confirmEnrolmentResponseFile}.`,
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
      ];
      expectedResult.errors = [
        "Invalid unique index number for the disbursement record, Invalid application number at line 1.",
        `Error processing the file ${confirmEnrolmentResponseFile}. Error: The file consists invalid data and cannot be processed.`,
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
    });
  },
);
