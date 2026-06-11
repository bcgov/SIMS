import { HttpStatus, INestApplication } from "@nestjs/common";
import { LessThanOrEqual } from "typeorm";
import { DisabilityProfileStatus, User } from "@sims/sims-db";
import MockDate from "mockdate";
import { addDays } from "@sims/utilities";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getExternalUserToken,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeUser,
  DisabilityCategories,
  DisabilityImpairments,
  DisabilityTypes,
  E2EDataSources,
  saveFakeStudent,
  saveFakeStudentDisabilityProfile,
} from "@sims/test-utils";
import { DISABILITY_PROFILES_MODIFIED_SINCE_MAX_DAYS } from "../../../../utilities";
import request = require("supertest");

describe("DisabilityProfileExternalController(e2e)-getAllDisabilityProfiles", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let user: User;
  // Reference date to be used as current date to avoid conflicts with other tests.
  const now = new Date("2024-01-01");

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    user = await db.user.save(createFakeUser());
  });

  beforeEach(async () => {
    MockDate.reset();
    await db.studentDisabilityProfile.update(
      {
        completedAt: LessThanOrEqual(now),
      },
      { completedAt: new Date() },
    );
  });

  it(
    "Should return all active student disability profiles when the profile is created or edited since" +
      " the given modifiedSince date and the student has a valid SIN.",
    async () => {
      // Arrange
      const modifiedSince = addDays(-5, now);
      // Date within modified since and now.
      const dateWithinRange = addDays(-3, now);
      // Date outside before modified since.
      const dateBeforeModifiedSince = addDays(-1, modifiedSince);
      const student = await saveFakeStudent(db.dataSource, undefined, {
        includeAddressLine2: true,
      });
      const [priority1DisabilityValues, priority2DisabilityValues] = [
        {
          disabilityCategory: DisabilityCategories.Other,
          disabilityType: DisabilityTypes.PersistentOrProlonged,
          disabilityNotes: "Primary disability notes.",
          diagnosis: ["Primary disability diagnosis."],
          diagnosisNotes: "Primary diagnosis notes.",
          impairments: [DisabilityImpairments.FollowingInstructions],
          impairmentsNotes: "Primary impairments notes.",
          finalNotes: "Primary final notes.",
        },
        {
          disabilityCategory: DisabilityCategories.LearningDisability,
          disabilityType: DisabilityTypes.Permanent,
          disabilityNotes: "Secondary disability notes.",
          diagnosis: ["Secondary disability diagnosis."],
          diagnosisNotes: "Secondary diagnosis notes.",
          impairments: [DisabilityImpairments.FollowingInstructions],
          impairmentsNotes: "Secondary impairments notes.",
          finalNotes: "Secondary final notes.",
        },
      ];
      // Profile within range that should be returned.
      await saveFakeStudentDisabilityProfile(db, {
        student,
        ministryUser: user,
        disabilityProfileStatus: DisabilityProfileStatus.Active,
        disabilitiesInitialValues: [
          {
            ...priority1DisabilityValues,
            disabilityPriority: 1,
          },
          { ...priority2DisabilityValues, disabilityPriority: 2 },
        ],
        completedAt: dateWithinRange,
      });
      // Profile created before modifiedSince that should not be returned.
      await saveFakeStudentDisabilityProfile(db, {
        ministryUser: user,
        disabilityProfileStatus: DisabilityProfileStatus.Active,
        completedAt: dateBeforeModifiedSince,
      });
      // Draft profile within range that should not be returned.
      await saveFakeStudentDisabilityProfile(db, {
        ministryUser: user,
        disabilityProfileStatus: DisabilityProfileStatus.Draft,
      });
      const token = await getExternalUserToken();
      MockDate.set(now);

      // Act
      await request(app.getHttpServer())
        .get(getEndpoint(modifiedSince))
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect(({ body }) =>
          expect(body).toStrictEqual({
            profiles: [
              {
                firstName: student.user.firstName,
                lastName: student.user.lastName,
                sin: student.sinValidation.sin,
                address: {
                  addressLine1: student.contactInfo.address.addressLine1,
                  addressLine2: student.contactInfo.address.addressLine2,
                  city: student.contactInfo.address.city,
                  provinceState: student.contactInfo.address.provinceState,
                  country: student.contactInfo.address.country,
                  postalCode: student.contactInfo.address.postalCode,
                },
                disabilities: [
                  priority1DisabilityValues,
                  priority2DisabilityValues,
                ],
              },
            ],
            metadata: { modifiedUntil: now.toISOString() },
          }),
        );
    },
  );

  it("Should throw a bad request error when the modifiedSince query parameter is missing.", async () => {
    // Arrange
    const token = await getExternalUserToken();

    // Act
    await request(app.getHttpServer())
      .get(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          "modifiedSince must be a valid ISO 8601 date string",
          "modifiedSince should not be empty",
        ],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it(
    "Should throw a bad request error when the modifiedSince query parameter is not within" +
      ` the last ${DISABILITY_PROFILES_MODIFIED_SINCE_MAX_DAYS} days.`,
    async () => {
      // Arrange
      const token = await getExternalUserToken();
      const modifiedSince = addDays(
        -DISABILITY_PROFILES_MODIFIED_SINCE_MAX_DAYS - 1,
        now,
      );
      MockDate.set(now);

      // Act
      await request(app.getHttpServer())
        .get(getEndpoint(modifiedSince))
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message:
            "Modified since must be a date within the last 180 days and not in the future or current timestamp.",
          error: "Bad Request",
          statusCode: HttpStatus.BAD_REQUEST,
        });
    },
  );

  afterAll(async () => {
    MockDate.reset();
    await app?.close();
  });
});

/**
 * Get the endpoint with the modifiedSince query parameter.
 * @param modifiedSince modifiedSince date to be included in the query parameter.
 * @returns endpoint with the modifiedSince query parameter.
 */
function getEndpoint(modifiedSince?: Date): string {
  const baseEndpoint = "/external/disability-profile";
  if (!modifiedSince) {
    return baseEndpoint;
  }
  return `${baseEndpoint}?modifiedSince=${encodeURIComponent(modifiedSince.toISOString())}`;
}
