import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  addJWTUserRoles,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  MSFAAStates,
  createE2EDataSources,
  createFakeMSFAANumber,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  DisbursementScheduleStatus,
  NoteType,
  OfferingIntensity,
} from "@sims/sims-db";
import { addDays } from "@sims/utilities";
import { Role } from "../../../../auth";
import { ConfigServiceMockHelper } from "@sims/test-utils/mocks";
import { In } from "typeorm";
import { MSFAA_INELIGIBLE } from "@sims/services/constants";

const INVALID_REISSUE_MESSAGE =
  "Not possible to reissue an MSFAA that is not the most recent one, is not cancelled, or has no pending disbursements associated.";

describe("MSFAANumberAESTController(e2e)-reissueMSFAANumber", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let configServiceMockHelper: ConfigServiceMockHelper;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    configServiceMockHelper = new ConfigServiceMockHelper(app);
  });

  beforeEach(() => {
    configServiceMockHelper.bypassMSFAASigning(false);
  });

  it("Should reissue an MSFAA, associate it with the pending disbursement, and create a general student note when the MSFAA is the most recent, cancelled and has disbursements.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const cancelledMSFAA = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        { student },
        { msfaaState: MSFAAStates.Signed | MSFAAStates.CancelledOtherProvince },
      ),
    );
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student, msfaaNumber: cancelledMSFAA },
      {
        applicationStatus: ApplicationStatus.Completed,
        createSecondDisbursement: true,
      },
    );
    const [sentSchedule, pendingSchedule] =
      application.currentAssessment.disbursementSchedules;
    sentSchedule.disbursementScheduleStatus = DisbursementScheduleStatus.Sent;
    await db.disbursementSchedule.save(sentSchedule);
    const noteDescription = `Reissuing MSFAA ${cancelledMSFAA.msfaaNumber}.`;
    await addJWTUserRoles(appModule, [Role.StudentReissueMSFAA]);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    let createdMSFAAId: number;

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint(cancelledMSFAA.id))
      .auth(token, BEARER_AUTH_TYPE)
      .send({ noteDescription })
      .expect(HttpStatus.CREATED)
      .then((response) => (createdMSFAAId = +response.body.id));

    // Validate DB changes.
    const [updatedSentSchedule, updatedPendingSchedule] =
      await db.disbursementSchedule.find({
        select: { id: true, msfaaNumber: { id: true } },
        relations: { msfaaNumber: true },
        where: { id: In([sentSchedule.id, pendingSchedule.id]) },
        order: { id: "ASC" },
      });
    expect(updatedSentSchedule.msfaaNumber.id).toBe(cancelledMSFAA.id);
    expect(updatedPendingSchedule.msfaaNumber.id).toBe(createdMSFAAId);
    const createdMSFAA = await db.msfaaNumber.findOne({
      select: {
        id: true,
        offeringIntensity: true,
        cancelledDate: true,
        referenceApplication: { id: true },
      },
      relations: { referenceApplication: true },
      where: { id: createdMSFAAId },
    });
    expect(createdMSFAA).toEqual({
      id: createdMSFAAId,
      offeringIntensity: OfferingIntensity.fullTime,
      cancelledDate: null,
      referenceApplication: { id: application.id },
    });
    const studentWithNotes = await db.student.findOne({
      select: { id: true, notes: { noteType: true, description: true } },
      relations: { notes: true },
      where: { id: student.id },
    });
    expect(studentWithNotes.notes).toEqual([
      { noteType: NoteType.General, description: noteDescription },
    ]);
  });

  it("Should return unprocessable entity when the MSFAA is not cancelled.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const msfaa = await db.msfaaNumber.save(
      createFakeMSFAANumber({ student }, { msfaaState: MSFAAStates.Signed }),
    );
    await saveFakeApplicationDisbursements(
      db.dataSource,
      { student, msfaaNumber: msfaa },
      { applicationStatus: ApplicationStatus.Completed },
    );
    await addJWTUserRoles(appModule, [Role.StudentReissueMSFAA]);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint(msfaa.id))
      .auth(token, BEARER_AUTH_TYPE)
      .send({ noteDescription: "MSFAA is not cancelled." })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: INVALID_REISSUE_MESSAGE,
        errorType: MSFAA_INELIGIBLE,
      });
  });

  it("Should return unprocessable entity when the cancelled MSFAA has no disbursements associated.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const msfaa = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        { student },
        { msfaaState: MSFAAStates.Signed | MSFAAStates.CancelledSystem },
      ),
    );
    await addJWTUserRoles(appModule, [Role.StudentReissueMSFAA]);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint(msfaa.id))
      .auth(token, BEARER_AUTH_TYPE)
      .send({ noteDescription: "No disbursements associated." })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: INVALID_REISSUE_MESSAGE,
        errorType: MSFAA_INELIGIBLE,
      });
  });

  it("Should return unprocessable entity when a newer cancelled MSFAA with disbursements exists for the same offering intensity.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const olderCancelledMSFAA = createFakeMSFAANumber(
      { student },
      { msfaaState: MSFAAStates.Signed | MSFAAStates.CancelledSystem },
    );
    olderCancelledMSFAA.createdAt = addDays(-10);
    const newerCancelledMSFAA = createFakeMSFAANumber(
      { student },
      { msfaaState: MSFAAStates.Signed | MSFAAStates.CancelledSystem },
    );
    await db.msfaaNumber.save([olderCancelledMSFAA, newerCancelledMSFAA]);
    await saveFakeApplicationDisbursements(
      db.dataSource,
      { student, msfaaNumber: olderCancelledMSFAA },
      { applicationStatus: ApplicationStatus.Completed },
    );
    await saveFakeApplicationDisbursements(
      db.dataSource,
      { student, msfaaNumber: newerCancelledMSFAA },
      { applicationStatus: ApplicationStatus.Completed },
    );
    await addJWTUserRoles(appModule, [Role.StudentReissueMSFAA]);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint(olderCancelledMSFAA.id))
      .auth(token, BEARER_AUTH_TYPE)
      .send({ noteDescription: "Not the most recent MSFAA." })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: INVALID_REISSUE_MESSAGE,
        errorType: MSFAA_INELIGIBLE,
      });
  });

  it("Should return unprocessable entity when the same MSFAA is reissued twice.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const cancelledMSFAA = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        { student },
        { msfaaState: MSFAAStates.Signed | MSFAAStates.CancelledSystem },
      ),
    );
    await saveFakeApplicationDisbursements(
      db.dataSource,
      { student, msfaaNumber: cancelledMSFAA },
      { applicationStatus: ApplicationStatus.Completed },
    );
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    await addJWTUserRoles(appModule, [Role.StudentReissueMSFAA]);
    await request(app.getHttpServer())
      .post(getEndpoint(cancelledMSFAA.id))
      .auth(token, BEARER_AUTH_TYPE)
      .send({ noteDescription: "First reissue." })
      .expect(HttpStatus.CREATED);
    await addJWTUserRoles(appModule, [Role.StudentReissueMSFAA]);

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint(cancelledMSFAA.id))
      .auth(token, BEARER_AUTH_TYPE)
      .send({ noteDescription: "Second reissue." })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: INVALID_REISSUE_MESSAGE,
        errorType: MSFAA_INELIGIBLE,
      });
  });

  it("Should return not found when the MSFAA does not exist.", async () => {
    // Arrange
    await addJWTUserRoles(appModule, [Role.StudentReissueMSFAA]);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint(999999999))
      .auth(token, BEARER_AUTH_TYPE)
      .send({ noteDescription: "MSFAA not found." })
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "MSFAA number id 999999999 was not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should return bad request when the note is not provided.", async () => {
    // Arrange
    await addJWTUserRoles(appModule, [Role.StudentReissueMSFAA]);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint(1))
      .auth(token, BEARER_AUTH_TYPE)
      .send({})
      .expect(HttpStatus.BAD_REQUEST);
  });

  it(`Should return forbidden when the AEST user does not have the ${Role.StudentReissueMSFAA} role.`, async () => {
    // Arrange
    const token = await getAESTToken();

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint(1))
      .auth(token, BEARER_AUTH_TYPE)
      .send({ noteDescription: "Not allowed." })
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: "Forbidden resource",
        error: "Forbidden",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Gets the endpoint to reissue an MSFAA.
 * @param msfaaNumberId MSFAA id.
 * @returns endpoint.
 */
function getEndpoint(msfaaNumberId: number): string {
  return `/aest/msfaa-number/${msfaaNumberId}/reissue`;
}
