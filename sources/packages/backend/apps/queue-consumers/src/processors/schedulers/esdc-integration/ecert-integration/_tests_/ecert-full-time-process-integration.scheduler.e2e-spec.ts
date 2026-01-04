import {
  Application,
  ApplicationStatus,
  Assessment,
  COEStatus,
  DisabilityStatus,
  DisbursementOverawardOriginType,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValueType,
  FormYesNoOptions,
  ModifiedIndependentStatus,
  NotificationMessage,
  NotificationMessageType,
  OfferingIntensity,
  RelationshipStatus,
  RestrictionActionType,
  RestrictionBypassBehaviors,
  RestrictionType,
  User,
  WorkflowData,
} from "@sims/sims-db";
import {
  E2EDataSources,
  MSFAAStates,
  createE2EDataSources,
  createFakeDisbursementOveraward,
  createFakeDisbursementValue,
  createFakeMSFAANumber,
  createFakeNotification,
  createFakeUser,
  saveFakeApplicationDisbursements,
  saveFakeApplicationRestrictionBypass,
  saveFakeInstitutionRestriction,
  saveFakeSFASIndividual,
  saveFakeStudent,
  saveFakeStudentAssessment,
  saveFakeStudentRestriction,
} from "@sims/test-utils";
import { getUploadedFile } from "@sims/test-utils/mocks";
import { ArrayContains, In, IsNull, Like, Not } from "typeorm";
import {
  createTestingAppModule,
  describeQueueProcessorRootTest,
  mockBullJob,
} from "../../../../../../test/helpers";
import { INestApplication } from "@nestjs/common";
import {
  QueueNames,
  addDays,
  formatDate,
  getISODateOnlyString,
} from "@sims/utilities";
import { FullTimeECertProcessIntegrationScheduler } from "../ecert-full-time-process-integration.scheduler";
import { DeepMocked } from "@golevelup/ts-jest";
import * as Client from "ssh2-sftp-client";
import * as dayjs from "dayjs";
import { FullTimeCertRecordParser } from "./parsers/full-time-e-cert-record-parser";
import {
  AVIATION_CREDENTIAL_TEST_INPUTS,
  awardAssert,
  createBlockedDisbursementTestData,
  loadAwardValues,
  loadDisbursementAndStudentRestrictions,
} from "./e-cert-utils";
import { RestrictionCode, SystemUsersService } from "@sims/services";
import { createFakeSFASApplication } from "@sims/test-utils/factories/sfas-application";

describe(
  describeQueueProcessorRootTest(QueueNames.FullTimeECertIntegration),
  () => {
    let app: INestApplication;
    let processor: FullTimeECertProcessIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;
    let systemUsersService: SystemUsersService;
    let sharedMinistryUser: User;
    const MAX_LIFE_TIME_BC_LOAN_AMOUNT = 50000;

    beforeAll(async () => {
      // Env variable required for querying the eligible e-Cert records.
      process.env.APPLICATION_ARCHIVE_DAYS = "365";
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(FullTimeECertProcessIntegrationScheduler);
      systemUsersService = app.get(SystemUsersService);
      // Create a Ministry user to b used, for instance, for audit.
      sharedMinistryUser = await db.user.save(createFakeUser());
      // Insert fake email contact to send ministry email.
      await db.notificationMessage.update(
        {
          id: NotificationMessageType.MinistryNotificationDisbursementBlocked,
        },
        { emailContacts: ["dummy@some.domain"] },
      );
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      // Ensures that every disbursement on database is cancelled allowing the e-Certs to
      // be generated with the data created for every specific scenario.
      await db.disbursementSchedule.update(
        {
          disbursementScheduleStatus: Not(DisbursementScheduleStatus.Cancelled),
        },
        { disbursementScheduleStatus: DisbursementScheduleStatus.Cancelled },
      );
      // Reset sequence number to control the file name generated.
      await db.sequenceControl.update(
        { sequenceName: Like("ECERT_FT_SENT_FILE_%") },
        { sequenceNumber: "0" },
      );
    });

    it("Should generate disbursement file with formatted records when there is data for the ecert generation.", async () => {
      // Arrange
      const student = await saveFakeStudent(
        db.dataSource,
        {},
        {
          initialValue: {
            contactInfo: {
              address: {
                postalCode: "V1V1V1",
                addressLine1: "345 Douglas St.",
                country: "canada",
                city: "Victoria",
                provinceState: "BC",
              },
              phone: "2501234567",
            },
          },
        },
      );
      // Valid MSFAA Number.
      const msfaaNumber = await db.msfaaNumber.save(
        createFakeMSFAANumber({ student }, { msfaaState: MSFAAStates.Signed }),
      );

      const coeUpdatedAtDate = new Date();

      // Student application eligible for e-Cert.
      await saveFakeApplicationDisbursements(
        db.dataSource,
        { student, msfaaNumber },
        {
          applicationInitialValues: {
            applicationStatus: ApplicationStatus.Completed,
            relationshipStatus: RelationshipStatus.MarriedUnable,
          },
          offeringIntensity: OfferingIntensity.fullTime,
          currentAssessmentInitialValues: {
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
            workflowData: {
              studentData: {
                dependantStatus: "dependant",
                relationshipStatus: RelationshipStatus.Single,
                livingWithParents: FormYesNoOptions.Yes,
                numberOfParents: 2,
                citizenship: "Canadian",
                taxReturnIncome: 1000,
              },
              calculatedData: {
                familySize: 2,
                studentMSOLAllowance: 7777,
                totalNonEducationalCost: 22,
                studentMaritalStatusCode: "SI",
                pdppdStatus: false,
              },
            },
          },
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            coeUpdatedAt: coeUpdatedAtDate,
          },
        },
      );

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 1",
      ]);
      const [header, record1, footer] = uploadedFile.fileLines;
      // Validate header.
      expect(header).toContain("100BC  NEW ENTITLEMENT");
      // Validate footer.
      expect(footer.substring(0, 18)).toBe("999NEW ENTITLEMENT");
      // Validate record.
      const record1Parsed = new FullTimeCertRecordParser(record1);
      expect(record1Parsed.enrollmentConfirmationDate).toBe(
        formatDate(coeUpdatedAtDate, "YYYYMMDD"),
      );
      expect(record1Parsed.postalCode).toBe("V1V 1V1");
      expect(record1Parsed.gender).toBe("X");
      expect(record1Parsed.maritalStatus).toBe("M");
      // TODO Add other fields as needed.
    });

    it("Should generate an e-cert file with only header and footer when there is no disbursement to be sent.", async () => {
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 0",
      ]);

      // Assert header and footer.
      const [header, footer] = uploadedFile.fileLines;
      // Validate header.
      expect(header).toContain("100BC  NEW ENTITLEMENT");
      // Validate footer.
      expect(footer.substring(0, 3)).toBe("999");
    });

    it("Should execute overawards deductions and calculate awards effective value when student has overawards to be deducted.", async () => {
      // Arrange

      // Student with valid SIN.
      const student = await saveFakeStudent(db.dataSource);
      // Valid MSFAA Number.
      const msfaaNumber = await db.msfaaNumber.save(
        createFakeMSFAANumber({ student }, { msfaaState: MSFAAStates.Signed }),
      );
      // Original assessment - first disbursement.
      const firstDisbursementValues = [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaLoan,
          "CSLF",
          5000,
          { disbursedAmountSubtracted: 1000 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCLoan,
          "BCSL",
          4000,
          { disbursedAmountSubtracted: 500 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          2000,
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCGrant,
          "BCAG",
          1500,
          { disbursedAmountSubtracted: 500 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCGrant,
          "BGPD",
          2500,
        ),
      ];
      // Student application eligible for e-Cert.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student, disbursementValues: firstDisbursementValues, msfaaNumber },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
          },
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
          },
        },
      );
      // Create fake overawards.
      const fakeCanadaLoanOverawardBalance = createFakeDisbursementOveraward({
        student,
      });
      fakeCanadaLoanOverawardBalance.disbursementValueCode = "CSLF";
      fakeCanadaLoanOverawardBalance.overawardValue = 4500;
      await db.disbursementOveraward.save(fakeCanadaLoanOverawardBalance);

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 1",
      ]);
      // Assert some log messages related to overaward processing.
      expect(
        mockedJob.containLogMessages([
          "Checking if overaward adjustments are needed.",
          "Found overaward balance for the student.",
          "Applying overaward debit for CSLF.",
          "No overaward adjustments needed for BCSL.",
        ]),
      ).toBe(true);

      // Assert Canada Loan overawards were deducted.
      const hasCanadaLoanOverawardDeduction =
        await db.disbursementOveraward.exists({
          where: {
            student: {
              id: student.id,
            },
            overawardValue: -4000,
            disbursementValueCode: "CSLF",
            originType: DisbursementOverawardOriginType.AwardDeducted,
          },
        });
      expect(hasCanadaLoanOverawardDeduction).toBe(true);

      const [firstSchedule] =
        application.currentAssessment.disbursementSchedules;

      // Assert schedule is updated to 'sent' with the dateSent defined.
      const scheduleIsSent = await db.disbursementSchedule.exists({
        where: {
          id: firstSchedule.id,
          dateSent: Not(IsNull()),
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
      });
      expect(scheduleIsSent).toBe(true);

      // Assert awards

      // Select all awards generated for the schedule.
      const awards = await db.disbursementValue.find({
        select: {
          id: true,
          valueCode: true,
          disbursedAmountSubtracted: true,
          overawardAmountSubtracted: true,
          effectiveAmount: true,
        },
        where: { disbursementSchedule: { id: firstSchedule.id } },
        order: { valueCode: "ASC" },
      });
      expect(awards).toEqual([
        {
          id: expect.any(Number),
          valueCode: "BCAG",
          disbursedAmountSubtracted: 500,
          overawardAmountSubtracted: null,
          effectiveAmount: 1000,
        },
        {
          id: expect.any(Number),
          valueCode: "BCSG",
          disbursedAmountSubtracted: null,
          overawardAmountSubtracted: null,
          effectiveAmount: 3500,
        },
        {
          id: expect.any(Number),
          valueCode: "BCSL",
          disbursedAmountSubtracted: 500,
          overawardAmountSubtracted: null,
          effectiveAmount: 3500,
        },
        {
          id: expect.any(Number),
          valueCode: "BGPD",
          disbursedAmountSubtracted: null,
          overawardAmountSubtracted: null,
          effectiveAmount: 2500,
        },
        {
          id: expect.any(Number),
          valueCode: "CSGP",
          disbursedAmountSubtracted: null,
          overawardAmountSubtracted: null,
          effectiveAmount: 2000,
        },
        {
          id: expect.any(Number),
          valueCode: "CSLF",
          disbursedAmountSubtracted: 1000,
          overawardAmountSubtracted: 4000,
          effectiveAmount: 0,
        },
      ]);
    });

    it(
      "Should execute overawards credits and calculate awards effective value, crediting a CSLF and BCSL amounts up to the max deducted overaward amount in previous assessments " +
        "when there was a previous deducted CSLF and BCSL overawards for an original assessment, and a negative overaward balance for the reassessment.",
      async () => {
        // Arrange
        // Student with valid SIN.
        const student = await saveFakeStudent(db.dataSource);
        // Valid MSFAA Number.
        const msfaaNumber = await db.msfaaNumber.save(
          createFakeMSFAANumber(
            { student },
            { msfaaState: MSFAAStates.Signed },
          ),
        );
        // Created a Federal and Provincial loans.
        // This assessment is sent and will not have its values updated.
        const originalAssessmentDisbursementValues = [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaLoan,
            "CSLF",
            5000,
            {
              // Deducted $500 overaward in the original assessment.
              overawardAmountSubtracted: 500,
              effectiveAmount: 4500,
            },
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCLoan,
            "BCSL",
            4000,
            {
              // Deducted $750 overaward in the original assessment.
              overawardAmountSubtracted: 750,
              effectiveAmount: 3250,
            },
          ),
        ];
        // This will be the current assessment and it will have overaward credits applied.
        const reassessmentDisbursementValues = [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaLoan,
            "CSLF",
            5000,
            {
              disbursedAmountSubtracted: 5000,
              overawardAmountSubtracted: 0,
            },
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCLoan,
            "BCSL",
            4000,
            { disbursedAmountSubtracted: 4000, overawardAmountSubtracted: 0 },
          ),
        ];
        // Student application eligible for e-Cert.
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          {
            student,
            msfaaNumber,
            disbursementValues: reassessmentDisbursementValues,
          },
          {
            offeringIntensity: OfferingIntensity.fullTime,
            applicationStatus: ApplicationStatus.Completed,
            currentAssessmentInitialValues: {
              assessmentData: { weeks: 5 } as Assessment,
              assessmentDate: new Date(),
            },
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
              disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
            },
          },
        );
        // Save the original assessment as the previous assessment of the current one.
        await saveFakeStudentAssessment(
          db,
          { application },
          {
            firstDisbursementScheduleInitialValue: {
              disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
              coeStatus: COEStatus.completed,
            },
            firstDisbursementValues: originalAssessmentDisbursementValues,
          },
        );
        // Create fake overaward for CSLF.
        // The value is greater than the deducted amount in the original assessment
        // to ensure the credit will be applied up to the maximum awarded amount.
        const fakeCanadaLoanOverawardBalance = createFakeDisbursementOveraward({
          student,
        });
        fakeCanadaLoanOverawardBalance.disbursementValueCode = "CSLF";
        fakeCanadaLoanOverawardBalance.overawardValue = -550;
        // Create fake overaward for BCSL.
        // The value is smaller than the deducted amount in the original assessment
        // to ensure the credit will be applied only partially.
        const fakeBCLoanOverawardBalance = createFakeDisbursementOveraward({
          student,
        });
        fakeBCLoanOverawardBalance.disbursementValueCode = "BCSL";
        fakeBCLoanOverawardBalance.overawardValue = -700;
        await db.disbursementOveraward.save([
          fakeCanadaLoanOverawardBalance,
          fakeBCLoanOverawardBalance,
        ]);

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.processQueue(mockedJob.job);

        // Assert some log messages related to overaward processing.
        expect(
          mockedJob.containLogMessages([
            "Checking if overaward adjustments are needed.",
            "Found overaward balance for the student.",
            "Applying overaward credit for CSLF.",
            "Applying overaward credit for BCSL.",
          ]),
        ).toBe(true);
        // Assert overawards were credited.
        const [firstSchedule] =
          application.currentAssessment.disbursementSchedules;
        const overawards = await db.disbursementOveraward.find({
          select: {
            id: true,
            overawardValue: true,
            disbursementValueCode: true,
            originType: true,
          },
          where: {
            disbursementSchedule: { id: firstSchedule.id },
          },
          order: { disbursementValueCode: "ASC" },
        });
        expect(overawards.length).toBe(2);
        const [bcslOveraward, cslfOveraward] = overawards;
        expect(cslfOveraward).toEqual({
          id: expect.any(Number),
          overawardValue: 500,
          disbursementValueCode: "CSLF",
          originType: DisbursementOverawardOriginType.AwardCredited,
        });
        expect(bcslOveraward).toEqual({
          id: expect.any(Number),
          overawardValue: 700,
          disbursementValueCode: "BCSL",
          originType: DisbursementOverawardOriginType.AwardCredited,
        });
        // Assert awards
        // Select all awards generated for the schedule.
        const awards = await db.disbursementValue.find({
          select: {
            id: true,
            valueCode: true,
            disbursedAmountSubtracted: true,
            overawardAmountSubtracted: true,
            effectiveAmount: true,
          },
          where: {
            disbursementSchedule: { id: firstSchedule.id },
            valueCode: In(["CSLF", "BCSL"]),
          },
          order: { valueCode: "ASC" },
        });
        expect(awards).toEqual([
          {
            id: expect.any(Number),
            valueCode: "BCSL",
            disbursedAmountSubtracted: 4000,
            overawardAmountSubtracted: -700,
            effectiveAmount: 700,
          },
          {
            id: expect.any(Number),
            valueCode: "CSLF",
            disbursedAmountSubtracted: 5000,
            overawardAmountSubtracted: -500,
            effectiveAmount: 500,
          },
        ]);
      },
    );

    it(
      "Should execute overawards credits verifications for CSLF, but not apply any credits " +
        "when there was no previous deducted CSLF overawards for a previous assessment.",
      async () => {
        // Arrange
        // Student with valid SIN.
        const student = await saveFakeStudent(db.dataSource);
        // Valid MSFAA Number.
        const msfaaNumber = await db.msfaaNumber.save(
          createFakeMSFAANumber(
            { student },
            { msfaaState: MSFAAStates.Signed },
          ),
        );
        const originalAssessmentDisbursementValues = [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaLoan,
            "CSLF",
            1000,
            { effectiveAmount: 1000 },
          ),
        ];
        const reassessmentDisbursementValues = [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaLoan,
            "CSLF",
            1000,
            {
              disbursedAmountSubtracted: 1000,
              effectiveAmount: 0,
            },
          ),
        ];
        // Student application eligible for e-Cert.
        // Create a reassessment as a current assessment and
        // an original assessment right afterwards.
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          {
            student,
            msfaaNumber,
            disbursementValues: reassessmentDisbursementValues,
          },
          {
            offeringIntensity: OfferingIntensity.fullTime,
            applicationStatus: ApplicationStatus.Completed,
            currentAssessmentInitialValues: {
              assessmentData: { weeks: 5 } as Assessment,
              assessmentDate: new Date(),
            },
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
              disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
            },
          },
        );
        // Create an original assessment for the same application.
        // This will be considered the previous assessment when processing overawards.
        await saveFakeStudentAssessment(
          db,
          { application },
          {
            firstDisbursementScheduleInitialValue: {
              disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
              coeStatus: COEStatus.completed,
            },
            firstDisbursementValues: originalAssessmentDisbursementValues,
          },
        );
        // Create fake overaward for CSLF.
        const fakeCanadaLoanOverawardBalance = createFakeDisbursementOveraward({
          student,
        });
        fakeCanadaLoanOverawardBalance.disbursementValueCode = "CSLF";
        fakeCanadaLoanOverawardBalance.overawardValue = -100;
        await db.disbursementOveraward.save(fakeCanadaLoanOverawardBalance);

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.processQueue(mockedJob.job);

        // Assert some log messages related to overaward processing.
        expect(
          mockedJob.containLogMessages([
            "Checking if overaward adjustments are needed.",
            "Found overaward balance for the student.",
            "An overaward credit was found, but there are no overawards deductions in previous disbursements for CSLF.",
          ]),
        ).toBe(true);
        // Assert overawards were credited.
        const [firstSchedule] =
          application.currentAssessment.disbursementSchedules;
        const createdOverawards = await db.disbursementOveraward.exists({
          where: {
            disbursementSchedule: { id: firstSchedule.id },
          },
        });
        expect(createdOverawards).toBe(false);
        // Assert CSLF award.
        const award = await db.disbursementValue.findOne({
          select: {
            id: true,
            valueCode: true,
            disbursedAmountSubtracted: true,
            overawardAmountSubtracted: true,
            effectiveAmount: true,
          },
          where: {
            disbursementSchedule: { id: firstSchedule.id },
            valueCode: "CSLF",
          },
        });
        // Assert CSLF.
        expect(award).toEqual({
          id: expect.any(Number),
          valueCode: "CSLF",
          disbursedAmountSubtracted: 1000,
          overawardAmountSubtracted: null,
          effectiveAmount: 0,
        });
      },
    );

    it("Should disburse BC funding for a close-to-maximum disbursement, reduce BC funding when passing the maximum, and withhold BC Funding when a restriction was applied due to the maximum configured value for the year was reached.", async () => {
      // Arrange
      // Ensure the right disbursement order for the 3 disbursements.
      const [disbursementDate1, disbursementDate2, disbursementDate3] = [
        getISODateOnlyString(addDays(1)),
        getISODateOnlyString(addDays(2)),
        getISODateOnlyString(addDays(3)),
      ];
      // Eligible COE basic properties.
      const eligibleDisbursement: Partial<DisbursementSchedule> = {
        coeStatus: COEStatus.completed,
        coeUpdatedAt: new Date(),
      };
      // Student with valid SIN.
      const student = await saveFakeStudent(db.dataSource);
      // Valid MSFAA Number.
      const msfaaNumber = await db.msfaaNumber.save(
        createFakeMSFAANumber({ student }, { msfaaState: MSFAAStates.Signed }),
      );
      // Creates an application with two eligible disbursements.
      // First disbursement will be close to the maximum allowed.
      // Second disbursement will exceed the maximum and should create a restriction.
      const applicationA = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          msfaaNumber,
          firstDisbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLF",
              100,
            ),
            // Force the BCSL to be close to the limit (leave 500 for upcoming disbursement).
            createFakeDisbursementValue(
              DisbursementValueType.BCLoan,
              "BCSL",
              MAX_LIFE_TIME_BC_LOAN_AMOUNT - 500,
            ),
          ],
          secondDisbursementValues: [
            // Force the BCSL to exceed the limit by 250 (previous disbursement left 500 room).
            createFakeDisbursementValue(
              DisbursementValueType.BCLoan,
              "BCSL",
              750,
            ),
            // BC Grants should still be disbursed since BCSL has some value.
            createFakeDisbursementValue(
              DisbursementValueType.BCGrant,
              "BCAG",
              1500,
            ),
          ],
        },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
          },
          createSecondDisbursement: true,
          firstDisbursementInitialValues: {
            ...eligibleDisbursement,
            disbursementDate: disbursementDate1,
          },
          secondDisbursementInitialValues: {
            ...eligibleDisbursement,
            disbursementDate: disbursementDate2,
          },
        },
      );
      // Second application for the student when all BC funding will be withhold due to BCLM restriction
      // that must be created for the application A second disbursement.
      const applicationB = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          msfaaNumber,
          firstDisbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLF",
              199,
            ),
            // Should be disbursed because it is a federal grant.
            createFakeDisbursementValue(
              DisbursementValueType.CanadaGrant,
              "CSGP",
              299,
            ),
            // Should not be disbursed due to BCLM restriction.
            createFakeDisbursementValue(
              DisbursementValueType.BCLoan,
              "BCSL",
              399,
            ),
            // Should not be disbursed due to BCLM restriction.
            createFakeDisbursementValue(
              DisbursementValueType.BCGrant,
              "BCAG",
              499,
            ),
          ],
        },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
          },
          firstDisbursementInitialValues: {
            ...eligibleDisbursement,
            disbursementDate: disbursementDate3,
          },
        },
      );

      // Application A and B shares the same program year.
      // Updating program year maximum to ensure the expect value.
      applicationA.programYear.maxLifetimeBCLoanAmount =
        MAX_LIFE_TIME_BC_LOAN_AMOUNT;
      await db.programYear.save(applicationA.programYear);

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      expect(
        mockedJob.containLogMessages([
          "New BCLM restriction was added to the student account.",
          "Applying restriction for BCAG.",
          "Applying restriction for BCSL.",
        ]),
      ).toBe(true);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      expect(uploadedFile.fileLines).toHaveLength(5);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 3",
      ]);

      const [header, record1, record2, record3, footer] =
        uploadedFile.fileLines;
      // Validate header.
      expect(header).toContain("100BC  NEW ENTITLEMENT");
      // Validate footer.
      expect(footer.substring(0, 3)).toBe("999");
      // Check record 1 when the maximum is about to be reached but not yet.
      const record1Parsed = new FullTimeCertRecordParser(record1);
      expect(record1Parsed.hasUser(student.user)).toBe(true);
      expect(record1Parsed.cslfAmount).toBe(100);
      expect(record1Parsed.bcslAmount).toBe(49500);
      // Check record 2 when maximum was exceeded and the BC Stop Funding restriction will be added.
      const record2Parsed = new FullTimeCertRecordParser(record2);
      expect(record2Parsed.hasUser(student.user)).toBe(true);
      expect(record2Parsed.cslfAmount).toBe(0);
      expect(record2Parsed.bcslAmount).toBe(500);
      expect(record2Parsed.grantAmount("BCSG")).toBe(1500); // Check for the total BC grants value.
      const [, applicationADisbursement2] =
        applicationA.currentAssessment.disbursementSchedules;
      // Select the BCSL to validate the values impacted by the restriction.
      const record2Awards = await loadAwardValues(
        db,
        applicationADisbursement2.id,
        { valueCode: ["BCSL"] },
      );
      expect(
        awardAssert(record2Awards, "BCSL", {
          valueAmount: 750,
          restrictionAmountSubtracted: 250,
          effectiveAmount: 500,
        }),
      ).toBe(true);
      // Check record 3 processing when BC Stop Funding restriction is in place.
      const record3Parsed = new FullTimeCertRecordParser(record3);
      expect(record3Parsed.hasUser(student.user)).toBe(true);
      // Keep federal funding.
      expect(record3Parsed.cslfAmount).toBe(199);
      expect(record3Parsed.grantAmount("CSGP")).toBe(299);
      // Withhold provincial funding.
      expect(record3Parsed.bcslAmount).toBe(0);
      expect(record3Parsed.grantAmount("BCSG")).toBeUndefined();
      // Select the BCSL/BCAG to validate the values impacted by the restriction.
      const [applicationBDisbursement1] =
        applicationB.currentAssessment.disbursementSchedules;
      const record3Awards = await loadAwardValues(
        db,
        applicationBDisbursement1.id,
        { valueCode: ["BCSL", "BCAG"] },
      );
      expect(
        awardAssert(record3Awards, "BCSL", {
          valueAmount: 399,
          restrictionAmountSubtracted: 399,
          effectiveAmount: 0,
        }),
      ).toBe(true);
      expect(
        awardAssert(record3Awards, "BCAG", {
          valueAmount: 499,
          restrictionAmountSubtracted: 499,
          effectiveAmount: 0,
        }),
      ).toBe(true);
    });

    it(
      "Should disburse BC funding for a close-to-maximum disbursement and reduce BC funding to not exceed the maximum limit and apply BC Funding Stop Restriction" +
        " when a student reaches maximum BC life time loan amount ignoring the legacy SFAS applications that are cancelled.",
      async () => {
        // Arrange
        // Student with valid SIN.
        const student = await saveFakeStudent(db.dataSource);
        // Valid MSFAA Number.
        const msfaaNumber = await db.msfaaNumber.save(
          createFakeMSFAANumber(
            { student },
            { msfaaState: MSFAAStates.Signed },
          ),
        );
        // SFAS Individual.
        const sfasIndividual = await saveFakeSFASIndividual(db.dataSource, {
          initialValues: {
            student: student,
          },
        });
        // SFAS Application reaching close to maximum BC Student Loan value.
        const activeFakeSFASApplication = createFakeSFASApplication(
          { individual: sfasIndividual },
          {
            initialValues: {
              bslAward: MAX_LIFE_TIME_BC_LOAN_AMOUNT - 100,
            },
          },
        );
        // SFAS Application which is cancelled and expected to be ignored.
        const cancelledFakeSFASApplication = createFakeSFASApplication(
          { individual: sfasIndividual },
          {
            initialValues: {
              bslAward: 100,
              applicationCancelDate: getISODateOnlyString(new Date()),
            },
          },
        );
        await db.sfasApplication.save([
          activeFakeSFASApplication,
          cancelledFakeSFASApplication,
        ]);

        // The current application for the student which reaches the maximum BC life time loan amount.
        const currentApplication = await saveFakeApplicationDisbursements(
          db.dataSource,
          {
            student,
            msfaaNumber,
            firstDisbursementValues: [
              createFakeDisbursementValue(
                DisbursementValueType.CanadaLoan,
                "CSLF",
                199,
              ),
              // Should be disbursed because it is a federal grant.
              createFakeDisbursementValue(
                DisbursementValueType.CanadaGrant,
                "CSGP",
                299,
              ),
              // Should disburse only 100 as the student will reach the maximum BC life time loan amount.
              createFakeDisbursementValue(
                DisbursementValueType.BCLoan,
                "BCSL",
                399,
              ),
              // BC Grants should still be disbursed since BCSL has some value.
              createFakeDisbursementValue(
                DisbursementValueType.BCGrant,
                "BCAG",
                200,
              ),
            ],
          },
          {
            offeringIntensity: OfferingIntensity.fullTime,
            applicationStatus: ApplicationStatus.Completed,
            currentAssessmentInitialValues: {
              assessmentData: { weeks: 5 } as Assessment,
              assessmentDate: new Date(),
            },
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
              coeUpdatedAt: new Date(),
              disbursementDate: getISODateOnlyString(addDays(1)),
            },
          },
        );

        // Updating program year maximum to ensure the expect value.
        currentApplication.programYear.maxLifetimeBCLoanAmount =
          MAX_LIFE_TIME_BC_LOAN_AMOUNT;
        await db.programYear.save(currentApplication.programYear);

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        const result = await processor.processQueue(mockedJob.job);
        // Assert
        expect(
          mockedJob.containLogMessages([
            "New BCLM restriction was added to the student account.",
          ]),
        ).toBe(true);

        // Assert uploaded file.
        const uploadedFile = getUploadedFile(sftpClientMock);
        const uploadedFileName = getUploadedFileName();
        expect(uploadedFile.fileLines).toHaveLength(3);
        expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
        expect(result).toStrictEqual([
          `Generated file: ${uploadedFileName}`,
          "Uploaded records: 1",
        ]);

        const [header, record1, footer] = uploadedFile.fileLines;
        // Validate header.
        expect(header).toContain("100BC  NEW ENTITLEMENT");
        // Validate footer.
        expect(footer.substring(0, 3)).toBe("999");
        // Check record 1 values.
        const record1Parsed = new FullTimeCertRecordParser(record1);
        expect(record1Parsed.hasUser(student.user)).toBe(true);
        expect(record1Parsed.cslfAmount).toBe(199);
        expect(record1Parsed.grantAmount("CSGP")).toBe(299);
        // The estimated award for BCSL is 399, but only 100 will be disbursed as the maximum is reached.
        expect(record1Parsed.bcslAmount).toBe(100);
        // Check for the total BC grants value.
        expect(record1Parsed.grantAmount("BCSG")).toBe(200);

        const [currentApplicationDisbursement] =
          currentApplication.currentAssessment.disbursementSchedules;
        // Select the BCSL to validate the values impacted by the restriction.
        const record1Awards = await loadAwardValues(
          db,
          currentApplicationDisbursement.id,
          { valueCode: ["BCSL"] },
        );
        expect(
          awardAssert(record1Awards, "BCSL", {
            valueAmount: 399,
            restrictionAmountSubtracted: 299,
            effectiveAmount: 100,
          }),
        ).toBe(true);
      },
    );

    it("Should not generate disbursement if the Student assessment contains PD/PPD application flag is yes and Student profile PD/PPD missing approval", async () => {
      // Arrange

      // Student with valid SIN and PD/PPD Not Requested.
      const student = await saveFakeStudent(db.dataSource);
      // Valid MSFAA Number.
      const msfaaNumber = await db.msfaaNumber.save(
        createFakeMSFAANumber({ student }, { msfaaState: MSFAAStates.Signed }),
      );

      // Student application eligible for e-Cert.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student, msfaaNumber },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
            workflowData: {
              studentData: {
                dependantStatus: "dependant",
                relationshipStatus: RelationshipStatus.Single,
                livingWithParents: FormYesNoOptions.Yes,
                numberOfParents: 2,
                citizenship: "Canadian",
                taxReturnIncome: 1000,
              },
              calculatedData: {
                familySize: 2,
                studentMSOLAllowance: 7777,
                totalNonEducationalCost: 22,
                studentMaritalStatusCode: "SI",
                pdppdStatus: true,
              },
            },
          },
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
          },
        },
      );

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 0",
      ]);
      const [disbursement] =
        application.currentAssessment.disbursementSchedules;
      const isScheduleNotSent = await db.disbursementSchedule.exists({
        where: {
          id: disbursement.id,
          disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
        },
      });
      expect(isScheduleNotSent).toBe(true);
    });

    it("Should not generate disbursement when the Student answered application question 'estranged from the parents' as 'yes' and profile does not have an approved modified independent status.", async () => {
      // Arrange
      const modifiedIndependentStatus = ModifiedIndependentStatus.NotRequested;
      const estrangedFromParents = FormYesNoOptions.Yes;
      const application = await saveApplicationDisbursementForECertGeneration({
        modifiedIndependentStatus,
        estrangedFromParents,
      });

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 0",
      ]);
      expect(
        mockedJob.containLogMessage(
          `Student answered '${estrangedFromParents}' for estranged from parents but the modified independent status is '${modifiedIndependentStatus}', the disbursement calculation will not proceed.`,
        ),
      ).toBe(true);
      const [disbursement] =
        application.currentAssessment.disbursementSchedules;
      const isScheduleNotSent = await db.disbursementSchedule.exists({
        where: {
          id: disbursement.id,
          disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
        },
      });
      expect(isScheduleNotSent).toBe(true);
    });

    it("Should generate disbursement when the Student answered application question 'estranged from the parents' as 'yes' and profile has an approved modified independent status.", async () => {
      // Arrange
      const modifiedIndependentStatus = ModifiedIndependentStatus.Approved;
      const application = await saveApplicationDisbursementForECertGeneration({
        modifiedIndependentStatus,
        estrangedFromParents: FormYesNoOptions.Yes,
      });

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 1",
      ]);
      const [disbursement] =
        application.currentAssessment.disbursementSchedules;
      const isScheduleSent = await db.disbursementSchedule.exists({
        where: {
          id: disbursement.id,
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
      });
      expect(isScheduleSent).toBe(true);
    });

    it("Should generate disbursement when the Student answered application question 'estranged from the parents' as 'no' and profile has an approved modified independent status.", async () => {
      // Arrange
      const modifiedIndependentStatus = ModifiedIndependentStatus.Approved;
      const application = await saveApplicationDisbursementForECertGeneration({
        modifiedIndependentStatus,
        estrangedFromParents: FormYesNoOptions.No,
      });

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 1",
      ]);
      const [disbursement] =
        application.currentAssessment.disbursementSchedules;
      const isScheduleSent = await db.disbursementSchedule.exists({
        where: {
          id: disbursement.id,
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
      });
      expect(isScheduleSent).toBe(true);
    });

    it("Should generate disbursement if the Student assessment contains PD/PPD application flag is yes and Student profile PD approved or confirmed", async () => {
      // Arrange

      // Student with valid SIN and PD/PPD approved or confirmed.
      const student = await saveFakeStudent(
        db.dataSource,
        {},
        {
          initialValue: {
            disabilityStatus: DisabilityStatus.PD,
          },
        },
      );
      // Valid MSFAA Number.
      const msfaaNumber = await db.msfaaNumber.save(
        createFakeMSFAANumber({ student }, { msfaaState: MSFAAStates.Signed }),
      );
      // Student application eligible for e-Cert.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student, msfaaNumber },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
            workflowData: {
              studentData: {
                dependantStatus: "dependant",
                relationshipStatus: RelationshipStatus.Single,
                livingWithParents: FormYesNoOptions.Yes,
                numberOfParents: 2,
                citizenship: "Canadian",
                taxReturnIncome: 1000,
              },
              calculatedData: {
                familySize: 2,
                studentMSOLAllowance: 7777,
                totalNonEducationalCost: 22,
                studentMaritalStatusCode: "SI",
                pdppdStatus: true,
              },
            },
          },
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
          },
        },
      );

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 1",
      ]);
      const [disbursement] =
        application.currentAssessment.disbursementSchedules;
      const isScheduleSent = await db.disbursementSchedule.exists({
        where: {
          id: disbursement.id,
          dateSent: Not(IsNull()),
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
      });
      expect(isScheduleSent).toBe(true);
    });

    it("Should generate disbursement if the Student assessment contains PD/PPD application flag is no", async () => {
      // Arrange

      // Student with valid SIN and PD/PPD Not Requested.
      const student = await saveFakeStudent(db.dataSource);
      // Valid MSFAA Number.
      const msfaaNumber = await db.msfaaNumber.save(
        createFakeMSFAANumber({ student }, { msfaaState: MSFAAStates.Signed }),
      );

      // Student application eligible for e-Cert.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student, msfaaNumber },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
            workflowData: {
              studentData: {
                dependantStatus: "dependant",
                relationshipStatus: RelationshipStatus.Single,
                livingWithParents: FormYesNoOptions.Yes,
                numberOfParents: 2,
                citizenship: "Canadian",
                taxReturnIncome: 1000,
              },
              calculatedData: {
                familySize: 2,
                studentMSOLAllowance: 7777,
                totalNonEducationalCost: 22,
                studentMaritalStatusCode: "SI",
                pdppdStatus: false,
              },
            },
          },
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
          },
        },
      );

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 1",
      ]);
      const [disbursement] =
        application.currentAssessment.disbursementSchedules;
      const isScheduleSent = await db.disbursementSchedule.exists({
        where: {
          id: disbursement.id,
          dateSent: Not(IsNull()),
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
      });
      expect(isScheduleSent).toBe(true);
    });

    it(
      "Should generate BC awards amounts with no restriction deductions and resolve the restriction bypass " +
        `when a student has an active '${RestrictionCode.BCLM}' restriction and it is bypassed with behavior '${RestrictionBypassBehaviors.NextDisbursementOnly}'.`,
      async () => {
        // Arrange
        // Student with valid SIN.
        const student = await saveFakeStudent(db.dataSource);
        // Valid MSFAA Number.
        const msfaaNumber = await db.msfaaNumber.save(
          createFakeMSFAANumber(
            { student },
            {
              msfaaState: MSFAAStates.Signed,
              msfaaInitialValues: {
                offeringIntensity: OfferingIntensity.fullTime,
              },
            },
          ),
        );
        // Student application eligible for e-Cert.
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          {
            student,
            msfaaNumber,
            firstDisbursementValues: [
              createFakeDisbursementValue(
                DisbursementValueType.CanadaLoan,
                "CSLF",
                1234,
              ),
              // This loan would be reduced if BCLM is active in the student account.
              createFakeDisbursementValue(
                DisbursementValueType.BCLoan,
                "BCSL",
                1000,
              ),
              // This grant would be reduced if BCLM is active in the student account.
              createFakeDisbursementValue(
                DisbursementValueType.BCGrant,
                "BCAG",
                750,
              ),
            ],
          },
          {
            offeringIntensity: OfferingIntensity.fullTime,
            applicationStatus: ApplicationStatus.Completed,
            currentAssessmentInitialValues: {
              assessmentData: { weeks: 5 } as Assessment,
              assessmentDate: new Date(),
            },
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
            },
          },
        );
        // Create restriction bypass.
        const restrictionBypass = await saveFakeApplicationRestrictionBypass(
          db,
          {
            application,
            bypassCreatedBy: sharedMinistryUser,
            creator: sharedMinistryUser,
          },
          {
            restrictionCode: RestrictionCode.BCLM,
            initialValues: {
              bypassBehavior: RestrictionBypassBehaviors.NextDisbursementOnly,
            },
          },
        );

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.processQueue(mockedJob.job);

        // Assert
        expect(
          mockedJob.containLogMessages([
            `The application has an active bypass for ${RestrictionCode.BCLM}. The verification will be ignored.`,
            `Current active restriction bypasses [Restriction Code(Student Restriction ID)]: ${restrictionBypass.studentRestriction.restriction.restrictionCode}(${restrictionBypass.studentRestriction.id}).`,
          ]),
        ).toBe(true);
        expect(
          mockedJob.containLogMessage(
            "There are no active restriction bypasses.",
          ),
        ).toBe(false);

        const [firstSchedule] =
          application.currentAssessment.disbursementSchedules;
        // Validate if the awards potentially affect by the BCLM are not deducted.
        // The same estimated values should be reflected as effective values.
        const [disbursement] = await db.disbursementSchedule.find({
          select: {
            id: true,
            disbursementScheduleStatus: true,
            disbursementValues: {
              valueCode: true,
              effectiveAmount: true,
              restrictionAmountSubtracted: true,
            },
          },
          relations: {
            disbursementValues: true,
          },
          where: {
            id: firstSchedule.id,
          },
        });
        expect(disbursement).toEqual({
          id: firstSchedule.id,
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          disbursementValues: expect.arrayContaining([
            {
              valueCode: "CSLF",
              effectiveAmount: 1234,
              restrictionAmountSubtracted: null,
            },
            {
              valueCode: "BCSL",
              effectiveAmount: 1000,
              restrictionAmountSubtracted: null,
            },
            {
              valueCode: "BCAG",
              effectiveAmount: 750,
              restrictionAmountSubtracted: null,
            },
          ]),
        });
        // Validate if bypass was removed/disabled.
        const resolvedBypass = await db.applicationRestrictionBypass.findOne({
          select: {
            id: true,
            isActive: true,
            bypassRemovedDate: true,
            bypassRemovedBy: { id: true },
            removalNote: { description: true },
          },
          relations: {
            bypassRemovedBy: true,
            removalNote: true,
          },
          where: { id: restrictionBypass.id },
        });
        expect(resolvedBypass).toEqual({
          id: restrictionBypass.id,
          isActive: false,
          bypassRemovedDate: expect.any(Date),
          bypassRemovedBy: {
            id: systemUsersService.systemUser.id,
          },
          removalNote: {
            description: `Automatically removing bypass from application number ${application.applicationNumber} after the first e-Cert was generated.`,
          },
        });
      },
    );

    it(
      "Should have the e-Cert generated for a full-time application and the bypass active when " +
        `a student has an active '${RestrictionActionType.StopFullTimeDisbursement}' restriction and it is bypassed with behavior '${RestrictionBypassBehaviors.AllDisbursements}'.`,
      async () => {
        // Arrange
        // Student with valid SIN.
        const student = await saveFakeStudent(db.dataSource);
        // Valid MSFAA Number.
        const msfaaNumber = await db.msfaaNumber.save(
          createFakeMSFAANumber(
            { student },
            {
              msfaaState: MSFAAStates.Signed,
              msfaaInitialValues: {
                offeringIntensity: OfferingIntensity.fullTime,
              },
            },
          ),
        );
        // Student application eligible for e-Cert.
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          {
            student,
            msfaaNumber,
            firstDisbursementValues: [
              createFakeDisbursementValue(
                DisbursementValueType.CanadaLoan,
                "CSLF",
                9999,
              ),
            ],
          },
          {
            offeringIntensity: OfferingIntensity.fullTime,
            applicationStatus: ApplicationStatus.Completed,
            currentAssessmentInitialValues: {
              assessmentData: { weeks: 5 } as Assessment,
              assessmentDate: new Date(),
            },
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
            },
          },
        );
        // Create restriction bypass.
        const restrictionBypass = await saveFakeApplicationRestrictionBypass(
          db,
          {
            application,
            bypassCreatedBy: sharedMinistryUser,
            creator: sharedMinistryUser,
          },
          {
            restrictionActionType:
              RestrictionActionType.StopFullTimeDisbursement,
            initialValues: {
              bypassBehavior: RestrictionBypassBehaviors.AllDisbursements,
            },
          },
        );

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.processQueue(mockedJob.job);

        // Assert
        expect(
          mockedJob.containLogMessages([
            `Current active restriction bypasses [Restriction Code(Student Restriction ID)]: ${restrictionBypass.studentRestriction.restriction.restrictionCode}(${restrictionBypass.studentRestriction.id}).`,
          ]),
        ).toBe(true);

        const [firstSchedule] =
          application.currentAssessment.disbursementSchedules;
        // Check if the disbursement was sent.
        const isScheduleSent = await db.disbursementSchedule.exists({
          where: {
            id: firstSchedule.id,
            dateSent: Not(IsNull()),
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
        });
        expect(isScheduleSent).toBe(true);
        // Validate if the bypass is still active.
        const isBypassActive = await db.applicationRestrictionBypass.exists({
          where: { id: restrictionBypass.id, isActive: true },
        });
        expect(isBypassActive).toBe(true);
      },
    );

    it(
      "Should prevent an e-Cert generation and keep the bypass active when " +
        `multiple '${RestrictionActionType.StopFullTimeDisbursement}' restrictions exist and only one is bypassed and it is bypassed with behavior '${RestrictionBypassBehaviors.NextDisbursementOnly}'.`,
      async () => {
        // Arrange
        // Student with valid SIN.
        const student = await saveFakeStudent(db.dataSource);
        // Valid MSFAA Number.
        const msfaaNumber = await db.msfaaNumber.save(
          createFakeMSFAANumber(
            { student },
            {
              msfaaState: MSFAAStates.Signed,
              msfaaInitialValues: {
                offeringIntensity: OfferingIntensity.fullTime,
              },
            },
          ),
        );
        // Student application eligible for e-Cert.
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          {
            student,
            msfaaNumber,
            firstDisbursementValues: [
              createFakeDisbursementValue(
                DisbursementValueType.CanadaLoan,
                "CSLF",
                9999,
              ),
            ],
          },
          {
            offeringIntensity: OfferingIntensity.fullTime,
            applicationStatus: ApplicationStatus.Completed,
            currentAssessmentInitialValues: {
              assessmentData: { weeks: 5 } as Assessment,
              assessmentDate: new Date(),
            },
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
            },
          },
        );
        // Create restriction bypass.
        const restrictionBypass = await saveFakeApplicationRestrictionBypass(
          db,
          {
            application,
            bypassCreatedBy: sharedMinistryUser,
            creator: sharedMinistryUser,
          },
          {
            restrictionActionType:
              RestrictionActionType.StopFullTimeDisbursement,
            initialValues: {
              bypassBehavior: RestrictionBypassBehaviors.NextDisbursementOnly,
            },
          },
        );
        // Find another restriction to be associated with the student.
        // This restriction will not be bypassed and should block the disbursement,
        // making the bypass not be resolved.
        const restriction = await db.restriction.findOne({
          where: {
            actionType: ArrayContains([
              RestrictionActionType.StopFullTimeDisbursement,
            ]),
          },
        });
        // Create a non-bypassed student restriction to stop disbursement.
        await saveFakeStudentRestriction(db.dataSource, {
          student: application.student,
          restriction,
        });

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.processQueue(mockedJob.job);

        // Assert
        expect(
          mockedJob.containLogMessages([
            `Current active restriction bypasses [Restriction Code(Student Restriction ID)]: ${restrictionBypass.studentRestriction.restriction.restrictionCode}(${restrictionBypass.studentRestriction.id}).`,
            `Student has an active '${RestrictionActionType.StopFullTimeDisbursement}' restriction and the disbursement calculation will not proceed.`,
          ]),
        ).toBe(true);

        const [firstSchedule] =
          application.currentAssessment.disbursementSchedules;
        // Check if the disbursement is still pending.
        const isSchedulePending = await db.disbursementSchedule.exists({
          where: {
            id: firstSchedule.id,
            dateSent: IsNull(),
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
        });
        expect(isSchedulePending).toBe(true);
        // Validate if the bypass is still active.
        const isBypassActive = await db.applicationRestrictionBypass.exists({
          where: { id: restrictionBypass.id, isActive: true },
        });
        expect(isBypassActive).toBe(true);
      },
    );

    it(
      "Should create a notification for the ministry and student for a blocked disbursement when it doesn't have estimated awards" +
        " and there are no previously existing notifications for the disbursement.",
      async () => {
        // Arrange
        const { student, disbursement } =
          await createBlockedDisbursementTestData(db, {
            offeringIntensity: OfferingIntensity.fullTime,
            isValidSIN: true,
            disbursementValues: [],
          });
        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        const result = await processor.processQueue(mockedJob.job);

        // Assert uploaded file.
        const uploadedFile = getUploadedFile(sftpClientMock);
        const uploadedFileName = getUploadedFileName();
        expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
        // Assert
        expect(result).toStrictEqual([
          `Generated file: ${uploadedFileName}`,
          "Uploaded records: 0",
        ]);
        expect(
          mockedJob.containLogMessages([
            "Disbursement estimated awards do not contain any amount to be disbursed.",
            `Ministry Blocked Disbursement notification created for disbursement ID ${disbursement.id}.`,
            `Student Blocked Disbursement notification created for disbursement ID ${disbursement.id}.`,
          ]),
        ).toBe(true);
        const notifications = await db.notification.find({
          select: {
            id: true,
            user: { id: true },
            notificationMessage: { id: true },
          },
          relations: { user: true, notificationMessage: true },
          where: {
            metadata: {
              disbursementId: disbursement.id,
            },
            dateSent: IsNull(),
          },
          order: { notificationMessage: { id: "ASC" } },
        });
        expect(notifications).toEqual([
          {
            id: expect.any(Number),
            notificationMessage: {
              id: NotificationMessageType.StudentNotificationDisbursementBlocked,
            },
            user: { id: student.user.id },
          },
          {
            id: expect.any(Number),
            notificationMessage: {
              id: NotificationMessageType.MinistryNotificationDisbursementBlocked,
            },
            user: { id: systemUsersService.systemUser.id },
          },
        ]);
      },
    );

    it("Should create a notification for the student and avoid creating a notification for the Ministry when the Ministry was already notified about the same blocked disbursement.", async () => {
      // Arrange
      const { student, disbursement } = await createBlockedDisbursementTestData(
        db,
        {
          offeringIntensity: OfferingIntensity.fullTime,
          isValidSIN: true,
          disbursementValues: [],
        },
      );
      // Create a sent notification for Ministry.
      const ministryNotification = createFakeNotification(
        {
          user: systemUsersService.systemUser,
          auditUser: systemUsersService.systemUser,
          notificationMessage: {
            id: NotificationMessageType.MinistryNotificationDisbursementBlocked,
          } as NotificationMessage,
        },
        {
          initialValue: {
            metadata: {
              disbursementId: disbursement.id,
            },
            dateSent: new Date(),
          },
        },
      );
      await db.notification.save(ministryNotification);

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      await processor.processQueue(mockedJob.job);

      // Assert
      // Assert disbursement was blocked and expected student notification was created and ministry notification was not created.
      expect(
        mockedJob.containLogMessages([
          "The step determined that the calculation should be interrupted. This disbursement will not be part of the next e-Cert generation.",
          `Ministry Blocked Disbursement notification should not be created at this moment for disbursement ID ${disbursement.id}.`,
          `Student Blocked Disbursement notification created for disbursement ID ${disbursement.id}.`,
        ]),
      ).toBe(true);
      // Assert only student notification was created on DB.
      const notifications = await db.notification.find({
        select: {
          id: true,
          user: { id: true },
          notificationMessage: { id: true },
        },
        relations: { user: true, notificationMessage: true },
        where: {
          metadata: {
            disbursementId: disbursement.id,
          },
          dateSent: IsNull(),
        },
      });
      expect(notifications).toEqual([
        {
          id: expect.any(Number),
          notificationMessage: {
            id: NotificationMessageType.StudentNotificationDisbursementBlocked,
          },
          user: { id: student.user.id },
        },
      ]);
    });

    it(
      "Should block the disbursement and log the information when the institution" +
        " has an effective institution restriction for the application location and program" +
        ` with action type ${RestrictionActionType.StopFullTimeDisbursement}.`,
      async () => {
        // Arrange
        // Eligible COE basic properties.
        const eligibleDisbursement: Partial<DisbursementSchedule> = {
          coeStatus: COEStatus.completed,
          coeUpdatedAt: new Date(),
        };
        // Student with valid SIN.
        const student = await saveFakeStudent(db.dataSource);
        // Valid MSFAA Number.
        const msfaaNumber = await db.msfaaNumber.save(
          createFakeMSFAANumber(
            { student },
            {
              msfaaState: MSFAAStates.Signed,
              msfaaInitialValues: {
                offeringIntensity: OfferingIntensity.fullTime,
              },
            },
          ),
        );
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          {
            student,
            msfaaNumber,
            firstDisbursementValues: [
              createFakeDisbursementValue(
                DisbursementValueType.CanadaLoan,
                "CSLP",
                100,
              ),
              createFakeDisbursementValue(
                DisbursementValueType.BCLoan,
                "CSPT",
                150,
              ),
            ],
          },
          {
            offeringIntensity: OfferingIntensity.fullTime,
            applicationStatus: ApplicationStatus.Completed,
            currentAssessmentInitialValues: {
              assessmentData: { weeks: 5 } as Assessment,
              assessmentDate: new Date(),
            },
            firstDisbursementInitialValues: {
              ...eligibleDisbursement,
              disbursementDate: getISODateOnlyString(addDays(1)),
            },
          },
        );
        // Institution restriction that blocks disbursement.
        const restriction = await db.restriction.findOne({
          select: { id: true },
          where: {
            restrictionType: RestrictionType.Institution,
            actionType: ArrayContains([
              RestrictionActionType.StopFullTimeDisbursement,
            ]),
          },
        });
        const location =
          application.currentAssessment.offering.institutionLocation;
        const program = application.currentAssessment.offering.educationProgram;
        const institution = location.institution;
        // Add institution restriction for the application location and program.
        await saveFakeInstitutionRestriction(db, {
          restriction,
          institution,
          program,
          location,
        });
        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        const result = await processor.processQueue(mockedJob.job);

        // Assert
        // Assert uploaded file.
        const uploadedFile = getUploadedFile(sftpClientMock);
        const uploadedFileName = getUploadedFileName();
        expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
        // No records should be sent.
        expect(result).toStrictEqual([
          `Generated file: ${uploadedFileName}`,
          "Uploaded records: 0",
        ]);
        // Assert log messages for the blocked disbursement.
        expect(
          mockedJob.containLogMessages([
            `Institution has an effective '${RestrictionActionType.StopFullTimeDisbursement}' restriction` +
              ` for program ${program.id} and location ${location.id} and the disbursement calculation will not proceed.`,
            "The step determined that the calculation should be interrupted. This disbursement will not be part of the next e-Cert generation.",
          ]),
        ).toBe(true);
        const [disbursement] =
          application.currentAssessment.disbursementSchedules;
        // Assert that the disbursement is still in status 'Pending' with date sent null.
        const scheduleIsPending = await db.disbursementSchedule.exists({
          where: {
            id: disbursement.id,
            dateSent: IsNull(),
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
        });
        expect(scheduleIsPending).toBe(true);
      },
    );

    describe("Aviation credential full-time applications e-Cert generation", () => {
      for (const {
        aviationCredentialType,
        restrictionCode,
      } of AVIATION_CREDENTIAL_TEST_INPUTS) {
        it(
          `Should calculate and send the e-cert and create restriction ${restrictionCode} after persisting the e-cert calculations` +
            ` when a student is funded for an aviation credential type '${aviationCredentialType}' for the first time.`,
          async () => {
            // Arrange
            // Eligible COE basic properties.
            const eligibleDisbursement: Partial<DisbursementSchedule> = {
              coeStatus: COEStatus.completed,
              coeUpdatedAt: new Date(),
            };
            // Student with valid SIN.
            const student = await saveFakeStudent(db.dataSource);
            // Valid MSFAA Number.
            const msfaaNumber = await db.msfaaNumber.save(
              createFakeMSFAANumber(
                { student },
                {
                  msfaaState: MSFAAStates.Signed,
                  msfaaInitialValues: {
                    offeringIntensity: OfferingIntensity.fullTime,
                  },
                },
              ),
            );
            const aviationCredentialApplication =
              await saveFakeApplicationDisbursements(
                db.dataSource,
                {
                  student,
                  msfaaNumber,
                  firstDisbursementValues: [
                    createFakeDisbursementValue(
                      DisbursementValueType.CanadaLoan,
                      "CSLF",
                      100,
                    ),
                  ],
                },
                {
                  offeringIntensity: OfferingIntensity.fullTime,
                  applicationStatus: ApplicationStatus.Completed,
                  currentAssessmentInitialValues: {
                    assessmentData: { weeks: 5 } as Assessment,
                    assessmentDate: new Date(),
                  },
                  firstDisbursementInitialValues: {
                    ...eligibleDisbursement,
                    disbursementDate: getISODateOnlyString(addDays(1)),
                  },
                  offeringInitialValues: {
                    isAviationOffering: "yes",
                    aviationCredentialType,
                  },
                },
              );

            // Queued job.
            const mockedJob = mockBullJob<void>();

            // Act
            const result = await processor.processQueue(mockedJob.job);

            // Assert
            // Assert uploaded file.
            const uploadedFile = getUploadedFile(sftpClientMock);
            const uploadedFileName = getUploadedFileName();
            expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
            // One record should be sent.
            expect(result).toStrictEqual([
              `Generated file: ${uploadedFileName}`,
              "Uploaded records: 1",
            ]);
            expect(
              mockedJob.containLogMessages([
                `All calculations were saved and disbursement was set to '${DisbursementScheduleStatus.ReadyToSend}'.`,
                "Checking offering for aviation credential types to add a restriction.",
                `New restriction ${restrictionCode} for the aviation credential type ${aviationCredentialType} was added.`,
              ]),
            ).toBe(true);
            const [disbursement] =
              aviationCredentialApplication.currentAssessment
                .disbursementSchedules;
            // Validate the disbursement schedule status and created student restriction.
            const updatedDisbursement =
              await loadDisbursementAndStudentRestrictions(db, disbursement.id);
            expect(updatedDisbursement).toEqual({
              id: disbursement.id,
              disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
              studentAssessment: {
                id: aviationCredentialApplication.currentAssessment.id,
                application: {
                  id: aviationCredentialApplication.id,
                  student: {
                    id: aviationCredentialApplication.student.id,
                    studentRestrictions: [
                      {
                        id: expect.any(Number),
                        isActive: true,
                        restriction: {
                          id: expect.any(Number),
                          restrictionCode: restrictionCode,
                        },
                      },
                    ],
                  },
                },
              },
            });
          },
        );

        it(
          `Should block the disbursement for aviation credential type '${aviationCredentialType}'` +
            ` when the student already has an active restriction ${restrictionCode} added due to previous funding of the same aviation credential type.`,
          async () => {
            // Arrange
            // Eligible COE basic properties.
            const eligibleDisbursement: Partial<DisbursementSchedule> = {
              coeStatus: COEStatus.completed,
              coeUpdatedAt: new Date(),
            };
            // Student with valid SIN.
            const student = await saveFakeStudent(db.dataSource);
            // Valid MSFAA Number.
            const msfaaNumber = await db.msfaaNumber.save(
              createFakeMSFAANumber(
                { student },
                { msfaaState: MSFAAStates.Signed },
              ),
            );
            const aviationCredentialApplication =
              await saveFakeApplicationDisbursements(
                db.dataSource,
                {
                  student,
                  msfaaNumber,
                  firstDisbursementValues: [
                    createFakeDisbursementValue(
                      DisbursementValueType.CanadaLoan,
                      "CSLF",
                      100,
                    ),
                  ],
                },
                {
                  offeringIntensity: OfferingIntensity.fullTime,
                  applicationStatus: ApplicationStatus.Completed,
                  currentAssessmentInitialValues: {
                    assessmentData: { weeks: 5 } as Assessment,
                    assessmentDate: new Date(),
                  },
                  firstDisbursementInitialValues: {
                    ...eligibleDisbursement,
                    disbursementDate: getISODateOnlyString(addDays(1)),
                  },
                  offeringInitialValues: {
                    isAviationOffering: "yes",
                    aviationCredentialType,
                  },
                },
              );
            // Add a student restriction for the same aviation credential type.
            const restriction = await db.restriction.findOne({
              select: { id: true },
              where: { restrictionCode },
            });
            const studentRestriction = await saveFakeStudentRestriction(
              db.dataSource,
              {
                student: aviationCredentialApplication.student,
                restriction,
              },
            );
            // Queued job.
            const mockedJob = mockBullJob<void>();

            // Act
            const result = await processor.processQueue(mockedJob.job);

            // Assert
            // Assert uploaded file.
            const uploadedFile = getUploadedFile(sftpClientMock);
            const uploadedFileName = getUploadedFileName();
            expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
            // No records should be sent.
            expect(result).toStrictEqual([
              `Generated file: ${uploadedFileName}`,
              "Uploaded records: 0",
            ]);
            // Assert log messages for the blocked disbursement.
            expect(
              mockedJob.containLogMessages([
                `Student has an active '${RestrictionActionType.StopFullTimeDisbursement}' restriction and the disbursement calculation will not proceed.`,
                "The step determined that the calculation should be interrupted. This disbursement will not be part of the next e-Cert generation.",
              ]),
            ).toBe(true);
            const [disbursement] =
              aviationCredentialApplication.currentAssessment
                .disbursementSchedules;
            // Validate the disbursement schedule status and existing student restriction.
            const updatedDisbursement =
              await loadDisbursementAndStudentRestrictions(db, disbursement.id);
            expect(updatedDisbursement).toEqual({
              id: disbursement.id,
              disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
              studentAssessment: {
                id: aviationCredentialApplication.currentAssessment.id,
                application: {
                  id: aviationCredentialApplication.id,
                  student: {
                    id: aviationCredentialApplication.student.id,
                    // Student should have only one student restriction added from previous funding.
                    studentRestrictions: [
                      {
                        id: studentRestriction.id,
                        isActive: true,
                        restriction: {
                          id: restriction.id,
                          restrictionCode: restrictionCode,
                        },
                      },
                    ],
                  },
                },
              },
            });
          },
        );
      }

      it(
        "Should generate e-cert and not block the disbursement for aviation credential type 'commercialPilotTraining'" +
          ` and create an aviation restriction ${RestrictionCode.AVCP} for 'commercialPilotTraining' after persisting the calculations` +
          " when the student already has an active restriction AVEN added due to previous funding but for different aviation credential type.",
        async () => {
          // Arrange
          const aviationCredentialType = "commercialPilotTraining";
          // Restriction code for a different aviation credential.
          const differentAviationCredentialRestrictionCode =
            RestrictionCode.AVEN;
          // Eligible COE basic properties.
          const eligibleDisbursement: Partial<DisbursementSchedule> = {
            coeStatus: COEStatus.completed,
            coeUpdatedAt: new Date(),
          };
          // Student with valid SIN.
          const student = await saveFakeStudent(db.dataSource);
          // Valid MSFAA Number.
          const msfaaNumber = await db.msfaaNumber.save(
            createFakeMSFAANumber(
              { student },
              { msfaaState: MSFAAStates.Signed },
            ),
          );
          const aviationCredentialApplication =
            await saveFakeApplicationDisbursements(
              db.dataSource,
              {
                student,
                msfaaNumber,
                firstDisbursementValues: [
                  createFakeDisbursementValue(
                    DisbursementValueType.CanadaLoan,
                    "CSLF",
                    100,
                  ),
                ],
              },
              {
                offeringIntensity: OfferingIntensity.fullTime,
                applicationStatus: ApplicationStatus.Completed,
                currentAssessmentInitialValues: {
                  assessmentData: { weeks: 5 } as Assessment,
                  assessmentDate: new Date(),
                },
                firstDisbursementInitialValues: {
                  ...eligibleDisbursement,
                  disbursementDate: getISODateOnlyString(addDays(1)),
                },
                offeringInitialValues: {
                  isAviationOffering: "yes",
                  aviationCredentialType,
                },
              },
            );
          // Add a student restriction for the different aviation credential type.
          const restriction = await db.restriction.findOne({
            select: { id: true },
            where: {
              restrictionCode: differentAviationCredentialRestrictionCode,
            },
          });
          const differentAviationCredentialRestriction =
            await saveFakeStudentRestriction(db.dataSource, {
              student: aviationCredentialApplication.student,
              restriction,
            });
          // Queued job.
          const mockedJob = mockBullJob<void>();

          // Act
          const result = await processor.processQueue(mockedJob.job);

          // Assert
          // Assert uploaded file.
          const uploadedFile = getUploadedFile(sftpClientMock);
          const uploadedFileName = getUploadedFileName();
          expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
          // One record should be sent.
          expect(result).toStrictEqual([
            `Generated file: ${uploadedFileName}`,
            "Uploaded records: 1",
          ]);
          expect(
            mockedJob.containLogMessages([
              `All calculations were saved and disbursement was set to '${DisbursementScheduleStatus.ReadyToSend}'.`,
              "Checking offering for aviation credential types to add a restriction.",
              `New restriction ${RestrictionCode.AVCP} for the aviation credential type ${aviationCredentialType} was added.`,
            ]),
          ).toBe(true);
          const [disbursement] =
            aviationCredentialApplication.currentAssessment
              .disbursementSchedules;
          // Validate the disbursement schedule status and existing and new student restriction.
          const updatedDisbursement =
            await loadDisbursementAndStudentRestrictions(db, disbursement.id);
          expect(updatedDisbursement).toEqual({
            id: disbursement.id,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            studentAssessment: {
              id: aviationCredentialApplication.currentAssessment.id,
              application: {
                id: aviationCredentialApplication.id,
                student: {
                  id: aviationCredentialApplication.student.id,
                  // Student should have 2 student restrictions where one is added from previous funding
                  // and the other one is added from the current e-cert generation.
                  studentRestrictions: [
                    {
                      id: differentAviationCredentialRestriction.id,
                      isActive: true,
                      restriction: {
                        id: restriction.id,
                        restrictionCode:
                          differentAviationCredentialRestrictionCode,
                      },
                    },
                    {
                      id: expect.any(Number),
                      isActive: true,
                      restriction: {
                        id: expect.any(Number),
                        restrictionCode: RestrictionCode.AVCP,
                      },
                    },
                  ],
                },
              },
            },
          });
        },
      );

      it(
        "Should generate e-cert and not block the disbursement for aviation credential type 'commercialPilotTraining'" +
          ` when the student already has an active restriction ${RestrictionCode.AVCP} added due to previous funding of the same aviation credential type` +
          " but the restriction was bypassed.",
        async () => {
          // Arrange
          const aviationCredentialType = "commercialPilotTraining";
          // Eligible COE basic properties.
          const eligibleDisbursement: Partial<DisbursementSchedule> = {
            coeStatus: COEStatus.completed,
            coeUpdatedAt: new Date(),
          };
          // Student with valid SIN.
          const student = await saveFakeStudent(db.dataSource);
          // Valid MSFAA Number.
          const msfaaNumber = await db.msfaaNumber.save(
            createFakeMSFAANumber(
              { student },
              { msfaaState: MSFAAStates.Signed },
            ),
          );
          const aviationCredentialApplication =
            await saveFakeApplicationDisbursements(
              db.dataSource,
              {
                student,
                msfaaNumber,
                firstDisbursementValues: [
                  createFakeDisbursementValue(
                    DisbursementValueType.CanadaLoan,
                    "CSLF",
                    100,
                  ),
                ],
              },
              {
                offeringIntensity: OfferingIntensity.fullTime,
                applicationStatus: ApplicationStatus.Completed,
                currentAssessmentInitialValues: {
                  assessmentData: { weeks: 5 } as Assessment,
                  assessmentDate: new Date(),
                },
                firstDisbursementInitialValues: {
                  ...eligibleDisbursement,
                  disbursementDate: getISODateOnlyString(addDays(1)),
                },
                offeringInitialValues: {
                  isAviationOffering: "yes",
                  aviationCredentialType,
                },
              },
            );
          const restriction = await db.restriction.findOne({
            select: { id: true },
            where: { restrictionCode: RestrictionCode.AVCP },
          });
          const studentRestriction = await saveFakeStudentRestriction(
            db.dataSource,
            {
              student: aviationCredentialApplication.student,
              restriction,
            },
          );
          // Create restriction bypass.
          await saveFakeApplicationRestrictionBypass(db, {
            application: aviationCredentialApplication,
            studentRestriction,
          });
          // Queued job.
          const mockedJob = mockBullJob<void>();

          // Act
          const result = await processor.processQueue(mockedJob.job);

          // Assert
          // Assert uploaded file.
          const uploadedFile = getUploadedFile(sftpClientMock);
          const uploadedFileName = getUploadedFileName();
          expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
          // One record should be sent.
          expect(result).toStrictEqual([
            `Generated file: ${uploadedFileName}`,
            "Uploaded records: 1",
          ]);
          // Assert log messages.
          expect(
            mockedJob.containLogMessages([
              `All calculations were saved and disbursement was set to '${DisbursementScheduleStatus.ReadyToSend}'.`,
              "Checking offering for aviation credential types to add a restriction.",
              `Student already has a ${RestrictionCode.AVCP} restriction for the aviation credential type commercialPilotTraining.`,
            ]),
          ).toBe(true);
          const [disbursement] =
            aviationCredentialApplication.currentAssessment
              .disbursementSchedules;
          // Validate the disbursement schedule status and existing student restriction.
          const updatedDisbursement =
            await loadDisbursementAndStudentRestrictions(db, disbursement.id);
          expect(updatedDisbursement).toEqual({
            id: disbursement.id,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            studentAssessment: {
              id: aviationCredentialApplication.currentAssessment.id,
              application: {
                id: aviationCredentialApplication.id,
                student: {
                  id: aviationCredentialApplication.student.id,
                  // Student should have only one student restriction added from previous funding.
                  studentRestrictions: [
                    {
                      id: studentRestriction.id,
                      isActive: true,
                      restriction: {
                        id: restriction.id,
                        restrictionCode: RestrictionCode.AVCP,
                      },
                    },
                  ],
                },
              },
            },
          });
        },
      );
    });

    /**
     * Creates and saves an application with disbursement schedules for e-Cert generation testing.
     * @param options options to customize the application creation.
     * - `modifiedIndependentStatus`: modified independent status to set on the student profile.
     * - `estrangedFromParents`: 'estranged from parents' application question answer.
     * @returns the saved application with disbursement schedules.
     */
    async function saveApplicationDisbursementForECertGeneration(options?: {
      modifiedIndependentStatus?: ModifiedIndependentStatus;
      estrangedFromParents?: FormYesNoOptions;
    }): Promise<Application> {
      const student = await saveFakeStudent(db.dataSource, undefined, {
        initialValue: {
          modifiedIndependentStatus: options?.modifiedIndependentStatus,
        },
      });
      // Valid MSFAA Number.
      const msfaaNumber = await db.msfaaNumber.save(
        createFakeMSFAANumber({ student }, { msfaaState: MSFAAStates.Signed }),
      );
      // Student application eligible for e-Cert.
      return saveFakeApplicationDisbursements(
        db.dataSource,
        { student, msfaaNumber },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
            workflowData: {
              studentData: {
                estrangedFromParents: options?.estrangedFromParents,
              },
              calculatedData: {
                pdppdStatus: false,
              },
            } as WorkflowData,
          },
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
          },
        },
      );
    }
  },
);

/**
 * Helper function to get the uploaded file name.
 * @returns The uploaded file name
 */
function getUploadedFileName(): string {
  const fileDate = dayjs().format("YYYYMMDD");
  const uploadedFileName = `MSFT-Request\\DPBC.EDU.FTECERTS.${fileDate}.001`;
  return uploadedFileName;
}
