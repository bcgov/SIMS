---
applyTo: "sources/packages/backend/apps/api/src/route-controllers/**/*.dto.ts"
---

# API DTO Patterns for the SIMS API

This document outlines the established patterns for creating Data Transfer Objects (DTOs) in the SIMS NestJS backend. Following these conventions is crucial for maintaining consistency and ensuring proper validation.

### General Principles

1.  **Class-Based**: All DTOs **must** be TypeScript `class` exports.
2.  **File Location**: All DTOs for a specific feature are grouped into a single file located by feature name.
    ```
    /route-controllers
    └── [feature-name]
        └── models
            └── [feature-name].dto.ts
    ```
3. DTOs are placed on files with the suffix dto.ts; no other suffixes are used.
4. The DTO names should be kept the same when mapped on the client application.
5. All data returned from the API should be mapped to a DTO and then returned. Do not expose data in the API directly from Business Services Layer or Repository Layer;
6. All DTOs must be defined as classes to allow the Swagger documentation to be generated with the automatically out-of-box features as much as possible;
---

### 1. Input DTOs (for `@Body` and `@Query`)

These DTOs define the contract and validation rules for incoming data.

**Naming Convention:**
- **Class:** `[Action][Subject]APIInDTO` (e.g., `CreateApplicationAPIInDTO`, `SaveApplicationAPIInDTO`, `AppealRequestAPIInDTO`, `StudentApplicationAppealAPIInDTO`, etc.).

**Pattern:**
- Use `class-validator` decorators (`@IsOptional`, `@IsPositive`, `@IsEnum`, etc.) for all properties to enforce validation.
- Use custom validation decorators like `@JsonMaxSize`, and `IsValidSIN` where applicable, or create new ones if required.
- When data received in a DTO will later be validated by a form.io dry run, the validators must be present and execute as much validation as possible at this stage.
- Child DTOs should also follow the same input DTO conventions.

**Example:**

```typescript
// Generic DTO example.
export class MySampleClassAPIInDTO {
  @IsPositive()
  id: number;
  @IsDate()
  myPropertyOne: Date;
  @IsOptional()
  myPropertyTwo: string;
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MyNestedObject)
  someArray: MyNestedObject[];
}
```

```typescript
// DTO with a nested DTO example.
export class StudentApplicationAppealAPIInDTO {
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ApplicationAppealRequestAPIInDTO)
  studentAppealRequests: ApplicationAppealRequestAPIInDTO[];
}

export class StudentAppealRequestAPIOutDTO {
  id: number;
  submittedData: unknown;
  submittedFormName: string;
  appealStatus: StudentAppealStatus;
}
```

---

### 2. Output DTOs (for return types)

These DTOs define the exact shape of the data returned by an endpoint, they are typically plain classes without transformation decorators.

**Naming Convention:**
- **Class:** `[Subject][Details]APIOutDTO` (e.g., `ApplicationDataAPIOutDTO`, `ApplicationProgressDetailsAPIOutDTO`, `StudentAppealRequestSummaryAPIOutDTO`, `AppealSummaryAPIOutDTO`, etc.).

**Pattern:**
- Define properties as public members of the class.
- Nest other `APIOutDTO` classes for complex objects.

**Example:**

```typescript
// Generic DTO example.
export class MySampleClassAPIOutDTO {
  id: number;
  myPropertyOne: Date;
  myPropertyTwo: string;
}
```

```typescript
// DTO with a nested DTO example.
class StudentAppealRequestSummaryAPIOutDTO {
  submittedFormName: string;
  appealStatus: StudentAppealStatus;
}

export class AppealSummaryAPIOutDTO {
  id: number;
  appealStatus: StudentAppealStatus;
  appealRequests: StudentAppealRequestSummaryAPIOutDTO[];
  applicationId?: number;
  applicationNumber?: string;
  assessedDate?: Date;
  submittedDate: Date;
}
```