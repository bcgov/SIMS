import { PROGRAM_YEAR } from "../../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  createIdentifiableParentsData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../../test-utils";
import { AssessmentDataType, YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-appeal-eligibility-step-parent-waiver.`, () => {
  it("Should evaluate the step-parent waiver appeal as eligible when the number of parents reported in the application is 2.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    const parents = [
      { parentIsAbleToReport: YesNoOptions.Yes },
      { parentIsAbleToReport: YesNoOptions.Yes },
    ];
    // Create fake parents data for the provided parents.
    const fakeParentsData = createIdentifiableParentsData({
      dataType: AssessmentDataType.PreAssessment,
      parents,
    });

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      { ...assessmentConsolidatedData, ...fakeParentsData },
    );

    // Assert
    expect(
      calculatedAssessment.variables.isEligibleForStepParentWaiverAppeal,
    ).toBe(true);
  });

  it("Should evaluate the step-parent waiver appeal as not eligible when the number of parents reported in the application is 1.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    const parents = [{ parentIsAbleToReport: YesNoOptions.Yes }];
    // Create fake parents data for the provided parents.
    const fakeParentsData = createIdentifiableParentsData({
      dataType: AssessmentDataType.PreAssessment,
      parents,
    });

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      { ...assessmentConsolidatedData, ...fakeParentsData },
    );

    // Assert
    expect(
      calculatedAssessment.variables.isEligibleForStepParentWaiverAppeal,
    ).toBe(false);
  });

  it("Should evaluate the step-parent waiver appeal as not eligible when the student is not dependant and there are no parents reported in the application.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataDependantstatus = "independant";

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.isEligibleForStepParentWaiverAppeal,
    ).toBe(false);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
