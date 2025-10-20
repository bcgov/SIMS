import { Injectable } from "@nestjs/common";
import { StudentAppeal } from "@sims/sims-db";
import { EntityManager } from "typeorm";
import {
  DEFAULT_ACTION_TYPE,
  StudentAppealAction,
  StudentAppealCreateAssessmentAction,
  StudentAppealUpdateModifiedIndependentAction,
} from "..";

/**
 * Keeps a list of all available student appeal actions that can potentially
 * be processed and execute them based on the appeal requests action types.
 */
@Injectable()
export class StudentAppealActionsProcessor {
  private readonly actions: StudentAppealAction[];

  constructor(
    createAssessmentAction: StudentAppealCreateAssessmentAction,
    updateModifiedIndependentAction: StudentAppealUpdateModifiedIndependentAction,
  ) {
    this.actions = [createAssessmentAction, updateModifiedIndependentAction];
  }

  /**
   * Process the actions associated with a student appeal.
   * Checks for the appeals requests action types and process
   * the corresponding actions as required.
   * @param studentAppeal the student appeal to process actions for.
   * @param auditUserId the ID of the user performing the action.
   * @param auditDate the date the action is being performed.
   * @param entityManager entity manager to allow the query to happen within a transaction.
   */
  async processActions(
    studentAppeal: StudentAppeal,
    auditUserId: number,
    auditDate: Date,
    entityManager: EntityManager,
  ): Promise<void> {
    const actionTypes = studentAppeal.appealRequests.flatMap(
      (request) => request.submittedData?.actions ?? DEFAULT_ACTION_TYPE,
    );
    const uniqueActionsTypes: Set<string> = new Set(actionTypes);
    const actionsToProcess = this.actions.filter((action) =>
      uniqueActionsTypes.has(action.actionType),
    );
    const actionsPromises = actionsToProcess.map((action) =>
      action.process(studentAppeal, auditUserId, auditDate, entityManager),
    );
    await Promise.all(actionsPromises);
  }
}
