import {
  StudentAppeal,
  StudentAppealStatus,
  StudentAppealActionType,
} from "@sims/sims-db";
import { EntityManager } from "typeorm";

export abstract class StudentAppealAction {
  abstract process(
    studentAppeal: StudentAppeal,
    auditUserId: number,
    auditDate: Date,
    entityManager: EntityManager,
  ): Promise<void>;

  abstract get actionType(): StudentAppealActionType;

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
