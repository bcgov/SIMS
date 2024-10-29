import { DeepMocked } from "@golevelup/ts-jest";
import MockDate from "mockdate";
import { INestApplication } from "@nestjs/common";
import { formatDate, QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeUser,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import * as Client from "ssh2-sftp-client";
import { SIMSToSFASIntegrationScheduler } from "../sims-to-sfas-integration.scheduler";
import { OfferingIntensity, Student } from "@sims/sims-db";
import { getUploadedFile } from "@sims/test-utils/mocks";
import { MoreThan } from "typeorm";
import { addMilliSeconds, addYears } from "@sims/test-utils/utils";

describe(describeProcessorRootTest(QueueNames.SIMSToSFASIntegration), () => {
  let app: INestApplication;
  let processor: SIMSToSFASIntegrationScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;
  const DATE_FORMAT = "YYYYMMDD";

  beforeAll(async () => {
    const { nestApplication, dataSource, sshClientMock } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sftpClientMock = sshClientMock;
    // Processor under test.
    processor = app.get(SIMSToSFASIntegrationScheduler);
  });

  afterEach(async () => {
    MockDate.reset();
    // Reset all SFAS bridge logs.
    await db.sfasBridgeLog.delete({ id: MoreThan(0) });
  });

  it(
    "Should generate a SIMS to SFAS bridge file when there is an update on student data" +
      " between the most recent bridge file date and the current bridge file execution date.",
    async () => {
      // Arrange
      // Set the start date and end date of the bridge file to be after 10 years
      // to ensure that data produced by other tests will not affect the results of this test.
      const latestBridgeFileDate = addYears(10);
      const simsDataUpdatedDate = addMilliSeconds(100, latestBridgeFileDate);
      const mockedCurrentDate = addMilliSeconds(100, simsDataUpdatedDate);
      // Create bridge file log.
      await db.sfasBridgeLog.insert({
        referenceDate: latestBridgeFileDate,
        generatedFileName: "DummyFileName.TXT",
      });

      // Student created with expected first name, last name and more importantly the updated date
      // to fall between the most recent bridge file date and the mocked current date.
      const student = await createStudentWithExpectedData(
        "FakeFirstName",
        "FakeLastName",
        simsDataUpdatedDate,
      );
      // Student has submitted an application.
      await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        { offeringIntensity: OfferingIntensity.partTime },
      );

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Mock the current date.
      MockDate.set(mockedCurrentDate);

      // Expected file name.
      const expectedFileName = buildExpectedFileName(mockedCurrentDate);

      // Act
      const processingResult = await processor.generateSFASBridgeFile(
        mockedJob.job,
      );

      // Assert
      // Assert process result.
      expect(processingResult).toContain("Process finalized with success.");
      expect(processingResult).toContain("Student records sent: 1.");
      expect(processingResult).toContain(
        `Uploaded file name: ${expectedFileName}.`,
      );
      expect(
        mockedJob.containLogMessages([
          `Processing data since ${latestBridgeFileDate} until ${mockedCurrentDate}.`,
          "Found 1 student(s) with updates.",
          `SIMS to SFAS file ${expectedFileName} has been uploaded successfully.`,
          `SIMS to SFAS file log has been created with file name ${expectedFileName} and reference date ${mockedCurrentDate}.`,
        ]),
      ).toBe(true);
      const uploadedFile = getUploadedFile(sftpClientMock);
      const [header, studentRecord, footer] = uploadedFile.fileLines;
      expect(header).toBe(buildHeader(mockedCurrentDate));
      expect(footer).toBe(`999000000001`);
      expect(studentRecord).toBe(buildStudentRecord(student));
      // Check the database for creation of SFAS bridge log.
      const uploadedFileLog = await db.sfasBridgeLog.findOneBy({
        generatedFileName: expectedFileName,
        referenceDate: mockedCurrentDate,
      });
      expect(uploadedFileLog.id).toBeGreaterThan(0);
    },
  );

  /**
   * Creates a student with expected first name, last name and updated date.
   * @param expectedFirstName expected first name.
   * @param expectedLastName expected last name.
   * @param expectedUpdatedDate expected updated date.
   * @param options optional params.
   * - `expectedCASDetails` expected CAS details.
   * @returns created student.
   */
  async function createStudentWithExpectedData(
    expectedFirstName: string,
    expectedLastName: string,
    expectedUpdatedDate: Date,
    options?: {
      expectedCASDetails?: { supplierNumber: string; supplierSiteCode: string };
    },
  ): Promise<Student> {
    const user = createFakeUser();
    user.firstName = expectedFirstName;
    user.lastName = expectedLastName;
    // Create student with expected first name, last name and updated date.
    const student = await saveFakeStudent(
      db.dataSource,
      { user },
      { initialValue: { updatedAt: expectedUpdatedDate } },
    );
    // Set the student profile updated date to fall between the most recent bridge file date and the mocked current date.
    // The updated date if set externally during the creation of the student
    // is not being updated by typeorm with the external value.
    await db.student.update(
      { id: student.id },
      { updatedAt: expectedUpdatedDate },
    );
    // Update CAS details as expected.
    await db.casSupplier.update(
      { id: student.casSupplier.id },
      {
        supplierNumber: options?.expectedCASDetails?.supplierNumber ?? null,
        supplierAddress: {
          supplierSiteCode:
            options?.expectedCASDetails?.supplierSiteCode ?? null,
        },
      },
    );
    return student;
  }

  it(
    "Should not generate a SIMS to SFAS bridge file when there is an update on student data but the student " +
      " does not have any submitted application.",
    async () => {
      // Arrange
      // Set the start date and end date of the bridge file to be after 10 years
      // to ensure that data produced by other tests will not affect the results of this test.
      const latestBridgeFileDate = addYears(10);
      const simsDataUpdatedDate = addMilliSeconds(100, latestBridgeFileDate);
      const mockedCurrentDate = addMilliSeconds(100, simsDataUpdatedDate);
      // Create bridge file log.
      await db.sfasBridgeLog.insert({
        referenceDate: latestBridgeFileDate,
        generatedFileName: "DummyFileName.TXT",
      });

      // Student created with expected first name, last name and more importantly the updated date
      // to fall between the most recent bridge file date and the mocked current date.
      await createStudentWithExpectedData(
        "FakeFirstName",
        "FakeLastName",
        simsDataUpdatedDate,
      );

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Mock the current date.
      MockDate.set(mockedCurrentDate);

      // Act
      const processingResult = await processor.generateSFASBridgeFile(
        mockedJob.job,
      );

      // Assert
      // Assert process result.
      expect(processingResult).toContain("Process finalized with success.");
      expect(processingResult).toContain("Student records sent: 0.");
      expect(processingResult).toContain(`Uploaded file name: none.`);
      expect(
        mockedJob.containLogMessages([
          "There is no SIMS to SFAS updates to process.",
        ]),
      ).toBe(true);
    },
  );
  /**
   * Build expected file name.
   * @param bridgeFileExtractedDate bridge file extracted date.
   * @returns expected file name.
   */
  function buildExpectedFileName(bridgeFileExtractedDate: Date) {
    return `SIMS-TO-SFAS-${formatDate(
      bridgeFileExtractedDate,
      "YYYYMMDD-HHmmss",
    )}.TXT`;
  }

  /**
   * Build header.
   * @param bridgeFileExtractedDate bridge file extracted date.
   * @returns header.
   */
  function buildHeader(bridgeFileExtractedDate: Date) {
    const creationDate = formatDate(bridgeFileExtractedDate, "YYYYMMDDHHmmss");
    return `100PSFSSIMS to SFAS BRIDGE                     ${creationDate}`;
  }

  /**
   * Build student record.
   * @param student student.
   * @returns student record.
   */
  function buildStudentRecord(student: Student): string {
    return `200${student.id
      .toString()
      .padStart(10, "0")}FakeFirstName  FakeLastName             ${formatDate(
      student.birthDate,
      DATE_FORMAT,
    )}${
      student.sinValidation.sin
    }N        N                                                      000000000000000000000000000000`;
  }
});
