import { APPLICATION_NOT_FOUND } from "@sims/services/constants";
import { ApplicationData, ApplicationExceptionStatus } from "@sims/sims-db";
import {
  createE2EDataSources,
  createFakeApplicationException,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
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
import { createFakeVerifyUniqueApplicationExceptionsPayload } from "./verify-unique-application-exceptions";
import { ICustomHeaders } from "@camunda8/sdk/dist/zeebe/types";

describe("ApplicationController(e2e)-verifyUniqueApplicationExceptions", () => {
  let db: E2EDataSources;
  let applicationController: ApplicationController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    applicationController = nestApplication.get(ApplicationController);
  });

  it("Should create and associate application exceptions when there are some exceptions for the application.", async () => {
    // Arrange
    const fakeApplication = await saveFakeApplication(
      db.dataSource,
      undefined,
      {
        applicationData: {
          workflowName: "",
          parents: [
            {
              currentYearParentIncomeApplicationException: {
                exceptionDescription:
                  "Current Year Parent Income Exception - Parent 1",
                decreaseInParentIncomeSupportingDocuments: [
                  {
                    url: "student/files/UploadFile15Kb-01978925-f0c4-4117-a588-da61c98e8b7d.txt",
                    name: "UploadFile15Kb-01978925-f0c4-4117-a588-da61c98e8b7d.txt",
                    originalName: "UploadFile15Kb.txt",
                  },
                ],
              },
            },
          ],
        } as ApplicationData,
      },
    );
    const savedApplication = await db.application.save(fakeApplication);
    const verifyUniqueApplicationExceptionsPayload =
      createFakeVerifyUniqueApplicationExceptionsPayload(savedApplication.id);

    // Act
    const result =
      await applicationController.verifyUniqueApplicationExceptions(
        createFakeWorkerJob<
          ApplicationExceptionsJobInDTO,
          ICustomHeaders,
          ApplicationExceptionsJobOutDTO
        >(verifyUniqueApplicationExceptionsPayload),
      );

    // Assert
    // Validate job result.
    expect(result).toEqual({
      resultType: MockedZeebeJobResult.Complete,
      outputVariables: {
        applicationExceptionStatus: ApplicationExceptionStatus.Pending,
      },
    });
    // Validate DB changes.
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
    const savedApplication = await saveFakeApplication(db.dataSource);
    const verifyUniqueApplicationExceptionsPayload =
      createFakeVerifyUniqueApplicationExceptionsPayload(savedApplication.id);

    // Act
    const result =
      await applicationController.verifyUniqueApplicationExceptions(
        createFakeWorkerJob<
          ApplicationExceptionsJobInDTO,
          ICustomHeaders,
          ApplicationExceptionsJobOutDTO
        >(verifyUniqueApplicationExceptionsPayload),
      );

    // Assert
    // Validate job result.
    expect(result).toEqual({
      resultType: MockedZeebeJobResult.Complete,
      outputVariables: {
        applicationExceptionStatus: ApplicationExceptionStatus.Approved,
      },
    });
    // Validate DB changes.
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
    const verifyUniqueApplicationExceptionsPayload =
      createFakeVerifyUniqueApplicationExceptionsPayload(9999999);

    // Act
    const result =
      await applicationController.verifyUniqueApplicationExceptions(
        createFakeWorkerJob<
          ApplicationExceptionsJobInDTO,
          ICustomHeaders,
          ApplicationExceptionsJobOutDTO
        >(verifyUniqueApplicationExceptionsPayload),
      );

    // Assert
    // Validate job result.
    expect(result).toEqual({
      [FAKE_WORKER_JOB_RESULT_PROPERTY]: MockedZeebeJobResult.Error,
      [FAKE_WORKER_JOB_ERROR_MESSAGE_PROPERTY]: "Application ID not found.",
      [FAKE_WORKER_JOB_ERROR_CODE_PROPERTY]: APPLICATION_NOT_FOUND,
    });
  });

  it("Should not create an application exception when there is already one for the application.", async () => {
    // Arrange
    const fakeApplication = await saveFakeApplication(db.dataSource);
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

    const verifyUniqueApplicationExceptionsPayload =
      createFakeVerifyUniqueApplicationExceptionsPayload(savedApplication.id);

    // Act
    const result =
      await applicationController.verifyUniqueApplicationExceptions(
        createFakeWorkerJob<
          ApplicationExceptionsJobInDTO,
          ICustomHeaders,
          ApplicationExceptionsJobOutDTO
        >(verifyUniqueApplicationExceptionsPayload),
      );

    // Assert
    // Validate job result.
    expect(result).toEqual({
      resultType: MockedZeebeJobResult.Complete,
      outputVariables: {
        applicationExceptionStatus: ApplicationExceptionStatus.Approved,
      },
    });
    // Validate DB changes.
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
