import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplicationRestrictionBypass,
  saveFakeStudent,
  saveFakeStudentRestriction,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import * as request from "supertest";
import { NoteType, RestrictionType, User } from "@sims/sims-db";
import MockDate from "mockdate";
import { addDays } from "@sims/utilities";
import { In } from "typeorm";
import { RESTRICTION_IS_DELETED } from "../../../../constants";

describe("RestrictionAESTController(e2e)-deleteStudentProvincialRestriction.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let ministryUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const auditUser = await getAESTUser(
      dataSource,
      AESTGroups.BusinessAdministrators,
    );
    ministryUser = { id: auditUser.id } as User;
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  it("Should delete a provincial student restriction when the restriction is found and is not deleted.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);
    const student = await saveFakeStudent(db.dataSource);
    // Find any provincial restriction.
    const restriction = await db.restriction.findOne({
      select: { id: true },
      where: {
        restrictionType: RestrictionType.Provincial,
      },
    });
    const studentRestriction = await saveFakeStudentRestriction(db.dataSource, {
      student,
      restriction,
    });
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/restriction/student/${student.id}/student-restriction/${studentRestriction.id}/delete`;

    // Act
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({
        noteDescription: "E2E delete provincial restriction.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    const updatedStudentRestriction = await db.studentRestriction.findOne({
      select: {
        id: true,
        isActive: true,
        deletionNote: {
          id: true,
          description: true,
          noteType: true,
        },
        deletedAt: true,
        deletedBy: { id: true },
        modifier: { id: true },
        updatedAt: true,
      },
      relations: {
        deletionNote: true,
        deletedBy: true,
        modifier: true,
      },
      where: {
        id: studentRestriction.id,
      },
      withDeleted: true,
    });
    expect(updatedStudentRestriction).toEqual({
      id: studentRestriction.id,
      isActive: false,
      deletionNote: {
        id: expect.any(Number),
        description: "E2E delete provincial restriction.",
        noteType: NoteType.Restriction,
      },
      deletedAt: now,
      deletedBy: ministryUser,
      modifier: ministryUser,
      updatedAt: now,
    });
  });

  it("Should delete a provincial student restriction and resolve active bypasses when the deleted restriction is associated with some active bypasses.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);
    const pastBypassRemovedDate = addDays(-1, now);
    const student = await saveFakeStudent(db.dataSource);
    // Find any provincial restriction.
    const restriction = await db.restriction.findOne({
      select: { id: true, restrictionCode: true },
      where: {
        restrictionType: RestrictionType.Provincial,
      },
    });
    const studentRestriction = await saveFakeStudentRestriction(db.dataSource, {
      student,
      restriction,
    });
    // Create two bypasses, one active and other removed, associated with the student restriction to be deleted.
    // The removed bypass has its removal date set in the past to allow it to be asserted as not updated.
    const activeBypassPromise = saveFakeApplicationRestrictionBypass(db, {
      studentRestriction,
    });
    const removedBypassPromise = saveFakeApplicationRestrictionBypass(
      db,
      {
        studentRestriction,
      },
      {
        isRemoved: true,
        initialValues: { bypassRemovedDate: pastBypassRemovedDate },
      },
    );
    const [activeBypass, removedBypass] = await Promise.all([
      activeBypassPromise,
      removedBypassPromise,
    ]);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/restriction/student/${student.id}/student-restriction/${studentRestriction.id}/delete`;

    // Act
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({
        noteDescription: "E2E delete provincial restriction.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    const [updatedActiveBypass, nonUpdatedRemovedBypass] =
      await db.applicationRestrictionBypass.find({
        select: {
          id: true,
          isActive: true,
          bypassRemovedDate: true,
          bypassRemovedBy: { id: true },
          removalNote: {
            id: true,
            description: true,
            noteType: true,
          },
          modifier: { id: true },
          updatedAt: true,
        },
        relations: {
          bypassRemovedBy: true,
          removalNote: true,
          modifier: true,
        },
        where: {
          id: In([activeBypass.id, removedBypass.id]),
        },
        order: { bypassRemovedDate: "DESC" },
      });
    expect(updatedActiveBypass).toEqual({
      id: updatedActiveBypass.id,
      isActive: false,
      bypassRemovedDate: now,
      bypassRemovedBy: ministryUser,
      removalNote: {
        id: expect.any(Number),
        description: `Application ${activeBypass.application.applicationNumber} had the bypass for the restriction ${restriction.restrictionCode} removed. Reason: associated student restriction deleted.`,
        noteType: NoteType.Application,
      },
      modifier: ministryUser,
      updatedAt: now,
    });
    // Ensure the removed bypass was not updated.
    expect(nonUpdatedRemovedBypass.bypassRemovedDate.toISOString()).toBe(
      pastBypassRemovedDate.toISOString(),
    );
  });

  it("Should throw a NotFoundException when trying to delete a provincial restriction, but it is a federal restriction.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Find any federal restriction.
    const restriction = await db.restriction.findOne({
      select: { id: true },
      where: {
        restrictionType: RestrictionType.Federal,
      },
    });
    const studentRestriction = await saveFakeStudentRestriction(db.dataSource, {
      student,
      restriction,
    });
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/restriction/student/${student.id}/student-restriction/${studentRestriction.id}/delete`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({
        noteDescription: "E2E delete federal restriction.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Provincial restriction not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw an UnprocessableEntityException when trying to delete a provincial restriction that is already deleted.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Find any provincial restriction.
    const restriction = await db.restriction.findOne({
      select: { id: true },
      where: {
        restrictionType: RestrictionType.Provincial,
      },
    });
    const studentRestriction = await saveFakeStudentRestriction(
      db.dataSource,
      {
        student,
        restriction,
      },
      { deletedAt: new Date() },
    );
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/restriction/student/${student.id}/student-restriction/${studentRestriction.id}/delete`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({
        noteDescription: "E2E delete provincial restriction.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "Provincial restriction is already set as deleted.",
        errorType: RESTRICTION_IS_DELETED,
      });
  });

  it("Should throw a BadRequestException when an invalid payload is received.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/restriction/student/999999/student-restriction/999999/delete`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({
        noteDescription: null,
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          "noteDescription must be shorter than or equal to 1000 characters",
          "noteDescription should not be empty",
        ],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
