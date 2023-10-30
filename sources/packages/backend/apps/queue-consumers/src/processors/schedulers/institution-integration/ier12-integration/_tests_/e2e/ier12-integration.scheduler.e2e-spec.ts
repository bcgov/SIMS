import { Job } from "bull";
import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames, getISODateOnlyString } from "@sims/utilities";
import * as dateUtils from "@sims/utilities/date-utils";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../../../../test/helpers";
import {
  E2EDataSources,
  createE2EDataSources,
  getUploadedFile,
} from "@sims/test-utils";
import * as Client from "ssh2-sftp-client";
import { Not } from "typeorm";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementScheduleStatus,
  RelationshipStatus,
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
import { GeneratedDateQueueInDTO } from "../../models/ier.model";
import { QueueProcessSummaryResult } from "../../../../../../processors/models/processors.models";
import { assessmentIdToText, disbursementIdToText } from "./utils/string-utils";
import { isValidFileTimestamp } from "./utils";

// TODO: Remove before PR review.
jest.setTimeout(120000);

// TODO
// E2E asserts
// 1 - Create/reuse helper methods to simulate the below.
// 1.1 - hasMultipleApplicationSubmissions
// 1.2 - hasActiveStopFullTimeDisbursement
// 1.3 - hasAwardWithheldDueToRestriction
// 1.4 - hasFullTimeDisbursementFeedbackErrors
// 1.5 - Consider creation a helper for one of the above and create the PR.

describe(describeProcessorRootTest(QueueNames.IER12Integration), () => {
  let app: INestApplication;
  let processor: IER12IntegrationScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;
  let sharedProgramYearPrefix: number;
  let referenceSubmissionDate: Date;
  let getFileNameAsCurrentTimestampMock: jest.SpyInstance;
  const defaultApplicationNumber = "9900000001";

  beforeAll(async () => {
    process.env.INSTITUTION_REQUEST_FOLDER = "Institution-Request";
    const { nestApplication, dataSource, sshClientMock } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sftpClientMock = sshClientMock;
    // Processor under test.
    processor = app.get(IER12IntegrationScheduler);
    // Default program year prefix.
    sharedProgramYearPrefix = 2000;
    referenceSubmissionDate = new Date("2000-06-01");
    // Intercept file timestamp.
    getFileNameAsCurrentTimestampMock = jest.spyOn(
      dateUtils,
      "getFileNameAsCurrentTimestamp",
    );
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    // Update all applications to Overwritten.
    await db.application.update(
      { applicationStatus: Not(ApplicationStatus.Overwritten) },
      { applicationStatus: ApplicationStatus.Overwritten },
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
        studentNumber: "12345678",
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
    const application = await saveIER12TestInputData(db, testInputData, {
      programYearPrefix: sharedProgramYearPrefix,
      submittedDate: referenceSubmissionDate,
    });

    // Queued job payload.
    const data = {
      generatedDate: getISODateOnlyString(
        application.currentAssessment.assessmentDate,
      ),
    };
    // Queued job.
    const job = createMock<Job<GeneratedDateQueueInDTO>>({ data });

    // Act
    const ier12Results = await processor.processIER12File(job);
    db.application.createQueryBuilder();
    // Assert
    const uploadedFile = getUploadedFile(sftpClientMock);

    // Assert process result.
    expect(ier12Results).toBeDefined();
    // File timestamp.
    const [timestampResult] = getFileNameAsCurrentTimestampMock.mock.results;
    expect(isValidFileTimestamp(timestampResult.value)).toBe(true);
    expect(ier12Results).toStrictEqual([
      {
        summary: [
          `The uploaded file: Institution-Request\\ZZZY\\IER_012_${timestampResult.value}.txt`,
          "The number of records: 2",
        ],
      } as QueueProcessSummaryResult,
    ]);

    // Assert file output.
    expect(uploadedFile.fileLines?.length).toBe(2);
    const [line1, line2] = uploadedFile.fileLines;
    const [firstDisbursement, secondDisbursement] =
      application.currentAssessment.disbursementSchedules;
    const assessmentId = assessmentIdToText(application.currentAssessment.id);
    // Line 1 validations.
    const firstDisbursementId = disbursementIdToText(firstDisbursement.id);
    expect(line1).toBe(
      `${assessmentId}${firstDisbursementId}${defaultApplicationNumber}            242963189Doe                      John           19980113B   SI       Address Line 1           Address Line 2           Victoria                 BC  Z1Z1Z1          Program                  Program description                               undergraduateCertificate 0001    8   0512123401234ADR2                         62000081620001205000033330000004444000000555500000066660050100F2000060120002001COMP20000601000010000000006000000009600000N NNN            20000602        000166429600000000000001664296000000000000000000001NNN000000000000000000000000000000000000000000000000000000000000NN0000000000000144430000000000000000000000000000000000007777000000336667000009874600000000000000000000000000000000000000000000002200000120000100023789650010300000 0000000000000000000000000000000000000000000000000000000000000000000000DISS2000081520000815Completed Sent      20000816                        CSLF0000100000BCSL0000000000CSGP0000200000CSGD0000300000CSGF0000400000CSGT0000500000BCAG0000700000SBSD0000900000BGPD0000800000    0000000000`,
    );
    // Line 2 validations.
    const secondDisbursementId = disbursementIdToText(secondDisbursement.id);
    expect(line2).toBe(
      `${assessmentId}${secondDisbursementId}${defaultApplicationNumber}            242963189Doe                      John           19980113B   SI       Address Line 1           Address Line 2           Victoria                 BC  Z1Z1Z1          Program                  Program description                               undergraduateCertificate 0001    8   0512123401234ADR2                         62000081620001205000033330000004444000000555500000066660050100F2000060120002001COMP20000601000010000000006000000009600000N NNN            20000602        000166429600000000000001664296000000000000000000001NNN000000000000000000000000000000000000000000000000000000000000NN0000000000000144430000000000000000000000000000000000007777000000336667000009874600000000000000000000000000000000000000000000002200000120000100023789650010300000 0000000000000000000000000000000000000000000000000000000000000000000000COER20000601        Required  Pending   20001011                        CSLF0000000000BCSL0000600000CSGP0000200000CSGD0000300000CSGF0000400000CSGT0000500000BCAG0000700000SBSD0000900000BGPD0000800000    0000000000`,
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
    const application = await saveIER12TestInputData(db, testInputData, {
      programYearPrefix: sharedProgramYearPrefix,
      submittedDate: referenceSubmissionDate,
    });

    // Queued job payload.
    const data = {
      generatedDate: getISODateOnlyString(
        application.currentAssessment.assessmentDate,
      ),
    };
    // Queued job.
    const job = createMock<Job<GeneratedDateQueueInDTO>>({ data });

    // Act
    const ier12Results = await processor.processIER12File(job);
    db.application.createQueryBuilder();
    // Assert
    const uploadedFile = getUploadedFile(sftpClientMock);

    // Assert process result.
    expect(ier12Results).toBeDefined();
    // File timestamp.
    const [timestampResult] = getFileNameAsCurrentTimestampMock.mock.results;
    expect(isValidFileTimestamp(timestampResult.value)).toBe(true);
    expect(ier12Results).toStrictEqual([
      {
        summary: [
          `The uploaded file: Institution-Request\\ZZZY\\IER_012_${timestampResult.value}.txt`,
          "The number of records: 1",
        ],
      } as QueueProcessSummaryResult,
    ]);

    // Assert file output.
    expect(uploadedFile.fileLines?.length).toBe(1);
    const [line1] = uploadedFile.fileLines;
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
    const assessmentId = assessmentIdToText(application.currentAssessment.id);
    // Line 1 validations.
    const firstDisbursementId = disbursementIdToText(firstDisbursement.id);
    expect(line1).toBe(
      `${assessmentId}${firstDisbursementId}${defaultApplicationNumber}            242963189Jane With Really Long Mon               19980113B   MA       Some Foreign Street Addre                         New York                     SOME POSTAL CODEProgram                  Program description                               undergraduateCertificate 0001    8   0512123401234ADR2                         62000081620001010000033330000004444000000555500000066660019100F2000060120002001ASMT20000601000010000000006000000004800000N NNN            20000602        000966867900000000000009668679003002001003000003005NNY000000000000000000000000000000000000000000000000000000000000NY0000000000000144430000000000000000000000000000000000007777000000150056000000000000000000000000000000000000000000003000000000050000000065430000009876120005500000 0000000000000000000000000000000000000000000000000000000000000000000000ASMT20000601        Completed Pending   20000816                        CSLF0000100000BCSL0000600000CSGP0000200000CSGD0000300000CSGF0000400000CSGT0000500000BCAG0000700000SBSD0000900000BGPD0000800000    0000000000`,
    );
  });

  it("Should generate an IER12 file with one record for a dependant and living with parents student with no dependents and one sent disbursement with no BC funding.", async () => {
    // Arrange
    const testInputData = {
      student: JOHN_DOE_FROM_CANADA,
      application: {
        applicationNumber: defaultApplicationNumber,
        studentNumber: "44444444",
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
    const application = await saveIER12TestInputData(db, testInputData, {
      programYearPrefix: sharedProgramYearPrefix,
      submittedDate: referenceSubmissionDate,
    });

    // Queued job payload.
    const data = {
      generatedDate: getISODateOnlyString(
        application.currentAssessment.assessmentDate,
      ),
    };
    // Queued job.
    const job = createMock<Job<GeneratedDateQueueInDTO>>({ data });

    // Act
    const ier12Results = await processor.processIER12File(job);
    db.application.createQueryBuilder();
    // Assert
    const uploadedFile = getUploadedFile(sftpClientMock);

    // Assert process result.
    expect(ier12Results).toBeDefined();
    // File timestamp.
    const [timestampResult] = getFileNameAsCurrentTimestampMock.mock.results;
    expect(isValidFileTimestamp(timestampResult.value)).toBe(true);
    expect(ier12Results).toStrictEqual([
      {
        summary: [
          `The uploaded file: Institution-Request\\ZZZY\\IER_012_${timestampResult.value}.txt`,
          "The number of records: 1",
        ],
      } as QueueProcessSummaryResult,
    ]);

    // Assert file output.
    expect(uploadedFile.fileLines?.length).toBe(1);
    const [line1] = uploadedFile.fileLines;
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
    const assessmentId = assessmentIdToText(application.currentAssessment.id);
    // Line 1 validations.
    const firstDisbursementId = disbursementIdToText(firstDisbursement.id);
    expect(line1).toBe(
      `${assessmentId}${firstDisbursementId}${defaultApplicationNumber}            242963189Doe                      John           19980113A   SI       Address Line 1           Address Line 2           Victoria                 BC  Z1Z1Z1          Some Program With DescripSome program with description too long            graduateDiploma          0001    5   0512123401234ADR2XYZ                      62000081620001010000033330000004444000000555500000066660019100F2000060120002001COMP20000601000000000000000000000001400000N NNN            20000602        000321200000000160000003212000000000000000000000003YYN000001429700000097000000005090000000000000000145500000002183YN0000000000000144430000000000000000000000000012129800007777000000070045000000000000000000000000000000000000000000000000000000050099000065004000046000000001400000 0000000000000000000000000000000000000000000000000000000000000000000000DISS2000081520000815Completed Sent      20000816                        CSLF0000000000BCSL0000000000CSGP0000200000CSGD0000300000CSGF0000400000CSGT0000500000BCAG0000000000SBSD0000000000BGPD0000000000    0000000000`,
    );
  });
});
