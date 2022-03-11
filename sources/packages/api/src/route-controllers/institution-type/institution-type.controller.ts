import { Controller, Get } from "@nestjs/common";
import BaseController from "../BaseController";
import { InstitutionTypeService } from "../../services";
import { OptionItem } from "../../types";
import { ApiTags } from "@nestjs/swagger";
@Controller("institution/type")
@ApiTags("institution")
export class InstitutionTypeController extends BaseController {
  constructor(private readonly institutionTypeService: InstitutionTypeService) {
    super();
  }

  @Get("options-list")
  async getOptionsList(): Promise<OptionItem[]> {
    const institutionTypes = await this.institutionTypeService.getAll();
    return institutionTypes.map((institutionType) => ({
      id: institutionType.id,
      description: institutionType.name,
    }));
  }
}
