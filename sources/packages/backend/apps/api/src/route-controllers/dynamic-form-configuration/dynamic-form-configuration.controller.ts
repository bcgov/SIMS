import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  DynamicFormConfigurationService,
  ProgramYearService,
} from "../../services";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiTags, ApiUnprocessableEntityResponse } from "@nestjs/swagger";
import { DynamicFormType } from "@sims/sims-db";
import {
  DynamicFormConfigurationAPIInDTO,
  DynamicFormConfigurationAPIOutDTO,
  DynamicFormConfigurationsAPIOutDTO,
} from "..";

@AllowAuthorizedParty(
  AuthorizedParties.institution,
  AuthorizedParties.student,
  AuthorizedParties.supportingUsers,
  AuthorizedParties.aest,
)
@Controller("dynamic-form-configuration")
@ApiTags("dynamic-form-configuration")
export class DynamicFormConfigurationController extends BaseController {
  constructor(
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
    private readonly programYearService: ProgramYearService,
  ) {
    super();
  }

  /**
   * Get dynamic form configuration.
   * @param programYearId program year id.
   * @param formType form type.
   * @param dynamicFormOptions dynamic form options
   * - `programYearId` program year id.
   * - `offeringIntensity` offering intensity.
   * @returns dynamic form configuration.
   */
  @Get("form-type/:formType")
  @ApiUnprocessableEntityResponse({
    description:
      "Dynamic form configuration not found or program year not found or is not active.",
  })
  async getDynamicFormConfiguration(
    @Param("formType", new ParseEnumPipe(DynamicFormType))
    formType: DynamicFormType,
    @Query() dynamicFormOptions: DynamicFormConfigurationAPIInDTO,
  ): Promise<DynamicFormConfigurationAPIOutDTO> {
    // Validate the program year id if present.
    if (dynamicFormOptions?.programYearId) {
      const programYear = await this.programYearService.programYearExists(
        dynamicFormOptions?.programYearId,
      );
      if (!programYear) {
        throw new UnprocessableEntityException(
          "Program year not found or is not active.",
        );
      }
    }
    const dynamicForm = this.dynamicFormConfigurationService.getDynamicForm(
      formType,
      {
        programYearId: dynamicFormOptions?.programYearId,
        offeringIntensity: dynamicFormOptions?.offeringIntensity,
      },
    );
    if (!dynamicForm) {
      throw new UnprocessableEntityException(
        `Dynamic form configuration for ${formType} not found.`,
      );
    }
    return {
      id: dynamicForm.id,
      formDefinitionName: dynamicForm.formDefinitionName,
      formType: dynamicForm.formType,
      formCategory: dynamicForm.formCategory,
      formDescription: dynamicForm.formDescription,
      allowBundledSubmission: dynamicForm.allowBundledSubmission,
      hasApplicationScope: dynamicForm.hasApplicationScope,
    };
  }

  @Get("student-forms")
  async getDynamicFormConfigurationsByCategory(): Promise<DynamicFormConfigurationsAPIOutDTO> {
    const formsConfigurations =
      this.dynamicFormConfigurationService.getDynamicStudentForms();
    return {
      configurations: formsConfigurations.map((configuration) => ({
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
