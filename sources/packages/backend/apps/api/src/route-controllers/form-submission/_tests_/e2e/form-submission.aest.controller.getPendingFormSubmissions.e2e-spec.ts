import { HttpStatus, INestApplication } from "@nestjs/common";
import { faker } from "@faker-js/faker";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { FormCategory, FormSubmissionStatus } from "@sims/sims-db";
import {
  createE2EDataSources,
  createFakeUser,
  E2EDataSources,
  saveFakeFormSubmission,
  saveFakeStudent,
} from "@sims/test-utils";

describe("FormSubmissionAESTController(e2e)-getPendingFormSubmissions", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should return only pending StudentForm submissions in the paginated results when using the pending forms endpoint.", async () => {
    // Arrange
    // Add a unique identifier in the student lastName to isolate the data.
    const uniqueIdentifier = faker.string.uuid();
    const user1 = createFakeUser();
    user1.lastName = uniqueIdentifier;
    const user2 = createFakeUser();
    user2.lastName = uniqueIdentifier;
    const student1 = await saveFakeStudent(db.dataSource, { user: user1 });
    const student2 = await saveFakeStudent(db.dataSource, { user: user2 });
    const pendingSubmission1 = await saveFakeFormSubmission(
      db,
      { student: student1 },
      {
        formCategory: FormCategory.StudentForm,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    );
    const pendingSubmission2 = await saveFakeFormSubmission(
      db,
      { student: student2 },
      {
        formCategory: FormCategory.StudentForm,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    );
    // Unused submissions without the unique identifier to verify the endpoint filtering.
    await saveFakeFormSubmission(
      db,
      { student: student2 },
      {
        formCategory: FormCategory.StudentForm,
        submissionStatus: FormSubmissionStatus.Completed,
      },
    );
    await saveFakeFormSubmission(
      db,
      { student: student2 },
      {
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    );
    const endpoint = `/aest/form-submission/pending-forms?page=0&pageLimit=100&sortField=submittedDate&sortOrder=DESC&searchCriteria=${uniqueIdentifier}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            formSubmissionId: pendingSubmission2.id,
            studentId: pendingSubmission2.student.id,
            submittedDate: pendingSubmission2.submittedDate.toISOString(),
            firstName: pendingSubmission2.student.user.firstName,
            lastName: pendingSubmission2.student.user.lastName,
            formNames: pendingSubmission2.formSubmissionItems.map(
              (item) =>
                item.dynamicFormConfiguration.formDescription ??
                (item.dynamicFormConfiguration.formType as string),
            ),
          },
          {
            formSubmissionId: pendingSubmission1.id,
            studentId: pendingSubmission1.student.id,
            submittedDate: pendingSubmission1.submittedDate.toISOString(),
            firstName: pendingSubmission1.student.user.firstName,
            lastName: pendingSubmission1.student.user.lastName,
            formNames: pendingSubmission1.formSubmissionItems.map(
              (item) =>
                item.dynamicFormConfiguration.formDescription ??
                (item.dynamicFormConfiguration.formType as string),
            ),
          },
        ],
        count: 2,
      });
  });
});
