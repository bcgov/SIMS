import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  AESTGroups,
} from "../../../../testHelpers";
import {
  saveFakeStudent,
  saveFakeSFASIndividual,
  E2EDataSources,
  createE2EDataSources,
  createFakeUser,
} from "@sims/test-utils";
import * as faker from "faker";
import { getISODateOnlyString } from "@sims/utilities";

const UNIQUE_SIN = "#1234567#";

describe("StudentAESTController(e2e)-getStudentLegacyMatches", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    await db.sfasIndividual.delete({ sin: UNIQUE_SIN });
  });

  it("Should get potential student matches from legacy when there is an exact SIN match.", async () => {
    // Arrange.
    const sfasIndividualMatch = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: { sin: UNIQUE_SIN },
    });
    const student = await saveFakeStudent(db.dataSource, null, {
      sinValidationInitialValue: { sin: UNIQUE_SIN },
    });

    // Ministry user token.
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Endpoint to test.
    const endpoint = `/aest/student/${student.id}/legacy-match`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        matches: [
          {
            individualId: sfasIndividualMatch.id,
            firstName: sfasIndividualMatch.firstName,
            lastName: sfasIndividualMatch.lastName,
            birthDate: sfasIndividualMatch.birthDate,
            sin: UNIQUE_SIN,
          },
        ],
      });
  });

  it("Should not get a potential student match from legacy when there is an exact SIN match but there is already a student associated with.", async () => {
    // Arrange.
    const alreadyAssociatedStudent = await saveFakeStudent(db.dataSource);
    await saveFakeSFASIndividual(db.dataSource, {
      initialValues: { sin: UNIQUE_SIN, student: alreadyAssociatedStudent },
    });
    const student = await saveFakeStudent(db.dataSource, null, {
      sinValidationInitialValue: { sin: UNIQUE_SIN },
    });

    // Ministry user token.
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Endpoint to test.
    const endpoint = `/aest/student/${student.id}/legacy-match`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        matches: [],
      });
  });

  it("Should throw an UnprocessableEntityException when the student requesting potential matches is already linked to a legacy profile.", async () => {
    // Arrange.
    const student = await saveFakeStudent(db.dataSource, null, {
      sinValidationInitialValue: { sin: UNIQUE_SIN },
    });
    await saveFakeSFASIndividual(db.dataSource, {
      initialValues: { sin: UNIQUE_SIN, student },
    });
    // Ministry user token.
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Endpoint to test.
    const endpoint = `/aest/student/${student.id}/legacy-match`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "Student already has a legacy profile associated.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should get potential student matches from legacy when there is an exact last name (case insensitive) and DOB match.", async () => {
    // Arrange.
    const user = createFakeUser();
    const userLastName = faker.datatype.uuid();
    user.lastName = userLastName.toLowerCase();
    const birthDate = getISODateOnlyString(new Date());
    const student = await saveFakeStudent(
      db.dataSource,
      { user },
      { initialValue: { birthDate } },
    );
    const sfasIndividualMatch = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: { lastName: userLastName.toUpperCase(), birthDate },
    });

    // Ministry user token.
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Endpoint to test.
    const endpoint = `/aest/student/${student.id}/legacy-match`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        matches: [
          {
            individualId: sfasIndividualMatch.id,
            firstName: sfasIndividualMatch.firstName,
            lastName: sfasIndividualMatch.lastName,
            birthDate: sfasIndividualMatch.birthDate,
            sin: sfasIndividualMatch.sin,
          },
        ],
      });
  });

  it("Should throw an NotFoundException when the student does not exists.", async () => {
    // Arrange.
    // Ministry user token.
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Endpoint to test.
    const endpoint = `/aest/student/99999999/legacy-match`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Student not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
