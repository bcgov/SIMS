import { DeepMocked } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import * as dateUtils from "@sims/utilities/date-utils";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../../../../test/helpers";
import {
  E2EDataSources,
  createFakeDisbursementFeedbackError,
  createE2EDataSources,
  saveFakeStudentRestriction,
  createFakeInstitution,
  createFakeInstitutionLocation,
} from "@sims/test-utils";
import { getUploadedFile, getUploadedFiles } from "@sims/test-utils/mocks";
import * as Client from "ssh2-sftp-client";
import { ArrayContains, Not } from "typeorm";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementScheduleStatus,
  InstitutionLocation,
  OfferingIntensity,
  RelationshipStatus,
  RestrictionActionType,
} from "@sims/sims-db";
import { IER12IntegrationScheduler } from "../../ier12-integration.scheduler";
import { saveIER12TestInputData } from "./ier12-factory";
import {
  ASSESSMENT_DATA_MARRIED,
  ASSESSMENT_DATA_SINGLE_DEPENDENT,
  ASSESSMENT_DATA_SINGLE_INDEPENDENT,
  AWARDS_ONE_OF_TWO_DISBURSEMENT,
  AWARDS_SINGLE_DISBURSEMENT,
  AWARDS_SINGLE_DISBURSEMENT_NO_BC_FUNDING,
  AWARDS_SINGLE_DISBURSEMENT_RESTRICTION_WITHHELD_FUNDS,
  AWARDS_TWO_OF_TWO_DISBURSEMENT,
  JANE_MONONYMOUS_FROM_OTHER_COUNTRY,
  JOHN_DOE_FROM_CANADA,
  OFFERING_FULL_TIME,
  PROGRAM_GRADUATE_DIPLOMA_WITH_INSTITUTION_PROGRAM_CODE,
  PROGRAM_UNDERGRADUATE_CERTIFICATE_WITHOUT_INSTITUTION_PROGRAM_CODE,
  WORKFLOW_DATA_DEPENDANT_RELATIONSHIP_OTHER_LIVING_WITH_PARENTS,
  WORKFLOW_DATA_MARRIED_WITH_DEPENDENTS,
  WORKFLOW_DATA_SINGLE_INDEPENDENT_WITH_NO_DEPENDENTS,
} from "./models/data-inputs";
import {
  numberToText,
  getSuccessSummaryMessages,
  dateToDateOnlyText,
} from "./utils/string-utils";
import { createIER12SchedulerJobMock } from "./utils";
import { isValidFileTimestamp } from "@sims/test-utils/utils";
import { FULL_TIME_DISBURSEMENT_FEEDBACK_ERRORS } from "@sims/integrations/services/disbursement-schedule/disbursement-schedule.models";
import * as dayjs from "dayjs";

describe(describeProcessorRootTest(QueueNames.IER12Integration), () => {
  let app: INestApplication;
  let processor: IER12IntegrationScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;
  let getFileNameAsCurrentTimestampMock: jest.SpyInstance;
  /**
   * Default program year prefix.
   */
  const sharedProgramYearPrefix = 2000;
  /**
   * Default application submission date.
   */
  const referenceSubmissionDate = new Date("2000-06-01");
  /**
   * Default application number.
   */
  const defaultApplicationNumber = "9900000001";
  /**
   * Location to be shared among the tests.
   * Belongs to a different institution than locationB.
   */
  let locationA: InstitutionLocation;
  /**
   * Location to be shared among the tests.
   * Belongs to a different institution than locationA.
   */
  let locationB: InstitutionLocation;

  beforeAll(async () => {
    process.env.INSTITUTION_REQUEST_FOLDER = "OUT";
    const { nestApplication, dataSource, sshClientMock } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sftpClientMock = sshClientMock;
    // Processor under test.
    processor = app.get(IER12IntegrationScheduler);
    // Intercept file timestamp.
    getFileNameAsCurrentTimestampMock = jest.spyOn(
      dateUtils,
      "getFileNameAsExtendedCurrentTimestamp",
    );
    // Create and save institutions A and B.
    const [institutionA, institutionB] = await db.institution.save([
      createFakeInstitution(),
      createFakeInstitution(),
    ]);
    // Create a location for institution A.
    locationA = createFakeInstitutionLocation(
      { institution: institutionA },
      { initialValue: { hasIntegration: true, institutionCode: "ZZZY" } },
    );
    // Create a location for institution B.
    locationB = createFakeInstitutionLocation(
      { institution: institutionB },
      { initialValue: { hasIntegration: true, institutionCode: "ZZZZ" } },
    );
    // Save all locations.
    await db.institutionLocation.save([locationA, locationB]);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    // Update all applications to Edited to ensure the SQL query to get the IER12 records will
    // select only the records created to the test scenarios in this file.
    await db.application.update(
      { applicationStatus: Not(ApplicationStatus.Edited) },
      { applicationStatus: ApplicationStatus.Edited },
    );
    // Avoid issues for queries relying on the application number (e.g. hasMultipleApplicationSubmissions).
    await db.application.update(
      { applicationNumber: defaultApplicationNumber },
      { applicationNumber: "0000000000" },
    );
  });

  it("Should generate an IER12 file with two records for a single student with no dependents and two disbursements, one sent and one pending.", async () => {
    // Arrange
    const testInputData = {
      student: JOHN_DOE_FROM_CANADA,
      application: {
        applicationNumber: defaultApplicationNumber,
        studentNumber: "A1B2C3D4",
        relationshipStatus: RelationshipStatus.Single,
        applicationStatus: ApplicationStatus.Completed,
        applicationStatusUpdatedOn: undefined,
      },
      assessment: {
        triggerType: AssessmentTriggerType.OriginalAssessment,
        assessmentDate: undefined,
        workflowData: WORKFLOW_DATA_SINGLE_INDEPENDENT_WITH_NO_DEPENDENTS,
        assessmentData: ASSESSMENT_DATA_SINGLE_INDEPENDENT,
        disbursementSchedules: [
          {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            disbursementDate: undefined,
            updatedAt: undefined,
            dateSent: undefined,
            disbursementValues: AWARDS_ONE_OF_TWO_DISBURSEMENT,
          },
          {
            coeStatus: COEStatus.required,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
            disbursementDate: undefined,
            updatedAt: undefined,
            dateSent: undefined,
            disbursementValues: AWARDS_TWO_OF_TWO_DISBURSEMENT,
          },
        ],
      },
      educationProgram:
        PROGRAM_UNDERGRADUATE_CERTIFICATE_WITHOUT_INSTITUTION_PROGRAM_CODE,
      offering: OFFERING_FULL_TIME,
    };
    const application = await saveIER12TestInputData(
      db,
      testInputData,
      { institutionLocation: locationA },
      {
        programYearPrefix: sharedProgramYearPrefix,
        submittedDate: referenceSubmissionDate,
      },
    );

    // Queued job.
    const mockedJob = createIER12SchedulerJobMock(
      application.currentAssessment.assessmentDate,
    );

    // Act
    const ier12Results = await processor.processQueue(mockedJob.job);
    // Assert
    // Assert process result.
    expect(ier12Results).toBeDefined();
    // File timestamp.
    const [timestampResult] = getFileNameAsCurrentTimestampMock.mock.results;
    expect(isValidFileTimestamp(timestampResult.value)).toBe(true);
    expect(ier12Results).toStrictEqual([
      getSuccessSummaryMessages(timestampResult.value, {
        institutionCode: locationA.institutionCode,
        expectedRecords: 2,
      }),
    ]);
    // Assert file output.
    const uploadedFile = getUploadedFile(sftpClientMock);
    expect(uploadedFile.fileLines?.length).toBe(2);
    const [line1, line2] = uploadedFile.fileLines;
    const [firstDisbursement, secondDisbursement] =
      application.currentAssessment.disbursementSchedules;
    const assessmentId = numberToText(application.currentAssessment.id);
    const currentOfferingId = numberToText(
      application.currentAssessment.offering.id,
    );
    const parentOfferingId = numberToText(
      application.currentAssessment.offering.parentOffering.id,
    );
    // Line 1 validations
    const firstDisbursementId = numberToText(firstDisbursement.id);
    expect(line1).toBe(
      `${assessmentId}${firstDisbursementId}${defaultApplicationNumber}A1B2C3D4    242963189Doe                      John           19980113B   SI  NONENAddress Line 1           Address Line 2           Victoria                 BC  Z1Z1Z1          Program                  Program description                               undergraduateCertificate 0001    8   0512123401234ADR1                         6${currentOfferingId}${parentOfferingId}                              2000081620001205000033330000004444000000555500000066660050100F2000060120002001COMP20000601000010000000015161000008040500N NNN            20000602        000166429600000000000000232100000000000000000000001NNN000000000000000000000000000000000000000000000000000000000000NN0000000000000144430000000000000000000000000000000000007777000000336667000009874600000000000000000000000000000000000000000000002200000120000100023789650009656600 0000000000000000000000000000000000000000000000000000000000000000000000DISS2000081520000815Completed Sent      20000816                        CSLF0000100000BCSL0000000000CSGP0000200000CSGD0000300000CSGF0000400000CSGT0000500000BCAG0000700000SBSD0000900000BGPD0000800000    0000000000`,
    );
    // Line 2 validations.
    const secondDisbursementId = numberToText(secondDisbursement.id);
    expect(line2).toBe(
      `${assessmentId}${secondDisbursementId}${defaultApplicationNumber}A1B2C3D4    242963189Doe                      John           19980113B   SI  NONENAddress Line 1           Address Line 2           Victoria                 BC  Z1Z1Z1          Program                  Program description                               undergraduateCertificate 0001    8   0512123401234ADR1                         6${currentOfferingId}${parentOfferingId}                              2000081620001205000033330000004444000000555500000066660050100F2000060120002001COMP20000601000010000000015161000008040500N NNN            20000602        000166429600000000000000232100000000000000000000001NNN000000000000000000000000000000000000000000000000000000000000NN0000000000000144430000000000000000000000000000000000007777000000336667000009874600000000000000000000000000000000000000000000002200000120000100023789650009656600 0000000000000000000000000000000000000000000000000000000000000000000000COER20000601        Required  Pending   20001011                        CSLF0000000000BCSL0001516100CSGP0000123400CSGD0000597800CSGF0000910100CSGT0001213100BCAG0000181900SBSD0000002200BGPD0000202100    0000000000`,
    );
  });

  it("Should generate an IER12 file with one record for a married student (mononymous) with dependents, applications still in assessment, and one pending disbursement.", async () => {
    // Arrange
    const testInputData = {
      student: JANE_MONONYMOUS_FROM_OTHER_COUNTRY,
      application: {
        applicationNumber: defaultApplicationNumber,
        studentNumber: "12345679",
        relationshipStatus: RelationshipStatus.Married,
        applicationStatus: ApplicationStatus.Assessment,
        applicationStatusUpdatedOn: undefined,
      },
      assessment: {
        triggerType: AssessmentTriggerType.OriginalAssessment,
        assessmentDate: undefined,
        workflowData: WORKFLOW_DATA_MARRIED_WITH_DEPENDENTS,
        assessmentData: ASSESSMENT_DATA_MARRIED,
        disbursementSchedules: [
          {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
            disbursementDate: undefined,
            updatedAt: undefined,
            dateSent: undefined,
            disbursementValues: AWARDS_SINGLE_DISBURSEMENT,
          },
        ],
      },
      educationProgram:
        PROGRAM_UNDERGRADUATE_CERTIFICATE_WITHOUT_INSTITUTION_PROGRAM_CODE,
      offering: OFFERING_FULL_TIME,
    };
    const application = await saveIER12TestInputData(
      db,
      testInputData,
      { institutionLocation: locationB },
      {
        programYearPrefix: sharedProgramYearPrefix,
        submittedDate: referenceSubmissionDate,
      },
    );

    // Queued job.
    const mockedJob = createIER12SchedulerJobMock(
      application.currentAssessment.assessmentDate,
    );

    // Act
    const ier12Results = await processor.processQueue(mockedJob.job);

    // Assert
    // Assert process result.
    expect(ier12Results).toBeDefined();
    // File timestamp.
    const [timestampResult] = getFileNameAsCurrentTimestampMock.mock.results;
    expect(isValidFileTimestamp(timestampResult.value)).toBe(true);
    expect(ier12Results).toStrictEqual([
      getSuccessSummaryMessages(timestampResult.value, {
        institutionCode: locationB.institutionCode,
      }),
    ]);
    // Assert file output.
    const uploadedFile = getUploadedFile(sftpClientMock);
    expect(uploadedFile.fileLines?.length).toBe(1);
    const [line1] = uploadedFile.fileLines;
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
    const assessmentId = numberToText(application.currentAssessment.id);
    const currentOfferingId = numberToText(
      application.currentAssessment.offering.id,
    );
    const parentOfferingId = numberToText(
      application.currentAssessment.offering.parentOffering.id,
    );
    // Line 1 validations.
    const firstDisbursementId = numberToText(firstDisbursement.id);
    expect(line1).toBe(
      `${assessmentId}${firstDisbursementId}${defaultApplicationNumber}12345679    242963189Jane With Really Long Mon               19980113B   MA  NONENSome Foreign Street Addre                         New York                     SOME POSTAL CODEProgram                  Program description                               undergraduateCertificate 0001    8   0512123401234ADR1                         6${currentOfferingId}${parentOfferingId}                              2000081620001010000033330000004444000000555500000066660019100F2000060120002001ASMT20000601000010000000006000000004800000N NNN            20000602        000966867900000000000000023100003002001003000003005NNY000000000000000000000000000000000000000000000000000000000000NY0000000000000144430000000000000000000000000000000000007777000000150056000000000000000000000000000000000000000000003000000000050000000065430000009876120005500000 0000000000000000000000000000000000000000000000000000000000000000000000ASMT20000601        Completed Pending   20000816                        CSLF0000100000BCSL0000600000CSGP0000200000CSGD0000300000CSGF0000400000CSGT0000500000BCAG0000700000SBSD0000900000BGPD0000800000    0000000000`,
    );
  });

  it("Should generate an IER12 file with one record for a dependant and living with parents student with one sent disbursement with no BC funding.", async () => {
    // Arrange
    const testInputData = {
      student: JOHN_DOE_FROM_CANADA,
      application: {
        applicationNumber: defaultApplicationNumber,
        studentNumber: undefined,
        relationshipStatus: RelationshipStatus.Other,
        applicationStatus: ApplicationStatus.Completed,
        applicationStatusUpdatedOn: undefined,
      },
      assessment: {
        triggerType: AssessmentTriggerType.OriginalAssessment,
        assessmentDate: undefined,
        workflowData:
          WORKFLOW_DATA_DEPENDANT_RELATIONSHIP_OTHER_LIVING_WITH_PARENTS,
        assessmentData: ASSESSMENT_DATA_SINGLE_DEPENDENT,
        disbursementSchedules: [
          {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            disbursementDate: undefined,
            updatedAt: undefined,
            dateSent: undefined,
            disbursementValues: AWARDS_SINGLE_DISBURSEMENT_NO_BC_FUNDING,
          },
        ],
      },
      educationProgram: PROGRAM_GRADUATE_DIPLOMA_WITH_INSTITUTION_PROGRAM_CODE,
      offering: OFFERING_FULL_TIME,
    };
    const application = await saveIER12TestInputData(
      db,
      testInputData,
      { institutionLocation: locationA },
      {
        programYearPrefix: sharedProgramYearPrefix,
        submittedDate: referenceSubmissionDate,
      },
    );

    // Queued job.
    const mockedJob = createIER12SchedulerJobMock(
      application.currentAssessment.assessmentDate,
    );

    // Act
    const ier12Results = await processor.processQueue(mockedJob.job);

    // Assert
    // Assert process result.
    expect(ier12Results).toBeDefined();
    // File timestamp.
    const [timestampResult] = getFileNameAsCurrentTimestampMock.mock.results;
    expect(isValidFileTimestamp(timestampResult.value)).toBe(true);
    expect(ier12Results).toStrictEqual([
      getSuccessSummaryMessages(timestampResult.value, {
        institutionCode: locationA.institutionCode,
      }),
    ]);
    // Assert file output.
    const uploadedFile = getUploadedFile(sftpClientMock);
    expect(uploadedFile.fileLines?.length).toBe(1);
    const [line1] = uploadedFile.fileLines;
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
    const assessmentId = numberToText(application.currentAssessment.id);
    const currentOfferingId = numberToText(
      application.currentAssessment.offering.id,
    );
    const parentOfferingId = numberToText(
      application.currentAssessment.offering.parentOffering.id,
    );
    // Line 1 validations.
    const firstDisbursementId = numberToText(firstDisbursement.id);
    expect(line1).toBe(
      `${assessmentId}${firstDisbursementId}${defaultApplicationNumber}            242963189Doe                      John           19980113A   SI  NONENAddress Line 1           Address Line 2           Victoria                 BC  Z1Z1Z1          Some Program With DescripSome program with description too long            graduateDiploma          0001    5   0512123401234ADR2XYZ                      6${currentOfferingId}${parentOfferingId}                              2000081620001010000033330000004444000000555500000066660019100F2000060120002001COMP20000601000000000000000000000001209900N NNN            20000602        000321200000000160000003212000000000000000000000003YYN000001429700000097000000005090000000000000000145500000002183YN0000000000000144430000000000000000000000000012129800007777000000070045000000000000000000000000000000000000000000000000000000050099000065004000046000000001209900 0000000000000000000000000000000000000000000000000000000000000000000000DISS2000081520000815Completed Sent      20000816                        CSLF0000000000BCSL0000000000CSGP0000759900CSGD0000065000CSGF0000150000CSGT0000235000BCAG0000000000SBSD0000000000BGPD0000000000    0000000000`,
    );
  });

  it("Should generate an IER12 file with one record for a student with one pending disbursement due to a restriction.", async () => {
    // Arrange
    const testInputData = {
      student: JOHN_DOE_FROM_CANADA,
      application: {
        applicationNumber: defaultApplicationNumber,
        studentNumber: "1",
        relationshipStatus: RelationshipStatus.Single,
        applicationStatus: ApplicationStatus.Completed,
        applicationStatusUpdatedOn: undefined,
      },
      assessment: {
        triggerType: AssessmentTriggerType.OriginalAssessment,
        assessmentDate: undefined,
        workflowData: WORKFLOW_DATA_SINGLE_INDEPENDENT_WITH_NO_DEPENDENTS,
        assessmentData: ASSESSMENT_DATA_SINGLE_DEPENDENT,
        disbursementSchedules: [
          {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
            disbursementDate: undefined,
            updatedAt: undefined,
            dateSent: undefined,
            disbursementValues: AWARDS_SINGLE_DISBURSEMENT,
          },
        ],
      },
      educationProgram: PROGRAM_GRADUATE_DIPLOMA_WITH_INSTITUTION_PROGRAM_CODE,
      offering: OFFERING_FULL_TIME,
    };
    const application = await saveIER12TestInputData(
      db,
      testInputData,
      { institutionLocation: locationB },
      {
        programYearPrefix: sharedProgramYearPrefix,
        submittedDate: referenceSubmissionDate,
      },
    );
    // Finds a restriction that stops the funding.
    const stopFullTimeDisbursementRestriction = await db.restriction.findOne({
      where: {
        actionType: ArrayContains([
          RestrictionActionType.StopFullTimeDisbursement,
        ]),
      },
    });
    // Saves the restrictions that will force the record status to be set to DISR.
    await saveFakeStudentRestriction(db.dataSource, {
      student: application.student,
      application,
      restriction: stopFullTimeDisbursementRestriction,
    });

    // Queued job.
    const mockedJob = createIER12SchedulerJobMock(
      application.currentAssessment.assessmentDate,
    );

    // Act
    const ier12Results = await processor.processQueue(mockedJob.job);

    // Assert
    // Assert process result.
    expect(ier12Results).toBeDefined();
    // File timestamp.
    const [timestampResult] = getFileNameAsCurrentTimestampMock.mock.results;
    expect(isValidFileTimestamp(timestampResult.value)).toBe(true);
    expect(ier12Results).toStrictEqual([
      getSuccessSummaryMessages(timestampResult.value, {
        institutionCode: locationB.institutionCode,
      }),
    ]);
    // Assert file output.
    const uploadedFile = getUploadedFile(sftpClientMock);
    expect(uploadedFile.fileLines?.length).toBe(1);
    const [line1] = uploadedFile.fileLines;
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
    const assessmentId = numberToText(application.currentAssessment.id);
    const currentOfferingId = numberToText(
      application.currentAssessment.offering.id,
    );
    const parentOfferingId = numberToText(
      application.currentAssessment.offering.parentOffering.id,
    );
    // Line 1 validations.
    const firstDisbursementId = numberToText(firstDisbursement.id);
    expect(line1).toBe(
      `${assessmentId}${firstDisbursementId}${defaultApplicationNumber}1           242963189Doe                      John           19980113B   SI       Address Line 1           Address Line 2           Victoria                 BC  Z1Z1Z1          Some Program With DescripSome program with description too long            graduateDiploma          0001    5   0512123401234ADR2XYZ                      6${currentOfferingId}${parentOfferingId}                              2000081620001010000033330000004444000000555500000066660019100F2000060120002001COMP20000601000010000000006000000004800000N NNY            20000602        000321200000000160000003212000000000000000000000001NNN000000000000000000000000000000000000000000000000000000000000NN0000000000000144430000000000000000000000000000000000007777000000070045000000000000000000000000000000000000000000000000000000002200000065004000046000000005500000 0000000000000000000000000000000000000000000000000000000000000000000000DISR20000811        Completed Pending   20000816                        CSLF0000100000BCSL0000600000CSGP0000200000CSGD0000300000CSGF0000400000CSGT0000500000BCAG0000700000SBSD0000900000BGPD0000800000    0000000000`,
    );
  });

  it("Should generate an IER12 file with one record for a student with one sent disbursement that had a feedback error reported (DISE).", async () => {
    // Arrange
    const testInputData = {
      student: JANE_MONONYMOUS_FROM_OTHER_COUNTRY,
      application: {
        applicationNumber: defaultApplicationNumber,
        studentNumber: undefined,
        relationshipStatus: RelationshipStatus.Single,
        applicationStatus: ApplicationStatus.Completed,
        applicationStatusUpdatedOn: undefined,
      },
      assessment: {
        triggerType: AssessmentTriggerType.OriginalAssessment,
        assessmentDate: undefined,
        workflowData: WORKFLOW_DATA_SINGLE_INDEPENDENT_WITH_NO_DEPENDENTS,
        assessmentData: ASSESSMENT_DATA_SINGLE_DEPENDENT,
        disbursementSchedules: [
          {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            disbursementDate: undefined,
            updatedAt: undefined,
            dateSent: undefined,
            disbursementValues: AWARDS_SINGLE_DISBURSEMENT_NO_BC_FUNDING,
          },
        ],
      },
      educationProgram: PROGRAM_GRADUATE_DIPLOMA_WITH_INSTITUTION_PROGRAM_CODE,
      offering: OFFERING_FULL_TIME,
    };
    const application = await saveIER12TestInputData(
      db,
      testInputData,
      { institutionLocation: locationA },
      {
        programYearPrefix: sharedProgramYearPrefix,
        submittedDate: referenceSubmissionDate,
      },
    );
    // Create a feedback error associated with the disbursement.
    const [errorCode] = FULL_TIME_DISBURSEMENT_FEEDBACK_ERRORS;
    const [disbursementSchedule] =
      application.currentAssessment.disbursementSchedules;
    // Assign a full-time e-Cert feedback error for the expected error code.
    const eCertFeedbackError = await db.eCertFeedbackError.findOne({
      select: { id: true },
      where: { errorCode, offeringIntensity: OfferingIntensity.fullTime },
    });
    const feedbackError = createFakeDisbursementFeedbackError(
      { disbursementSchedule, eCertFeedbackError },
      {
        initialValues: {
          updatedAt: dateUtils.addDays(-1),
        },
      },
    );
    await db.disbursementFeedbackErrors.save(feedbackError);
    // Queued job.
    // No date provided as it is expected that the disbursement feedback error
    // date would ensure the IER12 record is generated.
    const mockedJob = createIER12SchedulerJobMock();

    // Act
    const ier12Results = await processor.processQueue(mockedJob.job);

    // Assert
    // Assert process result.
    expect(ier12Results).toBeDefined();
    // File timestamp.
    const [timestampResult] = getFileNameAsCurrentTimestampMock.mock.results;
    expect(isValidFileTimestamp(timestampResult.value)).toBe(true);
    expect(ier12Results).toStrictEqual([
      getSuccessSummaryMessages(timestampResult.value, {
        institutionCode: locationA.institutionCode,
      }),
    ]);
    // Assert file output.
    const uploadedFile = getUploadedFile(sftpClientMock);
    expect(uploadedFile.fileLines?.length).toBe(1);
    const [line1] = uploadedFile.fileLines;
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
    const assessmentId = numberToText(application.currentAssessment.id);
    const currentOfferingId = numberToText(
      application.currentAssessment.offering.id,
    );
    const parentOfferingId = numberToText(
      application.currentAssessment.offering.parentOffering.id,
    );
    // Line 1 validations.
    const firstDisbursementId = numberToText(firstDisbursement.id);
    const feedbackErrorUpdatedDate = dateToDateOnlyText(
      feedbackError.updatedAt,
    );
    expect(line1).toBe(
      `${assessmentId}${firstDisbursementId}${defaultApplicationNumber}            242963189Jane With Really Long Mon               19980113B   SI       Some Foreign Street Addre                         New York                     SOME POSTAL CODESome Program With DescripSome program with description too long            graduateDiploma          0001    5   0512123401234ADR2XYZ                      6${currentOfferingId}${parentOfferingId}                              2000081620001010000033330000004444000000555500000066660019100F2000060120002001COMP20000601000000000000000000000001209900N NNN            20000602        000321200000000160000003212000000000000000000000001NNN000000000000000000000000000000000000000000000000000000000000NN0000000000000144430000000000000000000000000000000000007777000000070045000000000000000000000000000000000000000000000000000000002200000065004000046000000001209900 0000000000000000000000000000000000000000000000000000000000000000000000DISE${feedbackErrorUpdatedDate}20000815Completed Sent      20000816                        CSLF0000000000BCSL0000000000CSGP0000759900CSGD0000065000CSGF0000150000CSGT0000235000BCAG0000000000SBSD0000000000BGPD0000000000    0000000000`,
    );
  });

  it("Should generate an IER12 file with one record for a student with one sent disbursement that had some funds withheld due to a restriction (DISW).", async () => {
    // Arrange
    const testInputData = {
      student: JOHN_DOE_FROM_CANADA,
      application: {
        applicationNumber: defaultApplicationNumber,
        studentNumber: undefined,
        relationshipStatus: RelationshipStatus.Married,
        applicationStatus: ApplicationStatus.Completed,
        applicationStatusUpdatedOn: undefined,
      },
      assessment: {
        triggerType: AssessmentTriggerType.OriginalAssessment,
        assessmentDate: undefined,
        workflowData: WORKFLOW_DATA_MARRIED_WITH_DEPENDENTS,
        assessmentData: ASSESSMENT_DATA_MARRIED,
        disbursementSchedules: [
          {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            disbursementDate: undefined,
            updatedAt: undefined,
            dateSent: undefined,
            disbursementValues:
              AWARDS_SINGLE_DISBURSEMENT_RESTRICTION_WITHHELD_FUNDS,
          },
        ],
      },
      educationProgram:
        PROGRAM_UNDERGRADUATE_CERTIFICATE_WITHOUT_INSTITUTION_PROGRAM_CODE,
      offering: OFFERING_FULL_TIME,
      parentOfferingAvailable: true,
    };
    const application = await saveIER12TestInputData(
      db,
      testInputData,
      { institutionLocation: locationB },
      {
        programYearPrefix: sharedProgramYearPrefix,
        submittedDate: referenceSubmissionDate,
      },
    );

    // Queued job.
    const mockedJob = createIER12SchedulerJobMock(
      application.currentAssessment.assessmentDate,
    );

    // Act
    const ier12Results = await processor.processQueue(mockedJob.job);

    // Assert
    // Assert process result.
    expect(ier12Results).toBeDefined();
    // File timestamp.
    const [timestampResult] = getFileNameAsCurrentTimestampMock.mock.results;
    expect(isValidFileTimestamp(timestampResult.value)).toBe(true);
    expect(ier12Results).toStrictEqual([
      getSuccessSummaryMessages(timestampResult.value, {
        institutionCode: locationB.institutionCode,
      }),
    ]);
    // Assert file output.
    const uploadedFile = getUploadedFile(sftpClientMock);
    expect(uploadedFile.fileLines?.length).toBe(1);
    const [line1] = uploadedFile.fileLines;
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
    const assessmentId = numberToText(application.currentAssessment.id);
    const currentOfferingId = numberToText(
      application.currentAssessment.offering.id,
    );
    const offering = await db.educationProgramOffering.findOne({
      select: {
        id: true,
        parentOffering: {
          id: true,
        },
      },
      where: {
        id: application.currentAssessment.offering.id,
      },
      relations: {
        parentOffering: true,
      },
    });

    const parentOfferingId = numberToText(offering.parentOffering.id);
    // Line 1 validations.
    const firstDisbursementId = numberToText(firstDisbursement.id);
    expect(line1).toBe(
      `${assessmentId}${firstDisbursementId}${defaultApplicationNumber}            242963189Doe                      John           19980113B   MA       Address Line 1           Address Line 2           Victoria                 BC  Z1Z1Z1          Program                  Program description                               undergraduateCertificate 0001    8   0512123401234ADR1                         6${currentOfferingId}${parentOfferingId}                              2000081620001010000033330000004444000000555500000066660019100F2000060120002001COMP20000601000010000000006598000000032400N NNN            20000602        000966867900000000000009668679003002001003000003005NNY000000000000000000000000000000000000000000000000000000000000NY0000000000000144430000000000000000000000000000000000007777000000150056000000000000000000000000000000000000000000003000000000050000000065430000009876120000792200 0000000000000000000000000000000000000000000000000000000000000000000000DISW2000081520000815Completed Sent      20000816                        CSLF0000100000BCSL0000659800CSGP0000000000CSGD0000000000CSGF0000000000CSGT0000000000BCAG0000032400SBSD0000000000BGPD0000000000    0000000000`,
    );
  });

  it("Should generate 2 IER12 files for locations from different institutions using distinct institution codes.", async () => {
    // Arrange
    const testInputDataLocationA = {
      student: JOHN_DOE_FROM_CANADA,
      application: {
        applicationNumber: defaultApplicationNumber,
        studentNumber: undefined,
        relationshipStatus: RelationshipStatus.Married,
        applicationStatus: ApplicationStatus.Completed,
        applicationStatusUpdatedOn: undefined,
      },
      assessment: {
        triggerType: AssessmentTriggerType.OriginalAssessment,
        assessmentDate: referenceSubmissionDate,
        workflowData: WORKFLOW_DATA_MARRIED_WITH_DEPENDENTS,
        assessmentData: ASSESSMENT_DATA_MARRIED,
        disbursementSchedules: [
          {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            disbursementDate: undefined,
            updatedAt: undefined,
            dateSent: undefined,
            disbursementValues:
              AWARDS_SINGLE_DISBURSEMENT_RESTRICTION_WITHHELD_FUNDS,
          },
        ],
      },
      educationProgram:
        PROGRAM_UNDERGRADUATE_CERTIFICATE_WITHOUT_INSTITUTION_PROGRAM_CODE,
      offering: OFFERING_FULL_TIME,
    };
    const applicationA = await saveIER12TestInputData(
      db,
      testInputDataLocationA,
      { institutionLocation: locationA },
      {
        programYearPrefix: sharedProgramYearPrefix,
        submittedDate: referenceSubmissionDate,
      },
    );

    const testInputDataLocationB = {
      student: JOHN_DOE_FROM_CANADA,
      application: {
        applicationNumber: defaultApplicationNumber,
        studentNumber: undefined,
        relationshipStatus: RelationshipStatus.Married,
        applicationStatus: ApplicationStatus.Completed,
        applicationStatusUpdatedOn: undefined,
      },
      assessment: {
        triggerType: AssessmentTriggerType.OriginalAssessment,
        // Add one hour to ensure the proper file upload order.
        assessmentDate: dayjs(referenceSubmissionDate).add(1, "h").toDate(),
        workflowData: WORKFLOW_DATA_MARRIED_WITH_DEPENDENTS,
        assessmentData: ASSESSMENT_DATA_MARRIED,
        disbursementSchedules: [
          {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            disbursementDate: undefined,
            updatedAt: undefined,
            dateSent: undefined,
            disbursementValues:
              AWARDS_SINGLE_DISBURSEMENT_RESTRICTION_WITHHELD_FUNDS,
          },
        ],
      },
      educationProgram:
        PROGRAM_UNDERGRADUATE_CERTIFICATE_WITHOUT_INSTITUTION_PROGRAM_CODE,
      offering: OFFERING_FULL_TIME,
    };
    const applicationB = await saveIER12TestInputData(
      db,
      testInputDataLocationB,
      { institutionLocation: locationB },
      {
        programYearPrefix: sharedProgramYearPrefix,
        submittedDate: referenceSubmissionDate,
      },
    );

    // Queued job.
    const mockedJob = createIER12SchedulerJobMock(referenceSubmissionDate);

    // Act
    const ier12Results = await processor.processQueue(mockedJob.job);

    // Assert
    // Assert process result.
    expect(ier12Results).toBeDefined();
    // File timestamp.
    const [firstTimestampResult, secondTimestampResult] =
      getFileNameAsCurrentTimestampMock.mock.results;
    expect(isValidFileTimestamp(firstTimestampResult.value)).toBe(true);
    expect(isValidFileTimestamp(secondTimestampResult.value)).toBe(true);
    expect(ier12Results).toStrictEqual([
      getSuccessSummaryMessages(firstTimestampResult.value, {
        institutionCode: locationA.institutionCode,
      }),
      getSuccessSummaryMessages(secondTimestampResult.value, {
        institutionCode: locationB.institutionCode,
      }),
    ]);
    // Assert file output.
    const [fileA, fileB] = getUploadedFiles(sftpClientMock);
    // Location A file validation.
    expect(fileA).toBeDefined();
    expect(fileA.fileLines?.length).toBe(1);
    const [fileALine1] = fileA.fileLines;
    const [firstDisbursementA] =
      applicationA.currentAssessment.disbursementSchedules;
    const assessmentAId = numberToText(applicationA.currentAssessment.id);
    // Line 1 validations.
    const firstDisbursementAId = numberToText(firstDisbursementA.id);
    const currentOfferingIdForApplicationA = numberToText(
      applicationA.currentAssessment.offering.id,
    );
    const parentOfferingIdA = numberToText(
      applicationA.currentAssessment.offering.parentOffering.id,
    );
    expect(fileALine1).toBe(
      `${assessmentAId}${firstDisbursementAId}${defaultApplicationNumber}            242963189Doe                      John           19980113B   MA       Address Line 1           Address Line 2           Victoria                 BC  Z1Z1Z1          Program                  Program description                               undergraduateCertificate 0001    8   0512123401234ADR1                         6${currentOfferingIdForApplicationA}${parentOfferingIdA}                              2000081620001010000033330000004444000000555500000066660019100F2000060120002001COMP20000601000000000000000000000000000000N NNN            20000601        000966867900000000000009668679003002001003000003005NNY000000000000000000000000000000000000000000000000000000000000NY0000000000000144430000000000000000000000000000000000007777000000150056000000000000000000000000000000000000000000003000000000050000000065430000009876120000000000 0000000000000000000000000000000000000000000000000000000000000000000000DISS2000081520000815Completed Sent      20000816                        CSLF0000000000BCSL0000000000CSGP0000000000CSGD0000000000CSGF0000000000CSGT0000000000BCAG0000000000SBSD0000000000BGPD0000000000    0000000000`,
    );
    // Location B file validation.
    expect(fileB).toBeDefined();
    expect(fileB.fileLines?.length).toBe(1);
    const [fileBLine1] = fileB.fileLines;
    const [firstDisbursementB] =
      applicationB.currentAssessment.disbursementSchedules;
    const assessmentBId = numberToText(applicationB.currentAssessment.id);
    // Line 1 validations.
    const firstDisbursementBId = numberToText(firstDisbursementB.id);
    const currentOfferingIdForApplicationB = numberToText(
      applicationB.currentAssessment.offering.id,
    );
    const parentOfferingIdB = numberToText(
      applicationB.currentAssessment.offering.parentOffering.id,
    );
    expect(fileBLine1).toBe(
      `${assessmentBId}${firstDisbursementBId}${defaultApplicationNumber}            242963189Doe                      John           19980113B   MA       Address Line 1           Address Line 2           Victoria                 BC  Z1Z1Z1          Program                  Program description                               undergraduateCertificate 0001    8   0512123401234ADR1                         6${currentOfferingIdForApplicationB}${parentOfferingIdB}                              2000081620001010000033330000004444000000555500000066660019100F2000060120002001COMP20000601000010000000006598000000032400N NNN            20000601        000966867900000000000009668679003002001003000003005NNY000000000000000000000000000000000000000000000000000000000000NY0000000000000144430000000000000000000000000000000000007777000000150056000000000000000000000000000000000000000000003000000000050000000065430000009876120000792200 0000000000000000000000000000000000000000000000000000000000000000000000DISW2000081520000815Completed Sent      20000816                        CSLF0000100000BCSL0000659800CSGP0000000000CSGD0000000000CSGF0000000000CSGT0000000000BCAG0000032400SBSD0000000000BGPD0000000000    0000000000`,
    );
  });
});
