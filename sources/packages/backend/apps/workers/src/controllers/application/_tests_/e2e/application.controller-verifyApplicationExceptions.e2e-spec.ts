import { APPLICATION_NOT_FOUND } from "@sims/services/constants";
import { ApplicationData, ApplicationExceptionStatus } from "@sims/sims-db";
import {
  createE2EDataSources,
  createFakeApplication,
  createFakeApplicationException,
  E2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import { ICustomHeaders } from "zeebe-node";
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
  ApplicationExceptionsJobInDTO,
  ApplicationExceptionsJobOutDTO,
} from "../../application.dto";
import { createFakeVerifyApplicationExceptionsPayload } from "./verify-application-exceptions";

describe("ApplicationController(e2e)-verifyApplicationExceptions", () => {
  let db: E2EDataSources;
  let applicationController: ApplicationController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    applicationController = nestApplication.get(ApplicationController);
  });

  it("Should create and associate application exceptions when there are some exceptions for the application.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const fakeApplication = createFakeApplication({ student });
    fakeApplication.data = {
      workflowName: "",
      test: {
        test: "studentApplicationException",
      },
    } as ApplicationData;
    const savedApplication = await db.application.save(fakeApplication);
    const verifyApplicationExceptionsPayload =
      createFakeVerifyApplicationExceptionsPayload(savedApplication.id);

    // Act
    const result = await applicationController.verifyApplicationExceptions(
      createFakeWorkerJob<
        ApplicationExceptionsJobInDTO,
        ICustomHeaders,
        ApplicationExceptionsJobOutDTO
      >(verifyApplicationExceptionsPayload),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    const updatedApplication = await db.application.findOne({
      select: { applicationException: { exceptionStatus: true } },
      relations: { applicationException: true },
      where: {
        id: savedApplication.id,
      },
    });
    expect(updatedApplication.applicationException.exceptionStatus).toBe(
      ApplicationExceptionStatus.Pending,
    );
  });

  it("Should not create any application exception when there is no application exception in application data.", async () => {
    // Arrange
    const fakeApplication = createFakeApplication();
    const savedApplication = await db.application.save(fakeApplication);
    const verifyApplicationExceptionsPayload =
      createFakeVerifyApplicationExceptionsPayload(savedApplication.id);

    // Act
    const result = await applicationController.verifyApplicationExceptions(
      createFakeWorkerJob<
        ApplicationExceptionsJobInDTO,
        ICustomHeaders,
        ApplicationExceptionsJobOutDTO
      >(verifyApplicationExceptionsPayload),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    const updatedApplication = await db.application.findOne({
      select: { applicationException: { exceptionStatus: true } },
      relations: { applicationException: true },
      where: {
        id: savedApplication.id,
      },
    });
    expect(updatedApplication.applicationException).toBeNull();
  });

  it("Should return error when it does not find the application.", async () => {
    // Arrange
    const verifyApplicationExceptionsPayload =
      createFakeVerifyApplicationExceptionsPayload(9999999);

    // Act
    const result = await applicationController.verifyApplicationExceptions(
      createFakeWorkerJob<
        ApplicationExceptionsJobInDTO,
        ICustomHeaders,
        ApplicationExceptionsJobOutDTO
      >(verifyApplicationExceptionsPayload),
    );

    // Asserts
    expect(result).toEqual({
      [FAKE_WORKER_JOB_RESULT_PROPERTY]: MockedZeebeJobResult.Error,
      [FAKE_WORKER_JOB_ERROR_MESSAGE_PROPERTY]: "Application id not found.",
      [FAKE_WORKER_JOB_ERROR_CODE_PROPERTY]: APPLICATION_NOT_FOUND,
    });
  });

  it("Should not create an application exception when there is already one for the application.", async () => {
    // Arrange
    const fakeApplication = createFakeApplication();
    fakeApplication.data = {
      workflowName: "",
      test: {
        test: "studentApplicationException",
      },
    } as ApplicationData;
    const fakeApplicationException = createFakeApplicationException();
    fakeApplicationException.exceptionStatus =
      ApplicationExceptionStatus.Approved;
    const savedFakeApplicationException = await db.applicationException.save(
      fakeApplicationException,
    );
    fakeApplication.applicationException = savedFakeApplicationException;
    const savedApplication = await db.application.save(fakeApplication);

    const verifyApplicationExceptionsPayload =
      createFakeVerifyApplicationExceptionsPayload(savedApplication.id);

    // Act
    const result = await applicationController.verifyApplicationExceptions(
      createFakeWorkerJob<
        ApplicationExceptionsJobInDTO,
        ICustomHeaders,
        ApplicationExceptionsJobOutDTO
      >(verifyApplicationExceptionsPayload),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    const updatedApplication = await db.application.findOne({
      select: { applicationException: { exceptionStatus: true } },
      relations: { applicationException: true },
      where: {
        id: savedApplication.id,
      },
    });
    expect(updatedApplication.applicationException.exceptionStatus).toBe(
      ApplicationExceptionStatus.Approved,
    );
  });
});
