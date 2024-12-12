import {
  CASService,
  CreateExistingSupplierSiteData,
} from "@sims/integrations/cas";
import { Mocked } from "@suites/unit";
import { HttpService } from "@nestjs/axios";
import {
  DEFAULT_CAS_AXIOS_AUTH_HEADER,
  initializeService,
  mockAuthenticationResponseOnce,
} from "./cas-test.utils";
import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import { CAS_BAD_REQUEST } from "@sims/integrations/constants";

describe("CASService-createSiteForExistingSupplier", () => {
  let casService: CASService;
  let httpService: Mocked<HttpService>;

  beforeAll(async () => {
    [casService, httpService] = await initializeService();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Should invoke CAS API to create site for existing supplier with formatted payload when all data was provided as expected.", async () => {
    // Arrange
    mockAuthenticationResponseOnce(httpService).mockResolvedValue({
      data: {
        SUPPLIER_NUMBER: "1234567",
        SUPPLIER_SITE_CODE: "001",
      },
    });

    const supplierData: CreateExistingSupplierSiteData = {
      supplierNumber: "1234567",
      emailAddress: "test@test.com",
      supplierSite: {
        addressLine1: "Street-Special Characters-ãñè-Maximum",
        city: "City Name Over Maximum Length",
        provinceCode: "BC",
        postalCode: "h1h h2h",
      },
    };

    // Act
    await casService.createSiteForExistingSupplier(supplierData);

    // Assert
    expect(httpService.axiosRef.post).toHaveBeenCalledWith(
      "cas-url/cfs/supplier/1234567/site",
      {
        SupplierNumber: "1234567",
        SupplierAddress: [
          {
            AddressLine1: "STREET-SPECIAL CHARACTERS-ANE-MAXIM",
            City: "City Name Over Maximum Le",
            Province: "BC",
            Country: "CA",
            PostalCode: "H1HH2H",
            EmailAddress: supplierData.emailAddress,
          },
        ],
      },
      DEFAULT_CAS_AXIOS_AUTH_HEADER,
    );
  });

  it("Should throw error when CAS API to create site for existing supplier with existing SIN payload data was provided.", async () => {
    // Arrange
    mockAuthenticationResponseOnce(httpService).mockResolvedValue({
      data: {
        SUPPLIER_NUMBER: "9999999",
        SUPPLIER_SITE_CODE: "123",
      },
    });
    const supplierData: CreateExistingSupplierSiteData = {
      supplierNumber: "9999999",
      emailAddress: "test@test.com",
      supplierSite: {
        addressLine1: "Street-Special Characters-ãñè-Maximum",
        city: "City Name Over Maximum Length",
        provinceCode: "BC",
        postalCode: "h1h h2h",
      },
    };
    //Act
    httpService.axiosRef.post = jest.fn().mockImplementationOnce(() => {
      const error = new AxiosError(
        "Request failed with status code 400",
        "ERR_BAD_REQUEST",
        {
          headers: new AxiosHeaders(),
        },
        {},
        {
          status: HttpStatusCode.BadRequest,
          statusText: "Bad Request",
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: {
            "CAS-Returned-Messages":
              "[0034] SIN is already in use. | [9999] Duplicate Supplier , Reason: [0065]- Possible duplicate exists, please use online form",
          },
        },
      );
      throw error;
    });

    //Assert
    await expect(
      casService.createSiteForExistingSupplier(supplierData),
    ).rejects.toThrow(
      expect.objectContaining({
        message: "CAS Bad Request Errors",
        name: CAS_BAD_REQUEST,
        objectInfo: [
          "[0034] SIN is already in use.",
          "[9999] Duplicate Supplier , Reason: [0065]- Possible duplicate exists, please use online form",
        ],
      }),
    );
  });
});
