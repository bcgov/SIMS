import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
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
  saveFakeApplicationDisbursements,
  saveFakeDisbursementReceiptsFromDisbursementSchedule,
} from "@sims/test-utils";
import { DisbursementScheduleStatus, NoteType, User } from "@sims/sims-db";
import MockDate from "mockdate";
import { DISBURSEMENT_SCHEDULE_INVALID_STATE_TO_BE_UPDATED } from "@sims/services/constants";

describe("DisbursementScheduleAESTController(e2e)-cancelDisbursementSchedule", () => {
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

  it("Should cancel a disbursement and set it as rejected when the e-Cert was sent and no receipts were received.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      undefined,
      {
        firstDisbursementInitialValues: {
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
      },
    );
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
    const payload = { note: "Some random note." };
    const endpoint = `/aest/disbursement-schedule/${firstDisbursement.id}/cancel`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    // Validate disbursement DB changes.
    const updatedDisbursement = await db.disbursementSchedule.findOne({
      select: {
        id: true,
        disbursementScheduleStatus: true,
        disbursementScheduleStatusUpdatedBy: { id: true },
        disbursementScheduleStatusUpdatedOn: true,
        modifier: { id: true },
        updatedAt: true,
      },
      relations: {
        disbursementScheduleStatusUpdatedBy: true,
        modifier: true,
      },
      where: { id: firstDisbursement.id },
    });
    expect(updatedDisbursement).toEqual({
      id: firstDisbursement.id,
      disbursementScheduleStatus: DisbursementScheduleStatus.Rejected,
      modifier: ministryUser,
      updatedAt: now,
      disbursementScheduleStatusUpdatedBy: ministryUser,
      disbursementScheduleStatusUpdatedOn: now,
    });
    // Validate note creation DB changes.
    const createdNote = await db.student.findOne({
      select: {
        id: true,
        notes: {
          id: true,
          description: true,
          noteType: true,
          creator: { id: true },
        },
      },
      relations: {
        notes: {
          creator: true,
        },
      },
      where: { id: application.student.id },
      loadEagerRelations: false,
    });
    expect(createdNote).toEqual({
      id: application.student.id,
      notes: [
        {
          id: expect.any(Number),
          description: payload.note,
          noteType: NoteType.Application,
          creator: ministryUser,
        },
      ],
    });
  });

  it("Should throw an UnprocessableEntityException when trying to cancel a disbursement that has a receipt.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      undefined,
      {
        firstDisbursementInitialValues: {
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
      },
    );
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
    // Associate receipts with the disbursement.
    await saveFakeDisbursementReceiptsFromDisbursementSchedule(
      db,
      firstDisbursement,
    );
    const payload = { note: "Some random note." };
    const endpoint = `/aest/disbursement-schedule/${firstDisbursement.id}/cancel`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Disbursement schedule has receipts associated with it and cannot be rejected.",
        errorType: DISBURSEMENT_SCHEDULE_INVALID_STATE_TO_BE_UPDATED,
      });
  });

  it("Should throw an UnprocessableEntityException when trying to cancel a disbursement that has already been rejected.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      undefined,
      {
        firstDisbursementInitialValues: {
          disbursementScheduleStatus: DisbursementScheduleStatus.Rejected,
        },
      },
    );
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
    const payload = { note: "Some random note." };
    const endpoint = `/aest/disbursement-schedule/${firstDisbursement.id}/cancel`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Disbursement schedule expected to be 'Sent' to allow it to be rejected.",
        errorType: DISBURSEMENT_SCHEDULE_INVALID_STATE_TO_BE_UPDATED,
      });
  });

  it("Should throw a NotFoundException when trying to cancel a disbursement that does not exist.", async () => {
    // Arrange
    const payload = { note: "Some random note." };
    const endpoint = `/aest/disbursement-schedule/999999/cancel`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Disbursement schedule ID 999999 not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw a ForbiddenException when trying to cancel a disbursement without the proper authorization.", async () => {
    // Arrange
    const payload = { note: "Some random note." };
    const endpoint = `/aest/disbursement-schedule/999999/cancel`;
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "Forbidden resource",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });
});
