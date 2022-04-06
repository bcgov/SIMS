import {
  Body,
  Controller,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  IsInstitutionAdmin,
  UserToken,
} from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";
import {
  ApplicationService,
  FormService,
  InstitutionLocationService,
  InstitutionService,
} from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { InstitutionLocationControllerService } from "./institution-location.controller.service";
import { InstitutionLocationInDto } from "./models/institution-location.dto";
import { PrimaryIdentifierDTO } from "../models/primary.identifier.dto";
/**
 * Institution location controller for institutions Client.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/location")
@ApiTags(`${ClientTypeBaseRoute.Institution}-institution`)
export class InstitutionLocationInstitutionsController extends BaseController {
  constructor(
    private readonly locationControllerService: InstitutionLocationControllerService,
    private readonly applicationService: ApplicationService,
    private readonly locationService: InstitutionLocationService,
    private readonly formService: FormService,
    private readonly institutionService: InstitutionService,
  ) {
    super();
  }

  @IsInstitutionAdmin()
  @Post()
  async create(
    @Body() payload: InstitutionLocationInDto,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierDTO> {
    // Validate the location data that will be saved to SIMS DB.
    const dryRunSubmissionResult = await this.formService.dryRunSubmission(
      "institutionlocation",
      payload,
    );

    if (!dryRunSubmissionResult.valid) {
      throw new UnprocessableEntityException(
        "Not able to create the institution location due to an invalid request.",
      );
    }

    //To retrieve institution id
    const institutionDetails =
      await this.institutionService.getInstituteByUserName(userToken.userName);
    if (!institutionDetails) {
      throw new UnprocessableEntityException(
        "Not able to find an institution associated with the current user name.",
      );
    }

    // If the data is valid the location is saved to SIMS DB.
    const createdInstitutionLocation =
      await this.locationService.createLocation(
        institutionDetails.id,
        dryRunSubmissionResult.data,
      );

    return { id: createdInstitutionLocation.id };
  }
}
