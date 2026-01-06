import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createE2EDataSources,
  createFakeStudent,
  E2EDataSources,
} from "@sims/test-utils";
import { Repository } from "typeorm";
import MockDate from "mockdate";
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
  getAESTUser,
  createTestingAppModule,
} from "../../../../testHelpers";
import { OverawardManualRecordAPIInDTO } from "../../models/overaward.dto";

describe("OverawardAESTController(e2e)-addManualOveraward", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let studentRepo: Repository<Student>;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;

  const manualOverawardPayload: OverawardManualRecordAPIInDTO = {
    awardValueCode: "CSLF",
    overawardValue: -300,
    overawardNotes: "Overaward notes...",
  };

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    studentRepo = dataSource.getRepository(Student);
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  it("Should create manual overaward (deduction) when AEST user belong to business-administrators group", async () => {
    // Arrange
    const student = await studentRepo.save(createFakeStudent());
    const endpoint = `/aest/overaward/student/${student.id}`;
    const ministryUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    const now = new Date();
    MockDate.set(now);

    // Act/Assert
    const overawardResponse = await request(app.getHttpServer())
      .post(endpoint)
      .send(manualOverawardPayload)
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
        addedBy: { id: true },
        addedDate: true,
      },
      relations: { overawardNotes: true, student: true, addedBy: true },
      where: { id: overawardResponse.body.id },
      loadEagerRelations: false,
    });

    // Assert
    expect(overawardCreated).toEqual({
      id: expect.any(Number),
      disbursementValueCode: manualOverawardPayload.awardValueCode,
      originType: DisbursementOverawardOriginType.ManualRecord,
      overawardNotes: {
        noteType: NoteType.Overaward,
        description: manualOverawardPayload.overawardNotes,
      },
      overawardValue: manualOverawardPayload.overawardValue,
      student: {
        id: student.id,
      },
      addedBy: {
        id: ministryUser.id,
      },
      addedDate: now,
    });
  });

  it("Should throw forbidden error when AEST user does not belong to business-administrators group", async () => {
    // Arrange
    const student = await studentRepo.save(createFakeStudent());
    const endpoint = `/aest/overaward/student/${student.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(manualOverawardPayload)
      .auth(await getAESTToken(AESTGroups.Operations), BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN);
  });

  it("Should throw not found error when student id is not valid", async () => {
    // Arrange
    const endpoint = `/aest/overaward/student/99999`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(manualOverawardPayload)
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
