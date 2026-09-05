import { EvaluationProgramData } from "../education-program.service.models";
import { EducationProgramBaseEvaluator } from "./education-program-base-evaluator";

export class EducationProgramFieldOfStudyCodeEvaluator extends EducationProgramBaseEvaluator<number> {
  evaluate(data: Partial<EvaluationProgramData>): number {
    if (!data.cipCode || !data.credentialType) {
      return 20;
    }
    const sabcCode = this.getSABCCodes()[data.cipCode.substring(0, 2)];
    const levelOfStudyCode = this.getLevelOfStudyCodes()[data.credentialType];
    const returnValue =
      !!sabcCode && !!levelOfStudyCode
        ? this.getFieldOfStudyCodes()[`${sabcCode}${levelOfStudyCode}`]
        : 20;
    return returnValue;
  }

  /**
   * Gets the level of study codes.
   * @returns Level of study codes.
   */
  private getLevelOfStudyCodes(): Record<string, string> {
    return {
      undergraduateCertificate: "8",
      undergraduateCitation: "8",
      undergraduateDiploma: "7",
      undergraduateDegree: "3",
      graduateCertificate: "5",
      graduateDiploma: "5",
      graduateDegreeOrMasters: "5",
      postGraduateOrDoctorate: "6",
      qualifyingStudies: "1",
    };
  }

  /**
   * Gets the field of study codes.
   * @returns Field of study codes.
   */
  private getFieldOfStudyCodes(): Record<string, number> {
    return {
      P7: 25,
      P5: 55,
      P8: 25,
      P3: 40,
      P6: 70,
      P4: 40,
      P2: 25,
      P1: 25,
      Q4: 39,
      Q7: 24,
      Q5: 54,
      Q1: 24,
      Q6: 69,
      Q2: 24,
      Q8: 24,
      Q3: 39,
      R7: 23,
      R6: 68,
      R4: 38,
      R5: 53,
      R2: 23,
      R3: 38,
      R8: 23,
      R1: 23,
      S8: 22,
      S1: 22,
      S4: 37,
      S3: 37,
      S2: 22,
      S5: 52,
      S7: 22,
      S6: 67,
      T1: 21,
      T7: 21,
      T4: 36,
      T5: 51,
      T3: 36,
      T8: 21,
      T6: 66,
      T2: 21,
      U8: 20,
      U3: 35,
      U2: 20,
      U4: 35,
      U7: 20,
      U5: 50,
      U1: 20,
      U6: 65,
      V1: 19,
      V3: 34,
      V6: 64,
      V5: 49,
      V2: 19,
      V7: 19,
      V4: 34,
      V8: 19,
      W8: 18,
      W4: 33,
      W2: 18,
      W7: 18,
      W5: 48,
      W1: 18,
      W3: 33,
      W6: 63,
      X5: 47,
      X2: 17,
      X1: 17,
      X4: 32,
      X8: 17,
      X3: 32,
      X6: 62,
      X7: 17,
      Y4: 31,
      Y8: 16,
      Y5: 46,
      Y6: 61,
      Y2: 16,
      Y3: 31,
      Y1: 16,
      Y7: 16,
      Z7: 15,
      Z8: 15,
      Z5: 45,
      Z4: 30,
      Z2: 15,
      Z3: 30,
      Z1: 15,
      Z6: 60,
    };
  }

  /**
   * Gets the SABC codes.
   * @returns SABC codes.
   */
  private getSABCCodes(): Record<string, string> {
    return {
      "11": "Z",
      "09": "Z",
      "52": "Z",
      "01": "Y",
      "03": "Y",
      "05": "X",
      "16": "X",
      "23": "X",
      "24": "X",
      "25": "X",
      "42": "X",
      "27": "X",
      "30": "X",
      "38": "X",
      "40": "X",
      "45": "X",
      "50": "X",
      "53": "X",
      "54": "X",
      "55": "X",
      "13": "W",
      "19": "W",
      "28": "W",
      "31": "W",
      "44": "W",
      "60": "V",
      "04": "U",
      "10": "U",
      "14": "U",
      "15": "U",
      "29": "U",
      "41": "U",
      "26": "T",
      "22": "S",
      "43": "S",
      "51": "R",
      "61": "R",
      "39": "Q",
      "12": "P",
      "21": "P",
      "32": "P",
      "33": "P",
      "34": "P",
      "35": "P",
      "36": "P",
      "37": "P",
      "46": "P",
      "47": "P",
      "48": "P",
      "49": "P",
    };
  }
}
