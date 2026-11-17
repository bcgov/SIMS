import { CASService, CreateSupplierAndSiteData } from "@sims/integrations/cas";
import { Mocked } from "@suites/unit";
import { HttpService } from "@nestjs/axios";
import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
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

  it("Should throw an error with the CAS response body when CAS returns a bad request without CAS returned messages.", async () => {
    // Arrange
    const casResponseBody = {
      code: "BadRequest",
      message: "Invalid supplier data.",
    };
    // The CAS token is cached by the previous test, hence only the supplier creation call is mocked.
    httpService.axiosRef.post = jest.fn().mockRejectedValueOnce(
      new AxiosError(
        "Request failed with status code 400",
        "ERR_BAD_REQUEST",
        {
          headers: new AxiosHeaders(),
          method: "post",
          url: "cas-url/cfs/supplier/",
        },
        {},
        {
          status: HttpStatusCode.BadRequest,
          statusText: "Bad Request",
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: casResponseBody,
        },
      ),
    );
    const supplierData: CreateSupplierAndSiteData = {
      firstName: "First",
      lastName: "Last",
      sin: "999999999",
      emailAddress: "test@test.com",
      supplierSite: {
        addressLine1: "Street",
        city: "City",
        provinceCode: "BC",
        postalCode: "h1h h2h",
      },
    };

    // Act and Assert
    await expect(
      casService.createSupplierAndSite(supplierData),
    ).rejects.toThrow(
      `Error while creating supplier and site on CAS. CAS error details - request: POST cas-url/cfs/supplier/, code: ERR_BAD_REQUEST, status: 400, body: ${JSON.stringify(casResponseBody)}.`,
    );
  });
});
