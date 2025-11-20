---
applyTo: "sources/packages/backend/apps/api/src/route-controllers/**/*.controller.ts"
---

## GitHub Copilot Instructions: API Controller Patterns

This document provides instructions for generating NestJS controllers in the SIMS API. Adhering to these patterns is essential for security, consistency, and maintainability.

### General Principles

1. New endpoints must have corresponding e2e tests as per [E2E Instructions](./e2e.instructions.md). Ensure a review comment will remind to add these tests, if a file following the pattern [feature-name].[client-type].controller.[method-name].e2e-spec.ts is not found in the appropriate `_tests_/e2e` directory.
2.  **File Naming**: Controller files must follow the pattern `[feature-name].[client-type].controller.ts`, where the `client-type` should 
be one of the following described in [Client Types](../../copilot-instructions.md#client-types).
3.  **DTOs**: see [DTO Instructions](./dto.instructions.md) for specific patterns on using Input and Output DTOs in controllers.
4. All parameters received in controller methods must be properly validated using NestJS Pipes (e.g., `ParseIntPipe`, `ValidationPipe`, etc.), custom pipes, have DTOs with validation decorators, or a combination of these.
5. Avoid passing DTOs directly to services other than controllers services (services appended with `controller.service.ts`). Instead, map DTOs to domain models within the controller before passing them to service methods.
6.  **File Location**: Controllers are located in a directory named after the feature they represent.
    ```
    /route-controllers
    └── [feature-name]
        └── [feature-name].[client-type].controller.ts
    ```
7.  **API Documentation**: Use `@ApiTags` to group endpoints in the OpenAPI (Swagger) documentation. The tag should correspond to the client type (e.g., `aest`, `student`).

**Error Handling:**

1. Use try-catch blocks to handle exceptions in controller methods.
2. `error` should be defined as unknown in catch blocks, and proper type checking should be performed before accessing its properties.
3. Use specific HttpExceptions (e.g., `NotFoundException`, `BadRequestException`, `ForbiddenException`, `UnprocessableEntityException` etc.) to provide meaningful error responses to API consumers.
  - `NotFoundException` should be used when a requested resource is not found, which means, some of the elements in the URL path do not exist. For instance, a student ID provided in the URL does not correspond to any student in the system.
  - `BadRequestException` should be used when the request made by the client is invalid or malformed. This could be due to missing required parameters, invalid data formats, or failing validation rules defined in the DTOs. The DTOs for the body and query parameters should have proper validation decorators to ensure that incoming data adheres to expected formats and constraints (see [DTO Instructions](./dto.instructions.md)), but later validations may also fail, for instance, form.io dry run validations.
  - `ForbiddenException` should be used when the authenticated user does not have the necessary permissions to access a resource or perform an action. In general the access is already validated by guards and decorators, but there may be specific business rules that prevent access to certain resources.
  - `UnprocessableEntityException` should be used when the request is well-formed but cannot be processed due to semantic errors. This is often used when the request data is valid but violates business rules or constraints.
4. HttpExceptions should be thrown from controllers or controllers services only. Other layers (services, repositories) should throw custom exceptions that the controller layer can catch and translate into appropriate HttpExceptions.
5. Use custom `ApiProcessError` when the error needs to be typed for specific handling in the API consumer.

**Examples:**

```typescript
  try {
    // Do something that can throw an exception.
  } catch (error: unknown) {
    if (error instanceof ApiProcessError) {
      // Do something with the typed object.
      if (error.errorType === SOME_SPECIFIC_ERROR) {
        throw new UnprocessableEntityException("Specific error message");
      }
    }
    throw error;
  }
```

```typescript
  try {
    // Do something that can throw an exception.
  } catch (error: unknown) {
    if (error instanceof ApiProcessError) {
      // Do something with the typed object.
      throw new ForbiddenException(
        new ApiProcessError(
          "Some friendly message for the API consumer.",
          SOME_SPECIFIC_ERROR,
        ),
      );
    }
    throw error;
  }
```

---

### 1. AEST Controllers

These controllers are for endpoints accessible to Ministry users.

**Class Decorators:**
- @AllowAuthorizedParty(AuthorizedParties.aest)
- @Groups(UserGroups.AESTUser)
- @Controller("[feature-name]")
- @ApiTags(`${ClientTypeBaseRoute.AEST}-[feature-name]`)

**Endpoint Decorators:**
-   Use `@Groups` to restrict access to specific Ministry user groups (e.g., `@Groups(AESTGroups.BusinessAdministrators)`).
-   Use `@Get`, `@Post`, `@Patch`, etc., for the HTTP method.
-   Use `@UserToken()` to get the authenticated user's token payload.

**Example:**

```typescript
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("application")
@ApiTags(`${ClientTypeBaseRoute.AEST}-application`)
export class ApplicationAESTController extends BaseController {
  @Groups(AESTGroups.BusinessAdministrators)
  @Get(":applicationId")
  async getApplicationDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    // Controller logic here...
  }
}
```

---

### 2. Institution Controllers

These controllers are for endpoints accessible to institution users.

**Class Decorators:**
- @AllowAuthorizedParty(AuthorizedParties.institution)
- @IsBCPublicInstitution(), used only for controllers that need to restrict access to BC Public Institutions.
- @Controller("[feature-name]")
- @ApiTags(`${ClientTypeBaseRoute.Institution}-[feature-name]`)

**Endpoint Decorators:**
-   Use `@UserToken()` to get the authenticated `InstitutionUserToken`.

**Example:**

```typescript
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("user")
@ApiTags(`${ClientTypeBaseRoute.Institution}-user`)
export class UserInstitutionsController extends BaseController {
  @Get()
  async getUsers(
    @UserToken() userToken: InstitutionUserToken,
  ): Promise<void> {
    // Controller logic here...
  }
}
```

---

### 3. Student Controllers

These controllers are for endpoints accessible to students.

**Class Decorators:**
- @AllowAuthorizedParty(AuthorizedParties.student)
- @RequiresStudentAccount()
- @Controller("[feature-name]") 
- @ApiTags(`${ClientTypeBaseRoute.Student}-[feature-name]`)

**Endpoint Decorators:**
-   Use `@UserToken()` to get the authenticated `StudentUserToken`.

**Example:**

```typescript
@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("application")
@ApiTags(`${ClientTypeBaseRoute.Student}-application`)
export class ApplicationStudentsController {
 /**
   * Get application details by ID.
   * @param id for the application to be retrieved.
   * @returns application details.
   */
  @Get(":id")
  @ApiNotFoundResponse({
    description: "Application ID not found.",
  })
  async getByApplicationId(
    @Param("id", ParseIntPipe) applicationId: number,
    @UserToken() userToken: StudentUserToken,
  ): Promise<ApplicationDataAPIOutDTO> {
    // Controller logic here...
  }
}
```

---

### 4. Supporting User Controllers

These controllers are for endpoints accessible to supporting users (e.g., parents, partners).

**Class Decorators:**
- @AllowAuthorizedParty(AuthorizedParties.supportingUsers)
- @Controller("[feature-name]")
- @ApiTags(`${ClientTypeBaseRoute.SupportingUser}-[feature-name]`)

**Example:**

```typescript
@AllowAuthorizedParty(AuthorizedParties.supportingUsers)
@Controller("supporting-user")
@ApiTags(`${ClientTypeBaseRoute.SupportingUser}-supporting-user`)
export class SupportingUserSupportingUsersController extends BaseController {
  @Get()
  async getApplication(
    @UserToken() userToken: SupportingUserToken,
  ): Promise<void> {
    // Controller logic here...
  }
}
```

---

### 5. External Controllers

These controllers are for endpoints accessible by external systems (e.g., other government services) and are secured by an API key.

**Class Decorators:**
- @RequiresUserAccount(false)
- @AllowAuthorizedParty(AuthorizedParties.external)
- @Controller("[feature-name]")
- @ApiTags(`${ClientTypeBaseRoute.External}-[feature-name]`)

**Example:**

```typescript
@RequiresUserAccount(false)
@AllowAuthorizedParty(AuthorizedParties.external)
@Controller("student")
@ApiTags(`${ClientTypeBaseRoute.External}-student`)
export class StudentExternalController extends BaseController {
  @Get()
  async searchStudentDetails(): Promise<void> {
    // Controller logic here...
  }
}
```

