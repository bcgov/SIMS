import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { IsNull } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentAppeal,
  createFakeStudentAppealRequest,
  getProviderInstanceForModule,
  saveFakeStudent,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import { AppStudentsModule } from "../../../../app.students.module";
import { FormService } from "../../../../services";
import {
  NotificationMessageType,
  StudentAppealActionType,
  StudentAppealStatus,
} from "@sims/sims-db";
import MockDate from "mockdate";
import {
  getDateOnlyFormat,
  getPSTPDTDateTime,
} from "@sims/utilities/date-utils";
import { STUDENT_HAS_PENDING_APPEAL } from "../../../../constants";

describe("StudentAppealStudentsController(e2e)-submitStudentAppeal", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let formService: FormService;
  const MODIFIED_INDEPENDENT_APPEAL = "modifiedindependentappeal";
  const ENDPOINT = "/students/appeal";
  const MINISTRY_EMAIL_ADDRESS = "dummy@some.domain";
  const MODIFIED_INDEPENDENT_FORM_DATA = {
    actions: [StudentAppealActionType.UpdateModifiedIndependent],
    isModifiedIndependent: "no",
  };
  const VALID_PAYLOAD = {
    formName: MODIFIED_INDEPENDENT_APPEAL,
    formData: MODIFIED_INDEPENDENT_FORM_DATA,
    files: [],
  };

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    // Update fake email contact to send ministry email.
    await db.notificationMessage.update(
      {
        id: NotificationMessageType.StudentSubmittedChangeRequestNotification,
      },
      { emailContacts: [MINISTRY_EMAIL_ADDRESS] },
    );
    formService = await getProviderInstanceForModule(
      appModule,
      AppStudentsModule,
      FormService,
    );
  });

  beforeEach(async () => {
    MockDate.reset();
    await resetMockJWTUserInfo(appModule);
    // Mark all existing appeals(change request) notifications as sent
    // to allow it to asserted when a new appeal is submitted.
    await db.notification.update(
      {
        notificationMessage: {
          id: NotificationMessageType.StudentSubmittedChangeRequestNotification,
        },
      },
      { dateSent: new Date() },
    );
  });

  it("Should create a student-only appeal and a Ministry notification for modified independent when the submission is valid.", async () => {
    // Arrange
    // Create student to submit application.
    const student = await saveFakeStudent(db.dataSource);
    // Get any student user token.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the form service to validate the dry-run submission result.
    // and this mock must be removed.
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: MODIFIED_INDEPENDENT_APPEAL,
      data: { data: MODIFIED_INDEPENDENT_FORM_DATA },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    await mockJWTUserInfo(appModule, student.user);
    const now = new Date();
    MockDate.set(now);

    // Act/Assert
    let createdAppealId: number;
    await request(app.getHttpServer())
      .post(ENDPOINT)
      .send(VALID_PAYLOAD)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        createdAppealId = +response.body.id;
      });
    const studentAppeal = await db.studentAppeal.findOne({
      select: {
        id: true,
        application: { id: true },
        student: { id: true },
        creator: { id: true },
        createdAt: true,
        submittedDate: true,
        appealRequests: {
          id: true,
          submittedFormName: true,
          submittedData: true,
          appealStatus: true,
          creator: { id: true },
          createdAt: true,
        },
      },
      relations: {
        application: true,
        student: true,
        creator: true,
        appealRequests: { creator: true },
      },
      where: { id: createdAppealId },
      loadEagerRelations: false,
    });
    // Expect to call the dry run submission.
    expect(dryRunSubmissionMock).toHaveBeenCalledWith(
      MODIFIED_INDEPENDENT_APPEAL,
      MODIFIED_INDEPENDENT_FORM_DATA,
    );
    const auditUser = { id: student.user.id };
    expect(studentAppeal).toEqual({
      id: createdAppealId,
      application: null,
      student: { id: student.id },
      creator: auditUser,
      createdAt: now,
      submittedDate: now,
      appealRequests: [
        {
          id: expect.any(Number),
          submittedFormName: MODIFIED_INDEPENDENT_APPEAL,
          submittedData: MODIFIED_INDEPENDENT_FORM_DATA,
          appealStatus: StudentAppealStatus.Pending,
          creator: auditUser,
          createdAt: now,
        },
      ],
    });
    // Validate notification.
    const createdNotification = await db.notification.findOne({
      select: { id: true, messagePayload: true },
      where: {
        notificationMessage: {
          id: NotificationMessageType.StudentSubmittedChangeRequestNotification,
        },
        dateSent: IsNull(),
      },
    });
    expect(createdNotification.messagePayload).toStrictEqual({
      template_id: "241a360a-07d6-486f-9aa4-fae6903e1cff",
      email_address: MINISTRY_EMAIL_ADDRESS,
      personalisation: {
        givenNames: student.user.firstName,
        lastName: student.user.lastName,
        birthDate: getDateOnlyFormat(student.birthDate),
        studentEmail: student.user.email,
        applicationNumber: "not applicable",
        dateTime: `${getPSTPDTDateTime(now)} PST/PDT`,
      },
    });
  });

  it("Should throw an unprocessable entity error for a student-only appeal submission when the same appeal request type is pending review from the Ministry.", async () => {
    // Arrange
    // Create student to submit application.
    const student = await saveFakeStudent(db.dataSource);
    // Get any student user token.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Create pending appeal for the student.
    const pendingAppealRequest = createFakeStudentAppealRequest();
    pendingAppealRequest.appealStatus = StudentAppealStatus.Pending;
    pendingAppealRequest.submittedFormName = MODIFIED_INDEPENDENT_APPEAL;
    const pendingAppeal = createFakeStudentAppeal({
      student,
      appealRequests: [pendingAppealRequest],
    });
    await db.studentAppeal.save(pendingAppeal);
    await mockJWTUserInfo(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .post(ENDPOINT)
      .send(VALID_PAYLOAD)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Only one student appeal of the same type can be submitted at a time. When your current request is approved or denied by StudentAid BC, you will be able to submit a new one.",
        errorType: STUDENT_HAS_PENDING_APPEAL,
      });
  });

  it("Should throw a bad request error for a student-only appeal submission when the form data is invalid.", async () => {
    // Arrange
    // Create student to submit application.
    const student = await saveFakeStudent(db.dataSource);
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: false,
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    // Get any student user token.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    await mockJWTUserInfo(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .post(ENDPOINT)
      .send(VALID_PAYLOAD)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message:
          "Not able to submit the student appeal due to an invalid request.",
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should throw a bad request error for a student-only appeal submission when the form path name is invalid.", async () => {
    // Arrange
    const invalidFormNamePayload = {
      formName: `${MODIFIED_INDEPENDENT_APPEAL}invalid`,
      formData: MODIFIED_INDEPENDENT_FORM_DATA,
      files: [],
    };
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(ENDPOINT)
      .send(invalidFormNamePayload)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .then((response) => {
        expect(response.body).toMatchObject({
          error: "Bad Request",
          statusCode: HttpStatus.BAD_REQUEST,
        });
        expect(response.body.message).toEqual(
          expect.arrayContaining([
            expect.stringContaining(
              "formName must be one of the following values",
            ),
          ]),
        );
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
