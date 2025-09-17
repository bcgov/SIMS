import {
  ActionEffectiveCondition,
  ActionEffectiveConditionNames,
} from "@sims/sims-db";

type ContextData = { aviationCredentialType?: string };
const actionEffectiveConditionsMap: {
  [key in ActionEffectiveConditionNames]: (
    actionEffectiveCondition: ActionEffectiveCondition,
    contextData: ContextData,
  ) => boolean;
} = {
  [ActionEffectiveConditionNames.AviationCredentialTypes]:
    aviationCredentialTypeCondition,
};

/**
 * Evaluates if the restriction actions are effective based on the provided conditions.
 * When no conditions are provided then restriction actions are implicitly effective
 * and when one or more conditions are provided all must be satisfied for the restriction actions to be effective.
 * @param actionEffectiveConditions conditions that makes the restriction actions effective.
 * @param contextData context data required to evaluate the conditions.
 * @returns true if the restriction actions are effective, otherwise false.
 */
export function isRestrictionActionEffective(
  actionEffectiveConditions: ActionEffectiveCondition[] | null,
  contextData: ContextData,
): boolean {
  if (!actionEffectiveConditions?.length) {
    // If no conditions are provided then restriction actions are implicitly effective.
    return true;
  }
  // When one or more conditions are provided all must be satisfied for the restriction actions to be effective.
  return actionEffectiveConditions.every((actionEffectiveCondition) =>
    actionEffectiveConditionsMap[actionEffectiveCondition.name](
      actionEffectiveCondition,
      contextData,
    ),
  );
}

/**
 * Aviation credential type condition evaluator.
 * @param actionEffectiveCondition condition to be evaluated.
 * @param contextData context data required to evaluate the condition.
 * @returns true if the condition is satisfied or no aviation credential type is provided, otherwise false.
 */
function aviationCredentialTypeCondition(
  actionEffectiveCondition: ActionEffectiveCondition,
  contextData: ContextData,
): boolean {
  if (!contextData.aviationCredentialType) {
    return true;
  }
  const conditionValues = actionEffectiveCondition.value as string[];
  return conditionValues.includes(contextData.aviationCredentialType);
}
