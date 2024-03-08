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
  SFAS_ALL_RESTRICTIONS_FILENAME,
  SFAS_LEGACY_RESTRICTION_FILENAME,
  RestrictionCode,
} from "@sims/test-utils";
import * as Client from "ssh2-sftp-client";
import { Job } from "bull";
import * as path from "path";
import { SFASIntegrationScheduler } from "../sfas-integration.scheduler";
import { In } from "typeorm";
import { Student } from "@sims/sims-db";
import { SystemUsersService } from "@sims/services";

describe(describeProcessorRootTest(QueueNames.SFASIntegration), () => {
  let app: INestApplication;
  let processor: SFASIntegrationScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;
  let sfasDownloadFolder: string;
  let studentExists: Student;
  let student: Student;
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
    student = studentExists;
    if (!studentExists) {
      student = await saveFakeStudent(db.dataSource);
      // Update the student to ensure that the student imported from SFAS is the same student as the one created above.
      student.birthDate = getISODateOnlyString(new Date("1998-03-24"));
      student.user.lastName = "FOUR";
      student.sinValidation.sin = "900041310";
      await db.student.save(student);
    }
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    // Empty the student restrictions table for each test.
    const studentRestrictionIds = await db.studentRestriction.find({
      select: { id: true },
    });
    const ids = studentRestrictionIds.map(
      (studentRestrictionId) => studentRestrictionId.id,
    );
    await db.studentRestriction.delete({ id: In(ids) });
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
    // Expect only one Legacy restriction to be inserted.
    const studentRestrictionsCount = await db.studentRestriction.count({
      where: {
        student: { id: student.id },
        restriction: { restrictionCode: "LGCY" },
      },
    });
    expect(studentRestrictionsCount).toBe(1);
    const studentRestriction = await db.studentRestriction.findOne({
      select: { creator: { id: true } },
      relations: { creator: true },
      where: {
        student: { id: student.id },
        restriction: { restrictionCode: "LGCY" },
      },
    });
    expect(studentRestriction.creator.id).toEqual(
      systemUsersService.systemUser.id,
    );
  });

  it(
    "Should not insert a restriction to SIMS student restrictions when the same restriction is imported from SFAS but is already active in SIMS, " +
      "Should not insert a legacy restriction when a legacy restriction is already active in SIMS for the student, " +
      "Should insert a restriction after mapping it to SIMS restriction when it is either inactive or is not at all present in the SIMS student restrictions, " +
      "Should not insert a restriction when it has a restriction resolution date.",
    async () => {
      // Arrange
      const restrictionB6B = await db.restriction.findOne({
        where: { restrictionCode: "B6B" },
      });
      const restrictionLGCY = await db.restriction.findOne({
        where: { restrictionCode: "LGCY" },
      });
      const restrictionSSR = await db.restriction.findOne({
        where: { restrictionCode: "SSR" },
      });
      await saveFakeStudentRestriction(db.dataSource, {
        student,
        restriction: restrictionB6B,
      });
      await saveFakeStudentRestriction(db.dataSource, {
        student,
        restriction: restrictionLGCY,
      });
      const studentRestrictionSSR = await saveFakeStudentRestriction(
        db.dataSource,
        {
          student,
          restriction: restrictionSSR,
        },
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
      // Two originally inserted active restrictions (LGCY & B6B) from before the file processing and then two AF restrictions and one SSR added from the file import.
      const studentRestrictions = await db.studentRestriction.find({
        select: {
          id: true,
          restriction: {
            restrictionCode: true,
          },
        },
        relations: { restriction: true },
        where: { student: { id: student.id }, isActive: true },
      });
      expect(studentRestrictions.length).toBe(5);
      const restrictionsMap = new Map<RestrictionCode, number>();
      studentRestrictions.forEach((studentRestriction) => {
        const restrictionCode = studentRestriction.restriction
          .restrictionCode as RestrictionCode;
        if (!restrictionsMap.has(restrictionCode)) {
          restrictionsMap.set(restrictionCode, 1);
        } else {
          restrictionsMap.set(
            restrictionCode,
            restrictionsMap.get(restrictionCode) + 1,
          );
        }
      });
      // Assert the count of individual restriction types.
      restrictionsMap.forEach((restrictionCount, restrictionCode) => {
        switch (restrictionCode) {
          case RestrictionCode.LGCY:
            expect(restrictionCount).toBe(1);
            break;
          case RestrictionCode.AF:
            expect(restrictionCount).toBe(2);
            break;
          case RestrictionCode.B6B:
            expect(restrictionCount).toBe(1);
            break;
          case RestrictionCode.SSR:
            expect(restrictionCount).toBe(1);
        }
      });
    },
  );
});
