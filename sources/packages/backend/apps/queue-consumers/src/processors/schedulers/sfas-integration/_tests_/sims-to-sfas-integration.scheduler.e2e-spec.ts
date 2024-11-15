import { DeepMocked } from "@golevelup/ts-jest";
import MockDate from "mockdate";
import * as faker from "faker";
import { INestApplication } from "@nestjs/common";
import {
  addDays,
  formatDate,
  getISODateOnlyString,
  QueueNames,
} from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeCASSupplier,
  createFakeDisbursementValue,
  createFakeUser,
  saveFakeApplication,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
  saveFakeStudentRestriction,
} from "@sims/test-utils";
import * as Client from "ssh2-sftp-client";
import { SIMSToSFASIntegrationScheduler } from "../sims-to-sfas-integration.scheduler";
import {
  Application,
  ApplicationData,
  ApplicationStatus,
  DisbursementValueType,
  OfferingIntensity,
  ProgramInfoStatus,
  Restriction,
  RestrictionType,
  Student,
  StudentRestriction,
  SupplierStatus,
} from "@sims/sims-db";
import { getUploadedFile } from "@sims/test-utils/mocks";
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
  let provincialRestriction: Restriction;

  beforeAll(async () => {
    const { nestApplication, dataSource, sshClientMock } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sftpClientMock = sshClientMock;
    // Processor under test.
    processor = app.get(SIMSToSFASIntegrationScheduler);
    provincialRestriction = await db.restriction.findOne({
      select: { id: true, restrictionCode: true },
      where: {
        restrictionType: RestrictionType.Provincial,
      },
    });
  });

  beforeEach(async () => {
    // Clear all mocks.
    jest.clearAllMocks();
    // Reset all SFAS bridge logs.
    await db.sfasBridgeLog.delete({});
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
    "Should generate a SIMS to SFAS bridge file when there is an update on student data, applications data " +
      "and restrictions data that fall between the most recent bridge file date and the current bridge file execution date.",
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
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        {
          offeringIntensity: OfferingIntensity.partTime,
        },
      );
      // Update application data to fall between the most recent bridge file date and the mocked current date.
      application.updatedAt = simsDataUpdatedDate;
      await db.application.save(application);

      // Student has a restriction.
      const restriction = await saveFakeStudentRestriction(db.dataSource, {
        student,
        application,
        restriction: provincialRestriction,
      });

      await db.studentRestriction.update(
        {
          id: restriction.id,
        },
        {
          updatedAt: simsDataUpdatedDate,
        },
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
        "Application records sent: 1.",
        "Restriction records sent: 1.",
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
      const [
        header,
        studentRecord,
        applicationRecord,
        restrictionRecord,
        footer,
      ] = uploadedFile.fileLines;
      expect(header).toBe(buildHeader(mockedCurrentDate));
      expect(footer).toBe("999000000003");
      expect(studentRecord).toBe(buildStudentRecord(student));
      expect(applicationRecord).toBe(buildApplicationRecord(application));
      expect(restrictionRecord).toBe(buildRestrictionRecord(restriction));
      // Check the database for creation of SFAS bridge log.
      const uploadedFileLog = await db.sfasBridgeLog.existsBy({
        generatedFileName: expectedFileName,
        referenceDate: mockedCurrentDate,
      });
      expect(uploadedFileLog).toBe(true);
    },
  );

  it(
    "Should not generate a SIMS to SFAS bridge file when there is an update on student data but the student " +
      "does not have any submitted application.",
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
        "Application records sent: 0.",
        "Restriction records sent: 0.",
        "Uploaded file name: none.",
      ]);
      expect(
        mockedJob.containLogMessages([
          "There is no SIMS to SFAS updates to process.",
        ]),
      ).toBe(true);
    },
  );

  it(
    "Should generate a SIMS to SFAS bridge file when there is an update on student data, cancelled application data " +
      "that fall between the most recent bridge file date and the current bridge file execution date.",
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
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        {
          applicationStatus: ApplicationStatus.Cancelled,
          offeringIntensity: OfferingIntensity.fullTime,
        },
      );
      application.updatedAt = simsDataUpdatedDate;
      await db.application.save(application);

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
        "Application records sent: 1.",
        "Restriction records sent: 0.",
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
      const [header, studentRecord, applicationRecord, footer] =
        uploadedFile.fileLines;
      expect(header).toBe(buildHeader(mockedCurrentDate));
      expect(footer).toBe("999000000002");
      expect(studentRecord).toBe(buildStudentRecord(student));
      expect(applicationRecord).toBe(buildApplicationRecord(application));
      // Check the database for creation of SFAS bridge log.
      const uploadedFileLog = await db.sfasBridgeLog.existsBy({
        generatedFileName: expectedFileName,
        referenceDate: mockedCurrentDate,
      });
      expect(uploadedFileLog).toBe(true);
    },
  );

  it(
    "Should generate a SIMS to SFAS bridge file when there is an update on student data, removed restriction data " +
      "that fall between the most recent bridge file date and the current bridge file execution date.",
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
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        {
          applicationStatus: ApplicationStatus.Cancelled,
          offeringIntensity: OfferingIntensity.partTime,
        },
      );

      // Student has a restriction.
      const federalRestriction = await db.restriction.findOne({
        select: { id: true, restrictionCode: true },
        where: {
          restrictionType: RestrictionType.Federal,
        },
      });
      const resolvedRestriction = await saveFakeStudentRestriction(
        db.dataSource,
        {
          student,
          application,
          restriction: provincialRestriction,
        },
        {
          isActive: false,
        },
      );
      await db.studentRestriction.update(
        {
          id: resolvedRestriction.id,
        },
        {
          updatedAt: simsDataUpdatedDate,
        },
      );

      // Create a restriction for federal which should not be sent.
      const restriction = await saveFakeStudentRestriction(
        db.dataSource,
        {
          student,
          application,
          restriction: federalRestriction,
        },
        {
          isActive: false,
        },
      );

      await db.studentRestriction.update(
        {
          id: restriction.id,
        },
        {
          updatedAt: simsDataUpdatedDate,
        },
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
        "Application records sent: 0.",
        "Restriction records sent: 1.",
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
      const [header, studentRecord, restrictionRecord, footer] =
        uploadedFile.fileLines;
      expect(header).toBe(buildHeader(mockedCurrentDate));
      expect(footer).toBe("999000000002");
      expect(studentRecord).toBe(buildStudentRecord(student));
      expect(restrictionRecord).toBe(
        buildRestrictionRecord(resolvedRestriction),
      );
      // Check the database for creation of SFAS bridge log.
      const uploadedFileLog = await db.sfasBridgeLog.existsBy({
        generatedFileName: expectedFileName,
        referenceDate: mockedCurrentDate,
      });
      expect(uploadedFileLog).toBe(true);
    },
  );

  it(
    "Should generate a SIMS to SFAS bridge file when there is an update on student assessment data " +
      "that fall between the most recent bridge file date and the current bridge file execution date.",
    async () => {
      // Arrange
      // Create bridge file log.
      await db.sfasBridgeLog.insert({
        referenceDate: latestBridgeFileDate,
        generatedFileName: "DummyFileName.TXT",
      });

      // Student created with expected first name, last name and more importantly the updated date
      // to fall between the most recent bridge file date and the mocked current date.
      const student = await createStudentWithExpectedData();

      // Student has submitted an application.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        {
          offeringIntensity: OfferingIntensity.partTime,
        },
      );
      db.studentAssessment.update(
        {
          id: application.currentAssessment.id,
        },
        {
          updatedAt: simsDataUpdatedDate,
        },
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
        "Application records sent: 1.",
        "Restriction records sent: 0.",
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
      const [header, studentRecord, applicationRecord, footer] =
        uploadedFile.fileLines;
      expect(header).toBe(buildHeader(mockedCurrentDate));
      expect(footer).toBe("999000000002");
      expect(studentRecord).toBe(buildStudentRecord(student));
      expect(applicationRecord).toBe(buildApplicationRecord(application));
      // Check the database for creation of SFAS bridge log.
      const uploadedFileLog = await db.sfasBridgeLog.existsBy({
        generatedFileName: expectedFileName,
        referenceDate: mockedCurrentDate,
      });
      expect(uploadedFileLog).toBe(true);
    },
  );

  it(
    "Should generate a SIMS to SFAS bridge file when there is an update on student assessment data " +
      "that fall between the most recent bridge file date and the current bridge file execution date.",
    async () => {
      // Arrange
      // Create bridge file log.
      await db.sfasBridgeLog.insert({
        referenceDate: latestBridgeFileDate,
        generatedFileName: "DummyFileName.TXT",
      });

      // Student created with expected first name, last name and more importantly the updated date
      // to fall between the most recent bridge file date and the mocked current date.
      const student = await createStudentWithExpectedData();

      const firstDisbursementValues = [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          1,
        ),
        createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 2),
      ];
      const secondDisbursementValues = [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          1,
        ),
        createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 2),
      ];

      // Student has submitted an application.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { firstDisbursementValues, secondDisbursementValues, student },
        {
          offeringIntensity: OfferingIntensity.partTime,
          createSecondDisbursement: true,
        },
      );
      application.updatedAt = simsDataUpdatedDate;
      await db.application.save(application);

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
        "Application records sent: 1.",
        "Restriction records sent: 0.",
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
      const [header, studentRecord, applicationRecord, footer] =
        uploadedFile.fileLines;
      expect(header).toBe(buildHeader(mockedCurrentDate));
      expect(footer).toBe("999000000002");
      expect(studentRecord).toBe(buildStudentRecord(student));
      expect(applicationRecord).toBe(
        buildApplicationRecord(application, "0000000200", "0000000400"),
      );
      // Check the database for creation of SFAS bridge log.
      const uploadedFileLog = await db.sfasBridgeLog.existsBy({
        generatedFileName: expectedFileName,
        referenceDate: mockedCurrentDate,
      });
      expect(uploadedFileLog).toBe(true);
    },
  );

  it(
    "Should generate a SIMS to SFAS bridge file when there is an update on student PIR application data " +
      "that fall between the most recent bridge file date and the current bridge file execution date.",
    async () => {
      // Arrange
      // Create bridge file log.
      await db.sfasBridgeLog.insert({
        referenceDate: latestBridgeFileDate,
        generatedFileName: "DummyFileName.TXT",
      });

      // Student created with expected first name, last name and more importantly the updated date
      // to fall between the most recent bridge file date and the mocked current date.
      const student = await createStudentWithExpectedData();
      const studyStartDate = getISODateOnlyString(new Date());
      const studyEndDate = getISODateOnlyString(addDays(30, studyStartDate));
      // Student has submitted an application.
      const application = await saveFakeApplication(
        db.dataSource,
        { student },
        {
          applicationData: {
            howWillYouBeAttendingTheProgram: OfferingIntensity.partTime,
            studystartDate: studyStartDate,
            studyendDate: studyEndDate,
          } as ApplicationData,
          applicationStatus: ApplicationStatus.InProgress,
          pirStatus: ProgramInfoStatus.required,
        },
      );
      application.updatedAt = simsDataUpdatedDate;
      await db.application.save(application);

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
        "Application records sent: 1.",
        "Restriction records sent: 0.",
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
      const [header, studentRecord, applicationRecord, footer] =
        uploadedFile.fileLines;
      expect(header).toBe(buildHeader(mockedCurrentDate));
      expect(footer).toBe("999000000002");
      expect(studentRecord).toBe(buildStudentRecord(student));
      expect(applicationRecord).toBe(buildApplicationRecord(application));
      // Check the database for creation of SFAS bridge log.
      const uploadedFileLog = await db.sfasBridgeLog.existsBy({
        generatedFileName: expectedFileName,
        referenceDate: mockedCurrentDate,
      });
      expect(uploadedFileLog).toBe(true);
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
    expectedUpdatedDate?: Date,
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
      { casSupplier, updatedAt: expectedUpdatedDate ?? new Date() },
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

  /**
   * Build application record.
   * @param application application.
   * @returns application record.
   */
  function buildApplicationRecord(
    application: Application,
    csgpAwardTotal?: string,
    sbsdAwardTotal?: string,
  ): string {
    const offering = application.currentAssessment.offering;
    const offeringIntensity =
      offering?.offeringIntensity ??
      application.data.howWillYouBeAttendingTheProgram;
    const studentId = application.student.id;
    const applicationRecordType =
      offeringIntensity === OfferingIntensity.fullTime ? "300" : "301";
    const studyStartDate =
      offering?.studyStartDate ?? application.data.studystartDate;
    const studyEndDate =
      offering?.studyEndDate ?? application.data.studyendDate;
    const cancelledDate =
      application.applicationStatus === ApplicationStatus.Cancelled
        ? formatDate(application.applicationStatusUpdatedOn, DATE_FORMAT)
        : "        ";
    return `${applicationRecordType}${studentId
      .toString()
      .padStart(10, "0")}${application.id
      .toString()
      .padStart(10, "0")}${formatDate(studyStartDate, DATE_FORMAT)}${formatDate(
      studyEndDate,
      DATE_FORMAT,
    )}20222023${csgpAwardTotal ?? "0000000000"}${
      sbsdAwardTotal ?? "0000000000"
    }${cancelledDate}`;
  }

  /**
   * Build restriction record.
   * @param restriction restriction.
   * @returns restriction record.
   */
  function buildRestrictionRecord(
    studentRestriction: StudentRestriction,
  ): string {
    const restriction = studentRestriction.restriction;
    const studentId = studentRestriction.student.id;
    const restrictionRemovalDate = !studentRestriction.isActive
      ? formatDate(simsDataUpdatedDate, DATE_FORMAT)
      : "        ";
    return `400${studentId.toString().padStart(10, "0")}${studentRestriction.id
      .toString()
      .padStart(10, "0")}${restriction.restrictionCode}${formatDate(
      studentRestriction.createdAt,
      DATE_FORMAT,
    )}${restrictionRemovalDate}`;
  }
});
