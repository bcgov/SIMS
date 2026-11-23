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
  saveFakeStudent,
} from "@sims/test-utils";
import { NoteType } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import { Role } from "../../../../auth";
import MockDate from "mockdate";

describe("MSFAANumberAESTController(e2e)-cancelMSFAANumber", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
  });

  beforeEach(() => {
    MockDate.reset();
  });

  it("Should cancel the MSFAA and create a general student note when the MSFAA is not cancelled.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const msfaa = await db.msfaaNumber.save(
      createFakeMSFAANumber({ student }, { msfaaState: MSFAAStates.Signed }),
    );
    const noteDescription = `Cancelling MSFAA ${msfaa.msfaaNumber}.`;
    const now = new Date();
    MockDate.set(now);
    await addJWTUserRoles(appModule, [Role.StudentCancelMSFAA]);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(msfaa.id))
      .auth(token, BEARER_AUTH_TYPE)
      .send({ noteDescription })
      .expect(HttpStatus.OK);

    // Validate DB changes.
    const updatedMSFAA = await db.msfaaNumber.findOne({
      select: { cancelledDate: true, newIssuingProvince: true },
      where: { id: msfaa.id },
    });
    expect(updatedMSFAA).toEqual({
      cancelledDate: getISODateOnlyString(now),
      newIssuingProvince: "BC",
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

  it("Should return unprocessable entity and not create a note when the MSFAA is already cancelled.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const msfaa = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        { student },
        { msfaaState: MSFAAStates.Signed | MSFAAStates.CancelledSystem },
      ),
    );
    await addJWTUserRoles(appModule, [Role.StudentCancelMSFAA]);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(msfaa.id))
      .auth(token, BEARER_AUTH_TYPE)
      .send({ noteDescription: "Cancelling an already cancelled MSFAA." })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "Not possible to cancel an MSFAA that is already cancelled.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    const studentWithNotes = await db.student.findOne({
      select: { id: true, notes: { id: true } },
      relations: { notes: true },
      where: { id: student.id },
    });
    expect(studentWithNotes.notes).toHaveLength(0);
  });

  it("Should return not found when the MSFAA does not exist.", async () => {
    // Arrange
    await addJWTUserRoles(appModule, [Role.StudentCancelMSFAA]);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(999999999))
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
    const student = await saveFakeStudent(db.dataSource);
    const msfaa = await db.msfaaNumber.save(createFakeMSFAANumber({ student }));
    await addJWTUserRoles(appModule, [Role.StudentCancelMSFAA]);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(msfaa.id))
      .auth(token, BEARER_AUTH_TYPE)
      .send({})
      .expect(HttpStatus.BAD_REQUEST);
  });

  it(`Should return forbidden when the AEST user does not have the ${Role.StudentCancelMSFAA} role.`, async () => {
    // Arrange
    const token = await getAESTToken();

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(1))
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
 * Gets the endpoint to cancel an MSFAA.
 * @param msfaaNumberId MSFAA id.
 * @returns endpoint.
 */
function getEndpoint(msfaaNumberId: number): string {
  return `/aest/msfaa-number/${msfaaNumberId}/cancel`;
}
