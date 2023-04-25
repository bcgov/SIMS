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
  getUploadedFile,
} from "@sims/test-utils";
import * as Client from "ssh2-sftp-client";
import { IsNull } from "typeorm";
import { saveMSFAATestInputsData } from "./msfaa-factory";
import {
  MSFAA_PART_TIME_MARRIED,
  MSFAA_PART_TIME_OTHER_COUNTRY,
  MSFAA_PART_TIME_RELATIONSHIP_OTHER,
} from "./msfaa-part-time-process-integration.scheduler.models";

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
      await saveMSFAATestInputsData(
        db,
        MSFAA_PART_TIME_MARRIED,
        MSFAA_PART_TIME_OTHER_COUNTRY,
        MSFAA_PART_TIME_RELATIONSHIP_OTHER,
      );
      // Queued job.
      const job = createMock<Job<void>>();

      // Act
      await processor.processMSFAA(job);

      // Assert
      const uploadedFile = getUploadedFile(sftpClientMock);
      expect(uploadedFile.remoteFilePath).toBeDefined();
      expect(uploadedFile.fileLines?.length).toBe(5);
      const [
        header,
        msfaaPartTimeMarried,
        msfaaPartTimeOtherCountry,
        msfaaPartTimeRelationshipOther,
        footer,
      ] = uploadedFile.fileLines;
      expect(header.substring(0, 47)).toBe(
        "100BC  MSFAA SENT                              ",
      );
      expect(msfaaPartTimeMarried).toBe(
        "2000000001000900000000PABCD1995062920230425Doe                      John              MMAddress Line 1                          Address Line 2                          Calgary                  AB  H1H 1H1         Canada              1111111111          john.doe@somedomain.com                                                                                                                                                                                                                    PT                                                                                                              ",
      );
      expect(msfaaPartTimeOtherCountry).toBe(
        "2000000001001900000001PEFDG1999123120230425Other Doe                Jane              OSAddress Line 1                                                                  Some city on United StateBC                  United States       222222222222222     jane.doe@somedomain.com                                                                                                                                                                                                                    PT                                                                                                              ",
      );
      expect(msfaaPartTimeRelationshipOther).toBe(
        "2000000001002900000002PIHKL2001123020230425Other Doe                Other John        FOAddress Line 1                          Address Line 2                          Victoria                 BC  H1H 1H1         Canada              99999999999999999999jane.doe@someotherdomain.com                                                                                                                                                                                                               PT                                                                                                              ",
      );
      expect(footer).toBe(
        "999MSFAA SENT                              000000003000002700000003                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     ",
      );
    });
  },
);
