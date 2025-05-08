import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  AESTGroups,
  getAESTUser,
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

/**
 * Creates a random SIN with the intention to be unique and not interfere in other tests
 */
const UNIQUE_SIN = "#1234567#";
/**
 * Creates a random SFAS individual ID with the intention to be unique
 * and potentially not interfere in other tests.
 * SFAS IDs are not generated automatically.
 */
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
      const ministryUser = await getAESTUser(
        db.dataSource,
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
            creator: {
              id: true,
            },
          },
        },
        relations: {
          notes: { creator: true },
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
            creator: {
              id: ministryUser.id,
            },
          },
        ],
      });
    },
  );

  it("Should throw an UnprocessableEntityException when the legacy profile to be associated with the student is not a valid potential match.", async () => {
    // Arrange.
    const student = await saveFakeStudent(db.dataSource);
    const legacyProfileMatch = await saveFakeSFASIndividual(db.dataSource);
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);
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
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Provided individual is not listed as a potential profile match.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw an UnprocessableEntityException when the student already has a legacy profile associated.", async () => {
    // Arrange.
    const student = await saveFakeStudent(db.dataSource);
    const legacyProfileMatch = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: { student },
    });
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);
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
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "Student already has a legacy profile associated.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw a NotFoundException when the student does not exist.", async () => {
    // Arrange.
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);
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
