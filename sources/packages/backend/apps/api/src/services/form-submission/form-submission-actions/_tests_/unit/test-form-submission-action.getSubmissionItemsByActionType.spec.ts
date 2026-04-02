import {
  FormSubmissionActionType,
  FormSubmissionDecisionStatus,
  FormSubmissionSubmittedData,
} from "@sims/sims-db";
import { TestFormSubmissionAction } from "./test-form-submission-action";
import {
  FormSubmissionActionModel,
  FormSubmissionItemActionModel,
} from "../../form-submission-action-models";

describe("FormSubmissionAction-getSubmissionItemsByActionType", () => {
  it("Should return only the requests that include the matching action type.", () => {
    // Arrange
    const action = new TestFormSubmissionAction({
      actionType: FormSubmissionActionType.UpdateModifiedIndependent,
      appliesToResult: true,
    });
    const requestWithMatch: FormSubmissionItemActionModel = {
      id: 1,
      actions: [FormSubmissionActionType.UpdateModifiedIndependent],
      decisionStatus: FormSubmissionDecisionStatus.Declined,
      submittedData: {} as FormSubmissionSubmittedData,
    };
    const requestWithoutMatch: FormSubmissionItemActionModel = {
      id: 2,
      actions: [FormSubmissionActionType.CreateStudentAppealAssessment],
      decisionStatus: FormSubmissionDecisionStatus.Declined,
      submittedData: {} as FormSubmissionSubmittedData,
    };
    const formSubmission = {
      submissionItems: [requestWithMatch, requestWithoutMatch],
    } as FormSubmissionActionModel;

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
    const declinedRequest: FormSubmissionItemActionModel = {
      id: 1,
      actions: [FormSubmissionActionType.CreateStudentAppealAssessment],
      decisionStatus: FormSubmissionDecisionStatus.Declined,
      submittedData: {} as FormSubmissionSubmittedData,
    };
    const approveRequest: FormSubmissionItemActionModel = {
      id: 2,
      actions: [FormSubmissionActionType.CreateStudentAppealAssessment],
      decisionStatus: FormSubmissionDecisionStatus.Approved,
      submittedData: {} as FormSubmissionSubmittedData,
    };
    const formSubmission = {
      submissionItems: [declinedRequest, approveRequest],
    } as FormSubmissionActionModel;

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
      actionType: FormSubmissionActionType.UpdateModifiedIndependent,
      appliesToResult: true,
    });
    const declinedDifferentRequest: FormSubmissionItemActionModel = {
      id: 1,
      actions: [FormSubmissionActionType.CreateStudentAppealAssessment],
      decisionStatus: FormSubmissionDecisionStatus.Approved,
      submittedData: {} as FormSubmissionSubmittedData,
    };
    const declinedSameRequest: FormSubmissionItemActionModel = {
      id: 2,
      actions: [FormSubmissionActionType.UpdateModifiedIndependent],
      decisionStatus: FormSubmissionDecisionStatus.Declined,
      submittedData: {} as FormSubmissionSubmittedData,
    };
    const formSubmission = {
      submissionItems: [declinedDifferentRequest, declinedSameRequest],
    } as FormSubmissionActionModel;

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
