import {
  Body,
  Controller,
  Post,
  Param,
  Get,
  UnprocessableEntityException,
} from "@nestjs/common";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, HasLocationAccess } from "../../auth/decorators";
import {
  CreateEducationProgramOfferingDto,
  EducationProgramOfferingDto,
} from "./models/create-education-program-offering.dto";
import { FormNames } from "../../services/form/constants";
import { EducationProgramOfferingService, FormService } from "../../services";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/offering")
export class EducationProgramOfferingController {
  constructor(
    private readonly programOfferingService: EducationProgramOfferingService,
    private readonly formService: FormService,
  ) {}

  @HasLocationAccess("locationId")
  @Post("location/:locationId/education-program/:programId")
  async create(
    @Body() payload: CreateEducationProgramOfferingDto,
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
  ): Promise<number> {
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.EducationProgramOffering,
      payload,
    );

    if (!submissionResult.valid) {
      throw new UnprocessableEntityException(
        "Not able to a create a program offering due to an invalid request.",
      );
    }

    const createdProgramOffering = await this.programOfferingService.createEducationProgramOffering(
      locationId,
      programId,
      payload,
    );
    return createdProgramOffering.id;
  }

  @HasLocationAccess("locationId")
  @Get("location/:locationId/education-program/:programId")
  async getAllEducationProgramOffering(
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
  ): Promise<EducationProgramOfferingDto[]> {
    //To retrive Education program offering corresponding to ProgramId and LocationId
    const programOferingList = await this.programOfferingService.getAllEducationProgramOffering(
      locationId,
      programId,
    );
    if (!programOferingList) {
      throw new UnprocessableEntityException(
        "Not able to find a Education Program Offering associated with the current Education Program and Location.",
      );
    }
    return programOferingList.map((offering) => ({
      id: offering.id,
      name: offering.name,
      studyDates: offering.studyDates,
      offeringDelivered: offering.offeringDelivered,
    }));
  }
}
