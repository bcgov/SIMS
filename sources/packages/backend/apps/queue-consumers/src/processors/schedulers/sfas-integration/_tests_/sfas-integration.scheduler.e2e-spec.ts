import { DeepMocked } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import {
  QueueNames,
  getDateOnlyFormat,
  getISODateOnlyString,
} from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeStudent,
  saveFakeStudentRestriction,
  RestrictionCode,
  createFakeSFASRestrictionMaps,
  createFakeUser,
} from "@sims/test-utils";
import { mockDownloadFiles } from "@sims/test-utils/mocks";
import * as Client from "ssh2-sftp-client";
import * as path from "path";
import { SFASIntegrationScheduler } from "../sfas-integration.scheduler";
import {
  DisbursementOverawardOriginType,
  NotificationMessageType,
  Student,
  StudentRestriction,
} from "@sims/sims-db";
import { In, IsNull, Not } from "typeorm";
import { createFakeSINValidation } from "@sims/test-utils/factories/sin-validation";
import {
  BC_STUDENT_LOAN_AWARD_CODE,
  CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE,
} from "@sims/services/constants";

// SFAS received file mocks.
const SFAS_ALL_RESTRICTIONS_FILENAME =
  "SFAS-TO-SIMS-2024MAR07-ALL-RESTRICTIONS.txt";
const SFAS_SAIL_DATA_FILENAME =
  "SFAS-TO-SIMS-2024MAR21-PT-APPLICATION-DATA-IMPORT.txt";
const SFAS_INDIVIDUAL_INVALID_RECORDS_INCONSISTENT_WITH_DATA_IMPORT_FILENAME =
  "SFAS-TO-SIMS-INVALID-INDIVIDUAL-RECORDS-INCONSISTENT-WITH-DATA-IMPORT.txt";
const SFAS_INDIVIDUAL_VALID_RECORDS_FILENAME =
  "SFAS-TO-SIMS-VALID-INDIVIDUAL-RECORDS.txt";
const SFAS_INDIVIDUAL_VALID_RECORD_OVERAWARD_FILENAME =
  "SFAS-TO-SIMS-VALID-INDIVIDUAL-RECORD-OVERAWARD.txt";
const LEGACY_RESTRICTION_EMAIL = "dummy_legacy_email@some.domain";
const DEPENDANT_AND_DISBURSEMENT_RECORDS_FILENAME =
  "SFAS-TO-SIMS-DEPENDANT_AND_DISBURSEMENT-RECORDS.txt";

describe(describeProcessorRootTest(QueueNames.SFASIntegration), () => {
  let app: INestApplication;
  let processor: SFASIntegrationScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;
  let sfasDownloadFolder: string;
  let sharedStudent: Student;

  beforeAll(async () => {
    sfasDownloadFolder = path.join(__dirname, "sfas-files");
    // Set the SFAS folder to the files mocks folders.
    process.env.SFAS_RECEIVE_FOLDER = sfasDownloadFolder;
    const { nestApplication, dataSource, sshClientMock } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sftpClientMock = sshClientMock;
    // Processor under test.
    processor = app.get(SFASIntegrationScheduler);
    // Create student if it doesn't exist.
    sharedStudent = await db.student.findOne({
      where: {
        birthDate: getISODateOnlyString(new Date("1998-03-24")),
        user: { lastName: "FOUR" },
        sinValidation: { sin: "428062400" },
      },
    });
    if (!sharedStudent) {
      sharedStudent = await saveFakeStudent(db.dataSource);
      // Update the student to ensure that the student imported from SFAS is the same student as the one created above.
      sharedStudent.birthDate = getISODateOnlyString(new Date("1998-03-24"));
      sharedStudent.user.lastName = "FOUR";
      sharedStudent.sinValidation.sin = "428062400";
      await db.student.save(sharedStudent);
    }
    // Set a value to legacy notification to allow it to be generated.
    await db.notificationMessage.update(
      { id: NotificationMessageType.LegacyRestrictionAdded },
      { emailContacts: [LEGACY_RESTRICTION_EMAIL] },
    );
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    // Set the isActive field to false for each record of the sharedStudent in the student restrictions table to not interfere with other tests.
    await db.studentRestriction.update(
      { student: { id: sharedStudent.id } },
      { isActive: false },
    );
    // Remove any custom legacy restriction that is not part
    // of the DB original seeding.
    await db.sfasRestrictionMap.delete({ isLegacyOnly: true });
    // Set the current legacy restriction to a different code.
    await db.restriction.update(
      { isLegacy: true, restrictionCode: Not(RestrictionCode.LGCY) },
      { isLegacy: false, restrictionCode: "E2E_UPDATE" },
    );
    // Set all legacy restrictions notification to sent.
    await db.notification.update(
      {
        dateSent: IsNull(),
        notificationMessage: {
          id: NotificationMessageType.LegacyRestrictionAdded,
        },
      },
      { dateSent: new Date() },
    );
    db.sfasIndividual.delete({});
    db.sfasApplicationDependant.delete({});
    db.sfasApplicationDisbursement.delete({});
  });

  it("Should create missing legacy restrictions, import two student restrictions, and send a single notification when new mapped legacy restrictions are present in the file.", async () => {
    // Arrange
    // Create the new custom legacy restrictions.
    // Two are created to ensure only one notification is sent for the student.
    const customRestrictionMapM1 = createFakeSFASRestrictionMaps({
      initialValues: { legacyCode: "M1", code: "LGCY_M1" },
    });
    const customRestrictionMapB4 = createFakeSFASRestrictionMaps({
      initialValues: { legacyCode: "B4", code: "LGCY_B4" },
    });
    await db.sfasRestrictionMap.save([
      customRestrictionMapM1,
      customRestrictionMapB4,
    ]);
    // Queued job.
    const mockedJob = mockBullJob<void>();
    mockDownloadFiles(sftpClientMock, [SFAS_ALL_RESTRICTIONS_FILENAME]);

    // Act
    await processor.processQueue(mockedJob.job);

    // Assert

    // Assert new student restrictions LGCY_M1 and LGCY_B4 were added to the student account.
    const studentRestrictions = await db.studentRestriction.find({
      select: {
        id: true,
        restriction: {
          restrictionCode: true,
        },
        isActive: true,
      },
      relations: { restriction: true },
      where: { student: { id: sharedStudent.id }, isActive: true },
    });
    // Check if all mapped restriction in the file were imported.
    expect(studentRestrictions.length).toBe(7);
    // Check if all legacy restrictions were added to the student account as active.
    const legacyStudentRestrictions = studentRestrictions.filter(
      (restriction) =>
        ["LGCY_M1", "LGCY_B4"].includes(
          restriction.restriction.restrictionCode,
        ),
    );
    expect(legacyStudentRestrictions).toHaveLength(2);
    legacyStudentRestrictions.forEach((legacyStudentRestriction) =>
      expect(legacyStudentRestriction.isActive).toBe(true),
    );
    // Assert a single notification was generated with the expected data.
    const notifications = await db.notification.find({
      select: {
        id: true,
        messagePayload: true,
      },
      where: {
        dateSent: IsNull(),
        notificationMessage: {
          id: NotificationMessageType.LegacyRestrictionAdded,
        },
      },
    });
    expect(notifications).toHaveLength(1);
    const [notification] = notifications;
    expect(notification).toEqual({
      id: expect.any(Number),
      messagePayload: {
        template_id: "69d5f064-1efa-4109-a45a-5857a6acb612",
        email_address: LEGACY_RESTRICTION_EMAIL,
        personalisation: {
          birthDate: getDateOnlyFormat(sharedStudent.birthDate),
          lastName: sharedStudent.user.lastName,
          givenNames: sharedStudent.user.firstName,
          studentEmail: sharedStudent.user.email,
          dateTime: expect.any(String),
        },
      },
    });
  });

  it(
    "Should not insert a restriction to SIMS student restrictions when the same restriction is imported from SFAS but is already active in SIMS or has a restriction resolution date, " +
      "and it should insert a restriction after mapping it to SIMS restriction when it is either inactive or is not at all present in the SIMS student restrictions, ",
    async () => {
      // Arrange
      await findAndSaveRestriction(RestrictionCode.B6B);
      await findAndSaveRestriction(RestrictionCode.LGCY);
      const studentRestrictionSSR = await findAndSaveRestriction(
        RestrictionCode.SSR,
      );
      studentRestrictionSSR.isActive = false;
      await db.studentRestriction.save(studentRestrictionSSR);
      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [SFAS_ALL_RESTRICTIONS_FILENAME]);
      // Act
      const result = await processor.processQueue(mockedJob.job);
      // Assert
      // Expect the file was archived on SFTP.
      expect(result).toStrictEqual([
        "Completed processing SFAS integration files.",
      ]);
      expect(sftpClientMock.rename).toHaveBeenCalled();
      // Expect a total of 5 restrictions to be inserted.
      // Two originally inserted restrictions (LGCY & B6B) from before the file processing and then two AF restrictions and one SSR restriction added from the file import.
      const studentRestrictions = await db.studentRestriction.find({
        select: {
          id: true,
          restriction: {
            restrictionCode: true,
          },
        },
        relations: { restriction: true },
        where: { student: { id: sharedStudent.id }, isActive: true },
      });
      expect(studentRestrictions.length).toBe(5);
      const restrictionsCount: Record<string, number> = {};
      studentRestrictions.forEach((restriction) => {
        const code = restriction.restriction.restrictionCode;
        restrictionsCount[code] = (restrictionsCount[code] || 0) + 1;
      });
      // Assert the count of individual restriction types.
      expect(restrictionsCount).toStrictEqual({
        [RestrictionCode.LGCY]: 1,
        [RestrictionCode.AF]: 2,
        [RestrictionCode.B6B]: 1,
        [RestrictionCode.SSR]: 1,
      });
    },
  );

  it(
    "Should add a SFAS part time application record when importing data from SFAS " +
      "where the record type is the part time application data record.",
    async () => {
      // Arrange
      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [SFAS_SAIL_DATA_FILENAME]);
      // Act
      await processor.processQueue(mockedJob.job);
      // Assert
      // Expect the file was archived on SFTP.
      expect(sftpClientMock.rename).toHaveBeenCalled();
      // Expect the file contains 3 records.
      expect(mockedJob.containLogMessage("File contains 4 records.")).toBe(
        true,
      );
      const startDate = getISODateOnlyString("2023-08-01");
      const endDate = getISODateOnlyString("2024-02-01");
      // Expect the database data to be the same as the file data for one record.
      const sfasPartTimeApplications = await db.sfasPartTimeApplications.find({
        select: {
          startDate: true,
          endDate: true,
          csgpAward: true,
          sbsdAward: true,
          csptAward: true,
          csgdAward: true,
          bcagAward: true,
          cslpAward: true,
          programYearId: true,
          applicationCancelDate: true,
        },
        where: {
          individualId: In([950000360, 950000361, 950000362, 950000363]),
        },
        order: { individualId: "ASC" },
      });
      expect(sfasPartTimeApplications.length).toBe(4);
      const [
        firstSFASPartTimeApplication,
        secondSFASPartTimeApplication,
        thirdSFASPartTimeApplication,
        fourthSFASPartTimeApplication,
      ] = sfasPartTimeApplications;
      expect(firstSFASPartTimeApplication).toEqual({
        startDate: startDate,
        endDate: endDate,
        csgpAward: 4000,
        sbsdAward: 300,
        csptAward: 30000,
        csgdAward: 165,
        bcagAward: 24,
        cslpAward: 500,
        programYearId: 20232024,
        applicationCancelDate: null,
      });
      expect(secondSFASPartTimeApplication).toEqual({
        startDate: startDate,
        endDate: endDate,
        csgpAward: 5000,
        sbsdAward: 400,
        csptAward: 40000,
        csgdAward: 166,
        bcagAward: 25,
        cslpAward: 600,
        programYearId: 20232024,
        applicationCancelDate: null,
      });
      expect(thirdSFASPartTimeApplication).toEqual({
        startDate: startDate,
        endDate: endDate,
        csgpAward: 6000,
        sbsdAward: 500,
        csptAward: 50000,
        csgdAward: 167,
        bcagAward: 26,
        cslpAward: 700,
        programYearId: null,
        applicationCancelDate: null,
      });
      expect(fourthSFASPartTimeApplication).toEqual({
        startDate: startDate,
        endDate: endDate,
        csgpAward: 7000,
        sbsdAward: 600,
        csptAward: 60000,
        csgdAward: 168,
        bcagAward: 27,
        cslpAward: 800,
        programYearId: 20232024,
        applicationCancelDate: "2024-02-01",
      });
    },
  );

  it(
    "Should not add SFAS individual data records when importing invalid data from SFAS " +
      "when the record type is the individual data record.",
    async () => {
      // Arrange
      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [
        SFAS_INDIVIDUAL_INVALID_RECORDS_INCONSISTENT_WITH_DATA_IMPORT_FILENAME,
      ]);

      // Act/Assert
      await expect(processor.processQueue(mockedJob.job)).rejects.toThrow(
        "Error processing record line number",
      );

      // Assert
      // Expect the file data not to be saved in the database.
      const sfasIndividualRecords = await db.sfasIndividual.find({
        select: {
          id: true,
        },
        where: {
          id: In([75085, 75086, 75087]),
        },
      });
      expect(sfasIndividualRecords.length).toBe(0);
    },
  );

  it(
    "Should add SFAS individual data records when importing valid data from SFAS " +
      "when the record type is the individual data record.",
    async () => {
      // Arrange
      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [
        SFAS_INDIVIDUAL_VALID_RECORDS_FILENAME,
      ]);

      // Act
      await processor.processQueue(mockedJob.job);

      // Assert
      const downloadedFile = path.join(
        process.env.SFAS_RECEIVE_FOLDER,
        SFAS_INDIVIDUAL_VALID_RECORDS_FILENAME,
      );
      expect(
        mockedJob.containLogMessages([
          `Processing file ${downloadedFile}.`,
          "File contains 3 records.",
          "Updating student ids for SFAS individuals.",
          "Student ids updated.",
          "Updating and inserting new disbursement overaward balances from sfas to disbursement overawards table.",
          "New disbursement overaward balances inserted to disbursement overawards table.",
          "Inserting student restrictions from SFAS restrictions data.",
          "Inserted student restrictions from SFAS restrictions data.",
        ]),
      ).toBe(true);
      // Expect the database data to be the same as the file data.
      const sfasIndividualRecords = await db.sfasIndividual.find({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          sin: true,
          pdStatus: true,
          ppdStatus: true,
          ppdStatusDate: true,
          msfaaNumber: true,
          msfaaSignedDate: true,
          neb: true,
          bcgg: true,
          lfp: true,
          pal: true,
          cslOveraward: true,
          bcslOveraward: true,
          cmsOveraward: true,
          grantOveraward: true,
          withdrawals: true,
          unsuccessfulCompletion: true,
          partTimeMSFAANumber: true,
          partTimeMSFAAEffectiveDate: true,
        },
        where: {
          id: In([83540, 83541, 83542]),
        },
        order: { id: "ASC" },
      });
      expect(sfasIndividualRecords.length).toBe(3);
      const [firstSFASIndividual, secondSFASIndividual, thirdSFASIndividual] =
        sfasIndividualRecords;
      expect(firstSFASIndividual).toEqual({
        id: 83540,
        firstName: "GIORGIO",
        lastName: "GIOVANNI",
        birthDate: "1966-07-21",
        sin: "121380174",
        pdStatus: true,
        ppdStatus: true,
        ppdStatusDate: "1967-07-22",
        msfaaNumber: "9876543210",
        msfaaSignedDate: "2024-07-12",
        neb: 50,
        bcgg: 5000,
        lfp: 7560.5,
        pal: 7560.5,
        cslOveraward: 741.3,
        bcslOveraward: 741.3,
        cmsOveraward: 741.3,
        grantOveraward: 741.3,
        withdrawals: 2,
        unsuccessfulCompletion: 17,
        partTimeMSFAANumber: null,
        partTimeMSFAAEffectiveDate: null,
      });
      expect(secondSFASIndividual).toEqual({
        id: 83541,
        firstName: "GIORGIO",
        lastName: "GIOVANNI",
        birthDate: "1949-11-16",
        sin: "108796293",
        pdStatus: false,
        ppdStatus: false,
        ppdStatusDate: null,
        msfaaNumber: "9876543211",
        msfaaSignedDate: "2024-07-13",
        neb: 50,
        bcgg: 5000,
        lfp: 11040,
        pal: 11040,
        cslOveraward: 11040,
        bcslOveraward: 11040,
        cmsOveraward: 11040,
        grantOveraward: 11040,
        withdrawals: 2,
        unsuccessfulCompletion: 2,
        partTimeMSFAANumber: "1234567890",
        partTimeMSFAAEffectiveDate: "2024-12-31",
      });
      expect(thirdSFASIndividual).toEqual({
        id: 83542,
        firstName: "GIORGIO",
        lastName: "GIOVANNI",
        birthDate: "1970-07-02",
        sin: "122886591",
        pdStatus: null,
        ppdStatus: null,
        ppdStatusDate: null,
        msfaaNumber: null,
        msfaaSignedDate: getISODateOnlyString(new Date()),
        neb: 0,
        bcgg: 0,
        lfp: 0,
        pal: 0,
        bcslOveraward: 0,
        cslOveraward: 11039,
        cmsOveraward: 0,
        grantOveraward: 0,
        withdrawals: 0,
        unsuccessfulCompletion: 0,
        partTimeMSFAANumber: null,
        partTimeMSFAAEffectiveDate: null,
      });
    },
  );

  it(
    "Should update disbursement legacy overawards for an existing student when SFAS individual data records are added by importing valid data from SFAS " +
      "where the record type is the individual data record.",
    async () => {
      // Arrange
      const user = createFakeUser();
      user.lastName = "INNAVOIG";
      const student = await saveFakeStudent(
        db.dataSource,
        { user },
        { initialValue: { birthDate: "1966-07-21" } },
      );
      const sinValidation = createFakeSINValidation(
        {
          student,
        },
        { initialValue: { sin: "121380175" } },
      );
      student.sinValidation = sinValidation;
      await db.student.save(student);

      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [
        SFAS_INDIVIDUAL_VALID_RECORD_OVERAWARD_FILENAME,
      ]);

      // Act
      await processor.processQueue(mockedJob.job);

      // Assert
      const downloadedFile = path.join(
        process.env.SFAS_RECEIVE_FOLDER,
        SFAS_INDIVIDUAL_VALID_RECORD_OVERAWARD_FILENAME,
      );
      expect(
        mockedJob.containLogMessages([
          `Processing file ${downloadedFile}.`,
          "File contains 1 records.",
          "Updating student ids for SFAS individuals.",
          "Student ids updated.",
          "Updating and inserting new disbursement overaward balances from sfas to disbursement overawards table.",
          "New disbursement overaward balances inserted to disbursement overawards table.",
          "Inserting student restrictions from SFAS restrictions data.",
          "Inserted student restrictions from SFAS restrictions data.",
        ]),
      ).toBe(true);
      // Expect
      const sFASIndividual = await db.sfasIndividual.findOne({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          sin: true,
          cslOveraward: true,
          bcslOveraward: true,
        },
        where: {
          id: 83543,
        },
      });
      expect(sFASIndividual).toEqual({
        id: 83543,
        firstName: "GIORGIO",
        lastName: "INNAVOIG",
        birthDate: "1966-07-21",
        sin: "121380175",
        bcslOveraward: 714.3,
        cslOveraward: 741.3,
      });
      const disbursementOverawards = await db.disbursementOveraward.find({
        select: { disbursementValueCode: true, overawardValue: true },
        where: {
          student: { id: student.id },
          originType: DisbursementOverawardOriginType.LegacyOveraward,
        },
      });
      expect(disbursementOverawards).toEqual(
        expect.arrayContaining([
          {
            disbursementValueCode: BC_STUDENT_LOAN_AWARD_CODE,
            overawardValue: 714.3,
          },
          {
            disbursementValueCode: CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE,
            overawardValue: 741.3,
          },
        ]),
      );
    },
  );

  it(
    "Should import SFAS application dependant and SFAS application disbursement records along with other SFAS records " +
      "when the SFAS file has one or more dependant and disbursement records.",
    async () => {
      // Arrange
      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [
        DEPENDANT_AND_DISBURSEMENT_RECORDS_FILENAME,
      ]);

      // Act
      await processor.processQueue(mockedJob.job);

      // Assert
      // Expect the file was archived on SFTP.
      expect(sftpClientMock.rename).toHaveBeenCalled();
      // Expect the file contains 3 records.
      expect(
        mockedJob.containLogMessages([
          "File contains 3 records.",
          "Updating student ids for SFAS individuals.",
          "Student ids updated.",
          "Updating and inserting new disbursement overaward balances from sfas to disbursement overawards table.",
          "New disbursement overaward balances inserted to disbursement overawards table.",
          "Inserting student restrictions from SFAS restrictions data.",
          "Inserted student restrictions from SFAS restrictions data.",
        ]),
      ).toBe(true);
    },
  );

  /**
   * Gets the restriction by the restriction code and saves the student restriction.
   * @param restrictionCode restriction code to find and then save the student restriction.
   * @returns the saved student restriction.
   */
  async function findAndSaveRestriction(
    restrictionCode: RestrictionCode,
  ): Promise<StudentRestriction> {
    const restriction = await db.restriction.findOne({
      where: { restrictionCode },
    });
    return saveFakeStudentRestriction(db.dataSource, {
      student: sharedStudent,
      restriction,
    });
  }
});
