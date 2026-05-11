import {
  FormCategory,
  FormSubmissionActionType,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
  FormSubmissionSubmittedData,
} from "@sims/sims-db";
import { EntityManager } from "typeorm";
import { FormSubmissionActionModel } from "../../form-submission-action-models";
import { LoggerService } from "@sims/utilities/logger";
import { FormSubmissionUpdateDisabilityOnSubmissionAction } from "../../form-submission-update-disability-on-submission-action";

describe("FormSubmissionUpdateDisabilityOnSubmissionAction-applyAction", () => {
  it(`Should call applyAction when form submission has pending status ${FormSubmissionStatus.Pending}.`, async () => {
    // Arrange
    const action = new ExposeFormSubmissionUpdateDisabilityOnSubmissionAction();
    const auditUserId = 123;
    const auditDate = new Date();
    const entityManager = {} as EntityManager;
    const mockedFormSubmission: FormSubmissionActionModel = {
      id: 1,
      studentId: 2,
      formCategory: FormCategory.StudentForm,
      submissionStatus: FormSubmissionStatus.Pending,
      submissionItems: [
        {
          id: 5,
          actions: [FormSubmissionActionType.UpdateDisabilityOnSubmission],
          decisionStatus: FormSubmissionDecisionStatus.Pending,
          submittedData: {} as FormSubmissionSubmittedData,
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

  it(`Should not call applyAction when form submission has final status ${FormSubmissionStatus.Completed}.`, async () => {
    // Arrange
    const action = new ExposeFormSubmissionUpdateDisabilityOnSubmissionAction();
    const auditUserId = 123;
    const auditDate = new Date();
    const entityManager = {} as EntityManager;
    const mockedFormSubmission: FormSubmissionActionModel = {
      id: 1,
      studentId: 2,
      formCategory: FormCategory.StudentForm,
      submissionStatus: FormSubmissionStatus.Completed,
      submissionItems: [
        {
          id: 5,
          actions: [FormSubmissionActionType.UpdateDisabilityOnSubmission],
          decisionStatus: FormSubmissionDecisionStatus.Approved,
          submittedData: {} as FormSubmissionSubmittedData,
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
    expect(action.applyAction).not.toHaveBeenCalled();
  });

  it(`Should not call applyAction when form submission has final status ${FormSubmissionStatus.Declined}.`, async () => {
    // Arrange
    const action = new ExposeFormSubmissionUpdateDisabilityOnSubmissionAction();
    const auditUserId = 123;
    const auditDate = new Date();
    const entityManager = {} as EntityManager;
    const mockedFormSubmission: FormSubmissionActionModel = {
      id: 1,
      studentId: 2,
      formCategory: FormCategory.StudentForm,
      submissionStatus: FormSubmissionStatus.Declined,
      submissionItems: [
        {
          id: 5,
          actions: [FormSubmissionActionType.UpdateDisabilityOnSubmission],
          decisionStatus: FormSubmissionDecisionStatus.Declined,
          submittedData: {} as FormSubmissionSubmittedData,
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
    expect(action.applyAction).not.toHaveBeenCalled();
  });
});

class ExposeFormSubmissionUpdateDisabilityOnSubmissionAction extends FormSubmissionUpdateDisabilityOnSubmissionAction {
  constructor() {
    super(new LoggerService());
  }
  applyAction = jest.fn(
    (
      _formSubmission: FormSubmissionActionModel,
      _auditUserId: number,
      _auditDate: Date,
      _entityManager: EntityManager,
    ): Promise<void> => Promise.resolve(),
  );
}
