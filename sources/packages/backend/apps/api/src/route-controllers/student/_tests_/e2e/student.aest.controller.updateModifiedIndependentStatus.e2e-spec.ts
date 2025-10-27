import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import MockDate from "mockdate";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import { ModifiedIndependentStatus, NoteType } from "@sims/sims-db";
import { MODIFIED_INDEPENDENT_STATUS_NOT_UPDATED } from "../../../../constants";

describe("StudentAESTController(e2e)-updateModifiedIndependentStatus", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  it(`Should update the student modified independent status as ${ModifiedIndependentStatus.Approved} when the current modified independent status is ${ModifiedIndependentStatus.NotRequested}.`, async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/${student.id}/modified-independent-status`;
    const payload = {
      modifiedIndependentStatus: ModifiedIndependentStatus.Approved,
      noteDescription: "Some note description.",
    };
    const now = new Date();
    MockDate.set(now);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Verify the change in the database.
    const updatedStudent = await db.student.findOne({
      select: {
        id: true,
        modifiedIndependentStatus: true,
        modifiedIndependentStatusUpdatedBy: { id: true },
        modifiedIndependentStatusUpdatedOn: true,
        modifier: { id: true },
        updatedAt: true,
        notes: { id: true, description: true, noteType: true },
      },
      relations: {
        modifiedIndependentStatusUpdatedBy: true,
        modifier: true,
        notes: true,
      },
      where: { id: student.id },
      loadEagerRelations: false,
    });
    // Approving ministry user.
    const ministryUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    const auditUser = { id: ministryUser.id };
    expect(updatedStudent).toEqual({
      id: student.id,
      modifiedIndependentStatus: ModifiedIndependentStatus.Approved,
      modifiedIndependentStatusUpdatedBy: auditUser,
      modifiedIndependentStatusUpdatedOn: now,
      modifier: auditUser,
      updatedAt: now,
      notes: [
        {
          id: expect.any(Number),
          description: payload.noteDescription,
          noteType: NoteType.General,
        },
      ],
    });
  });

  it(`Should update the student modified independent status as ${ModifiedIndependentStatus.NotRequested} when the current modified independent status is ${ModifiedIndependentStatus.Approved}.`, async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource, undefined, {
      initialValue: {
        modifiedIndependentStatus: ModifiedIndependentStatus.Approved,
      },
    });
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/${student.id}/modified-independent-status`;
    const payload = {
      modifiedIndependentStatus: ModifiedIndependentStatus.NotRequested,
      noteDescription: "Some note description to reset the status.",
    };
    const now = new Date();
    MockDate.set(now);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Verify the change in the database.
    const updatedStudent = await db.student.findOne({
      select: {
        id: true,
        modifiedIndependentStatus: true,
        modifiedIndependentStatusUpdatedBy: { id: true },
        modifiedIndependentStatusUpdatedOn: true,
        modifier: { id: true },
        updatedAt: true,
        notes: { id: true, description: true, noteType: true },
      },
      relations: {
        modifiedIndependentStatusUpdatedBy: true,
        modifier: true,
        notes: true,
      },
      where: { id: student.id },
      loadEagerRelations: false,
    });
    // Approving ministry user.
    const ministryUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    const auditUser = { id: ministryUser.id };
    expect(updatedStudent).toEqual({
      id: student.id,
      modifiedIndependentStatus: ModifiedIndependentStatus.NotRequested,
      modifiedIndependentStatusUpdatedBy: auditUser,
      modifiedIndependentStatusUpdatedOn: now,
      modifier: auditUser,
      updatedAt: now,
      notes: [
        {
          id: expect.any(Number),
          description: payload.noteDescription,
          noteType: NoteType.General,
        },
      ],
    });
  });

  it("Should throw not found error when student with provided student id does not exist.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Endpoint with a non-existing student id.
    const endpoint = `/aest/student/99999/modified-independent-status`;
    const payload = {
      modifiedIndependentStatus: ModifiedIndependentStatus.Approved,
      noteDescription: "Some note description.",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Student 99999 not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw unprocessable entity error when the provided modified independent status is not different from the current modified independent status of the student.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource, undefined, {
      initialValue: {
        modifiedIndependentStatus: ModifiedIndependentStatus.Approved,
      },
    });
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/${student.id}/modified-independent-status`;
    // Payload with the same modified independent status as the current modified independent status.
    const payload = {
      modifiedIndependentStatus: ModifiedIndependentStatus.Approved,
      noteDescription: "Some note description.",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Modified independent status provided is not different from the current status.",
        errorType: MODIFIED_INDEPENDENT_STATUS_NOT_UPDATED,
      });
  });

  it("Should throw forbidden error when the updating user does not have the role to update the student modified independent status.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // The given group does not have the association to the role to update the modified independent status.
    const token = await getAESTToken(AESTGroups.MOFOperations);
    const endpoint = `/aest/student/${student.id}/modified-independent-status`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({})
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "Forbidden resource",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });

  it("Should throw bad request error when the provided modified independent status is invalid.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/99999/modified-independent-status`;
    // Payload with an invalid modified independent status.
    const payload = {
      modifiedIndependentStatus: "SomeInvalidStatus",
      noteDescription: "Some note description.",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          "modifiedIndependentStatus must be one of the following values: Not requested, Approved, Declined",
        ],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
