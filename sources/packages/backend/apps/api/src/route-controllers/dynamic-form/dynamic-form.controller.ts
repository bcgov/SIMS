import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import BaseController from "../BaseController";
import { FormService } from "../../services";
import {
  AllowAuthorizedParty,
  RequiresUserAccount,
  Roles,
} from "../../auth/decorators";
import { AuthorizedParties, Role } from "../../auth";
import { ApiTags } from "@nestjs/swagger";
import {
  FormNameParamAPIInDTO,
  FormsAPIOutDTO,
  FormUpdateAPIInDTO,
} from "./models/form.dto";

@AllowAuthorizedParty(
  AuthorizedParties.institution,
  AuthorizedParties.student,
  AuthorizedParties.supportingUsers,
  AuthorizedParties.aest,
)
@RequiresUserAccount(false)
@Controller("dynamic-form")
@ApiTags("dynamic-form")
export class DynamicFormController extends BaseController {
  constructor(private readonly formService: FormService) {
    super();
  }

  /**
   * List all form definitions that contains the tag 'common' ordered by title.
   * @returns list of form definitions.
   */
  @Roles(Role.AESTFormEditor)
  @Get()
  async list(): Promise<FormsAPIOutDTO> {
    const allForms = await this.formService.list();
    return {
      forms: allForms.map((form) => ({
        name: form.name,
        title: form.title,
      })),
    };
  }

  /**
   * Get a form definition from Form.io.
   * @param formName name of the form to be retrieved.
   * @returns form definition.
   */
  @Get(":formName")
  async getForm(@Param() formNameParam: FormNameParamAPIInDTO): Promise<any> {
    return this.formService.fetch(formNameParam.formName);
  }

  /**
   * Update a form definition in Form.io.
   * @param formName Name of the form to be updated.
   * @param payload Form definition to be updated.
   */
  @Roles(Role.AESTFormEditor)
  @Put(":formName")
  async updateForm(
    @Param() formNameParam: FormNameParamAPIInDTO,
    @Body() payload: FormUpdateAPIInDTO,
  ): Promise<void> {
    return this.formService.updateForm(
      formNameParam.formName,
      payload.formDefinition,
    );
  }
}
