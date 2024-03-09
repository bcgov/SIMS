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
  mockDownloadFiles,
  saveFakeStudent,
  saveFakeStudentRestriction,
  RestrictionCode,
} from "@sims/test-utils";
import * as Client from "ssh2-sftp-client";
import { Job } from "bull";
import * as path from "path";
import { SFASIntegrationScheduler } from "../sfas-integration.scheduler";
import { In } from "typeorm";
import { Restriction, Student, StudentRestriction } from "@sims/sims-db";
import { SystemUsersService } from "@sims/services";
import { share } from "rxjs";

// SFAS received file mocks.
const SFAS_LEGACY_RESTRICTION_FILENAME =
  "SFAS-TO-SIMS-2024MAR07-LEGACY-RESTRICTIONS.txt";
const SFAS_ALL_RESTRICTIONS_FILENAME =
  "SFAS-TO-SIMS-2024MAR07-ALL-RESTRICTIONS.txt";

describe(describeProcessorRootTest(QueueNames.SFASIntegration), () => {
  let app: INestApplication;
  let processor: SFASIntegrationScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;
  let sfasDownloadFolder: string;
  let studentExists: Student;
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
    studentExists = await db.student.findOne({
      where: {
        birthDate: getISODateOnlyString(new Date("1998-03-24")),
        user: { lastName: "FOUR" },
        sinValidation: { sin: "900041310" },
      },
    });
    sharedStudent = studentExists;
    if (!studentExists) {
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
    // // Empty the student restrictions table for each test.
    // const studentRestrictionIds = await db.studentRestriction.find({
    //   select: { id: true },
    // });
    // const ids = studentRestrictionIds.map(
    //   (studentRestrictionId) => studentRestrictionId.id,
    // );
    // await db.studentRestriction.delete({ id: In(ids) });
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
        restriction: { restrictionCode: "LGCY" },
        isActive: true,
      },
    });
    const studentRestriction = await db.studentRestriction.findOne({
      select: { creator: { id: true } },
      relations: { creator: true },
      where: {
        student: { id: sharedStudent.id },
        restriction: { restrictionCode: "LGCY" },
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
      "Should insert a restriction after mapping it to SIMS restriction when it is either inactive or is not at all present in the SIMS student restrictions, ",
    async () => {
      // Arrange
      const restrictionB6B = await findRestriction(RestrictionCode.B6B);
      const restrictionLGCY = await findRestriction(RestrictionCode.LGCY);
      const restrictionSSR = await findRestriction(RestrictionCode.SSR);
      await saveStudentRestriction(restrictionB6B);
      await saveStudentRestriction(restrictionLGCY);
      const studentRestrictionSSR = await saveStudentRestriction(
        restrictionSSR,
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

  /**
   * Saves student restrictions.
   * @param restriction restriction to be saved.
   * @returns the saved student restriction.
   */
  async function saveStudentRestriction(
    restriction: Restriction,
  ): Promise<StudentRestriction> {
    return saveFakeStudentRestriction(db.dataSource, {
      student: sharedStudent,
      restriction,
    });
  }
  /**
   * Gets the restriction by the restriction code.
   * @param restrictionCode restriction code to search.
   * @returns the found restriction.
   */
  async function findRestriction(
    restrictionCode: RestrictionCode,
  ): Promise<Restriction> {
    return db.restriction.findOne({
      where: { restrictionCode },
    });
  }
});
