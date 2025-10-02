import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { faker } from "@faker-js/faker";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeSupportingUser,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  DynamicFormConfiguration,
  DynamicFormType,
  SupportingUserType,
} from "@sims/sims-db";

describe("SupportingUserStudentsController(e2e)-getIdentifiableSupportingUser", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let recentPYParentForm: DynamicFormConfiguration;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    recentPYParentForm = await db.dynamicFormConfiguration.findOne({
      select: {
        id: true,
        programYear: { id: true, startDate: true },
        formDefinitionName: true,
      },
      relations: { programYear: true },
      where: {
        formType: DynamicFormType.SupportingUsersParent,
        programYear: { active: true },
      },
      order: { programYear: { startDate: "DESC" } },
    });
  });

  beforeEach(() => {
    resetMockJWTUserInfo(appModule);
  });

  it("Should throw not found error when the supporting user is not associated to the student submitted application.", async () => {
    // Arrange
    // Create fake application.
    const application = await saveFakeApplication(db.dataSource, {
      programYear: recentPYParentForm.programYear,
    });
    // Create fake supporting user parent.
    const parentFullName = faker.string.alpha({ length: 50 });
    const parent = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          isAbleToReport: false,
          supportingUserType: SupportingUserType.Parent,
          fullName: parentFullName,
        },
      },
    );
    await db.supportingUser.save(parent);
    const endpoint = `/students/supporting-user/${parent.id}`;
    // Token belongs to a different student who is not associated to the application.
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message:
          "Supporting user not found or not eligible to be accessed by the student.",
        error: "Not Found",
      });
  });

  it("Should throw not found error when the supporting user type is not parent.", async () => {
    // Arrange
    // Create fake application.
    const application = await saveFakeApplication(db.dataSource, {
      programYear: recentPYParentForm.programYear,
    });
    const student = application.student;
    // Create fake supporting user partner.
    const partner = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          isAbleToReport: false,
          supportingUserType: SupportingUserType.Partner,
        },
      },
    );
    await db.supportingUser.save(partner);
    // Mock student user token.
    await mockJWTUserInfo(appModule, student.user);
    const endpoint = `/students/supporting-user/${partner.id}`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message:
          "Supporting user not found or not eligible to be accessed by the student.",
        error: "Not Found",
      });
  });

  it("Should throw not found error when the supporting is able to report by themselves.", async () => {
    // Arrange
    // Create fake application.
    const application = await saveFakeApplication(db.dataSource, {
      programYear: recentPYParentForm.programYear,
    });
    const student = application.student;
    // Create fake supporting user parent.
    const parentFullName = faker.string.alpha({ length: 50 });
    const parent = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          // Supporting user is able to report by themselves.
          isAbleToReport: true,
          supportingUserType: SupportingUserType.Parent,
          fullName: parentFullName,
        },
      },
    );
    await db.supportingUser.save(parent);
    // Mock student user token.
    await mockJWTUserInfo(appModule, student.user);
    const endpoint = `/students/supporting-user/${parent.id}`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message:
          "Supporting user not found or not eligible to be accessed by the student.",
        error: "Not Found",
      });
  });

  it("Should throw not found error when the supporting user id is invalid.", async () => {
    // Arrange
    const endpoint = "/students/supporting-user/99999";
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message:
          "Supporting user not found or not eligible to be accessed by the student.",
        error: "Not Found",
      });
  });

  it(
    "Should get the supporting user details when the supporting user is a parent and" +
      " the supporting user is associated to the student submitted application and" +
      " the supporting user is not able to report.",
    async () => {
      // Arrange
      // Create fake application.
      const application = await saveFakeApplication(db.dataSource, {
        programYear: recentPYParentForm.programYear,
      });
      const student = application.student;
      // Create fake supporting user parent.
      const parentFullName = faker.string.alpha({ length: 50 });
      const parent = createFakeSupportingUser(
        { application },
        {
          initialValues: {
            isAbleToReport: false,
            supportingUserType: SupportingUserType.Parent,
            fullName: parentFullName,
          },
        },
      );
      await db.supportingUser.save(parent);
      // Mock student user token.
      await mockJWTUserInfo(appModule, student.user);
      const endpoint = `/students/supporting-user/${parent.id}`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          fullName: parentFullName,
          formName: recentPYParentForm.formDefinitionName,
          isAbleToReport: false,
          programYearStartDate: recentPYParentForm.programYear.startDate,
        });
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});
