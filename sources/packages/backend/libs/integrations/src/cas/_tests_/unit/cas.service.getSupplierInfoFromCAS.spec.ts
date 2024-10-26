import { CASService } from "@sims/integrations/cas";
import { Mocked } from "@suites/unit";
import { HttpService } from "@nestjs/axios";
import {
  DEFAULT_CAS_AXIOS_AUTH_HEADER,
  initializeService,
  mockAuthenticationResponseOnce,
} from "./cas-test.utils";

describe("CASService-getSupplierInfoFromCAS", () => {
  let casService: CASService;
  let httpService: Mocked<HttpService>;

  beforeAll(async () => {
    [casService, httpService] = await initializeService();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Should invoke CAS API with last name upper case and without special characters when last name has special characters and is not entirely upper case.", async () => {
    // Arrange
    mockAuthenticationResponseOnce(httpService);

    // Act
    await casService.getSupplierInfoFromCAS(
      "dummy_sin_value",
      "Last name with special characters: ÁÉÍÓÚ—áéíóú",
    );

    // Assert
    expect(httpService.axiosRef.get).toHaveBeenCalledWith(
      "cas-url/cfs/supplier/LAST NAME WITH SPECIAL CHARACTERS: AEIOU-AEIOU/lastname/dummy_sin_value/sin",
      DEFAULT_CAS_AXIOS_AUTH_HEADER,
    );
  });
});
