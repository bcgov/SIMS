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
import * as dayjs from "dayjs";
import * as path from "path";
import { SFASIntegrationScheduler } from "../sfas-integration.scheduler";
import { Student, StudentRestriction } from "@sims/sims-db";
import { SystemUsersService } from "@sims/services";

// SFAS received file mocks.
const SFAS_LEGACY_RESTRICTION_FILENAME =
  "SFAS-TO-SIMS-2024MAR07-LEGACY-RESTRICTIONS.txt";
const SFAS_ALL_RESTRICTIONS_FILENAME =
  "SFAS-TO-SIMS-2024MAR07-ALL-RESTRICTIONS.txt";
const SFAS_SAIL_DATA_FILENAME =
  "SFAS-TO-SIMS-2024MAR21-PY-MAXIMUM-DATA-IMPORT.txt";

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
    // Expect the file was deleted from SFTP.
    expect(sftpClientMock.delete).toHaveBeenCalled();
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
      // Expect the file was deleted from SFTP.
      expect(sftpClientMock.delete).toHaveBeenCalled();
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
      // Expect the file was deleted from SFTP.
      expect(sftpClientMock.delete).toHaveBeenCalled();
      // Expect the file contains 2 records.
      expect(processingResults[0].summary[1]).toBe("File contains 2 records.");
      const startDate = dayjs("20230801", "YYYYMMDD", false).format(
        "YYYY-MM-DD",
      );
      const endDate = dayjs("20240201", "YYYYMMDD", false).format("YYYY-MM-DD");
      const sfasPartTimeApplicationsCount =
        await db.sfasPartTimeApplications.count({
          where: {
            startDate: startDate,
            endDate: endDate,
          },
        });
      expect(sfasPartTimeApplicationsCount).toBe(2);
      // Expect the database data to be the same as the file data for one record.
      const firstSFASPartTimeApplication =
        await db.sfasPartTimeApplications.findOne({
          select: {
            startDate: true,
            endDate: true,
            CSGPAward: true,
            SBSDAward: true,
            CSPTAward: true,
            CSGDAward: true,
            BCAGAward: true,
            CSLPAward: true,
            programYearId: true,
          },
          where: {
            individualId: 950000360,
          },
        });
      expect(firstSFASPartTimeApplication).toEqual({
        startDate: startDate,
        endDate: endDate,
        CSGPAward: 4000,
        SBSDAward: 300,
        CSPTAward: 30000,
        CSGDAward: 165,
        BCAGAward: 24,
        CSLPAward: 500,
        programYearId: 20232024,
      });
      const secondSFASPartTimeApplication =
        await db.sfasPartTimeApplications.findOne({
          select: {
            startDate: true,
            endDate: true,
            CSGPAward: true,
            SBSDAward: true,
            CSPTAward: true,
            CSGDAward: true,
            BCAGAward: true,
            CSLPAward: true,
            programYearId: true,
          },
          where: {
            individualId: 950000361,
          },
        });
      expect(secondSFASPartTimeApplication).toEqual({
        startDate: startDate,
        endDate: endDate,
        CSGPAward: 5000,
        SBSDAward: 400,
        CSPTAward: 40000,
        CSGDAward: 166,
        BCAGAward: 25,
        CSLPAward: 600,
        programYearId: 20232024,
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
