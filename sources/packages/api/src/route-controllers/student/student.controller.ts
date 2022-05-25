import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import {
  StudentService,
  ApplicationService,
  EducationProgramService,
  StudentRestrictionService,
} from "../../services";
import {
  StudentEducationProgramDto,
  StudentRestrictionDTO,
} from "./models/student.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { StudentApplicationAndCount } from "../application/models/application.model";
import { Application } from "../../database/entities";
import {
  deliveryMethod,
  credentialTypeToDisplay,
  FieldSortOrder,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  transformToApplicationSummaryDTO,
} from "../../utilities";
import { ApiTags } from "@nestjs/swagger";

@Controller("students")
@ApiTags("students")
export class StudentController extends BaseController {
  constructor(
    private readonly studentService: StudentService,
    private readonly applicationService: ApplicationService,
    private readonly programService: EducationProgramService,
    private readonly studentRestrictionService: StudentRestrictionService,
  ) {
    super();
  }

  /**
   * This returns only a part of the EducationProgram details for the student
   * @param programId
   * @returns StudentEducationProgramDto
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get("/education-program/:programId")
  async getStudentEducationProgram(
    @Param("programId") programId: number,
  ): Promise<StudentEducationProgramDto> {
    const educationProgram =
      await this.programService.getStudentEducationProgram(programId);
    return {
      id: educationProgram.id,
      name: educationProgram.name,
      description: educationProgram.description,
      credentialType: educationProgram.credentialType,
      credentialTypeToDisplay: credentialTypeToDisplay(
        educationProgram.credentialType,
      ),
      deliveryMethod: deliveryMethod(
        educationProgram.deliveredOnline,
        educationProgram.deliveredOnSite,
      ),
    };
  }

  /**
   * API to fetch all the applications that belong to student.
   * This API will be used by students.
   * @queryParm page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @queryParm pageLimit, page size or records per page, if nothing is
   * passed then DEFAULT_PAGE_LIMIT is taken
   * @queryParm sortField, field to be sorted
   * @queryParm sortOrder, order to be sorted
   * @returns Student Application list with total count
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get("application-summary")
  async getStudentApplicationSummary(
    @Query("sortField") sortField: string,
    @Query("sortOrder") sortOrder: FieldSortOrder,
    @UserToken() userToken: IUserToken,
    @Query("page") page = DEFAULT_PAGE_NUMBER,
    @Query("pageLimit") pageLimit = DEFAULT_PAGE_LIMIT,
  ): Promise<StudentApplicationAndCount> {
    const existingStudent = await this.studentService.getStudentByUserId(
      userToken.userId,
    );
    if (!existingStudent) {
      throw new NotFoundException("Student not found");
    }
    const applicationsAndCount =
      await this.applicationService.getAllStudentApplications(
        sortField,
        existingStudent.id,
        page,
        pageLimit,
        sortOrder,
      );

    return {
      applications: applicationsAndCount[0].map((application: Application) => {
        return transformToApplicationSummaryDTO(application);
      }),
      totalApplications: applicationsAndCount[1],
    };
  }

  /**
   * GET API which returns student restriction details.
   * @param userToken
   * @returns Student Restriction
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get("restriction")
  async getStudentRestrictions(
    @UserToken() userToken: IUserToken,
  ): Promise<StudentRestrictionDTO> {
    const studentRestrictionStatus =
      await this.studentRestrictionService.getStudentRestrictionsByUserId(
        userToken.userId,
      );
    return {
      hasRestriction: studentRestrictionStatus.hasRestriction,
      hasFederalRestriction: studentRestrictionStatus.hasFederalRestriction,
      hasProvincialRestriction:
        studentRestrictionStatus.hasProvincialRestriction,
      restrictionMessage: studentRestrictionStatus.restrictionMessage,
    } as StudentRestrictionDTO;
  }
}
