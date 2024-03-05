import { OfferingIntensity } from "@sims/sims-db";
import { DisbursementReceiptService } from "../../disbursement-receipt.service";

describe("DisbursementReceiptService-getLoanAwardCode", () => {
  [
    {
      intensity: OfferingIntensity.fullTime,
      fundingType: "FE",
      expected: "CSLF",
    },
    {
      intensity: OfferingIntensity.fullTime,
      fundingType: "BC",
      expected: "BCSL",
    },
    {
      intensity: OfferingIntensity.partTime,
      fundingType: "FE",
      expected: "CSLP",
    },
    {
      intensity: OfferingIntensity.partTime,
      fundingType: "BC",
      expected: null,
    },
  ].forEach((combination) => {
    it(`Should return '${
      combination.expected ?? "null"
    }' when fundingType is '${combination.fundingType}' intensity is '${
      combination.intensity
    }'.`, () => {
      // Act
      const result = DisbursementReceiptService.getLoanAwardCode(
        combination.fundingType,
        combination.intensity,
      );
      // Assert
      expect(result).toBe(combination.expected);
    });
  });
});
