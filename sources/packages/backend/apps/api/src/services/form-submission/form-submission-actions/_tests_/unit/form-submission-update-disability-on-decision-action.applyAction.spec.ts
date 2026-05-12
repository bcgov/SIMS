import {
  FormCategory,
  FormSubmissionActionType,
  FormSubmissionStatus,
  FormSubmissionSubmittedData,
} from "@sims/sims-db";
import { EntityManager } from "typeorm";
import { FormSubmissionActionModel } from "../../form-submission-action-models";
import { LoggerService } from "@sims/utilities/logger";
import { FormSubmissionUpdateDisabilityOnDecisionAction } from "../../form-submission-update-disability-on-decision-action";

describe("FormSubmissionUpdateDisabilityOnDecisionAction-applyAction", () => {
  [
    {
      formSubmissionStatus: FormSubmissionStatus.Completed,
      isApplyActionExpected: true,
    },
    {
      formSubmissionStatus: FormSubmissionStatus.Declined,
      isApplyActionExpected: true,
    },
    {
      formSubmissionStatus: FormSubmissionStatus.Pending,
      isApplyActionExpected: false,
    },
  ].forEach(({ formSubmissionStatus, isApplyActionExpected }) => {
    it(`Should ${isApplyActionExpected ? "call" : "not call"} applyAction when form submission status is ${formSubmissionStatus}.`, async () => {
      // Arrange
      const action =
        new ExposedFormSubmissionUpdateDisabilityOnDecisionAction();
      const auditUserId = 123;
      const auditDate = new Date();
      const entityManager = {} as EntityManager;
      const mockedFormSubmission: FormSubmissionActionModel = {
        id: 1,
        studentId: 2,
        formCategory: FormCategory.StudentForm,
        submissionStatus: formSubmissionStatus,
        submissionItems: [
          {
            id: 5,
            actions: [FormSubmissionActionType.UpdateDisabilityOnDecision],
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
      if (isApplyActionExpected) {
        expect(action.applyAction).toHaveBeenCalledTimes(1);
        expect(action.applyAction).toHaveBeenCalledWith(
          mockedFormSubmission,
          auditUserId,
          auditDate,
          entityManager,
        );
      } else {
        expect(action.applyAction).not.toHaveBeenCalled();
      }
    });
  });
});

class ExposedFormSubmissionUpdateDisabilityOnDecisionAction extends FormSubmissionUpdateDisabilityOnDecisionAction {
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
