import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeStudentDisabilityProfile,
} from "@sims/test-utils";
import { DisabilityProfileStatus, User } from "@sims/sims-db";
import { createExpectedProfile } from "./disability-profile-utils";

describe("DisabilityProfileAESTController(e2e)-getStudentDisabilityProfile", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let ministryUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    ministryUser = await getAESTUser(
      dataSource,
      AESTGroups.BusinessAdministrators,
    );
  });

  Object.values(DisabilityProfileStatus).forEach((status) => {
    it(`Should get a disability profile with status ${status} when there is a disability profile with that status available.`, async () => {
      // Arrange
      const now = new Date();
      const profile = await saveFakeStudentDisabilityProfile(db, {
        ministryUser,
        disabilityProfileStatus: status,
        now,
      });
      const endpoint = `/aest/disability-profile/${profile.id}`;
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect(({ body }) =>
          expect(body).toEqual(createExpectedProfile(profile)),
        );
    });
  });

  it("Should throw a not found error when the disability profile does not exist.", async () => {
    // Arrange
    const nonExistentDisabilityProfileId = 999999;
    const endpoint = `/aest/disability-profile/${nonExistentDisabilityProfileId}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Disability profile with ID ${nonExistentDisabilityProfileId} not found.`,
        error: "Not Found",
      });
  });

  it("Should throw a forbidden error when the user does not have permission.", async () => {
    // Arrange
    const nonExistentDisabilityProfileId = 999999;
    const endpoint = `/aest/disability-profile/${nonExistentDisabilityProfileId}`;
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "Forbidden resource",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
