import {
  Application,
  AssessmentTriggerType,
  StudentAppeal,
  StudentAssessment,
  StudentAppealActionType,
} from "@sims/sims-db";
import { StudentAppealAction } from "./student-appeal-action";
import { EntityManager } from "typeorm";

export class StudentAppealCreateAssessmentAction extends StudentAppealAction {
  get actionType(): StudentAppealActionType {
    return StudentAppealActionType.CreateStudentAppealAssessment;
  }

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
