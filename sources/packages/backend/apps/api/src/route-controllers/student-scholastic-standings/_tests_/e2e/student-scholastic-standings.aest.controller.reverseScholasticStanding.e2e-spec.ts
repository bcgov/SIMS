import { HttpStatus, INestApplication } from "@nestjs/common";
import MockDate from "mockdate";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentScholasticStanding,
  createFakeUser,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import * as request from "supertest";
import {
  ApplicationStatus,
  NoteType,
  StudentScholasticStandingChangeType,
} from "@sims/sims-db";

describe("StudentScholasticStandingsAESTController(e2e)-reverseScholasticStanding.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  const payload = { note: "Reversal note" };

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  afterEach(async () => {
    // Reset the current date mock.
    MockDate.reset();
  });

  it(
    "Should reverse an active scholastic standing change and create a student note for an application" +
      ` when the scholastic standing change type is ${StudentScholasticStandingChangeType.StudentDidNotCompleteProgram}.`,
    async () => {
      // Arrange
      // Create an application with a completed status to have a scholastic standing associated with it.
      const application = await saveFakeApplication(db.dataSource, undefined, {
        applicationStatus: ApplicationStatus.Completed,
      });

      // Create a scholastic standing with the change type 'Student did not complete program'.
      const institutionUser = createFakeUser();
      await db.user.save(institutionUser);
      const scholasticStanding = createFakeStudentScholasticStanding(
        {
          submittedBy: institutionUser,
          application,
        },
        {
          initialValues: {
            changeType:
              StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
          },
        },
      );
      await db.studentScholasticStanding.save(scholasticStanding);

      const endpoint = `/aest/scholastic-standing/${scholasticStanding.id}/reverse`;
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      const now = new Date();
      // Mock the current date to validate the reversal date.
      MockDate.set(now);

      const ministryUser = await getAESTUser(
        db.dataSource,
        AESTGroups.BusinessAdministrators,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({});

      // Assert the scholastic standing reversal.
      const reversedScholasticStanding =
        await db.studentScholasticStanding.findOne({
          select: {
            id: true,
            reversalDate: true,
            reversalBy: { id: true },
            reversalNote: { id: true, noteType: true, description: true },
          },
          relations: { reversalBy: true, reversalNote: true },
          where: { id: scholasticStanding.id },
        });

      expect(reversedScholasticStanding).toEqual({
        id: scholasticStanding.id,
        reversalDate: now.toISOString(),
        reversalBy: { id: ministryUser.id },
        reversalNote: {
          id: expect.any(Number),
          noteType: NoteType.Application,
          description: payload.note,
        },
      });

      // Assert that the note is created for the application student.
      const studentWithNote = await db.student.findOne({
        select: { id: true, notes: { id: true } },
        relations: { notes: true },
        where: { id: application.student.id },
      });

      expect(studentWithNote.notes).toEqual([
        { id: reversedScholasticStanding.reversalNote.id },
      ]);
    },
  );
});
