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
  saveFakeApplication,
  saveFakeFormSubmission,
  saveFakeStudent,
} from "@sims/test-utils";

describe("FormSubmissionAESTController(e2e)-getPendingAppeals", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should return only pending StudentAppeal submissions in the paginated results when using the pending appeals endpoint.", async () => {
    // Arrange
    // Add a unique identifier in the student lastName to isolate the data.
    const uniqueIdentifier = faker.string.uuid();
    const userWithApplication = createFakeUser();
    userWithApplication.lastName = uniqueIdentifier;
    const userWithoutApplication = createFakeUser();
    userWithoutApplication.lastName = uniqueIdentifier;
    const studentWithApplication = await saveFakeStudent(db.dataSource, {
      user: userWithApplication,
    });
    const studentWithoutApplication = await saveFakeStudent(db.dataSource, {
      user: userWithoutApplication,
    });
    const application = await saveFakeApplication(db.dataSource, {
      student: studentWithApplication,
    });
    const pendingAppealWithApplication = await saveFakeFormSubmission(
      db,
      { student: studentWithApplication, application },
      {
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    );
    const pendingAppealWithoutApplication = await saveFakeFormSubmission(
      db,
      { student: studentWithoutApplication },
      {
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    );
    // Unused submissions without the unique identifier to verify the endpoint filtering.
    await saveFakeFormSubmission(
      db,
      { student: studentWithoutApplication },
      {
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Completed,
      },
    );
    await saveFakeFormSubmission(
      db,
      { student: studentWithoutApplication },
      {
        formCategory: FormCategory.StudentForm,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    );
    const endpoint = `/aest/form-submission/pending-appeals?page=0&pageLimit=100&sortField=submittedDate&sortOrder=DESC&searchCriteria=${uniqueIdentifier}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            formSubmissionId: pendingAppealWithoutApplication.id,
            studentId: pendingAppealWithoutApplication.student.id,
            submittedDate:
              pendingAppealWithoutApplication.submittedDate.toISOString(),
            firstName: pendingAppealWithoutApplication.student.user.firstName,
            lastName: pendingAppealWithoutApplication.student.user.lastName,
          },
          {
            formSubmissionId: pendingAppealWithApplication.id,
            studentId: pendingAppealWithApplication.student.id,
            submittedDate:
              pendingAppealWithApplication.submittedDate.toISOString(),
            firstName: pendingAppealWithApplication.student.user.firstName,
            lastName: pendingAppealWithApplication.student.user.lastName,
            applicationId: application.id,
            applicationNumber: application.applicationNumber,
          },
        ],
        count: 2,
      });
  });
});
