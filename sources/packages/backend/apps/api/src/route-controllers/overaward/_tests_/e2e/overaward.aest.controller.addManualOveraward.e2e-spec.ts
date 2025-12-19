import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { createFakeStudent } from "@sims/test-utils";
import { Repository } from "typeorm";
import {
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  NoteType,
  Student,
} from "@sims/sims-db";

import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  getAESTToken,
  createTestingAppModule,
} from "../../../../testHelpers";
import { OverawardManualRecordAPIInDTO } from "../../models/overaward.dto";

describe("OverawardAESTController(e2e)-addManualOveraward", () => {
  let app: INestApplication;
  let studentRepo: Repository<Student>;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;

  const manualOverawardDeductionPayload: OverawardManualRecordAPIInDTO = {
    awardValueCode: "CSLF",
    overawardValue: -300,
    overawardNotes: "Overaward notes...",
  };

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    studentRepo = dataSource.getRepository(Student);
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
  });

  it("Should create manual overaward (deduction) when AEST user belong to business-administrators group", async () => {
    // Arrange
    const student = await studentRepo.save(createFakeStudent());
    const endpoint = `/aest/overaward/student/${student.id}`;

    // Act
    const overawardResponse = await request(app.getHttpServer())
      .post(endpoint)
      .send(manualOverawardDeductionPayload)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.CREATED);

    const overawardCreated = await disbursementOverawardRepo.findOne({
      select: {
        id: true,
        disbursementValueCode: true,
        originType: true,
        overawardNotes: { noteType: true, description: true },
        overawardValue: true,
        student: { id: true },
      },
      relations: { overawardNotes: true, student: true },
      where: { id: overawardResponse.body.id },
      loadEagerRelations: false,
    });

    // Assert
    expect(overawardCreated).toEqual({
      id: expect.any(Number),
      disbursementValueCode: manualOverawardDeductionPayload.awardValueCode,
      originType: DisbursementOverawardOriginType.ManualRecord,
      overawardNotes: {
        noteType: NoteType.Overaward,
        description: manualOverawardDeductionPayload.overawardNotes,
      },
      overawardValue: manualOverawardDeductionPayload.overawardValue,
      student: {
        id: student.id,
      },
    });
  });

  it("Should throw forbidden error when AEST user does not belong to business-administrators group", async () => {
    // Arrange
    const student = await studentRepo.save(createFakeStudent());
    const endpoint = `/aest/overaward/student/${student.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(manualOverawardDeductionPayload)
      .auth(await getAESTToken(AESTGroups.Operations), BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN);
  });

  it("Should throw not found error when student id is not valid", async () => {
    // Arrange
    const endpoint = `/aest/overaward/student/99999`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(manualOverawardDeductionPayload)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.NOT_FOUND);
  });

  it("Should throw bad request error when payload is malformed or incomplete", async () => {
    // Arrange
    const student = await studentRepo.save(createFakeStudent());
    const endpoint = `/aest/overaward/student/${student.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({})
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.BAD_REQUEST);
  });

  afterAll(async () => {
    await app?.close();
  });
});
