import {
  StudentAppeal,
  StudentAppealRequest,
  StudentAppealStatus,
  StudentAppealActionType,
} from "@sims/sims-db";
import { TestStudentAppealAction } from "./test-student-appeal-action";

describe("StudentAppealAction-hasApprovedAction", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Should throw an error when there are no associated requests for the action.", () => {
    // Arrange
    const action = new TestStudentAppealAction(
      StudentAppealActionType.UpdateModifiedIndependent,
    );
    const studentAppeal = new StudentAppeal();
    // Provide requests, but none associated with the action under test.
    studentAppeal.appealRequests = [
      {
        submittedData: {
          actions: [
            // Different action than the one being tested.
            StudentAppealActionType.CreateStudentAppealAssessment,
          ],
        },
      } as StudentAppealRequest,
      {
        // No actions, defaults to CreateStudentAppealAssessment (not the tested action).
        submittedData: {},
      } as StudentAppealRequest,
    ];

    // Act/Assert
    expect(() => action.exposedHasApprovedAction(studentAppeal)).toThrow(
      `Status cannot be determined without associated appeals requests for the action ${StudentAppealActionType.UpdateModifiedIndependent}.`,
    );
  });

  it("Should return true when at least one associated request is approved.", () => {
    // Arrange
    const action = new TestStudentAppealAction(
      StudentAppealActionType.UpdateModifiedIndependent,
    );
    const studentAppeal = new StudentAppeal();
    studentAppeal.appealRequests = [
      {
        appealStatus: StudentAppealStatus.Declined,
        submittedData: {
          actions: [StudentAppealActionType.UpdateModifiedIndependent],
        },
      } as StudentAppealRequest,
      {
        appealStatus: StudentAppealStatus.Approved,
        submittedData: {
          actions: [StudentAppealActionType.UpdateModifiedIndependent],
        },
      } as StudentAppealRequest,
    ];

    // Act
    const result = action.exposedHasApprovedAction(studentAppeal);

    // Assert
    expect(result).toBe(true);
  });

  it("Should return false when there are associated requests but none is approved.", () => {
    // Arrange
    const action = new TestStudentAppealAction(
      StudentAppealActionType.UpdateModifiedIndependent,
    );
    const studentAppeal = new StudentAppeal();
    studentAppeal.appealRequests = [
      {
        appealStatus: StudentAppealStatus.Declined,
        submittedData: {
          actions: [StudentAppealActionType.UpdateModifiedIndependent],
        },
      } as StudentAppealRequest,
    ];

    // Act
    const result = action.exposedHasApprovedAction(studentAppeal);

    // Assert
    expect(result).toBe(false);
  });
});
