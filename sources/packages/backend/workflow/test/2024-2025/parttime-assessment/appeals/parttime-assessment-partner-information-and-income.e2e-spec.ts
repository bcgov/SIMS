import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-partner-information-and-income.`, () => {
  it("Should calculate partner income as the appeal value when there is no CRA reported income.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.partner1CRAReportedIncome = null;
    assessmentConsolidatedData.appealsPartnerInformationAndIncomeAppealData = {
      relationshipStatus: "married",
      partnerEstimatedIncome: 12345,
    };

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataRelationshipStatus,
    ).toBe("married");
    expect(
      calculatedAssessment.variables.calculatedDataPartner1TotalIncome,
    ).toBe(12345);
  });

  it("Should calculate partner income as the CRA reported income value when there is an appeal but there is also a CRA reported income.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.appealsPartnerInformationAndIncomeAppealData = {
      relationshipStatus: "married",
      partnerEstimatedIncome: 12345,
    };

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataRelationshipStatus,
    ).toBe("married");
    expect(
      calculatedAssessment.variables.calculatedDataPartner1TotalIncome,
    ).toBe(15001);
  });

  it("Should calculate partner income as the CRA reported income value when there is no appeal but there is a CRA reported income.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 4321;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataRelationshipStatus,
    ).toBe("married");
    expect(
      calculatedAssessment.variables.calculatedDataPartner1TotalIncome,
    ).toBe(15001);
  });

  it("Should calculate partner income as the estimated partner income value from the student data when there is no CRA reported income or appeal.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.partner1CRAReportedIncome = null;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 4321;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataRelationshipStatus,
    ).toBe("married");
    expect(
      calculatedAssessment.variables.calculatedDataPartner1TotalIncome,
    ).toBe(4321);
  });

  it("Should calculate partner income as null when there is an appeal to change the student status from married to single.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.partner1CRAReportedIncome = null;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 4321;
    assessmentConsolidatedData.appealsPartnerInformationAndIncomeAppealData = {
      relationshipStatus: "single",
    };

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataRelationshipStatus,
    ).toBe("single");
    expect(
      calculatedAssessment.variables.calculatedDataPartner1TotalIncome,
    ).toBeNull();
  });

  it("Should calculate partner income as current year partner income value when there is a request a change for current year partner income.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.partner1CRAReportedIncome = 3000;
    assessmentConsolidatedData.appealsPartnerInformationAndIncomeAppealData = {
      relationshipStatus: "married",
      partnerEstimatedIncome: 1000,
      currentYearPartnerIncome: 2000,
    };

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataCurrentYearPartnerIncome,
    ).toBe(2000);
    expect(
      calculatedAssessment.variables.calculatedDataPartner1TotalIncome,
    ).toBe(2000);
  });

  it("Should calculate partner income as current year partner income value when there is a request a change for current year partner income and partner's CRA income verification has failed.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.partner1CRAReportedIncome = null;
    assessmentConsolidatedData.appealsPartnerInformationAndIncomeAppealData = {
      relationshipStatus: "married",
      partnerEstimatedIncome: 1000,
      currentYearPartnerIncome: 2000,
    };

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataCurrentYearPartnerIncome,
    ).toBe(2000);
    expect(
      calculatedAssessment.variables.calculatedDataPartner1TotalIncome,
    ).toBe(2000);
  });
});
