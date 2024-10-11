import { CASService } from "@sims/integrations/cas/cas.service";
import { TestBed } from "@automock/jest";
import { HttpService } from "@nestjs/axios";

describe("CASService-getSupplierInfoFromCAS", () => {
  let casService: CASService;
  let httpService: HttpService;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(CASService).compile();
    casService = unit;
    httpService = unitRef.get(HttpService);
  });

  it("Should invoke CAS API with last name upper case and without special characters when last name has special characters and is not complexly upper case.", () => {
    // Arrange
    httpService.axiosRef.get = jest.fn();

    // Act
    casService.getSupplierInfoFromCAS(
      "token",
      "sin",
      "Last name with special characters: ÁÉÍÓÚ-áéíóú",
    );

    // Assert
    expect(httpService.axiosRef.get).toHaveBeenCalledWith(
      "undefined/cfs/supplier/LAST NAME WITH SPECIAL CHARACTERS: AEIOU-AEIOU/lastname/sin/sin",
      { headers: { Authorization: "Bearer token" } },
    );
  });
});
