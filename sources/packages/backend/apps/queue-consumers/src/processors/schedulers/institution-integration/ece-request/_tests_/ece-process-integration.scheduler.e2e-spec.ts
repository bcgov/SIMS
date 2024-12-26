import {
  Application,
  ApplicationStatus,
  COEStatus,
  DisbursementValue,
  DisbursementValueType,
  OfferingIntensity,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
  createFakeDisbursementValue,
  createFakeInstitutionLocation,
} from "@sims/test-utils";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../../test/helpers";
import { INestApplication } from "@nestjs/common";
import { formatDate, QueueNames } from "@sims/utilities";
import { DeepMocked } from "@golevelup/ts-jest";
import { ECEProcessIntegrationScheduler } from "../ece-process-integration.scheduler";
import { getUploadedFile } from "@sims/test-utils/mocks";
import { RecordTypeCodes } from "@sims/integrations/institution-integration/ece-integration";
import * as Client from "ssh2-sftp-client";
import * as dayjs from "dayjs";

describe(describeProcessorRootTest(QueueNames.ECEProcessIntegration), () => {
  let app: INestApplication;
  let processor: ECEProcessIntegrationScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;

  beforeAll(async () => {
    const { nestApplication, dataSource, sshClientMock } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sftpClientMock = sshClientMock;
    // Processor under test.
    processor = app.get(ECEProcessIntegrationScheduler);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    // Ensures that every institution location on database has no integration.
    // to allow eligible COE requestS to be generated with the data created
    // for every specific scenario.
    await db.institutionLocation.update(
      { hasIntegration: true },
      { hasIntegration: false },
    );
  });

  it("Should process an ECE request file and when there are valid disbursements and applications.", async () => {
    // Arrange
    // Student with valid SIN.
    const student = await saveFakeStudent(db.dataSource);
    // Student application eligible for e-Cert.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        student,
        firstDisbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaLoan,
            "CSLP",
            1122,
          ),
        ],
        institutionLocation: createFakeInstitutionLocation(undefined, {
          initialValue: { hasIntegration: true },
        }),
      },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        applicationStatus: ApplicationStatus.Enrolment,
        firstDisbursementInitialValues: {
          coeStatus: COEStatus.required,
        },
      },
    );
    application.studentNumber = "1234567789";
    const locationCode =
      application.currentAssessment.offering.institutionLocation
        .institutionCode;
    await db.application.save(application);
    // Queued job.
    const mockedJob = mockBullJob<void>();

    // Act
    const result = await processor.processQueue(mockedJob.job);

    const uploadedFile = getUploadedFile(sftpClientMock);
    const fileDate = dayjs().format("YYYYMMDD");
    expect(result).toStrictEqual([
      `Uploaded file ${uploadedFile.remoteFilePath}, with 1 record(s).`,
    ]);
    expect(
      mockedJob.containLogMessages([
        "Retrieving eligible COEs for ECE request.",
        "Found 1 COEs.",
        "Creating ECE request content.",
        `Processing content for institution code ${locationCode}.`,
        "Uploading content.",
        `Uploaded file ${uploadedFile.remoteFilePath}, with 1 record(s).`,
      ]),
    ).toBe(true);
    // Assert file output.
    const [header, fileDetail, footer] = uploadedFile.fileLines;
    // Expect the header to contain REQUEST and file date.
    expect(header).toContain(`REQUEST${fileDate}`);
    // Expect the file detail.
    const [disbursement] = application.currentAssessment.disbursementSchedules;
    const [disbursementValue] = disbursement.disbursementValues;
    const expectedDetailRecord = buildECEFileDetail(
      application,
      disbursementValue,
      disbursement.disbursementDate,
    );
    expect(fileDetail).toBe(expectedDetailRecord);
    // Expect the file footer.
    expect(footer).toBe("3000001");
  });

  it("Should not process an ECE request file and when there is an application with disbursement that doesn't have estimated awards.", async () => {
    // Arrange
    // Student application not eligible for e-Cert.
    await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        firstDisbursementValues: [],
      },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        applicationStatus: ApplicationStatus.Enrolment,
      },
    );

    // Queued job.
    const mockedJob = mockBullJob<void>();

    // Act
    const result = await processor.processQueue(mockedJob.job);

    // Assert
    expect(result).toStrictEqual(["No eligible COEs found."]);
  });

  function buildECEFileDetail(
    application: Application,
    disbursementValue: DisbursementValue,
    disbursementDate: string,
  ): string {
    const DATE_FORMAT = "YYYYMMDD";
    const offering = application.currentAssessment.offering;
    const studyStartDate = formatDate(offering.studyStartDate, DATE_FORMAT);
    const studyEndDate = formatDate(offering.studyEndDate, DATE_FORMAT);
    const disbursementDateFormatted = formatDate(disbursementDate, DATE_FORMAT);
    const institutionLocation = offering.institutionLocation;
    const student = application.student;
    const studentFirstName = student.user.firstName?.substring(0, 15) ?? "";
    const studentLastName = student.user.lastName.substring(0, 25);
    const studentBirthDate = formatDate(student.birthDate, DATE_FORMAT);
    const institutionStudentNumber = application.studentNumber;
    return `${RecordTypeCodes.ECEDetail}${
      institutionLocation.institutionCode
    }${disbursementValue.id.toString().padStart(10, "0")}${
      disbursementValue.valueCode
    }${disbursementValue.valueAmount.toString().padStart(9, "0")}${
      student.sinValidation.sin
    }${studentLastName.padEnd(25, " ")}${studentFirstName.padEnd(
      15,
      " ",
    )}${studentBirthDate}${
      application.applicationNumber
    }${institutionStudentNumber.padEnd(
      12,
      " ",
    )}100${studyStartDate}${studyEndDate}${disbursementDateFormatted}`;
  }
});
