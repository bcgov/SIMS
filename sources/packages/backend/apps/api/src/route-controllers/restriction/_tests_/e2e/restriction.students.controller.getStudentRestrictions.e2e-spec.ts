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
  createE2EDataSources,
  E2EDataSources,
  RestrictionCode,
  saveFakeStudent,
  saveFakeStudentRestriction,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import { In } from "typeorm";
import { RestrictionNotificationType } from "@sims/sims-db";

describe("RestrictionStudentsController(e2e)-getStudentRestrictions", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;
  const endpoint = "/students/restriction";

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    appModule = module;
  });

  it("Should get the active student restrictions including legacy restrictions when the student has active student restrictions.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Restrictions to be associated with the student.
    const restrictions = await db.restriction.find({
      select: {
        id: true,
      },
      where: {
        restrictionCode: In([
          RestrictionCode.B6A,
          RestrictionCode.LGCYAAAA,
          RestrictionCode.LGCYBBBB,
          RestrictionCode.LGCYCCCC,
        ]),
      },
    });
    // Associate all restriction with the student.
    const savePromises = restrictions.map((restriction) =>
      saveFakeStudentRestriction(db.dataSource, {
        restriction,
        student,
      }),
    );
    await Promise.all(savePromises);

    // Mock user service to return the saved student.
    await mockUserLoginInfo(appModule, student);

    // Get any student user token.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([
        { code: RestrictionCode.B6A, type: RestrictionNotificationType.Error },
        { code: RestrictionCode.LGCY, type: RestrictionNotificationType.Error },
      ]);
  });

  afterAll(async () => {
    await app?.close();
  });
});
