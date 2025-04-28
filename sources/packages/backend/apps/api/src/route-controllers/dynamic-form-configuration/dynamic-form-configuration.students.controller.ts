import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseEnumPipe,
  Query,
} from "@nestjs/common";
import {
  DynamicFormConfigurationService,
  ProgramYearService,
} from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { RequiresStudentAccount } from "../../auth/decorators";
import { DynamicFormType } from "@sims/sims-db";
import {
  DynamicFormConfigurationAPIInDTO,
  DynamicFormConfigurationAPIOutDTO,
} from "..";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("dynamic-form-configuration")
@ApiTags(`${ClientTypeBaseRoute.Student}-dynamic-form-configuration`)
export class DynamicFormConfigurationStudentsController extends BaseController {
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
  @ApiNotFoundResponse({
    description: "Program year not found or is not active.",
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
        throw new NotFoundException(`Program year not found or is not active.`);
      }
    }
    const formDefinitionName =
      this.dynamicFormConfigurationService.getDynamicFormName(formType, {
        programYearId: dynamicFormOptions?.programYearId,
        offeringIntensity: dynamicFormOptions?.offeringIntensity,
      });
    return { formDefinitionName };
  }
}
