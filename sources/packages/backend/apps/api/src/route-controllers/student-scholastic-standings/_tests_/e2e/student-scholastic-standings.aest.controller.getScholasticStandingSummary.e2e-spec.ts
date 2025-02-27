import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentScholasticStanding,
  saveFakeApplication,
  saveFakeStudent,
  saveFakeSFASIndividual,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import * as request from "supertest";

describe("StudentScholasticStandingsAESTController(e2e)-getScholasticStandingSummary.", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should get the scholastic standing summary for the provided student including the data retrieved from the sfas system when a ministry user requests it.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const application = await saveFakeApplication(db.dataSource, {
      student,
    });
    const scholasticStanding = createFakeStudentScholasticStanding(
      { submittedBy: student.user, application },
      {
        initialValues: { unsuccessfulWeeks: 15 },
      },
    );
    await db.studentScholasticStanding.save(scholasticStanding);
    await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        lastName: student.user.lastName,
        birthDate: student.birthDate,
        sin: student.sinValidation.sin,
        student,
        unsuccessfulCompletion: 12,
      },
    });
    const endpoint = `/aest/scholastic-standing/summary/student/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({ lifetimeUnsuccessfulCompletionWeeks: 27 });
  });

  it("Should not retrieve the sfas system data as a part of the scholastic standing summary for the provided student when the combination of birth date, last name and sin provided does not exist in the SFAS relations.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const application = await saveFakeApplication(db.dataSource, {
      student,
    });
    const scholasticStanding = createFakeStudentScholasticStanding(
      { submittedBy: student.user, application },
      {
        initialValues: { unsuccessfulWeeks: 15 },
      },
    );
    await db.studentScholasticStanding.save(scholasticStanding);
    await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        lastName: student.user.lastName,
        birthDate: new Date().toISOString(),
        sin: student.sinValidation.sin,
        unsuccessfulCompletion: 12,
      },
    });
    const endpoint = `/aest/scholastic-standing/summary/student/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({ lifetimeUnsuccessfulCompletionWeeks: 15 });
  });
});
