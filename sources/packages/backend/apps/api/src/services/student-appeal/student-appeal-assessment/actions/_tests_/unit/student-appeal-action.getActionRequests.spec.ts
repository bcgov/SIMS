import {
  StudentAppeal,
  StudentAppealRequest,
  StudentAppealActionType,
} from "@sims/sims-db";
import { TestStudentAppealAction } from "./test-student-appeal-action";

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
    expect(result).toEqual([requestWithMatch]);
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
    expect(resultForDefault).toEqual([requestWithoutActions]);
    // Non-default action should NOT include the request without actions.
    expect(resultForNonDefault).toEqual([requestWithDifferentAction]);
  });
});
