import {
  FormSubmissionActionType,
  FormSubmissionDecisionStatus,
} from "@sims/sims-db";
import { TestFormSubmissionAction } from "./test-form-submission-action";
import {
  FormSubmissionActionModel,
  FormSubmissionItemActionModel,
} from "../../form-submission-action-models";

describe("FormSubmissionAction-getSubmissionItemsByActionType", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Should return only the requests that include the matching action type.", () => {
    // Arrange
    const action = new TestFormSubmissionAction({
      actionType: FormSubmissionActionType.UpdateModifiedIndependent,
      appliesToResult: true,
    });
    const formSubmission = {} as FormSubmissionActionModel;
    const requestWithMatch = {
      id: 1,
      actions: [FormSubmissionActionType.UpdateModifiedIndependent],
      decisionStatus: FormSubmissionDecisionStatus.Declined,
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

  it("Should return only the requests that include the matching action type and decision status.", () => {
    // Arrange
    const action = new TestFormSubmissionAction({
      actionType: FormSubmissionActionType.CreateStudentAppealAssessment,
      appliesToResult: true,
    });
    const formSubmission = {} as FormSubmissionActionModel;
    const declinedRequest = {
      id: 1,
      actions: [FormSubmissionActionType.CreateStudentAppealAssessment],
      decisionStatus: FormSubmissionDecisionStatus.Declined,
    } as FormSubmissionItemActionModel;
    const approveRequest = {
      id: 2,
      actions: [FormSubmissionActionType.CreateStudentAppealAssessment],
      decisionStatus: FormSubmissionDecisionStatus.Approved,
    } as FormSubmissionItemActionModel;
    formSubmission.submissionItems = [declinedRequest, approveRequest];

    // Act
    const result = action.exposedGetSubmissionItemsByActionType(
      formSubmission,
      {
        decisionStatus: FormSubmissionDecisionStatus.Approved,
      },
    );

    // Assert
    expect(result).toEqual([approveRequest]);
  });

  it("Should not return any requests when no matching action type and decision status are found.", () => {
    // Arrange
    const action = new TestFormSubmissionAction({
      actionType: FormSubmissionActionType.CreateStudentAppealAssessment,
      appliesToResult: true,
    });
    const formSubmission = {} as FormSubmissionActionModel;
    const declinedRequest = {
      id: 1,
      actions: [FormSubmissionActionType.CreateStudentAppealAssessment],
      decisionStatus: FormSubmissionDecisionStatus.Declined,
    } as FormSubmissionItemActionModel;
    const approveRequest = {
      id: 2,
      actions: [FormSubmissionActionType.CreateStudentAppealAssessment],
      decisionStatus: FormSubmissionDecisionStatus.Declined,
    } as FormSubmissionItemActionModel;
    formSubmission.submissionItems = [declinedRequest, approveRequest];

    // Act
    const result = action.exposedGetSubmissionItemsByActionType(
      formSubmission,
      {
        decisionStatus: FormSubmissionDecisionStatus.Approved,
      },
    );

    // Assert
    expect(result).toEqual([]);
  });
});
