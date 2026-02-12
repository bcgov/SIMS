import { Controller, Get } from "@nestjs/common";
import { DynamicFormConfigurationService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
} from "../../auth/decorators";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { FormCategory } from "@sims/sims-db";
import { SubmissionFormConfigurationsAPIOutDTO } from "./models/form-submission.dto";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("form-submission")
@ApiTags(`${ClientTypeBaseRoute.Student}-form-submission`)
export class FormSubmissionStudentsController extends BaseController {
  constructor(
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
  ) {
    super();
  }

  /**
   * Get all submission form configurations for student submission forms.
   * @returns form configurations that allow student submissions.
   */
  @Get("forms")
  async getSubmissionForms(): Promise<SubmissionFormConfigurationsAPIOutDTO> {
    const studentForms =
      this.dynamicFormConfigurationService.getFormsByCategory(
        FormCategory.StudentForm,
        FormCategory.StudentAppeal,
      );
    return {
      configurations: studentForms.map((configuration) => ({
        id: configuration.id,
        formDefinitionName: configuration.formDefinitionName,
        formType: configuration.formType,
        formCategory: configuration.formCategory,
        formDescription: configuration.formDescription,
        allowBundledSubmission: configuration.allowBundledSubmission,
        hasApplicationScope: configuration.hasApplicationScope,
      })),
    };
  }
}
