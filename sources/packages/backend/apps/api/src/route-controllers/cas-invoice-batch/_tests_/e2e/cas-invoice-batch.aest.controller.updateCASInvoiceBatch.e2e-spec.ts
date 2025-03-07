import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import { createE2EDataSources, E2EDataSources } from "@sims/test-utils";
import { createFakeCASInvoiceBatch } from "../../../../../../../libs/test-utils/src";
import { SystemUsersService } from "@sims/services";
import { CASInvoiceBatchApprovalStatus, User } from "@sims/sims-db";

describe("CASInvoiceBatchAESTController(e2e)-updateCASInvoiceBatch", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let systemUsersService: SystemUsersService;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    systemUsersService = app.get(SystemUsersService);
    db = createE2EDataSources(dataSource);
  });

  it("Should be able to approve an invoice batch when the batch is pending.", async () => {
    // Arrange
    const casInvoiceBatch = createFakeCASInvoiceBatch({
      creator: systemUsersService.systemUser,
    });
    await db.casInvoiceBatch.save(casInvoiceBatch);
    const payload = {
      approvalStatus: CASInvoiceBatchApprovalStatus.Approved,
    };
    const endpoint = `/aest/cas-invoice-batch/${casInvoiceBatch.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    const updatedCASInvoiceBatch = await db.casInvoiceBatch.findOne({
      select: {
        id: true,
        approvalStatus: true,
        approvalStatusUpdatedBy: { id: true },
      },
      relations: { approvalStatusUpdatedBy: true },
      where: { id: casInvoiceBatch.id },
      loadEagerRelations: false,
    });
    const approvalStatusUpdatedBy = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    expect(updatedCASInvoiceBatch).toEqual({
      id: casInvoiceBatch.id,
      approvalStatus: CASInvoiceBatchApprovalStatus.Approved,
      approvalStatusUpdatedBy: { id: approvalStatusUpdatedBy.id } as User,
    });
  });

  it("Should throw a HttpStatus UnprocessableEntityException (422) error when the batch is approved.", async () => {
    // Arrange
    const casInvoiceBatch = createFakeCASInvoiceBatch(
      {
        creator: systemUsersService.systemUser,
      },
      {
        initialValue: {
          approvalStatus: CASInvoiceBatchApprovalStatus.Approved,
        },
      },
    );
    await db.casInvoiceBatch.save(casInvoiceBatch);
    const payload = {
      approvalStatus: CASInvoiceBatchApprovalStatus.Approved,
    };
    const endpoint = `/aest/cas-invoice-batch/${casInvoiceBatch.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: `Cannot update CAS invoice batch with ID ${casInvoiceBatch.id} that is approved or rejected.`,
        error: "Unprocessable Entity",
      });
  });

  it("Should throw a HttpStatus Not Found (404) error when the CAS invoice batch doesn't exist.", async () => {
    // Arrange
    const endpoint = "/aest/cas-invoice-batch/99999999";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      approvalStatus: CASInvoiceBatchApprovalStatus.Approved,
    };

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "CAS invoice batch with ID 99999999 not found.",
        error: "Not Found",
      });
  });

  it("Should throw a HttpStatus Forbidden (403) error when an unauthorized Ministry user tries to update the invoice batch.", async () => {
    // Arrange
    const endpoint = "/aest/cas-invoice-batch/99999999";
    const token = await getAESTToken(AESTGroups.MOFOperations);
    const payload = {
      approvalStatus: CASInvoiceBatchApprovalStatus.Approved,
    };
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
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
