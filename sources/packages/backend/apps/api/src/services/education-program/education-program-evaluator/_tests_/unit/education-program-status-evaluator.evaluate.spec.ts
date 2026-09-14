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
      scenarioData: {},
      scenarioContext: {},
      expectedResult: ProgramStatus.Approved,
    },
    {
      scenario:
        "program is BC private and delivered online only, making it pending",
      scenarioData: {
        programDeliveryTypes: {
          deliveredOnSite: false,
          deliveredOnline: true,
        },
      },
      scenarioContext: { isBCPrivate: true },
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario: "program has a joint institution, making it pending",
      scenarioData: { hasJointInstitution: FormYesNoOptions.Yes },
      scenarioContext: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario:
        "program is delivered without academic credits, making it pending",
      scenarioData: {
        deliveredOnlineAlsoOnsite: FormYesNoOptions.No,
        sameOnlineCreditsEarned: FormYesNoOptions.No,
        earnAcademicCreditsOtherInstitution: FormYesNoOptions.No,
      },
      scenarioContext: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario: "program ESL eligibility is 20 or more, making it pending",
      scenarioData: { eslEligibility: ProgramESLPercentage.GreaterThanEqual20 },
      scenarioContext: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario: "program has no entrance requirements, making it pending",
      scenarioData: {
        entranceRequirements: {
          hasMinimumAge: false,
          minHighSchool: false,
          requirementsByInstitution: false,
          requirementsByBCITA: false,
          noneOfTheAboveEntranceRequirements: true,
        },
      },
      scenarioContext: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario:
        "program has less than the minimum expected hours per week, making it pending",
      scenarioData: {
        courseLoadCalculation: ProgramCourseLoadCalculationTypes.Hours,
        minHoursWeek: FormYesNoOptions.No,
        isAviationProgram: FormYesNoOptions.No,
      },
      scenarioContext: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario: "program is an aviation program, making it pending",
      scenarioData: { isAviationProgram: FormYesNoOptions.Yes },
      scenarioContext: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario:
        "program has a WIL component that is not approved, making it pending",
      scenarioData: {
        hasWILComponent: FormYesNoOptions.Yes,
        isWILApproved: FormYesNoOptions.No,
      },
      scenarioContext: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario:
        "program has an approved WIL component that is not eligible, making it pending",
      scenarioData: {
        hasWILComponent: FormYesNoOptions.Yes,
        isWILApproved: FormYesNoOptions.Yes,
        wilProgramEligibility: FormYesNoOptions.No,
      },
      scenarioContext: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario:
        "program has an approved and eligible WIL component, making it approved",
      scenarioData: {
        hasWILComponent: FormYesNoOptions.Yes,
        isWILApproved: FormYesNoOptions.Yes,
        wilProgramEligibility: FormYesNoOptions.Yes,
      },
      scenarioContext: {},
      expectedResult: ProgramStatus.Approved,
    },
    {
      scenario:
        "program has a travel component that is not eligible, making it pending",
      scenarioData: {
        hasTravel: FormYesNoOptions.Yes,
        travelProgramEligibility: FormYesNoOptions.No,
      },
      scenarioContext: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario:
        "program has a travel component that is eligible, making it approved",
      scenarioData: {
        hasTravel: FormYesNoOptions.Yes,
        travelProgramEligibility: FormYesNoOptions.Yes,
      },
      scenarioContext: {},
      expectedResult: ProgramStatus.Approved,
    },
    {
      scenario:
        "program has an international exchange component that is not eligible, making it pending",
      scenarioData: {
        hasIntlExchange: FormYesNoOptions.Yes,
        intlExchangeProgramEligibility: FormYesNoOptions.No,
      },
      scenarioContext: {},
      expectedResult: ProgramStatus.Pending,
    },
    {
      scenario:
        "program has an international exchange component that is eligible, making it approved",
      scenarioData: {
        hasIntlExchange: FormYesNoOptions.Yes,
        intlExchangeProgramEligibility: FormYesNoOptions.Yes,
      },
      scenarioContext: {},
      expectedResult: ProgramStatus.Approved,
    },
  ];

  testData.forEach(
    ({ scenario, scenarioData, scenarioContext, expectedResult }) => {
      it(`Should return ${expectedResult} when ${scenario}.`, () => {
        // Arrange
        const evaluationData = { ...baseData, ...scenarioData };
        const evaluationContext = { ...baseContext, ...scenarioContext };

        // Act
        const result = evaluator.evaluate(
          evaluationData as Partial<ProgramEvaluationData>,
          evaluationContext,
        );

        // Assert
        expect(result).toBe(expectedResult);
      });
    },
  );

  it("Should throw an error when program evaluation data is incomplete.", () => {
    // Act and Assert
    expect(() =>
      evaluator.evaluate(
        {
          programDeliveryTypes: {},
          courseLoadCalculation: ProgramCourseLoadCalculationTypes.Credit,
        } as Partial<ProgramEvaluationData>,
        baseContext,
      ),
    ).toThrow("Missing required data to evaluate program status.");
  });
});
