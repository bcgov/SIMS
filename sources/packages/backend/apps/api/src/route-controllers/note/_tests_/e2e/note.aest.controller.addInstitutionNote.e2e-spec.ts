import { HttpStatus, INestApplication } from "@nestjs/common";
import { createFakeInstitution } from "@sims/test-utils";
import { Repository } from "typeorm";
import { Institution, NoteType } from "@sims/sims-db";
import {
  AESTGroups,
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  getAESTToken,
} from "../../../../testHelpers";
import * as request from "supertest";
import { NoteAPIInDTO } from "../../models/note.dto";

describe("NoteAESTController(e2e)-addInstitutionNote", () => {
  let app: INestApplication;
  let institutionRepo: Repository<Institution>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    institutionRepo = dataSource.getRepository(Institution);
  });

  it("Should allow access to the expected AEST users groups", async () => {
    // Arrange
    const institution = await institutionRepo.save(createFakeInstitution());
    const endpoint = `/aest/note/institution/${institution.id}`;
    const expectedPermissions = [
      {
        aestGroup: AESTGroups.BusinessAdministrators,
        expectedHttpStatus: HttpStatus.CREATED,
      },
      {
        aestGroup: AESTGroups.Operations,
        expectedHttpStatus: HttpStatus.CREATED,
      },
      {
        aestGroup: AESTGroups.OperationsAdministrators,
        expectedHttpStatus: HttpStatus.CREATED,
      },
      {
        aestGroup: AESTGroups.MOFOperations,
        expectedHttpStatus: HttpStatus.FORBIDDEN,
      },
      {
        aestGroup: undefined, // Read only user.
        expectedHttpStatus: HttpStatus.FORBIDDEN,
      },
    ];
    // Act/Assert
    for (const permission of expectedPermissions) {
      await request(app.getHttpServer())
        .post(endpoint)
        .send({
          noteType: NoteType.Application,
          description: "description",
        } as NoteAPIInDTO)
        .auth(await getAESTToken(permission.aestGroup), BEARER_AUTH_TYPE)
        .expect(permission.expectedHttpStatus);
    }
  });

  afterAll(async () => {
    await app?.close();
  });
});
