import { Controller, Get, Post, NotFoundException, Param, Body, BadRequestException } from "@nestjs/common";
import BaseController from "../BaseController";
import { InstitutionLocationService, FormService } from "../../services";
import { GetInstitutionLocationDto } from "./models/institution-location.dto";
import { InstitutionLocationType } from '../../types'
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";

@Controller("institution/location")
export class InstitutionLocationsController extends BaseController {
  constructor(
    private readonly locationService: InstitutionLocationService,
    private readonly formService: FormService,
    ) {
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

  @Post()
  async create(
    @Body() payload: InstitutionLocationType,
    @UserToken() userToken: IUserToken,
  ): Promise<GetInstitutionLocationDto> {
    const submissionResult = await this.formService.dryRunSubmission(
      "institutionlocationcreation",
      payload,
    );
    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to create the institution location due to an invalid request.",
      );
    }
    const createdInstitutionlocation = await this.locationService.createtLocation(
      userToken,
      submissionResult.data,
    );
    return createdInstitutionlocation.id;
  }

}
