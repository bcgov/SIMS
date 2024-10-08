import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames, getISODateOnlyString } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../../test/helpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeStudent,
  saveFakeStudentRestriction,
  RestrictionCode,
} from "@sims/test-utils";
import { mockDownloadFiles } from "@sims/test-utils/mocks";
import * as Client from "ssh2-sftp-client";
import { Job } from "bull";
import * as path from "path";
import { SFASIntegrationScheduler } from "../sfas-integration.scheduler";
import { Student, StudentRestriction } from "@sims/sims-db";
import { SystemUsersService } from "@sims/services";
import { In } from "typeorm";

// SFAS received file mocks.
const SFAS_LEGACY_RESTRICTION_FILENAME =
  "SFAS-TO-SIMS-2024MAR07-LEGACY-RESTRICTIONS.txt";
const SFAS_ALL_RESTRICTIONS_FILENAME =
  "SFAS-TO-SIMS-2024MAR07-ALL-RESTRICTIONS.txt";
const SFAS_SAIL_DATA_FILENAME =
  "SFAS-TO-SIMS-2024MAR21-PT-APPLICATION-DATA-IMPORT.txt";
const SFAS_INDIVIDUAL_INVALID_RECORDS_INCONSISTENT_WITH_DATA_IMPORT_FILENAME =
  "SFAS-TO-SIMS-INVALID-INDIVIDUAL-RECORDS-INCONSISTENT-WITH-DATA-IMPORT.txt";
const SFAS_INDIVIDUAL_VALID_RECORDS_FILENAME =
  "SFAS-TO-SIMS-VALID-INDIVIDUAL-RECORDS.txt";

describe(describeProcessorRootTest(QueueNames.SFASIntegration), () => {
  let app: INestApplication;
  let processor: SFASIntegrationScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;
  let sfasDownloadFolder: string;
  let sharedStudent: Student;
  let systemUsersService: SystemUsersService;

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
    systemUsersService = nestApplication.get(SystemUsersService);
    // Create student if it doesn't exist.
    sharedStudent = await db.student.findOne({
      where: {
        birthDate: getISODateOnlyString(new Date("1998-03-24")),
        user: { lastName: "FOUR" },
        sinValidation: { sin: "900041310" },
      },
    });
    if (!sharedStudent) {
      sharedStudent = await saveFakeStudent(db.dataSource);
      // Update the student to ensure that the student imported from SFAS is the same student as the one created above.
      sharedStudent.birthDate = getISODateOnlyString(new Date("1998-03-24"));
      sharedStudent.user.lastName = "FOUR";
      sharedStudent.sinValidation.sin = "900041310";
      await db.student.save(sharedStudent);
    }
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    // Set the isActive field to false for each record of the sharedStudent in the student restrictions table to not interfere with other tests.
    await db.studentRestriction.update(
      { student: { id: sharedStudent.id } },
      { isActive: false },
    );
  });

  it("Should add only one legacy restriction for the student when one or more restrictions are imported from SFAS which do not have a mapping to the SIMS restrictions", async () => {
    // Arrange
    // Queued job.
    const job = createMock<Job<void>>();
    mockDownloadFiles(sftpClientMock, [SFAS_LEGACY_RESTRICTION_FILENAME]);
    // Act
    await processor.processSFASIntegrationFiles(job);
    // Assert
    // Expect the file was archived on SFTP.
    expect(sftpClientMock.rename).toHaveBeenCalled();
    const studentRestrictionsCount = await db.studentRestriction.count({
      where: {
        student: { id: sharedStudent.id },
        restriction: { restrictionCode: RestrictionCode.LGCY },
        isActive: true,
      },
    });
    const studentRestriction = await db.studentRestriction.findOne({
      select: { creator: { id: true } },
      relations: { creator: true },
      where: {
        student: { id: sharedStudent.id },
        restriction: { restrictionCode: RestrictionCode.LGCY },
        isActive: true,
      },
    });
    // Expect only one Legacy restriction to be inserted.
    expect(studentRestrictionsCount).toBe(1);
    // Expect the restriction to be created by a system user.
    expect(studentRestriction.creator.id).toEqual(
      systemUsersService.systemUser.id,
    );
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
      const job = createMock<Job<void>>();
      mockDownloadFiles(sftpClientMock, [SFAS_ALL_RESTRICTIONS_FILENAME]);
      // Act
      await processor.processSFASIntegrationFiles(job);
      // Assert
      // Expect the file was archived on SFTP.
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
      const job = createMock<Job<void>>();
      mockDownloadFiles(sftpClientMock, [SFAS_SAIL_DATA_FILENAME]);
      // Act
      const processingResults = await processor.processSFASIntegrationFiles(
        job,
      );
      // Assert
      // Expect the file was archived on SFTP.
      expect(sftpClientMock.rename).toHaveBeenCalled();
      // Expect the file contains 3 records.
      expect(processingResults[0].summary[1]).toBe("File contains 3 records.");
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
        },
        where: {
          individualId: In([950000360, 950000361, 950000362]),
        },
        order: { individualId: "ASC" },
      });
      expect(sfasPartTimeApplications.length).toBe(3);
      const [
        firstSFASPartTimeApplication,
        secondSFASPartTimeApplication,
        thirdSFASPartTimeApplication,
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
      });
    },
  );

  it(
    "Should not add SFAS individual data records when importing invalid data from SFAS " +
      "when the record type is the individual data record.",
    async () => {
      // Arrange
      // Queued job.
      const job = createMock<Job<void>>();
      mockDownloadFiles(sftpClientMock, [
        SFAS_INDIVIDUAL_INVALID_RECORDS_INCONSISTENT_WITH_DATA_IMPORT_FILENAME,
      ]);
      // Act
      await processor.processSFASIntegrationFiles(job);
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
      const job = createMock<Job<void>>();
      mockDownloadFiles(sftpClientMock, [
        SFAS_INDIVIDUAL_VALID_RECORDS_FILENAME,
      ]);
      // Act
      const processingResults = await processor.processSFASIntegrationFiles(
        job,
      );
      // Assert
      const downloadedFile = path.join(
        process.env.SFAS_RECEIVE_FOLDER,
        SFAS_INDIVIDUAL_VALID_RECORDS_FILENAME,
      );
      expect(processingResults).toStrictEqual([
        {
          summary: [
            `Processing file ${downloadedFile}.`,
            "File contains 3 records.",
          ],
          success: true,
        },
        {
          success: true,
          summary: [
            "Updating student ids for SFAS individuals.",
            "Student ids updated.",
            "Updating and inserting new disbursement overaward balances from sfas to disbursement overawards table.",
            "New disbursement overaward balances inserted to disbursement overawards table.",
            "Inserting student restrictions from SFAS restrictions data.",
            "Inserted student restrictions from SFAS restrictions data.",
          ],
        },
      ]);
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
        firstName: "000000000083540 GIOVANNI",
        lastName: "GIORGIO",
        birthDate: "1966-07-21",
        sin: "121380174",
        pdStatus: true,
        ppdStatus: true,
        ppdStatusDate: "1967-07-22",
        msfaaNumber: "9876543210",
        msfaaSignedDate: "2024-07-12",
        neb: 5000,
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
        firstName: "000000000083541 GIOVANNI",
        lastName: "GIORGIO",
        birthDate: "1949-11-16",
        sin: "108796293",
        pdStatus: false,
        ppdStatus: false,
        ppdStatusDate: null,
        msfaaNumber: "9876543211",
        msfaaSignedDate: "2024-07-13",
        neb: 5000,
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
        firstName: "000000000083542 GIOVANNI",
        lastName: "GIORGIO",
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
        cslOveraward: 0,
        bcslOveraward: 11039,
        cmsOveraward: 0,
        grantOveraward: 0,
        withdrawals: null,
        unsuccessfulCompletion: 0,
        partTimeMSFAANumber: null,
        partTimeMSFAAEffectiveDate: null,
      });
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
