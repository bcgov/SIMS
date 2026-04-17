import { DynamicFormConfiguration } from "@sims/sims-db";
import { Role } from "../../../auth";
import { FormSubmissionAuthRoles } from "./form-submission.authorization.models";
import { Injectable } from "@nestjs/common";
import { DynamicFormConfigurationService } from "../..";

/**
 * Prefix for roles added to Keycloak to authorize form submission actions
 * based on dynamic form configurations.
 */
const FORMS_AUTHORIZATION_KEY_PREFIX = "forms";
/**
 * Separator used in the authorization key to separate the different parts of the role.
 */
const FORMS_AUTHORIZATION_KEY_SEPARATOR = ".";
/**
 * Position of the authorization key in the role string when split by the separator.
 */
const FORMS_AUTHORIZATION_KEY_POSITION = 1;

/**
 * Service responsible for authorizing form submissions based on the user's roles
 * and the dynamic form configurations associated with the form submission.
 * The expected format of the role is `forms.{authorization-key}.{form-role}`.
 * Example: `forms.room-and-board-costs-appeal.view-form-submitted-data`
 */
@Injectable()
export class FormSubmissionAuthorizationService {
  constructor(
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
  ) {}

  isAuthorized(
    userRoles: Role[],
    formRole: FormSubmissionAuthRoles,
    dynamicFormConfigurationIDs: number[],
    options?: { isAuthorizedToAtLeastOne?: boolean },
  ): boolean {
    const authorizedFormIDs = this.getAuthorizedDynamicFormsIDs(
      userRoles,
      formRole,
    );
    if (options?.isAuthorizedToAtLeastOne) {
      return dynamicFormConfigurationIDs.some((id) =>
        authorizedFormIDs.includes(id),
      );
    }
    return dynamicFormConfigurationIDs.every((id) =>
      authorizedFormIDs.includes(id),
    );
  }

  getAuthorizedDynamicFormsIDs(
    userRoles: Role[],
    formRole: FormSubmissionAuthRoles,
  ): number[] {
    return this.getAuthorizedDynamicForms(userRoles, formRole).map(
      (form) => form.id,
    );
  }

  private getAuthorizedDynamicForms(
    userRoles: Role[],
    formRole: FormSubmissionAuthRoles,
  ): DynamicFormConfiguration[] {
    const formTypes = userRoles
      .filter(
        (role) =>
          role.startsWith(FORMS_AUTHORIZATION_KEY_PREFIX) &&
          role.endsWith(`${FORMS_AUTHORIZATION_KEY_SEPARATOR}${formRole}`),
      )
      .map(
        (role) =>
          role.split(FORMS_AUTHORIZATION_KEY_SEPARATOR)[
            FORMS_AUTHORIZATION_KEY_POSITION
          ],
      );
    return this.dynamicFormConfigurationService.getFormsByAuthorizationKey(
      formTypes,
    );
  }
}
