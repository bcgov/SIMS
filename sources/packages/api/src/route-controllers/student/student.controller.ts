import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  NotFoundException,
  InternalServerErrorException,
  UnprocessableEntityException,
  Param,
  Query,
  BadRequestException,
} from "@nestjs/common";
import {
  StudentService,
  UserService,
  ATBCService,
  ApplicationService,
  EducationProgramService,
  FormService,
  StudentRestrictionService,
} from "../../services";
import {
  GetStudentContactDto,
  StudentEducationProgramDto,
  SearchStudentRespDto,
  SaveStudentDto,
  StudentRestrictionAPIOutDTO,
} from "./models/student.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken, StudentUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { StudentApplicationAndCount } from "../application/models/application.model";
import { Student, Application, AddressInfo } from "../../database/entities";
import {
  deliveryMethod,
  dateString,
  credentialTypeToDisplay,
  FieldSortOrder,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  transformToApplicationSummaryDTO,
} from "../../utilities";
import { UserGroups } from "../../auth/user-groups.enum";
import { Groups } from "../../auth/decorators";
import { FormNames } from "../../services/form/constants";
import { ApiTags } from "@nestjs/swagger";
import { ATBCCreateClientPayload } from "../../types";

@Controller("students")
@ApiTags("students")
export class StudentController extends BaseController {
  constructor(
    private readonly userService: UserService,
    private readonly studentService: StudentService,
    private readonly atbcService: ATBCService,
    private readonly applicationService: ApplicationService,
    private readonly programService: EducationProgramService,
    private readonly formService: FormService,
    private readonly studentRestrictionService: StudentRestrictionService,
  ) {
    super();
  }

  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get("contact")
  async getContactInfo(
    @UserToken() userToken: IUserToken,
  ): Promise<GetStudentContactDto> {
    const student = await this.studentService.getStudentByUserName(
      userToken.userName,
    );
    if (!student) {
      throw new NotFoundException(
        `No student was found with the student name ${userToken.userName}`,
      );
    }

    // The student will be created with one and only one
    // address for now. This address is also required.
    if (!student.contactInfo.address) {
      throw new InternalServerErrorException(
        `The requested student is missing required data. User name ${userToken.userName}`,
      );
    }

    const address = student.contactInfo.address ?? ({} as AddressInfo);

    return {
      phone: student.contactInfo.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      provinceState: address.provinceState,
      country: address.country,
      postalCode: address.postalCode,
    };
  }

  @AllowAuthorizedParty(AuthorizedParties.student)
  @Patch("contact")
  async update(
    @UserToken() userToken: IUserToken,
    @Body() payload: SaveStudentDto,
  ): Promise<void> {
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.StudentInformation,
      payload,
    );
    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to update a student due to an invalid request.",
      );
    }

    this.studentService.updateStudentContactByUserName(
      userToken.userName,
      submissionResult.data.data,
    );
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
   * Creates the student checking for an existing user to be used or
   * creating a new one in case the user id is not provided.
   * The user could be already available in the case of the same user
   * was authenticated previously on another portal (e.g. parent/partner).
   * @param payload information needed to create/update the user.
   * @param userToken authenticated user information.
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Post()
  async create(
    @UserToken() userToken: IUserToken,
    @Body() payload: SaveStudentDto,
  ): Promise<void> {
    if (userToken.userId) {
      // If the user already exists, verify if there is already a student
      // associated with the existing user.
      const existingStudent = await this.studentService.getStudentByUserId(
        userToken.userId,
      );
      if (existingStudent) {
        throw new UnprocessableEntityException(
          "There is already a student associated with the user.",
        );
      }
    }

    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.StudentInformation,
      payload,
    );
    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to create a student due to an invalid request.",
      );
    }

    await this.studentService.createStudent(userToken, {
      ...submissionResult.data.data,
      sinNumber: payload.sinNumber,
    });
  }

  @AllowAuthorizedParty(AuthorizedParties.student)
  @Patch("/apply-pd-status")
  async applyForPDStatus(@UserToken() userToken: IUserToken): Promise<void> {
    // Get student details
    const existingStudent = await this.studentService.getStudentByUserName(
      userToken.userName,
    );
    if (!existingStudent) {
      throw new NotFoundException(
        `No student was found with the student name ${userToken.userName}`,
      );
    }
    // Check user exists or not
    const existingUser = await this.userService.getActiveUser(
      userToken.userName,
    );
    if (!existingUser) {
      throw new NotFoundException(
        `No user record was found with for student ${userToken.userName}`,
      );
    }
    // Check the PD status in DB. Student should only be allowed to check the PD status once
    // existingStudent?.studentPDSentAt is set when student apply for PD Status first.
    // studentPDVerified is null before PD checker update status;
    // studentPDVerified is true if PD Confirmed by ATBC OR is true from sfas_individual table;
    // studentPDVerified is false if PD Denied by ATBC.
    // if student has a SIN valid only, he/she should allow for a PD check.

    if (
      existingStudent.sinValidation.isValidSIN &&
      !existingStudent.studentPDSentAt &&
      existingStudent.studentPDVerified === null
    ) {
      // create client payload
      const payload: ATBCCreateClientPayload = {
        SIN: existingStudent.sin,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        email: existingUser.email,
        birthDate: existingStudent.birthDate,
      };
      // api to create student profile in ATBC
      const response = await this.atbcService.ATBCCreateClient(payload);
      if (response) {
        //code to update PD Sent Date
        await this.studentService.updatePDSentDate(existingStudent.id);
      }
    }
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
   * Search the student based on the search criteria.
   * @param firstName firsName of the student.
   * @param lastName lastName of the student.
   * @param appNumber application number of the student.
   * @returns Searched student details.
   */
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @Get("search")
  async searchStudents(
    @Query("firstName") firstName: string,
    @Query("lastName") lastName: string,
    @Query("appNumber") appNumber: string,
  ): Promise<SearchStudentRespDto[]> {
    if (!appNumber && !firstName && !lastName) {
      throw new UnprocessableEntityException(
        "Search with at least one search criteria",
      );
    }
    const searchStudentApplications =
      await this.studentService.searchStudentApplication(
        firstName,
        lastName,
        appNumber,
      );
    return searchStudentApplications.map((eachStudent: Student) => ({
      id: eachStudent.id,
      firstName: eachStudent.user.firstName,
      lastName: eachStudent.user.lastName,
      birthDate: dateString(eachStudent.birthDate),
    }));
  }
  /**
   * TODO: This api will be called by UI and update states, in future restriction UI ticket
   * GET API which returns student restriction details.
   * @param studentToken student token.
   * @returns Student restriction code and notification type, if any.
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get("restriction")
  async getStudentRestrictions(
    @UserToken() studentToken: StudentUserToken,
  ): Promise<StudentRestrictionAPIOutDTO[]> {
    const studentRestrictions =
      await this.studentRestrictionService.getStudentRestrictionsById(
        studentToken.studentId,
      );

    return studentRestrictions?.map((studentRestriction) => ({
      code: studentRestriction.restriction.restrictionCode,
      type: studentRestriction.restriction.notificationType,
    }));
  }
}
