import { CASService, CreateSupplierAndSiteData } from "@sims/integrations/cas";
import { Mocked } from "@suites/unit";
import { HttpService } from "@nestjs/axios";
import {
  DEFAULT_CAS_AXIOS_AUTH_HEADER,
  initializeService,
  mockAuthenticationResponseOnce,
} from "./cas-test.utils";

describe("CASService-createSupplierAndSite", () => {
  let casService: CASService;
  let httpService: Mocked<HttpService>;

  beforeAll(async () => {
    [casService, httpService] = await initializeService();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Should invoke CAS API with formatted payload when all data was provided as expected.", async () => {
    // Arrange
    mockAuthenticationResponseOnce(httpService).mockResolvedValue({
      data: {
        SUPPLIER_NUMBER: "123456",
        SUPPLIER_SITE_CODE: "001",
      },
    });

    const supplierData: CreateSupplierAndSiteData = {
      firstName:
        "First With Special Characters áÉíÓú and Very Extensive Number of Characters",
      lastName: "Some Last-Name With Length Over the Maximum",
      sin: "999999999",
      emailAddress: "test@test.com",
      supplierSite: {
        addressLine1: "{[(Street—5pecial)]},. Characters-ãñè-Maximum",
        city: "City Name Over Maximum Length",
        provinceCode: "BC",
        postalCode: "h1h h2h",
      },
    };

    // Act
    await casService.createSupplierAndSite(supplierData);

    // Assert
    expect(httpService.axiosRef.post).toHaveBeenCalledWith(
      "cas-url/cfs/supplier/",
      {
        SupplierName:
          "SOME LAST-NAME WITH LENGTH OVER THE MAXIMUM, FIRST WITH SPECIAL CHARACTERS AEIOU",
        SubCategory: "Individual",
        Sin: "999999999",
        SupplierAddress: [
          {
            AddressLine1: "STREET-5PECIAL CHARACTERS-ANE-MAXIM",
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
