import { ApplicationStatus } from "@sims/sims-db";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { APPLICATION_STATUS_NOT_UPDATED } from "../../../../constants";
import {
  createFakeWorkerJob,
  FAKE_WORKER_JOB_ERROR_CODE_PROPERTY,
  FAKE_WORKER_JOB_ERROR_MESSAGE_PROPERTY,
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../../test/helpers";
import { ApplicationController } from "../../application.controller";
import {
  ApplicationUpdateStatusJobHeaderDTO,
  ApplicationUpdateStatusJobInDTO,
} from "../../application.dto";
import { createFakeUpdateApplicationStatusPayload } from "./update-application-status";
import { IOutputVariables } from "@camunda8/sdk/dist/zeebe/types";

describe("ApplicationController(e2e)-updateStatus", () => {
  let db: E2EDataSources;
  let applicationController: ApplicationController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    applicationController = nestApplication.get(ApplicationController);
  });

  it("Should update application status when it receives the correct original status.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);

    const updateApplicationStatusPayload =
      createFakeUpdateApplicationStatusPayload(
        savedApplication.id,
        ApplicationStatus.Submitted,
        ApplicationStatus.Cancelled,
      );

    // Act
    const result = await applicationController.updateApplicationStatus(
      createFakeWorkerJob<
        ApplicationUpdateStatusJobInDTO,
        ApplicationUpdateStatusJobHeaderDTO,
        IOutputVariables
      >(updateApplicationStatusPayload),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    // Asserts that the application status has changed to declined.
    const expectedApplication = await db.application.findOne({
      select: { applicationStatus: true },
      where: { id: savedApplication.id },
    });
    expect(expectedApplication.applicationStatus).toBe(
      ApplicationStatus.Cancelled,
    );
  });

  it("Should not update application status and return error when it does not receive the correct original status.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);

    const updateApplicationStatusPayload =
      createFakeUpdateApplicationStatusPayload(
        savedApplication.id,
        ApplicationStatus.InProgress,
        ApplicationStatus.Assessment,
      );

    // Act
    const result = await applicationController.updateApplicationStatus(
      createFakeWorkerJob<
        ApplicationUpdateStatusJobInDTO,
        ApplicationUpdateStatusJobHeaderDTO,
        IOutputVariables
      >(updateApplicationStatusPayload),
    );

    // Asserts
    expect(result).toEqual({
      [FAKE_WORKER_JOB_RESULT_PROPERTY]: MockedZeebeJobResult.Error,
      [FAKE_WORKER_JOB_ERROR_MESSAGE_PROPERTY]:
        "The application status was not updated either because the application id was not found or the application is not in the expected status.",
      [FAKE_WORKER_JOB_ERROR_CODE_PROPERTY]: APPLICATION_STATUS_NOT_UPDATED,
    });

    // Asserts that the application status has not changed to declined.
    const expectedApplication = await db.application.findOne({
      select: { applicationStatus: true },
      where: { id: savedApplication.id },
    });
    expect(expectedApplication.applicationStatus).toBe(
      ApplicationStatus.Submitted,
    );
  });

  it("Should return error when it does not find the application.", async () => {
    // Arrange
    const updateApplicationStatusPayload =
      createFakeUpdateApplicationStatusPayload(
        9999999,
        ApplicationStatus.InProgress,
        ApplicationStatus.Assessment,
      );

    // Act
    const result = await applicationController.updateApplicationStatus(
      createFakeWorkerJob<
        ApplicationUpdateStatusJobInDTO,
        ApplicationUpdateStatusJobHeaderDTO,
        IOutputVariables
      >(updateApplicationStatusPayload),
    );

    // Asserts
    expect(result).toEqual({
      [FAKE_WORKER_JOB_RESULT_PROPERTY]: MockedZeebeJobResult.Error,
      [FAKE_WORKER_JOB_ERROR_MESSAGE_PROPERTY]:
        "The application status was not updated either because the application id was not found or the application is not in the expected status.",
      [FAKE_WORKER_JOB_ERROR_CODE_PROPERTY]: APPLICATION_STATUS_NOT_UPDATED,
    });
  });
});
