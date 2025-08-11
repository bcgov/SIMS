import { APPLICATION_NOT_FOUND } from "@sims/services/constants";
import { ApplicationData, ApplicationExceptionStatus } from "@sims/sims-db";
import {
  createE2EDataSources,
  createFakeApplicationException,
  createFakeApplicationExceptionRequest,
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
import { SystemUsersService } from "@sims/services";
import MockDate from "mockdate";

describe("ApplicationController(e2e)-verifyUniqueApplicationExceptions", () => {
  let db: E2EDataSources;
  let applicationController: ApplicationController;
  let systemUsersService: SystemUsersService;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    applicationController = nestApplication.get(ApplicationController);
    systemUsersService = nestApplication.get(SystemUsersService);
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  it(
    "Should create and associate an application exception with three exception requests with hashes " +
      "when there are exceptions for the application.",
    async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource, undefined, {
        applicationData: {
          workflowName: "",
          someExceptionList: [
            {
              someApplicationException: {
                exceptionDescription: "Some Application Exception - 1",
                decreaseInParentIncomeSupportingDocuments: [
                  {
                    url: "some_url_f47ac10b-58cc-4372-a567-0e02b2c3d479",
                    name: "some_name_f47ac10b-58cc-4372-a567-0e02b2c3d479",
                    originalName: "some_original_name_A",
                  },
                ],
              },
            },
            {
              someApplicationException: {
                exceptionDescription: "Some Application Exception - 2",
                decreaseInParentIncomeSupportingDocuments: [
                  {
                    url: "some_url_6ba7b810-9dad-11d1-80b4-00c04fd430c8",
                    name: "some_name_6ba7b810-9dad-11d1-80b4-00c04fd430c8",
                    originalName: "some_original_name_B",
                  },
                ],
              },
            },
          ],
          someOtherApplicationException: {
            exceptionDescription: "Some Other Application Exception",
            decreaseInParentIncomeSupportingDocuments: [
              {
                url: "some_url_8f7e4d2a-1b3c-4a5e-9f8d-7c6b5a4e3d2f",
                name: "some_name_8f7e4d2a-1b3c-4a5e-9f8d-7c6b5a4e3d2f",
                originalName: "some_original_name_A",
              },
            ],
          },
        } as ApplicationData,
      });
      const verifyUniqueApplicationExceptionsPayload =
        createFakeVerifyUniqueApplicationExceptionsPayload(application.id);

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
        select: {
          id: true,
          applicationException: {
            id: true,
            exceptionStatus: true,
            exceptionRequests: {
              id: true,
              exceptionName: true,
              exceptionDescription: true,
              exceptionHash: true,
            },
          },
        },
        relations: { applicationException: { exceptionRequests: true } },
        where: {
          id: application.id,
        },
      });
      expect(updatedApplication).toEqual({
        id: application.id,
        applicationException: {
          id: expect.any(Number),
          exceptionStatus: ApplicationExceptionStatus.Pending,
          exceptionRequests: [
            {
              id: expect.any(Number),
              exceptionName: "someApplicationException",
              exceptionDescription: "Some Application Exception - 1",
              exceptionHash:
                "99283cd205266dc0c667899fa8ff6edb940598d239d0a2652b05dc01d25a920c",
            },
            {
              id: expect.any(Number),
              exceptionName: "someApplicationException",
              exceptionDescription: "Some Application Exception - 2",
              exceptionHash:
                "7e286748603937ab6a98c191445132dce68cdfd006ccd1be7ea3574e2f50f5a9",
            },
            {
              id: expect.any(Number),
              exceptionName: "someOtherApplicationException",
              exceptionDescription: "Some Other Application Exception",
              exceptionHash:
                "10e8f9d54f2ab4332f58ad151a6425b6a15469f51ce57fafc765ede641126b5a",
            },
          ],
        },
      });
    },
  );

  it(
    "Should create and associate an approved application exception with two exception requests " +
      "when all application exceptions part of the new submission were previously approved.",
    async () => {
      // Arrange
      // Create two already approved application exceptions.
      const exception = createFakeApplicationException();
      exception.exceptionStatus = ApplicationExceptionStatus.Approved;
      const savedException = await db.applicationException.save(exception);
      const exceptionRequest1 = createFakeApplicationExceptionRequest(
        {
          applicationException: savedException,
        },
        {
          initialData: {
            exceptionName: "someApplicationException",
            exceptionHash:
              "99283cd205266dc0c667899fa8ff6edb940598d239d0a2652b05dc01d25a920c",
          },
        },
      );
      const exceptionRequest2 = createFakeApplicationExceptionRequest(
        {
          applicationException: savedException,
        },
        {
          initialData: {
            exceptionName: "someOtherApplicationException",
            exceptionHash:
              "10e8f9d54f2ab4332f58ad151a6425b6a15469f51ce57fafc765ede641126b5a",
          },
        },
      );
      const [savedRequest1, savedRequest2] =
        await db.applicationExceptionRequest.save([
          exceptionRequest1,
          exceptionRequest2,
        ]);
      const previousApplication = await saveFakeApplication(db.dataSource, {
        applicationException: savedException,
      });
      // Most recently application that should have the exception automatically approved.
      const currentApplication = await saveFakeApplication(
        db.dataSource,
        {
          parentApplication: previousApplication,
        },
        {
          applicationData: {
            workflowName: "",
            someOtherApplicationException: {
              exceptionDescription: "Some Other Application Exception",
              decreaseInParentIncomeSupportingDocuments: [
                {
                  url: "some_url_8f7e4d2a-1b3c-4a5e-9f8d-7c6b5a4e3d2f",
                  name: "some_name_8f7e4d2a-1b3c-4a5e-9f8d-7c6b5a4e3d2f",
                  originalName: "some_original_name_A",
                },
              ],
            },
            someExceptionList: [
              {
                someApplicationException: {
                  exceptionDescription: "Some Application Exception - 1",
                  decreaseInParentIncomeSupportingDocuments: [
                    {
                      url: "some_url_f47ac10b-58cc-4372-a567-0e02b2c3d479",
                      name: "some_name_f47ac10b-58cc-4372-a567-0e02b2c3d479",
                      originalName: "some_original_name_A",
                    },
                  ],
                },
              },
            ],
          } as ApplicationData,
        },
      );
      const now = new Date();
      MockDate.set(now);

      const verifyUniqueApplicationExceptionsPayload =
        createFakeVerifyUniqueApplicationExceptionsPayload(
          currentApplication.id,
        );

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
        select: {
          id: true,
          updatedAt: true,
          modifier: { id: true },
          applicationException: {
            id: true,
            assessedBy: { id: true },
            assessedDate: true,
            createdAt: true,
            creator: { id: true },
            exceptionStatus: true,
            exceptionRequests: {
              id: true,
              exceptionName: true,
              exceptionDescription: true,
              exceptionHash: true,
              approvalExceptionRequest: {
                id: true,
              },
              creator: { id: true },
              createdAt: true,
            },
          },
        },
        relations: {
          modifier: true,
          applicationException: {
            creator: true,
            assessedBy: true,
            exceptionRequests: {
              approvalExceptionRequest: true,
              creator: true,
            },
          },
        },
        where: {
          id: currentApplication.id,
        },
        order: {
          applicationException: {
            exceptionRequests: {
              exceptionDescription: "ASC",
            },
          },
        },
        loadEagerRelations: false,
      });
      expect(updatedApplication).toEqual({
        id: currentApplication.id,
        updatedAt: now,
        modifier: systemUsersService.systemUser,
        applicationException: {
          id: expect.any(Number),
          assessedBy: systemUsersService.systemUser,
          assessedDate: now,
          creator: systemUsersService.systemUser,
          createdAt: now,
          exceptionStatus: ApplicationExceptionStatus.Approved,
          exceptionRequests: [
            {
              id: expect.any(Number),
              exceptionName: "someApplicationException",
              exceptionDescription: "Some Application Exception - 1",
              exceptionHash:
                "99283cd205266dc0c667899fa8ff6edb940598d239d0a2652b05dc01d25a920c",
              approvalExceptionRequest: {
                id: savedRequest1.id,
              },
              creator: systemUsersService.systemUser,
              createdAt: now,
            },
            {
              id: expect.any(Number),
              exceptionName: "someOtherApplicationException",
              exceptionDescription: "Some Other Application Exception",
              exceptionHash:
                "10e8f9d54f2ab4332f58ad151a6425b6a15469f51ce57fafc765ede641126b5a",
              approvalExceptionRequest: {
                id: savedRequest2.id,
              },
              creator: systemUsersService.systemUser,
              createdAt: now,
            },
          ],
        },
      });
    },
  );

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
