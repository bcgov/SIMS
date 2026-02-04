import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeSystemLookupConfiguration,
  createFakeUser,
  E2EDataSources,
} from "@sims/test-utils";
import { SystemLookupCategory, User } from "@sims/sims-db";

import { SystemLookupConfigurationService } from "@sims/services/system-lookup-configuration";
import { Like } from "typeorm";

describe("SystemLookupConfigurationController(e2e)-getSystemLookupEntriesByCategory", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let auditUser: User;
  let systemLookupConfigurationService: SystemLookupConfigurationService;
  const TEST_LOOKUP_KEY_PREFIX = "TEST_";

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    app = nestApplication;
    auditUser = await db.user.save(createFakeUser());
    systemLookupConfigurationService = app.get(
      SystemLookupConfigurationService,
    );
  });
  beforeEach(async () => {
    // Clean up the system lookup configuration test entries before each test.
    await db.systemLookupConfiguration.delete({
      lookupKey: Like(`${TEST_LOOKUP_KEY_PREFIX}%`),
    });
  });

  it("Should get the system lookup test entries for the category country when one or more test entries exist for the same category.", async () => {
    // Arrange
    // Create test system lookup entries for country.
    const [testCountryLookup1, testCountryLookup2] = Array.from({
      length: 2,
    }).map((_, index) =>
      createFakeSystemLookupConfiguration(
        {
          auditUser,
        },
        {
          initialValues: {
            lookupCategory: SystemLookupCategory.Country,
            lookupKey: `${TEST_LOOKUP_KEY_PREFIX}CN${index + 1}`,
            lookupValue: `Test Country${index + 1}`,
          },
        },
      ),
    );
    await db.systemLookupConfiguration.save([
      testCountryLookup1,
      testCountryLookup2,
    ]);
    // Reload the system lookup configurations to have the newly created entries.
    await systemLookupConfigurationService.loadAllSystemLookupConfigurations();
    const endpoint = `/system-lookup-configuration/lookup-category/${SystemLookupCategory.Country}`;
    const userToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(userToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body.items).toEqual(
          expect.arrayContaining([
            {
              lookupKey: testCountryLookup1.lookupKey,
              lookupValue: testCountryLookup1.lookupValue,
            },
            {
              lookupKey: testCountryLookup2.lookupKey,
              lookupValue: testCountryLookup2.lookupValue,
            },
          ]),
        );
      });
  });

  it("Should throw bad error when the lookup category is invalid.", async () => {
    // Arrange
    const endpoint =
      "/system-lookup-configuration/lookup-category/some-invalid-category";
    const userToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );
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
