import {
  FormCategory,
  FormSubmissionActionType,
  FormSubmissionDecisionStatus,
} from "@sims/sims-db";
import { TestFormSubmissionAction } from "./test-form-submission-action";
import { EntityManager } from "typeorm";
import { FormSubmissionActionModel } from "../../form-submission-action-models";

describe("FormSubmissionAction-process", () => {
  it("Should call applyAction when appliesTo result is true.", async () => {
    // Arrange
    const action = new TestFormSubmissionAction({
      actionType: FormSubmissionActionType.UpdateModifiedIndependent,
      appliesToResult: true,
    });
    const auditUserId = 123;
    const auditDate = new Date();
    const entityManager = {} as EntityManager;
    const mockedFormSubmission: FormSubmissionActionModel = {
      id: 1,
      studentId: 2,
      formCategory: FormCategory.StudentAppeal,
      applicationId: 3,
      currentOfferingId: 4,
      submissionItems: [
        {
          id: 5,
          actions: [FormSubmissionActionType.CreateStudentAppealAssessment],
          decisionStatus: FormSubmissionDecisionStatus.Approved,
        },
      ],
    };

    // Act
    await action.process(
      mockedFormSubmission,
      auditUserId,
      auditDate,
      entityManager,
    );

    // Assert
    expect(action.applyAction).toHaveBeenCalledTimes(1);
    expect(action.applyAction).toHaveBeenCalledWith(
      mockedFormSubmission,
      auditUserId,
      auditDate,
      entityManager,
    );
  });

  it("Should not call applyAction when appliesTo result is false.", async () => {
    // Arrange
    const action = new TestFormSubmissionAction({
      actionType: FormSubmissionActionType.UpdateModifiedIndependent,
      appliesToResult: false,
    });
    const auditUserId = 123;
    const auditDate = new Date();
    const entityManager = {} as EntityManager;
    const mockedFormSubmission: FormSubmissionActionModel = {
      id: 1,
      studentId: 2,
      formCategory: FormCategory.StudentAppeal,
      applicationId: 3,
      currentOfferingId: 4,
      submissionItems: [
        {
          id: 5,
          actions: [FormSubmissionActionType.CreateStudentAppealAssessment],
          decisionStatus: FormSubmissionDecisionStatus.Approved,
        },
      ],
    };

    // Act
    await action.process(
      mockedFormSubmission,
      auditUserId,
      auditDate,
      entityManager,
    );

    // Assert
    expect(action.applyAction).toHaveBeenCalledTimes(0);
  });
});
