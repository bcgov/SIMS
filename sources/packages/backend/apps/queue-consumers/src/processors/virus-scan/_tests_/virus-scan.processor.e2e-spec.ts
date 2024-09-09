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
import { ClamAVError, ClamAVService } from "@sims/services";
import { VirusScanQueueInDTO } from "@sims/services/queue";
import { VirusScanProcessor } from "../virus-scan.processor";
import { VirusScanStatus } from "@sims/sims-db";
import * as path from "path";
import { INFECTED_FILENAME_SUFFIX } from "../../../services";

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
    jest.clearAllMocks();
  });

  it("Should throw an error when the student file is not found during virus scanning.", async () => {
    // Arrange
    const studentFile = createFakeStudentFileUpload();
    studentFile.virusScanStatus = VirusScanStatus.InProgress;
    await db.studentFile.save(studentFile);
    const fakeUniqueFileName = "file.random";
    const mockedJob = mockBullJob<VirusScanQueueInDTO>({
      uniqueFileName: fakeUniqueFileName,
      fileName: studentFile.fileName,
    });

    // Act
    const errorMessage = `File ${fakeUniqueFileName} is not found or has already been scanned for viruses. Scanning the file for viruses is aborted.`;
    await expect(
      processor.performVirusScan(mockedJob.job),
    ).rejects.toStrictEqual(new Error(errorMessage));
    expect(
      mockedJob.containLogMessages([
        "Log details",
        "Starting virus scan.",
        errorMessage,
      ]),
    ).toBe(true);
  });

  it("Should throw an error when the connection to the virus scan server failed.", async () => {
    // Arrange
    const studentFile = createFakeStudentFileUpload();
    studentFile.virusScanStatus = VirusScanStatus.InProgress;
    await db.studentFile.save(studentFile);
    clamAVServiceMock.scanFile = jest.fn(() => {
      throw new ClamAVError("Connection refused", "ECONNREFUSED");
    }); // Queued job.
    const mockedJob = mockBullJob<VirusScanQueueInDTO>({
      uniqueFileName: studentFile.uniqueFileName,
      fileName: studentFile.fileName,
    });

    // Act
    const errorMessage = `Unable to scan the file ${studentFile.uniqueFileName} for viruses. Connection to ClamAV server failed.`;
    await expect(
      processor.performVirusScan(mockedJob.job),
    ).rejects.toStrictEqual(new Error(errorMessage));
    expect(
      mockedJob.containLogMessages([
        "Log details",
        "Starting virus scan.",
        errorMessage,
      ]),
    ).toBe(true);
    const scannedStudentFile = await db.studentFile.findOneBy({
      id: studentFile.id,
    });
    expect(scannedStudentFile.virusScanStatus).toBe(VirusScanStatus.Pending);
    expect(scannedStudentFile.fileName).toBe(studentFile.fileName);
  });

  it("Should throw an error when the virus scan server is unavailable.", async () => {
    // Arrange
    const studentFile = createFakeStudentFileUpload();
    studentFile.virusScanStatus = VirusScanStatus.InProgress;
    await db.studentFile.save(studentFile);
    clamAVServiceMock.scanFile = jest.fn(() => {
      throw new ClamAVError("Server not found", "ENOTFOUND");
    }); // Queued job.
    const mockedJob = mockBullJob<VirusScanQueueInDTO>({
      uniqueFileName: studentFile.uniqueFileName,
      fileName: studentFile.fileName,
    });

    // Act
    const errorMessage = `Unable to scan the file ${studentFile.uniqueFileName} for viruses. ClamAV server is unavailable.`;
    await expect(
      processor.performVirusScan(mockedJob.job),
    ).rejects.toStrictEqual(new Error(errorMessage));
    expect(
      mockedJob.containLogMessages([
        "Log details",
        "Starting virus scan.",
        errorMessage,
      ]),
    ).toBe(true);
    const scannedStudentFile = await db.studentFile.findOneBy({
      id: studentFile.id,
    });
    expect(scannedStudentFile.virusScanStatus).toBe(VirusScanStatus.Pending);
    expect(scannedStudentFile.fileName).toBe(studentFile.fileName);
  });

  it("Should throw an error when an unknown error occurred during virus scanning.", async () => {
    // Arrange
    const studentFile = createFakeStudentFileUpload();
    studentFile.virusScanStatus = VirusScanStatus.InProgress;
    await db.studentFile.save(studentFile);
    clamAVServiceMock.scanFile = jest.fn(() => {
      throw new ClamAVError("Unknown error", undefined);
    }); // Queued job.
    const mockedJob = mockBullJob<VirusScanQueueInDTO>({
      uniqueFileName: studentFile.uniqueFileName,
      fileName: studentFile.fileName,
    });

    // Act
    const errorMessage = `Unable to scan the file ${studentFile.uniqueFileName} for viruses. Unknown error.`;
    await expect(
      processor.performVirusScan(mockedJob.job),
    ).rejects.toStrictEqual(new Error(errorMessage));
    expect(
      mockedJob.containLogMessages([
        "Log details",
        "Starting virus scan.",
        errorMessage,
        errorMessage,
      ]),
    ).toBe(true);
    const scannedStudentFile = await db.studentFile.findOneBy({
      id: studentFile.id,
    });
    expect(scannedStudentFile.virusScanStatus).toBe(VirusScanStatus.Pending);
    expect(scannedStudentFile.fileName).toBe(studentFile.fileName);
  });

  it("Should throw an error when file scanning failed during virus scanning.", async () => {
    // Arrange
    const studentFile = createFakeStudentFileUpload();
    studentFile.virusScanStatus = VirusScanStatus.InProgress;
    await db.studentFile.save(studentFile);
    clamAVServiceMock.scanFile = jest.fn(() => Promise.resolve(null));
    const mockedJob = mockBullJob<VirusScanQueueInDTO>({
      uniqueFileName: studentFile.uniqueFileName,
      fileName: studentFile.fileName,
    });

    // Act
    const errorMessage = `Unable to scan the file ${studentFile.uniqueFileName} for viruses. File scanning failed due to unknown error.`;
    await expect(
      processor.performVirusScan(mockedJob.job),
    ).rejects.toStrictEqual(new Error(errorMessage));
    expect(
      mockedJob.containLogMessages([
        "Log details",
        "Starting virus scan.",
        errorMessage,
      ]),
    ).toBe(true);
    const scannedStudentFile = await db.studentFile.findOneBy({
      id: studentFile.id,
    });
    expect(scannedStudentFile.virusScanStatus).toBe(VirusScanStatus.Pending);
    expect(scannedStudentFile.fileName).toBe(studentFile.fileName);
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
});
