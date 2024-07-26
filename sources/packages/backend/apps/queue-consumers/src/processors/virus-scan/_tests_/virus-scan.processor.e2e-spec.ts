import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../test/helpers";
import {
  createE2EDataSources,
  createFakeStudentFileUpload,
  E2EDataSources,
} from "@sims/test-utils";
import { ClamAVService } from "@sims/services";
import { VirusScanQueueInDTO } from "@sims/services/queue/dto/virus-scan.dto";
import { VirusScanProcessor } from "../virus-scan.processor";
import { VirusScanStatus } from "@sims/sims-db/entities/virus-scan-status-type";
import * as path from "path";
import { INFECTED_FILENAME_SUFFIX } from "../../../services";

describe(
  describeProcessorRootTest(QueueNames.CancelApplicationAssessment),
  () => {
    let app: INestApplication;
    let db: E2EDataSources;
    let processor: VirusScanProcessor;
    let clamAVServiceMock: ClamAVService;

    beforeAll(async () => {
      const {
        nestApplication,
        dataSource,
        clamAVServiceMock: clamAVServiceFromAppModule,
      } = await createTestingAppModule();
      app = nestApplication;
      // Processor under test.
      processor = app.get(VirusScanProcessor);
      clamAVServiceMock = clamAVServiceFromAppModule;
      db = createE2EDataSources(dataSource);
    });

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it("Should update the file name and status when virus is detected.", async () => {
      // Arrange
      const studentFile = createFakeStudentFileUpload();
      studentFile.virusScanStatus = VirusScanStatus.InProgress;
      await db.studentFile.save(studentFile);
      clamAVServiceMock.scanFile = jest.fn(() => Promise.resolve(true));
      // Queued job.
      const mockedJob = mockBullJob<VirusScanQueueInDTO>({
        uniqueFileName: studentFile.uniqueFileName,
        fileName: studentFile.fileName,
      });

      // Act
      const result = await processor.performVirusScan(mockedJob.job);

      expect(result).toStrictEqual({
        fileProcessed: studentFile.fileName,
        isInfected: true,
      });
      expect(
        mockedJob.containLogMessages([
          "Log details",
          "Starting virus scan.",
          "Virus found.",
          "Updating infected file name and status.",
          "Completed virus scanning for the file.",
        ]),
      ).toBe(true);
      // Assert
      const scannedStudentFile = await db.studentFile.findOneBy({
        id: studentFile.id,
      });
      expect(scannedStudentFile.virusScanStatus).toBe(
        VirusScanStatus.VirusDetected,
      );
      const fileName = path.parse(studentFile.fileName).name;
      const fileExtension = path.parse(studentFile.fileName).ext;
      const infectedFileName = `${fileName}${INFECTED_FILENAME_SUFFIX}${fileExtension}`;
      expect(scannedStudentFile.fileName).toBe(infectedFileName);
    });

    it("Should update the file status when no virus is detected.", async () => {
      // Arrange
      const studentFile = createFakeStudentFileUpload();
      studentFile.virusScanStatus = VirusScanStatus.InProgress;
      await db.studentFile.save(studentFile);
      clamAVServiceMock.scanFile = jest.fn(() => Promise.resolve(false));
      // Queued job.
      const mockedJob = mockBullJob<VirusScanQueueInDTO>({
        uniqueFileName: studentFile.uniqueFileName,
        fileName: studentFile.fileName,
      });

      // Act
      const result = await processor.performVirusScan(mockedJob.job);

      expect(result).toStrictEqual({
        fileProcessed: studentFile.fileName,
        isInfected: false,
      });
      expect(
        mockedJob.containLogMessages([
          "Log details",
          "Starting virus scan.",
          "No virus found.",
          "Completed virus scanning for the file.",
        ]),
      ).toBe(true);
      // Assert
      const scannedStudentFile = await db.studentFile.findOneBy({
        id: studentFile.id,
      });
      expect(scannedStudentFile.virusScanStatus).toBe(
        VirusScanStatus.FileIsClean,
      );
      expect(scannedStudentFile.fileName).toBe(studentFile.fileName);
    });
  },
);
