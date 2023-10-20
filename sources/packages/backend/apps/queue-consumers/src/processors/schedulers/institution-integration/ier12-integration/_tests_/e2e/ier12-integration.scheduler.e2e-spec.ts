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
import { ApplicationStatus } from "@sims/sims-db";
import { IER12IntegrationScheduler } from "../../ier12-integration.scheduler";
import { saveIER12TestInputData } from "./ier12-factory";
import { SINGLE_INDEPENDENT_WITH_NO_DEPENDENTS_STUDENT } from "./models/ier12-test-input-data.models";
import { GeneratedDateQueueInDTO } from "../../models/ier.model";

jest.setTimeout(120000);

describe(describeProcessorRootTest(QueueNames.IER12Integration), () => {
  let app: INestApplication;
  let processor: IER12IntegrationScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;

  beforeAll(async () => {
    const { nestApplication, dataSource, sshClientMock } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sftpClientMock = sshClientMock;
    // Processor under test.
    processor = app.get(IER12IntegrationScheduler);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    // Update all applications to Overwritten.
    await db.application.update(
      { applicationStatus: Not(ApplicationStatus.Overwritten) },
      { applicationStatus: ApplicationStatus.Overwritten },
    );
  });

  it("Should generate an IER12 file with one record for a single student with no dependents and two disbursements.", async () => {
    // Arrange
    await saveIER12TestInputData(
      db,
      SINGLE_INDEPENDENT_WITH_NO_DEPENDENTS_STUDENT,
    );
    // Queued job payload.
    const data = {
      generatedDate: getISODateOnlyString(
        SINGLE_INDEPENDENT_WITH_NO_DEPENDENTS_STUDENT.assessment.assessmentDate,
      ),
    };
    // Queued job.
    const job = createMock<Job<GeneratedDateQueueInDTO>>({ data });

    // Act
    const ier12Results = await processor.processIER12File(job);

    // Assert
    const uploadedFile = getUploadedFile(sftpClientMock);

    // Assert process result.
    expect(ier12Results).toBeDefined();
    // expect(msfaaRequestResults).toStrictEqual([
    //   {
    //     generatedFile: uploadedFile.remoteFilePath,
    //     uploadedRecords: msfaaInputData.length,
    //     offeringIntensity: OfferingIntensity.partTime,
    //   },
    // ]);

    // Assert file output.
    expect(uploadedFile.fileLines?.length).toBe(2);
    const [ier12Record] = uploadedFile.fileLines;
    // Validate header.
    expect(ier12Record).toBe("");
  });
});
