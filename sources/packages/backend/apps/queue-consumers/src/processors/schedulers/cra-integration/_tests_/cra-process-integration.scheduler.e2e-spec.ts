import { DeepMocked } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames, StringBuilder } from "@sims/utilities";
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
import { ApplicationStatus } from "@sims/sims-db";
import { getUploadedFile } from "@sims/test-utils/mocks";
import { IsNull } from "typeorm";
import MockDate from "mockdate";
import * as dayjs from "dayjs";

describe(describeProcessorRootTest(QueueNames.CRAProcessIntegration), () => {
  let app: INestApplication;
  let processor: CRAProcessIntegrationScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;
  const CRA_PROGRAM_AREA_CODE = "BCSL";
  const SEQUENCE_NAME = `CRA_${CRA_PROGRAM_AREA_CODE}`;
  const DATE_FORMAT = "YYYYMMDD";
  const SPACE_FILLER = " ";

  beforeAll(async () => {
    process.env.CRA_PROGRAM_AREA_CODE = CRA_PROGRAM_AREA_CODE;
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

  it("Should create the SIN file request when there are pending requests with an associated SIN.", async () => {
    // Arrange.
    // Create the student with a valid SIN.
    const student = await saveFakeStudent(db.dataSource);
    // Crate an application with a student that will always have a SIN.
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
          sin: "999999999",
        },
      },
    );
    // Crate an application a parent with the ability to have an income check executed since it has a SIN.
    await db.supportingUser.save(parent);

    // Create CRA income verifications for student.
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
    const isoNow = dayjs(now).format(DATE_FORMAT);
    expect(header).toBe(
      `7100                        ${isoNow} ${CRA_PROGRAM_AREA_CODE}A00001                                                                                                   0`,
    );
    // Validate student record.
    const studentRecordExpected = createSINRecord(
      studentCRAIncomeVerification.id,
      student.user.firstName,
      student.user.lastName,
      student.sinValidation.sin,
      student.birthDate,
      studentCRAIncomeVerification.taxYear,
    );
    // Validate parent record.
    expect(studentRecord).toBe(studentRecordExpected);
    const parentRecordExpected = createSINRecord(
      parentCRAIncomeVerification.id,
      parent.user.firstName,
      parent.user.lastName,
      parent.sin,
      parent.birthDate,
      parentCRAIncomeVerification.taxYear,
    );
    expect(parentRecord).toBe(parentRecordExpected);
    // Validate footer.
    expect(footer.substring(0, 18)).toBe("999NEW ENTITLEMENT");
  });

  function createSINRecord(
    craIncomeVerificationId: number,
    firstName: string,
    lastName: string,
    sin: string,
    birthDate: string,
    taxYear?: number,
  ) {
    const record = new StringBuilder();
    record.append("7101");
    record.append(sin);
    record.repeatAppend(SPACE_FILLER, 4);
    record.append("0020");
    record.appendWithEndFiller(lastName, 30, SPACE_FILLER);
    record.appendWithEndFiller(firstName ?? "", 30, SPACE_FILLER);
    record.appendDate(birthDate, DATE_FORMAT);
    record.appendWithEndFiller((taxYear ?? "").toString(), 20, SPACE_FILLER);
    record.append(CRA_PROGRAM_AREA_CODE);
    record.appendWithEndFiller(
      `VERIFICATION_ID:${craIncomeVerificationId}`,
      30,
      SPACE_FILLER,
    );
    record.repeatAppend(SPACE_FILLER, 3);
    record.append("0");
    return record.toString();
  }
});
