import {
  ApplicationStatus,
  Assessment,
  COEStatus,
  DisabilityStatus,
  DisbursementOverawardOriginType,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValueType,
  FormYesNoOptions,
  NotificationMessageType,
  OfferingIntensity,
  RelationshipStatus,
  RestrictionActionType,
  RestrictionBypassBehaviors,
  User,
} from "@sims/sims-db";
import {
  E2EDataSources,
  MSFAAStates,
  createE2EDataSources,
  createFakeDisbursementOveraward,
  createFakeDisbursementValue,
  createFakeMSFAANumber,
  createFakeUser,
  saveFakeApplicationDisbursements,
  saveFakeApplicationRestrictionBypass,
  saveFakeStudent,
  saveFakeStudentRestriction,
} from "@sims/test-utils";
import { getUploadedFile } from "@sims/test-utils/mocks";
import { ArrayContains, IsNull, Like, Not } from "typeorm";
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
  awardAssert,
  createBlockedDisbursementTestData,
  loadAwardValues,
} from "./e-cert-utils";
import { RestrictionCode, SystemUsersService } from "@sims/services";

describe(
  describeQueueProcessorRootTest(QueueNames.FullTimeECertIntegration),
  () => {
    let app: INestApplication;
    let processor: FullTimeECertProcessIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;
    let systemUsersService: SystemUsersService;
    let sharedMinistryUser: User;

    beforeAll(async () => {
      // Env variable required for querying the eligible e-Cert records.
      process.env.APPLICATION_ARCHIVE_DAYS = "42";
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
      // Insert a fake email contact to send ministry email.
      await db.notificationMessage.update(
        { id: NotificationMessageType.MinistryNotificationDisbursementBlocked },
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
      const { job } = mockBullJob<void>();

      // Act
      const result = await processor.processECert(job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const fileDate = dayjs().format("YYYYMMDD");
      const uploadedFileName = `MSFT-Request\\DPBC.EDU.FTECERTS.${fileDate}.001`;
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        "Process finalized with success.",
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
      // TODO Add other fields as needed.
    });

    it("Should execute overawards deductions and calculate awards effective value", async () => {
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
      const { job } = mockBullJob<void>();

      // Act
      const result = await processor.processECert(job);

      // Assert

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const fileDate = dayjs().format("YYYYMMDD");
      const uploadedFileName = `MSFT-Request\\DPBC.EDU.FTECERTS.${fileDate}.001`;
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        "Process finalized with success.",
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 1",
      ]);

      // Assert Canada Loan overawards were deducted.
      const hasCanadaLoanOverawardDeduction =
        await db.disbursementOveraward.exist({
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
      const scheduleIsSent = await db.disbursementSchedule.exist({
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
        where: { disbursementSchedule: { id: firstSchedule.id } },
      });
      // Assert CSLF.
      const hasExpectedCSLF = awards.filter(
        (award) =>
          award.valueCode === "CSLF" &&
          award.disbursedAmountSubtracted === 1000 &&
          award.overawardAmountSubtracted === 4000 &&
          award.effectiveAmount === 0,
      );
      expect(hasExpectedCSLF.length).toBe(1);
      // Assert BCSL.
      const hasExpectedBCSL = awards.filter(
        (award) =>
          award.valueCode === "BCSL" &&
          award.disbursedAmountSubtracted === 500 &&
          !award.overawardAmountSubtracted &&
          award.effectiveAmount === 3500,
      );
      expect(hasExpectedBCSL.length).toBe(1);
      // Assert CSGP.
      const hasExpectedCSGP = awards.filter(
        (award) =>
          award.valueCode === "CSGP" &&
          !award.disbursedAmountSubtracted &&
          !award.overawardAmountSubtracted &&
          award.effectiveAmount === 2000,
      );
      expect(hasExpectedCSGP.length).toBe(1);
      // Assert BCAG.
      const hasExpectedBCAG = awards.filter(
        (award) =>
          award.valueCode === "BCAG" &&
          award.disbursedAmountSubtracted === 500 &&
          !award.overawardAmountSubtracted &&
          award.effectiveAmount === 1000,
      );
      expect(hasExpectedBCAG.length).toBe(1);
      // Assert BGPD.
      const hasExpectedBGPD = awards.filter(
        (award) =>
          award.valueCode === "BGPD" &&
          !award.disbursedAmountSubtracted &&
          !award.overawardAmountSubtracted &&
          award.effectiveAmount === 2500,
      );
      expect(hasExpectedBGPD.length).toBe(1);
      // The BC total grant (BCSG) will be generated and
      // inserted during the e-Cert process.
      const hasExpectedBCSG = awards.filter(
        (award) =>
          award.valueCode === "BCSG" &&
          !award.disbursedAmountSubtracted &&
          !award.overawardAmountSubtracted &&
          award.effectiveAmount === 3500,
      );
      expect(hasExpectedBCSG.length).toBe(1);
    });

    it("Should disburse BC funding for a close-to-maximum disbursement, reduce BC funding when passing the maximum, and withhold BC Funding when a restriction was applied due to the maximum configured value for the year was reached.", async () => {
      // Arrange
      const MAX_LIFE_TIME_BC_LOAN_AMOUNT = 50000;
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
      const result = await processor.processECert(mockedJob.job);

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
      const fileDate = dayjs().format("YYYYMMDD");
      expect(uploadedFile.remoteFilePath).toBe(
        `MSFT-Request\\DPBC.EDU.FTECERTS.${fileDate}.001`,
      );
      expect(uploadedFile.fileLines).toHaveLength(5);
      const uploadedFileName = `MSFT-Request\\DPBC.EDU.FTECERTS.${fileDate}.001`;
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        "Process finalized with success.",
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
      const { job } = mockBullJob<void>();

      // Act
      const result = await processor.processECert(job);

      // Assert 0 uploaded records.
      expect(result).toStrictEqual([
        "Process finalized with success.",
        "Generated file: none",
        "Uploaded records: 0",
      ]);
      const [disbursement] =
        application.currentAssessment.disbursementSchedules;
      const isScheduleNotSent = await db.disbursementSchedule.exist({
        where: {
          id: disbursement.id,
          disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
        },
      });
      expect(isScheduleNotSent).toBe(true);
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
      const { job } = mockBullJob<void>();

      // Act
      const result = await processor.processECert(job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const fileDate = dayjs().format("YYYYMMDD");
      const uploadedFileName = `MSFT-Request\\DPBC.EDU.FTECERTS.${fileDate}.001`;
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        "Process finalized with success.",
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
      const { job } = mockBullJob<void>();

      // Act
      const result = await processor.processECert(job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const fileDate = dayjs().format("YYYYMMDD");
      const uploadedFileName = `MSFT-Request\\DPBC.EDU.FTECERTS.${fileDate}.001`;
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        "Process finalized with success.",
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
        await processor.processECert(mockedJob.job);

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
        await processor.processECert(mockedJob.job);

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
        await processor.processECert(mockedJob.job);

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
            firstDisbursementInitialValues: { hasEstimatedAwards: false },
          });
        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        const result = await processor.processECert(mockedJob.job);

        // Assert
        expect(result).toStrictEqual([
          "Process finalized with success.",
          "Generated file: none",
          "Uploaded records: 0",
        ]);
        expect(
          mockedJob.containLogMessages([
            "Disbursement estimated awards do not contain any amount to be disbursed.",
            `Creating notifications for disbursement id: ${disbursement.id} for student and ministry.`,
            `Completed creating notifications for disbursement id: ${disbursement.id} for student and ministry.`,
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
  },
);
