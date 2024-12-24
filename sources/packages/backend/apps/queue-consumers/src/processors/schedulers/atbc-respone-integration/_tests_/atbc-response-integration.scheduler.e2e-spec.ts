import { INestApplication } from "@nestjs/common";
import { addDays, formatDate } from "@sims/utilities";
import {
  createTestingAppModule,
  mockBullJob,
} from "../../../../../test/helpers";
import { ATBCResponseIntegrationScheduler } from "../atbc-response-integration.scheduler";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  ATBCDisabilityStatusResponse,
  ATBCService,
  ATBC_DATE_FORMAT,
} from "@sims/integrations/services";
import { DisabilityStatus, Student } from "@sims/sims-db";

// TODO: This is skipped as part of #2539 - Suspend any ATBC integration.
describe.skip("describeProcessorRootTest(QueueNames.ATBCResponseIntegration)", () => {
  let app: INestApplication;
  let processor: ATBCResponseIntegrationScheduler;
  let db: E2EDataSources;
  let atbcService: ATBCService;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    // Processor to be tested.
    processor = app.get(ATBCResponseIntegrationScheduler);
    // ATBC Service.
    atbcService = app.get(ATBCService);
  });

  it("Should update the student disability status based on the ATBC response.", async () => {
    // Arrange

    // Queued job.
    const mockedJob = mockBullJob<void>();

    // Create students who applied for disability status.
    const [
      studentAppliedDisabilityAndPDReceived,
      studentAppliedDisabilityAndPPDReceived,
    ] = await Promise.all([
      saveFakeStudent(db.dataSource, undefined, {
        initialValue: { disabilityStatus: DisabilityStatus.Requested },
      }),
      saveFakeStudent(db.dataSource, undefined, {
        initialValue: { disabilityStatus: DisabilityStatus.Requested },
      }),
    ]);

    // Mocking ATBC response retuning updated disability status for 3 students.
    // Out of the 3, 2 students belong to the system and one does not.
    const [pdResponse, ppdResponse, pdResponseForNonExistingStudent] = [
      createFakeATBCResponse({
        student: studentAppliedDisabilityAndPDReceived,
        disabilityStatus: DisabilityStatus.PD,
        disabilityStatusUpdatedDate: addDays(-1),
      }),
      createFakeATBCResponse({
        student: studentAppliedDisabilityAndPPDReceived,
        disabilityStatus: DisabilityStatus.PPD,
        disabilityStatusUpdatedDate: addDays(-2),
      }),
      createFakeATBCResponse(),
    ];

    // Mock the implementation of ATBC API response.
    atbcService.getStudentDisabilityStatusUpdatesByDate = async () => {
      return [pdResponse, ppdResponse, pdResponseForNonExistingStudent];
    };

    // Act
    const result = await processor.processQueue(mockedJob.job);

    // Assert
    expect(result).toStrictEqual(["Completed processing disability status."]);
    expect(
      mockedJob.containLogMessages([
        "Total disability status requests processed: 3",
        "Students updated with disability status: 2",
      ]),
    ).toBe(true);

    // Validate the disability status and status updated date.
    const pdReceivedStudent = await getStudentDisabilityStatusDetails(
      db,
      studentAppliedDisabilityAndPDReceived.id,
    );
    expect(pdReceivedStudent.disabilityStatus).toBe(DisabilityStatus.PD);
    expect(
      formatDate(pdReceivedStudent.studentPDUpdateAt, ATBC_DATE_FORMAT),
    ).toBe(pdResponse.D8Y_DTE);
    // Validate the disability status and status updated date.
    const ppdReceivedStudent = await getStudentDisabilityStatusDetails(
      db,
      studentAppliedDisabilityAndPPDReceived.id,
    );
    expect(ppdReceivedStudent.disabilityStatus).toBe(DisabilityStatus.PPD);
    expect(
      formatDate(ppdReceivedStudent.studentPDUpdateAt, ATBC_DATE_FORMAT),
    ).toBe(ppdResponse.D8Y_DTE);
  });

  it("Should not update student when disability status in system is same as the status in ATBC response.", async () => {
    // Arrange

    // Queued job.
    const mockedJob = mockBullJob<void>();

    // Create student who applied and received disability status.
    // If the ATBC response is received again with same disability status, no updated should happen.
    const studentAppliedDisabilityAndUpdatedAlready = await saveFakeStudent(
      db.dataSource,
      undefined,
      {
        initialValue: { disabilityStatus: DisabilityStatus.PD },
      },
    );

    // Mocking ATBC response to return same disability status which was updated earlier.
    const pdResponse = createFakeATBCResponse({
      student: studentAppliedDisabilityAndUpdatedAlready,
      disabilityStatus: DisabilityStatus.PD,
      disabilityStatusUpdatedDate: addDays(-2),
    });
    // Mock the implementation of ATBC API response.
    atbcService.getStudentDisabilityStatusUpdatesByDate = async () => {
      return [pdResponse];
    };

    // Act
    const result = await processor.processQueue(mockedJob.job);

    // Assert
    expect(result).toStrictEqual(["Completed processing disability status."]);
    expect(
      mockedJob.containLogMessages([
        "Total disability status requests processed: 1",
        "Students updated with disability status: 0",
      ]),
    ).toBe(true);
    const pdReceivedStudent = await getStudentDisabilityStatusDetails(
      db,
      studentAppliedDisabilityAndUpdatedAlready.id,
    );
    // Expect the disability status updated date not to be the ATBC response status updated date.
    expect(
      formatDate(pdReceivedStudent.studentPDUpdateAt, ATBC_DATE_FORMAT),
    ).not.toBe(pdResponse.D8Y_DTE);
  });
});

/**
 * Get student disability status details
 * @param db e2e data sources.
 * @param studentId student id.
 * @returns student disability status details.
 */
async function getStudentDisabilityStatusDetails(
  db: E2EDataSources,
  studentId: number,
): Promise<Student> {
  return db.student.findOne({
    select: { id: true, disabilityStatus: true, studentPDUpdateAt: true },
    where: { id: studentId },
  });
}

/**
 * Create fake ATBC disability status response.
 * @param options ATBC response options.
 * - `student` student.
 * - `disabilityStatus` ATBC disability status.
 * - `disabilityStatusUpdatedDate` ATBC disability status updated date.
 * @returns ATBC response.
 */
function createFakeATBCResponse(options?: {
  student?: Student;
  disabilityStatus?: DisabilityStatus.PD | DisabilityStatus.PPD;
  disabilityStatusUpdatedDate?: Date;
}): ATBCDisabilityStatusResponse {
  const studentBirthDate = options?.student?.birthDate ?? new Date();
  const disabilityStatusUpdatedDate =
    options?.disabilityStatusUpdatedDate ?? new Date();
  return {
    SIN: options?.student?.sinValidation.sin ?? "999999999",
    APP_LAST_NAME: options?.student?.user.lastName ?? "Last Name",
    BIRTH_DTE: formatDate(studentBirthDate, ATBC_DATE_FORMAT),
    D8Y_TYPE: options?.disabilityStatus,
    D8Y_DTE: formatDate(disabilityStatusUpdatedDate, ATBC_DATE_FORMAT),
  };
}
