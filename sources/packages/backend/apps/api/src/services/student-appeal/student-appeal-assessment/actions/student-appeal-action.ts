import {
  StudentAppeal,
  StudentAppealStatus,
  StudentAppealActionType,
} from "@sims/sims-db";
import { EntityManager } from "typeorm";

/**
 * Default action types for student appeal processing
 * when none is provided in the appeal requests.
 */
export const DEFAULT_ACTION_TYPE = [
  StudentAppealActionType.CreateStudentAppealAssessment,
];

/**
 * Actions that can be performed on student appeals during the
 * assessment (approval/decline) process.
 */
export abstract class StudentAppealAction {
  /**
   * Process the student appeal action.
   * @param studentAppeal student appeal to process.
   * @param auditUserId ID of the user performing the action.
   * @param auditDate date the action is being performed.
   * @param entityManager entity manager to use for database operations.
   */
  abstract process(
    studentAppeal: StudentAppeal,
    auditUserId: number,
    auditDate: Date,
    entityManager: EntityManager,
  ): Promise<void>;

  /**
   * Type of action being performed.
   */
  abstract get actionType(): StudentAppealActionType;

  /**
   * Check if an action associated with an appeal is approved based on its requests statuses.
   * To an action be considered approved, at least one of the appeal requests
   * associated with the action must be approved.
   * @param studentAppeal student appeal to check.
   * @returns true if the action is approved, false otherwise.
   */
  protected hasApprovedAction(studentAppeal: StudentAppeal): boolean {
    if (!studentAppeal.appealRequests.length) {
      throw new Error(
        "Appeal must have at least one request to verify if it is approved.",
      );
    }
    return studentAppeal.appealRequests.some(
      (request) =>
        (request.submittedData.actions ?? DEFAULT_ACTION_TYPE).includes(
          this.actionType,
        ) && request.appealStatus === StudentAppealStatus.Approved,
    );
  }
}
