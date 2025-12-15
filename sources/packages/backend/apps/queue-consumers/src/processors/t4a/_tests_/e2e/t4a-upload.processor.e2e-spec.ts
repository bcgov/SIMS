import { INestApplication } from "@nestjs/common";
import { T4AUploadQueueInDTO, VirusScanQueueInDTO } from "@sims/services/queue";
import { getISODateOnlyString, QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import { T4AUploadProcessor } from "../../t4a-upload.processor";
import { join } from "node:path";
import { v4 as uuid } from "uuid";
import * as Client from "ssh2-sftp-client";
import { DeepMocked } from "@golevelup/ts-jest";
import { getQueueProviderName } from "@sims/test-utils/mocks";
import { Queue } from "bull";
import { SystemUsersService } from "@sims/services";
import {
  FileOriginType,
  NotificationMessageType,
  User,
  VirusScanStatus,
} from "@sims/sims-db";
import { ObjectStorageService } from "@sims/integrations/object-storage";

jest.setTimeout(300000);

const SIN_NUMBER = "696098482";
const T4A_FOLDER = "T4A_E2E_TEST_FOLDER";
const T4A_ARCHIVE_FOLDER = "T4A_E2E_TEST_ARCHIVE_FOLDER";

describe(describeProcessorRootTest(QueueNames.T4AUpload), () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let processor: T4AUploadProcessor;
  let sftpClientMock: DeepMocked<Client>;
  let virusScanQueueMock: Queue<VirusScanQueueInDTO>;
  let storageServiceMock: ObjectStorageService;
  let systemUser: User;

  beforeAll(async () => {
    process.env.T4A_FOLDER = T4A_FOLDER;
    process.env.T4A_ARCHIVE_FOLDER = T4A_ARCHIVE_FOLDER;
    const {
      nestApplication,
      dataSource,
      sshClientMock,
      objectStorageServiceMock,
    } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sftpClientMock = sshClientMock;
    storageServiceMock = objectStorageServiceMock;
    virusScanQueueMock = app.get(
      getQueueProviderName(QueueNames.FileVirusScanProcessor),
    );
    systemUser = app.get(SystemUsersService).systemUser;
    // Processor under test.
    processor = app.get(T4AUploadProcessor);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    // Clean up database before each test.
    await db.sinValidation.update({ sin: SIN_NUMBER }, { sin: "000000000" });
  });

  it(
    "Should download a T4A file from the SFTP, create a file into student account, upload the file to S3 storage, " +
      "queue a virus scan, send a notification to the student, and archive the processed file on success " +
      "when the student has the current SIN valid, and matching the file name.",
    async () => {
      // Arrange
      // Create a student with the current SIN as valid.
      const student = await saveFakeStudent(db.dataSource, undefined, {
        sinValidationInitialValue: { sin: SIN_NUMBER, isValidSIN: true },
      });
      const now = new Date();
      const t4aSubFolder = now.getFullYear().toString();
      const formattedReferenceDate = getISODateOnlyString(now);
      const uniqueID = uuid();
      const fileContentBuffer = Buffer.from("PDF FILE CONTENT");
      const mockedJob = mockBullJob<T4AUploadQueueInDTO>({
        referenceDate: now,
        files: [
          {
            relativeFilePath: join(t4aSubFolder, `${SIN_NUMBER}.pdf`),
            uniqueID,
          },
        ],
      });
      sftpClientMock.get.mockResolvedValueOnce(fileContentBuffer);
      const fileName = `${t4aSubFolder}-T4A-${formattedReferenceDate}.pdf`;
      const uniqueFileName = `${t4aSubFolder}-T4A-${formattedReferenceDate}-${uniqueID}.pdf`;

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      // Assert expected result message.
      expect(result).toEqual(["T4A uploads processed."]);
      // Assert DB changes.
      const studentFiles = await db.studentFile.find({
        select: {
          id: true,
          fileName: true,
          uniqueFileName: true,
          groupName: true,
          student: { id: true },
          creator: { id: true },
          virusScanStatus: true,
          fileHash: true,
          fileOrigin: true,
        },
        relations: { student: true, creator: true },
        where: { student: { id: student.id } },
        loadEagerRelations: false,
      });
      expect(studentFiles).toHaveLength(1);
      const [studentFile] = studentFiles;
      // Validate student file DB changes.
      expect(studentFile).toEqual({
        id: expect.any(Number),
        fileName,
        uniqueFileName,
        groupName: "Tax Documents",
        student: { id: student.id },
        creator: { id: systemUser.id },
        virusScanStatus: VirusScanStatus.InProgress,
        fileHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        fileOrigin: FileOriginType.Ministry,
      });
      // Validate notification creation.
      const notification = await db.notification.findOne({
        select: {
          id: true,
          notificationMessage: { id: true },
          messagePayload: true,
          creator: { id: true },
        },
        relations: { notificationMessage: true, creator: true },
        where: { user: { id: student.user.id } },
        loadEagerRelations: false,
      });
      expect(notification).toEqual({
        id: expect.any(Number),
        notificationMessage: { id: NotificationMessageType.MinistryFileUpload },
        creator: { id: systemUser.id },
        messagePayload: {
          email_address: student.user.email,
          template_id: "0b1abf34-d607-4f5c-8669-71fd4a2e57fe",
          personalisation: {
            givenNames: student.user.firstName,
            lastName: student.user.lastName ?? "",
            date: expect.any(String),
          },
        },
      });
      // Validate if the object storage putObject was called with expected params.
      expect(storageServiceMock.putObject).toHaveBeenCalledWith({
        key: uniqueFileName,
        contentType: "application/pdf",
        body: fileContentBuffer,
      });
      // Validate if the virus scan job was queued.
      expect(virusScanQueueMock.add).toHaveBeenCalledWith({
        uniqueFileName: studentFile.uniqueFileName,
        fileName: studentFile.fileName,
      });
      // Assert expected logs.
      expect(
        mockedJob.containLogMessages([
          `Processing file unique ID ${uniqueID}.`,
          `Found student ID ${student.id}.`,
          "Start download from the SFTP.",
          "File downloaded in",
          "Start upload to the student account.",
          `Uploading file ${fileName} to S3 storage.`,
          `File ${fileName} uploaded to S3 storage.`,
          `Saving the file ${fileName} to database.`,
          `Adding the file: ${fileName} to the virus scan queue.`,
          `File ${fileName} has been added to the virus scan queue.`,
          `Student file ID ${studentFile.id} created and notification saved.`,
          `File created in`,
          `Archiving file unique ID ${uniqueID}.`,
          `File unique ID ${uniqueID} archived.`,
        ]),
      ).toBe(true);
      // Assert archive call.
      expect(sftpClientMock.rename).toHaveBeenCalledWith(
        join(T4A_FOLDER, t4aSubFolder, `${SIN_NUMBER}.pdf`),
        expect.stringContaining(join(T4A_ARCHIVE_FOLDER, SIN_NUMBER)),
      );
    },
  );

  it("Should log an error and archive the file with a not found student when an invalid SIN is found in the T4A file name.", async () => {
    // Arrange
    // Create a student with the current SIN as valid.
    const invalidSIN = "SOME_INVALID_SIN";
    const now = new Date();
    const t4aSubFolder = now.getFullYear().toString();
    const uniqueID = uuid();
    const mockedJob = mockBullJob<T4AUploadQueueInDTO>({
      referenceDate: now,
      files: [
        {
          relativeFilePath: join(t4aSubFolder, `${invalidSIN}.pdf`),
          uniqueID,
        },
      ],
    });

    // Act
    const result = await processor.processQueue(mockedJob.job);

    // Assert
    // Assert expected result message.
    expect(result).toEqual([
      "T4A uploads processed.",
      "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
      "Error(s): 0, Warning(s): 1, Info: 11",
    ]);
    expect(
      mockedJob.containLogMessages([
        `Processing T4A upload for 1 file(s).`,
        `Extracting T4A file information.`,
        `The SIN associated with the file unique ID ${uniqueID} is not valid: ${invalidSIN}.`,
        `Creating SFTP client and starting process.`,
        `Processing file unique ID ${uniqueID}.`,
        `No student associated with the SIN for the file unique ID ${uniqueID}.`,
        `Archiving file unique ID ${uniqueID}.`,
        `File unique ID ${uniqueID} archived.`,
      ]),
    ).toBe(true);
    // Assert expected logs.
    expect(
      mockedJob.containLogMessages([`Processing file unique ID ${uniqueID}.`]),
    ).toBe(true);
    // Assert archive call.
    expect(sftpClientMock.rename).toHaveBeenCalledWith(
      join(T4A_FOLDER, t4aSubFolder, `${invalidSIN}.pdf`),
      expect.stringContaining(join(T4A_ARCHIVE_FOLDER, invalidSIN)),
    );
  });
});
