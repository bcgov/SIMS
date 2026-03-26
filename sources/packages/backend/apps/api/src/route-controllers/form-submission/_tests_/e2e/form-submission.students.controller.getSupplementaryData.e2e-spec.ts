import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentByFakeStudentUserType,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import { KnownSupplementaryDataKey } from "../../../../services";
import {
  createE2EDataSources,
  createFakeSupportingUser,
  createFakeStudentScholasticStanding,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import {
  StudentScholasticStandingChangeType,
  SupportingUserType,
} from "@sims/sims-db";

describe("FormSubmissionStudentsController(e2e)-getSupplementaryData", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    await resetMockJWTUserInfo(appModule);
  });

  describe(`Supplementary data validations for ${KnownSupplementaryDataKey.ProgramYear}.`, () => {
    it(`Should get supplementary data for ${KnownSupplementaryDataKey.ProgramYear} when the application exists.`, async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const endpoint = `/students/form-submission/supplementary-data?dataKeys=${KnownSupplementaryDataKey.ProgramYear}&applicationId=${application.id}`;
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock the user received in the token.
      await mockJWTUserInfo(appModule, application.student.user);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({ formData: { programYear: "2022-2023" } });
    });

    it(`Should throw an unprocessable entity exception when the application is not associated with the student requesting the supplementary data for ${KnownSupplementaryDataKey.ProgramYear}.`, async () => {
      const application = await saveFakeApplication(db.dataSource);

      // Arrange
      const endpoint = `/students/form-submission/supplementary-data?dataKeys=${KnownSupplementaryDataKey.ProgramYear}&applicationId=${application.id}`;
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Authenticated student is different from the student associated with the application.
      const student = await getStudentByFakeStudentUserType(
        FakeStudentUsersTypes.FakeStudentUserType1,
        db.dataSource,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          message: `Supplementary data '${KnownSupplementaryDataKey.ProgramYear}' not found. Student ID ${student.id}, application ID ${application.id}.`,
          error: "Unprocessable Entity",
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
    });

    it(`Should throw an unprocessable entity exception when requesting supplementary data for ${KnownSupplementaryDataKey.ProgramYear} and an application ID was not provided.`, async () => {
      // Arrange
      const endpoint = `/students/form-submission/supplementary-data?dataKeys=${KnownSupplementaryDataKey.ProgramYear}`;
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          message: `Application ID is required to load supplementary data for key '${KnownSupplementaryDataKey.ProgramYear}'.`,
          error: "Unprocessable Entity",
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
    });
  });

  describe(`Supplementary data validations for ${KnownSupplementaryDataKey.Parents}.`, () => {
    it(`Should get supplementary data for ${KnownSupplementaryDataKey.Parents} when the application has supporting users parents.`, async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      // Create supporting users.
      const [parent1, parent2] = Array.from({ length: 2 }, (_, index) =>
        createFakeSupportingUser(
          { application },
          {
            initialValues: {
              supportingUserType: SupportingUserType.Parent,
              fullName: `Parent ${index + 1}`,
            },
          },
        ),
      );
      await db.supportingUser.save([parent1, parent2]);

      const endpoint = `/students/form-submission/supplementary-data?dataKeys=${KnownSupplementaryDataKey.Parents}&applicationId=${application.id}`;
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock the user received in the token.
      await mockJWTUserInfo(appModule, application.student.user);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          formData: {
            parents: [
              { id: parent1.id, fullName: parent1.fullName },
              { id: parent2.id, fullName: parent2.fullName },
            ],
          },
        });
    });

    it(`Should throw an unprocessable entity exception when requesting supplementary data for ${KnownSupplementaryDataKey.Parents} for an application that has no supporting users.`, async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const endpoint = `/students/form-submission/supplementary-data?dataKeys=${KnownSupplementaryDataKey.Parents}&applicationId=${application.id}`;
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock the user received in the token.
      await mockJWTUserInfo(appModule, application.student.user);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          message: `Supplementary data '${KnownSupplementaryDataKey.Parents}' not found. Student ID ${application.student.id}, application ID ${application.id}.`,
          error: "Unprocessable Entity",
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
    });

    it(`Should throw an unprocessable entity exception when requesting supplementary data for ${KnownSupplementaryDataKey.Parents} and an application ID was not provided.`, async () => {
      // Arrange
      const endpoint = `/students/form-submission/supplementary-data?dataKeys=${KnownSupplementaryDataKey.Parents}`;
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          message: `Application ID is required to load supplementary data for key '${KnownSupplementaryDataKey.Parents}'.`,
          error: "Unprocessable Entity",
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
    });
  });

  describe(`Supplementary data validations for ${KnownSupplementaryDataKey.ScholasticStandingWithdrawals}.`, () => {
    it(`Should get supplementary data for ${KnownSupplementaryDataKey.ScholasticStandingWithdrawals} when there is a scholastic standing of change type ${StudentScholasticStandingChangeType.StudentWithdrewFromProgram} that is not reversed and a non punitive withdrawal form has not been previously submitted for this application.`, async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const scholasticStanding = createFakeStudentScholasticStanding(
        { submittedBy: application.student.user, application },
        {
          initialValues: {
            changeType:
              StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
          },
        },
      );
      const savedScholasticStanding =
        await db.studentScholasticStanding.save(scholasticStanding);
      // Link the assessment to the scholastic standing.
      application.currentAssessment.studentScholasticStanding =
        savedScholasticStanding;
      await db.studentAssessment.save(application.currentAssessment);
      const endpoint = `/students/form-submission/supplementary-data?dataKeys=${KnownSupplementaryDataKey.ScholasticStandingWithdrawals}`;
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock the user received in the token.
      await mockJWTUserInfo(appModule, application.student.user);

      // Act/Assert
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
      expect(response.body).toStrictEqual({
        formData: {
          scholasticStandingWithdrawals: [
            {
              applicationNumber: application.applicationNumber,
              scholasticStandingId: savedScholasticStanding.id,
            },
          ],
        },
      });
    });

    it(`Should not return supplementary data for ${KnownSupplementaryDataKey.ScholasticStandingWithdrawals} when the ${StudentScholasticStandingChangeType.StudentWithdrewFromProgram} scholastic standing is reversed.`, async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const scholasticStanding = createFakeStudentScholasticStanding(
        { submittedBy: application.student.user, application },
        {
          initialValues: {
            changeType:
              StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
            reversalDate: new Date(),
          },
        },
      );
      const savedScholasticStanding =
        await db.studentScholasticStanding.save(scholasticStanding);
      // Link the assessment to the scholastic standing.
      application.currentAssessment.studentScholasticStanding =
        savedScholasticStanding;
      await db.studentAssessment.save(application.currentAssessment);
      const endpoint = `/students/form-submission/supplementary-data?dataKeys=${KnownSupplementaryDataKey.ScholasticStandingWithdrawals}`;
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock the user received in the token.
      await mockJWTUserInfo(appModule, application.student.user);

      // Act/Assert
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
      expect(response.body).toStrictEqual({
        formData: { scholasticStandingWithdrawals: [] },
      });
    });

    it(`Should not return supplementary data for ${KnownSupplementaryDataKey.ScholasticStandingWithdrawals} when the ${StudentScholasticStandingChangeType.StudentWithdrewFromProgram} scholastic standing has a non punitive withdrawal form that is previously submitted for this application.`, async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const scholasticStanding = createFakeStudentScholasticStanding(
        { submittedBy: application.student.user, application },
        {
          initialValues: {
            changeType:
              StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
            nonPunitiveFormSubmissionItemId: 1,
          },
        },
      );
      const savedScholasticStanding =
        await db.studentScholasticStanding.save(scholasticStanding);
      // Link the assessment to the scholastic standing.
      application.currentAssessment.studentScholasticStanding =
        savedScholasticStanding;
      await db.studentAssessment.save(application.currentAssessment);
      const endpoint = `/students/form-submission/supplementary-data?dataKeys=${KnownSupplementaryDataKey.ScholasticStandingWithdrawals}`;
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock the user received in the token.
      await mockJWTUserInfo(appModule, application.student.user);

      // Act/Assert
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
      expect(response.body).toStrictEqual({
        formData: { scholasticStandingWithdrawals: [] },
      });
    });
  });

  describe(`Supplementary data validations common for all data keys.`, () => {
    it("Should get supplementary data for two different data keys when two data keys are provided and the data is available.", async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      // Create supporting users.
      const parent = createFakeSupportingUser(
        { application },
        {
          initialValues: {
            supportingUserType: SupportingUserType.Parent,
            fullName: "Parent 1",
          },
        },
      );
      await db.supportingUser.save([parent]);

      const endpoint = `/students/form-submission/supplementary-data?dataKeys=${KnownSupplementaryDataKey.Parents},${KnownSupplementaryDataKey.ProgramYear}&applicationId=${application.id}`;
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock the user received in the token.
      await mockJWTUserInfo(appModule, application.student.user);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          formData: {
            parents: [{ id: parent.id, fullName: parent.fullName }],
            programYear: "2022-2023",
          },
        });
    });

    it("Should throw a bad request exception when no dataKeys are provided.", async () => {
      // Arrange
      const endpoint = `/students/form-submission/supplementary-data?applicationId=9999`;
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message: [
            "each value in dataKeys must be one of the following values: programYear, parents, scholasticStandingWithdrawals",
            "dataKeys must contain no more than 10 elements",
            "dataKeys must contain at least 1 elements",
          ],
          error: "Bad Request",
          statusCode: HttpStatus.BAD_REQUEST,
        });
    });

    it("Should throw a bad request exception when an invalid dataKey is provided.", async () => {
      // Arrange
      const endpoint = `/students/form-submission/supplementary-data?dataKeys=invalidKey`;
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message: [
            "each value in dataKeys must be one of the following values: programYear, parents, scholasticStandingWithdrawals",
          ],
          error: "Bad Request",
          statusCode: HttpStatus.BAD_REQUEST,
        });
    });
  });

  afterAll(async () => {
    await app?.close();
  });
});
