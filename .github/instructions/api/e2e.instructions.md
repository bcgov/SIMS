---
applyTo: "sources/packages/backend/apps/api/src/route-controllers/**/_tests_/**/*.e2e-spec.ts"
---

## GitHub Copilot PR Review: E2E Testing Patterns for the SIMS API

Every API endpoint must have a corresponding end-to-end (e2e) test to validate its behavior, including security, data transformations, and database interactions.

### File Naming and Location

- **Convention**: `[feature-name].[client-type].controller.[method-name].e2e-spec.ts`
- **Location**: Place test files in the `e2e` subdirectory under the `_tests_` subdirectory of the controller's feature folder.
  ```
  /route-controllers
  └── [feature-name]
      └── _tests_
          └── e2e
            └── [feature-name].[client-type].controller.[method-name].e2e-spec.ts
  ```

### Core Principles

- **Isolation**: Each test should be independent, setting up its own data and ensuring its data will not affect other tests.
- **Data Setup**: Use `saveFake...` helpers (e.g., `saveFakeStudent`, `saveFakeApplication`) to create a predictable state for each test.
- **Authentication**: Use `get...Token` helpers (e.g., `getAESTToken`) to simulate authenticated users.
- **Assertions**: Always validate the HTTP status code, the response body, and any changes to the database state.
- **Scenarios**: Test for both success and common failure cases (e.g., 403 Forbidden, 404 Not Found).
- **Code Section**: Structure tests with clear Arrange, Act, and Assert sections for readability.

### Boilerplate Code Example for Client Type AEST

Use this template as a starting point for new e2e tests for the AEST client type.

```typescript
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../testHelpers";
import { E2EDataSources, createE2EDataSources } from "@sims/test-utils";

describe("[feature-name]AESTController(e2e)-[endpoint-method-name]", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should [do something] when [conditions are met].", async () => {
    // Arrange
    const endpoint = "/some-endpoint/99999999";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Something was not found.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
```

### Boilerplate Code Example for Client Type Students

Use this template as a starting point for new e2e tests for the Student client type.

```typescript
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import { TestingModule } from "@nestjs/testing";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";

describe("[feature-name]StudentsController(e2e)-[endpoint-method-name]", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    resetMockJWTUserInfo(appModule);
  });

  it("Should [do something] when [conditions are met].", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Further data setup...
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, student.user);
    const endpoint = `/students/some-endpoint/student/${student.id}`;

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        propertyA: "valueA",
        propertyB: "valueB",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
```

### Boilerplate Code Example for Client Type Institutions

Use this template as a starting point for new e2e tests for the Institutions client type.

```typescript
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../testHelpers";
import {
  createE2EDataSources,
  createFakeInstitutionLocation,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { InstitutionLocation } from "@sims/sims-db";

describe("[feature-name]InstitutionsController(e2e)-[endpoint-method-name]", () => {
  let app: INestApplication;
  let collegeCLocation: InstitutionLocation;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    // College C. Institutions are part of the test DB seeding.
    // College C should not have its data changed to avoid impacting other tests.
    const { institution: collegeC } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    // Create a location for College C specifically for the tests.
    // This location is isolated to prevent interference with other tests.
    collegeCLocation = createFakeInstitutionLocation({ institution: collegeC });
    // Authorize the user to have access to the new location.
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
  });

  it("Should [do something] when [conditions are met].", async () => {
    // Arrange
    // Example of how to create an application for the location.
    const savedApplication = await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeCLocation,
    });
    const endpoint = `/institutions/application/some-endpoint/application/${savedApplication.id}`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        propertyA: "valueA",
        propertyB: "valueB",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
```