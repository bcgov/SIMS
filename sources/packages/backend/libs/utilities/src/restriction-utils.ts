import {
  ActionEffectiveCondition,
  ActionEffectiveConditionNames,
} from "@sims/sims-db";

type ConditionEvaluator = (
  actionEffectiveCondition: ActionEffectiveCondition,
  applicationContextData: Record<string, unknown>,
) => boolean;

/**
 * Evaluates if the restriction actions are effective based on the provided conditions.
 * When no conditions are provided then restriction actions are implicitly effective
 * and when one or more conditions are provided all must be satisfied for the restriction actions to be effective.
 * @param actionEffectiveConditions conditions that makes the restriction actions effective.
 * @param applicationContextData application context data required to evaluate the conditions.
 * @returns true if the restriction actions are effective, otherwise false.
 */
export function isRestrictionActionEffective(
  actionEffectiveConditions: ActionEffectiveCondition[] | null,
  applicationContextData: Record<string, unknown>,
): boolean {
  if (!actionEffectiveConditions?.length) {
    // If no conditions are provided then restriction actions are implicitly effective.
    return true;
  }
  // When one or more conditions are provided all must be satisfied for the restriction actions to be effective.
  return actionEffectiveConditions.every((actionEffectiveCondition) => {
    // Get the condition evaluator based on the condition name.
    const conditionEvaluator =
      getActionEffectiveConditionsMap()[actionEffectiveCondition.name];
    if (!conditionEvaluator) {
      throw new Error(
        `No evaluator found for the action effective condition: ${actionEffectiveCondition.name}.`,
      );
    }
    return conditionEvaluator(actionEffectiveCondition, applicationContextData);
  });
}

/**
 * Aviation credential type condition evaluator.
 * @param actionEffectiveCondition condition to be evaluated.
 * @param applicationContextData application context data required to evaluate the condition.
 * @returns true if the condition is satisfied or no aviation credential type is provided, otherwise false.
 */
function aviationCredentialTypeCondition(
  actionEffectiveCondition: {
    name: ActionEffectiveConditionNames;
    value: string[];
  },
  applicationContextData: { aviationCredentialType?: string },
): boolean {
  const conditionValues = actionEffectiveCondition.value;
  return conditionValues.includes(
    applicationContextData.aviationCredentialType,
  );
}

/**
 * Returns a map of condition evaluators.
 * @returns map of condition evaluators.
 */
function getActionEffectiveConditionsMap(): {
  [key in ActionEffectiveConditionNames]: ConditionEvaluator;
} {
  return {
    [ActionEffectiveConditionNames.AviationCredentialTypes]:
      aviationCredentialTypeCondition,
  };
}
