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
      firstName: "First Name",
      lastName: "Some Last-Name",
      sin: "999999999",
      emailAddress: "test@test.com",
      supplierSite: {
        addressLine1: "Some street name",
        city: "City",
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
        SupplierName: "SOME LAST-NAME, FIRST NAME",
        SubCategory: "Individual",
        Sin: "999999999",
        SupplierAddress: [
          {
            AddressLine1: "SOME STREET NAME",
            City: supplierData.supplierSite.city,
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
