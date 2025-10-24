import {
  ModifiedIndependentStatus,
  Student,
  StudentAppeal,
  StudentAppealActionType,
  StudentAppealStatus,
} from "@sims/sims-db";
import { StudentAppealAction } from "./student-appeal-action";
import { EntityManager } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class StudentAppealUpdateModifiedIndependentAction extends StudentAppealAction {
  /**
   * Type of action being performed.
   */
  get actionType(): StudentAppealActionType {
    return StudentAppealActionType.UpdateModifiedIndependent;
  }

  /**
   * Updates the student's modified independent status based on the appeal's approval status.
   * @param studentAppeal student appeal to process.
   * @param auditUserId ID of the user performing the action.
   * @param auditDate date the action is being performed.
   * @param entityManager entity manager to use for database operations.
   */
  async process(
    studentAppeal: StudentAppeal,
    auditUserId: number,
    auditDate: Date,
    entityManager: EntityManager,
  ): Promise<void> {
    const appealRequests = this.getActionRequests(studentAppeal);
    if (appealRequests.length !== 1) {
      throw new Error(
        `Expected 1 appeal request for action ${this.actionType}, but found ${appealRequests.length}.`,
      );
    }
    const [appealRequest] = appealRequests;
    const modifiedIndependentStatus =
      appealRequest.appealStatus === StudentAppealStatus.Approved
        ? ModifiedIndependentStatus.Approved
        : ModifiedIndependentStatus.Declined;
    const auditUser = { id: auditUserId };
    await entityManager.getRepository(Student).update(
      { id: studentAppeal.student.id },
      {
        modifiedIndependentStatus,
        modifiedIndependentAppealRequest: { id: appealRequest.id },
        modifiedIndependentStatusUpdatedBy: auditUser,
        modifiedIndependentStatusUpdatedOn: auditDate,
        modifier: auditUser,
        updatedAt: auditDate,
      },
    );
  }
}
