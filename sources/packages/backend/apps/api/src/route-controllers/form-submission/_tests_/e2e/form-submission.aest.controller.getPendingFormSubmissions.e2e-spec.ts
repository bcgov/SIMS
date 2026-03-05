import { HttpStatus, INestApplication } from "@nestjs/common";
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
  E2EDataSources,
  saveFakeFormSubmission,
} from "@sims/test-utils";

describe("FormSubmissionAESTController(e2e)-getPendingFormSubmissions", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should return only pending StudentForm submissions in the paginated results.", async () => {
    // Arrange
    const [
      pendingSubmission1,
      pendingSubmission2,
      completedSubmission,
      appealSubmission,
    ] = await Promise.all([
      saveFakeFormSubmission(db, undefined, {
        formCategory: FormCategory.StudentForm,
        submissionStatus: FormSubmissionStatus.Pending,
      }),
      saveFakeFormSubmission(db, undefined, {
        formCategory: FormCategory.StudentForm,
        submissionStatus: FormSubmissionStatus.Pending,
      }),
      saveFakeFormSubmission(db, undefined, {
        formCategory: FormCategory.StudentForm,
        submissionStatus: FormSubmissionStatus.Completed,
      }),
      saveFakeFormSubmission(db, undefined, {
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Pending,
      }),
    ]);
    const endpoint =
      "/aest/form-submission/pending?page=0&pageLimit=100&sortField=submittedDate&sortOrder=DESC";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        const results = response.body.results;
        expect(results).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              formSubmissionId: pendingSubmission1.id,
              studentId: pendingSubmission1.student.id,
            }),
            expect.objectContaining({
              formSubmissionId: pendingSubmission2.id,
              studentId: pendingSubmission2.student.id,
            }),
          ]),
        );
        expect(results).not.toContainEqual(
          expect.objectContaining({
            formSubmissionId: completedSubmission.id,
          }),
        );
        expect(results).not.toContainEqual(
          expect.objectContaining({
            formSubmissionId: appealSubmission.id,
          }),
        );
      });
  });

  it("Should return 401 when the request is not authenticated.", async () => {
    // Arrange
    const endpoint =
      "/aest/form-submission/pending?page=0&pageLimit=100&sortField=submittedDate&sortOrder=DESC";

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .expect(HttpStatus.UNAUTHORIZED);
  });
});
