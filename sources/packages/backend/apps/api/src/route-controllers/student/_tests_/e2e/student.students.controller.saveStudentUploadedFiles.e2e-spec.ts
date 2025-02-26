import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockUserLoginInfo,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplication,
  saveFakeStudent,
  saveFakeStudentFileUpload,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import { getDateOnlyFormat } from "@sims/utilities";
import { FileOriginType, NotificationMessageType } from "@sims/sims-db";

describe("StudentStudentsController(e2e)-saveStudentUploadedFiles", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);

    appModule = module;
    await db.notificationMessage.update(
      { id: NotificationMessageType.StudentFileUpload },
      { emailContacts: ["test@test.com"] },
    );
  });

  it("Should save all uploaded files when a proper student file upload request is made.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const application = await saveFakeApplication(db.dataSource, { student });
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const studentFile1 = await saveFakeStudentFileUpload(
      db.dataSource,
      {
        student,
        creator: student.user,
      },
      {
        fileOrigin: FileOriginType.Student,
        groupName: "application",
      },
    );
    const studentFile2 = await saveFakeStudentFileUpload(
      db.dataSource,
      {
        student,
        creator: student.user,
      },
      {
        fileOrigin: FileOriginType.Student,
        groupName: "application",
      },
    );

    const payload = {
      submittedForm: {
        documentPurpose: "application",
        applicationNumber: application.applicationNumber,
      },
      associatedFiles: [
        studentFile1.uniqueFileName,
        studentFile2.uniqueFileName,
      ],
    };

    const notificationMessage = await db.notificationMessage.findOne({
      where: { id: NotificationMessageType.StudentFileUpload },
    });

    const endpoint = "/students/student/save-uploaded-files";

    // Mock user service to return the saved student.
    await mockUserLoginInfo(appModule, student);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    const updatedStudentFiles = await db.studentFile.find({
      select: {
        id: true,
        modifier: { id: true },
        metadata: { applicationNumber: true },
      },
      where: { id: studentFile1.id },
      relations: { modifier: true },
    });

    updatedStudentFiles.forEach((studentFile) => {
      expect(studentFile).toMatchObject({
        id: studentFile.id,
        modifier: { id: student.user.id },
        metadata: {
          applicationNumber: application.applicationNumber,
        },
      });
    });

    const notification = await db.notification.findOne({
      select: {
        id: true,
        messagePayload: true,
      },
      where: {
        user: { id: student.user.id },
      },
    });
    expect(notification.messagePayload).toEqual({
      template_id: notificationMessage.templateId,
      email_address: "test@test.com",
      personalisation: {
        dateTime: expect.any(String),
        lastName: student.user.lastName,
        birthDate: getDateOnlyFormat(student.birthDate),
        fileNames: [studentFile1.fileName, studentFile2.fileName],
        givenNames: student.user.firstName,
        studentEmail: student.user.email,
        documentPurpose: payload.submittedForm.documentPurpose,
        applicationNumber: payload.submittedForm.applicationNumber,
      },
    });
  });

  afterAll(async () => {
    await app?.close();
  });
});
