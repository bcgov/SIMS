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
  describeProcessorRootTest(QueueNames.PartTimeMSFAAProcessResponseIntegration),
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
      // Set the ESDC response folder to the files mocks folders.
      process.env.INSTITUTION_RESPONSE_FOLDER = eceResponseMockDownloadFolder;
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(ECEResponseIntegrationScheduler);
      institutionLocationService = app.get(InstitutionLocationService);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
    });

    it("Should process an ECE response file and confirm the enrolment of given disbursement.", async () => {
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
          applicationStatus: ApplicationStatus.Enrolment,
        },
      );

      const [disbursement] =
        application.currentAssessment.disbursementSchedules;

      // Queued job.
      const job = createMock<Job<void>>();

      mockDownloadFiles(
        sftpClientMock,
        [ECE_RESPONSE_FILE_NAME],
        (fileContent: string) => {
          // Modify the file content to have the correct disbursement id and the application number.
          return fileContent
            .replace("DISBNUMBER", disbursement.id.toString().padStart(10, "0"))
            .replace("APPLNUMBER", application.applicationNumber)
            .replace("ENRLDATE", formatDate(new Date(), "YYYYMMDD"));
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);
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
      // Assert that the file was deleted from SFTP.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      expect(processResult).toStrictEqual([expectedResult]);
    });

    it("Should process an ECE response file and decline the enrolment of given disbursement.", async () => {
      // Arrange
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

      mockDownloadFiles(
        sftpClientMock,
        [ECE_RESPONSE_FILE_NAME],
        (fileContent: string) => {
          // Modify the file content to have the correct disbursement id and the application number.
          return fileContent
            .replace("DISBNUMBER", disbursement.id.toString().padStart(10, "0"))
            .replace("APPLNUMBER", application.applicationNumber);
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);
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
      // Assert that the file was deleted from SFTP.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      expect(processResult).toStrictEqual([expectedResult]);
    });
  },
);
