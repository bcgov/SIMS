---
applyTo: "sources/packages/backend/apps/api/src/route-controllers/**/_tests_/**/*.e2e-spec.ts"
---

## E2E Testing Boilerplate

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

describe("ApplicationAESTController(e2e)-getCompletedApplicationDetails", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should [do something] when [conditions are met].", async () => {
    // Arrange
    const endpoint = "/aest/application/99999999/completed";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Application not found or not on Completed status.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
```
