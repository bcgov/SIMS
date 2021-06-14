import { Body, Controller, Post, Param } from "@nestjs/common";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, HasLocationAccess } from "../../auth/decorators";
import { CreateEducationProgramOfferingDto } from "./models/create-education-program-offering.dto";
import { EducationProgramOfferingService } from "../../services";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/offering")
export class EducationProgramOfferingController {
  constructor(
    private readonly programOfferingService: EducationProgramOfferingService,
  ) {}

  @HasLocationAccess("locationId")
  @Post("location/:locationId/education-program/:programId")
  async create(
    @Body() payload: CreateEducationProgramOfferingDto,
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
  ): Promise<number> {
    const createdProgramOffering = await this.programOfferingService.createEducationProgramOffering(
      locationId,
      programId,
      payload,
    );
    return createdProgramOffering.id;
  }
}
