import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  ApplicationException,
  ApplicationExceptionStatus,
  ApplicationStatus,
} from "@sims/sims-db";
import * as faker from "faker";
import { saveFakeApplicationWithApplicationException } from "../application-exception-helper";
import { createE2EDataSources, E2EDataSources } from "@sims/test-utils";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";

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

  it("Should be able to approve application exception when its status is pending.", async () => {
    // Arrange
    const application = await saveFakeApplicationWithApplicationException(
      appDataSource,
      undefined,
      { applicationExceptionStatus: ApplicationExceptionStatus.Pending },
    );
    const updateApplicationException = {
      exceptionStatus: ApplicationExceptionStatus.Approved,
      noteDescription: faker.lorem.text(10),
    };
    const endpoint = `/aest/application-exception/${application.applicationException.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(updateApplicationException)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(zbClient.publishMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationKey: application.id.toString(),
        name: "application-exception-verified",
        variables: {
          applicationExceptionStatus: "Approved",
        },
      }),
    );

    const applicationException = await applicationExceptionRepo.findOneBy({
      id: application.applicationException.id,
    });
    expect(applicationException.exceptionStatus).toBe(
      ApplicationExceptionStatus.Approved,
    );
  });

  it("Should be able to decline application exception when available.", async () => {
    // Arrange
    const application = await saveFakeApplicationWithApplicationException(
      appDataSource,
      undefined,
      { applicationExceptionStatus: ApplicationExceptionStatus.Pending },
    );
    const updateApplicationException = {
      exceptionStatus: ApplicationExceptionStatus.Declined,
      noteDescription: faker.lorem.text(10),
    };
    const endpoint = `/aest/application-exception/${application.applicationException.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(updateApplicationException)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(zbClient.publishMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationKey: application.id.toString(),
        name: "application-exception-verified",
        variables: {
          applicationExceptionStatus: "Declined",
        },
      }),
    );

    const applicationException = await applicationExceptionRepo.findOneBy({
      id: application.applicationException.id,
    });
    expect(applicationException.exceptionStatus).toBe(
      ApplicationExceptionStatus.Declined,
    );
  });

  it("Should get 'not found' status and message when the application exception is not available.", async () => {
    // Arrange
    const updateApplicationException = {
      exceptionStatus: ApplicationExceptionStatus.Approved,
      noteDescription: faker.lorem.text(10),
    };
    const endpoint = "/aest/application-exception/9999999";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(updateApplicationException)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message: "Student application exception not found.",
        error: "Not Found",
      });
  });

  it("Should not be able to approve application exception when it is not in pending status.", async () => {
    // Arrange
    const application = await saveFakeApplicationWithApplicationException(
      appDataSource,
      undefined,
      { applicationExceptionStatus: ApplicationExceptionStatus.Declined },
    );
    const updateApplicationException = {
      exceptionStatus: ApplicationExceptionStatus.Approved,
      noteDescription: faker.lorem.text(10),
    };
    const endpoint = `/aest/application-exception/${application.applicationException.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(updateApplicationException)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: 422,
        message:
          "Student application exception must be in Pending state to be assessed.",
        error: "Unprocessable Entity",
      });
  });

  it(`Should not be able to approve application exception when the application has ${ApplicationStatus.Overwritten} and exception is in ${ApplicationExceptionStatus.Pending} status.`, async () => {
    // Arrange
    const application = await saveFakeApplicationWithApplicationException(
      appDataSource,
      undefined,
      { applicationExceptionStatus: ApplicationExceptionStatus.Pending },
    );
    application.applicationStatus = ApplicationStatus.Overwritten;
    await db.application.save(application);
    const updateApplicationException = {
      exceptionStatus: ApplicationExceptionStatus.Approved,
      noteDescription: faker.lorem.text(10),
    };
    const endpoint = `/aest/application-exception/${application.applicationException.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(updateApplicationException)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Student application exception not found.",
        error: "Not Found",
      });
  });

  it("Should not be able to approve application exception when status passed is not a valid application exception status.", async () => {
    // Arrange
    const updateApplicationException = {
      exceptionStatus: ApplicationExceptionStatus.Pending,
      noteDescription: faker.lorem.text(10),
    };
    const endpoint = "/aest/application-exception/1";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(updateApplicationException)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: 400,
        message: [
          "exceptionStatus must be one of the following values: Approved, Declined",
        ],
        error: "Bad Request",
      });
  });

  it("Should not be able to approve application exception when note is empty.", async () => {
    // Arrange
    const updateApplicationException = {
      exceptionStatus: ApplicationExceptionStatus.Approved,
      noteDescription: "",
    };
    const endpoint = "/aest/application-exception/1";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(updateApplicationException)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: 400,
        message: ["noteDescription should not be empty"],
        error: "Bad Request",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
