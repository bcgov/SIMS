import {
  APPLICATION_NOT_FOUND,
  INVALID_OPERATION_IN_THE_CURRENT_STATE,
} from "@sims/services/constants";
import {
  ApplicationData,
  ApplicationExceptionStatus,
  EducationProgramOffering,
  ProgramInfoStatus,
} from "@sims/sims-db";
import {
  createE2EDataSources,
  createFakeApplicationException,
  createFakeApplicationExceptionRequest,
  createFakeEducationProgramOffering,
  E2EDataSources,
  saveFakeApplication,
  saveFakeStudent,
  saveFakeStudentFileUpload,
} from "@sims/test-utils";
import {
  FAKE_WORKER_JOB_ERROR_CODE_PROPERTY,
  FAKE_WORKER_JOB_ERROR_MESSAGE_PROPERTY,
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../../test/helpers";
import { ApplicationController } from "../../application.controller";
import {
  createExceptionDataFile,
  createFakeVerifyUniqueApplicationExceptionsPayload,
} from "./verify-unique-application-exceptions";
import { SystemUsersService } from "@sims/services";
import MockDate from "mockdate";
import { addDays, getISODateOnlyString } from "@sims/utilities";

describe("ApplicationController(e2e)-verifyUniqueApplicationExceptions", () => {
  let db: E2EDataSources;
  let applicationController: ApplicationController;
  let systemUsersService: SystemUsersService;
  // Offering with end date more than required weeks from now to apply within deadline.
  let sharedOffering: EducationProgramOffering;
  const APPLICATION_SUBMISSION_DEADLINE_WEEKS = "6";

  beforeAll(async () => {
    // Set the application submission deadline weeks configuration for the test.
    process.env.APPLICATION_SUBMISSION_DEADLINE_WEEKS = APPLICATION_SUBMISSION_DEADLINE_WEEKS;
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    applicationController = nestApplication.get(ApplicationController);
    systemUsersService = nestApplication.get(SystemUsersService);
    sharedOffering = createFakeEducationProgramOffering(
      {
        auditUser: systemUsersService.systemUser,
      },
      {
        initialValues: {
          studyStartDate: getISODateOnlyString(new Date()),
          studyEndDate: getISODateOnlyString(addDays(43)),
        },
      },
    );
    await db.educationProgramOffering.save(sharedOffering);
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  it(
    "Should create and associate an application exception with three exception requests with hashes " +
      "when there are exceptions for the application.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      const files = await Promise.all([
        saveFakeStudentFileUpload(
          db.dataSource,
          { student },
          {
            fileName: "File A",
            hash: "99283cd205266dc0c667899fa8ff6edb940598d239d0a2652b05dc01d25a920c",
          },
        ),
        saveFakeStudentFileUpload(
          db.dataSource,
          { student },
          {
            fileName: "File B",
            hash: "f4b8c8e4b8c8e4b8c8e4b8c8e4b8c8e4b8c8e4b8c8e4b8c8e4b8c8e4b8c8e4b8",
          },
        ),
        saveFakeStudentFileUpload(
          db.dataSource,
          { student },
          {
            fileName: "File C",
            hash: "10e8f9d54f2ab4332f58ad151a6425b6a15469f51ce57fafc765ede641126b5a",
          },
        ),
      ]);
      const [file1, file2, file3] = files.map((file) =>
        createExceptionDataFile(file),
      );
      const application = await saveFakeApplication(
        db.dataSource,
        { student, offering: sharedOffering },
        {
          applicationData: {
            workflowName: "",
            someExceptionList: [
              {
                someApplicationException: {
                  exceptionDescription: "Some Application Exception - 1",
                  decreaseInParentIncomeSupportingDocuments: [file1],
                },
              },
              {
                someApplicationException: {
                  exceptionDescription: "Some Application Exception - 2",
                  decreaseInParentIncomeSupportingDocuments: [file2],
                },
              },
            ],
            someOtherApplicationException: {
              exceptionDescription: "Some Other Application Exception",
              decreaseInParentIncomeSupportingDocuments: [file3],
            },
          } as ApplicationData,
        },
      );

      const verifyUniqueApplicationExceptionsPayload =
        createFakeVerifyUniqueApplicationExceptionsPayload(application.id);

      // Act
      const result =
        await applicationController.verifyUniqueApplicationExceptions(
          verifyUniqueApplicationExceptionsPayload,
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
        order: {
          applicationException: {
            exceptionRequests: {
              exceptionDescription: "ASC",
            },
          },
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
                "96001142bc2a3cae09072fb3992b611016ae8c3a07c2b0cb78e1f6f2789b6169",
            },
            {
              id: expect.any(Number),
              exceptionName: "someApplicationException",
              exceptionDescription: "Some Application Exception - 2",
              exceptionHash:
                "f032fcc52cfa04d24fb5abcd5c208f5b63c1b7893f2beeab1f5704a8eed11f1a",
            },
            {
              id: expect.any(Number),
              exceptionName: "someOtherApplicationException",
              exceptionDescription: "Some Other Application Exception",
              exceptionHash:
                "2fcd1a09f2f7e8e2a5a46880cc97a8c38ef0b7428b8d2ffbf3ed740921fc62cd",
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
              "b0e3a8697648475e79c33f61a41cb514715690094ab9acdaae2737c744fc42de",
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
              "58f52eef5c7049560ef87de8d7a8726c8ac1b8c9c6e4d034168c7a86762c2900",
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
        offering: sharedOffering,
      });
      // Most recently application that should have the exception automatically approved.
      const student = await saveFakeStudent(db.dataSource);
      const files = await Promise.all([
        saveFakeStudentFileUpload(
          db.dataSource,
          { student },
          {
            fileName: "File A",
            hash: "99283cd205266dc0c667899fa8ff6edb940598d239d0a2652b05dc01d25a920c",
          },
        ),
        saveFakeStudentFileUpload(
          db.dataSource,
          { student },
          {
            fileName: "File B",
            hash: "f4b8c8e4b8c8e4b8c8e4b8c8e4b8c8e4b8c8e4b8c8e4b8c8e4b8c8e4b8c8e4b8",
          },
        ),
      ]);
      const [file1, file2] = files.map((file) => createExceptionDataFile(file));
      const currentApplication = await saveFakeApplication(
        db.dataSource,
        {
          student,
          parentApplication: previousApplication,
          offering: sharedOffering,
        },
        {
          applicationData: {
            workflowName: "",
            someOtherApplicationException: {
              exceptionDescription: "Some Other Application Exception",
              decreaseInParentIncomeSupportingDocuments: [file1],
            },
            someExceptionList: [
              {
                someApplicationException: {
                  exceptionDescription: "Some Application Exception - 1",
                  decreaseInParentIncomeSupportingDocuments: [file2],
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
          verifyUniqueApplicationExceptionsPayload,
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
                "b0e3a8697648475e79c33f61a41cb514715690094ab9acdaae2737c744fc42de",
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
                "58f52eef5c7049560ef87de8d7a8726c8ac1b8c9c6e4d034168c7a86762c2900",
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

  it(`Should create study end date is past application exception when study end date is less than ${APPLICATION_SUBMISSION_DEADLINE_WEEKS} weeks from the application submission date.`, async () => {
    // Arrange
    // Offering with end date less than required weeks from now to apply exceeding the deadline.
    const offeringPastDeadline = createFakeEducationProgramOffering(
      {
        auditUser: systemUsersService.systemUser,
      },
      {
        initialValues: {
          studyStartDate: getISODateOnlyString(new Date()),
          studyEndDate: getISODateOnlyString(addDays(41)),
        },
      },
    );
    await db.educationProgramOffering.save(offeringPastDeadline);
    const savedApplication = await saveFakeApplication(db.dataSource, {
      offering: offeringPastDeadline,
    });
    const verifyUniqueApplicationExceptionsPayload =
      createFakeVerifyUniqueApplicationExceptionsPayload(savedApplication.id);

    // Act
    const result =
      await applicationController.verifyUniqueApplicationExceptions(
        verifyUniqueApplicationExceptionsPayload,
      );

    // Assert
    // Validate job result expecting the application exception status as pending.
    expect(result).toEqual({
      resultType: MockedZeebeJobResult.Complete,
      outputVariables: {
        applicationExceptionStatus: ApplicationExceptionStatus.Pending,
      },
    });
    // Validate DB changes expecting the study end date is past application exception.
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
          },
        },
      },
      relations: { applicationException: { exceptionRequests: true } },
      where: {
        id: savedApplication.id,
      },
    });
    expect(updatedApplication).toEqual({
      id: savedApplication.id,
      applicationException: {
        id: expect.any(Number),
        exceptionStatus: ApplicationExceptionStatus.Pending,
        exceptionRequests: [
          {
            id: expect.any(Number),
            exceptionName: "studyEndDateIsPastApplicationException",
            exceptionDescription: "Study end date is past",
          },
        ],
      },
    });
  });

  it("Should not create any application exception when there is no application exception in application data.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource, {
      offering: sharedOffering,
    });
    const verifyUniqueApplicationExceptionsPayload =
      createFakeVerifyUniqueApplicationExceptionsPayload(savedApplication.id);

    // Act
    const result =
      await applicationController.verifyUniqueApplicationExceptions(
        verifyUniqueApplicationExceptionsPayload,
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
        verifyUniqueApplicationExceptionsPayload,
      );

    // Assert
    // Validate job result.
    expect(result).toEqual({
      [FAKE_WORKER_JOB_RESULT_PROPERTY]: MockedZeebeJobResult.Error,
      [FAKE_WORKER_JOB_ERROR_MESSAGE_PROPERTY]: "Application ID not found.",
      [FAKE_WORKER_JOB_ERROR_CODE_PROPERTY]: APPLICATION_NOT_FOUND,
    });
  });

  it("Should return error when the application is not associated with an offering.", async () => {
    // Arrange
    // Create an application without offering.
    const savedApplication = await saveFakeApplication(
      db.dataSource,
      undefined,
      { pirStatus: ProgramInfoStatus.required },
    );
    const verifyUniqueApplicationExceptionsPayload =
      createFakeVerifyUniqueApplicationExceptionsPayload(savedApplication.id);

    // Act
    const result =
      await applicationController.verifyUniqueApplicationExceptions(
        verifyUniqueApplicationExceptionsPayload,
      );

    // Assert
    // Validate job result.
    expect(result).toEqual({
      [FAKE_WORKER_JOB_RESULT_PROPERTY]: MockedZeebeJobResult.Error,
      [FAKE_WORKER_JOB_ERROR_MESSAGE_PROPERTY]: `Application ${savedApplication.id} is not associated with an offering.`,
      [FAKE_WORKER_JOB_ERROR_CODE_PROPERTY]:
        INVALID_OPERATION_IN_THE_CURRENT_STATE,
    });
  });

  it("Should not create an application exception when there is already one for the application.", async () => {
    // Arrange
    const fakeApplication = await saveFakeApplication(db.dataSource, {
      offering: sharedOffering,
    });
    fakeApplication.data = {
      workflowName: "",
      test: {
        someApplicationException: { someExceptionData: "some data" },
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
        verifyUniqueApplicationExceptionsPayload,
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
