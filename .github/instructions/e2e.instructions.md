---
applyTo: "sources/packages/backend/apps/**/_tests_/**/*.e2e-spec.ts"
---

## E2E Testing Boilerplate

Every application consumer method must have a corresponding end-to-end (e2e) test to validate its behavior, including security, data transformations, and database interactions.

### Core Principles

- **Isolation**: Each test should be independent, setting up its own data and ensuring its data will not affect other tests.
- **Data Setup**: Use `saveFake...` helpers (e.g., `saveFakeStudent`, `saveFakeApplication`) to create a predictable state for each test.
- **Data Assertion**: Ensure that any changes to the database state are asserted after the action is performed.
- **Code Section**: Structure tests with clear Arrange, Act, and Assert sections for readability.
- **Data Manipulation**: Declare a global variable `db: E2EDataSources` and use it all DB related operations.

