import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { createE2EDataSources, E2EDataSources } from "@sims/test-utils";
import { createFakeCASInvoiceBatch } from "../../../../../../../libs/test-utils/src";
import { SystemUsersService } from "@sims/services";
import { addDays } from "@sims/utilities";
import { MoreThanOrEqual } from "typeorm";
import { CASInvoiceBatchApprovalStatus } from "@sims/sims-db";
import { CASInvoiceBatchAPIOutDTO } from "../../models/cas-invoice-batch.dto";

/**
 * Use a period that will never be reached to delete all existing invoice batches
 * and allow the retrieval of invoice batches to be tested.
 */
const CAS_BATCHES_UNIQUE_START_PERIOD = new Date("2100-01-01");

describe("CASInvoiceBatchAESTController(e2e)-getInvoiceBatches", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let systemUsersService: SystemUsersService;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    systemUsersService = app.get(SystemUsersService);
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    // Delete all existing invoice batches that could impact the test results.
    await db.casInvoiceBatch.delete({
      batchDate: MoreThanOrEqual(CAS_BATCHES_UNIQUE_START_PERIOD),
    });
  });

  it(
    "Should be able to get invoice batches for the first page in a paginated result with a limit of two per page in the descending order " +
      "when there are three invoice batches available.",
    async () => {
      // Arrange
      // Create three invoice batches starting from from CAS_BATCHES_UNIQUE_START_PERIOD day.
      const [
        casInvoiceBatchFirst,
        casInvoiceBatchSecond,
        casInvoiceBatchThird,
      ] = [0, 1, 2].map((addDaysValue) =>
        createFakeCASInvoiceBatch(
          {
            creator: systemUsersService.systemUser,
          },
          {
            initialValue: {
              batchDate: addDays(addDaysValue, CAS_BATCHES_UNIQUE_START_PERIOD),
            },
          },
        ),
      );
      await db.casInvoiceBatch.save([
        casInvoiceBatchFirst,
        casInvoiceBatchSecond,
        casInvoiceBatchThird,
      ]);
      const endpoint =
        "/aest/cas-invoice-batch?page=0&pageLimit=2&sortField=batchDate&sortOrder=DESC";
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
      // Assert only the two most recent invoices batches are returned.
      expect(response.body.count).toBeGreaterThanOrEqual(3);
      expect(response.body.results).toStrictEqual([
        {
          id: casInvoiceBatchThird.id,
          batchName: casInvoiceBatchThird.batchName,
          batchDate: casInvoiceBatchThird.batchDate.toISOString(),
          approvalStatus: casInvoiceBatchThird.approvalStatus,
          approvalStatusUpdatedOn:
            casInvoiceBatchThird.approvalStatusUpdatedOn.toISOString(),
          approvalStatusUpdatedBy: "system-user",
        },
        {
          id: casInvoiceBatchSecond.id,
          batchName: casInvoiceBatchSecond.batchName,
          batchDate: casInvoiceBatchSecond.batchDate.toISOString(),
          approvalStatus: casInvoiceBatchSecond.approvalStatus,
          approvalStatusUpdatedOn:
            casInvoiceBatchSecond.approvalStatusUpdatedOn.toISOString(),
          approvalStatusUpdatedBy: "system-user",
        },
      ]);
    },
  );

  it("Should be able to get only pending invoice batches when the filter for status is applied.", async () => {
    // Arrange
    // Create three invoice with different statuses expecting to return only the pending invoice batch.
    const [
      pendingCASInvoiceBatch,
      approvedCASInvoiceBatch,
      rejectedCASInvoiceBatch,
    ] = [
      CASInvoiceBatchApprovalStatus.Pending,
      CASInvoiceBatchApprovalStatus.Approved,
      CASInvoiceBatchApprovalStatus.Rejected,
    ].map((approvalStatus) =>
      createFakeCASInvoiceBatch(
        {
          creator: systemUsersService.systemUser,
        },
        {
          initialValue: {
            approvalStatus,
            batchDate: CAS_BATCHES_UNIQUE_START_PERIOD,
          },
        },
      ),
    );
    await db.casInvoiceBatch.save([
      pendingCASInvoiceBatch,
      approvedCASInvoiceBatch,
      rejectedCASInvoiceBatch,
    ]);
    const endpoint =
      "/aest/cas-invoice-batch?page=0&pageLimit=10&sortField=batchDate&sortOrder=DESC&approvalStatusSearch=Pending";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    // Assert only pending batches were returned.
    const batches = response.body.results as CASInvoiceBatchAPIOutDTO[];
    expect(
      batches.every(
        (batch) =>
          batch.approvalStatus === CASInvoiceBatchApprovalStatus.Pending,
      ),
    ).toBe(true);
    // Expected the pending batch created is part of the result.
    expect(
      batches.some((batch) => batch.id !== pendingCASInvoiceBatch.id),
    ).toBe(true);
  });

  it("Should throw a HttpStatus Bad Request (400) error when the filter for status is invalid.", async () => {
    // Arrange
    const endpoint =
      "/aest/cas-invoice-batch?page=0&pageLimit=10&sortField=batchDate&sortOrder=DESC&approvalStatusSearch=SomeInvalidStatus";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [
          "each value in approvalStatusSearch must be one of the following values: Pending, Approved, Rejected",
        ],
        error: "Bad Request",
      });
  });

  it("Should throw a HttpStatus Bad Request (400) error when the sortField is invalid.", async () => {
    // Arrange
    const endpoint = `/aest/cas-invoice-batch?page=0&pageLimit=10&sortField=SomeInvalidField&sortOrder=DESC`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ["sortField must be one of the following values: batchDate"],
        error: "Bad Request",
      });
  });

  it("Should throw a HttpStatus Forbidden (403) error when an unauthorized Ministry user tries to get the invoice batches.", async () => {
    // Arrange
    const endpoint = "/aest/cas-invoice-batch";
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
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
