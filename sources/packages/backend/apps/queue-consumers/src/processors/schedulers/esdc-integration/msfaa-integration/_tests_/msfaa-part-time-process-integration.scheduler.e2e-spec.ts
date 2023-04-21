import { Job } from "bull";
import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames, getISODateOnlyString } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../../../test/helpers";
import { PartTimeMSFAAProcessIntegrationScheduler } from "../msfaa-part-time-process-integration.scheduler";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeMSFAANumber,
  getUploadedFile,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import { OfferingIntensity, RelationshipStatus } from "@sims/sims-db";
import * as Client from "ssh2-sftp-client";
import { IsNull } from "typeorm";

describe(
  describeProcessorRootTest(QueueNames.PartTimeMSFAAProcessIntegration),
  () => {
    let app: INestApplication;
    let processor: PartTimeMSFAAProcessIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;

    beforeAll(async () => {
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(PartTimeMSFAAProcessIntegrationScheduler);
      db = createE2EDataSources(dataSource);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      // Cancel any pending MSFAA.
      await db.msfaaNumber.update(
        { cancelledDate: IsNull() },
        { cancelledDate: getISODateOnlyString(new Date()) },
      );
    });

    it("Should generate an MSFAA part-time file when there are pending MSFAA records.", async () => {
      // Arrange

      // Student.
      const student = await saveFakeStudent(db.dataSource);
      student.gender = "male";
      await db.student.save(student);
      // Application.
      const referenceApplication = await saveFakeApplication(db.dataSource, {
        student,
      });
      referenceApplication.relationshipStatus = RelationshipStatus.Single;
      await db.application.save(referenceApplication);
      // Offering.
      const offering = referenceApplication.currentAssessment.offering;
      offering.offeringIntensity = OfferingIntensity.partTime;
      await db.educationProgramOffering.save(offering);
      // MSFAA.
      const msfaa = createFakeMSFAANumber({
        student,
        referenceApplication,
      });
      msfaa.dateRequested = null;
      msfaa.dateSigned = null;
      msfaa.serviceProviderReceivedDate = null;
      msfaa.offeringIntensity = OfferingIntensity.partTime;
      await db.msfaaNumber.save(msfaa);
      // Queued job.
      const job = createMock<Job<void>>();

      // Act
      await processor.processMSFAA(job);

      // Assert
      const uploadedFile = getUploadedFile(sftpClientMock);
      expect(uploadedFile.remoteFilePath).toBeDefined();
      expect(uploadedFile.fileLines?.length).toBe(3);
    });
  },
);
