# Copilot PR Review Checklist

Use this checklist to guide Copilot PR Reviews and human reviewers. For full rules, see:

- TypeScript style: [style-typescript.instructions.md](./instructions/style-typescript.instructions.md)
- Vue style: [style-vue.instructions.md](./instructions/style-vue.instructions.md)
- API controllers: [controllers.instructions.md](./instructions/api/controllers.instructions.md)
- API DTOs: [dto.instructions.md](./instructions/api/dto.instructions.md)
- API e2e tests: [e2e.instructions.md](./instructions/api/e2e.instructions.md)

## Quick Checks

- PR title must follow the pattern "#[ticket_number] - [Title]".
- Comments/JSDoc: Sentences start with a capital letter and end with a period; exported/public APIs have JSDoc with business context, `@param` and `@returns` descriptions ending with periods. (See TS/Vue style.)
- Vue Composition: Uses `<script setup>`, favors `async/await`, early returns, and `const` over `let` when not reassigned. (See Vue style.)
- Controllers (NestJS): Correct file naming, tags, and decorators by client type; map domain errors to proper `HttpException`s; avoid passing DTOs beyond controller layer. (See API controllers.)
- DTOs: Class-based only, correct naming (`*APIInDTO` / `*APIOutDTO`), appropriate `class-validator` usage, and not exposing repository/service models directly. (See API DTOs.)
- E2E Coverage: New/changed endpoints have e2e tests with proper setup, auth, assertions (success and common failures), and isolation. (See API e2e tests.)
- Client Types: Endpoints/tags align with one of `aest | institutions | students | supporting-users | external`. (See Client Types in this file.)

# Project Overview

This project is a web application to allow students to apply for loans and grants for provincial and federal government programs. The backend is built using NestJS Monorepo while the frontend is built using Vue.

## Folder Structure

The SIMS project is a monorepo with a clear separation of concerns:

- `sources/packages/backend`: The NestJS monorepo containing all backend services.
  - `apps/api`: The main REST API for all clients (Student, Institution, AEST).
  - `apps/workers`: Background job processors for Camunda Workflows.
  - `apps/queue-consumers`: Services that consume messages from queues, including scheduled tasks.
  - `libs`: Shared libraries used across backend applications.
  - `workflows`: Contains BPMN workflow definitions and related code for their deployment.
- `sources/packages/web`: The Vue.js frontend application for all users.
- `sources/packages/forms`: Contains all form.io JSON form definitions and related code for their deployment.
- `devops`: Holds infrastructure-as-code, including Helm charts and OpenShift deployment files.

## Libraries and Frameworks

- **Backend**: [NestJS](https://nestjs.com/), [TypeORM](https://typeorm.io/), [Redis](https://redis.io/) for queue management and caching, [Camunda](https://camunda.com/) for workflow management.
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Frontend**: [Vue.js](https://vuejs.org/), [Vuetify](https://vuetifyjs.com/) for UI components.
- **Forms**: [Form.io](https://www.form.io/) for dynamic form rendering, [MongoDB](https://www.mongodb.com/) as the database for form.io forms.

## Client Types

When a `client-type` is mentioned in the code or documentation, the possible values should be one of the following:

- `aest` for Ministry users (PSFS was formerly known as AEST)
- `institutions` for Institution users
- `students` for Student users
- `supporting-users` for Supporting Users (e.g., parents, partners)
- `external` for External systems (e.g., other government services)

## Coding Standards

- Comments should be in English and using proper grammar, including punctuation, for instance, starting with a capital letter and ending with a period.
- @param descriptions and @returns in JSDoc must be complete sentences ending with a period and can start with lowercase if continuing the sentence.
- Use `async/await` for asynchronous operations instead of `.then()` and `.catch()`.
- Use `Promise.all` or `Promise.allSettled` for concurrent asynchronous operations when applicable.
- Use early returns to reduce code complexity.
- Use `const` for variables that are not reassigned.
- Use `let` only for variables that will be reassigned.
- Use `private` and `readonly` modifiers for class properties whenever possible.
- Do not use `public` modifier for class properties; it is the default visibility (except for db-migrations under the db-migrations folder).
- Use `PascalCase` for class names, including acronyms (e.g., `MyClassWithACRONYM`).
- Use `camelCase` for variable and method names.
- Use `UPPER_SNAKE_CASE` for constants.
- Use TypeScript types and interfaces to define data structures.
- In NestJS, use decorators for dependency injection and routing.
- In Vue, use the Composition API with `<script setup>`.
- Follow NestJS and Vue.js best practices.

## Sample class example

```typescript
/**
 * This is my const.
 */
const THIS_IS_A_CONST = 123456;

/**
 * My comment with a proper sentence that starts usually with a
 * capital letter and finishes with a period.
 * Try to add comments that make it better to understand the
 * business logic, not only describing the method itself.
 */
export class MyClassWithACRONYM {
  /**
   * My private local variable.
   */
  private myLocalVariable = 123;

  constructor(private readonly myVariable: string) {
    // Do something
  }

  /**
   * Try to give a comment that provides some business context instead
   * of only describing what we can read from the code itself.
   * For instance, for the below 'if' condition, instead of saying
   * If THIS_IS_A_CONST is equal to myNumber then do something we can explain why
   * do we need to check it from a business perspective.
   * @param myNumber my number that we need for this and that.
   * @param options my optional parameters.
   * - `myOptionalParameter` an optional parameter for case A and B.
   * - `myOtherOptionalParameter` another optional parameter for case C.
   * @returns the resulting number after doing this and that.
   */
  async myPublicMethod(
    myNumber: number,
    options?: {
      myOptionalParameter?: string;
      myOtherOptionalParameter?: string;
    }
  ): Promise<number> {
    if (myNumber === THIS_IS_A_CONST) {
      // Use early return when possible to reduce code complexity.
      return this.myAsyncMethodCallA(myOptionalParameter);
    }

    return this.myAsyncMethodCallB(this.myVariable);
  }

  /**
   * Add nice comments as described before.
   */
  private myPrivateMethod(): void {
    // Do something.
  }
}
```

## How to declare an enum

```typescript
/**
 * Enumeration types for Notes.
 */
export enum NoteType {
  /**
   * Note type general.
   */
  General = "General",
  /**
   * Note type Restriction.
   */
  Restriction = "Restriction",
}
```

## PR review

- Before raising the PR, review technical and business ACs.
- Add appropriate labels that also indicate the applications being impacted by the PR, for instance, SIMS Api or Queue-Consumers.
- Connect the issue using the button "Connect Issue", if not available install the Chrome Extension ZenHub for GitHub or similar.
- If you are the author of the PR avoid resolving the conversations, instead reply to them to let the reviewer be aware of your thoughts.
- If you are a reviewer try to mark the conversations as resolved to help the PR author to identify easily what is still missing.
- Comments and conversations on the PR are good to let everyone be aware of what is happening but a quick call can also save a lot of time.
- Even if the ticket demands too many file changes, try to create small PRs to make it easier for reviewers to understand the changes. It also makes the PR review quicker.
- Once a review is raised, two reviewers are expected to be assigned to provide feedback and approve it.
- The developers should take turns associating themselves across the PR and trying to balance the workload.
- The team, as it is right now, will have two main reviewers assigned.
- The two reviewers group must contain at least one main reviewer plus one developer.
- The first reviewer should make the best effort to try to find a good moment to start in the next three business hours. It does not mean finishing it in three hours, just try to start providing some feedback. If multiple PRs are open at the same time the delays will be completely acceptable. The goal is to allow the PR owner to start working on possible modifications sooner rather than later.
- It is the PR owner's responsibility to enforce that the PR will have the required number of reviews for approvals in the time window described in the previous topics.
- PRs are about code review (not people review).
- The PR branch is automatically deleted once the PR is merged.
