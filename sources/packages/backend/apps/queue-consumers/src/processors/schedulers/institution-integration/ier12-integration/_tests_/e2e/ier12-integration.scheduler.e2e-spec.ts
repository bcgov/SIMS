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
  ensureProgramYearExists,
  getUploadedFile,
} from "@sims/test-utils";
import * as Client from "ssh2-sftp-client";
import { Not } from "typeorm";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementScheduleStatus,
  ProgramYear,
  RelationshipStatus,
} from "@sims/sims-db";
import { IER12IntegrationScheduler } from "../../ier12-integration.scheduler";
import { saveIER12TestInputData } from "./ier12-factory";
import {
  ASSESSMENT_DATA_SINGLE_INDEPENDENT,
  AWARDS_ONE_OF_TWO_DISBURSEMENT,
  AWARDS_TWO_OF_TWO_DISBURSEMENT,
  JOHN_DOE_FROM_CANADA,
  OFFERING_2023_2024_SET_DEC_FULL_TIME,
  PROGRAM_UNDERGRADUATE_CERTIFICATE_WITHOUT_INSTITUTION_PROGRAM_CODE,
  STUDENT_SINGLE_INDEPENDENT_WITH_NO_DEPENDENTS_2023_2024,
  WORKFLOW_DATA_SINGLE_INDEPENDENT_WITH_NO_DEPENDENTS,
} from "./models/data-inputs";
import { GeneratedDateQueueInDTO } from "../../models/ier.model";

jest.setTimeout(120000);

describe(describeProcessorRootTest(QueueNames.IER12Integration), () => {
  let app: INestApplication;
  let processor: IER12IntegrationScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;
  let sharedProgramYear: ProgramYear;

  beforeAll(async () => {
    const { nestApplication, dataSource, sshClientMock } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sftpClientMock = sshClientMock;
    // Processor under test.
    processor = app.get(IER12IntegrationScheduler);
    // Default program year.
    sharedProgramYear = await ensureProgramYearExists(db, 2000);
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
        submittedDate: new Date("2023-10-20"),
        applicationStatus: ApplicationStatus.Completed,
        applicationStatusUpdatedOn: new Date("2023-10-21"),
        programYear: "2023-2024",
      },
      assessment: {
        triggerType: AssessmentTriggerType.OriginalAssessment,
        assessmentDate: new Date("2023-10-22"),
        workflowData: WORKFLOW_DATA_SINGLE_INDEPENDENT_WITH_NO_DEPENDENTS,
        assessmentData: ASSESSMENT_DATA_SINGLE_INDEPENDENT,
        disbursementSchedules: [
          {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            disbursementDate: "2023-01-23",
            updatedAt: new Date("2023-01-24"),
            dateSent: new Date("2023-01-18"),
            disbursementValues: AWARDS_ONE_OF_TWO_DISBURSEMENT,
          },
          {
            coeStatus: COEStatus.required,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
            disbursementDate: "2023-06-23",
            updatedAt: new Date("2023-06-24"),
            dateSent: undefined,
            disbursementValues: AWARDS_TWO_OF_TWO_DISBURSEMENT,
          },
        ],
      },
      educationProgram:
        PROGRAM_UNDERGRADUATE_CERTIFICATE_WITHOUT_INSTITUTION_PROGRAM_CODE,
      offering: OFFERING_2023_2024_SET_DEC_FULL_TIME,
    };

    const application = await saveIER12TestInputData(
      db,
      STUDENT_SINGLE_INDEPENDENT_WITH_NO_DEPENDENTS_2023_2024,
    );
    // Queued job payload.
    const data = {
      generatedDate: getISODateOnlyString(
        STUDENT_SINGLE_INDEPENDENT_WITH_NO_DEPENDENTS_2023_2024.assessment
          .assessmentDate,
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
      `${assessmentId}${firstDisbursementId}9879879879            242963189Doe                      John           19980113B   SI       Address Line 1           Address Line 2           Victoria                 BC  Z1Z1Z1          Program                  Program description                               undergraduateCertificate 0001    8   0512123401234ADR2                         62023060120231231000033330000004444000000555500000066660018100F2023102020232024COMP20231021000000000000011198000000400300N NNN            20231022        000119930000000011000001199300000000000000000000001NNN000006540000000000000000000000000000000000000000000000000000NN0000000000000144430000000000000000000000000000000000007777000000003300000000440000000000000000000000000000000000000000000000002200000000550000000066000001520100 0000000000000000000000000000000000000000000000000000000000000000000000DISS2023011820230118Completed Sent      20230123                        CSLF0001099800BCSL0000000000CSGP0000200100CSGD0000000000CSGF0000000000CSGT0000000000BCAG0000000000SBSD0000000000BGPD0000000000    0000000000`,
    );
    // Line 2 validations.
    const secondDisbursementId = secondDisbursement.id
      .toString()
      .padStart(10, "0");
    expect(line2).toBe(
      `${assessmentId}${secondDisbursementId}9879879879            242963189Doe                      John           19980113B   SI       Address Line 1           Address Line 2           Victoria                 BC  Z1Z1Z1          Program                  Program description                               undergraduateCertificate 0001    8   0512123401234ADR2                         62023060120231231000033330000004444000000555500000066660018100F2023102020232024COMP20231021000000000000011198000000400300N NNN            20231022        000119930000000011000001199300000000000000000000001NNN000006540000000000000000000000000000000000000000000000000000NN0000000000000144430000000000000000000000000000000000007777000000003300000000440000000000000000000000000000000000000000000000002200000000550000000066000001520100 0000000000000000000000000000000000000000000000000000000000000000000000COER20230624        Required  Pending   20230623                        CSLF0000000000BCSL0000020000CSGP0000200200CSGD0000000000CSGF0000000000CSGT0000000000BCAG0000000000SBSD0000000000BGPD0000000000    0000000000`,
    );
  });
});
