import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import { ApplicationService } from "../../services";
import BaseController from "../BaseController";
import {
  GetApplicationBaseDTO,
  StudentApplicationAndCount,
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
} from "../../utilities";
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ClientTypeBaseRoute } from "../../types";
import { ApplicationControllerService } from "./application.controller.service";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("application")
@ApiTags(`${ClientTypeBaseRoute.AEST}-application`)
export class ApplicationAESTController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly applicationControllerService: ApplicationControllerService,
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

    application.data =
      await this.applicationControllerService.generateApplicationFormData(
        application.data,
      );
    return this.applicationControllerService.transformToApplicationForAESTDTO(
      application,
    );
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
