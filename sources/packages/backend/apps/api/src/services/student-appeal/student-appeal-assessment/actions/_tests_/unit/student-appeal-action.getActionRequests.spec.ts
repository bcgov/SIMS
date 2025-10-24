import {
  StudentAppeal,
  StudentAppealRequest,
  StudentAppealActionType,
} from "@sims/sims-db";
import { EntityManager } from "typeorm";
import { StudentAppealAction } from "../../student-appeal-action";

/**
 * Concrete action used only for testing the protected method getActionRequests.
 */
class TestStudentAppealAction extends StudentAppealAction {
  constructor(private readonly type: StudentAppealActionType) {
    super();
  }

  get actionType(): StudentAppealActionType {
    return this.type;
  }

  // Not used in these tests.
  async process(
    studentAppeal: StudentAppeal,
    auditUserId: number,
    auditDate: Date,
    entityManager: EntityManager,
  ): Promise<void> {
    // Mark parameters as used to satisfy lint rules.
    void studentAppeal;
    void auditUserId;
    void auditDate;
    void entityManager;
  }

  exposedGetActionRequests(
    studentAppeal: StudentAppeal,
  ): StudentAppealRequest[] {
    return this.getActionRequests(studentAppeal);
  }
}

describe("StudentAppealAction-getActionRequests", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Should return only the requests that include the matching action type.", () => {
    // Arrange
    const action = new TestStudentAppealAction(
      StudentAppealActionType.UpdateModifiedIndependent,
    );
    const studentAppeal = new StudentAppeal();
    const requestWithMatch = {
      submittedData: {
        actions: [StudentAppealActionType.UpdateModifiedIndependent],
      },
    } as StudentAppealRequest;
    const requestWithoutMatch = {
      submittedData: {
        actions: [StudentAppealActionType.CreateStudentAppealAssessment],
      },
    } as StudentAppealRequest;
    studentAppeal.appealRequests = [requestWithMatch, requestWithoutMatch];

    // Act
    const result = action.exposedGetActionRequests(studentAppeal);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(requestWithMatch);
  });

  it("Should include requests without actions only when the action type is the DEFAULT one (CreateStudentAppealAssessment).", () => {
    // Arrange
    const defaultAction = new TestStudentAppealAction(
      StudentAppealActionType.CreateStudentAppealAssessment,
    );
    const nonDefaultAction = new TestStudentAppealAction(
      StudentAppealActionType.UpdateModifiedIndependent,
    );
    const studentAppeal = new StudentAppeal();
    const requestWithoutActions = {
      submittedData: {},
    } as StudentAppealRequest;
    const requestWithDifferentAction = {
      submittedData: {
        actions: [StudentAppealActionType.UpdateModifiedIndependent],
      },
    } as StudentAppealRequest;
    studentAppeal.appealRequests = [
      requestWithoutActions,
      requestWithDifferentAction,
    ];

    // Act
    const resultForDefault =
      defaultAction.exposedGetActionRequests(studentAppeal);
    const resultForNonDefault =
      nonDefaultAction.exposedGetActionRequests(studentAppeal);

    // Assert
    // Default action should include the request without actions.
    expect(resultForDefault).toContain(requestWithoutActions);
    // Non-default action should NOT include the request without actions.
    expect(resultForNonDefault).not.toContain(requestWithoutActions);
  });
});
