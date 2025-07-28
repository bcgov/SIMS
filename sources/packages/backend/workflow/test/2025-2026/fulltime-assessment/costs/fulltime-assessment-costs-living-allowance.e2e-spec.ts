import { Provinces, YesNoOptions } from "@sims/test-utils";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  createFakeStudentDependentEligible,
  DependentEligibility,
} from "../../../test-utils/factories";

describe(`E2E Test Workflow full-time-assessment-${PROGRAM_YEAR}-costs-living-allowance.`, () => {
  it("Should calculate standard living allowance when the student is single, independent, living away from home, no dependants, and is attending school in BC.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // The standard living allowance for a single, independent student living away from home in BC is $563 per week.
    // For a 16-week program, the total living allowance would be: 16 weeks * $563 = $9,008.
    expect(
      calculatedAssessment.variables.calculatedDataTotalMSOLAllowance,
    ).toBe(9008);
  });

  it("Should calculate standard living allowance when the student is single, independent, living away from home, no dependants, and is attending school in AB.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.institutionLocationProvince = Provinces.Alberta;
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // The standard living allowance for a single, independent student living away from home in AB is $434 per week.
    // For a 16-week program, the total living allowance would be: 16 weeks * $434 = $6,944.
    expect(
      calculatedAssessment.variables.calculatedDataTotalMSOLAllowance,
    ).toBe(6944);
  });

  it("Should calculate standard living allowance when the student is single, dependant, living at home, and is attending school in BC.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataDependantstatus = "dependant";
    assessmentConsolidatedData.studentDataLivingAtHome = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataSelfContainedSuite = YesNoOptions.No;
    assessmentConsolidatedData.parent1TotalIncome = 65000;
    assessmentConsolidatedData.parent1CppEmployment = 3000;
    assessmentConsolidatedData.parent1CppSelfemploymentOther = 3000;
    assessmentConsolidatedData.parent1Ei = 1200;
    assessmentConsolidatedData.parent1Tax = 700;
    assessmentConsolidatedData.parent1Contributions = 0;
    assessmentConsolidatedData.studentDataVoluntaryContributions = 0;
    assessmentConsolidatedData.studentDataParents = [
      {
        parentIsAbleToReport: YesNoOptions.Yes,
      },
    ];
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // The standard living allowance for a single, dependant student, living at home in BC is $221 per week.
    // For a 16-week program, the total living allowance would be: 16 weeks * $221 = $3,536.
    expect(
      calculatedAssessment.variables.calculatedDataTotalMSOLAllowance,
    ).toBe(3536);
  });

  it("Should calculate standard living allowance when the student is single, independent, living away from home, with one eligible dependant, and is attending school in BC.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
      ),
    ];
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // The standard living allowance for an eligible dependant of the student is $192 per week per dependant.
    // For a 16-week program, the total living allowance would be: 16 weeks * $192 * 1 = $3,072.
    expect(
      calculatedAssessment.variables.calculatedDataDependantTotalMSOLAllowance,
    ).toBe(3072);
    // The standard living allowance for a single parent student, living at home in BC is $725 per week.
    // For a 16-week program, the total living allowance would be: 16 weeks * $725 = $11,600.
    // The student has one eligible dependant, so the living allowance is increased by $192 per week.
    expect(
      calculatedAssessment.variables.calculatedDataTotalMSOLAllowance,
    ).toBe(14672);
  });

  it("Should calculate standard living allowance when the student is single, independent, living away from home, with two dependants, and is attending school in BC.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
      ),
    ];
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // The standard living allowance for an eligible dependant of the student is $192 per week per dependant.
    // For a 16-week program, the total living allowance would be: 16 weeks * $192 * 2 = $6,144.
    expect(
      calculatedAssessment.variables.calculatedDataDependantTotalMSOLAllowance,
    ).toBe(6144);
    // The standard living allowance for a single parent student, living at home in BC is $725 per week.
    // For a 16-week program, the total living allowance would be: 16 weeks * $725 = $11,600.
    // The student has one eligible dependant, so the living allowance is increased by $192 per week.
    expect(
      calculatedAssessment.variables.calculatedDataTotalMSOLAllowance,
    ).toBe(17744);
  });

  it("Should calculate standard living allowance when the student is married, with no dependants, and is attending school in BC.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 0;
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // The standard living allowance for a married student, living at home in BC is $1066 per week.
    // For a 16-week program, the total living allowance would be: 16 weeks * $1066 = $17,056.
    expect(
      calculatedAssessment.variables.calculatedDataTotalMSOLAllowance,
    ).toBe(17056);
  });

  it("Should calculate standard living allowance when the student is married but unable to report due to domestic abuse, with no dependants, and is attending school in BC.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
    assessmentConsolidatedData.studentDataRelationshipStatus = "marriedUnable";
    assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 0;
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // The standard living allowance for a student who is married and unable to report, living at home in BC is $563 per week.
    // For a 16-week program, the total living allowance would be: 16 weeks * $563 = $9,008.
    expect(
      calculatedAssessment.variables.calculatedDataTotalMSOLAllowance,
    ).toBe(9008);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
