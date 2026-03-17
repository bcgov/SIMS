import {
  DynamicFormConfiguration,
  FormSubmissionItem,
  FormSubmissionItemDecision,
  User,
} from "@sims/sims-db";
import { faker } from "@faker-js/faker";

/**
 * Creates a fake form submission item.
 * @param relations form submission item relations.
 * - `dynamicFormConfiguration` dynamic form configuration for the item.
 * - `currentDecision` current decision. When not provided the item will have no decision (Pending).
 * @returns a form submission item not yet persisted.
 */
export function createFakeFormSubmissionItem(relations: {
  dynamicFormConfiguration: DynamicFormConfiguration;
  currentDecision?: FormSubmissionItemDecision;
  auditUser?: User;
}): FormSubmissionItem {
  const item = new FormSubmissionItem();
  item.dynamicFormConfiguration = relations.dynamicFormConfiguration;
  item.submittedData = { someField: faker.lorem.word() };
  item.currentDecision = relations.currentDecision;
  item.decisions = relations.currentDecision ? [relations.currentDecision] : [];
  item.creator = relations.auditUser ?? null;
  return item;
}
