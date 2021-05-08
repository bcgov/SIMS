import {
  Controller,
  Get,
  Post,
  NotFoundException,
  Param,
  Body,
  BadRequestException,
} from "@nestjs/common";
import BaseController from "../BaseController";
import { InstitutionLocationService, FormService } from "../../services";
import {
  GetInstitutionLocationDto,
  InstitutionLocationTypeDto,
} from "./models/institution-location.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import { FormsFlowService } from "src/services/forms-flow/forms-flow.service";

@Controller("institution/location")
export class InstitutionLocationsController extends BaseController {
  constructor(
    private readonly locationService: InstitutionLocationService,
    private readonly formService: FormService,
    private readonly formsFlowService: FormsFlowService,
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
    @Body() payload: InstitutionLocationTypeDto,
    @UserToken() userToken: IUserToken,
  ): Promise<number> {
    const dryRunSubmissionResult = await this.formService.dryRunSubmission(
      "institutionlocationcreation",
      payload,
    );

    if (!dryRunSubmissionResult.valid) {
      throw new BadRequestException(
        "Not able to create the institution location due to an invalid request.",
      );
    }

    const createdInstitutionlocation = await this.locationService.createtLocation(
      userToken,
      dryRunSubmissionResult.data,
    );

    const submissionResult = await this.formService.Submission(
      "institutionlocation",
      payload,
    );

    await this.formsFlowService.createApplication({
      formId: submissionResult.formId,
      formUrl: submissionResult.absolutePath,
      submissionId: submissionResult.submissionId,
    });

    return createdInstitutionlocation.id;
  }
}
