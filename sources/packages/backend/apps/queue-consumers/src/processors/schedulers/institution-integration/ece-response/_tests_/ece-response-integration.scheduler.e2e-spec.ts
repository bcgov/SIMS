import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import {
  COE_WINDOW,
  QueueNames,
  addDays,
  formatDate,
  getISODateOnlyString,
} from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../../../test/helpers";
import { ECEResponseIntegrationScheduler } from "../ece-response-integration.scheduler";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeDisbursementValue,
  saveFakeApplicationDisbursements,
} from "@sims/test-utils";
import {
  createFileFromStructuredRecords,
  getStructuredRecords,
  mockDownloadFiles,
} from "@sims/test-utils/mocks";
import * as Client from "ssh2-sftp-client";
import { Job } from "bull";
import * as path from "path";
import { ECE_RESPONSE_FILE_NAME } from "@sims/integrations/constants";
import { ProcessSummaryResult } from "@sims/integrations/models";
import {
  ApplicationStatus,
  COEStatus,
  DisbursementScheduleStatus,
  DisbursementValueType,
  InstitutionLocation,
} from "@sims/sims-db";
import {
  createInstitutionLocations,
  enableIntegration,
  getUnsentECEResponseNotifications,
} from "./ece-response-helper";
import { FILE_PARSING_ERROR } from "@sims/services/constants";
import { IsNull } from "typeorm";

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
    // Institution location to test disbursement with multiple detail records.
    let locationMULT: InstitutionLocation;
    let locationVALD: InstitutionLocation;

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
        institutionLocationMULT,
        institutionLocationVALD,
      } = await createInstitutionLocations(db);
      locationCONF = institutionLocationCONF;
      locationDECL = institutionLocationDECL;
      locationSKIP = institutionLocationSKIP;
      locationFAIL = institutionLocationFAIL;
      locationMULT = institutionLocationMULT;
      locationVALD = institutionLocationVALD;
    });

    beforeEach(async () => {
      // Set has integration to false to all institution location.
      // Enable the flag during test for given location.
      await db.institutionLocation.update(
        { hasIntegration: true },
        { hasIntegration: false },
      );

      // Update the date sent to current date to verify newly created notifications
      // with date sent as null.
      await db.notification.update(
        { dateSent: IsNull() },
        { dateSent: new Date() },
      );
    });

    it("Should process an ECE response file and confirm the enrolment and create notification when the disbursement and application is valid.", async () => {
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
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
        "Notification has been created to send email to integration contacts.",
        "Total file parsing errors: 0",
        "Total detail records found: 2",
        "Total disbursements found: 2",
        "Disbursements successfully updated: 1",
        "Disbursements skipped to be processed: 1",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 0",
      ];
      expectedResult.warnings = [
        "Disbursement 1119353191, record skipped due to reason: Enrolment not found.",
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Expect the notifications to be created.
      const notifications = await getUnsentECEResponseNotifications(db);
      // TODO: When bulk send email is implemented, we must always expect 1 notification
      // record to be created.
      expect(notifications).toHaveLength(
        locationCONF.integrationContacts.length,
      );
      const updatedDisbursement = await db.disbursementSchedule.findOne({
        select: { coeStatus: true },
        where: { id: disbursement.id },
      });
      // Expect the COE status of the updated disbursement to be completed.
      expect(updatedDisbursement.coeStatus).toBe(COEStatus.completed);
    });

    it("Should process an ECE response file and confirm the enrolment and create notification when a disbursement has multiple detail records.", async () => {
      // Arrange
      // Enable integration for institution location
      // used for test.
      await enableIntegration(locationMULT, db);
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        locationMULT.institutionCode,
        ECE_RESPONSE_FILE_NAME,
      );

      // Create disbursement to confirm enrolment.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          // Save disbursement with custom award value to validate tuition remittance.
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLF",
              1000,
            ),
          ],
        },
        {
          applicationStatus: ApplicationStatus.Enrolment,
        },
      );

      const [disbursement] =
        application.currentAssessment.disbursementSchedules;

      // Queued job.
      const job = createMock<Job<void>>();

      const disbursementId = disbursement.id.toString().padStart(10, "0");
      const applicationNumber = application.applicationNumber;
      const currentDate = formatDate(new Date(), "YYYYMMDD");

      // Modify the data in mock file to have the correct values for
      // disbursement and application number.
      mockDownloadFiles(
        sftpClientMock,
        [ECE_RESPONSE_FILE_NAME],
        (fileContent: string) => {
          return (
            fileContent
              // Set the disbursement number to expected disbursement in multiple detail records.
              .replace("DISBNUMB01", disbursementId)
              .replace("DISBNUMB02", disbursementId)
              .replace("DISBNUMB03", disbursementId)
              // Set the application number to expected application in multiple detail records.
              .replace("APPLNUMB01", applicationNumber)
              .replace("APPLNUMB02", applicationNumber)
              .replace("APPLNUMB03", applicationNumber)
              // Set the enrolment confirmation to expected date in multiple detail records.
              .replace("ENRLDT01", currentDate)
              .replace("ENRLDT02", currentDate)
              .replace("ENRLDT03", currentDate)
          );
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);

      // Assert
      const expectedResult: ProcessSummaryResult = new ProcessSummaryResult();
      expectedResult.summary = [
        `Starting download of file ${confirmEnrolmentResponseFile}.`,
        `Disbursement ${disbursement.id}, enrolment confirmed.`,
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
        "Notification has been created to send email to integration contacts.",
        "Total file parsing errors: 0",
        "Total detail records found: 4",
        "Total disbursements found: 2",
        "Disbursements successfully updated: 1",
        "Disbursements skipped to be processed: 1",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 0",
      ];
      expectedResult.warnings = [
        "Disbursement 1119353191, record skipped due to reason: Enrolment not found.",
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Expect the notifications to be created.
      const notifications = await getUnsentECEResponseNotifications(db);
      expect(notifications).toHaveLength(
        locationMULT.integrationContacts.length,
      );
      const updatedDisbursement = await db.disbursementSchedule.findOne({
        select: {
          coeStatus: true,
          tuitionRemittanceRequestedAmount: true,
        },
        where: { id: disbursement.id },
      });
      // Expect the COE status of the updated disbursement to be completed.
      expect(updatedDisbursement.coeStatus).toBe(COEStatus.completed);
      // The file has 3 detail records for the disbursement, with pay to school amount of 10 in each record.
      // 2 out of 3 detail records have enrolment confirmation flag as Y.
      // Hence 20 is the expected value.
      expect(updatedDisbursement.tuitionRemittanceRequestedAmount).toBe(20);
    });

    it("Should validate when tuition remittance is greater than the max tuition remittance considering previous tuition remittance.", async () => {
      // Arrange
      // Enable integration for institution location
      // used for test.
      await enableIntegration(locationVALD, db);
      const confirmEnrolmentResponseFile = path.join(
        process.env.INSTITUTION_RESPONSE_FOLDER,
        locationVALD.institutionCode,
        ECE_RESPONSE_FILE_NAME,
      );

      // Create disbursement to confirm enrolment.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          // Save disbursement with custom award value to validate tuition remittance.
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLF",
              1000,
            ),
          ],
          secondDisbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLF",
              1000,
            ),
          ],
        },
        {
          applicationStatus: ApplicationStatus.Completed,
          createSecondDisbursement: true,
          firstDisbursementInitialValues: {
            tuitionRemittanceRequestedAmount: 500,
            tuitionRemittanceEffectiveAmount: 500,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
          secondDisbursementInitialValues: {
            disbursementDate: getISODateOnlyString(new Date()),
          },
        },
      );
      // Adjust offering values for maxTuitionRemittanceAllowed.
      application.currentAssessment.offering.actualTuitionCosts = 500;
      application.currentAssessment.offering.programRelatedCosts = 500;
      application.currentAssessment.offering.mandatoryFees = 100;
      await db.educationProgramOffering.save(
        application.currentAssessment.offering,
      );
      const [_, secondDisbursement] =
        application.currentAssessment.disbursementSchedules;

      // Queued job.
      const job = createMock<Job<void>>();

      const disbursementId = secondDisbursement.id.toString().padStart(10, "0");
      const applicationNumber = application.applicationNumber;
      const currentDate = formatDate(new Date(), "YYYYMMDD");

      // Modify the data in mock file to have the correct values for
      // disbursement and application number.
      mockDownloadFiles(
        sftpClientMock,
        [ECE_RESPONSE_FILE_NAME],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Force the error code to be wrong in the first record.
          const [record] = file.records;
          file.records = [
            record
              .replace("DISBNUMB01", disbursementId)
              .replace("APPLNUMB01", applicationNumber)
              .replace("ENRLDT01", currentDate),
          ];
          return createFileFromStructuredRecords(file);
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);

      // Assert
      const expectedResult: ProcessSummaryResult = new ProcessSummaryResult();
      expectedResult.summary = [
        `Starting download of file ${confirmEnrolmentResponseFile}.`,
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
        "Notification has been created to send email to integration contacts.",
        "Total file parsing errors: 0",
        "Total detail records found: 1",
        "Total disbursements found: 1",
        "Disbursements successfully updated: 0",
        "Disbursements skipped to be processed: 0",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 1",
      ];
      expectedResult.errors = [
        `Disbursement ${secondDisbursement.id}, record failed to process due to reason: Tuition amount provided should be lesser than both (Actual tuition + Program related costs + Mandatory fees - Previous tuition remittance) and (Canada grants + Canada Loan + BC Loan).`,
      ];

      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Expect the notifications to be created.
      const notifications = await getUnsentECEResponseNotifications(db);
      expect(notifications).toHaveLength(
        locationVALD.integrationContacts.length,
      );
    });

    it("Should process an ECE response file and decline the enrolment and create notification when the disbursement and application is valid.", async () => {
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
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
        "Notification has been created to send email to integration contacts.",
        "Total file parsing errors: 0",
        "Total detail records found: 2",
        "Total disbursements found: 2",
        "Disbursements successfully updated: 1",
        "Disbursements skipped to be processed: 1",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 0",
      ];
      expectedResult.warnings = [
        "Disbursement 1119353191, record skipped due to reason: Enrolment not found.",
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Expect the notifications to be created.
      const notifications = await getUnsentECEResponseNotifications(db);
      expect(notifications).toHaveLength(
        locationDECL.integrationContacts.length,
      );
      const updatedDisbursement = await db.disbursementSchedule.findOne({
        select: { coeStatus: true },
        where: { id: disbursement.id },
      });
      // Expect the COE status of the updated disbursement to be declined.
      expect(updatedDisbursement.coeStatus).toBe(COEStatus.declined);
    });

    it("Should skip the ECE disbursement and create notification when the enrolment is already completed.", async () => {
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
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
        "Notification has been created to send email to integration contacts.",
        "Total file parsing errors: 0",
        "Total detail records found: 1",
        "Total disbursements found: 1",
        "Disbursements successfully updated: 0",
        "Disbursements skipped to be processed: 0",
        "Disbursements considered duplicate and skipped: 1",
        "Disbursements failed to process: 0",
      ];
      expectedResult.warnings = [
        `Disbursement ${disbursement.id}, record is considered as duplicate and skipped due to reason: Enrolment already completed and can neither be confirmed nor declined`,
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Expect the notifications to be created.
      const notifications = await getUnsentECEResponseNotifications(db);
      expect(notifications).toHaveLength(
        locationSKIP.integrationContacts.length,
      );
    });

    it("Should skip the ECE disbursement and create notification when disbursement and application does not belong to the system.", async () => {
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
      const fakeApplicationNumber = "9999999999";

      // Queued job.
      const job = createMock<Job<void>>();

      // Modify the data in mock file to have fake disbursement id.
      mockDownloadFiles(
        sftpClientMock,
        [ECE_RESPONSE_FILE_NAME],
        (fileContent: string) => {
          return fileContent
            .replace("DISBNUMBER", fakeDisbursementId)
            .replace("APPLNUMBER", fakeApplicationNumber);
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);

      // Assert
      const expectedResult: ProcessSummaryResult = new ProcessSummaryResult();
      expectedResult.summary = [
        `Starting download of file ${confirmEnrolmentResponseFile}.`,
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
        "Notification has been created to send email to integration contacts.",
        "Total file parsing errors: 0",
        "Total detail records found: 1",
        "Total disbursements found: 1",
        "Disbursements successfully updated: 0",
        "Disbursements skipped to be processed: 1",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 0",
      ];
      expectedResult.warnings = [
        `Disbursement ${fakeDisbursementId}, record skipped due to reason: Enrolment not found.`,
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Expect the notifications to be created.
      const notifications = await getUnsentECEResponseNotifications(db);
      expect(notifications).toHaveLength(
        locationSKIP.integrationContacts.length,
      );
    });

    it("Should skip the ECE disbursement and create notification when application does not belong to the system.", async () => {
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

      const fakeApplicationNumber = "9999999999";

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
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
        "Notification has been created to send email to integration contacts.",
        "Total file parsing errors: 0",
        "Total detail records found: 1",
        "Total disbursements found: 1",
        "Disbursements successfully updated: 0",
        "Disbursements skipped to be processed: 1",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 0",
      ];
      expectedResult.warnings = [
        `Disbursement ${disbursement.id}, record skipped due to reason: Enrolment for the given application not found.`,
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Expect the notifications to be created.
      const notifications = await getUnsentECEResponseNotifications(db);
      expect(notifications).toHaveLength(
        locationSKIP.integrationContacts.length,
      );
    });

    it("Should stop processing the ECE response file and create notification when the header record is not valid.", async () => {
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
        "Notification has been created to send email to integration contacts.",
        "Total file parsing errors: 1",
        "Total detail records found: 0",
        "Total disbursements found: 0",
        "Disbursements successfully updated: 0",
        "Disbursements skipped to be processed: 0",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 0",
      ];
      expectedResult.errors = [
        `Error processing the file ${confirmEnrolmentResponseFile}. ${FILE_PARSING_ERROR}: The ECE response file has an invalid record type on header: 2`,
        "File processing aborted.",
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Expect the notifications to be created.
      const notifications = await getUnsentECEResponseNotifications(db);
      expect(notifications).toHaveLength(
        locationFAIL.integrationContacts.length,
      );
    });

    it("Should stop processing the ECE response file and create notification when the detail record is not valid.", async () => {
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
        "Notification has been created to send email to integration contacts.",
        "Total file parsing errors: 1",
        "Total detail records found: 1",
        "Total disbursements found: 0",
        "Disbursements successfully updated: 0",
        "Disbursements skipped to be processed: 0",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 0",
      ];
      expectedResult.errors = [
        "Invalid record type on detail: 3 at line 2.",
        `Error processing the file ${confirmEnrolmentResponseFile}. Error: The file consists invalid data and cannot be processed.`,
        "File processing aborted.",
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Expect the notifications to be created.
      const notifications = await getUnsentECEResponseNotifications(db);
      expect(notifications).toHaveLength(
        locationFAIL.integrationContacts.length,
      );
    });

    it("Should stop processing the ECE response file and create notification when the footer record is not valid.", async () => {
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
        "Notification has been created to send email to integration contacts.",
        "Total file parsing errors: 1",
        "Total detail records found: 0",
        "Total disbursements found: 0",
        "Disbursements successfully updated: 0",
        "Disbursements skipped to be processed: 0",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 0",
      ];
      expectedResult.errors = [
        `Error processing the file ${confirmEnrolmentResponseFile}. ${FILE_PARSING_ERROR}: The ECE response file has an invalid record type on footer: 4`,
        "File processing aborted.",
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Expect the notifications to be created.
      const notifications = await getUnsentECEResponseNotifications(db);
      expect(notifications).toHaveLength(
        locationFAIL.integrationContacts.length,
      );
    });

    it("Should stop processing the ECE response file and create notification when the count of detail in the footer record is incorrect.", async () => {
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
        "Notification has been created to send email to integration contacts.",
        "Total file parsing errors: 1",
        "Total detail records found: 0",
        "Total disbursements found: 0",
        "Disbursements successfully updated: 0",
        "Disbursements skipped to be processed: 0",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 0",
      ];
      expectedResult.errors = [
        `Error processing the file ${confirmEnrolmentResponseFile}. ${FILE_PARSING_ERROR}: The total count of detail records mentioned in the footer record does not match with the actual total details records count.`,
        "File processing aborted.",
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Expect the notifications to be created.
      const notifications = await getUnsentECEResponseNotifications(db);
      expect(notifications).toHaveLength(
        locationFAIL.integrationContacts.length,
      );
    });

    it("Should stop processing the ECE response file and create notification when one of the detail records have invalid data.", async () => {
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
        "Notification has been created to send email to integration contacts.",
        "Total file parsing errors: 1",
        "Total detail records found: 1",
        "Total disbursements found: 0",
        "Disbursements successfully updated: 0",
        "Disbursements skipped to be processed: 0",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 0",
      ];
      expectedResult.errors = [
        "Invalid unique index number for the disbursement record, Invalid application number at line 2.",
        `Error processing the file ${confirmEnrolmentResponseFile}. Error: The file consists invalid data and cannot be processed.`,
        "File processing aborted.",
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Expect the notifications to be created.
      const notifications = await getUnsentECEResponseNotifications(db);
      expect(notifications).toHaveLength(
        locationSKIP.integrationContacts.length,
      );
    });

    it("Should skip the processing and log error and create notification when detail record with invalid enrolment confirmation flag is present and process other disbursements.", async () => {
      // Arrange
      // Including a valid disbursement in this test case to ensure that
      // when there is a enrolment data validation error, only that particular disbursement is failed to process
      // and other disbursements are processed.
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
          return (
            fileContent
              .replace(
                "DISBNUMBER",
                disbursement.id.toString().padStart(10, "0"),
              )
              .replace("APPLNUMBER", application.applicationNumber)
              .replace("ENRLDATE", formatDate(new Date(), "YYYYMMDD"))
              // Replacing Y with K. As Y is present in other places using a pattern.
              .replace("Y20230418N", "K20230418N")
          );
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);

      // Assert
      const expectedResult: ProcessSummaryResult = new ProcessSummaryResult();
      expectedResult.summary = [
        `Starting download of file ${confirmEnrolmentResponseFile}.`,
        `Disbursement ${disbursement.id}, enrolment confirmed.`,
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
        "Notification has been created to send email to integration contacts.",
        "Total file parsing errors: 0",
        "Total detail records found: 2",
        "Total disbursements found: 2",
        "Disbursements successfully updated: 1",
        "Disbursements skipped to be processed: 0",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 1",
      ];
      expectedResult.errors = [
        "Disbursement 1119353191, record failed to process due to reason: Invalid enrolment confirmation flag.",
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Expect the notifications to be created.
      const notifications = await getUnsentECEResponseNotifications(db);
      expect(notifications).toHaveLength(
        locationCONF.integrationContacts.length,
      );
    });

    it("Should skip the processing and log error and create notification when detail record with invalid enrolment confirmation date and pay to school amount is present and process other disbursements.", async () => {
      // Arrange
      // Including a valid disbursement in this test case to ensure that
      // when there is a enrolment data validation error, only that particular disbursement is failed to process
      // and other disbursements are processed.
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
          return (
            fileContent
              .replace(
                "DISBNUMBER",
                disbursement.id.toString().padStart(10, "0"),
              )
              .replace("APPLNUMBER", application.applicationNumber)
              .replace("ENRLDATE", formatDate(new Date(), "YYYYMMDD"))
              // Replacing date 20230418 and amount 000000 with invalid data.
              .replace("Y20230418N000000", "YNOTADATENNANNUM")
          );
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);

      // Assert
      const expectedResult: ProcessSummaryResult = new ProcessSummaryResult();
      expectedResult.summary = [
        `Starting download of file ${confirmEnrolmentResponseFile}.`,
        `Disbursement ${disbursement.id}, enrolment confirmed.`,
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
        "Notification has been created to send email to integration contacts.",
        "Total file parsing errors: 0",
        "Total detail records found: 2",
        "Total disbursements found: 2",
        "Disbursements successfully updated: 1",
        "Disbursements skipped to be processed: 0",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 1",
      ];
      expectedResult.errors = [
        "Disbursement 1119353191, record failed to process due to reason: Invalid enrolment confirmation date, Invalid pay to school amount.",
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Expect the notifications to be created.
      const notifications = await getUnsentECEResponseNotifications(db);
      expect(notifications).toHaveLength(
        locationCONF.integrationContacts.length,
      );
    });

    it("Should skip the processing and log error and create notification when enrolment confirmation date is before the approval period.", async () => {
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

      const disbursementDate = disbursement.disbursementDate;

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
            .replace(
              "ENRLDATE",
              formatDate(
                addDays(-(COE_WINDOW + 2), disbursementDate),
                "YYYYMMDD",
              ),
            );
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);

      // Assert
      const expectedResult: ProcessSummaryResult = new ProcessSummaryResult();
      expectedResult.summary = [
        `Starting download of file ${confirmEnrolmentResponseFile}.`,
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
        "Notification has been created to send email to integration contacts.",
        "Total file parsing errors: 0",
        "Total detail records found: 2",
        "Total disbursements found: 2",
        "Disbursements successfully updated: 0",
        "Disbursements skipped to be processed: 1",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 1",
      ];
      expectedResult.warnings = [
        "Disbursement 1119353191, record skipped due to reason: Enrolment not found.",
      ];
      expectedResult.errors = [
        `Disbursement ${disbursement.id}, record failed to process due to reason: The enrolment cannot be confirmed as enrolment confirmation date is not within the valid approval period.`,
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Expect the notifications to be created.
      const notifications = await getUnsentECEResponseNotifications(db);
      expect(notifications).toHaveLength(
        locationCONF.integrationContacts.length,
      );
    });

    it("Should skip the processing and log error and create notification when enrolment confirmation date is after the approval period.", async () => {
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

      const studyPeriodEndDate =
        application.currentAssessment.offering.studyEndDate;

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
            .replace(
              "ENRLDATE",
              formatDate(addDays(2, studyPeriodEndDate), "YYYYMMDD"),
            );
        },
      );

      // Act
      const processResult = await processor.processECEResponse(job);

      // Assert
      const expectedResult: ProcessSummaryResult = new ProcessSummaryResult();
      expectedResult.summary = [
        `Starting download of file ${confirmEnrolmentResponseFile}.`,
        `The file ${confirmEnrolmentResponseFile} has been deleted after processing.`,
        "Notification has been created to send email to integration contacts.",
        "Total file parsing errors: 0",
        "Total detail records found: 2",
        "Total disbursements found: 2",
        "Disbursements successfully updated: 0",
        "Disbursements skipped to be processed: 1",
        "Disbursements considered duplicate and skipped: 0",
        "Disbursements failed to process: 1",
      ];
      expectedResult.warnings = [
        "Disbursement 1119353191, record skipped due to reason: Enrolment not found.",
      ];
      expectedResult.errors = [
        `Disbursement ${disbursement.id}, record failed to process due to reason: The enrolment cannot be confirmed as enrolment confirmation date is not within the valid approval period.`,
      ];
      expect(processResult).toStrictEqual([expectedResult]);
      // Expect the delete method to be called.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Expect the notifications to be created.
      const notifications = await getUnsentECEResponseNotifications(db);
      expect(notifications).toHaveLength(
        locationCONF.integrationContacts.length,
      );
    });
  },
);
