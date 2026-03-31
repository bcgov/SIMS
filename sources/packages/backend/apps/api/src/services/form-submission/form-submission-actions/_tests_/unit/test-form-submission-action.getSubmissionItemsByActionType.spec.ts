import {
  FormSubmissionActionType,
  FormSubmissionDecisionStatus,
} from "@sims/sims-db";
import { TestFormSubmissionAction } from "./test-form-submission-action";
import {
  FormSubmissionActionModel,
  FormSubmissionItemActionModel,
} from "apps/api/src/services/form-submission/form-submission-actions/form-submission-action-models";

describe("FormSubmissionAction-getSubmissionItemsByActionType", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Should return only the requests that include the matching action type.", () => {
    // Arrange
    const action = new TestFormSubmissionAction(
      FormSubmissionActionType.UpdateModifiedIndependent,
    );
    const formSubmission = {} as FormSubmissionActionModel;
    const requestWithMatch = {
      id: 1,
      actions: [FormSubmissionActionType.UpdateModifiedIndependent],
      decisionStatus: FormSubmissionDecisionStatus.Approved,
    } as FormSubmissionItemActionModel;
    const requestWithoutMatch = {
      id: 2,
      actions: [FormSubmissionActionType.CreateStudentAppealAssessment],
      decisionStatus: FormSubmissionDecisionStatus.Declined,
    } as FormSubmissionItemActionModel;
    formSubmission.submissionItems = [requestWithMatch, requestWithoutMatch];

    // Act
    const result = action.exposedGetSubmissionItemsByActionType(formSubmission);

    // Assert
    expect(result).toEqual([requestWithMatch]);
  });
});
