import { Job } from "bull";
import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames, getISODateOnlyString } from "@sims/utilities";
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
  ASSESSMENT_DATA_SINGLE_INDEPENDENT,
  AWARDS_ONE_OF_TWO_DISBURSEMENT,
  AWARDS_TWO_OF_TWO_DISBURSEMENT,
  JOHN_DOE_FROM_CANADA,
  OFFERING_FULL_TIME,
  PROGRAM_UNDERGRADUATE_CERTIFICATE_WITHOUT_INSTITUTION_PROGRAM_CODE,
  WORKFLOW_DATA_SINGLE_INDEPENDENT_WITH_NO_DEPENDENTS,
} from "./models/data-inputs";
import { GeneratedDateQueueInDTO } from "../../models/ier.model";

jest.setTimeout(120000);

// TODO
// Improve saveIER12TestInputData
// 1 - Segregate the method into smaller private methods.
// 2 - Does the IER12TestInputData needs further improvements?
// 3 - Maybe try to use for pick for the IER12TestInputData child properties.
// E2E asserts
// 1 - Assert the file name
// 2 - Assert the process log output.
// 3 - Create/reuse helper methods to simulate the below.
// 3.1 - hasMultipleApplicationSubmissions
// 3.2 - hasActiveStopFullTimeDisbursement
// 3.3 - hasAwardWithheldDueToRestriction
// 3.4 - hasFullTimeDisbursementFeedbackErrors
// 3.5 - Consider creation a helper for one of the above and create the PR.

describe(describeProcessorRootTest(QueueNames.IER12Integration), () => {
  let app: INestApplication;
  let processor: IER12IntegrationScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;
  let sharedProgramYearPrefix: number;
  let referenceSubmissionDate: Date;

  beforeAll(async () => {
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
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    // Update all applications to Overwritten.
    await db.application.update(
      { applicationStatus: Not(ApplicationStatus.Overwritten) },
      { applicationStatus: ApplicationStatus.Overwritten },
    );
  });

  it("Should generate an IER12 file with one record for a single student with no dependents and one disbursements.", async () => {
    // Arrange
    const testInputData = {
      student: JOHN_DOE_FROM_CANADA,
      application: {
        applicationNumber: "9879879879",
        studentNumber: "12345678",
        relationshipStatus: RelationshipStatus.Single,
        submittedDate: undefined,
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
    // Assert file output.
    expect(uploadedFile.fileLines?.length).toBe(2);
    const [line1, line2] = uploadedFile.fileLines;
    const [firstDisbursement, secondDisbursement] =
      application.currentAssessment.disbursementSchedules;
    const assessmentId = application.currentAssessment.id
      .toString()
      .padStart(10, "0");
    // Line 1 validations.
    const firstDisbursementId = firstDisbursement.id
      .toString()
      .padStart(10, "0");
    expect(line1).toBe(
      `${assessmentId}${firstDisbursementId}9879879879            242963189Doe                      John           19980113B   SI       Address Line 1           Address Line 2           Victoria                 BC  Z1Z1Z1          Program                  Program description                               undergraduateCertificate 0001    8   0512123401234ADR2                         62000081620001205000033330000004444000000555500000066660050100F2000060120002001COMP20000601000010000000006000000009600000N NNN            20000602        000166429600000000000001664296000000000000000000001NNN000000000000000000000000000000000000000000000000000000000000NN0000000000000144430000000000000000000000000000000000007777000000000NaN000009874600000000000000000000000000000000000000000000002200000120000100023789650010300000 0000000000000000000000000000000000000000000000000000000000000000000000DISS2000081520000815Completed Sent      20000816                        CSLF0000100000BCSL0000000000CSGP0000200000CSGD0000300000CSGF0000400000CSGT0000500000BCAG0000700000SBSD0000900000BGPD0000800000    0000000000`,
    );
    // Line 2 validations.
    const secondDisbursementId = secondDisbursement.id
      .toString()
      .padStart(10, "0");
    expect(line2).toBe(
      `${assessmentId}${secondDisbursementId}9879879879            242963189Doe                      John           19980113B   SI       Address Line 1           Address Line 2           Victoria                 BC  Z1Z1Z1          Program                  Program description                               undergraduateCertificate 0001    8   0512123401234ADR2                         62000081620001205000033330000004444000000555500000066660050100F2000060120002001COMP20000601000010000000006000000009600000N NNN            20000602        000166429600000000000001664296000000000000000000001NNN000000000000000000000000000000000000000000000000000000000000NN0000000000000144430000000000000000000000000000000000007777000000000NaN000009874600000000000000000000000000000000000000000000002200000120000100023789650010300000 0000000000000000000000000000000000000000000000000000000000000000000000COER20000601        Required  Pending   20001011                        CSLF0000000000BCSL0000600000CSGP0000200000CSGD0000300000CSGF0000400000CSGT0000500000BCAG0000700000SBSD0000900000BGPD0000800000    0000000000`,
    );
  });
});
