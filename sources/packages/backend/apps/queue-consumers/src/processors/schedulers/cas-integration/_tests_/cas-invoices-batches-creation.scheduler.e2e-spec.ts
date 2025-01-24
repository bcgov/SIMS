import { INestApplication } from "@nestjs/common";
import {
  createE2EDataSources,
  createFakeDisbursementValue,
  E2EDataSources,
  saveFakeApplicationDisbursements,
  saveFakeCASSupplier,
  saveFakeDisbursementReceiptsFromDisbursementSchedule,
  saveFakeStudent,
} from "@sims/test-utils";
import { QueueNames } from "@sims/utilities";
import { CASSupplierIntegrationScheduler } from "../cas-supplier-integration.scheduler";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import { DisbursementValueType, SupplierStatus } from "@sims/sims-db";
import { CASService } from "@sims/integrations/cas/cas.service";
import { SystemUsersService } from "@sims/services";
import { CASInvoicesBatchesCreationScheduler } from "../cas-invoices-batches-creation.scheduler";

jest.setTimeout(3000000);

describe(
  describeProcessorRootTest(QueueNames.CASInvoicesBatchesCreation),
  () => {
    let app: INestApplication;
    let processor: CASSupplierIntegrationScheduler;
    let db: E2EDataSources;
    let casServiceMock: CASService;
    let systemUsersService: SystemUsersService;

    beforeAll(async () => {
      const {
        nestApplication,
        dataSource,
        casServiceMock: casServiceMockFromAppModule,
      } = await createTestingAppModule();
      app = nestApplication;
      systemUsersService = nestApplication.get(SystemUsersService);
      db = createE2EDataSources(dataSource);
      casServiceMock = casServiceMockFromAppModule;
      // Processor under test.
      processor = app.get(CASInvoicesBatchesCreationScheduler);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
    });

    it.only("Should create a new CAS invoice batch when there are e-Cert receipts with no invoice associated.", async () => {
      // Arrange
      for (let i = 0; i < 50; i++) {
        const casSupplier = await saveFakeCASSupplier(db, undefined, {
          initialValues: {
            supplierStatus: SupplierStatus.VerifiedManually,
          },
        });
        const student = await saveFakeStudent(db.dataSource, { casSupplier });
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          {
            student,
            disbursementValues: [
              createFakeDisbursementValue(
                DisbursementValueType.CanadaLoan,
                "CSLF",
                1000,
              ),
              createFakeDisbursementValue(
                DisbursementValueType.CanadaGrant,
                "CSGD",
                500,
              ),
              createFakeDisbursementValue(
                DisbursementValueType.BCLoan,
                "BCSL",
                901,
                {
                  effectiveAmount: 900,
                },
              ),
              createFakeDisbursementValue(
                DisbursementValueType.BCGrant,
                "BCAG",
                351,
                { effectiveAmount: 350 },
              ),
              createFakeDisbursementValue(
                DisbursementValueType.BCGrant,
                "SBSD",
                201,
                { effectiveAmount: 200 },
              ),
              createFakeDisbursementValue(
                DisbursementValueType.BCTotalGrant,
                "BCSG",
                350,
                { effectiveAmount: 350 },
              ),
            ],
          },
        );
        const [firstDisbursementSchedule] =
          application.currentAssessment.disbursementSchedules;
        await saveFakeDisbursementReceiptsFromDisbursementSchedule(
          db,
          firstDisbursementSchedule,
        );
      }

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      // expect(result).toStrictEqual([
      //   "Process finalized with success.",
      //   "Pending suppliers to update found: 0.",
      //   "Records updated: 0.",
      // ]);
      // expect(
      //   mockedJob.containLogMessages([
      //     "Found 0 records to be updated.",
      //     "CAS supplier integration executed.",
      //   ]),
      // ).toBe(true);
    });
  },
);
