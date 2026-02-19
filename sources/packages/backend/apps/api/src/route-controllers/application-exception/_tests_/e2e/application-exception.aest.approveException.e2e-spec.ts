import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import {
  ApplicationException,
  ApplicationExceptionRequestStatus,
  ApplicationExceptionStatus,
  ApplicationStatus,
  NoteType,
} from "@sims/sims-db";
import { faker } from "@faker-js/faker";
import { saveFakeApplicationWithApplicationException } from "../application-exception-helper";
import {
  createE2EDataSources,
  createFakeApplicationException,
  createFakeApplicationExceptionRequest,
  createFakeUser,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";
import MockDate from "mockdate";

describe("ApplicationExceptionAESTController(e2e)-approveException", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let zbClient: ZeebeGrpcClient;
  let applicationExceptionRepo: Repository<ApplicationException>;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    zbClient = app.get(ZeebeGrpcClient);
    applicationExceptionRepo = dataSource.getRepository(ApplicationException);
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  it("Should approve the application exception when all the assessed exception requests are approved.", async () => {
    // Arrange
    const creator = await db.user.save(createFakeUser());
    const applicationException = createFakeApplicationException({ creator });
    // Create two exception requests in pending status.
    const exceptionRequests = Array.from({ length: 2 }, () =>
      createFakeApplicationExceptionRequest(
        {
          applicationException,
        },
        {
          initialData: {
            exceptionRequestStatus: ApplicationExceptionRequestStatus.Pending,
          },
        },
      ),
    );
    applicationException.exceptionRequests = exceptionRequests;
    await applicationExceptionRepo.save(applicationException);
    // Create an application with the application exception created.
    const application = await saveFakeApplication(appDataSource, {
      applicationException,
    });
    // Prepare the payload to approve all exception requests.
    const payload = {
      assessedExceptionRequests: exceptionRequests.map((request) => ({
        exceptionRequestId: request.id,
        exceptionRequestStatus: ApplicationExceptionRequestStatus.Approved,
      })),
      noteDescription: faker.lorem.words(10),
    };
    // Set a date to be used to verify the audit dates.
    const now = new Date();
    MockDate.set(now);
    const endpoint = `/aest/application-exception/${application.applicationException.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(zbClient.publishMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationKey: application.id.toString(),
        name: "application-exception-verified",
        variables: {
          applicationExceptionStatus: ApplicationExceptionStatus.Approved,
        },
      }),
    );
    // Verify the updated exception and exception requests status in the database.
    const updatedException = await applicationExceptionRepo.findOne({
      select: {
        id: true,
        exceptionStatus: true,
        assessedBy: { id: true },
        assessedDate: true,
        exceptionNote: { id: true, noteType: true, description: true },
        exceptionRequests: {
          id: true,
          exceptionRequestStatus: true,
          modifier: { id: true },
          updatedAt: true,
        },
      },
      relations: {
        assessedBy: true,
        exceptionNote: true,
        exceptionRequests: { modifier: true },
      },
      where: { id: applicationException.id },
      order: { exceptionRequests: { id: "ASC" } },
      loadEagerRelations: false,
    });
    // Approving ministry user.
    const ministryUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    const [exceptionRequest1, exceptionRequest2] = exceptionRequests;
    expect(updatedException).toEqual({
      id: applicationException.id,
      exceptionStatus: ApplicationExceptionStatus.Approved,
      assessedBy: { id: ministryUser.id },
      assessedDate: now,
      exceptionNote: {
        id: expect.any(Number),
        noteType: NoteType.Application,
        description: payload.noteDescription,
      },
      exceptionRequests: [
        {
          id: exceptionRequest1.id,
          exceptionRequestStatus: ApplicationExceptionRequestStatus.Approved,
          modifier: { id: ministryUser.id },
          updatedAt: now,
        },
        {
          id: exceptionRequest2.id,
          exceptionRequestStatus: ApplicationExceptionRequestStatus.Approved,
          modifier: { id: ministryUser.id },
          updatedAt: now,
        },
      ],
    });
  });

  it("Should decline the application exception when one or more assessed exception requests are declined.", async () => {
    // Arrange
    const creator = await db.user.save(createFakeUser());
    const applicationException = createFakeApplicationException({ creator });
    // Create two exception requests in pending status.
    const exceptionRequests = Array.from({ length: 2 }, () =>
      createFakeApplicationExceptionRequest(
        {
          applicationException,
        },
        {
          initialData: {
            exceptionRequestStatus: ApplicationExceptionRequestStatus.Pending,
          },
        },
      ),
    );
    applicationException.exceptionRequests = exceptionRequests;
    await applicationExceptionRepo.save(applicationException);
    // Create an application with the application exception created.
    const application = await saveFakeApplication(appDataSource, {
      applicationException,
    });
    const [exceptionRequest1, exceptionRequest2] = exceptionRequests;
    // Prepare the payload to decline one of the exception requests.
    const payload = {
      assessedExceptionRequests: [
        {
          exceptionRequestId: exceptionRequest1.id,
          exceptionRequestStatus: ApplicationExceptionRequestStatus.Approved,
        },
        {
          exceptionRequestId: exceptionRequest2.id,
          exceptionRequestStatus: ApplicationExceptionRequestStatus.Declined,
        },
      ],
      noteDescription: faker.lorem.words(10),
    };
    // Set a date to be used to verify the audit dates.
    const now = new Date();
    MockDate.set(now);
    const endpoint = `/aest/application-exception/${application.applicationException.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(zbClient.publishMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationKey: application.id.toString(),
        name: "application-exception-verified",
        variables: {
          applicationExceptionStatus: ApplicationExceptionStatus.Declined,
        },
      }),
    );
    // Verify the updated exception and exception requests status in the database.
    const updatedException = await applicationExceptionRepo.findOne({
      select: {
        id: true,
        exceptionStatus: true,
        assessedBy: { id: true },
        assessedDate: true,
        exceptionNote: { id: true, noteType: true, description: true },
        exceptionRequests: {
          id: true,
          exceptionRequestStatus: true,
          modifier: { id: true },
          updatedAt: true,
        },
      },
      relations: {
        assessedBy: true,
        exceptionNote: true,
        exceptionRequests: { modifier: true },
      },
      where: { id: applicationException.id },
      order: { exceptionRequests: { id: "ASC" } },
      loadEagerRelations: false,
    });
    // Approving ministry user.
    const ministryUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    expect(updatedException).toEqual({
      id: applicationException.id,
      exceptionStatus: ApplicationExceptionStatus.Declined,
      assessedBy: { id: ministryUser.id },
      assessedDate: now,
      exceptionNote: {
        id: expect.any(Number),
        noteType: NoteType.Application,
        description: payload.noteDescription,
      },
      exceptionRequests: [
        {
          id: exceptionRequest1.id,
          exceptionRequestStatus: ApplicationExceptionRequestStatus.Approved,
          modifier: { id: ministryUser.id },
          updatedAt: now,
        },
        {
          id: exceptionRequest2.id,
          exceptionRequestStatus: ApplicationExceptionRequestStatus.Declined,
          modifier: { id: ministryUser.id },
          updatedAt: now,
        },
      ],
    });
  });

  it("Should throw not found error when the application exception is not available.", async () => {
    // Arrange
    const payload = {
      assessedExceptionRequests: [
        {
          exceptionRequestId: 1,
          exceptionRequestStatus: ApplicationExceptionRequestStatus.Approved,
        },
      ],
      noteDescription: faker.lorem.words(10),
    };
    const endpoint = "/aest/application-exception/9999999";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Student application exception not found.",
        error: "Not Found",
      });
  });

  it(`Should throw unprocessable entity error when the application exception is not in ${ApplicationExceptionStatus.Pending} status.`, async () => {
    // Arrange
    const application = await saveFakeApplicationWithApplicationException(
      appDataSource,
      undefined,
      { applicationExceptionStatus: ApplicationExceptionStatus.Declined },
    );
    const [exceptionRequest] =
      application.applicationException.exceptionRequests;
    const payload = {
      assessedExceptionRequests: [
        {
          exceptionRequestId: exceptionRequest.id,
          exceptionRequestStatus: ApplicationExceptionRequestStatus.Declined,
        },
      ],
      noteDescription: faker.lorem.words(10),
    };
    const endpoint = `/aest/application-exception/${application.applicationException.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message:
          "Student application exception must be in Pending state to be assessed.",
        error: "Unprocessable Entity",
      });
  });

  it(
    "Should throw unprocessable entity error when the assessed exception requests in the payload" +
      " does not contain all the pending exception requests available in the application exception.",
    async () => {
      // Arrange
      const creator = await db.user.save(createFakeUser());
      const applicationException = createFakeApplicationException({ creator });
      // Create two exception requests in pending status.
      const exceptionRequests = Array.from({ length: 2 }, () =>
        createFakeApplicationExceptionRequest(
          {
            applicationException,
          },
          {
            initialData: {
              exceptionRequestStatus: ApplicationExceptionRequestStatus.Pending,
            },
          },
        ),
      );
      applicationException.exceptionRequests = exceptionRequests;
      await applicationExceptionRepo.save(applicationException);
      // Create an application with the application exception created.
      const application = await saveFakeApplication(appDataSource, {
        applicationException,
      });
      // Prepare the payload to approve only one of the exception requests.
      const [firstExceptionRequest] =
        application.applicationException.exceptionRequests;
      const payload = {
        assessedExceptionRequests: [
          {
            exceptionRequestId: firstExceptionRequest.id,
            exceptionRequestStatus: ApplicationExceptionRequestStatus.Approved,
          },
        ],
        noteDescription: faker.lorem.words(10),
      };
      const endpoint = `/aest/application-exception/${application.applicationException.id}`;
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: `The exception requests to be updated does not match all the pending exception requests for the student application exception ${application.applicationException.id}.`,
          error: "Unprocessable Entity",
        });
    },
  );

  it(
    "Should throw unprocessable entity error when the assessed exception requests in the payload" +
      " includes previously approved exception request(s) available in the application exception.",
    async () => {
      // Arrange
      // Create a parent application with parent application exception that was previously approved.
      const parentCreator = await db.user.save(createFakeUser());
      const parentApplicationException = createFakeApplicationException({
        creator: parentCreator,
      });
      const parentExceptionRequest = createFakeApplicationExceptionRequest(
        {
          applicationException: parentApplicationException,
        },
        {
          initialData: {
            exceptionRequestStatus: ApplicationExceptionRequestStatus.Approved,
          },
        },
      );
      parentApplicationException.exceptionRequests = [parentExceptionRequest];
      parentApplicationException.exceptionStatus =
        ApplicationExceptionStatus.Approved;
      await applicationExceptionRepo.save(parentApplicationException);
      const parentApplication = await saveFakeApplication(appDataSource, {
        applicationException: parentApplicationException,
      });
      const creator = await db.user.save(createFakeUser());
      const applicationException = createFakeApplicationException({ creator });
      // Create two exception requests in pending status.
      const exceptionRequests = Array.from({ length: 2 }, () =>
        createFakeApplicationExceptionRequest(
          {
            applicationException,
          },
          {
            initialData: {
              exceptionRequestStatus: ApplicationExceptionRequestStatus.Pending,
            },
          },
        ),
      );
      // Create one exception request that was previously approved in the parent application exception.
      exceptionRequests.push(
        createFakeApplicationExceptionRequest(
          {
            applicationException,
          },
          {
            initialData: {
              approvalExceptionRequest: parentExceptionRequest,
              exceptionRequestStatus:
                ApplicationExceptionRequestStatus.Approved,
            },
          },
        ),
      );
      applicationException.exceptionRequests = exceptionRequests;
      await applicationExceptionRepo.save(applicationException);
      // Create an application with the application exception created.
      const application = await saveFakeApplication(appDataSource, {
        parentApplication,
        applicationException,
      });
      // Prepare the payload to approve all the exception requests including the one that was previously approved.
      const payload = {
        assessedExceptionRequests: exceptionRequests.map((request) => ({
          exceptionRequestId: request.id,
          exceptionRequestStatus: ApplicationExceptionRequestStatus.Approved,
        })),
        noteDescription: faker.lorem.words(10),
      };
      const endpoint = `/aest/application-exception/${application.applicationException.id}`;
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: `The exception requests to be updated does not match all the pending exception requests for the student application exception ${application.applicationException.id}.`,
          error: "Unprocessable Entity",
        });
    },
  );

  it(`Should throw not found error when the application has ${ApplicationStatus.Edited} and exception is in ${ApplicationExceptionStatus.Pending} status.`, async () => {
    // Arrange
    const application = await saveFakeApplicationWithApplicationException(
      appDataSource,
      undefined,
      { applicationExceptionStatus: ApplicationExceptionStatus.Pending },
    );
    application.applicationStatus = ApplicationStatus.Edited;
    const [exceptionRequest] =
      application.applicationException.exceptionRequests;
    await db.application.save(application);
    const payload = {
      assessedExceptionRequests: [
        {
          exceptionRequestId: exceptionRequest.id,
          exceptionRequestStatus: ApplicationExceptionRequestStatus.Declined,
        },
      ],
      noteDescription: faker.lorem.words(10),
    };
    const endpoint = `/aest/application-exception/${application.applicationException.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Student application exception not found.",
        error: "Not Found",
      });
  });

  it("Should throw bad request error when the payload has one or more assessed exception request with invalid exception request status.", async () => {
    // Arrange
    const payload = {
      assessedExceptionRequests: [
        {
          exceptionRequestId: 1,
          // Pending is an invalid status for assessing an exception request.
          exceptionRequestStatus: ApplicationExceptionRequestStatus.Pending,
        },
      ],
      noteDescription: faker.lorem.words(10),
    };
    const endpoint = "/aest/application-exception/1";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [
          "assessedExceptionRequests.0.exceptionRequestStatus must be one of the following values: Approved, Declined",
        ],
        error: "Bad Request",
      });
  });

  it("Should throw bad request error when payload has empty note description.", async () => {
    // Arrange
    const payload = {
      assessedExceptionRequests: [
        {
          exceptionRequestId: 1,
          exceptionRequestStatus: ApplicationExceptionRequestStatus.Approved,
        },
      ],
      noteDescription: "",
    };
    const endpoint = "/aest/application-exception/1";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ["noteDescription should not be empty"],
        error: "Bad Request",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
