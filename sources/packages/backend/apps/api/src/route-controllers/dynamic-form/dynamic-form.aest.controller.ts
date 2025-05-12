import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import BaseController from "../BaseController";
import { FormService } from "../../services";
import { AllowAuthorizedParty, Groups, Roles } from "../../auth/decorators";
import { AuthorizedParties, Role, UserGroups } from "../../auth";
import { ApiTags } from "@nestjs/swagger";
import {
  FormNameParamAPIInDTO,
  FormsAPIOutDTO,
  FormUpdateAPIInDTO,
} from "./models/form.dto";
import { ClientTypeBaseRoute } from "../../types";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Roles(Role.AESTFormEditor)
@Controller("dynamic-form")
@ApiTags(`${ClientTypeBaseRoute.AEST}-dynamic-form`)
export class DynamicFormAESTController extends BaseController {
  constructor(private readonly formService: FormService) {
    super();
  }

  /**
   * List all form definitions that contains the tag 'common' ordered by title.
   * @returns list of form definitions.
   */
  @Get()
  async list(): Promise<FormsAPIOutDTO> {
    const allForms = await this.formService.list();
    return {
      forms: allForms.map((form) => ({
        title: form.title,
        path: form.path,
      })),
    };
  }

  /**
   * Update a form definition in Form.io.
   * @param formName Name of the form to be updated.
   * @param payload Form definition to be updated.
   */
  @Put(":formPath")
  async updateForm(
    @Param() formNameParam: FormNameParamAPIInDTO,
    @Body() payload: FormUpdateAPIInDTO,
  ): Promise<void> {
    return this.formService.updateForm(
      formNameParam.formPath,
      payload.formDefinition,
    );
  }
}
