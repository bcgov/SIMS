import {
  FormCategory,
  FormSubmissionActionType,
  FormSubmissionStatus,
  FormSubmissionSubmittedData,
} from "@sims/sims-db";
import { EntityManager } from "typeorm";
import { FormSubmissionActionModel } from "../../form-submission-action-models";
import { LoggerService } from "@sims/utilities/logger";
import { FormSubmissionUpdateDisabilityOnSubmissionAction } from "../../form-submission-update-disability-on-submission-action";

describe("FormSubmissionUpdateDisabilityOnSubmissionAction-applyAction", () => {
  [
    {
      formSubmissionStatus: FormSubmissionStatus.Completed,
      isApplyActionExpected: false,
    },
    {
      formSubmissionStatus: FormSubmissionStatus.Declined,
      isApplyActionExpected: false,
    },
    {
      formSubmissionStatus: FormSubmissionStatus.Pending,
      isApplyActionExpected: true,
    },
  ].forEach(({ formSubmissionStatus, isApplyActionExpected }) => {
    it(`Should ${isApplyActionExpected ? "call" : "not call"} applyAction when form submission status is ${formSubmissionStatus}.`, async () => {
      // Arrange
      const action =
        new ExposedFormSubmissionUpdateDisabilityOnSubmissionAction();
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
            actions: [FormSubmissionActionType.UpdateDisabilityOnSubmission],
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

class ExposedFormSubmissionUpdateDisabilityOnSubmissionAction extends FormSubmissionUpdateDisabilityOnSubmissionAction {
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
