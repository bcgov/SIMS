import { RelationshipStatus } from "@sims/sims-db";
import { getMaritalStatusCode } from "@sims/utilities/esdc-utils";

describe("ESDCUtils-getMaritalStatusCode", () => {
  [
    { Code: "S", Status: RelationshipStatus.Single },
    { Code: "M", Status: RelationshipStatus.Married },
    { Code: "M", Status: RelationshipStatus.MarriedUnable },
    { Code: "O", Status: RelationshipStatus.Other },
  ].forEach(({ Code, Status }) => {
    it(`Should return '${Code}' when marital status is ${Status}.`, () => {
      const result = getMaritalStatusCode(Status);
      expect(result).toBe(Code);
    });
  });
});
