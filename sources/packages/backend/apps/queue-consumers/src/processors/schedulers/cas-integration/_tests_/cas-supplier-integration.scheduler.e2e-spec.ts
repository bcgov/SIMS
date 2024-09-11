import { INestApplication } from "@nestjs/common";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeCASSupplier,
} from "@sims/test-utils";
import { QueueNames } from "@sims/utilities";
import { CASSupplierIntegrationScheduler } from "../cas-supplier-integration.scheduler";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import { SupplierStatus } from "@sims/sims-db";
import {
  CAS_LOGON_MOCKED_RESULT,
  SUPPLIER_INFO_FROM_CAS_MOCKED_RESULT,
} from "../../../../../test/helpers/mock-utils/cas-service.mock";
import { CASService } from "@sims/integrations/cas/cas.service";

describe(describeProcessorRootTest(QueueNames.CASSupplierIntegration), () => {
  let app: INestApplication;
  let processor: CASSupplierIntegrationScheduler;
  let db: E2EDataSources;
  let casServiceMock: CASService;
  const [supplierMockedResult] = SUPPLIER_INFO_FROM_CAS_MOCKED_RESULT.items;

  beforeAll(async () => {
    const {
      nestApplication,
      dataSource,
      casServiceMock: casServiceMockFromAppModule,
    } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    casServiceMock = casServiceMockFromAppModule;
    // Processor under test.
    processor = app.get(CASSupplierIntegrationScheduler);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it("Should finalize CAS supplier process with success when no supplier found.", async () => {
    // Queued job.
    const mockedJob = mockBullJob<void>();

    // Act
    const result = await processor.processCASSupplierInformation(mockedJob.job);

    // Assert
    expect(result).toStrictEqual([
      "Process finalized with success.",
      "Pending suppliers to update found: 0.",
      "Records updated: 0.",
    ]);
    expect(
      mockedJob.containLogMessages([
        "Found 0 records to be updated.",
        "CAS supplier integration executed.",
      ]),
    ).toBe(true);

    expect(casServiceMock.logon).not.toHaveBeenCalled();
    expect(casServiceMock.getSupplierInfoFromCAS).not.toHaveBeenCalled();
  });

  it("Should update CAS supplier table when found pending supplier information to be updated.", async () => {
    const savedCASSupplier = await saveFakeCASSupplier(db);
    const student = savedCASSupplier.student;

    // Queued job.
    const mockedJob = mockBullJob<void>();

    // Act
    const result = await processor.processCASSupplierInformation(mockedJob.job);

    // Assert
    expect(result).toStrictEqual([
      "Process finalized with success.",
      "Pending suppliers to update found: 1.",
      "Records updated: 1.",
    ]);
    expect(
      mockedJob.containLogMessages([
        "Found 1 records to be updated.",
        "Logon successful.",
        `Requesting info for CAS supplier id ${savedCASSupplier.id}.`,
        "Updating CAS supplier table.",
        "CAS supplier integration executed.",
      ]),
    ).toBe(true);

    expect(casServiceMock.logon).toHaveBeenCalled();
    expect(casServiceMock.getSupplierInfoFromCAS).toHaveBeenCalledWith(
      CAS_LOGON_MOCKED_RESULT.access_token,
      student.sinValidation.sin,
      student.user.lastName.toUpperCase(),
    );

    const updateCASSupplier = await db.casSupplier.findOneBy({
      id: savedCASSupplier.id,
    });

    expect(updateCASSupplier.isValid).toBe(true);
    expect(updateCASSupplier.supplierAddress).toStrictEqual({
      supplierSiteCode: "001",
      addressLine1: "3350 DOUGLAS ST",
      addressLine2: null,
      city: "VICTORIA",
      provinceState: "BC",
      country: "CA",
      postalCode: "V8Z7X9",
      status: "ACTIVE",
      siteProtected: null,
      lastUpdated: new Date("2024-05-01 13:55:04").toISOString(),
    });
    expect(updateCASSupplier.supplierStatus).toBe(SupplierStatus.Verified);
    expect(updateCASSupplier.supplierName).toBe(
      supplierMockedResult.suppliername,
    );
  });
});
