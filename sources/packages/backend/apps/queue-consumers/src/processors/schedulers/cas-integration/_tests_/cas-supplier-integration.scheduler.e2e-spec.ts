import { INestApplication } from "@nestjs/common";
import {
  createE2EDataSources,
  createFakeUser,
  E2EDataSources,
  saveFakeCASSupplier,
  saveFakeStudent,
} from "@sims/test-utils";
import { OTHER_COUNTRY, QueueNames } from "@sims/utilities";
import { CASSupplierIntegrationScheduler } from "../cas-supplier-integration.scheduler";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import { ContactInfo, SupplierStatus } from "@sims/sims-db";
import {
  CAS_LOGON_MOCKED_RESULT,
  resetCASServiceMock,
  SUPPLIER_INFO_FROM_CAS_MOCKED_RESULT,
} from "../../../../../test/helpers/mock-utils/cas-service.mock";
import { CASService } from "@sims/integrations/cas/cas.service";
import {
  CASEvaluationStatus,
  NotFoundReason,
  PreValidationsFailedReason,
} from "../../../../services/cas-supplier/cas-supplier.models";
import {
  createFakeCASCreateSupplierAndSiteResponse,
  createFakeCASNotFoundSupplierResponse,
} from "../../../../../test/helpers/mock-utils/cas-response.factory";
import { SystemUsersService } from "@sims/services";

describe(describeProcessorRootTest(QueueNames.CASSupplierIntegration), () => {
  let app: INestApplication;
  let processor: CASSupplierIntegrationScheduler;
  let db: E2EDataSources;
  let casServiceMock: CASService;
  let systemUsersService: SystemUsersService;
  const [supplierMockedResult] = SUPPLIER_INFO_FROM_CAS_MOCKED_RESULT.items;

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
    processor = app.get(CASSupplierIntegrationScheduler);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    resetCASServiceMock(casServiceMock);
    // Update existing records to avoid conflicts between tests.
    await db.casSupplier.update(
      {
        supplierStatus: SupplierStatus.PendingSupplierVerification,
      },
      { supplierStatus: SupplierStatus.VerifiedManually },
    );
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
    // Arrange
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
        `Processing student CAS supplier ID: ${savedCASSupplier.id}.`,
        `CAS evaluation result status: ${CASEvaluationStatus.ActiveSupplierFound}.`,
        "Active CAS supplier found.",
        "Updated CAS supplier for the student.",
      ]),
    ).toBe(true);

    expect(casServiceMock.logon).toHaveBeenCalled();
    expect(casServiceMock.getSupplierInfoFromCAS).toHaveBeenCalledWith(
      CAS_LOGON_MOCKED_RESULT.access_token,
      student.sinValidation.sin,
      student.user.lastName,
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

  it("Should update CAS supplier table to manual intervention when student does not have a first name.", async () => {
    // Arrange
    const user = createFakeUser();
    user.firstName = null;
    const student = await saveFakeStudent(db.dataSource, { user });
    const savedCASSupplier = await saveFakeCASSupplier(db, { student });

    // Queued job.
    const mockedJob = mockBullJob<void>();

    // Act
    const result = await processor.processCASSupplierInformation(mockedJob.job);

    // Assert
    expect(result).toStrictEqual([
      "Process finalized with success.",
      "Pending suppliers to update found: 1.",
      "Records updated: 1.",
      "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
      "Error(s): 0, Warning(s): 1, Info: 12",
    ]);
    expect(
      mockedJob.containLogMessages([
        "Found 1 records to be updated.",
        "Logon successful.",
        `Not possible to retrieve CAS supplier information because some pre-validations were not fulfilled. Reason(s): ${PreValidationsFailedReason.GivenNamesNotPresent}.`,
      ]),
    ).toBe(true);
    // Assert the API methods were not called.
    expect(casServiceMock.getSupplierInfoFromCAS).not.toHaveBeenCalled();
    // Assert DB was updated.
    const updateCASSupplier = await db.casSupplier.findOne({
      select: {
        id: true,
        isValid: true,
        supplierStatus: true,
      },
      where: {
        id: savedCASSupplier.id,
      },
    });
    expect(updateCASSupplier).toEqual({
      id: savedCASSupplier.id,
      isValid: false,
      supplierStatus: SupplierStatus.ManualIntervention,
    });
  });

  it("Should update CAS supplier table to manual intervention when student address is not from Canada.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource, undefined, {
      initialValue: {
        contactInfo: {
          address: {
            selectedCountry: OTHER_COUNTRY,
          },
        } as ContactInfo,
      },
    });
    const savedCASSupplier = await saveFakeCASSupplier(db, { student });

    // Queued job.
    const mockedJob = mockBullJob<void>();

    // Act
    const result = await processor.processCASSupplierInformation(mockedJob.job);

    // Assert
    expect(result).toStrictEqual([
      "Process finalized with success.",
      "Pending suppliers to update found: 1.",
      "Records updated: 1.",
      "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
      "Error(s): 0, Warning(s): 1, Info: 12",
    ]);
    expect(
      mockedJob.containLogMessages([
        "Found 1 records to be updated.",
        "Logon successful.",
        `Not possible to retrieve CAS supplier information because some pre-validations were not fulfilled. Reason(s): ${PreValidationsFailedReason.NonCanadianAddress}.`,
      ]),
    ).toBe(true);
    // Assert the API methods were not called.
    expect(casServiceMock.getSupplierInfoFromCAS).not.toHaveBeenCalled();
    // Assert DB was updated.
    const updateCASSupplier = await db.casSupplier.findOne({
      select: {
        id: true,
        isValid: true,
        supplierStatus: true,
      },
      where: {
        id: savedCASSupplier.id,
      },
    });
    expect(updateCASSupplier).toEqual({
      id: savedCASSupplier.id,
      isValid: false,
      supplierStatus: SupplierStatus.ManualIntervention,
    });
  });

  it(
    "Should create a new supplier and site on CAS and update CAS suppliers table when " +
      "the student was not found on CAS and the request to create the supplier and site was successful.",
    async () => {
      // Arrange
      const referenceDate = new Date();
      const savedCASSupplier = await saveFakeCASSupplier(db);
      // Configure CAS mock to return em empty result for the GetSupplier
      // and a successful result for the CreateSupplierAndSite.
      casServiceMock.getSupplierInfoFromCAS = jest.fn(() =>
        Promise.resolve(createFakeCASNotFoundSupplierResponse()),
      );
      const createSupplierAndSiteResponse =
        createFakeCASCreateSupplierAndSiteResponse();
      casServiceMock.createSupplierAndSite = jest.fn(() =>
        Promise.resolve(createSupplierAndSiteResponse),
      );

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processCASSupplierInformation(
        mockedJob.job,
      );

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
          `Processing student CAS supplier ID: ${savedCASSupplier.id}.`,
          `CAS evaluation result status: ${CASEvaluationStatus.NotFound}.`,
          `No active CAS supplier found. Reason: ${NotFoundReason.SupplierNotFound}.`,
          "Created supplier and site on CAS.",
          "Updated CAS supplier and site for the student.",
        ]),
      ).toBe(true);
      // Assert the API methods were called.
      expect(casServiceMock.getSupplierInfoFromCAS).toHaveBeenCalled();
      expect(casServiceMock.createSupplierAndSite).toHaveBeenCalled();
      // Assert DB was updated.
      const updateCASSupplier = await db.casSupplier.findOne({
        select: {
          id: true,
          supplierNumber: true,
          supplierName: true,
          status: true,
          lastUpdated: true,
          supplierAddress: true as unknown,
          supplierStatus: true,
          supplierStatusUpdatedOn: true,
          isValid: true,
          updatedAt: true,
          modifier: { id: true },
        },
        relations: {
          modifier: true,
        },
        where: {
          id: savedCASSupplier.id,
        },
      });
      const [submittedAddress] =
        createSupplierAndSiteResponse.submittedData.SupplierAddress;
      expect(updateCASSupplier).toEqual({
        id: savedCASSupplier.id,
        supplierNumber: createSupplierAndSiteResponse.response.supplierNumber,
        supplierName: createSupplierAndSiteResponse.submittedData.SupplierName,
        status: "ACTIVE",
        lastUpdated: expect.any(Date),
        supplierAddress: {
          supplierSiteCode:
            createSupplierAndSiteResponse.response.supplierSiteCode,
          addressLine1: submittedAddress.AddressLine1,
          city: submittedAddress.City,
          provinceState: submittedAddress.Province,
          country: submittedAddress.Country,
          postalCode: submittedAddress.PostalCode,
          status: "ACTIVE",
          lastUpdated: expect.any(String),
        },
        supplierStatus: SupplierStatus.Verified,
        supplierStatusUpdatedOn: expect.any(Date),
        isValid: true,
        updatedAt: expect.any(Date),
        modifier: { id: systemUsersService.systemUser.id },
      });
      // Ensure updatedAt was updated.
      expect(updateCASSupplier.updatedAt.getTime()).toBeGreaterThan(
        referenceDate.getTime(),
      );
    },
  );
});
