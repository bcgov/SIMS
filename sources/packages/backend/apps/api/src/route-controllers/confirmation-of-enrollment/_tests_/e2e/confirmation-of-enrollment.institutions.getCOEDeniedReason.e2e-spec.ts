import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import { OfferingIntensity } from "@sims/sims-db";

const COE_COMMON_DENIAL_REASONS = [
  {
    value: 6,
    label:
      "Our records indicate you are not registered, please re-submit the application after registration",
  },
  {
    value: 5,
    label:
      "Programs you are registered in is not eligible for Student Aid BC funding, please contact Financial Aid Office for more information",
  },
  {
    value: 4,
    label:
      "Study period dates are incorrect, please contact Financial Aid Office for more information",
  },
  {
    value: 3,
    label:
      "Study period dates selected are incorrect, please submit an application for each semester individually",
  },
  {
    value: 2,
    label:
      "School is unable to confirm student identity, please confirm your student number or contact Financial Student Aid Office for more information",
  },
  { value: 1, label: "Other" },
];

describe("ConfirmationOfEnrollmentInstitutionsController(e2e)-getCOEDeniedReason", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { nestApplication } = await createTestingAppModule();
    app = nestApplication;
  });

  it("Should get COE denial reasons list when part-time intensity is provided.", async () => {
    // Arrange
    const userToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );
    const endpoint = `/institutions/location/confirmation-of-enrollment/denial-reasons?offeringIntensity=${OfferingIntensity.partTime}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(userToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toStrictEqual([
          {
            value: 7,
            label:
              "You are currently enrolled as a full-time student. Please cancel your part-time application and reapply using the full-time application process",
          },
          ...COE_COMMON_DENIAL_REASONS,
        ]);
      });
  });

  it("Should get COE denial reasons list when full-time intensity is provided.", async () => {
    // Arrange
    const userToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );
    const endpoint = `/institutions/location/confirmation-of-enrollment/denial-reasons?offeringIntensity=${OfferingIntensity.fullTime}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(userToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toStrictEqual([
          {
            value: 8,
            label:
              "You are currently enrolled as a part-time student. Please cancel your full-time application and reapply using the part-time application process",
          },
          ...COE_COMMON_DENIAL_REASONS,
        ]);
      });
  });

  it("Should throw a bad request error when no offering intensity is provided.", async () => {
    // Arrange
    const userToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );
    const endpoint =
      "/institutions/location/confirmation-of-enrollment/denial-reasons";

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(userToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: "Validation failed (enum string is expected)",
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should throw a bad request error when an invalid offering intensity is provided.", async () => {
    // Arrange
    const userToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );
    const endpoint =
      "/institutions/location/confirmation-of-enrollment/denial-reasons?offeringIntensity=notValidIntensity";

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(userToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: "Validation failed (enum string is expected)",
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
