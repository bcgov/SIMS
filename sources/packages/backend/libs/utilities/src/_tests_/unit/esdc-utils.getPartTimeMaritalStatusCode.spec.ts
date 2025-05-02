import { getPartTimeMaritalStatusCode } from "../../esdc-utils";
import { RelationshipStatus } from "@sims/sims-db";

describe("ESDCUtils-getPartTimeMaritalStatusCode", () => {
  [
    { Code: "SI", Status: RelationshipStatus.Single },
    { Code: "MA", Status: RelationshipStatus.Married },
    { Code: "MA", Status: RelationshipStatus.MarriedUnable },
    { Code: "SP", Status: RelationshipStatus.Other },
  ].forEach(({ Code, Status }) => {
    it(`Should return '${Code}' when marital status is ${Status}.`, () => {
      const result = getPartTimeMaritalStatusCode(Status);
      expect(result).toBe(Code);
    });
  });
});
