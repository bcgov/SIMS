import { mockDownloadFiles } from "@sims/test-utils/mocks";
import {
  createTestingAppModule,
  describeQueueProcessorRootTest,
  mockBullJob,
} from "../../../../../../test/helpers";
import { INestApplication } from "@nestjs/common";
import { getPSTPDTDateTime, QueueNames } from "@sims/utilities";
import { DeepMocked } from "@golevelup/ts-jest";
import * as Client from "ssh2-sftp-client";
import { join, parse } from "node:path";
import { FederalRestrictionsIntegrationScheduler } from "../federal-restrictions-integration.scheduler";
import {
  createE2EDataSources,
  E2EDataSources,
  ensureStudentExists,
} from "@sims/test-utils";
import {
  RestrictionActionType,
  RestrictionNotificationType,
  RestrictionType,
  Student,
} from "@sims/sims-db";
import MockDate from "mockdate";
import { IsNull } from "typeorm";
import { SystemUsersService } from "@sims/services";

/**
 * Close to real-world Federal Restrictions file with 750 records, including one record with an unknown restriction
 * code to validate the creation of new restrictions when unknown codes are present in the file.
 */
const FEDERAL_RESTRICTIONS_FILE = "DCSLS.PBC.RESTR.LIST.D20260406.zip";
/**
 * Fake restriction file that should be considered older than the FEDERAL_RESTRICTIONS_FILE, used to validate the
 * deletion of old files from the SFTP server.
 */
const FEDERAL_RESTRICTIONS_FILE_OLD = "DCSLS.PBC.RESTR.LIST.D20260405.zip";
/**
 * Fake new restriction code that must be created and generate a warning log message.
 */
const UNKNOWN_RESTRICTION_CODE = "ZZ";
/**
 * Current student on SIMS that will have a match on the federal restriction file with the last name, date of birth and SIN,
 * used to validate the creation of the student restriction and notification.
 */
const STUDENT_LAST_NAME = "HENDRICKS_a6f28017-90a7-4349";
const STUDENT_SIN = "743006694";
const STUDENT_DOB = "2005-11-12";

describe(
  describeQueueProcessorRootTest(QueueNames.FederalRestrictionsIntegration),
  () => {
    let app: INestApplication;
    let processor: FederalRestrictionsIntegrationScheduler;
    let db: E2EDataSources;
    let systemUsersService: SystemUsersService;
    let sftpClientMock: DeepMocked<Client>;
    let student: Student;
    let downloadedFile: string;
    let nonDownloadedOldFile: string;
    let archivedDownloadedFile: string;
    let archivedNonDownloadedOldFile: string;

    beforeAll(async () => {
      // Set the ESDC response folder to the mock folder.
      const mockResponseFolder = join(
        __dirname,
        "e2e",
        "federal-restrictions-response-files",
      );
      process.env.ESDC_RESPONSE_FOLDER = mockResponseFolder;
      [downloadedFile, nonDownloadedOldFile] = [
        FEDERAL_RESTRICTIONS_FILE,
        FEDERAL_RESTRICTIONS_FILE_OLD,
      ].map((file) => join(mockResponseFolder, file));
      [archivedDownloadedFile, archivedNonDownloadedOldFile] = [
        FEDERAL_RESTRICTIONS_FILE,
        FEDERAL_RESTRICTIONS_FILE_OLD,
      ].map((file) => join(mockResponseFolder, "Archive", parse(file).name));

      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(FederalRestrictionsIntegrationScheduler);
      systemUsersService = app.get(SystemUsersService);
      // Student with match data to receive the federal restriction.
      student = await ensureStudentExists(db, {
        lastName: STUDENT_LAST_NAME,
        birthDate: STUDENT_DOB,
        sin: STUDENT_SIN,
      });
    });

    beforeEach(async () => {
      MockDate.reset();
      jest.clearAllMocks();
      await Promise.all([
        db.studentRestriction.delete({ student: { id: student.id } }),
        db.notification.update(
          { dateSent: IsNull(), user: { id: student.user.id } },
          { dateSent: new Date() },
        ),
        db.restriction.delete({ restrictionCode: UNKNOWN_RESTRICTION_CODE }),
      ]);
    });

    it(
      "Should process the federal restrictions file, create a student federal restriction, generate a notification, and create a new Federal restriction" +
        " when there is a federal restriction match for the last name, SIN and date of birth, the student does not have an active restriction, and an unknown code is present in the file.",
      async () => {
        // Arrange
        const now = new Date();
        MockDate.set(now);
        mockDownloadFiles(sftpClientMock, [
          FEDERAL_RESTRICTIONS_FILE,
          FEDERAL_RESTRICTIONS_FILE_OLD,
        ]);
        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        const result = await processor.processQueue(mockedJob.job);

        // Assert

        expect(result).toEqual([
          "Federal restrictions import process finished.",
          // Only the most recent file should be processed.
          `Processed file: ${downloadedFile}`,
          // Files must be ordered from oldest to newest.
          `Files found: ${nonDownloadedOldFile}, ${downloadedFile}.`,
          "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
          "Error(s): 0, Warning(s): 1, Info: 5",
        ]);

        // Check for the log messages.
        expect(
          mockedJob.containLogMessages([
            "Acquiring lock for execution.",
            "Lock acquired. Starting federal restrictions import process.",
            `Processing file ${downloadedFile}.`,
            `WARN: New restrictions created: ${UNKNOWN_RESTRICTION_CODE}`,
            "1 notification(s) generated.",
          ]),
        ).toBe(true);

        // Assert the processed files and older files were archived in the SFTP server.
        expect(sftpClientMock.rename).toHaveBeenNthCalledWith(
          1,
          nonDownloadedOldFile,
          expect.stringContaining(archivedNonDownloadedOldFile),
        );
        expect(sftpClientMock.rename).toHaveBeenNthCalledWith(
          2,
          downloadedFile,
          expect.stringContaining(archivedDownloadedFile),
        );

        // Assert the total federal restrictions were imported.
        const importedRestrictions = await db.federalRestriction.count();
        expect(importedRestrictions).toBe(750);

        // Assert imported restriction is linked to the student and is active.
        const studentRestrictions = await db.studentRestriction.find({
          select: {
            id: true,
            restriction: {
              id: true,
              restrictionType: true,
              restrictionCode: true,
            },
            isActive: true,
          },
          relations: { restriction: true },
          where: { student: { id: student?.id } },
        });
        expect(studentRestrictions).toEqual([
          {
            id: expect.any(Number),
            isActive: true,
            restriction: {
              id: expect.any(Number),
              restrictionType: RestrictionType.Federal,
              restrictionCode: "X",
            },
          },
        ]);
        // Assert a notification was generated for the student.
        const notifications = await db.notification.find({
          select: {
            id: true,
            notificationMessage: { id: true },
            messagePayload: true,
          },
          relations: { notificationMessage: true },
          where: {
            user: { id: student.user.id },
            dateSent: IsNull(),
          },
        });
        expect(notifications).toEqual([
          {
            id: expect.any(Number),
            notificationMessage: { id: expect.any(Number) },
            messagePayload: {
              template_id: "2b64245f-770c-4493-9d3c-4e0f86773987",
              email_address: student.user.email,
              personalisation: {
                date: `${getPSTPDTDateTime(now)} PST/PDT`,
                lastName: student.user.lastName,
                givenNames: student.user.firstName,
              },
            },
          },
        ]);
        // Assert the unknown restriction code is present in the federal restriction table.
        const unknownRestriction = await db.restriction.findOne({
          select: {
            id: true,
            description: true,
            restrictionType: true,
            restrictionCategory: true,
            actionType: true,
            notificationType: true,
            createdAt: true,
            creator: { id: true },
          },
          relations: { creator: true },
          where: { restrictionCode: UNKNOWN_RESTRICTION_CODE },
          loadEagerRelations: false,
        });
        expect(unknownRestriction).toEqual({
          id: expect.any(Number),
          description: "Unidentified federal restriction",
          restrictionType: RestrictionType.Federal,
          restrictionCategory: "Federal",
          actionType: [
            RestrictionActionType.StopFullTimeDisbursement,
            RestrictionActionType.StopPartTimeDisbursement,
          ],
          notificationType: RestrictionNotificationType.Error,
          creator: systemUsersService.systemUser,
          createdAt: now,
        });
      },
    );

    afterAll(async () => {
      await app?.close();
    });
  },
);
