import { Mocked, TestBed } from "@suites/unit";
import { EntityManager } from "typeorm";
import { FormSubmissionActionProcessor } from "../../../form-submission-actions/form-submission-action-processor";
import { FormSubmissionCreateAppealAssessmentAction } from "../../../form-submission-actions/form-submission-create-appeal-assessment-action";
import { FormSubmissionUpdateModifiedIndependentAction } from "../../../form-submission-actions/form-submission-update-modified-independent-action";
import {
  FormCategory,
  FormSubmission,
  FormSubmissionActionType,
  FormSubmissionDecisionStatus,
} from "@sims/sims-db";
import { FormSubmissionActionModel } from "apps/api/src/services/form-submission/form-submission-actions/form-submission-action-models";

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
    // Expected form submission returned from DB.
    const mockedFormSubmission = {
      id: 1,
      student: { id: 2 },
      formCategory: FormCategory.StudentAppeal,
      application: {
        id: 3,
        currentAssessment: {
          id: 4,
          offering: { id: 5 },
        },
      },
      // Used 'CreateStudentAppealAssessment' and 'UpdateModifiedIndependent' action types to ensure both actions are executed
      // event though these decision will not be present at the same time for the same request in a real scenario.
      // The goal is to ensure that the action processor is able to identify and execute both actions when present.
      formSubmissionItems: [
        {
          id: 6,
          submittedData: {
            actions: [FormSubmissionActionType.CreateStudentAppealAssessment],
          },
          currentDecision: {
            decisionStatus: FormSubmissionDecisionStatus.Approved,
          },
        },
        {
          id: 7,
          submittedData: {
            actions: [FormSubmissionActionType.UpdateModifiedIndependent],
          },
          currentDecision: {
            decisionStatus: FormSubmissionDecisionStatus.Declined,
          },
        },
      ],
    } as FormSubmission;
    // Expected model converted from the DB result.
    const expectedFormSubmissionModel = {
      id: mockedFormSubmission.id,
      studentId: mockedFormSubmission.student.id,
      formCategory: mockedFormSubmission.formCategory,
      applicationId: mockedFormSubmission.application?.id,
      currentOfferingId:
        mockedFormSubmission.application?.currentAssessment?.offering?.id,
      submissionItems: mockedFormSubmission.formSubmissionItems.map((item) => ({
        id: item.id,
        actions: item.submittedData.actions ?? [],
        decisionStatus: item.currentDecision.decisionStatus,
      })),
    } as FormSubmissionActionModel;
    const entityManager = createFormSubmissionFindOneMock(mockedFormSubmission);

    // Act
    await formSubmissionActionProcessor.processActions(
      1,
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
      expectedFormSubmissionModel,
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
      expectedFormSubmissionModel,
      auditUserId,
      auditDate,
      entityManager,
    );
  });

  it("Should execute actions uniquely when multiple requests with the same actions are part of the same form submission.", async () => {
    // Arrange
    const auditUserId = 123;
    const auditDate = new Date();
    const entityManager = createFormSubmissionFindOneMock({
      id: 1,
      student: { id: 2 },
      formCategory: FormCategory.StudentAppeal,
      application: {
        id: 3,
        currentAssessment: {
          id: 4,
          offering: { id: 5 },
        },
      },
      formSubmissionItems: [
        {
          id: 6,
          submittedData: {
            actions: [FormSubmissionActionType.CreateStudentAppealAssessment],
          },
          currentDecision: {
            decisionStatus: FormSubmissionDecisionStatus.Approved,
          },
        },
        {
          id: 7,
          submittedData: {
            actions: [FormSubmissionActionType.CreateStudentAppealAssessment],
          },
          currentDecision: {
            decisionStatus: FormSubmissionDecisionStatus.Approved,
          },
        },
      ],
    } as FormSubmission);

    // Act
    await formSubmissionActionProcessor.processActions(
      1,
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
    const entityManager = createFormSubmissionFindOneMock({
      id: 1,
      student: { id: 2 },
      formCategory: FormCategory.StudentAppeal,
      application: {
        id: 3,
        currentAssessment: {
          id: 4,
          offering: { id: 5 },
        },
      },
      formSubmissionItems: [
        {
          id: 6,
          submittedData: {
            actions: ["SomeUnknownActionType" as FormSubmissionActionType],
          },
          currentDecision: {
            decisionStatus: FormSubmissionDecisionStatus.Approved,
          },
        },
      ],
    } as FormSubmission);

    // Act
    await expect(
      formSubmissionActionProcessor.processActions(
        1,
        auditUserId,
        auditDate,
        entityManager,
      ),
    ).rejects.toThrow(
      `One or more action types associated with the form submission ID 1 are not recognized: SomeUnknownActionType.`,
    );
  });
});

/**
 * Mock the database result for the form submission details retrieval to allow testing
 * the action processor logic without relying on the database layer.
 * @param formSubmission form submission details to be returned by the mock.
 * @returns mocked EntityManager with the form submission details query implemented.
 */
function createFormSubmissionFindOneMock(
  formSubmission: FormSubmission,
): EntityManager {
  const mockFindOne = jest.fn().mockResolvedValue(formSubmission);
  return {
    getRepository: jest.fn().mockReturnValue({ findOne: mockFindOne }),
  } as unknown as EntityManager;
}
