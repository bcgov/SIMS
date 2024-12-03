import { INestApplication } from "@nestjs/common";
import {
  createE2EDataSources,
  createFakeUser,
  E2EDataSources,
  saveFakeCASSupplier,
  saveFakeStudent,
} from "@sims/test-utils";
import { COUNTRY_CANADA, OTHER_COUNTRY, QueueNames } from "@sims/utilities";
import { CASSupplierIntegrationScheduler } from "../cas-supplier-integration.scheduler";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import { ContactInfo, SupplierStatus } from "@sims/sims-db";
import {
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
  createFakeCASSiteForExistingSupplierResponse,
  createFakeCASNotFoundSupplierResponse,
  createFakeCASSupplierResponse,
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
    expect(casServiceMock.getSupplierInfoFromCAS).not.toHaveBeenCalled();
  });

  it("Should update CAS supplier table when found pending supplier information to be updated with an active address match.", async () => {
    // Arrange
    // Created a student with same address line 1 and postal code from the expected CAS mocked result.
    // Postal code has a white space that is expected to be removed.
    const student = await saveFakeStudent(db.dataSource, undefined, {
      initialValue: {
        contactInfo: {
          address: {
            addressLine1: "3350 DOUGLAS ST",
            city: "Victoria",
            country: "Canada",
            selectedCountry: COUNTRY_CANADA,
            provinceState: "BC",
            postalCode: "V8Z 7X9",
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
    ]);
    expect(
      mockedJob.containLogMessages([
        "Found 1 records to be updated.",
        `Processing student CAS supplier ID: ${savedCASSupplier.id}.`,
        `CAS evaluation result status: ${CASEvaluationStatus.ActiveSupplierAndSiteFound}.`,
        "Active CAS supplier and site found.",
        "Updated CAS supplier for the student.",
      ]),
    ).toBe(true);
    expect(casServiceMock.getSupplierInfoFromCAS).toHaveBeenCalledWith(
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
    const referenceDate = new Date();
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
      "Error(s): 0, Warning(s): 1, Info: 10",
    ]);
    expect(
      mockedJob.containLogMessages([
        "Found 1 records to be updated.",
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
    expect(updateCASSupplier).toEqual({
      id: savedCASSupplier.id,
      isValid: false,
      supplierStatus: SupplierStatus.ManualIntervention,
      updatedAt: expect.any(Date),
      modifier: { id: systemUsersService.systemUser.id },
    });
    // Ensure updatedAt was updated.
    expect(updateCASSupplier.updatedAt.getTime()).toBeGreaterThan(
      referenceDate.getTime(),
    );
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
      "Error(s): 0, Warning(s): 1, Info: 10",
    ]);
    expect(
      mockedJob.containLogMessages([
        "Found 1 records to be updated.",
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
      // Configure CAS mock to return an empty result for the GetSupplier
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

  it("Should create a new site and update the student CAS supplier when an active CAS supplier exists with no match addresses.", async () => {
    // Arrange
    // Created a student with same address line 1 and postal code from the expected CAS mocked result.
    // Postal code has a white space that is expected to be removed.
    const student = await saveFakeStudent(db.dataSource, undefined, {
      initialValue: {
        contactInfo: {
          address: {
            addressLine1: "3350 DOUGLAS ST",
            city: "Victoria",
            country: "Canada",
            selectedCountry: COUNTRY_CANADA,
            provinceState: "BC",
            postalCode: "V8Z 7X9",
          },
        } as ContactInfo,
      },
    });
    const referenceDate = new Date();
    const savedCASSupplier = await saveFakeCASSupplier(db, { student });

    // Configure CAS mock to return a result for the GetSupplier
    // with the same supplier number and address line 1 from the
    // saved CAS supplier but a different postal code.
    casServiceMock.getSupplierInfoFromCAS = jest.fn(() =>
      Promise.resolve(
        createFakeCASSupplierResponse({
          initialValues: {
            postalCode: "V1V1V1", // The postal code is added to mismatch the address.
          },
        }),
      ),
    );

    // Configure CAS mock to return a successful result for the CreateSiteForExistingSupplier.
    const createSupplierNoSiteResponse =
      createFakeCASSiteForExistingSupplierResponse({
        initialValues: {
          supplierNumber: savedCASSupplier.supplierNumber,
          supplierAddress: savedCASSupplier.supplierAddress,
        },
      });
    casServiceMock.createSiteForExistingSupplier = jest.fn(() =>
      Promise.resolve(createSupplierNoSiteResponse),
    );

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
        "Executing CAS supplier integration...",
        "Found 1 records to be updated.",
        `Processing student CAS supplier ID: ${savedCASSupplier.id}.`,
        `CAS evaluation result status: ${CASEvaluationStatus.ActiveSupplierFound}.`,
        "Active CAS supplier found.",
        "Created a new site on CAS.",
        "Updated CAS supplier and site for the student.",
        "CAS supplier integration executed.",
      ]),
    ).toBe(true);
    // Assert the API methods were called.
    expect(casServiceMock.getSupplierInfoFromCAS).toHaveBeenCalled();
    expect(casServiceMock.createSiteForExistingSupplier).toHaveBeenCalled();
    // Assert DB was updated.
    const updateCASSupplier = await db.casSupplier.findOne({
      select: {
        id: true,
        supplierNumber: true,
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
      createSupplierNoSiteResponse.submittedData.SupplierAddress;
    expect(updateCASSupplier).toEqual({
      id: savedCASSupplier.id,
      supplierNumber: createSupplierNoSiteResponse.response.supplierNumber,
      status: "ACTIVE",
      lastUpdated: expect.any(Date),
      supplierAddress: {
        supplierSiteCode:
          createSupplierNoSiteResponse.response.supplierSiteCode,
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
  });

  it("Should create a new site and update the student CAS supplier when an active CAS supplier exists with inactive site address.", async () => {
    // Arrange
    // Created a student with same address line 1 and postal code from the expected CAS mocked result.
    // Postal code has a white space that is expected to be removed.
    const student = await saveFakeStudent(db.dataSource, undefined, {
      initialValue: {
        contactInfo: {
          address: {
            addressLine1: "3350 DOUGLAS ST",
            city: "Victoria",
            country: "Canada",
            selectedCountry: COUNTRY_CANADA,
            provinceState: "BC",
            postalCode: "V8Z 7X9",
          },
        } as ContactInfo,
      },
    });
    const referenceDate = new Date();
    const savedCASSupplier = await saveFakeCASSupplier(db, { student });

    // Configure CAS mock to return a result for the GetSupplier
    // with the same supplier number, address line 1 and postal code
    // from the saved CAS supplier but inactive status.
    casServiceMock.getSupplierInfoFromCAS = jest.fn(() =>
      Promise.resolve(
        createFakeCASSupplierResponse({
          initialValues: {
            siteStatus: "INACTIVE", // The status is added to mismatch the address's status.
          },
        }),
      ),
    );

    // Configure CAS mock to return a successful result for the CreateSiteForExistingSupplier.
    const createSupplierNoSiteResponse =
      createFakeCASSiteForExistingSupplierResponse({
        initialValues: {
          supplierNumber: savedCASSupplier.supplierNumber,
          supplierAddress: savedCASSupplier.supplierAddress,
        },
      });
    casServiceMock.createSiteForExistingSupplier = jest.fn(() =>
      Promise.resolve(createSupplierNoSiteResponse),
    );

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
        "Executing CAS supplier integration...",
        "Found 1 records to be updated.",
        `Processing student CAS supplier ID: ${savedCASSupplier.id}.`,
        `CAS evaluation result status: ${CASEvaluationStatus.ActiveSupplierFound}.`,
        "Active CAS supplier found.",
        "Created a new site on CAS.",
        "Updated CAS supplier and site for the student.",
        "CAS supplier integration executed.",
      ]),
    ).toBe(true);
    // Assert the API methods were called.
    expect(casServiceMock.getSupplierInfoFromCAS).toHaveBeenCalled();
    expect(casServiceMock.createSiteForExistingSupplier).toHaveBeenCalled();
    // Assert DB was updated.
    const updateCASSupplier = await db.casSupplier.findOne({
      select: {
        id: true,
        supplierNumber: true,
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
      createSupplierNoSiteResponse.submittedData.SupplierAddress;
    expect(updateCASSupplier).toEqual({
      id: savedCASSupplier.id,
      supplierNumber: createSupplierNoSiteResponse.response.supplierNumber,
      status: "ACTIVE",
      lastUpdated: expect.any(Date),
      supplierAddress: {
        supplierSiteCode:
          createSupplierNoSiteResponse.response.supplierSiteCode,
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
  });

  it("Should throw an error for the first student and process the second one when the CAS API call failed for the first student but worked for the second one.", async () => {
    // Arrange
    // Create two mocks where the first one will throw an error
    // and the second one is expected to work.
    casServiceMock.getSupplierInfoFromCAS = jest
      .fn()
      .mockRejectedValueOnce("Unknown error")
      .mockResolvedValue(
        Promise.resolve(createFakeCASNotFoundSupplierResponse()),
      );
    // Mock to be also used for processing the second student.
    casServiceMock.createSupplierAndSite = jest.fn(() =>
      Promise.resolve(createFakeCASCreateSupplierAndSiteResponse()),
    );
    // Student CAS pending request expected to fail.
    const savedCASSupplierToFail = await saveFakeCASSupplier(db);
    // Student CAS pending request expected to succeed.
    const studentToSucceed = await saveFakeStudent(db.dataSource, undefined, {
      initialValue: {
        contactInfo: {
          address: {
            addressLine1: "3350 Douglas St",
            city: "Victoria",
            country: "Canada",
            selectedCountry: COUNTRY_CANADA,
            provinceState: "BC",
            postalCode: "V8Z 7X9",
          },
        } as ContactInfo,
      },
    });
    const savedCASSupplierToSucceed = await saveFakeCASSupplier(db, {
      student: studentToSucceed,
    });

    // Queued job.
    const mockedJob = mockBullJob<void>();

    // Act
    await expect(
      processor.processCASSupplierInformation(mockedJob.job),
    ).rejects.toStrictEqual(
      new Error(
        "One or more errors were reported during the process, please see logs for details.",
      ),
    );

    // Assert
    expect(
      mockedJob.containLogMessages([
        "Executing CAS supplier integration...",
        "Found 2 records to be updated.",
        `Processing student CAS supplier ID: ${savedCASSupplierToFail.id}.`,
        'Unexpected error while processing supplier. "Unknown error"',
        `Processing student CAS supplier ID: ${savedCASSupplierToSucceed.id}.`,
        `CAS evaluation result status: ${CASEvaluationStatus.NotFound}.`,
        `No active CAS supplier found. Reason: ${NotFoundReason.SupplierNotFound}.`,
        "Created supplier and site on CAS.",
        "Updated CAS supplier and site for the student.",
        "CAS supplier integration executed.",
      ]),
    ).toBe(true);
  });
});
