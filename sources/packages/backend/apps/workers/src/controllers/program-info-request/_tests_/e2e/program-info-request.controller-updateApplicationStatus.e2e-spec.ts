import {
  ApplicationData,
  EducationProgram,
  NoteType,
  ProgramInfoStatus,
} from "@sims/sims-db";
import {
  createE2EDataSources,
  createFakeEducationProgramOffering,
  createFakeUser,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { APPLICATION_NOT_FOUND } from "../../../../constants";
import {
  createFakeWorkerJob,
  FAKE_WORKER_JOB_ERROR_CODE_PROPERTY,
  FAKE_WORKER_JOB_ERROR_MESSAGE_PROPERTY,
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../../test/helpers";
import { ProgramInfoRequestController } from "../../program-info-request.controller";
import {
  ProgramInfoRequestJobHeaderDTO,
  ProgramInfoRequestJobInDTO,
  ProgramInfoRequestJobOutDTO,
} from "../../program-info-request.dto";
import { createFakeUpdatePIRStatusPayload } from "./update-pir-status";
import { addDays, getDateOnlyFormat } from "@sims/utilities";
import MockDate from "mockdate";
import { SystemUsersService } from "@sims/services";

describe("ProgramInfoRequestController(e2e)-updateApplicationStatus", () => {
  let db: E2EDataSources;
  let programInfoRequestController: ProgramInfoRequestController;
  let systemUsersService: SystemUsersService;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    programInfoRequestController = nestApplication.get(
      ProgramInfoRequestController,
    );
    systemUsersService = nestApplication.get(SystemUsersService);
  });

  beforeEach(async () => {
    // Mock the current date.
    const now = new Date();
    MockDate.set(now);
  });

  it("Should update application PIR status when not set.", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });
    const savedOffering = await db.educationProgramOffering.save(fakeOffering);
    const fakeApplication = await saveFakeApplication(db.dataSource);
    fakeApplication.pirProgram = {
      id: savedOffering.educationProgram.id,
    } as EducationProgram;
    const savedApplication = await db.application.save(fakeApplication);

    const updateApplicationStatusPayload = createFakeUpdatePIRStatusPayload(
      savedApplication.id,
      savedApplication.pirProgram.id,
      ProgramInfoStatus.declined,
    );

    // Act
    const result = await programInfoRequestController.updateApplicationStatus(
      createFakeWorkerJob<
        ProgramInfoRequestJobInDTO,
        ProgramInfoRequestJobHeaderDTO,
        ProgramInfoRequestJobOutDTO
      >(updateApplicationStatusPayload),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    // Asserts that the application PIR status has changed to declined.
    const expectedApplication = await db.application.findOne({
      select: { pirStatus: true },
      where: { id: savedApplication.id },
    });
    expect(expectedApplication.pirStatus).toBe(ProgramInfoStatus.declined);
  });

  it("Should update the application PIR to completed when a PIR with the same hash was previously approved for some of the application versions", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);
    const pirAssessedDate = addDays(-1);
    // Hash for { programName: "valueA", programDescription: "valueB"}
    const pirHash =
      "146239e63c6d22148b45490e6ca702311e2fedf46feaa1bb0962b87fb3614f89";
    // Save a user to be used as the modifier and PIR assessed by.
    const savedUser = await db.user.save(createFakeUser());
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });
    const pirOffering = await db.educationProgramOffering.save(fakeOffering);
    // Save a previous application version with an approved PIR.
    const pirApplicationVersion = await saveFakeApplication(
      db.dataSource,
      {
        pirProgram: pirOffering.educationProgram,
        offering: pirOffering,
      },
      {
        pirStatus: ProgramInfoStatus.completed,
        initialValues: {
          pirHash,
          pirAssessedDate: pirAssessedDate,
        },
      },
    );
    // Create a new version of the previous application have the PIR approved.
    const pirApplicationCurrent = await saveFakeApplication(
      db.dataSource,
      {
        parentApplication: pirApplicationVersion,
      },
      {
        applicationData: {
          programName: "valueA",
          programDescription: "valueB",
          programPersistentProperties: ["programName", "programDescription"],
        } as ApplicationData,
      },
    );
    const updateApplicationStatusPayload = createFakeUpdatePIRStatusPayload(
      pirApplicationCurrent.id,
      pirOffering.educationProgram.id,
      ProgramInfoStatus.required,
    );

    // Act
    const result = await programInfoRequestController.updateApplicationStatus(
      createFakeWorkerJob<
        ProgramInfoRequestJobInDTO,
        ProgramInfoRequestJobHeaderDTO,
        ProgramInfoRequestJobOutDTO
      >(updateApplicationStatusPayload),
    );

    // Asserts
    expect(result).toEqual({
      resultType: MockedZeebeJobResult.Complete,
      outputVariables: { programInfoStatus: ProgramInfoStatus.completed },
    });

    // Asserts that the application PIR status is completed
    // and data was updated as expected.
    const expectedApplication = await db.application.findOne({
      select: {
        id: true,
        pirStatus: true,
        pirHash: true,
        pirProgram: { id: true },
        pirAssessedDate: true,
        pirAssessedBy: { id: true },
        pirApprovalReference: { id: true },
        currentAssessment: {
          id: true,
          offering: { id: true },
          updatedAt: true,
          modifier: { id: true },
        },
        updatedAt: true,
        modifier: { id: true },
        student: {
          id: true,
          notes: { id: true, description: true, noteType: true },
        },
      },
      relations: {
        pirProgram: true,
        pirAssessedBy: true,
        pirApprovalReference: true,
        currentAssessment: { offering: true, modifier: true },
        modifier: true,
        student: { notes: true },
      },
      where: { id: pirApplicationCurrent.id },
      loadEagerRelations: false,
    });
    expect(expectedApplication).toEqual({
      id: pirApplicationCurrent.id,
      pirStatus: ProgramInfoStatus.completed,
      pirHash,
      pirProgram: { id: pirOffering.educationProgram.id },
      pirAssessedDate: now,
      pirAssessedBy: systemUsersService.systemUser,
      pirApprovalReference: { id: pirApplicationVersion.id },
      updatedAt: now,
      modifier: systemUsersService.systemUser,
      currentAssessment: {
        id: pirApplicationCurrent.currentAssessment.id,
        offering: { id: pirOffering.id },
        updatedAt: now,
        modifier: systemUsersService.systemUser,
      },
      student: {
        id: expectedApplication.student.id,
        notes: [
          {
            id: expect.any(Number),
            description: `The program information request was automatically completed using information from a previous request that was approved on ${getDateOnlyFormat(
              pirAssessedDate,
            )}.`,
            noteType: NoteType.Application,
          },
        ],
      },
    });
  });

  it("Should update application PIR status using the status in the worker payload when the application does not contain dynamic data, which includes 'programPersistentProperties'.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);
    // Save a user to be used as the modifier and PIR assessed by.
    const savedUser = await db.user.save(createFakeUser());
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });
    const pirOffering = await db.educationProgramOffering.save(fakeOffering);
    // Create a new version of the previous application have the PIR approved.
    const pirApplicationCurrent = await saveFakeApplication(
      db.dataSource,
      undefined,
      {
        applicationData: {
          programName: "valueA",
          programDescription: "valueB",
        } as ApplicationData,
      },
    );
    const updateApplicationStatusPayload = createFakeUpdatePIRStatusPayload(
      pirApplicationCurrent.id,
      pirOffering.educationProgram.id,
      ProgramInfoStatus.required,
    );

    // Act
    const result = await programInfoRequestController.updateApplicationStatus(
      createFakeWorkerJob<
        ProgramInfoRequestJobInDTO,
        ProgramInfoRequestJobHeaderDTO,
        ProgramInfoRequestJobOutDTO
      >(updateApplicationStatusPayload),
    );

    // Asserts
    expect(result).toEqual({
      resultType: MockedZeebeJobResult.Complete,
      outputVariables: { programInfoStatus: ProgramInfoStatus.required },
    });

    // Asserts that the application PIR status is completed
    // and data was updated as expected.
    const expectedApplication = await db.application.findOne({
      select: {
        id: true,
        pirStatus: true,
        pirHash: true,
        pirProgram: { id: true },
        pirAssessedDate: true,
        pirAssessedBy: { id: true },
        updatedAt: true,
        modifier: { id: true },
      },
      relations: {
        pirAssessedBy: true,
        pirProgram: true,
        modifier: true,
      },
      where: { id: pirApplicationCurrent.id },
    });
    expect(expectedApplication).toEqual({
      id: pirApplicationCurrent.id,
      pirStatus: ProgramInfoStatus.required,
      pirHash: null,
      pirProgram: { id: pirOffering.educationProgram.id },
      pirAssessedDate: null,
      pirAssessedBy: null,
      updatedAt: now,
      modifier: systemUsersService.systemUser,
    });
  });

  it("Should update the application PIR status using the status in the worker payload when a previously approved PIR exists, but with a different hash.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);
    const pirAssessedDate = addDays(-1);
    // Save a user to be used as the modifier and PIR assessed by.
    const savedUser = await db.user.save(createFakeUser());
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });
    const pirOffering = await db.educationProgramOffering.save(fakeOffering);
    // Save a previous application version with an approved PIR and different hash.
    // pirHash as "someOtherHash" which is different from the hash of { programName: "valueA", programDescription: "valueB"}.
    const pirApplicationVersion = await saveFakeApplication(
      db.dataSource,
      {
        pirProgram: pirOffering.educationProgram,
        offering: pirOffering,
      },
      {
        pirStatus: ProgramInfoStatus.completed,
        initialValues: {
          pirHash: "someOtherHash",
          pirAssessedDate: pirAssessedDate,
        },
      },
    );
    // Create a new version of the previous application have the PIR approved.
    const pirApplicationCurrent = await saveFakeApplication(
      db.dataSource,
      {
        parentApplication: pirApplicationVersion,
      },
      {
        applicationData: {
          programName: "valueA",
          programPersistentProperties: ["programName"],
        } as ApplicationData,
      },
    );
    const updateApplicationStatusPayload = createFakeUpdatePIRStatusPayload(
      pirApplicationCurrent.id,
      pirOffering.educationProgram.id,
      ProgramInfoStatus.required,
    );

    // Act
    const result = await programInfoRequestController.updateApplicationStatus(
      createFakeWorkerJob<
        ProgramInfoRequestJobInDTO,
        ProgramInfoRequestJobHeaderDTO,
        ProgramInfoRequestJobOutDTO
      >(updateApplicationStatusPayload),
    );

    // Asserts
    expect(result).toEqual({
      resultType: MockedZeebeJobResult.Complete,
      outputVariables: { programInfoStatus: ProgramInfoStatus.required },
    });

    // Asserts that the application PIR status is completed
    // and data was updated as expected.
    const expectedApplication = await db.application.findOne({
      select: {
        id: true,
        pirStatus: true,
        pirHash: true,
        pirProgram: { id: true },
        pirAssessedDate: true,
        pirAssessedBy: { id: true },
        updatedAt: true,
        modifier: { id: true },
      },
      relations: {
        pirAssessedBy: true,
        pirProgram: true,
        modifier: true,
      },
      where: { id: pirApplicationCurrent.id },
    });
    expect(expectedApplication).toEqual({
      id: pirApplicationCurrent.id,
      pirStatus: ProgramInfoStatus.required,
      pirHash:
        "fcd7007c38efef538e6d5fa09d37565a6388111c26eb558b1b8b21b9bacfcb2c",
      pirProgram: { id: pirOffering.educationProgram.id },
      pirAssessedDate: null,
      pirAssessedBy: null,
      updatedAt: now,
      modifier: systemUsersService.systemUser,
    });
  });

  it("Should not update application PIR status when already set.", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });
    const savedOffering = await db.educationProgramOffering.save(fakeOffering);
    const fakeApplication = await saveFakeApplication(db.dataSource);
    fakeApplication.pirProgram = {
      id: savedOffering.educationProgram.id,
    } as EducationProgram;
    fakeApplication.pirStatus = ProgramInfoStatus.required;
    const savedApplication = await db.application.save(fakeApplication);

    const updateApplicationStatusPayload = createFakeUpdatePIRStatusPayload(
      savedApplication.id,
      savedApplication.pirProgram.id,
      ProgramInfoStatus.completed,
    );

    //Act
    const result = await programInfoRequestController.updateApplicationStatus(
      createFakeWorkerJob<
        ProgramInfoRequestJobInDTO,
        ProgramInfoRequestJobHeaderDTO,
        ProgramInfoRequestJobOutDTO
      >(updateApplicationStatusPayload),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    // Asserts that the application PIR status has not changed.
    const expectedApplication = await db.application.findOne({
      select: { pirStatus: true },
      where: { id: savedApplication.id },
    });
    expect(expectedApplication.pirStatus).toBe(ProgramInfoStatus.required);
  });

  it("Should have job error status when could not find the application.", async () => {
    // Arrange
    const updateApplicationStatusPayload = createFakeUpdatePIRStatusPayload(
      999999,
      999999,
      ProgramInfoStatus.completed,
    );

    //Act
    const result = await programInfoRequestController.updateApplicationStatus(
      createFakeWorkerJob<
        ProgramInfoRequestJobInDTO,
        ProgramInfoRequestJobHeaderDTO,
        ProgramInfoRequestJobOutDTO
      >(updateApplicationStatusPayload),
    );

    // Assert
    expect(result).toEqual({
      [FAKE_WORKER_JOB_RESULT_PROPERTY]: MockedZeebeJobResult.Error,
      [FAKE_WORKER_JOB_ERROR_MESSAGE_PROPERTY]:
        "Application not found while verifying the PIR.",
      [FAKE_WORKER_JOB_ERROR_CODE_PROPERTY]: APPLICATION_NOT_FOUND,
    });
  });
});
