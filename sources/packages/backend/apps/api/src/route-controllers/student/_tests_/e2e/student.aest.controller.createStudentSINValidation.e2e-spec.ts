import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  AESTGroups,
  getAESTToken,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeStudent,
  createFakeSINValidation,
} from "@sims/test-utils";
import { SIN_DUPLICATE_NOT_CONFIRMED } from "../../../../constants";

describe("StudentAESTController(e2e)-createStudentSINValidation", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should reject creation of duplicate SIN when confirmDuplicateSIN is not provided.", async () => {
    // Arrange
    const duplicateSIN = "927159533";
    await saveFakeStudent(db.dataSource, null, {
      sinValidationInitialValue: { sin: duplicateSIN },
    });
    const student = await saveFakeStudent(db.dataSource);

    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/${student.id}/sin-validations`;
    const payload = {
      sin: duplicateSIN,
      skipValidations: false,
      noteDescription: "Attempting to add duplicate SIN without confirmation.",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect((response) => {
        expect(response.body.message).toContain(
          "This SIN is currently associated with another student profile",
        );
        expect(response.body.errorType).toBe(SIN_DUPLICATE_NOT_CONFIRMED);
      });
  });

  it("Should create SIN validation when duplicate SIN is confirmed with confirmDuplicateSIN flag.", async () => {
    // Arrange
    const studentA = await saveFakeStudent(db.dataSource);
    const studentB = await saveFakeStudent(db.dataSource);
    const duplicateSIN = "534012703";

    // Create a SIN validation for student A.
    const sinValidationA = createFakeSINValidation({
      student: studentA,
    });
    sinValidationA.sin = duplicateSIN;
    await db.sinValidation.save(sinValidationA);

    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/${studentB.id}/sin-validations`;
    const payload = {
      sin: duplicateSIN,
      skipValidations: true,
      noteDescription: "Adding duplicate SIN with confirmation.",
      confirmDuplicateSIN: true,
    };

    // Act/Assert
    let createdId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        createdId = response.body.id;
        expect(createdId).toBeGreaterThan(0);
      });

    // Verify the SIN validation was created for student B.
    const createdSINValidation = await db.sinValidation.findOne({
      where: { id: createdId },
      relations: { student: true },
    });
    expect(createdSINValidation).toBeDefined();
    expect(createdSINValidation.student.id).toBe(studentB.id);
    expect(createdSINValidation.sin).toBe(duplicateSIN);
  });

  it("Should create SIN validation when SIN is not a duplicate.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const uniqueSIN = "696098482";

    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/${student.id}/sin-validations`;
    const payload = {
      sin: uniqueSIN,
      skipValidations: true,
      noteDescription: "Adding unique SIN.",
    };

    // Act/Assert
    let createdId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        createdId = response.body.id;
        expect(createdId).toBeGreaterThan(0);
      });

    // Verify the SIN validation was created.
    const createdSINValidation = await db.sinValidation.findOne({
      where: { id: createdId },
      relations: { student: true },
    });
    expect(createdSINValidation).toBeDefined();
    expect(createdSINValidation.student.id).toBe(student.id);
    expect(createdSINValidation.sin).toBe(uniqueSIN);
  });

  afterAll(async () => {
    await app?.close();
  });
});
