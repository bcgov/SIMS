import { Role } from "../../../auth";
import {
  FormSubmissionAuthRoles,
  FormSubmissionUserRoles,
  FormSubmissionUserRolesAuth,
} from "./form-submission.authorization.models";
import { Injectable } from "@nestjs/common";
import { DynamicFormConfigurationService } from "../..";

/**
 * Regular expression to validate and parse the form authorization role format.
 * Expected format: `forms.{authorization-key}.{form-role}`, where form-role
 * must be one of the values defined in {@link FormSubmissionAuthRoles}.
 */
const FORMS_AUTHORIZATION_ROLE_REGEX = new RegExp(
  String.raw`^forms\.([a-zA-Z0-9-]{1,50})\.(${Object.values(FormSubmissionAuthRoles).join("|")})$`,
);

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
   * Check if the user is authorized to perform an action on a form submission based on their roles.
   * If multiple checks are needed for the same user roles context, it is recommended to use `getFormsUserRoles`.
   * @param userRoles roles assigned to the user.
   * @param formRole form role to check authorization for.
   * @param dynamicFormConfigurationIDs list of dynamic form configuration IDs to check authorization for.
   * @param options authorization options.
   * - `atLeastOneAuthorized`: if true, the method returns true if the user is authorized for at least
   * one of the provided dynamic form configuration IDs, otherwise, the user must be authorized for all
   * provided dynamic form configuration IDs to return true.
   * @returns boolean indicating whether the user is authorized for the specified form role and
   * dynamic form configuration IDs.
   */
  isAuthorized(
    userRoles: Role[],
    formRole: FormSubmissionAuthRoles,
    dynamicFormConfigurationIDs: number[],
    options?: { atLeastOneAuthorized?: boolean },
  ): boolean {
    const formsUserRoles = this.getFormsUserRoles(userRoles);
    return formsUserRoles.isAuthorized(
      formRole,
      dynamicFormConfigurationIDs,
      options,
    );
  }

  /**
   * Get the list of dynamic form configuration IDs that the user is authorized to access for a specific form role.
   * Useful for database queries to filter the content based on the user authorizations.
   * If multiple checks are needed for the same user roles context, it is recommended to use `getFormsUserRoles`.
   * @param userRoles roles assigned to the user.
   * @param formRole form role to check authorization for.
   * @returns list of dynamic form configuration IDs the user is authorized to access for the specified form role.
   */
  getAuthorizedDynamicFormsIDs(
    userRoles: Role[],
    formRole: FormSubmissionAuthRoles,
  ): number[] {
    const formsUserRoles = this.getFormsUserRoles(userRoles);
    return formsUserRoles.getAuthorizedDynamicFormsIDs(formRole);
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
    const formsAuthorizationKeysMap =
      this.dynamicFormConfigurationService.getFormsIDsAndAuthorizationKeysMap();
    for (const role of userRoles) {
      // Expected format: `forms.{authorization-key}.{form-role}`.
      const match = FORMS_AUTHORIZATION_ROLE_REGEX.exec(role);
      if (!match) {
        continue;
      }
      const [, authorizationKey, formRole] = match;
      // Get the form IDs associated with the authorization key and form role.
      const allowedFormsIDs =
        formsAuthorizationKeysMap.get(authorizationKey) ?? [];
      const formRoleEnum = formRole as FormSubmissionAuthRoles;
      const allowedForms = (formSubmissionUserRoles[formRoleEnum] ??= []);
      allowedForms.push(...allowedFormsIDs);
    }
    return new FormSubmissionUserRolesAuth(formSubmissionUserRoles);
  }
}
