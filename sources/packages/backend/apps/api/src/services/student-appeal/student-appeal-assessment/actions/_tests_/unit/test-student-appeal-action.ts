/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  StudentAppeal,
  StudentAppealActionType,
  StudentAppealRequest,
} from "@sims/sims-db";
import { EntityManager } from "typeorm";
import { StudentAppealAction } from "../../student-appeal-action";

/**
 * Concrete action used only for testing the protected methods.
 */
export class TestStudentAppealAction extends StudentAppealAction {
  constructor(private readonly type: StudentAppealActionType) {
    super();
  }

  get actionType(): StudentAppealActionType {
    return this.type;
  }

  /**
   * Not used in the tests.
   */

  async process(
    _studentAppeal: StudentAppeal,
    _auditUserId: number,
    _auditDate: Date,
    _entityManager: EntityManager,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  exposedHasApprovedAction(studentAppeal: StudentAppeal): boolean {
    return this.hasApprovedAction(studentAppeal);
  }

  exposedGetActionRequests(
    studentAppeal: StudentAppeal,
  ): StudentAppealRequest[] {
    return this.getActionRequests(studentAppeal);
  }
}
