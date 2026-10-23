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
import dayjs from "dayjs";
import { getUploadedFile } from "@sims/test-utils/mocks";
import { ESDC_SIN_VALIDATION_SEQUENCE_GROUP_NAME } from "@sims/services/constants";
import { Student, User } from "@sims/sims-db";
import { SINValidationProcessIntegrationScheduler } from "../sin-validation-process-integration.scheduler";

const SIN_REQUEST_FOLDER = "SIN-Request";
const FILE_DATE_FORMAT = "YYYYMMDD";

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
      const studentMan = await saveStudentWithPendingSINValidation(db, {
        firstName: "John",
        lastName: "Doe",
        gender: "man",
        birthDate: "1995-06-30",
      });
      const studentWoman = await saveStudentWithPendingSINValidation(db, {
        firstName: "Jane",
        lastName: "Smith Jones",
        gender: "woman",
        birthDate: "2001-12-01",
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
          givenNameSent: "John",
          surnameSent: "Doe",
          dobSent: "1995-06-30",
          genderSent: "man",
          modifier: { id: systemUser.id },
        },
        {
          id: studentWoman.sinValidation.id,
          dateSent: now,
          fileSent: "BC0001.OS",
          givenNameSent: "Jane",
          surnameSent: "Smith Jones",
          dobSent: "2001-12-01",
          genderSent: "woman",
          modifier: { id: systemUser.id },
        },
      ]);
    });

    it("Should generate the gender codes and the empty first name accordingly when the students are non-binary, prefer not to answer, and have a single name.", async () => {
      // Arrange
      const studentNonBinary = await saveStudentWithPendingSINValidation(db, {
        firstName: "Alex",
        lastName: "Taylor",
        gender: "nonBinary",
        birthDate: "1990-01-15",
      });
      const studentPreferNotToAnswer =
        await saveStudentWithPendingSINValidation(db, {
          firstName: "Sam",
          lastName: "Brown",
          gender: "preferNotToAnswer",
          birthDate: "1988-11-20",
        });
      const studentMononymous = await saveStudentWithPendingSINValidation(db, {
        firstName: null,
        lastName: "Madonna",
        gender: "woman",
        birthDate: "1958-08-16",
      });
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
      const pendingStudent = await saveStudentWithPendingSINValidation(db, {
        firstName: "Pending",
        lastName: "Student",
        gender: "man",
        birthDate: "1999-09-09",
      });
      const alreadySentStudent = await saveStudentWithPendingSINValidation(db);
      await db.sinValidation.update(
        { id: alreadySentStudent.sinValidation.id },
        { dateSent: new Date() },
      );
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
      MockDate.reset();
      await app?.close();
    });
  },
);

/**
 * Saves a student with a SIN validation that is pending to be sent to ESDC.
 * @param db E2E data sources.
 * @param options student options.
 * - `firstName` student first name, null for students with a single name.
 * - `lastName` student last name.
 * - `gender` student gender.
 * - `birthDate` student birth date in the format YYYY-MM-DD.
 * @returns saved student with the pending SIN validation.
 */
async function saveStudentWithPendingSINValidation(
  db: E2EDataSources,
  options?: {
    firstName?: string | null;
    lastName?: string;
    gender?: string;
    birthDate?: string;
  },
): Promise<Student> {
  const user = createFakeUser();
  if (options && "firstName" in options) {
    user.firstName = options.firstName;
  }
  if (options?.lastName) {
    user.lastName = options.lastName;
  }
  const student = await saveFakeStudent(
    db.dataSource,
    { user },
    {
      initialValue: { gender: options?.gender, birthDate: options?.birthDate },
    },
  );
  // The factory does not allow a null value for the validation result.
  await db.sinValidation.update(
    { id: student.sinValidation.id },
    { isValidSIN: null },
  );
  return student;
}

/**
 * Creates the expected SIN validation request file header.
 * @param fileDate date when the file was created.
 * @param batchNumber file sequence number.
 * @returns expected header line.
 */
function createExpectedHeader(fileDate: Date, batchNumber: number): string {
  const batch = batchNumber.toString().padStart(6, "0");
  return `001${batch}${dayjs(fileDate).format(FILE_DATE_FORMAT)}BC${" ".repeat(71)}`;
}

/**
 * Creates the expected SIN validation request file record.
 * @param student student with the SIN validation.
 * @param options record options.
 * - `genderCode` expected gender code in the file.
 * @returns expected record line.
 */
function createExpectedRecord(
  student: Student,
  options: { genderCode: string },
): string {
  const referenceIndex = student.sinValidation.id.toString().padStart(9, "0");
  const firstName = (student.user.firstName ?? "").padEnd(30, " ");
  const lastName = student.user.lastName.padEnd(30, " ");
  const birthDate = student.birthDate.replaceAll("-", "");
  return `002${referenceIndex}${student.sinValidation.sin}${firstName}${lastName}${options.genderCode}${birthDate}`;
}

/**
 * Creates the expected SIN validation request file footer.
 * @param students students included in the file.
 * @returns expected footer line.
 */
function createExpectedFooter(students: Student[]): string {
  const recordCount = students.length.toString().padStart(6, "0");
  const totalSINHash = students
    .reduce((hash, student) => hash + +student.sinValidation.sin, 0)
    .toString()
    .padStart(15, "0");
  return `999${recordCount}${totalSINHash}${" ".repeat(66)}`;
}
