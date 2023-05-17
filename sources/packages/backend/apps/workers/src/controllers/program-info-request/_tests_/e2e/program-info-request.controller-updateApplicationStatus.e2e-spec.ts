import { EducationProgram, ProgramInfoStatus } from "@sims/sims-db";
import {
  createE2EDataSources,
  createFakeApplication,
  createFakeEducationProgramOffering,
  createFakeStudent,
  createFakeUser,
  E2EDataSources,
} from "@sims/test-utils";
import {
  createFakeWorkerJob,
  FAKE_WORKER_JOB_ERROR_CODE_PROPERTY,
  FAKE_WORKER_JOB_ERROR_MESSAGE_PROPERTY,
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../testHelpers";
import { ProgramInfoRequestController } from "../../program-info-request.controller";
import {
  ProgramInfoRequestJobHeaderDTO,
  ProgramInfoRequestJobInDTO,
  ProgramInfoRequestJobOutDTO,
} from "../../program-info-request.dto";
import { createFakeUpdateApplicationStatusPayload } from "./update-application-status";

describe("Program info request controller - updateApplicationStatus", () => {
  let db: E2EDataSources;
  let programInfoRequestController: ProgramInfoRequestController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    await nestApplication.init();
    db = createE2EDataSources(dataSource);
    programInfoRequestController = nestApplication.get(
      ProgramInfoRequestController,
    );
  });

  it("Should update application PIR status when not set.", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });
    const savedOffering = await db.educationProgramOffering.save(fakeOffering);
    const fakeApplication = createFakeApplication();
    fakeApplication.pirProgram = {
      id: savedOffering.educationProgram.id,
    } as EducationProgram;
    const savedApplication = await db.application.save(fakeApplication);

    const updateApplicationStatusPayload =
      createFakeUpdateApplicationStatusPayload(
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

    // Asserts that the application PIR status has changed to declined
    const expectedApplication = await db.application.findOneBy({
      id: savedApplication.id,
    });
    expect(expectedApplication.pirStatus).toEqual(ProgramInfoStatus.declined);
  });

  it("Should not update application PIR status when already set.", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });
    const savedOffering = await db.educationProgramOffering.save(fakeOffering);
    const fakeApplication = createFakeApplication();
    fakeApplication.pirProgram = {
      id: savedOffering.educationProgram.id,
    } as EducationProgram;
    fakeApplication.pirStatus = ProgramInfoStatus.required;
    const savedApplication = await db.application.save(fakeApplication);

    const updateApplicationStatusPayload =
      createFakeUpdateApplicationStatusPayload(
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

    // Asserts that the application PIR status has not changed
    const expectedApplication = await db.application.findOneBy({
      id: savedApplication.id,
    });
    expect(expectedApplication.pirStatus).toEqual(ProgramInfoStatus.required);
  });

  it("Should have job error status when could not find the application.", async () => {
    // Arrange
    const updateApplicationStatusPayload =
      createFakeUpdateApplicationStatusPayload(
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
      [FAKE_WORKER_JOB_ERROR_CODE_PROPERTY]: "APPLICATION_NOT_FOUND",
    });
  });
});
