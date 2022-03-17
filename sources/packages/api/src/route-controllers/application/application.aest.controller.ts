import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import {
  ApplicationService,
  EducationProgramOfferingService,
  InstitutionLocationService,
  EducationProgramService,
} from "../../services";
import BaseController from "../BaseController";
import {
  GetApplicationBaseDTO,
  transformToApplicationDto,
  StudentApplicationAndCount,
  ApplicationFormData,
} from "./models/application.model";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import { Application } from "../../database/entities";
import {
  FieldSortOrder,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  transformToApplicationSummaryDTO,
  getOfferingNameAndPeriod,
} from "../../utilities";
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("application")
@ApiTags("application")
export class ApplicationAESTController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly offeringService: EducationProgramOfferingService,
    private readonly locationService: InstitutionLocationService,
    private readonly programService: EducationProgramService,
  ) {
    super();
  }

  /**
   * API to fetch application details by applicationId.
   * This API will be used by ministry users.
   * @param applicationId
   * @returns Application details
   */
  @Get(":applicationId")
  @ApiOkResponse({ description: "Application details fetched." })
  @ApiNotFoundResponse({ description: "Application not found." })
  async getApplication(
    @Param("applicationId") applicationId: number,
  ): Promise<GetApplicationBaseDTO> {
    const application = await this.applicationService.getApplicationByIdAndUser(
      applicationId,
    );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }
    const additionalFormData = {} as ApplicationFormData;
    // Check wether the selected location is designated or not.
    // If selected location is not designated, then make the
    // selectedLocation null
    if (application.data.selectedLocation) {
      const designatedLocation =
        await this.locationService.getDesignatedLocationById(
          application.data.selectedLocation,
        );
      const selectedLocation = await this.locationService.getLocationById(
        application.data.selectedLocation,
      );
      if (!designatedLocation) {
        application.data.selectedLocation = null;
      }
      // Assign location name for readonly form
      additionalFormData.selectedLocationName = selectedLocation.name;
    }
    // Check wether the program is approved or not.
    // If selected program is not approved, then make the
    // selectedLocation null
    if (application.data.selectedProgram) {
      const selectedProgram = await this.programService.getProgramById(
        application.data.selectedProgram,
      );
      if (selectedProgram) {
        // Assign program name for readonly form
        additionalFormData.selectedProgramName = selectedProgram.name;
      }
    }
    // Get selected offering details.
    if (application.data.selectedOffering) {
      const selectedOffering = await this.offeringService.getOfferingById(
        application.data.selectedOffering,
      );
      if (selectedOffering) {
        additionalFormData.selectedOfferingName =
          getOfferingNameAndPeriod(selectedOffering);
      }
    }

    return transformToApplicationDto(application, additionalFormData);
  }
  /**
   * API to fetch all the applications that belong to student.
   * This API will be used by ministry users.
   * @param studentId student id
   * @queryParm page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @queryParm pageLimit, page size or records per page, if nothing is
   * passed then DEFAULT_PAGE_LIMIT is taken
   * @queryParm sortField, field to be sorted
   * @queryParm sortOrder, order to be sorted
   * @returns Student Application list with total count
   */
  @ApiOkResponse({ description: "All student applications retrieved." })
  @Get("student/:studentId")
  async getSummaryByStudentId(
    @Query("sortField") sortField: string,
    @Query("sortOrder") sortOrder: FieldSortOrder,
    @Param("studentId") studentId: number,
    @Query("page") page = DEFAULT_PAGE_NUMBER,
    @Query("pageLimit") pageLimit = DEFAULT_PAGE_LIMIT,
  ): Promise<StudentApplicationAndCount> {
    const [applications, count] =
      await this.applicationService.getAllStudentApplications(
        sortField,
        studentId,
        page,
        pageLimit,
        sortOrder,
      );

    return {
      applications: applications.map((application: Application) => {
        return transformToApplicationSummaryDTO(application);
      }),
      totalApplications: count,
    };
  }
}
