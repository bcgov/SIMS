import { Mocked, TestBed } from "@suites/unit";
import { EntityManager } from "typeorm";
import { FormSubmissionActionProcessor } from "../../../../form-submission/form-submission-actions/form-submission-action-processor";
import { FormSubmissionCreateAppealAssessmentAction } from "../../../../form-submission/form-submission-actions/form-submission-create-appeal-assessment-action";
import { FormSubmissionUpdateModifiedIndependentAction } from "../../../../form-submission/form-submission-actions/form-submission-update-modified-independent-action";
import {
  FormCategory,
  FormSubmissionActionType,
  FormSubmissionDecisionStatus,
} from "@sims/sims-db";

describe("FormSubmissionActionProcessor-processActions", () => {
  let formSubmissionActionProcessor: FormSubmissionActionProcessor;
  let formSubmissionCreateAppealAssessmentAction: Mocked<FormSubmissionCreateAppealAssessmentAction>;
  let formSubmissionUpdateModifiedIndependentAction: Mocked<FormSubmissionUpdateModifiedIndependentAction>;

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.solitary(
      FormSubmissionActionProcessor,
    ).compile();
    formSubmissionActionProcessor = unit;
    formSubmissionCreateAppealAssessmentAction = unitRef.get(
      FormSubmissionCreateAppealAssessmentAction,
    );
    formSubmissionUpdateModifiedIndependentAction = unitRef.get(
      FormSubmissionUpdateModifiedIndependentAction,
    );
    // Allow setting the action types directly to avoid spying on getters
    // that would not work as expected for protected properties.
    (formSubmissionCreateAppealAssessmentAction as object)["actionType"] =
      FormSubmissionActionType.CreateStudentAppealAssessment;
    (formSubmissionUpdateModifiedIndependentAction as object)["actionType"] =
      FormSubmissionActionType.UpdateModifiedIndependent;
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Should execute multiple actions and pass the parameters as expected when multiple requests with different actions are part of the same form submission.", async () => {
    // Arrange
    const auditUserId = 123;
    const auditDate = new Date();
    const entityManager = {} as EntityManager;
    const mockedFormSubmission = {
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
        {
          id: 6,
          actions: [FormSubmissionActionType.UpdateModifiedIndependent],
          decisionStatus: FormSubmissionDecisionStatus.Declined,
        },
      ],
    };
    jest
      .spyOn(
        formSubmissionActionProcessor as any,
        "getFormSubmissionForActionsProcessing",
      )
      .mockResolvedValue(mockedFormSubmission);

    // Act
    await formSubmissionActionProcessor.processActions(
      mockedFormSubmission.id,
      auditUserId,
      auditDate,
      entityManager,
    );

    // Assert
    expect(
      formSubmissionCreateAppealAssessmentAction.process,
    ).toHaveBeenCalledTimes(1);
    expect(
      formSubmissionCreateAppealAssessmentAction.process,
    ).toHaveBeenCalledWith(
      mockedFormSubmission,
      auditUserId,
      auditDate,
      entityManager,
    );
    expect(
      formSubmissionUpdateModifiedIndependentAction.process,
    ).toHaveBeenCalledTimes(1);
    expect(
      formSubmissionUpdateModifiedIndependentAction.process,
    ).toHaveBeenCalledWith(
      mockedFormSubmission,
      auditUserId,
      auditDate,
      entityManager,
    );
  });

  it("Should execute actions uniquely when multiple requests with the same actions are part of the same form submission.", async () => {
    // Arrange
    const auditUserId = 123;
    const auditDate = new Date();
    const entityManager = {} as EntityManager;
    const mockedFormSubmission = {
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
        {
          id: 6,
          actions: [FormSubmissionActionType.CreateStudentAppealAssessment],
          decisionStatus: FormSubmissionDecisionStatus.Approved,
        },
      ],
    };
    jest
      .spyOn(
        formSubmissionActionProcessor as any,
        "getFormSubmissionForActionsProcessing",
      )
      .mockResolvedValue(mockedFormSubmission);

    // Act
    await formSubmissionActionProcessor.processActions(
      mockedFormSubmission.id,
      auditUserId,
      auditDate,
      entityManager,
    );

    // Assert
    expect(
      formSubmissionCreateAppealAssessmentAction.process,
    ).toHaveBeenCalledTimes(1);
  });

  it("Should throw an error when the form submission has an unknown action.", async () => {
    // Arrange
    const auditUserId = 123;
    const auditDate = new Date();
    const entityManager = {} as EntityManager;
    const mockedFormSubmission = {
      id: 1,
      studentId: 2,
      formCategory: FormCategory.StudentAppeal,
      applicationId: 3,
      currentOfferingId: 4,
      submissionItems: [
        {
          id: 5,
          actions: ["SomeUnknownActionType" as FormSubmissionActionType],
          decisionStatus: FormSubmissionDecisionStatus.Approved,
        },
      ],
    };
    jest
      .spyOn(
        formSubmissionActionProcessor as any,
        "getFormSubmissionForActionsProcessing",
      )
      .mockResolvedValue(mockedFormSubmission);

    // Act
    await expect(
      formSubmissionActionProcessor.processActions(
        mockedFormSubmission.id,
        auditUserId,
        auditDate,
        entityManager,
      ),
    ).rejects.toThrow(
      `One or more action types associated with the form submission ID 1 are not recognized: SomeUnknownActionType.`,
    );
  });
});
