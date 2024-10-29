import { DeepMocked } from "@golevelup/ts-jest";
import MockDate from "mockdate";
import * as faker from "faker";
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
  createFakeCASSupplier,
  createFakeUser,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import * as Client from "ssh2-sftp-client";
import { SIMSToSFASIntegrationScheduler } from "../sims-to-sfas-integration.scheduler";
import { OfferingIntensity, Student, SupplierStatus } from "@sims/sims-db";
import { getUploadedFile } from "@sims/test-utils/mocks";
import { MoreThan } from "typeorm";
import { addMilliSeconds, addYears } from "@sims/test-utils/utils";

describe(describeProcessorRootTest(QueueNames.SIMSToSFASIntegration), () => {
  let app: INestApplication;
  let processor: SIMSToSFASIntegrationScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;
  let latestBridgeFileDate: Date;
  let simsDataUpdatedDate: Date;
  let mockedCurrentDate: Date;
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

  beforeEach(async () => {
    // Reset all SFAS bridge logs.
    await db.sfasBridgeLog.delete({ id: MoreThan(0) });
    // Set the start date and end date of the bridge file to be after 10 years
    // to ensure that data produced by other tests will not affect the results of this test.
    latestBridgeFileDate = addYears(10);
    // Set the data updated date and mocked current date in milliseconds later than
    // the latest bridge file date to ensure that it holds integrity only for the particular test scenario
    // and not having to update the database for each test case
    // which could potentially have various columns to be updated.
    simsDataUpdatedDate = addMilliSeconds(10, latestBridgeFileDate);
    mockedCurrentDate = addMilliSeconds(10, simsDataUpdatedDate);
  });

  afterEach(async () => {
    // Reset the current date mock.
    MockDate.reset();
  });

  it(
    "Should generate a SIMS to SFAS bridge file when there is an update on student data" +
      " between the most recent bridge file date and the current bridge file execution date.",
    async () => {
      // Arrange
      // Create bridge file log.
      await db.sfasBridgeLog.insert({
        referenceDate: latestBridgeFileDate,
        generatedFileName: "DummyFileName.TXT",
      });

      // Student created with expected first name, last name and more importantly the updated date
      // to fall between the most recent bridge file date and the mocked current date.
      const student = await createStudentWithExpectedData(simsDataUpdatedDate);
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
      expect(processingResult).toEqual([
        "Process finalized with success.",
        "Student records sent: 1.",
        `Uploaded file name: ${expectedFileName}.`,
      ]);
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
      expect(footer).toBe("999000000001");
      expect(studentRecord).toBe(buildStudentRecord(student));
      // Check the database for creation of SFAS bridge log.
      const uploadedFileLog = await db.sfasBridgeLog.findOneBy({
        generatedFileName: expectedFileName,
        referenceDate: mockedCurrentDate,
      });
      expect(uploadedFileLog.id).toBeGreaterThan(0);
    },
  );

  it(
    "Should not generate a SIMS to SFAS bridge file when there is an update on student data but the student " +
      " does not have any submitted application.",
    async () => {
      // Arrange
      // Create bridge file log.
      await db.sfasBridgeLog.insert({
        referenceDate: latestBridgeFileDate,
        generatedFileName: "DummyFileName.TXT",
      });

      // Student created with expected first name, last name and more importantly the updated date
      // to fall between the most recent bridge file date and the mocked current date.
      await createStudentWithExpectedData(simsDataUpdatedDate);

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
      expect(processingResult).toEqual([
        "Process finalized with success.",
        "Student records sent: 0.",
        "Uploaded file name: none.",
      ]);
      expect(
        mockedJob.containLogMessages([
          "There is no SIMS to SFAS updates to process.",
        ]),
      ).toBe(true);
    },
  );

  /**
   * Creates a student with expected first name, last name and updated date.
   * @param expectedUpdatedDate expected updated date.
   * @param options optional params.
   * - `expectedCASDetails` expected CAS details.
   * @returns created student.
   */
  async function createStudentWithExpectedData(
    expectedUpdatedDate: Date,
    options?: {
      expectedCASDetails?: { supplierNumber: string; supplierSiteCode: string };
    },
  ): Promise<Student> {
    const user = createFakeUser();
    // Name with fixed length will be easy to build the expected file data.
    user.firstName = faker.random.alpha({ count: 15 });
    user.lastName = faker.random.alpha({ count: 25 });
    // Create student with expected first name, last name and updated date.
    const student = await saveFakeStudent(db.dataSource, { user });
    // Create CAS supplier.
    const casSupplier = createFakeCASSupplier(
      {
        student,
        auditUser: student.user,
      },
      {
        supplierStatus: SupplierStatus.Verified,
      },
    );
    // Update CAS details as expected.
    casSupplier.supplierNumber =
      options?.expectedCASDetails?.supplierNumber ?? null;
    casSupplier.supplierAddress.supplierSiteCode =
      options?.expectedCASDetails?.supplierSiteCode ?? null;
    await db.casSupplier.save(casSupplier);

    // Set the student profile updated date to fall between the most recent bridge file date and the mocked current date.
    // Set the CAS supplier.
    await db.student.update(
      { id: student.id },
      { casSupplier, updatedAt: expectedUpdatedDate },
    );
    return student;
  }

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
    return `200${student.id.toString().padStart(10, "0")}${
      student.user.firstName
    }${student.user.lastName}${formatDate(student.birthDate, DATE_FORMAT)}${
      student.sinValidation.sin
    }N        N                                                      000000000000000000000000000000`;
  }
});
