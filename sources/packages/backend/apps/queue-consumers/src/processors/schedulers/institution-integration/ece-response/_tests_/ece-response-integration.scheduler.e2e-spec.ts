import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../../../test/helpers";
import { ECEResponseIntegrationScheduler } from "../ece-response-integration.scheduler";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitution,
  createFakeInstitutionLocation,
  formatDate,
  mockDownloadFiles,
  saveFakeApplicationDisbursements,
} from "@sims/test-utils";
import * as Client from "ssh2-sftp-client";
import { Job } from "bull";
import * as path from "path";
import { ECE_RESPONSE_FILE_NAME } from "@sims/integrations/constants";
import { ProcessSummaryResult } from "@sims/integrations/models";
import {
  ApplicationStatus,
  Institution,
  InstitutionLocation,
} from "@sims/sims-db";

describe(
  describeProcessorRootTest(QueueNames.ECEProcessResponseIntegration),
  () => {
    let app: INestApplication;
    let processor: ECEResponseIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;
    let eceResponseMockDownloadFolder: string;
    let locationCONF: InstitutionLocation;
    let locationDECL: InstitutionLocation;
    let locationSKIP: InstitutionLocation;
    let locationFAIL: InstitutionLocation;

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
      const {
        institutionLocationCONF,
        institutionLocationDECL,
        institutionLocationSKIP,
        institutionLocationFAIL,
      } = await createInstitutionLocations(db);
      locationCONF = institutionLocationCONF;
      locationDECL = institutionLocationDECL;
      locationSKIP = institutionLocationSKIP;
      locationFAIL = institutionLocationFAIL;
    });

    beforeEach(async () => {
      // Set has integration to false to all institution location.
      // Enable the flag during test for given location.
      await db.institutionLocation.update(
        { hasIntegration: true },
        { hasIntegration: false },
      );
    });

    it("Should process an ECE response file and confirm the enrolment when the disbursement and application is valid.", async () => {
      // Arrange
      // Enable integration for institution location
      // used for test.
      await enableIntegration(locationCONF, db);
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        locationCONF.institutionCode,
        ECE_RESPONSE_FILE_NAME,
      );

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
        "Total disbursements found: 2",
        "Disbursements successfully updated: 1",
        "Disbursements skipped to be processed: 1",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 0",
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
      ];
      expectedResult.warnings = [
        "Disbursement 1119353191, record skipped due to reason: Enrolment not found.",
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
    });

    it("Should process an ECE response file and decline the enrolment when the disbursement and application is valid.", async () => {
      // Arrange
      // Enable integration for institution location
      // used for test.
      await enableIntegration(locationDECL, db);
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        locationDECL.institutionCode,
        ECE_RESPONSE_FILE_NAME,
      );

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
        "Total disbursements found: 2",
        "Disbursements successfully updated: 1",
        "Disbursements skipped to be processed: 1",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 0",
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
      ];
      expectedResult.warnings = [
        "Disbursement 1119353191, record skipped due to reason: Enrolment not found.",
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
    });

    it("Should skip the ECE disbursement when the enrolment is already completed.", async () => {
      // Arrange
      // Enable integration for institution location
      // used for test.
      await enableIntegration(locationSKIP, db);
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        locationSKIP.institutionCode,
        ECE_RESPONSE_FILE_NAME,
      );

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

    it("Should skip the ECE disbursement when disbursement does not belong to the system.", async () => {
      // Arrange
      // Enable integration for institution location
      // used for test.
      await enableIntegration(locationSKIP, db);
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        locationSKIP.institutionCode,
        ECE_RESPONSE_FILE_NAME,
      );

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

    it("Should skip the ECE disbursement when application does not belong to the system.", async () => {
      // Arrange
      // Enable integration for institution location
      // used for test.
      await enableIntegration(locationSKIP, db);
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        locationSKIP.institutionCode,
        ECE_RESPONSE_FILE_NAME,
      );

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
      // Enable integration for institution location
      // used for test.
      await enableIntegration(locationFAIL, db);
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        locationFAIL.institutionCode,
        ECE_RESPONSE_FILE_NAME,
      );

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
      // Enable integration for institution location
      // used for test.
      await enableIntegration(locationFAIL, db);
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        locationFAIL.institutionCode,
        ECE_RESPONSE_FILE_NAME,
      );

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
        "Invalid record type on detail: 3 at line 2.",
        `Error processing the file ${confirmEnrolmentResponseFile}. Error: The file consists invalid data and cannot be processed.`,
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
    });

    it("Should stop processing the ECE response file when the footer record is not valid.", async () => {
      // Arrange
      // Enable integration for institution location
      // used for test.
      await enableIntegration(locationFAIL, db);
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        locationFAIL.institutionCode,
        ECE_RESPONSE_FILE_NAME,
      );

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
      // Enable integration for institution location
      // used for test.
      await enableIntegration(locationFAIL, db);
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        locationFAIL.institutionCode,
        ECE_RESPONSE_FILE_NAME,
      );

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
      // Enable integration for institution location
      // used for test.
      await enableIntegration(locationSKIP, db);
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        locationSKIP.institutionCode,
        ECE_RESPONSE_FILE_NAME,
      );

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
        "Invalid unique index number for the disbursement record, Invalid application number at line 2.",
        `Error processing the file ${confirmEnrolmentResponseFile}. Error: The file consists invalid data and cannot be processed.`,
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
    });
  },
);

/**
 * Create institution locations to be used for testing.
 * @param e2eDataSources e2e data sources.
 * @returns institution locations.
 */
async function createInstitutionLocations(
  e2eDataSources: E2EDataSources,
): Promise<{
  institutionLocationCONF: InstitutionLocation;
  institutionLocationDECL: InstitutionLocation;
  institutionLocationSKIP: InstitutionLocation;
  institutionLocationFAIL: InstitutionLocation;
}> {
  const institution = await e2eDataSources.institution.save(
    createFakeInstitution(),
  );
  const institutionLocationCONF = await findOrCreateInstitutionLocation(
    institution,
    "CONF",
    e2eDataSources,
  );
  const institutionLocationDECL = await findOrCreateInstitutionLocation(
    institution,
    "DECL",
    e2eDataSources,
  );

  const institutionLocationSKIP = await findOrCreateInstitutionLocation(
    institution,
    "SKIP",
    e2eDataSources,
  );

  const institutionLocationFAIL = await findOrCreateInstitutionLocation(
    institution,
    "FAIL",
    e2eDataSources,
  );

  return {
    institutionLocationCONF,
    institutionLocationDECL,
    institutionLocationSKIP,
    institutionLocationFAIL,
  };
}

/**
 * Look for an existing institution location by institution code
 * if not found create one.
 * @param institution institution.
 * @param institutionCode institution code.
 * @param e2eDataSources e2e data sources.
 * @returns institution location.
 */
async function findOrCreateInstitutionLocation(
  institution: Institution,
  institutionCode: string,
  e2eDataSources: E2EDataSources,
): Promise<InstitutionLocation> {
  let institutionLocation = await e2eDataSources.institutionLocation.findOne({
    select: { id: true, institutionCode: true },
    where: { institutionCode },
  });
  if (!institutionLocation) {
    institutionLocation = await e2eDataSources.institutionLocation.save(
      createFakeInstitutionLocation(institution, { institutionCode }),
    );
  }
  return institutionLocation;
}

/**
 * Enable integration for the given institution location.
 * @param institutionLocation institution location.
 * @param e2eDataSources e2e data sources.
 */
async function enableIntegration(
  institutionLocation: InstitutionLocation,
  e2eDataSources: E2EDataSources,
): Promise<void> {
  await e2eDataSources.institutionLocation.update(
    {
      id: institutionLocation.id,
    },
    { hasIntegration: true },
  );
}
