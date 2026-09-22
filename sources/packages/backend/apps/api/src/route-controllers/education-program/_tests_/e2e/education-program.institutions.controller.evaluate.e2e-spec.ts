import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import { ProgramCalculatedDataKey } from "../../../../services/education-program/education-program.service.models";
import request from "supertest";

describe("EducationProgramInstitutionsController(e2e)-evaluate", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { nestApplication } = await createTestingAppModule();
    app = nestApplication;
  });

  it("Should return the calculated data for provided calculated data keys when evaluation data is complete.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const payload = {
      calculatedDataKeys: [ProgramCalculatedDataKey.FieldOfStudyCode],
      data: {
        credentialType: "undergraduateDegree",
        cipCode: "11.0101",
      },
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect(({ body }) =>
        expect(body).toEqual({
          calculatedData: {
            [ProgramCalculatedDataKey.FieldOfStudyCode]: 30,
          },
        }),
      );
  });

  it("Should return calculated data with field of study code as default value when respective calculated data key is provided and evaluation data is incomplete.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const payload = {
      calculatedDataKeys: [ProgramCalculatedDataKey.FieldOfStudyCode],
      data: { credentialType: "undergraduateDegree" },
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect(({ body }) =>
        expect(body).toEqual({
          calculatedData: {
            [ProgramCalculatedDataKey.FieldOfStudyCode]: 20,
          },
        }),
      );
  });

  it("Should throw bad request error when calculated data key is invalid.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const payload = {
      calculatedDataKeys: ["unsupportedKey"],
      data: {},
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          "each value in calculatedDataKeys must be one of the following values: fieldOfStudyCode",
        ],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should throw forbidden error when the user is read-only.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeEReadOnlyUser,
    );
    const payload = {
      calculatedDataKeys: [ProgramCalculatedDataKey.FieldOfStudyCode],
      data: {},
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "You are not authorized to create or modify a program.",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Get the endpoint URL for evaluating an education program.
 * @returns The endpoint URL for evaluating an education program.
 */
function getEndpoint(): string {
  return "/institutions/education-program/evaluate";
}
