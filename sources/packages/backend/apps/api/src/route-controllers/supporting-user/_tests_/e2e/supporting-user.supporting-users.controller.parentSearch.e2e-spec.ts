import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import {
    BEARER_AUTH_TYPE,
    createTestingAppModule,
    FakeSupportingUserTypes,
    getSupportingUserToken,
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
    ApplicationStatus, SupportingUserType
} from "@sims/sims-db";

describe("SupportingUserSupportingUsersController(e2e)-ParentSearch", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
  });

  beforeEach(() => {
    resetMockJWTUserInfo(appModule);
  });

  it("Should find application for parent using exact case-insensitive parent full name match", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.InProgress,
    });
    
    const parentFullName = "John Smith";
    const parent = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Parent,
          fullName: parentFullName,
          isAbleToReport: true,
        },
      },
    );
    await db.supportingUser.save(parent);

    // Mock supporting user token
    await mockJWTUserInfo(appModule, parent.user);
    
    const searchPayload = {
      applicationNumber: application.applicationNumber,
      studentsLastName: application.student.user.lastName,
      parentFullName: "john smith", // Different case
      supportingUserType: SupportingUserType.Parent,
    };

    const token = await getSupportingUserToken(
      FakeSupportingUserTypes.FakeSupportingUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(`/supporting-user/${SupportingUserType.Parent}/application`)
      .send(searchPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toHaveProperty("programYearStartDate");
        expect(res.body).toHaveProperty("formName");
        expect(res.body).toHaveProperty("offeringIntensity");
      });
  });

  it("Should find application for parent using exact case-insensitive parent full name match with mixed case", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.InProgress,
    });
    
    const parentFullName = "John Smith";
    const parent = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Parent,
          fullName: parentFullName,
          isAbleToReport: true,
        },
      },
    );
    await db.supportingUser.save(parent);

    // Mock supporting user token
    await mockJWTUserInfo(appModule, parent.user);
    
    const searchPayload = {
      applicationNumber: application.applicationNumber,
      studentsLastName: application.student.user.lastName,
      parentFullName: "JOHN SMITH", // All uppercase
      supportingUserType: SupportingUserType.Parent,
    };

    const token = await getSupportingUserToken(
      FakeSupportingUserTypes.FakeSupportingUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(`/supporting-user/${SupportingUserType.Parent}/application`)
      .send(searchPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toHaveProperty("programYearStartDate");
        expect(res.body).toHaveProperty("formName");
        expect(res.body).toHaveProperty("offeringIntensity");
      });
  });

  it("Should not find application for parent when parent is not able to report", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.InProgress,
    });
    
    const parentFullName = "John Smith";
    const parent = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Parent,
          fullName: parentFullName,
          isAbleToReport: false, // Parent cannot report
        },
      },
    );
    await db.supportingUser.save(parent);

    // Mock supporting user token
    await mockJWTUserInfo(appModule, parent.user);
    
    const searchPayload = {
      applicationNumber: application.applicationNumber,
      studentsLastName: application.student.user.lastName,
      parentFullName: parentFullName,
      supportingUserType: SupportingUserType.Parent,
    };

    const token = await getSupportingUserToken(
      FakeSupportingUserTypes.FakeSupportingUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(`/supporting-user/${SupportingUserType.Parent}/application`)
      .send(searchPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect((res) => {
        expect(res.body.message).toContain("Not able to find a Student Application with the provided data");
      });
  });

  it("Should not find application when parent full name does not match exactly", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.InProgress,
    });
    
    const parentFullName = "John Smith";
    const parent = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Parent,
          fullName: parentFullName,
          isAbleToReport: true,
        },
      },
    );
    await db.supportingUser.save(parent);

    // Mock supporting user token
    await mockJWTUserInfo(appModule, parent.user);
    
    const searchPayload = {
      applicationNumber: application.applicationNumber,
      studentsLastName: application.student.user.lastName,
      parentFullName: "John Smith Jr", // Different name
      supportingUserType: SupportingUserType.Parent,
    };

    const token = await getSupportingUserToken(
      FakeSupportingUserTypes.FakeSupportingUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(`/supporting-user/${SupportingUserType.Parent}/application`)
      .send(searchPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect((res) => {
        expect(res.body.message).toContain("Not able to find a Student Application with the provided data");
      });
  });

  it("Should not find application when parent full name is completely different", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.InProgress,
    });
    
    const parentFullName = "John Smith";
    const parent = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Parent,
          fullName: parentFullName,
          isAbleToReport: true,
        },
      },
    );
    await db.supportingUser.save(parent);

    // Mock supporting user token
    await mockJWTUserInfo(appModule, parent.user);
    
    const searchPayload = {
      applicationNumber: application.applicationNumber,
      studentsLastName: application.student.user.lastName,
      parentFullName: "Jane Doe", // Completely different name
      supportingUserType: SupportingUserType.Parent,
    };

    const token = await getSupportingUserToken(
      FakeSupportingUserTypes.FakeSupportingUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(`/supporting-user/${SupportingUserType.Parent}/application`)
      .send(searchPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect((res) => {
        expect(res.body.message).toContain("Not able to find a Student Application with the provided data");
      });
  });

  it("Should not find application when application number is incorrect", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.InProgress,
    });
    
    const parentFullName = "John Smith";
    const parent = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Parent,
          fullName: parentFullName,
          isAbleToReport: true,
        },
      },
    );
    await db.supportingUser.save(parent);

    // Mock supporting user token
    await mockJWTUserInfo(appModule, parent.user);
    
    const searchPayload = {
      applicationNumber: "1234567890", // Wrong application number
      studentsLastName: application.student.user.lastName,
      parentFullName: parentFullName,
      supportingUserType: SupportingUserType.Parent,
    };

    const token = await getSupportingUserToken(
      FakeSupportingUserTypes.FakeSupportingUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(`/supporting-user/${SupportingUserType.Parent}/application`)
      .send(searchPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect((res) => {
        expect(res.body.message).toContain("Not able to find a Student Application with the provided data");
      });
  });

  it("Should not find application when student last name is incorrect", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.InProgress,
    });
    
    const parentFullName = "John Smith";
    const parent = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Parent,
          fullName: parentFullName,
          isAbleToReport: true,
        },
      },
    );
    await db.supportingUser.save(parent);

    // Mock supporting user token
    await mockJWTUserInfo(appModule, parent.user);
    
    const searchPayload = {
      applicationNumber: application.applicationNumber,
      studentsLastName: "WrongLastName", // Wrong last name
      parentFullName: parentFullName,
      supportingUserType: SupportingUserType.Parent,
    };

    const token = await getSupportingUserToken(
      FakeSupportingUserTypes.FakeSupportingUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(`/supporting-user/${SupportingUserType.Parent}/application`)
      .send(searchPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect((res) => {
        expect(res.body.message).toContain("Not able to find a Student Application with the provided data");
      });
  });

  it("Should find application for parent with special characters in full name", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.InProgress,
    });
    
    const parentFullName = "Jean-Pierre O'Connor";
    const parent = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Parent,
          fullName: parentFullName,
          isAbleToReport: true,
        },
      },
    );
    await db.supportingUser.save(parent);

    // Mock supporting user token
    await mockJWTUserInfo(appModule, parent.user);
    
    const searchPayload = {
      applicationNumber: application.applicationNumber,
      studentsLastName: application.student.user.lastName,
      parentFullName: "jean-pierre o'connor", // Different case
      supportingUserType: SupportingUserType.Parent,
    };

    const token = await getSupportingUserToken(
      FakeSupportingUserTypes.FakeSupportingUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(`/supporting-user/${SupportingUserType.Parent}/application`)
      .send(searchPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toHaveProperty("programYearStartDate");
        expect(res.body).toHaveProperty("formName");
        expect(res.body).toHaveProperty("offeringIntensity");
      });
  });

  it("Should find application for parent with multiple spaces in full name", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.InProgress,
    });
    
    const parentFullName = "Mary  Jane  Wilson"; // Multiple spaces
    const parent = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Parent,
          fullName: parentFullName,
          isAbleToReport: true,
        },
      },
    );
    await db.supportingUser.save(parent);

    // Mock supporting user token
    await mockJWTUserInfo(appModule, parent.user);
    
    const searchPayload = {
      applicationNumber: application.applicationNumber,
      studentsLastName: application.student.user.lastName,
      parentFullName: "mary  jane  wilson", // Different case
      supportingUserType: SupportingUserType.Parent,
    };

    const token = await getSupportingUserToken(
      FakeSupportingUserTypes.FakeSupportingUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(`/supporting-user/${SupportingUserType.Parent}/application`)
      .send(searchPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toHaveProperty("programYearStartDate");
        expect(res.body).toHaveProperty("formName");
        expect(res.body).toHaveProperty("offeringIntensity");
      });
  });

  afterAll(async () => {
    await app?.close();
  });
}); 