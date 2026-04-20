import { Role } from "../../../auth";
import {
  FormSubmissionAuthRoles,
  FormSubmissionUserRoles,
  FormSubmissionUserRolesAuth,
} from "./form-submission.authorization.models";
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
 * Service responsible for authorizing form submissions based on the user's roles
 * and the dynamic form configurations associated with the form submission.
 * The expected format of the role is `forms.{authorization-key}.{form-role}`.
 * Example: `forms.room-and-board-costs-appeal.view-form-submitted-data`.
 */
@Injectable()
export class FormSubmissionAuthorizationService {
  constructor(
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
  ) {}

  /**
   * Check if the user is authorized to perform an action on a form submission based on their roles and the dynamic form configurations associated with the form submission.
   * Useful when a single authorization check is needed in the request content.
   * If multiple authorization checks are needed, it's more efficient to use the `getFormsUserRoles` method.
   * @param userRoles roles assigned to the user.
   * @param formRole form role to check authorization for.
   * @param dynamicFormConfigurationIDs list of dynamic form configuration IDs to check authorization for.
   * @returns true if the user is authorized to perform the action on the specified form submission, false otherwise.
   */
  isAuthorized(
    userRoles: Role[],
    formRole: FormSubmissionAuthRoles,
    dynamicFormConfigurationIDs: number[],
  ): boolean {
    const formsUserRoles = this.getFormsUserRoles(userRoles);
    return formsUserRoles.isAuthorized(formRole, dynamicFormConfigurationIDs);
  }

  /**
   * Get the list of dynamic form configuration IDs that the user is authorized to access for a specific form role.
   * Useful when a single authorization check is needed in the request content.
   * If multiple authorization checks are needed, it's more efficient to use the `getFormsUserRoles` method.
   * @param userRoles roles assigned to the user.
   * @param formRole form role to check authorization for.
   * @returns list of dynamic form configuration IDs the user is authorized to access for the specified form role.
   */
  getAuthorizedDynamicFormsIDs(
    userRoles: Role[],
    formRole: FormSubmissionAuthRoles,
  ): number[] {
    const formsUserRoles = this.getFormsUserRoles(userRoles);
    return formsUserRoles.authorizedDynamicFormsIDs(formRole);
  }

  /**
   * Convert the user roles to the form submission user roles format, which maps each form role
   * to the list of dynamic form configuration IDs that the user is authorized to access.
   * Useful when multiple authorizations are needed in the same request content.
   * @param userRoles roles assigned to the user.
   * @returns mapped roles and their associated dynamic form configuration IDs.
   */
  getFormsUserRoles(userRoles: Role[]): FormSubmissionUserRolesAuth {
    const formSubmissionUserRoles = {} as FormSubmissionUserRoles;
    userRoles
      .filter((role) =>
        role.startsWith(
          `${FORMS_AUTHORIZATION_KEY_PREFIX}${FORMS_AUTHORIZATION_KEY_SEPARATOR}`,
        ),
      )
      .forEach((role) => {
        // Expected format: `forms.{authorization-key}.{form-role}`.
        const [, authorizationKey, formRole] = role.split(
          FORMS_AUTHORIZATION_KEY_SEPARATOR,
        );
        // Get the form IDs associated with the authorization key and form role.
        const allowedFormsIDs = this.dynamicFormConfigurationService
          .getFormsByAuthorizationKey([authorizationKey])
          .map((form) => form.id);
        const formRoleEnum = formRole as FormSubmissionAuthRoles;
        (formSubmissionUserRoles[formRoleEnum] ??= []).push(...allowedFormsIDs);
      });
    return new FormSubmissionUserRolesAuth(formSubmissionUserRoles);
  }
}
