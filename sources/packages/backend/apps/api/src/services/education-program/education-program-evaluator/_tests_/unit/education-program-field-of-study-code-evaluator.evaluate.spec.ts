import { EducationProgramFieldOfStudyCodeEvaluator } from "../../education-program-field-of-study-code-evaluator";
import { ProgramEvaluationData } from "../../../education-program.service.models";

describe("EducationProgramFieldOfStudyCodeEvaluator-evaluate", () => {
  const evaluator = new EducationProgramFieldOfStudyCodeEvaluator();

  const testData = [
    {
      data: { credentialType: "undergraduateCertificate", cipCode: "12.1234" },
      expectedResult: 25,
    },
    {
      data: { credentialType: "graduateDiploma", cipCode: "12.1234" },
      expectedResult: 55,
    },
    {
      data: { credentialType: "postGraduateOrDoctorate", cipCode: "12.1234" },
      expectedResult: 70,
    },
    {
      data: { credentialType: "postGraduateOrDoctorate", cipCode: "31.1234" },
      expectedResult: 63,
    },
    {
      data: { credentialType: "undergraduateDegree", cipCode: "31.1234" },
      expectedResult: 33,
    },
    // CIP code starting with 77 which does not have an equivalent SABC code.
    {
      data: { credentialType: "undergraduateDegree", cipCode: "77.1234" },
      expectedResult: 20,
    },
    {
      data: { cipCode: "12.1234" },
      expectedResult: 20,
    },
    {
      data: { credentialType: "undergraduateDegree" },
      expectedResult: 20,
    },
    {
      data: {},
      expectedResult: 20,
    },
  ];

  testData.forEach(({ data, expectedResult }) => {
    it(`Should return ${expectedResult} when credential type is ${data.credentialType ?? "not provided"} and CIP code is ${data.cipCode ?? "not provided"}.`, () => {
      // Act
      const result = evaluator.evaluate(data as Partial<ProgramEvaluationData>);

      // Assert
      expect(result).toBe(expectedResult);
    });
  });
});
