import {
  StudentAppeal,
  StudentAppealStatus,
  StudentAppealActionType,
} from "@sims/sims-db";
import { EntityManager } from "typeorm";

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
   * Check if the appeal is approved based on its requests status.
   * @param studentAppeal student appeal to check.
   * @returns true if the appeal is approved, false otherwise.
   */
  protected isAppealApproved(studentAppeal: StudentAppeal): boolean {
    if (!studentAppeal.appealRequests.length) {
      throw new Error(
        "Appeal must have at least one request to verify if it is approved.",
      );
    }
    return studentAppeal.appealRequests.every(
      (appealRequest) =>
        appealRequest.appealStatus === StudentAppealStatus.Approved,
    );
  }
}
