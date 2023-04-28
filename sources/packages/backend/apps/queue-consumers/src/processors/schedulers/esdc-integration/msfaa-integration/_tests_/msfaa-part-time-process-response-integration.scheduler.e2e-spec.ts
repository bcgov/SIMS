import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames, getISODateOnlyString } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../../../test/helpers";
import { PartTimeMSFAAProcessResponseIntegrationScheduler } from "../msfaa-part-time-process-response-integration.scheduler";
import {
  E2EDataSources,
  createE2EDataSources,
  mockDownloadFiles,
} from "@sims/test-utils";
import * as Client from "ssh2-sftp-client";
import { Job } from "bull";
import * as path from "path";
import {
  MSFAA_PART_TIME_MARRIED,
  MSFAA_PART_TIME_OTHER_COUNTRY,
  MSFAA_PART_TIME_RELATIONSHIP_OTHER,
} from "./msfaa-part-time-process-integration.scheduler.models";
import { saveMSFAATestInputsData } from "./msfaa-factory";
import { In, IsNull } from "typeorm";

describe(
  describeProcessorRootTest(QueueNames.PartTimeMSFAAProcessResponseIntegration),
  () => {
    let app: INestApplication;
    let processor: PartTimeMSFAAProcessResponseIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;

    beforeAll(async () => {
      process.env.ESDC_RESPONSE_FOLDER = path.join(
        __dirname,
        "msfaa-receive-files",
      );
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(PartTimeMSFAAProcessResponseIntegrationScheduler);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      // Force any not signed MSFAA to be signed to ensure that new
      // ones created will be the only ones available to be updated.
      await db.msfaaNumber.update(
        { dateSigned: IsNull() },
        { dateSigned: getISODateOnlyString(new Date()) },
      );
      // Cancel any pending MSFAA.
      await db.msfaaNumber.update(
        { cancelledDate: IsNull() },
        { cancelledDate: getISODateOnlyString(new Date()) },
      );
    });

    it("Should process an MSFAA response with confirmations and a cancellation and update all records when the file is received as expected.", async () => {
      // Arrange
      const msfaaInputData = [
        MSFAA_PART_TIME_MARRIED,
        MSFAA_PART_TIME_OTHER_COUNTRY,
        MSFAA_PART_TIME_RELATIONSHIP_OTHER,
      ];
      const createdMSFAARecords = await saveMSFAATestInputsData(
        db,
        msfaaInputData,
      );

      // Queued job.
      const job = createMock<Job<void>>();

      mockDownloadFiles(sftpClientMock, [
        "msfaa-part-time-receive-file-with-cancelation-record.dat",
      ]);

      // Act
      const processResult = await processor.processMSFAAResponses(job);

      // Assert
      expect(processResult).toBe([
        "Processing file msfaa-part-time-receive-file-with-cancelation-record.dat.",
        "File contains:",
        "Confirmed MSFAA (type R): 2.",
        "Cancelled MSFAA (type C): 1.",
        "Record from line 1, updated as confirmed.",
        "Record from line 3, updated as confirmed.",
        "Record from line 2, updated as canceled.",
      ]);
      // Find the updated MSFAA records previously created.
      const msfaaIDs = createdMSFAARecords.map((msfaa) => msfaa.id);
      const msfaaUpdatedRecords = await db.msfaaNumber.find({
        select: {
          msfaaNumber: true,
          dateSigned: true,
          serviceProviderReceivedDate: true,
          cancelledDate: true,
          newIssuingProvince: true,
        },
        where: {
          id: In(msfaaIDs),
        },
        order: {
          msfaaNumber: "ASC",
        },
      });
      expect(msfaaUpdatedRecords).toHaveLength(msfaaInputData.length);
      const [fistSignedMSFAA, cancelledMSFAA, secondSignedMSFAA] =
        msfaaUpdatedRecords;
      // Validate fist confirmed record.
      expect(fistSignedMSFAA.dateSigned).toBe("2021-11-20");
      expect(fistSignedMSFAA.serviceProviderReceivedDate).toBe("2021-11-21");
      // Validate cancelled record.
      expect(cancelledMSFAA.cancelledDate).toBe("2021-11-24");
      expect(cancelledMSFAA.newIssuingProvince).toBe("ON");
      // Validate second confirmed record.
      expect(secondSignedMSFAA.dateSigned).toBe("2021-11-22");
      expect(secondSignedMSFAA.serviceProviderReceivedDate).toBe("2021-11-23");
    });
  },
);
