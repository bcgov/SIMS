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
  SFASApplication,
  SFASApplicationDependant,
  SFASApplicationDisbursement,
  SFASIndividual,
  Student,
  StudentRestriction,
} from "@sims/sims-db";
import { In, IsNull, Not } from "typeorm";
import {
  BC_STUDENT_LOAN_AWARD_CODE,
  CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE,
} from "@sims/services/constants";
import { createFakeSINValidation } from "@sims/test-utils/factories/sin-validation";

// SFAS received file mocks.
const SFAS_ALL_RESTRICTIONS_FILENAME =
  "SFAS-TO-SIMS-2024MAR07-ALL-RESTRICTIONS.txt";
const SFAS_TO_SIMS_SSR_SSRN_RESOLVED_RESTRICTIONS =
  "SFAS-TO-SIMS-SSR-SSRN-RESOLVED-RESTRICTIONS.txt";
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
  "SFAS-TO-SIMS-DEPENDANT_AND_DISBURSEMENT_ALL_VALUES-RECORDS.txt";
const INVALID_RECORD_TYPE_FILENAME =
  "SFAS-TO-SIMS-INVALID_RECORD_TYPE-RECORD.txt";
const SFAS_INDIVIDUAL_AND_APPLICATION_ALL_VALUES_FILENAME =
  "SFAS-TO-SIMS-INDIVIDUAL_AND_APPLICATION_ALL_VALUES-RECORDS.txt";
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
    // Delete student restrictions of the sharedStudent to not interfere with other tests.
    await db.studentRestriction.delete({ student: { id: sharedStudent.id } });
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
    await deleteSFASData(db);
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

  it("Should import a resolved SSD and SSR as a single resolved SSR, and a resolved SSRN when the student does not have SSR or SSRN restrictions in his account.", async () => {
    // Arrange
    // Queued job.
    const mockedJob = mockBullJob<void>();
    mockDownloadFiles(sftpClientMock, [
      SFAS_TO_SIMS_SSR_SSRN_RESOLVED_RESTRICTIONS,
    ]);
    // Act
    const result = await processor.processQueue(mockedJob.job);
    // Assert
    // Expect the file was archived on SFTP.
    expect(result).toStrictEqual([
      "Completed processing SFAS integration files.",
    ]);
    expect(sftpClientMock.rename).toHaveBeenCalled();
    // Expect a total of 2 restrictions to be inserted.
    // The file has 3 resolved restrictions but SSD and SSR must be mapped
    // to SSR in SIMS and imported once.
    const studentRestrictions = await db.studentRestriction.find({
      select: {
        id: true,
        restriction: {
          restrictionCode: true,
        },
      },
      relations: { restriction: true },
      where: { student: { id: sharedStudent.id }, isActive: false },
    });
    expect(studentRestrictions.length).toBe(2);
    const restrictionsCount: Record<string, number> = {};
    studentRestrictions.forEach((restriction) => {
      const code = restriction.restriction.restrictionCode;
      restrictionsCount[code] = (restrictionsCount[code] || 0) + 1;
    });
    // Assert the count of individual restriction types.
    expect(restrictionsCount).toStrictEqual({
      [RestrictionCode.SSR]: 1,
      [RestrictionCode.SSRN]: 1,
    });
  });

  it(
    "Should import a resolved SSRN and do not import the SSD and SSR resolved restrictions " +
      "when the student already has a SSR restriction and does not have a SSRN restriction in his account.",
    async () => {
      // Arrange
      const studentRestrictionSSR = await findAndSaveRestriction(
        RestrictionCode.SSR,
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [
        SFAS_TO_SIMS_SSR_SSRN_RESOLVED_RESTRICTIONS,
      ]);
      // Act
      const result = await processor.processQueue(mockedJob.job);
      // Assert
      expect(result).toStrictEqual([
        "Completed processing SFAS integration files.",
      ]);
      // Expect the file was archived on SFTP.
      expect(sftpClientMock.rename).toHaveBeenCalled();
      // Expect a total of 1 restrictions to be inserted.
      // The file has 3 resolved restrictions but SSD and SSR must be mapped
      // to SSR in SIMS and imported once.
      // There is already a SSR restriction in the student account, hence it is not imported again.
      const studentRestrictions = await db.studentRestriction.find({
        select: {
          id: true,
          isActive: true,
          restriction: {
            restrictionCode: true,
          },
        },
        relations: { restriction: true },
        where: {
          student: { id: sharedStudent.id },
          id: Not(studentRestrictionSSR.id),
        },
      });
      expect(studentRestrictions.length).toBe(1);
      const [expectedRestriction] = studentRestrictions;
      expect(expectedRestriction).toEqual({
        id: expect.any(Number),
        isActive: false,
        restriction: {
          restrictionCode: RestrictionCode.SSRN,
        },
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
          student: { id: true },
        },
        relations: { student: true },
        where: {
          id: 83543,
        },
        loadEagerRelations: false,
      });
      expect(sFASIndividual).toEqual({
        id: 83543,
        firstName: "GIORGIO",
        lastName: "INNAVOIG",
        birthDate: "1966-07-21",
        sin: "121380175",
        bcslOveraward: 714.3,
        cslOveraward: 741.3,
        student: { id: student.id },
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
      // Expect the file contains 4 records.
      expect(
        mockedJob.containLogMessages([
          "File contains 4 records.",
          "Updating student ids for SFAS individuals.",
          "Student ids updated.",
          "Updating and inserting new disbursement overaward balances from sfas to disbursement overawards table.",
          "New disbursement overaward balances inserted to disbursement overawards table.",
          "Inserting student restrictions from SFAS restrictions data.",
          "Inserted student restrictions from SFAS restrictions data.",
        ]),
      ).toBe(true);
      // Verify the SFAS Individual created.
      const expectedSFASIndividual: Partial<SFASIndividual> = {
        id: 94541,
        firstName: "BENJAMIN",
        lastName: "FRANKLIN",
        birthDate: "1949-11-16",
        sin: "108796293",
        pdStatus: false,
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
      };
      const sfasIndividual = await db.sfasIndividual.findOne({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          sin: true,
          pdStatus: true,
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
        where: { id: expectedSFASIndividual.id },
      });
      expect(sfasIndividual).toEqual(expectedSFASIndividual);

      // Verify the SFAS Application created.
      const expectedSFASApplication: Partial<SFASApplication> = {
        id: 14541,
        individual: { id: 94541 } as SFASIndividual,
        startDate: "2024-12-01",
        endDate: "2025-02-28",
        programYearId: 20242025,
        bslAward: 2500,
        cslAward: 2500,
        bcagAward: 0,
        bgpdAward: 0,
        csfgAward: 1500,
        csgtAward: 0,
        csgdAward: 0,
        csgpAward: 0,
        sbsdAward: 0,
      };
      const sfasApplication = await db.sfasApplication.findOne({
        select: {
          id: true,
          individual: { id: true },
          startDate: true,
          endDate: true,
          programYearId: true,
          bslAward: true,
          cslAward: true,
          bcagAward: true,
          bgpdAward: true,
          csfgAward: true,
          csgtAward: true,
          csgdAward: true,
          csgpAward: true,
          sbsdAward: true,
        },
        relations: { individual: true },
        where: { id: expectedSFASApplication.id },
      });
      expect(sfasApplication).toEqual(expectedSFASApplication);

      // Verify SFAS Application Dependant created.
      const expectedSFASApplicationDependant: Partial<SFASApplicationDependant> =
        {
          id: 1112833838,
          application: { id: 14541 } as SFASApplication,
          dependantName: "JOHN SMITH",
          dependantBirthDate: "1970-01-31",
        };
      const sfasApplicationDependant =
        await db.sfasApplicationDependant.findOne({
          select: {
            id: true,
            application: { id: true },
            dependantName: true,
            dependantBirthDate: true,
          },
          relations: { application: true },
          where: { id: expectedSFASApplicationDependant.id },
        });
      expect(sfasApplicationDependant).toEqual(
        expectedSFASApplicationDependant,
      );

      // Verify SFAS Application Disbursement created.
      const expectedSFASApplicationDisbursement: Partial<SFASApplicationDisbursement> =
        {
          id: 1148372345,
          application: { id: 14541 } as SFASApplication,
          fundingType: "CSL",
          fundingAmount: 300,
          fundingDate: "2025-01-20",
          dateIssued: "2025-01-30",
        };
      const sfasApplicationDisbursement =
        await db.sfasApplicationDisbursement.findOne({
          select: {
            id: true,
            application: { id: true },
            fundingType: true,
            fundingAmount: true,
            fundingDate: true,
            dateIssued: true,
          },
          relations: { application: true },
          where: { id: expectedSFASApplicationDisbursement.id },
        });
      expect(sfasApplicationDisbursement).toEqual(
        expectedSFASApplicationDisbursement,
      );
    },
  );

  it(
    "Should log process summary warning and proceed to process the next record " +
      "when the SFAS file has one or more records with an invalid record type.",
    async () => {
      // Arrange
      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [INVALID_RECORD_TYPE_FILENAME]);

      // Act
      await processor.processQueue(mockedJob.job);

      // Assert
      // Expect the file was archived on SFTP.
      expect(sftpClientMock.rename).toHaveBeenCalled();
      // Expect the warning message logged for invalid record type.
      expect(
        mockedJob.containLogMessages([
          "WARN: No data importer to process the record type 700 at line number 2.",
          "File contains 2 records.",
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

  it(
    "Should import SFAS individual and application records with all the values " +
      "when the SFAS file has values for almost all the fields for individual and application records.",
    async () => {
      // Arrange
      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [
        SFAS_INDIVIDUAL_AND_APPLICATION_ALL_VALUES_FILENAME,
      ]);

      // Act
      await processor.processQueue(mockedJob.job);

      // Assert
      // Expect the file was archived on SFTP.
      expect(sftpClientMock.rename).toHaveBeenCalled();
      // Expect the file contains 4 records.
      expect(
        mockedJob.containLogMessages([
          "File contains 2 records.",
          "Updating student ids for SFAS individuals.",
          "Student ids updated.",
          "Updating and inserting new disbursement overaward balances from sfas to disbursement overawards table.",
          "New disbursement overaward balances inserted to disbursement overawards table.",
          "Inserting student restrictions from SFAS restrictions data.",
          "Inserted student restrictions from SFAS restrictions data.",
        ]),
      ).toBe(true);
      // Verify the SFAS Individual created.
      const expectedSFASIndividual: Partial<SFASIndividual> = {
        id: 94541,
        firstName: "BENJAMIN",
        lastName: "FRANKLIN",
        birthDate: "1949-11-16",
        sin: "108796293",
        pdStatus: false,
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
        initials: "A",
        addressLine1: "1511 new street",
        addressLine2: "My address line 2",
        city: "Victoria",
        provinceState: "BC",
        country: "CAN",
        phoneNumber: 1231231234,
        postalZipCode: "P4K 1K0",
        lmptAwardAmount: 350,
        lmpuAwardAmount: 245,
      };
      const sfasIndividual = await db.sfasIndividual.findOne({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          sin: true,
          pdStatus: true,
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
          initials: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          provinceState: true,
          country: true,
          phoneNumber: true,
          postalZipCode: true,
          lmptAwardAmount: true,
          lmpuAwardAmount: true,
        },
        where: { id: expectedSFASIndividual.id },
      });
      expect(sfasIndividual).toEqual(expectedSFASIndividual);

      // Verify the SFAS Application created.
      const expectedSFASApplication: Partial<SFASApplication> = {
        id: 14541,
        individual: { id: 94541 } as SFASIndividual,
        startDate: "2024-12-01",
        endDate: "2025-02-28",
        programYearId: 20242025,
        bslAward: 2500,
        cslAward: 2500,
        bcagAward: 0,
        bgpdAward: 0,
        csfgAward: 1500,
        csgtAward: 0,
        csgdAward: 0,
        csgpAward: 0,
        sbsdAward: 0,
        applicationCancelDate: "2025-01-30",
        applicationNumber: 2024123456,
        livingArrangements: "N",
        maritalStatus: "MA",
        marriageDate: "2003-10-24",
        bcResidencyFlag: "Y",
        permanentResidencyFlag: "N",
        grossIncomePreviousYear: 72000,
        institutionCode: "AUAA",
        applicationStatusCode: "RECD",
        educationPeriodWeeks: 42,
        courseLoad: 100,
        assessedCostsLivingAllowance: 110,
        assessedCostsExtraShelter: 120,
        assessedCostsChildCare: 130,
        assessedCostsAlimony: 140,
        assessedCostsLocalTransport: 150,
        assessedCostsReturnTransport: 160,
        assessedCostsTuition: 170,
        assessedCostsBooksAndSupplies: 180,
        assessedCostsExceptionalExpenses: 190,
        assessedCostsOther: 210,
        assessedEligibleNeed: 220,
        withdrawalDate: "2024-02-20",
        withdrawalReason: "QUIT",
        withdrawalActiveFlag: "Y",
      };
      const sfasApplication = await db.sfasApplication.findOne({
        select: {
          id: true,
          individual: { id: true },
          startDate: true,
          endDate: true,
          programYearId: true,
          bslAward: true,
          cslAward: true,
          bcagAward: true,
          bgpdAward: true,
          csfgAward: true,
          csgtAward: true,
          csgdAward: true,
          csgpAward: true,
          sbsdAward: true,
          applicationCancelDate: true,
          applicationNumber: true,
          livingArrangements: true,
          maritalStatus: true,
          marriageDate: true,
          bcResidencyFlag: true,
          permanentResidencyFlag: true,
          grossIncomePreviousYear: true,
          institutionCode: true,
          applicationStatusCode: true,
          educationPeriodWeeks: true,
          courseLoad: true,
          assessedCostsLivingAllowance: true,
          assessedCostsExtraShelter: true,
          assessedCostsChildCare: true,
          assessedCostsAlimony: true,
          assessedCostsLocalTransport: true,
          assessedCostsReturnTransport: true,
          assessedCostsTuition: true,
          assessedCostsBooksAndSupplies: true,
          assessedCostsExceptionalExpenses: true,
          assessedCostsOther: true,
          assessedEligibleNeed: true,
          withdrawalDate: true,
          withdrawalReason: true,
          withdrawalActiveFlag: true,
        },
        relations: { individual: true },
        where: { id: expectedSFASApplication.id },
      });
      expect(sfasApplication).toEqual(expectedSFASApplication);
    },
  );

  /**
   * Delete all the legacy data for clean data execution.
   * @param db data source.
   */
  async function deleteSFASData(db: E2EDataSources) {
    await Promise.all([
      db.sfasIndividual.createQueryBuilder().delete().execute(),
      db.sfasApplication.createQueryBuilder().delete().execute(),
      db.sfasPartTimeApplications.createQueryBuilder().delete().execute(),
      db.sfasRestriction.createQueryBuilder().delete().execute(),
      db.sfasApplicationDependant.createQueryBuilder().delete().execute(),
      db.sfasApplicationDisbursement.createQueryBuilder().delete().execute(),
    ]);
  }

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
