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
import { join } from "node:path";
import { FederalRestrictionsIntegrationScheduler } from "../federal-restrictions-integration.scheduler";
import {
  createE2EDataSources,
  createFakeUser,
  E2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import { RestrictionType, Student } from "@sims/sims-db";
import MockDate from "mockdate";
import { IsNull } from "typeorm";

const FEDERAL_RESTRICTIONS_FILE = "DCSLS.PBC.RESTR.LIST.D20260406.zip";
const STUDENT_LAST_NAME = "HENDRICKS_a6f28017-90a7-4349";
const STUDENT_SIN = "743006694";
const STUDENT_DOB = "2005-11-12";

describe(
  describeQueueProcessorRootTest(QueueNames.FederalRestrictionsIntegration),
  () => {
    let app: INestApplication;
    let processor: FederalRestrictionsIntegrationScheduler;
    let db: E2EDataSources;
    //let systemUsersService: SystemUsersService;
    let sftpClientMock: DeepMocked<Client>;
    let student!: Student;
    let downloadedFile: string;

    beforeAll(async () => {
      // Set the ESDC response folder to the mock folder.
      process.env.ESDC_RESPONSE_FOLDER = join(
        __dirname,
        "e2e",
        "federal-restrictions-response-files",
      );
      downloadedFile = join(
        process.env.ESDC_RESPONSE_FOLDER,
        FEDERAL_RESTRICTIONS_FILE,
      );
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(FederalRestrictionsIntegrationScheduler);
      //systemUsersService = app.get(SystemUsersService);

      student = await db.student.findOne({
        select: { id: true },
        where: {
          user: {
            lastName: STUDENT_LAST_NAME,
          },
        },
      });
      if (!student) {
        const user = createFakeUser();
        user.lastName = STUDENT_LAST_NAME;
        student = await saveFakeStudent(
          db.dataSource,
          {
            user,
          },
          {
            initialValue: { birthDate: STUDENT_DOB },
            sinValidationInitialValue: { sin: STUDENT_SIN },
          },
        );
      }
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
      ]);
    });

    it(
      "Should process the federal restrictions file, create a student federal restriction, and generate a notification" +
        " when there is a federal restriction match for the last name, SIN and date of birth, and the student does not have an active restriction.",
      async () => {
        // Arrange
        const now = new Date();
        MockDate.set(now);
        mockDownloadFiles(sftpClientMock, [FEDERAL_RESTRICTIONS_FILE]);
        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act/Assert
        await processor.processQueue(mockedJob.job);

        // Check for the log messages.
        expect(
          mockedJob.containLogMessages([
            "Acquiring lock for execution.",
            "Lock acquired. Starting federal restrictions import process.",
            `Processing file ${downloadedFile}.`,
            "1 notification(s) generated.",
          ]),
        ).toBe(true);

        // Assert the total federal restrictions were imported.
        const importedRestrictions = await db.federalRestriction.count();
        expect(importedRestrictions).toBe(1500);

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
      },
    );

    afterAll(async () => {
      await app?.close();
    });
  },
);
