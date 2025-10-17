import {
  ModifiedIndependentStatus,
  Student,
  StudentAppeal,
  StudentAppealActionType,
} from "@sims/sims-db";
import { StudentAppealAction } from "./student-appeal-action";
import { EntityManager } from "typeorm";

export class StudentAppealUpdateModifiedIndependentAction extends StudentAppealAction {
  get actionType(): StudentAppealActionType {
    return StudentAppealActionType.UpdateModifiedIndependent;
  }

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
