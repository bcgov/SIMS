import {
  Controller,
  Param,
  UnprocessableEntityException,
  Get,
  ForbiddenException,
} from "@nestjs/common";
import { HasLocationAccess, AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  ApplicationService,
  InstitutionService,
  InstitutionLocationService,
} from "../../services";
import { Application } from "../../database/entities";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { COESummaryDTO } from "../application/models/application.model";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/location")
export class ConfirmationOfEnrollmentController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly institutionService: InstitutionService,
    private readonly locationService: InstitutionLocationService,
  ) {}

  /**
   * Get all application of a location in a institution
   * with Confirmation Of Enrollment(COE) status completed and required
   * @param locationId location that is completing the COE.
   * @returns student application list of an institution location
   */
  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Get(":locationId/confirmation-of-enrollment")
  async getCOESummary(
    @Param("locationId") locationId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<COESummaryDTO[]> {
    const applications = await this.applicationService.getCOEApplications(
      locationId,
    );
    return applications.map((eachApplication: Application) => {
      return {
        applicationNumber: eachApplication.applicationNumber,
        applicationId: eachApplication.id,
        studyStartPeriod: eachApplication?.offering?.studyStartDate ?? "",
        studyEndPeriod: eachApplication?.offering?.studyEndDate ?? "",
        coeStatus: eachApplication.coeStatus,
        firstName: eachApplication.student.user.firstName,
        lastName: eachApplication.student.user.lastName,
      };
    }) as COESummaryDTO[];
  }
}
