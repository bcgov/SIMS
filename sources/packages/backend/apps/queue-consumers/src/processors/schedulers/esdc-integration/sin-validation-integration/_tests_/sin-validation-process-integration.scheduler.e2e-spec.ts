import { DeepMocked } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../../test/helpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeUser,
  saveFakeStudent,
} from "@sims/test-utils";
import Client from "ssh2-sftp-client";
import { In, IsNull } from "typeorm";
import MockDate from "mockdate";
import { getUploadedFile } from "@sims/test-utils/mocks";
import { ESDC_SIN_VALIDATION_SEQUENCE_GROUP_NAME } from "@sims/services/constants";
import { User } from "@sims/sims-db";
import { SINValidationProcessIntegrationScheduler } from "../sin-validation-process-integration.scheduler";
import {
  createExpectedFooter,
  createExpectedHeader,
  createExpectedRecord,
} from "./sin-validation-helper";

const SIN_REQUEST_FOLDER = "SIN-Request";
/**
 * SIN validation that was not sent to ESDC and does not have a validation result yet.
 */
const PENDING_SIN_VALIDATION = { isValidSIN: null };

describe(
  describeProcessorRootTest(QueueNames.SINValidationProcessIntegration),
  () => {
    let app: INestApplication;
    let processor: SINValidationProcessIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;
    let systemUser: User;

    beforeAll(async () => {
      process.env.ESDC_REQUEST_FOLDER = SIN_REQUEST_FOLDER;
      const { nestApplication, dataSource, sshClientMock, systemUsersService } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      systemUser = systemUsersService.systemUser;
      processor = app.get(SINValidationProcessIntegrationScheduler);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      MockDate.reset();
      // Ensure that only the records created by each test are pending.
      await db.sinValidation.update(
        { isValidSIN: IsNull(), dateSent: IsNull() },
        { dateSent: new Date() },
      );
      await db.sequenceControl.delete({
        sequenceName: ESDC_SIN_VALIDATION_SEQUENCE_GROUP_NAME,
      });
    });

    it("Should generate a SIN validation request file and update the SIN validation records when there are students with pending SIN validation.", async () => {
      // Arrange
      const studentMan = await saveFakeStudent(db.dataSource, undefined, {
        initialValue: { gender: "man", birthDate: "1995-06-30" },
        sinValidationInitialValue: PENDING_SIN_VALIDATION,
      });
      const studentWoman = await saveFakeStudent(db.dataSource, undefined, {
        initialValue: { gender: "woman", birthDate: "2001-12-01" },
        sinValidationInitialValue: PENDING_SIN_VALIDATION,
      });
      const now = new Date();
      MockDate.set(now);
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      const uploadedFile = getUploadedFile(sftpClientMock);
      const expectedFilePath = String.raw`${SIN_REQUEST_FOLDER}\BC0001.OS`;
      expect(uploadedFile.remoteFilePath).toBe(expectedFilePath);
      expect(result).toStrictEqual([
        `Generated file: ${expectedFilePath}`,
        "Uploaded records: 2",
      ]);
      expect(uploadedFile.fileLines).toHaveLength(4);
      const [header, ...recordsAndFooter] = uploadedFile.fileLines;
      const footer = recordsAndFooter.pop();
      expect(header).toBe(createExpectedHeader(now, 1));
      // The order of the records is not guaranteed.
      expect(recordsAndFooter).toHaveLength(2);
      expect(recordsAndFooter).toContain(
        createExpectedRecord(studentMan, { genderCode: "M" }),
      );
      expect(recordsAndFooter).toContain(
        createExpectedRecord(studentWoman, { genderCode: "F" }),
      );
      expect(footer).toBe(createExpectedFooter([studentMan, studentWoman]));
      // Assert database changes.
      const updatedSINValidations = await db.sinValidation.find({
        select: {
          id: true,
          dateSent: true,
          fileSent: true,
          givenNameSent: true,
          surnameSent: true,
          dobSent: true,
          genderSent: true,
          modifier: { id: true },
        },
        relations: { modifier: true },
        where: {
          id: In([studentMan.sinValidation.id, studentWoman.sinValidation.id]),
        },
        loadEagerRelations: false,
        order: { id: "ASC" },
      });
      expect(updatedSINValidations).toEqual([
        {
          id: studentMan.sinValidation.id,
          dateSent: now,
          fileSent: "BC0001.OS",
          givenNameSent: studentMan.user.firstName,
          surnameSent: studentMan.user.lastName,
          dobSent: "1995-06-30",
          genderSent: "man",
          modifier: { id: systemUser.id },
        },
        {
          id: studentWoman.sinValidation.id,
          dateSent: now,
          fileSent: "BC0001.OS",
          givenNameSent: studentWoman.user.firstName,
          surnameSent: studentWoman.user.lastName,
          dobSent: "2001-12-01",
          genderSent: "woman",
          modifier: { id: systemUser.id },
        },
      ]);
    });

    it("Should generate the gender codes and the empty first name accordingly when the students are non-binary, prefer not to answer, and have a single name.", async () => {
      // Arrange
      const studentNonBinary = await saveFakeStudent(db.dataSource, undefined, {
        initialValue: { gender: "nonBinary", birthDate: "1990-01-15" },
        sinValidationInitialValue: PENDING_SIN_VALIDATION,
      });
      const studentPreferNotToAnswer = await saveFakeStudent(
        db.dataSource,
        undefined,
        {
          initialValue: {
            gender: "preferNotToAnswer",
            birthDate: "1988-11-20",
          },
          sinValidationInitialValue: PENDING_SIN_VALIDATION,
        },
      );
      // Student with a single name.
      const mononymousUser = createFakeUser();
      mononymousUser.firstName = null;
      const studentMononymous = await saveFakeStudent(
        db.dataSource,
        { user: mononymousUser },
        {
          initialValue: { gender: "woman", birthDate: "1958-08-16" },
          sinValidationInitialValue: PENDING_SIN_VALIDATION,
        },
      );
      const now = new Date();
      MockDate.set(now);
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      const uploadedFile = getUploadedFile(sftpClientMock);
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFile.remoteFilePath}`,
        "Uploaded records: 3",
      ]);
      const [header, ...recordsAndFooter] = uploadedFile.fileLines;
      const footer = recordsAndFooter.pop();
      expect(header).toBe(createExpectedHeader(now, 1));
      expect(recordsAndFooter).toHaveLength(3);
      expect(recordsAndFooter).toContain(
        createExpectedRecord(studentNonBinary, { genderCode: "X" }),
      );
      expect(recordsAndFooter).toContain(
        createExpectedRecord(studentPreferNotToAnswer, { genderCode: " " }),
      );
      expect(recordsAndFooter).toContain(
        createExpectedRecord(studentMononymous, { genderCode: "F" }),
      );
      expect(footer).toBe(
        createExpectedFooter([
          studentNonBinary,
          studentPreferNotToAnswer,
          studentMononymous,
        ]),
      );
    });

    it("Should not include in the file the students whose SIN validation was already sent or already has a validation result.", async () => {
      // Arrange
      const pendingStudent = await saveFakeStudent(db.dataSource, undefined, {
        initialValue: { gender: "man", birthDate: "1999-09-09" },
        sinValidationInitialValue: PENDING_SIN_VALIDATION,
      });
      // SIN validation already sent to ESDC.
      await saveFakeStudent(db.dataSource, undefined, {
        sinValidationInitialValue: {
          ...PENDING_SIN_VALIDATION,
          dateSent: new Date(),
        },
      });
      // Student created by the factory with a valid SIN by default.
      await saveFakeStudent(db.dataSource);
      const now = new Date();
      MockDate.set(now);
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      const uploadedFile = getUploadedFile(sftpClientMock);
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFile.remoteFilePath}`,
        "Uploaded records: 1",
      ]);
      expect(uploadedFile.fileLines).toStrictEqual([
        createExpectedHeader(now, 1),
        createExpectedRecord(pendingStudent, { genderCode: "M" }),
        createExpectedFooter([pendingStudent]),
      ]);
    });

    it("Should not generate any file when there are no students with pending SIN validation.", async () => {
      // Arrange
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      expect(result).toStrictEqual([
        "Generated file: none",
        "Uploaded records: 0",
      ]);
      expect(sftpClientMock.put).not.toHaveBeenCalled();
    });

    afterAll(async () => {
      await app?.close();
    });
  },
);
