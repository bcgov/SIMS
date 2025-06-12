import { DeepMocked } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeCRAIncomeVerification,
  createFakeSupportingUser,
  createFakeUser,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import * as Client from "ssh2-sftp-client";
import { CRAProcessIntegrationScheduler } from "../cra-process-integration.scheduler";
import {
  ApplicationStatus,
  CRAIncomeVerification,
  Student,
  SupportingUser,
} from "@sims/sims-db";
import { getUploadedFile } from "@sims/test-utils/mocks";
import { IsNull } from "typeorm";
import MockDate from "mockdate";
import {
  CRA_PROGRAM_AREA_CODE,
  CRARequestRecordParser,
} from "./parsers/cra-request-record-parser";

describe(describeProcessorRootTest(QueueNames.CRAProcessIntegration), () => {
  let app: INestApplication;
  let processor: CRAProcessIntegrationScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;
  const SEQUENCE_NAME = `CRA_${CRA_PROGRAM_AREA_CODE}`;

  beforeAll(async () => {
    process.env.CRA_PROGRAM_AREA_CODE = CRA_PROGRAM_AREA_CODE;
    process.env.CRA_REQUEST_FOLDER = "OUT";
    process.env.CRA_ENVIRONMENT_CODE = "A";
    const { nestApplication, dataSource, sshClientMock } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sftpClientMock = sshClientMock;
    processor = app.get(CRAProcessIntegrationScheduler);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    MockDate.reset();
    // Ensure all the CRA income verifications are sent.
    await db.craIncomeVerification.update(
      { dateSent: IsNull() },
      { dateSent: new Date() },
    );
    await db.sequenceControl.delete({ sequenceName: SEQUENCE_NAME });
  });

  it("Should create one CRA file request with two income verification records when there are pending requests for a student and a parent and both have a SIN.", async () => {
    // Arrange.
    const {
      student,
      parent,
      studentCRAIncomeVerification,
      parentCRAIncomeVerification,
    } = await createApplicationWithParent({
      parentSin: "999999999",
    });
    const now = new Date();
    MockDate.set(now);
    // Queued job.
    const mockedJob = mockBullJob<void>();

    // Act
    const result = await processor.processQueue(mockedJob.job);

    // Assert
    // Assert uploaded file.
    const uploadedFile = getUploadedFile(sftpClientMock);
    const uploadedFileName = "OUT\\CCRA_REQUEST_A00001.DAT";
    expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
    expect(result).toStrictEqual([
      `Generated file: ${uploadedFileName}`,
      "Uploaded records: 2",
    ]);
    const [header, studentRecord, parentRecord, footer] =
      uploadedFile.fileLines;
    // Validate header.
    const headerParsed = new CRARequestRecordParser(header);
    expect(
      headerParsed.matchHeader({
        fileDate: now,
        sequenceNumber: 1,
      }),
    ).toBe(true);
    // Validate student record.
    const studentRecordParsed = new CRARequestRecordParser(studentRecord);
    expect(
      studentRecordParsed.matchIncome({
        id: studentCRAIncomeVerification.id,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        sin: student.sinValidation.sin,
        birthDate: student.birthDate,
        taxYear: studentCRAIncomeVerification.taxYear,
      }),
    ).toBe(true);
    // Validate parent record.
    const parentRecordParsed = new CRARequestRecordParser(parentRecord);
    expect(
      parentRecordParsed.matchIncome({
        id: parentCRAIncomeVerification.id,
        firstName: parent.user.firstName,
        lastName: parent.user.lastName,
        sin: parent.sin,
        birthDate: parent.birthDate,
        taxYear: parentCRAIncomeVerification.taxYear,
      }),
    ).toBe(true);
    // Validate footer.
    const footerParsed = new CRARequestRecordParser(footer);
    expect(
      footerParsed.matchFooter({
        fileDate: now,
        sequenceNumber: 1,
        totalRecords: 4,
      }),
    ).toBe(true);
  });

  it("Should create one CRA file request with one income verification when there are pending requests for a student and a parent and only the student has a SIN.", async () => {
    // Arrange.
    const { student } = await createApplicationWithParent();
    const now = new Date();
    MockDate.set(now);
    // Queued job.
    const mockedJob = mockBullJob<void>();

    // Act
    const result = await processor.processQueue(mockedJob.job);

    // Assert
    const uploadedFile = getUploadedFile(sftpClientMock);
    expect(result).toStrictEqual([
      `Generated file: ${uploadedFile.remoteFilePath}`,
      "Uploaded records: 1",
    ]);
    const [header, studentRecord, footer] = uploadedFile.fileLines;
    // Validate header.
    const headerParsed = new CRARequestRecordParser(header);
    expect(
      headerParsed.matchHeader({
        fileDate: now,
        sequenceNumber: 1,
      }),
    ).toBe(true);
    // Validate if the record belongs to the student.
    const studentRecordParsed = new CRARequestRecordParser(studentRecord);
    expect(
      studentRecordParsed.matchIndividual(
        student.user.lastName,
        student.user.firstName,
      ),
    ).toBe(true);
    // Validate footer.
    const footerParsed = new CRARequestRecordParser(footer);
    expect(
      footerParsed.matchFooter({
        fileDate: now,
        sequenceNumber: 1,
        totalRecords: 3,
      }),
    ).toBe(true);
  });

  /**
   * Creates a Student Application with an associated parent and CRA income verification records.
   * @param options options for creating the application.
   * - `parentSin`: if provided, the parent will be created with this SIN.
   * @returns created student, parent, and their CRA income verifications.
   */
  async function createApplicationWithParent(options?: {
    parentSin?: string;
  }): Promise<{
    student: Student;
    parent: SupportingUser;
    studentCRAIncomeVerification: CRAIncomeVerification;
    parentCRAIncomeVerification: CRAIncomeVerification;
  }> {
    // Create the student with a valid SIN.
    const student = await saveFakeStudent(db.dataSource);
    // Create an application with a student that will always have a SIN.
    const application = await saveFakeApplication(
      db.dataSource,
      { student },
      {
        applicationStatus: ApplicationStatus.InProgress,
      },
    );
    const parentUser = await db.user.save(createFakeUser());
    const parent = createFakeSupportingUser(
      { application, user: parentUser },
      {
        initialValues: {
          sin: options?.parentSin,
          birthDate: "1990-01-01",
        },
      },
    );
    await db.supportingUser.save(parent);
    const studentCRAIncomeVerification = createFakeCRAIncomeVerification({
      application,
    });
    const parentCRAIncomeVerification = createFakeCRAIncomeVerification({
      application,
      supportingUser: parent,
    });
    await db.craIncomeVerification.save([
      studentCRAIncomeVerification,
      parentCRAIncomeVerification,
    ]);
    return {
      student,
      parent,
      studentCRAIncomeVerification,
      parentCRAIncomeVerification,
    };
  }
});
