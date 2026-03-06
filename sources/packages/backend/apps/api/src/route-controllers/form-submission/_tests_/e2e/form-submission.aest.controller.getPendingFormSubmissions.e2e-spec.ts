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

describe("FormSubmissionAESTController(e2e)-getPendingFormSubmissions", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should return pending form submissions across all categories (StudentForm and StudentAppeal) when no filter is applied.", async () => {
    // Arrange
    // Add a unique identifier in the student lastName to isolate the data.
    const uniqueIdentifier = faker.string.uuid();
    const user1 = createFakeUser();
    user1.lastName = uniqueIdentifier;
    const user2 = createFakeUser();
    user2.lastName = uniqueIdentifier;
    const student1 = await saveFakeStudent(db.dataSource, { user: user1 });
    const student2 = await saveFakeStudent(db.dataSource, { user: user2 });
    const pendingStudentForm = await saveFakeFormSubmission(
      db,
      { student: student1 },
      {
        formCategory: FormCategory.StudentForm,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    );
    const pendingStudentAppeal = await saveFakeFormSubmission(
      db,
      { student: student2 },
      {
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    );
    // Submissions that should not appear in the results.
    await saveFakeFormSubmission(
      db,
      { student: student1 },
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
        submissionStatus: FormSubmissionStatus.Completed,
      },
    );
    const endpoint = `/aest/form-submission/pending?page=0&pageLimit=100&sortField=submittedDate&sortOrder=DESC&searchCriteria=${uniqueIdentifier}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            formSubmissionId: pendingStudentAppeal.id,
            studentId: pendingStudentAppeal.student.id,
            submittedDate: pendingStudentAppeal.submittedDate.toISOString(),
            firstName: pendingStudentAppeal.student.user.firstName,
            lastName: pendingStudentAppeal.student.user.lastName,
            formNames: pendingStudentAppeal.formSubmissionItems.map(
              (item) => item.dynamicFormConfiguration.formType as string,
            ),
          },
          {
            formSubmissionId: pendingStudentForm.id,
            studentId: pendingStudentForm.student.id,
            submittedDate: pendingStudentForm.submittedDate.toISOString(),
            firstName: pendingStudentForm.student.user.firstName,
            lastName: pendingStudentForm.student.user.lastName,
            formNames: pendingStudentForm.formSubmissionItems.map(
              (item) => item.dynamicFormConfiguration.formType as string,
            ),
          },
        ],
        count: 2,
      });
  });

  it("Should return only submissions linked to an application when the hasApplicationScope filter is true.", async () => {
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
    const pendingSubmissionWithApplication = await saveFakeFormSubmission(
      db,
      { student: studentWithApplication, application },
      {
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    );
    // This submission should not appear in the filtered results.
    await saveFakeFormSubmission(
      db,
      { student: studentWithoutApplication },
      {
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    );
    const endpoint = `/aest/form-submission/pending?page=0&pageLimit=100&sortField=submittedDate&sortOrder=DESC&searchCriteria=${uniqueIdentifier}&hasApplicationScope=true`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            formSubmissionId: pendingSubmissionWithApplication.id,
            studentId: pendingSubmissionWithApplication.student.id,
            submittedDate:
              pendingSubmissionWithApplication.submittedDate.toISOString(),
            firstName: pendingSubmissionWithApplication.student.user.firstName,
            lastName: pendingSubmissionWithApplication.student.user.lastName,
            formNames: pendingSubmissionWithApplication.formSubmissionItems.map(
              (item) => item.dynamicFormConfiguration.formType as string,
            ),
            applicationId: application.id,
            applicationNumber: application.applicationNumber,
          },
        ],
        count: 1,
      });
  });

  it("Should return only submissions not linked to an application when the hasApplicationScope filter is false.", async () => {
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
    // This submission should not appear in the filtered results.
    await saveFakeFormSubmission(
      db,
      { student: studentWithApplication, application },
      {
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    );
    const pendingSubmissionWithoutApplication = await saveFakeFormSubmission(
      db,
      { student: studentWithoutApplication },
      {
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    );
    const endpoint = `/aest/form-submission/pending?page=0&pageLimit=100&sortField=submittedDate&sortOrder=DESC&searchCriteria=${uniqueIdentifier}&hasApplicationScope=false`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            formSubmissionId: pendingSubmissionWithoutApplication.id,
            studentId: pendingSubmissionWithoutApplication.student.id,
            submittedDate:
              pendingSubmissionWithoutApplication.submittedDate.toISOString(),
            firstName:
              pendingSubmissionWithoutApplication.student.user.firstName,
            lastName: pendingSubmissionWithoutApplication.student.user.lastName,
            formNames:
              pendingSubmissionWithoutApplication.formSubmissionItems.map(
                (item) => item.dynamicFormConfiguration.formType as string,
              ),
          },
        ],
        count: 1,
      });
  });

  it("Should return only StudentAppeal submissions when the formCategory filter is StudentAppeal.", async () => {
    // Arrange
    // Add a unique identifier in the student lastName to isolate the data.
    const uniqueIdentifier = faker.string.uuid();
    const user1 = createFakeUser();
    user1.lastName = uniqueIdentifier;
    const user2 = createFakeUser();
    user2.lastName = uniqueIdentifier;
    const student1 = await saveFakeStudent(db.dataSource, { user: user1 });
    const student2 = await saveFakeStudent(db.dataSource, { user: user2 });
    const pendingAppeal = await saveFakeFormSubmission(
      db,
      { student: student1 },
      {
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    );
    // This StudentForm submission should not appear in the filtered results.
    await saveFakeFormSubmission(
      db,
      { student: student2 },
      {
        formCategory: FormCategory.StudentForm,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    );
    const endpoint = `/aest/form-submission/pending?page=0&pageLimit=100&sortField=submittedDate&sortOrder=DESC&searchCriteria=${uniqueIdentifier}&formCategory=${encodeURIComponent(FormCategory.StudentAppeal)}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            formSubmissionId: pendingAppeal.id,
            studentId: pendingAppeal.student.id,
            submittedDate: pendingAppeal.submittedDate.toISOString(),
            firstName: pendingAppeal.student.user.firstName,
            lastName: pendingAppeal.student.user.lastName,
            formNames: pendingAppeal.formSubmissionItems.map(
              (item) => item.dynamicFormConfiguration.formType as string,
            ),
          },
        ],
        count: 1,
      });
  });

  it("Should return only StudentForm submissions when the formCategory filter is StudentForm.", async () => {
    // Arrange
    // Add a unique identifier in the student lastName to isolate the data.
    const uniqueIdentifier = faker.string.uuid();
    const user1 = createFakeUser();
    user1.lastName = uniqueIdentifier;
    const user2 = createFakeUser();
    user2.lastName = uniqueIdentifier;
    const student1 = await saveFakeStudent(db.dataSource, { user: user1 });
    const student2 = await saveFakeStudent(db.dataSource, { user: user2 });
    const pendingStudentForm = await saveFakeFormSubmission(
      db,
      { student: student1 },
      {
        formCategory: FormCategory.StudentForm,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    );
    // This StudentAppeal submission should not appear in the filtered results.
    await saveFakeFormSubmission(
      db,
      { student: student2 },
      {
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    );
    const endpoint = `/aest/form-submission/pending?page=0&pageLimit=100&sortField=submittedDate&sortOrder=DESC&searchCriteria=${uniqueIdentifier}&formCategory=${encodeURIComponent(FormCategory.StudentForm)}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            formSubmissionId: pendingStudentForm.id,
            studentId: pendingStudentForm.student.id,
            submittedDate: pendingStudentForm.submittedDate.toISOString(),
            firstName: pendingStudentForm.student.user.firstName,
            lastName: pendingStudentForm.student.user.lastName,
            formNames: pendingStudentForm.formSubmissionItems.map(
              (item) => item.dynamicFormConfiguration.formType as string,
            ),
          },
        ],
        count: 1,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
