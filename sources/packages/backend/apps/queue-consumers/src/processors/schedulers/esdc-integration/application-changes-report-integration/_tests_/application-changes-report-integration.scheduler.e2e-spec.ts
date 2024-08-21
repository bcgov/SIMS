import { DeepMocked } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import {
  QueueNames,
  addDays,
  getISODateOnlyString,
  getPSTPDTDateTime,
} from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../../test/helpers";
import { ApplicationChangesReportIntegrationScheduler } from "../application-changes-report-integration.scheduler";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeEducationProgramOffering,
  createFakeStudent,
  createFakeStudentAssessment,
  createFakeUser,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import { getUploadedFile } from "@sims/test-utils/mocks";
import * as Client from "ssh2-sftp-client";

import {
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementScheduleStatus,
  EducationProgramOffering,
  OfferingIntensity,
  Student,
  User,
} from "@sims/sims-db";
import { createFakeSINValidation } from "@sims/test-utils/factories/sin-validation";
import { In, IsNull, Not } from "typeorm";
import {
  ApplicationChangesReportHeaders,
  APPLICATION_CHANGES_DATE_TIME_FORMAT,
} from "@sims/integrations/esdc-integration";

describe(
  describeProcessorRootTest(QueueNames.ApplicationChangesReportIntegration),
  () => {
    let app: INestApplication;
    let processor: ApplicationChangesReportIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;
    let auditUser: User;
    let sharedStudent: Student;

    beforeAll(async () => {
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      auditUser = await db.user.save(createFakeUser());
      const fakeStudent = createFakeStudent();
      sharedStudent = await saveFakeStudent(db.dataSource, {
        student: fakeStudent,
        sinValidation: createFakeSINValidation({ student: fakeStudent }),
      });
      // Processor under test.
      processor = app.get(ApplicationChangesReportIntegrationScheduler);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      db.studentAssessment.update(
        {
          previousDateChangedReportedAssessment: { id: Not(IsNull()) },
        },
        { previousDateChangedReportedAssessment: { id: null } },
      );
    });

    it("Should generate application changes report and update the reported date when there is one or more application changes which are not reported.", async () => {
      // Arrange
      // Preparing 2 applications which has application changes to be reported.
      const firstApplication = await createApplicationChangesData(
        sharedStudent,
        1,
        -1,
        AssessmentTriggerType.OfferingChange,
      );
      const secondApplication = await createApplicationChangesData(
        sharedStudent,
        1,
        -1,
        AssessmentTriggerType.OfferingChange,
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const processingResult = await processor.processApplicationChanges(
        mockedJob.job,
      );
      // Assert
      // Assert process result.
      expect(processingResult).toContain("Process finalized with success.");
      expect(processingResult).toContain("Applications reported: 2");
      expect(
        mockedJob.containLogMessages([
          "Found 2 application changes.",
          "Reported date has been successfully updated for reported application assessments.",
        ]),
      ).toBe(true);
      const uploadedFile = getUploadedFile(sftpClientMock);
      const expectedFirstRecord = getExpectedApplicationChangesCSVRecord(
        firstApplication,
        "PT",
        "Reassessment",
      );
      const expectedSecondRecord = getExpectedApplicationChangesCSVRecord(
        secondApplication,
        "PT",
        "Reassessment",
      );
      // Assert file output.
      const [header, firstRecord, secondRecord, numberOfRecords] =
        uploadedFile.fileLines;
      expect(header).toBe(
        Object.values(ApplicationChangesReportHeaders).join(","),
      );
      expect(firstRecord).toBe(expectedFirstRecord);
      expect(secondRecord).toBe(expectedSecondRecord);
      expect(numberOfRecords).toBe("Number of records: 2");
      // Assert the report date.
      const [firstReportedAssessment, secondReportedAssessment] =
        await db.studentAssessment.find({
          select: { id: true, reportedDate: true },
          where: {
            id: In([
              firstApplication.currentAssessment.id,
              secondApplication.currentAssessment.id,
            ]),
          },
        });
      expect(firstReportedAssessment.reportedDate).toBeInstanceOf(Date);
      expect(secondReportedAssessment.reportedDate).toBeInstanceOf(Date);
    });

    it("Should generate application changes report and update the reported date when there is one or more application changes after previous report generation.", async () => {
      // Arrange
      // Preparing application which has application changes to be reported.
      const application = await createApplicationChangesData(
        sharedStudent,
        1,
        -1,
        AssessmentTriggerType.OfferingChange,
        true,
      );

      const newOffering = await createNewOfferingWithDifferentStudyDates(
        application.currentAssessment.offering,
        1,
        -1,
      );

      // Recent application change after previous report generation.
      const newAssessment = await db.studentAssessment.save(
        createFakeStudentAssessment(
          {
            auditUser,
            application,
            previousDateChangedReportedAssessment:
              application.currentAssessment,
            offering: newOffering,
          },
          {
            initialValue: {
              triggerType: AssessmentTriggerType.ApplicationOfferingChange,
            },
          },
        ),
      );
      application.currentAssessment = newAssessment;
      await db.application.save(application);

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const processingResult = await processor.processApplicationChanges(
        mockedJob.job,
      );
      // Assert
      // Assert process result.
      expect(processingResult).toContain("Process finalized with success.");
      expect(processingResult).toContain("Applications reported: 1");
      expect(
        mockedJob.containLogMessages([
          "Found 1 application changes.",
          "Reported date has been successfully updated for reported application assessments.",
        ]),
      ).toBe(true);
      const uploadedFile = getUploadedFile(sftpClientMock);
      const expectedFirstRecord = getExpectedApplicationChangesCSVRecord(
        application,
        "PT",
        "Reassessment",
      );
      // Assert file output.
      const [header, firstRecord, numberOfRecords] = uploadedFile.fileLines;
      expect(header).toBe(
        Object.values(ApplicationChangesReportHeaders).join(","),
      );
      expect(firstRecord).toBe(expectedFirstRecord);
      expect(numberOfRecords).toBe("Number of records: 1");
      // Assert the report date.
      const reportedAssessment = await db.studentAssessment.findOne({
        select: { id: true, reportedDate: true },
        where: {
          id: application.currentAssessment.id,
        },
      });
      expect(reportedAssessment.reportedDate).toBeInstanceOf(Date);
    });

    it("Should generate blank application changes report when there is no application changes to be reported.", async () => {
      // Arrange
      // Preparing application which has no application changes to be reported as the reported date is set.
      await createApplicationChangesData(
        sharedStudent,
        1,
        -1,
        AssessmentTriggerType.OfferingChange,
        true,
      );

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const processingResult = await processor.processApplicationChanges(
        mockedJob.job,
      );
      // Assert
      // Assert process result.
      expect(processingResult).toContain("Process finalized with success.");
      expect(processingResult).toContain("Applications reported: 0");
      expect(
        mockedJob.containLogMessages([
          "Found 0 application changes.",
          "Report date update not required as no application changes are reported.",
        ]),
      ).toBe(true);
      const uploadedFile = getUploadedFile(sftpClientMock);
      // Assert file output.
      const [header, firstRecord, numberOfRecords] = uploadedFile.fileLines;
      expect(header).toBe(
        Object.values(ApplicationChangesReportHeaders).join(","),
      );
      // A blank record file is expected to be generated when there is no application changes reported.
      expect(firstRecord).toBe("");
      expect(numberOfRecords).toBe("Number of records: 0");
    });

    /**
     * Create data for application changes report.
     * @param student student
     * @param offeringStartDateDifference difference in days
     * from original offering start date.
     * @param offeringEndDateDifference difference in days
     * from original offering end date.
     * @param isReported indicates if the application change is already reported.
     * @returns application.
     */
    async function createApplicationChangesData(
      student: Student,
      offeringStartDateDifference: number,
      offeringEndDateDifference: number,
      triggerType: AssessmentTriggerType,
      isReported = false,
    ): Promise<Application> {
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
        },
      );
      const originalAssessment = application.currentAssessment;
      const originalOffering = application.currentAssessment.offering;
      const newOffering = await createNewOfferingWithDifferentStudyDates(
        originalOffering,
        offeringStartDateDifference,
        offeringEndDateDifference,
      );

      const newAssessment = await db.studentAssessment.save(
        createFakeStudentAssessment(
          {
            auditUser,
            application,
            previousDateChangedReportedAssessment: originalAssessment,
            offering: newOffering,
          },
          {
            initialValue: {
              triggerType,
              reportedDate: isReported ? new Date() : null,
            },
          },
        ),
      );
      application.currentAssessment = newAssessment;
      return db.application.save(application);
    }
    /**
     * Create a new offering with different study dates for application changes.
     * @param originalOffering original offering.
     * @param offeringStartDateDifference difference in days
     * from original offering start date.
     * @param offeringEndDateDifference difference in days
     * from original offering end date.
     * @returns new offering.
     */
    async function createNewOfferingWithDifferentStudyDates(
      originalOffering: EducationProgramOffering,
      offeringStartDateDifference: number,
      offeringEndDateDifference: number,
    ): Promise<EducationProgramOffering> {
      const newOfferingStartDate = getISODateOnlyString(
        addDays(offeringStartDateDifference, originalOffering.studyStartDate),
      );
      const newOfferingEndDate = getISODateOnlyString(
        addDays(offeringEndDateDifference, originalOffering.studyEndDate),
      );
      return db.educationProgramOffering.save(
        createFakeEducationProgramOffering(
          {
            auditUser,
            institutionLocation: originalOffering.institutionLocation,
          },
          {
            initialValues: {
              studyStartDate: newOfferingStartDate,
              studyEndDate: newOfferingEndDate,
              offeringIntensity: OfferingIntensity.partTime,
            },
          },
        ),
      );
    }
    /**
     * Get application changes CSV file record.
     * @param application application.
     * @param loanType loan type.
     * @param activity activity.
     * @returns file record.
     */
    function getExpectedApplicationChangesCSVRecord(
      application: Application,
      loanType: "FT" | "PT",
      activity: "Early Withdrawal" | "Reassessment",
    ): string {
      const sin = application.student.sinValidation.sin;
      const user = application.student.user;
      const newAssessmentDate = getPSTPDTDateTime(
        application.currentAssessment.createdAt,
        { dateTimeFormat: APPLICATION_CHANGES_DATE_TIME_FORMAT },
      );
      const originalOffering =
        application.currentAssessment.previousDateChangedReportedAssessment
          .offering;
      const newOffering = application.currentAssessment.offering;
      const institutionCode = newOffering.institutionLocation.institutionCode;
      return `${application.applicationNumber},${sin},${user.firstName},${user.lastName},${loanType},${institutionCode},${originalOffering.studyStartDate},${originalOffering.studyEndDate},${activity},${newAssessmentDate},${newOffering.studyStartDate},${newOffering.studyEndDate}`;
    }
  },
);
