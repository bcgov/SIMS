import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { faker } from "@faker-js/faker";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockDryRunSubmission,
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
  Application,
  ApplicationStatus,
  DynamicFormConfiguration,
  DynamicFormType,
  SupportingUser,
  SupportingUserType,
} from "@sims/sims-db";
import { ReportedSupportingUserAPIInDTO } from "../../../../route-controllers";
import { AppStudentsModule } from "../../../../app.students.module";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";

describe("SupportingUserStudentsController(e2e)-submitSupportingUserDetails", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let recentPYParentForm: DynamicFormConfiguration;
  let zeebeClient: ZeebeGrpcClient;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    zeebeClient = app.get(ZeebeGrpcClient);
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

  it(
    "Should throw not found error when trying to update supporting user details of a supporting user who is a parent and" +
      " the supporting user is associated to the student submitted application but" +
      " the supporting user is able to report.",
    async () => {
      // Arrange
      // Create fake application and supporting user.
      // The supporting user is able to report and student is not allowed to submit supporting data.
      const { application, supportingUser: parent } =
        await createApplicationAndSupportingUser({ isAbleToReport: true });
      const student = application.student;
      // Mock student user token.
      await mockJWTUserInfo(appModule, student.user);
      const endpoint = `/students/supporting-user/${parent.id}`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock dry run submission.
      const payload = createSupportingUserPayload();
      await mockDryRunSubmission(
        appModule,
        AppStudentsModule,
        recentPYParentForm.formDefinitionName,
        payload,
      );
      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.NOT_FOUND)
        .expect({
          statusCode: HttpStatus.NOT_FOUND,
          message:
            "Supporting user not found or not eligible to be accessed by the user.",
          error: "Not Found",
        });
    },
  );

  it(
    "Should throw unprocessable entity error when trying to update supporting user details of a supporting user who is a parent and" +
      " the supporting user is associated to the student submitted application and" +
      " the supporting user is not able to report but supporting data has already been submitted.",
    async () => {
      // Arrange
      // Create fake application and supporting user.
      const { application, supportingUser: parent } =
        await createApplicationAndSupportingUser();
      const student = application.student;
      // Mock student user token.
      await mockJWTUserInfo(appModule, student.user);
      const endpoint = `/students/supporting-user/${parent.id}`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Update supporting data.
      parent.supportingData = { someFakeData: "someFakeData" };
      await db.supportingUser.save(parent);
      // Mock dry run submission.
      const payload = createSupportingUserPayload();
      await mockDryRunSubmission(
        appModule,
        AppStudentsModule,
        recentPYParentForm.formDefinitionName,
        payload,
      );
      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message:
            "Supporting data has already been submitted for this supporting user.",
          error: "Unprocessable Entity",
        });
    },
  );

  it(
    "Should throw bad request error when trying to update supporting user details of a supporting user who is a parent and" +
      " the supporting user is associated to the student submitted application and" +
      " the supporting user is not able to report but submitted data is invalid.",
    async () => {
      // Arrange
      // Create fake application and supporting user.
      const { application, supportingUser: parent } =
        await createApplicationAndSupportingUser();
      const student = application.student;
      // Mock student user token.
      await mockJWTUserInfo(appModule, student.user);
      const endpoint = `/students/supporting-user/${parent.id}`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock dry run submission.
      const payload = createSupportingUserPayload();
      // Mock invalid dry run submission.
      await mockDryRunSubmission(
        appModule,
        AppStudentsModule,
        recentPYParentForm.formDefinitionName,
        payload,
        { valid: false },
      );
      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          statusCode: HttpStatus.BAD_REQUEST,
          message:
            "Not able to update supporting user data due to an invalid request.",
          error: "Bad Request",
        });
    },
  );

  it(
    "Should update the supporting user details when the supporting user is a parent and" +
      " the supporting user is associated to the student submitted application and" +
      " the supporting user is not able to report.",
    async () => {
      // Arrange
      // Create fake application and supporting user.
      const { application, supportingUser: parent } =
        await createApplicationAndSupportingUser();
      const student = application.student;
      // Mock student user token.
      await mockJWTUserInfo(appModule, student.user);
      const endpoint = `/students/supporting-user/${parent.id}`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock dry run submission.
      const payload = createSupportingUserPayload();
      await mockDryRunSubmission(
        appModule,
        AppStudentsModule,
        recentPYParentForm.formDefinitionName,
        payload,
      );

      // Act
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({});

      // Assert
      const updatedSupportingUser = await db.supportingUser.findOne({
        select: {
          id: true,
          personalInfo: true,
          contactInfo: true,
          supportingData: true,
          modifier: { id: true },
        },
        relations: { modifier: true },
        where: { id: parent.id },
      });
      // Assert supporting user reported details.
      expect(updatedSupportingUser).toEqual({
        id: parent.id,
        personalInfo: {
          givenNames: payload.givenNames,
          lastName: payload.lastName,
        },
        contactInfo: {
          address: {
            city: payload.city,
            country: payload.country,
            postalCode: payload.postalCode,
            addressLine1: payload.addressLine1,
            provinceState: payload.provinceState,
          },
          phone: payload.phone,
        },
        supportingData: payload.supportingData,
        modifier: { id: student.user.id },
      });
      // Assert workflow message.
      expect(zeebeClient.publishMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationKey: parent.id.toString(),
          name: "supporting-user-info-received",
          variables: {},
        }),
      );
    },
  );

  it(
    "Should update the supporting user details when the supporting user is a partner and" +
      " the supporting user is associated to the student submitted application and" +
      " the supporting user is not able to report.",
    async () => {
      // Arrange
      // Create fake application and supporting user.
      const { application, supportingUser: partner } =
        await createApplicationAndSupportingUser({
          supportingUserType: SupportingUserType.Partner,
        });
      const student = application.student;
      // Mock student user token.
      await mockJWTUserInfo(appModule, student.user);
      const endpoint = `/students/supporting-user/${partner.id}`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock dry run submission.
      const payload = createSupportingUserPayload();
      await mockDryRunSubmission(
        appModule,
        AppStudentsModule,
        recentPYParentForm.formDefinitionName,
        payload,
      );

      // Act
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({});

      // Assert
      const updatedSupportingUser = await db.supportingUser.findOne({
        select: {
          id: true,
          personalInfo: true,
          contactInfo: true,
          supportingData: true,
          modifier: { id: true },
        },
        relations: { modifier: true },
        where: { id: partner.id },
      });
      // Assert supporting user reported details.
      expect(updatedSupportingUser).toEqual({
        id: partner.id,
        personalInfo: {
          givenNames: payload.givenNames,
          lastName: payload.lastName,
        },
        contactInfo: {
          address: {
            city: payload.city,
            country: payload.country,
            postalCode: payload.postalCode,
            addressLine1: payload.addressLine1,
            provinceState: payload.provinceState,
          },
          phone: payload.phone,
        },
        supportingData: payload.supportingData,
        modifier: { id: student.user.id },
      });
      // Assert workflow message.
      expect(zeebeClient.publishMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationKey: partner.id.toString(),
          name: "supporting-user-info-received",
          variables: {},
        }),
      );
    },
  );

  /**
   * Create fake application and supporting user.
   * @param options options.
   *  - `isAbleToReport` is supporting user able to report.
   * @returns application and supporting user.
   */
  async function createApplicationAndSupportingUser(options?: {
    isAbleToReport?: boolean;
    applicationStatus?: ApplicationStatus;
    supportingUserType?: SupportingUserType;
  }): Promise<{ application: Application; supportingUser: SupportingUser }> {
    // Arrange
    // Create fake application.
    const application = await saveFakeApplication(
      db.dataSource,
      {
        programYear: recentPYParentForm.programYear,
      },
      {
        initialValues: {
          applicationStatus:
            options?.applicationStatus ?? ApplicationStatus.InProgress,
        },
      },
    );
    // Create fake supporting user parent.
    const parentFullName = faker.string.alpha({ length: 50 });
    const supportingUser = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          isAbleToReport: options?.isAbleToReport ?? false,
          supportingUserType:
            options?.supportingUserType ?? SupportingUserType.Parent,
          fullName: parentFullName,
        },
      },
    );
    await db.supportingUser.save(supportingUser);
    return { application, supportingUser };
  }

  /**
   * Create supporting user payload.
   * @returns supporting user payload
   */
  function createSupportingUserPayload(): ReportedSupportingUserAPIInDTO {
    return {
      givenNames: faker.string.alpha({ length: 100 }),
      lastName: faker.string.alpha({ length: 100 }),
      addressLine1: faker.location.streetAddress(),
      city: faker.location.city(),
      country: "Canada",
      phone: faker.phone.number({ style: "national" }),
      postalCode: faker.location.zipCode(),
      provinceState: faker.location.state(),
      supportingData: { totalIncome: 1000 },
    };
  }

  afterAll(async () => {
    await app?.close();
  });
});
