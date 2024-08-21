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
import { VirusScanQueueInDTO } from "@sims/services/queue";
import { VirusScanProcessor } from "../virus-scan.processor";
import { VirusScanStatus } from "@sims/sims-db";
import * as path from "path";
import { INFECTED_FILENAME_SUFFIX } from "../../../services";
import {
  CONNECTION_FAILED,
  FILE_NOT_FOUND,
  SERVER_UNAVAILABLE,
  UNKNOWN_ERROR,
} from "@sims/services/constants";

describe(describeProcessorRootTest(QueueNames.FileVirusScanProcessor), () => {
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

  it("Should throw an error when the student file is not found during scanning process.", async () => {
    // Arrange
    const studentFile = createFakeStudentFileUpload();
    studentFile.virusScanStatus = VirusScanStatus.InProgress;
    await db.studentFile.save(studentFile);
    clamAVServiceMock.scanFile = jest.fn(() =>
      Promise.resolve({
        isInfected: null,
        errorCode: FILE_NOT_FOUND,
      }),
    ); // Queued job.
    const mockedJob = mockBullJob<VirusScanQueueInDTO>({
      uniqueFileName: "file.random",
      fileName: studentFile.fileName,
    });

    // Act
    const result = await processor.performVirusScan(mockedJob.job);

    expect(result).toStrictEqual({
      fileProcessed: studentFile.fileName,
      isInfected: null,
      isServerAvailable: true,
    });
    expect(
      mockedJob.containLogMessages([
        "Log details",
        "Starting virus scan.",
        `File file.random is not found or has already been scanned for viruses. Scanning the file for viruses is aborted.`,
      ]),
    ).toBe(true);
  });

  it("Should throw an error when the connection to the virus scan server failed.", async () => {
    // Arrange
    const studentFile = createFakeStudentFileUpload();
    studentFile.virusScanStatus = VirusScanStatus.InProgress;
    await db.studentFile.save(studentFile);
    clamAVServiceMock.scanFile = jest.fn(() =>
      Promise.resolve({
        isInfected: null,
        errorCode: CONNECTION_FAILED,
      }),
    ); // Queued job.
    const mockedJob = mockBullJob<VirusScanQueueInDTO>({
      uniqueFileName: studentFile.uniqueFileName,
      fileName: studentFile.fileName,
    });

    // Act
    const result = await processor.performVirusScan(mockedJob.job);

    expect(result).toStrictEqual({
      fileProcessed: studentFile.fileName,
      isInfected: null,
      isServerAvailable: true,
    });
    expect(
      mockedJob.containLogMessages([
        "Log details",
        "Starting virus scan.",
        `Unable to scan the file ${studentFile.uniqueFileName} for viruses. Connection to ClamAV server failed.`,
      ]),
    ).toBe(true);
  });

  it("Should throw an error when the virus scan server is unavailable.", async () => {
    // Arrange
    const studentFile = createFakeStudentFileUpload();
    studentFile.virusScanStatus = VirusScanStatus.InProgress;
    await db.studentFile.save(studentFile);
    clamAVServiceMock.scanFile = jest.fn(() =>
      Promise.resolve({
        isInfected: null,
        errorCode: SERVER_UNAVAILABLE,
      }),
    ); // Queued job.
    const mockedJob = mockBullJob<VirusScanQueueInDTO>({
      uniqueFileName: studentFile.uniqueFileName,
      fileName: studentFile.fileName,
    });

    // Act
    const result = await processor.performVirusScan(mockedJob.job);

    expect(result).toStrictEqual({
      fileProcessed: studentFile.fileName,
      isInfected: null,
      isServerAvailable: false,
    });
    expect(
      mockedJob.containLogMessages([
        "Log details",
        "Starting virus scan.",
        `Unable to scan the file ${studentFile.uniqueFileName} for viruses. ClamAV server is unavailable.`,
      ]),
    ).toBe(true);
  });

  it("Should throw an error when an unknown error occurred during virus scanning.", async () => {
    // Arrange
    const studentFile = createFakeStudentFileUpload();
    studentFile.virusScanStatus = VirusScanStatus.InProgress;
    await db.studentFile.save(studentFile);
    clamAVServiceMock.scanFile = jest.fn(() =>
      Promise.resolve({
        isInfected: null,
        errorCode: UNKNOWN_ERROR,
      }),
    ); // Queued job.
    const mockedJob = mockBullJob<VirusScanQueueInDTO>({
      uniqueFileName: studentFile.uniqueFileName,
      fileName: studentFile.fileName,
    });

    // Act
    const result = await processor.performVirusScan(mockedJob.job);

    expect(result).toStrictEqual({
      fileProcessed: studentFile.fileName,
      isInfected: null,
      isServerAvailable: true,
    });
    expect(
      mockedJob.containLogMessages([
        "Log details",
        "Starting virus scan.",
        `Unable to scan the file ${studentFile.uniqueFileName} for viruses. Unknown error.`,
      ]),
    ).toBe(true);
  });

  it("Should update the file name and status when virus is detected.", async () => {
    // Arrange
    const studentFile = createFakeStudentFileUpload();
    studentFile.virusScanStatus = VirusScanStatus.InProgress;
    await db.studentFile.save(studentFile);
    clamAVServiceMock.scanFile = jest.fn(() =>
      Promise.resolve({
        isInfected: true,
        errorCode: "",
      }),
    );
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
      isServerAvailable: true,
    });
    expect(
      mockedJob.containLogMessages([
        "Log details",
        "Starting virus scan.",
        "Virus found.",
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
    const fileInfo = path.parse(studentFile.fileName);
    const infectedFileName = `${fileInfo.name}${INFECTED_FILENAME_SUFFIX}${fileInfo.ext}`;
    expect(scannedStudentFile.fileName).toBe(infectedFileName);
  });

  it("Should update the file status when no virus is detected.", async () => {
    // Arrange
    const studentFile = createFakeStudentFileUpload();
    studentFile.virusScanStatus = VirusScanStatus.InProgress;
    await db.studentFile.save(studentFile);
    clamAVServiceMock.scanFile = jest.fn(() =>
      Promise.resolve({
        isInfected: false,
        errorCode: "",
      }),
    );
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
      isServerAvailable: true,
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
});
