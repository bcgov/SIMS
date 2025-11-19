# Project Overview

This project is a web application to allow students to apply for loans and grants for provincial and federal government programs. The backend is built using Nestjs Monorepo while the frontend is built Vue.

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
- `institution` for Institution users
- `student` for Student users
- `supporting-user` for Supporting Users (e.g., parents, partners)
- `external` for External systems (e.g., other government services)

## Coding Standards

- Comments should be in English and using proper grammar, including punctuation.
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
 * business logic does not only describes the method itself.
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
   * 'If THIS_IS_A_CONST is equal to myNumber then do something we can explain why
   * do we need to check it from a business perspective.
   * @param myNumber my number that we need for this and that,
   * @param myOptionalParameter used in the case A and B when X is needed.
   */
  async myPublicMethod(
    myNumber: number,
    myOptionalParameter?: string
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
  private myPrivateMethod() {
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
  /**
   * Note type System.
   */
  System = "System actions",
  /**
   * Note type Program.
   */
  Program = "Program",
}
```

## PR review

- Before raising the PR, review technical and business ACs.
- PR title must follow the pattern "#[Ticket_number] - [Title]".
- Add appropriate labels that also indicate the applications being impacted by the PR, for instance, SIMS Api or Queue-Consumers.
- Connect the issue using the button "Connect Issue", if not available install the Chrome Extension ZenHub for GitHub or similar.
- If you are the author of the PR avoid resolving the comments, instead reply to them to let the reviewer be aware of your thoughts.
- If you are a reviewer try to mark the comments as resolved to help the PR author to identify easily what is still missing.
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
