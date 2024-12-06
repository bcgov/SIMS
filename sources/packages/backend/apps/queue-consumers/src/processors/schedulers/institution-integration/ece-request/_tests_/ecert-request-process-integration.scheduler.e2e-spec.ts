import {
  ApplicationStatus,
  DisbursementValueType,
  OfferingIntensity,
} from "@sims/sims-db";
import {
  E2EDataSources,
  MSFAAStates,
  createE2EDataSources,
  createFakeMSFAANumber,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
  createFakeDisbursementValue,
  createFakeInstitutionLocation,
} from "@sims/test-utils";
import {
  createTestingAppModule,
  describeQueueProcessorRootTest,
  mockBullJob,
} from "../../../../../../test/helpers";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import { DeepMocked } from "@golevelup/ts-jest";
import { ECEProcessIntegrationScheduler } from "../ece-process-integration.scheduler";
import * as Client from "ssh2-sftp-client";
import * as dayjs from "dayjs";
import { getUploadedFile } from "@sims/test-utils/mocks";
import { In, Like } from "typeorm";

describe(
  describeQueueProcessorRootTest(QueueNames.PartTimeECertIntegration),
  () => {
    let app: INestApplication;
    let processor: ECEProcessIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;

    beforeAll(async () => {
      // Env variable required for querying the eligible e-Cert records.
      process.env.APPLICATION_ARCHIVE_DAYS = "42";
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
      // Ensures that every disbursement on database has no estimated awards
      // to allow the e-Certs to be generated with the data created for every
      // specific scenario.
      await db.disbursementSchedule.update(
        {
          hasEstimatedAwards: true,
        },
        { hasEstimatedAwards: false },
      );
      // Reset sequence number to control the file name generated.
      await db.sequenceControl.update(
        { sequenceName: Like("ECERT_PT_SENT_FILE_%") },
        { sequenceNumber: "0" },
      );
    });

    it("Should process an ECE request file and when there are valid disbursements and applications.", async () => {
      // Arrange
      // Student with valid SIN.
      const student = await saveFakeStudent(db.dataSource);
      // Valid MSFAA Number.
      const msfaaNumber = await db.msfaaNumber.save(
        createFakeMSFAANumber(
          { student },
          {
            msfaaState: MSFAAStates.Signed,
            msfaaInitialValues: {
              offeringIntensity: OfferingIntensity.fullTime,
            },
          },
        ),
      );
      // Student application eligible for e-Cert.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          msfaaNumber,
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
        },
      );
      application.studentNumber = "1234567789";
      await db.application.save(application);
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processECERequest(mockedJob.job);

      const uploadedFile = getUploadedFile(sftpClientMock);
      const fileDate = dayjs().format("YYYYMMDD");
      expect(result).toEqual(
        expect.arrayContaining([
          {
            summary: [
              `The uploaded file: ${uploadedFile.remoteFilePath}`,
              "The number of records: 1",
            ],
          },
        ]),
      );
      // Assert file output.
      const [header, fileDetail, footer] = uploadedFile.fileLines;
      // Expect the header contains REQUEST and file date.
      expect(header).toContain(`REQUEST${fileDate}`);
      const disbursementValue = await db.disbursementValue.findOne({
        select: {
          id: true,
          valueCode: true,
          valueAmount: true,
        },
        where: {
          disbursementSchedule: {
            id: In(
              application.currentAssessment.disbursementSchedules.map(
                (disbursementSchedule) => disbursementSchedule.id,
              ),
            ),
          },
        },
      });
      // Expect the file detail contains correct data for institution code
      // disbursement id, disbursement value code, disbursement value amount,
      // last and first name of the student, application number and student number.
      expect(fileDetail).toContain(
        application.currentAssessment.offering.institutionLocation
          .institutionCode,
      );
      expect(fileDetail).toContain(disbursementValue.id.toString());
      expect(fileDetail).toContain(disbursementValue.valueCode.toString());
      expect(fileDetail).toContain(disbursementValue.valueAmount.toString());
      expect(fileDetail).toContain(
        application.student.user.lastName.slice(0, 25),
      );
      expect(fileDetail).toContain(
        application.student.user.firstName.slice(0, 15),
      );
      expect(fileDetail).toContain(application.applicationNumber);
      expect(fileDetail).toContain(application.studentNumber);
      // Expect the footer contain only 1 disbursement schedule.
      expect(footer).toContain("1");
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
      const result = await processor.processECERequest(mockedJob.job);

      // Assert
      expect(result).toEqual(
        expect.arrayContaining([
          {
            summary: ["The uploaded file: none", "The number of records: 0"],
          },
        ]),
      );
    });
  },
);
