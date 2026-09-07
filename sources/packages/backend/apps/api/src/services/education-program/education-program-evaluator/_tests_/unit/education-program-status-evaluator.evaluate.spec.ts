import { FormYesNoOptions, ProgramStatus } from "@sims/sims-db";
import { EducationProgramStatusEvaluator } from "../../education-program-status-evaluator";
import {
  ProgramCourseLoadCalculationTypes,
  ProgramESLPercentage,
  ProgramEvaluationContext,
  ProgramEvaluationData,
} from "../../../education-program.service.models";

describe("EducationProgramStatusEvaluator-evaluate", () => {
  const evaluator = new EducationProgramStatusEvaluator();

  const baseData = {
    programDeliveryTypes: {
      deliveredOnSite: true,
      deliveredOnline: false,
    },
    deliveredOnlineAlsoOnsite: "",
    sameOnlineCreditsEarned: "",
    earnAcademicCreditsOtherInstitution: "",
    courseLoadCalculation: ProgramCourseLoadCalculationTypes.Credit,
    eslEligibility: ProgramESLPercentage.LessThan20,
    hasJointInstitution: FormYesNoOptions.No,
    hasJointDesignatedInstitution: "",
    minHoursWeek: "",
    isAviationProgram: FormYesNoOptions.No,
    entranceRequirements: {
      hasMinimumAge: false,
      minHighSchool: true,
      requirementsByInstitution: false,
      requirementsByBCITA: false,
      noneOfTheAboveEntranceRequirements: false,
    },
    hasWILComponent: FormYesNoOptions.No,
    isWILApproved: "",
    wilProgramEligibility: "",
    hasTravel: FormYesNoOptions.No,
    travelProgramEligibility: "",
    hasIntlExchange: FormYesNoOptions.No,
    intlExchangeProgramEligibility: "",
  };

  const baseContext: ProgramEvaluationContext = {
    isBCPublic: false,
    isBCPrivate: false,
  };

  const testData = [
    {
      scenario: "all conditions are met for approval",
      data: {},
      context: {},
      expectedResult: ProgramStatus.Approved,
    },
    {
      scenario:
        "program is BC private and delivered online only, making it pending",
      data: {
        programDeliveryTypes: {
          deliveredOnSite: false,
          deliveredOnline: true,
        },
      },
      context: { isBCPrivate: true },
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario: "program has a joint institution, making it pending",
      data: { hasJointInstitution: FormYesNoOptions.Yes },
      context: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario:
        "program is delivered without academic credits, making it pending",
      data: {
        deliveredOnlineAlsoOnsite: FormYesNoOptions.No,
        sameOnlineCreditsEarned: FormYesNoOptions.No,
        earnAcademicCreditsOtherInstitution: FormYesNoOptions.No,
      },
      context: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario: "program ESL eligibility is 20 or more, making it pending",
      data: { eslEligibility: ProgramESLPercentage.GreaterThanEqual20 },
      context: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario: "program has no entrance requirements, making it pending",
      data: {
        entranceRequirements: {
          hasMinimumAge: false,
          minHighSchool: false,
          requirementsByInstitution: false,
          requirementsByBCITA: false,
          noneOfTheAboveEntranceRequirements: true,
        },
      },
      context: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario:
        "program has less than the minimum expected hours per week, making it pending",
      data: {
        courseLoadCalculation: ProgramCourseLoadCalculationTypes.Hours,
        minHoursWeek: FormYesNoOptions.No,
        isAviationProgram: FormYesNoOptions.No,
      },
      context: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario: "program is an aviation program, making it pending",
      data: { isAviationProgram: FormYesNoOptions.Yes },
      context: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario:
        "program has a WIL component that is not approved, making it pending",
      data: {
        hasWILComponent: FormYesNoOptions.Yes,
        isWILApproved: FormYesNoOptions.No,
      },
      context: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario:
        "program has an approved WIL component that is not eligible, making it pending",
      data: {
        hasWILComponent: FormYesNoOptions.Yes,
        isWILApproved: FormYesNoOptions.Yes,
        wilProgramEligibility: FormYesNoOptions.No,
      },
      context: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario:
        "program has an approved and eligible WIL component, making it approved",
      data: {
        hasWILComponent: FormYesNoOptions.Yes,
        isWILApproved: FormYesNoOptions.Yes,
        wilProgramEligibility: FormYesNoOptions.Yes,
      },
      context: {},
      expectedResult: ProgramStatus.Approved,
    },
    {
      scenario:
        "program has a travel component that is not eligible, making it pending",
      data: {
        hasTravel: FormYesNoOptions.Yes,
        travelProgramEligibility: FormYesNoOptions.No,
      },
      context: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario:
        "program has a travel component that is eligible, making it approved",
      data: {
        hasTravel: FormYesNoOptions.Yes,
        travelProgramEligibility: FormYesNoOptions.Yes,
      },
      context: {},
      expectedResult: ProgramStatus.Approved,
    },
    {
      scenario:
        "program has an international exchange component that is not eligible, making it pending",
      data: {
        hasIntlExchange: FormYesNoOptions.Yes,
        intlExchangeProgramEligibility: FormYesNoOptions.No,
      },
      context: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario:
        "program has an international exchange component that is eligible, making it approved",
      data: {
        hasIntlExchange: FormYesNoOptions.Yes,
        intlExchangeProgramEligibility: FormYesNoOptions.Yes,
      },
      context: {},
      expectedResult: ProgramStatus.Approved,
    },
  ];

  testData.forEach(({ scenario, data, context, expectedResult }) => {
    it(`Should return ${expectedResult} when ${scenario}.`, () => {
      // Arrange
      const evaluationData = { ...baseData, ...data };
      const evaluationContext = { ...baseContext, ...context };

      // Act
      const result = evaluator.evaluate(
        evaluationData as Partial<ProgramEvaluationData>,
        evaluationContext,
      );

      // Assert
      expect(result).toBe(expectedResult);
    });
  });
});
