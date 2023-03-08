import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { createFakeStudent } from "@sims/test-utils";
import { Repository } from "typeorm";
import { Student } from "@sims/sims-db";

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
  const manualOverawardPayload: OverawardManualRecordAPIInDTO = {
    awardValueCode: "CSLF",
    overawardValue: -300,
    overawardNotes: "Overaward notes...",
  };

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    studentRepo = dataSource.getRepository(Student);
  });

  it("Should create manual overaward when AEST user belong to business-administrators group", async () => {
    // Arrange
    const student = await studentRepo.save(createFakeStudent());
    const endpoint = `/aest/overaward/student/${student.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(manualOverawardPayload)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.CREATED);
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
