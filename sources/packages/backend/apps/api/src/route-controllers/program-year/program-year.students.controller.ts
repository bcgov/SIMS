import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
} from "@nestjs/common";
import {
  DynamicFormConfigurationService,
  ProgramYearService,
} from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ProgramYearAndFormDetailsAPIOutDTO } from "./models/program-year.dto";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { RequiresStudentAccount } from "../../auth/decorators";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import { ProgramYearControllerService } from "./program-year.controller.service";
import { DynamicFormType, OfferingIntensity } from "@sims/sims-db";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("program-year")
@ApiTags(`${ClientTypeBaseRoute.Student}-program-year`)
export class ProgramYearStudentsController extends BaseController {
  constructor(
    private readonly programYearControllerService: ProgramYearControllerService,
    private readonly programYearService: ProgramYearService,
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
  ) {
    super();
  }

  /**
   * Gets a list of program years returned as option items (id/description pair).
   * @returns an array of program years as id/description objects.
   */
  @Get("options-list")
  async getProgramYears(): Promise<OptionItemAPIOutDTO[]> {
    return this.programYearControllerService.getProgramYears();
  }

  /**
   * Get program year and form name for an active program year.
   * @param id program year id.
   * @param offeringIntensity application offering intensity.
   * @returns an active program year with the id provided.
   */
  @Get(":id/:offeringIntensity")
  @ApiNotFoundResponse({
    description: "Program year not found or is not active.",
  })
  async getProgramYearAndFormDetails(
    @Param("id", ParseIntPipe) id: number,
    @Param("offeringIntensity", new ParseEnumPipe(OfferingIntensity))
    offeringIntensity: OfferingIntensity,
  ): Promise<ProgramYearAndFormDetailsAPIOutDTO> {
    const programYear = await this.programYearService.getActiveProgramYear(id);
    if (!programYear) {
      throw new NotFoundException(
        `Program year ${id} not found or is not active.`,
      );
    }
    const formName = this.dynamicFormConfigurationService.getDynamicFormName(
      DynamicFormType.StudentFinancialAidApplication,
      programYear.id,
      offeringIntensity,
    );
    return {
      programYearId: programYear.id,
      programYear: programYear.programYear,
      programYearDesc: programYear.programYearDesc,
      formName,
    };
  }
}
