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
import { In, IsNull } from "typeorm";
import { saveMSFAATestInputsData } from "./msfaa-factory";
import {
  MSFAA_PART_TIME_MARRIED,
  MSFAA_PART_TIME_OTHER_COUNTRY,
  MSFAA_PART_TIME_RELATIONSHIP_OTHER,
} from "./msfaa-process-integration.scheduler.models";
import { OfferingIntensity } from "@sims/sims-db";
import {
  createMSFAARequestContentSpyOnMock,
  getMSFAASequenceGroupName,
  getProcessDateFromMSFAARequestContent,
} from "./msfaa-helper";
import * as dayjs from "dayjs";

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
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(PartTimeMSFAAProcessIntegrationScheduler);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      // Expected sequence control group name.
      const msfaaSequenceGroupName = getMSFAASequenceGroupName(
        OfferingIntensity.partTime,
      );
      // Reset MSFAA part time number.
      await db.sequenceControl.delete({ sequenceName: msfaaSequenceGroupName });
      // Cancel any pending MSFAA.
      await db.msfaaNumber.update(
        { cancelledDate: IsNull() },
        { cancelledDate: getISODateOnlyString(new Date()) },
      );
    });

    it("Should generate an MSFAA part-time file and update the dateRequested when there are pending MSFAA records.", async () => {
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
      // Spy on the MSFAA content creation to intercept the process date and time used.
      const createMSFAARequestContentMock =
        createMSFAARequestContentSpyOnMock(app);

      // Act
      const msfaaRequestResults = await processor.processMSFAA(job);

      // Assert
      expect(createMSFAARequestContentMock).toHaveBeenCalledTimes(1);
      const { processDate, processDateFormatted, processTimeFormatted } =
        getProcessDateFromMSFAARequestContent(createMSFAARequestContentMock);
      const uploadedFile = getUploadedFile(sftpClientMock);
      expect(uploadedFile.remoteFilePath).toBe(
        `MSFT-Request\\DPBC.EDU.MSFA.SENT.PT.${processDateFormatted}.001`,
      );
      // Assert process result.
      expect(msfaaRequestResults).toStrictEqual([
        {
          generatedFile: uploadedFile.remoteFilePath,
          uploadedRecords: msfaaInputData.length,
          offeringIntensity: OfferingIntensity.partTime,
        },
      ]);

      // Assert file output.
      expect(uploadedFile.fileLines?.length).toBe(msfaaInputData.length + 2);
      const [
        header,
        msfaaPartTimeMarried,
        msfaaPartTimeOtherCountry,
        msfaaPartTimeRelationshipOther,
        footer,
      ] = uploadedFile.fileLines;
      // Validate header.
      expect(header).toBe(
        `100BC  MSFAA SENT                              ${processDateFormatted}${processTimeFormatted}000001                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `,
      );
      // Validate records.
      expect(msfaaPartTimeMarried).toBe(
        `2000000001000900000000PABCD19950630${processDateFormatted}Doe                      John              MMAddress Line 1                          Address Line 2                          Calgary                  AB  H1H 1H1         Canada              1111111111          john.doe@somedomain.com                                                                                                                                                                                                                    PT                                                                                                              `,
      );
      expect(msfaaPartTimeOtherCountry).toBe(
        `2000000001001900000001PEFDG20000101${processDateFormatted}Other Doe                Jane              OSAddress Line 1                                                                  Some city on United State                    United States       222222222222222     jane.doe@somedomain.com                                                                                                                                                                                                                    PT                                                                                                              `,
      );
      expect(msfaaPartTimeRelationshipOther).toBe(
        `2000000001002900000002PIHKL20011231${processDateFormatted}Other Doe                Other John        FOAddress Line 1                          Address Line 2                          Victoria                 BC  H1H 1H1         Canada              99999999999999999999jane.doe@someotherdomain.com                                                                                                                                                                                                               PT                                                                                                              `,
      );
      // Validate static footer.
      expect(footer).toBe(
        "999MSFAA SENT                              000000003000002700000003                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     ",
      );

      // Assert database changes.
      // Find the updated MSFAA records previously created.
      const msfaaIDs = createdMSFAARecords.map((msfaa) => msfaa.id);
      const msfaaUpdatedRecords = await db.msfaaNumber.find({
        select: {
          dateRequested: true,
        },
        where: {
          id: In(msfaaIDs),
        },
      });
      const allMSFAAsHaveDateRequested = msfaaUpdatedRecords.every((msfaa) =>
        dayjs(msfaa.dateRequested).isSame(processDate),
      );
      expect(allMSFAAsHaveDateRequested).toBe(true);
    });
  },
);
