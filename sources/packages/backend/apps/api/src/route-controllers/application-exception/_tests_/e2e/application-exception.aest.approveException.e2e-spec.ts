import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { ApplicationExceptionStatus } from "@sims/sims-db";
import { ClientTypeBaseRoute } from "../../../../types";
import * as faker from "faker";
import { createFakeApplicationWithApplicationException } from "../application-exception-helper";
import { TestingModule } from "@nestjs/testing";

describe(`${ClientTypeBaseRoute.AEST}-ApplicationExceptionAESTController(e2e)-getExceptionById`, () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let appModule: TestingModule;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    appModule = module;
  });

  it("Should be able to approve application exception when available.", async () => {
    // Arrange
    const application = await createFakeApplicationWithApplicationException(
      ApplicationExceptionStatus.Pending,
      appDataSource,
      appModule,
    );
    const updateApplicationException = {
      exceptionStatus: ApplicationExceptionStatus.Approved,
      noteDescription: faker.lorem.text(10),
    };

    // Act/Assert
    await request(app.getHttpServer())
      .patch(
        `/aest/application-exception/${application.applicationException.id}`,
      )
      .send(updateApplicationException)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK);
  });

  it("Should be able to decline application exception when available.", async () => {
    // Arrange
    const application = await createFakeApplicationWithApplicationException(
      ApplicationExceptionStatus.Pending,
      appDataSource,
      appModule,
    );
    const updateApplicationException = {
      exceptionStatus: ApplicationExceptionStatus.Declined,
      noteDescription: faker.lorem.text(10),
    };

    // Act/Assert
    await request(app.getHttpServer())
      .patch(
        `/aest/application-exception/${application.applicationException.id}`,
      )
      .send(updateApplicationException)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK);
  });

  it("Should get 'not found' status and message when the application exception is not available.", async () => {
    // Arrange
    const updateApplicationException = {
      exceptionStatus: ApplicationExceptionStatus.Approved,
      noteDescription: faker.lorem.text(10),
    };

    // Act/Assert
    await request(app.getHttpServer())
      .patch("/aest/application-exception/9999999")
      .send(updateApplicationException)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message: "Student application exception not found.",
        error: "Not Found",
      });
  });

  it("Should not be able to approve application exception when it is not in pending status.", async () => {
    // Arrange
    const application = await createFakeApplicationWithApplicationException(
      ApplicationExceptionStatus.Declined,
      appDataSource,
      appModule,
    );
    const updateApplicationException = {
      exceptionStatus: ApplicationExceptionStatus.Approved,
      noteDescription: faker.lorem.text(10),
    };

    // Act/Assert
    await request(app.getHttpServer())
      .patch(
        `/aest/application-exception/${application.applicationException.id}`,
      )
      .send(updateApplicationException)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: 422,
        message:
          "Student application exception must be in Pending state to be assessed.",
        error: "Unprocessable Entity",
      });
  });

  it("Should not be able to approve application exception when status passed is not `Approved` or `Declined`.", async () => {
    // Arrange
    const application = await createFakeApplicationWithApplicationException(
      ApplicationExceptionStatus.Declined,
      appDataSource,
      appModule,
    );
    const updateApplicationException = {
      exceptionStatus: "Anything",
      noteDescription: faker.lorem.text(10),
    };

    // Act/Assert
    await request(app.getHttpServer())
      .patch(
        `/aest/application-exception/${application.applicationException.id}`,
      )
      .send(updateApplicationException)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
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
    const application = await createFakeApplicationWithApplicationException(
      ApplicationExceptionStatus.Declined,
      appDataSource,
      appModule,
    );
    const updateApplicationException = {
      exceptionStatus: ApplicationExceptionStatus.Approved,
      noteDescription: "",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .patch(
        `/aest/application-exception/${application.applicationException.id}`,
      )
      .send(updateApplicationException)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
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
