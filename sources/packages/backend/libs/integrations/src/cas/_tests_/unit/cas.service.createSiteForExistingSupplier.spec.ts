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
});
