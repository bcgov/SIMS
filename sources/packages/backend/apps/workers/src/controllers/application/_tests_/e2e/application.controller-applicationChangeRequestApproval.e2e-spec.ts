import {
  ApplicationEditStatus,
  ApplicationStatus,
  Student,
  User,
} from "@sims/sims-db";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  createFakeWorkerJob,
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  FakeWorkerJobResult,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../../test/helpers";
import { ApplicationController } from "../../application.controller";
import {
  ApplicationChangeRequestApprovalJobInDTO,
  ApplicationChangeRequestApprovalJobOutDTO,
} from "../../application.dto";
import { ICustomHeaders } from "@camunda8/sdk/dist/zeebe/types";
import { createFakeApplicationChangeRequestApprovalPayload } from "./application-change-request-approval";
import { SystemUsersService } from "@sims/services";

describe("ApplicationController(e2e)-applicationChangeRequestApproval", () => {
  let db: E2EDataSources;
  let applicationController: ApplicationController;
  let systemUser: User;
  let sharedStudent: Student;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    applicationController = nestApplication.get(ApplicationController);
    sharedStudent = await saveFakeStudent(db.dataSource);
    systemUser = nestApplication.get(SystemUsersService).systemUser;
  });

  it(`Should update application edit status to ${ApplicationEditStatus.ChangePendingApproval} when the Ministry approval is required.`, async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(
      db.dataSource,
      { student: sharedStudent },
      {
        applicationStatus: ApplicationStatus.Edited,
        applicationEditStatus: ApplicationEditStatus.ChangeInProgress,
      },
    );
    const updateApplicationStatusPayload =
      createFakeApplicationChangeRequestApprovalPayload(savedApplication.id);

    // Act
    const result = await applicationController.applicationChangeRequestApproval(
      createFakeWorkerJob<
        ApplicationChangeRequestApprovalJobInDTO,
        ICustomHeaders,
        ApplicationChangeRequestApprovalJobOutDTO
      >(updateApplicationStatusPayload),
    );

    // Assert
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );
    expect(FakeWorkerJobResult.getOutputVariables(result)).toEqual({
      applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
    });

    const expectedApplication = await db.application.findOne({
      select: {
        id: true,
        applicationEditStatus: true,
        applicationEditStatusUpdatedOn: true,
        applicationEditStatusUpdatedBy: { id: true },
      },
      relations: {
        applicationEditStatusUpdatedBy: true,
      },
      where: { id: savedApplication.id },
    });
    expect(expectedApplication).toEqual({
      id: savedApplication.id,
      applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
      applicationEditStatusUpdatedBy: {
        id: systemUser.id,
      },
      applicationEditStatusUpdatedOn: expect.any(Date),
    });
  });

  it(`Should not update the application edit status when it is already set as ${ApplicationEditStatus.ChangePendingApproval}.`, async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(
      db.dataSource,
      { student: sharedStudent },
      {
        applicationStatus: ApplicationStatus.Edited,
        applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
      },
    );
    const updateApplicationStatusPayload =
      createFakeApplicationChangeRequestApprovalPayload(savedApplication.id);

    // Act
    const result = await applicationController.applicationChangeRequestApproval(
      createFakeWorkerJob<
        ApplicationChangeRequestApprovalJobInDTO,
        ICustomHeaders,
        ApplicationChangeRequestApprovalJobOutDTO
      >(updateApplicationStatusPayload),
    );

    // Assert
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );
    expect(FakeWorkerJobResult.getOutputVariables(result)).toEqual({
      applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
    });

    // Asserts that the application status has changed to declined.
    const expectedApplication = await db.application.findOne({
      select: {
        id: true,
        applicationEditStatus: true,
        applicationEditStatusUpdatedOn: true,
        applicationEditStatusUpdatedBy: { id: true },
      },
      relations: {
        applicationEditStatusUpdatedBy: true,
      },
      where: { id: savedApplication.id },
    });
    expect(expectedApplication).toEqual({
      id: savedApplication.id,
      applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
      applicationEditStatusUpdatedBy: {
        id: savedApplication.applicationEditStatusUpdatedBy.id,
      },
      applicationEditStatusUpdatedOn:
        savedApplication.applicationEditStatusUpdatedOn,
    });
  });

  it(`Should not update the application edit status when it is set as ${ApplicationEditStatus.ChangeCancelled}.`, async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(
      db.dataSource,
      { student: sharedStudent },
      {
        applicationStatus: ApplicationStatus.Edited,
        applicationEditStatus: ApplicationEditStatus.ChangeCancelled,
      },
    );
    const updateApplicationStatusPayload =
      createFakeApplicationChangeRequestApprovalPayload(savedApplication.id);

    // Act
    const result = await applicationController.applicationChangeRequestApproval(
      createFakeWorkerJob<
        ApplicationChangeRequestApprovalJobInDTO,
        ICustomHeaders,
        ApplicationChangeRequestApprovalJobOutDTO
      >(updateApplicationStatusPayload),
    );

    // Assert
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );
    expect(FakeWorkerJobResult.getOutputVariables(result)).toEqual({
      applicationEditStatus: ApplicationEditStatus.ChangeCancelled,
    });

    // Asserts that the application status has changed to declined.
    const expectedApplication = await db.application.findOne({
      select: {
        id: true,
        applicationEditStatus: true,
        applicationEditStatusUpdatedOn: true,
        applicationEditStatusUpdatedBy: { id: true },
      },
      relations: {
        applicationEditStatusUpdatedBy: true,
      },
      where: { id: savedApplication.id },
    });
    expect(expectedApplication).toEqual({
      id: savedApplication.id,
      applicationEditStatus: ApplicationEditStatus.ChangeCancelled,
      applicationEditStatusUpdatedBy: {
        id: savedApplication.applicationEditStatusUpdatedBy.id,
      },
      applicationEditStatusUpdatedOn:
        savedApplication.applicationEditStatusUpdatedOn,
    });
  });
});
