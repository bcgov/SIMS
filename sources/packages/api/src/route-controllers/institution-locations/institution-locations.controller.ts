import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import BaseController from "../BaseController";
import { InstitutionLocationService } from "../../services";
import { GetInstitutionLocationDto } from "./models/institution-location.dto";
import { Public } from "src/auth/decorators/public.decorator";

@Controller("institution/location")
export class InstitutionLocationsController extends BaseController {
  constructor(private readonly locationService: InstitutionLocationService) {
    super();
  }

  @Get(":id")
  async getInstitutionLocation(
    @Param("id") id: number,
  ): Promise<GetInstitutionLocationDto> {
    const location = await this.locationService.getById(id);
    if (!location) {
      throw new NotFoundException(
        "Not able to retrieve the institution location.",
      );
    }

    return {
      id: location.id,
      name: location.name,
      data: location.data,
    };
  }
}
