import {
  Application,
  AssessmentTriggerType,
  StudentAppeal,
  StudentAssessment,
  StudentAppealActionType,
} from "@sims/sims-db";
import { StudentAppealAction } from "./student-appeal-action";
import { EntityManager } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class StudentAppealCreateAssessmentAction extends StudentAppealAction {
  /**
   * Type of action being performed.
   */
  get actionType(): StudentAppealActionType {
    return StudentAppealActionType.CreateStudentAppealAssessment;
  }

  /**
   * Create a new assessment for the student appeal.
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
    if (!this.isAppealApproved(studentAppeal)) {
      // If the appeal is not approved, no assessment should be created.
      return;
    }
    if (!studentAppeal.application) {
      throw new Error(
        `Cannot create assessment for student appeal ID ${studentAppeal.id} because it is not linked to an application.`,
      );
    }
    // Create the new assessment to be processed.
    const auditUser = { id: auditUserId };
    const newAssessment = {
      application: { id: studentAppeal.application.id } as Application,
      offering: {
        id: studentAppeal.application.currentAssessment.offering.id,
      },
      triggerType: AssessmentTriggerType.StudentAppeal,
      studentAppeal: { id: studentAppeal.id },
      creator: auditUser,
      createdAt: auditDate,
      submittedBy: auditUser,
      submittedDate: auditDate,
    } as StudentAssessment;
    await entityManager.getRepository(StudentAssessment).insert(newAssessment);
    await entityManager.getRepository(Application).update(
      { id: studentAppeal.application.id },
      {
        currentAssessment: { id: newAssessment.id },
        modifier: auditUser,
        updatedAt: auditDate,
      },
    );
  }
}
