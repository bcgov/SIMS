import {
  ModifiedIndependentStatus,
  Student,
  StudentAppeal,
  StudentAppealActionType,
} from "@sims/sims-db";
import { StudentAppealAction } from "./student-appeal-action";
import { EntityManager } from "typeorm";

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
    const modifiedIndependentStatus = this.isAppealApproved(studentAppeal)
      ? ModifiedIndependentStatus.Approved
      : ModifiedIndependentStatus.Declined;
    await entityManager.getRepository(Student).update(
      { id: studentAppeal.student.id },
      {
        modifiedIndependentStatus,
        modifiedIndependentAppealRequest: { id: studentAppeal.id },
        modifier: { id: auditUserId },
        updatedAt: auditDate,
      },
    );
  }
}
