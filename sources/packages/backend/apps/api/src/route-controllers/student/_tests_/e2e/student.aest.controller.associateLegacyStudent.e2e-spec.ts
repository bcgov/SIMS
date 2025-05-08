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
  createFakeSFASRestriction,
} from "@sims/test-utils";
import * as faker from "faker";
import { getISODateOnlyString } from "@sims/utilities";
import { NoteType } from "@sims/sims-db";

const UNIQUE_SIN = "#1234567#";
const UNIQUE_SFAS_RESTRICTION_ID = 999955551;

describe("StudentAESTController(e2e)-associateLegacyStudent", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    await Promise.all([
      db.sfasIndividual.delete({ sin: UNIQUE_SIN }),
      db.sfasRestriction.delete({ id: UNIQUE_SFAS_RESTRICTION_ID }),
    ]);
  });

  it(
    "Should associate a student to a legacy profile, create a note, and set restriction as processed false" +
      " when the student is not associated yet to a legacy profile and a legacy profile is a potential match.",
    async () => {
      // Arrange.
      const user = createFakeUser();
      const userLastName = faker.datatype.uuid();
      user.lastName = userLastName;
      const birthDate = getISODateOnlyString(new Date());
      const student = await saveFakeStudent(
        db.dataSource,
        { user },
        { initialValue: { birthDate } },
      );
      const legacyProfileMatch = await saveFakeSFASIndividual(db.dataSource, {
        initialValues: { lastName: userLastName, birthDate },
      });
      const processedSFASRestriction = createFakeSFASRestriction({
        initialValues: {
          id: UNIQUE_SFAS_RESTRICTION_ID,
          individualId: legacyProfileMatch.id,
          processed: true,
        },
      });
      await db.sfasRestriction.save(processedSFASRestriction);

      const aestUserToken = await getAESTToken(
        AESTGroups.BusinessAdministrators,
      );
      const payload = {
        individualId: legacyProfileMatch.id,
        noteDescription: faker.datatype.uuid(),
      };
      const endpoint = `/aest/student/${student.id}/legacy-match`;

      // Act/Assert.
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(aestUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
      // Validates legacy profile update.
      const updateSFASIndividual = await db.sfasIndividual.findOne({
        select: {
          id: true,
          student: { id: true },
        },
        relations: {
          student: true,
        },
        where: {
          id: legacyProfileMatch.id,
        },
      });
      expect(updateSFASIndividual.student.id).toBe(student.id);
      // Validates restriction update.
      const updatedSFASRestriction = await db.sfasRestriction.findOne({
        select: {
          id: true,
          processed: true,
        },
        where: {
          id: processedSFASRestriction.id,
        },
      });
      expect(updatedSFASRestriction.processed).toBe(false);
      // Validates student note creation.
      const studentNote = await db.student.findOne({
        select: {
          id: true,
          notes: {
            id: true,
            description: true,
            noteType: true,
          },
        },
        relations: {
          notes: true,
        },
        where: {
          id: student.id,
        },
        loadEagerRelations: false,
      });
      expect(studentNote).toEqual({
        id: student.id,
        notes: [
          {
            id: expect.any(Number),
            description: payload.noteDescription,
            noteType: NoteType.General,
          },
        ],
      });
    },
  );

  it("Should throw an NotFoundException when the student does not exists.", async () => {
    // Arrange.
    // Ministry user token.
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Endpoint to test.
    const endpoint = `/aest/student/99999999/legacy-match`;

    // Act/Assert.
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({
        individualId: 1,
        noteDescription: "some description",
      })
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
