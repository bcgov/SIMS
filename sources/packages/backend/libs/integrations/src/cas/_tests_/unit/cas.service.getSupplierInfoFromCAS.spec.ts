import { CASService } from "@sims/integrations/cas/cas.service";
import { TestBed } from "@automock/jest";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@sims/utilities/config";

describe("CASService-getSupplierInfoFromCAS", () => {
  let casService: CASService;
  let httpService: HttpService;
  let configService: ConfigService;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(CASService).compile();
    casService = unit;
    configService = unitRef.get(ConfigService);
    httpService = unitRef.get(HttpService);
  });

  it("Should invoke CAS API with last name upper case and without special characters when last name has special characters and is not complexly upper case.", () => {
    // Arrange
    httpService.axiosRef.get = jest.fn();
    configService.casIntegration.baseUrl = "cas-url";

    // Act
    casService.getSupplierInfoFromCAS(
      "dummy_token_value",
      "dummy_sin_value",
      "Last name with special characters: ÁÉÍÓÚ—áéíóú",
    );

    // Assert
    expect(httpService.axiosRef.get).toHaveBeenCalledWith(
      "cas-url/cfs/supplier/LAST NAME WITH SPECIAL CHARACTERS: AEIOU-AEIOU/lastname/dummy_sin_value/sin",
      { headers: { Authorization: "Bearer dummy_token_value" } },
    );
  });
});
