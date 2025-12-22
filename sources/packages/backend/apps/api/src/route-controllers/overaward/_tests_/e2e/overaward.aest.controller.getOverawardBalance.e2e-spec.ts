import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createFakeStudent,
  createFakeDisbursementOveraward,
} from "@sims/test-utils";
import { Repository } from "typeorm";
import {
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  Student,
} from "@sims/sims-db";

import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  getAESTToken,
  createTestingAppModule,
} from "../../../../testHelpers";

describe("OverawardAESTController(e2e)-getOverawardBalance", () => {
  let app: INestApplication;
  let studentRepo: Repository<Student>;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    studentRepo = dataSource.getRepository(Student);
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
  });

  it("Should get the overaward balance when AEST user belongs to any of the allowed groups", async () => {
    // Arrange
    const student = await studentRepo.save(createFakeStudent());
    await disbursementOverawardRepo.save(
      createFakeDisbursementOveraward({ student }),
    );
    const endpoint = `/aest/overaward/student/${student.id}/balance`;
    const expectedPermissions = [
      {
        aestGroup: AESTGroups.BusinessAdministrators,
        expectedHttpStatus: HttpStatus.OK,
      },
      {
        aestGroup: AESTGroups.Operations,
        expectedHttpStatus: HttpStatus.OK,
      },
      {
        aestGroup: AESTGroups.OperationsAdministrators,
        expectedHttpStatus: HttpStatus.OK,
      },
      {
        aestGroup: AESTGroups.MOFOperations,
        expectedHttpStatus: HttpStatus.OK,
      },
    ];

    // Act/Assert
    for (const permission of expectedPermissions) {
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(await getAESTToken(permission.aestGroup), BEARER_AUTH_TYPE)
        .expect(permission.expectedHttpStatus);
    }
  });

  it("Should return correct value for overaward balance", async () => {
    // Arrange
    const student = await studentRepo.save(createFakeStudent());
    // Create an overaward.
    const legacyOveraward = createFakeDisbursementOveraward({ student });
    legacyOveraward.disbursementValueCode = "CSLF";
    legacyOveraward.overawardValue = 500;
    legacyOveraward.originType =
      DisbursementOverawardOriginType.LegacyOveraward;
    // Create a manual overaward deduction.
    const manualOveraward = createFakeDisbursementOveraward({ student });
    manualOveraward.disbursementValueCode = "CSLF";
    manualOveraward.overawardValue = -100;
    manualOveraward.originType = DisbursementOverawardOriginType.ManualRecord;
    // Persist the overawards.
    await disbursementOverawardRepo.save([legacyOveraward, manualOveraward]);
    const endpoint = `/aest/overaward/student/${student.id}/balance`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body.overawardBalanceValues.CSLF).toBe(400);
      });
  });

  it("Should throw not found error when invalid student id is provided", async () => {
    // Arrange
    const endpoint = `/aest/overaward/student/999999/balance`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.NOT_FOUND);
  });

  afterAll(async () => {
    await app?.close();
  });
});
