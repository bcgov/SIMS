import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import { createFakeInstitutionLocation } from "@sims/test-utils";

describe("ConfirmationOfEnrollmentInstitutionsController(e2e)-getApplicationForCOE", () => {
  let app: INestApplication;
  let appDataSource: DataSource;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
  });

  it("Should throw NotFoundException when COE was not found under the location", async () => {
    // Arrange
    const disbursementScheduleId = 9999;
    const location = createFakeInstitutionLocation();
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      location,
    );
    const endpoint = `/institutions/location/${location.id}/confirmation-of-enrollment/disbursement-schedule/${disbursementScheduleId}`;
    // Act/Assert
    return request(app.getHttpServer())
      .get(endpoint)
      .auth(
        await getInstitutionToken(InstitutionTokenTypes.CollegeCUser),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message:
          "Confirmation of enrollment not found or application status not valid.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
