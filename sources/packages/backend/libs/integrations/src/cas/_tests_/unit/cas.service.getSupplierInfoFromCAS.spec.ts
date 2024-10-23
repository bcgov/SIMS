import { CASService } from "@sims/integrations/cas/cas.service";
import { TestBed, Mocked } from "@suites/unit";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@sims/utilities/config";

const ACCESS_TOKEN = "access_token";

describe("CASService-getSupplierInfoFromCAS", () => {
  let casService: CASService;
  let httpService: Mocked<HttpService>;
  let configService: Mocked<ConfigService>;

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.solitary(CASService).compile();
    casService = unit;
    configService = unitRef.get(ConfigService);
    httpService = unitRef.get(HttpService);
    configService.casIntegration.baseUrl = "cas-url";
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Should invoke CAS API with last name upper case and without special characters when last name has special characters and is not entirely upper case.", async () => {
    // Arrange
    mockAuthResponse();

    // Act
    await casService.getSupplierInfoFromCAS(
      "dummy_sin_value",
      "Last name with special characters: ÁÉÍÓÚ—áéíóú",
    );

    // Assert
    expect(httpService.axiosRef.get).toHaveBeenCalledWith(
      "cas-url/cfs/supplier/LAST NAME WITH SPECIAL CHARACTERS: AEIOU-AEIOU/lastname/dummy_sin_value/sin",
      { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } },
    );
  });

  /**
   * Mock the first post call for authentication.
   */
  function mockAuthResponse(): void {
    httpService.axiosRef.post = jest.fn().mockResolvedValueOnce({
      data: {
        access_token: ACCESS_TOKEN,
        token_type: "bearer",
        expires_in: 3600,
      },
    });
  }
});
