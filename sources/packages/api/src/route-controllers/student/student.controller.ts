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
  Res,
  UploadedFile,
  UseInterceptors,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { Response } from "express";
import {
  StudentFileService,
  StudentService,
  UserService,
  ATBCService,
  ApplicationService,
  EducationProgramService,
  FormService,
  StudentRestrictionService,
  APPLICATION_NOT_FOUND,
} from "../../services";
import {
  FileCreateDto,
  GetStudentContactDto,
  StudentEducationProgramDto,
  SearchStudentRespDto,
  SaveStudentDto,
  StudentRestrictionDTO,
  StudentDetailAPIOutDTO,
  StudentFileUploaderDTO,
  StudentInfo,
} from "./models/student.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiProcessError, ATBCCreateClientPayload } from "../../types";
import { FileInterceptor } from "@nestjs/platform-express";
import { Readable } from "stream";
import { StudentApplicationAndCount } from "../application/models/application.model";
import { Student, Application, AddressInfo } from "../../database/entities";
import {
  determinePDStatus,
  deliveryMethod,
  dateString,
  defaultFileFilter,
  uploadLimits,
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
import { transformAddressDetailsForAddressBlockForm } from "../utils/address-utils";
// For multipart forms, the max number of file fields.
const MAX_UPLOAD_FILES = 1;
// For multipart forms, the max number of parts (fields + files).
// 3 means 'the file' + uniqueFileName + group.
const MAX_UPLOAD_PARTS = 3;
@Controller("students")
@ApiTags("students")
export class StudentController extends BaseController {
  constructor(
    private readonly userService: UserService,
    private readonly studentService: StudentService,
    private readonly atbcService: ATBCService,
    private readonly fileService: StudentFileService,
    private readonly applicationService: ApplicationService,
    private readonly programService: EducationProgramService,
    private readonly formService: FormService,
    private readonly studentRestrictionService: StudentRestrictionService,
  ) {
    super();
  }

  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get("studentInfo")
  async getStudentInfo(
    @UserToken() userToken: IUserToken,
  ): Promise<StudentInfo> {
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
    const studentInfo: StudentInfo = {
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      email: existingUser.email,
      gender: existingStudent.gender,
      dateOfBirth: existingStudent.birthDate,
      contact: {
        address: transformAddressDetailsForAddressBlockForm(
          existingStudent.contactInfo.address,
        ),
        phone: existingStudent.contactInfo.phone,
      },
      pdVerified: existingStudent.studentPDVerified,
      validSin: existingStudent.sinValidation.isValidSIN,
      pdSentDate: existingStudent.studentPDSentAt,
      pdUpdatedDate: existingStudent.studentPDUpdateAt,
      pdStatus: determinePDStatus(existingStudent),
    };
    return studentInfo;
  }

  /**
   * Quick check to verify is there is an user
   * and student associated with the token information.
   * @param userToken authenticated user information.
   * @returns true if the student exists, otherwise false.
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get("check-student")
  async checkStudentExists(
    @UserToken() userToken: IUserToken,
  ): Promise<boolean> {
    if (!userToken.userId) {
      return false;
    }
    const student = await this.studentService.getStudentByUserId(
      userToken.userId,
    );
    return !!student;
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

    const address = student.contactInfo.address;

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
  @Patch("/sync")
  async synchronizeFromUserInfo(
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    await this.studentService.synchronizeFromUserInfo(userToken);
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
   * Allow files uploads to a particular student.
   * @param userToken authentication token.
   * @param file file content.
   * @param uniqueFileName unique file name (name+guid).
   * @param groupName friendly name to group files. Currently using
   * the value from 'Directory' property from form.IO file component.
   * @returns created file information.
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Post("files")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: uploadLimits(MAX_UPLOAD_FILES, MAX_UPLOAD_PARTS),
      fileFilter: defaultFileFilter,
    }),
  )
  async uploadFile(
    @UserToken() userToken: IUserToken,
    @UploadedFile() file: Express.Multer.File,
    @Body("uniqueFileName") uniqueFileName: string,
    @Body("group") groupName: string,
  ): Promise<FileCreateDto> {
    const student = await this.studentService.getStudentByUserId(
      userToken.userId,
    );

    if (!student) {
      throw new UnprocessableEntityException(
        "The user is not associated with a student.",
      );
    }

    const createdFile = await this.fileService.createFile(
      {
        fileName: file.originalname,
        uniqueFileName: uniqueFileName,
        groupName: groupName,
        mimeType: file.mimetype,
        fileContent: file.buffer,
      },
      student.id,
    );

    return {
      fileName: createdFile.fileName,
      uniqueFileName: createdFile.uniqueFileName,
      url: `students/files/${createdFile.uniqueFileName}`,
      size: createdFile.fileContent.length,
      mimetype: createdFile.mimeType,
    };
  }

  /**
   * Gets a student file validating if the student has access to it or if the user is Aest.
   * @param userToken authentication token.
   * @param uniqueFileName unique file name (name+guid).
   * @param response file content.
   */
  @AllowAuthorizedParty(AuthorizedParties.student, AuthorizedParties.aest)
  @Get("files/:uniqueFileName")
  async getUploadedFile(
    @UserToken() userToken: IUserToken,
    @Param("uniqueFileName") uniqueFileName: string,
    @Res() response: Response,
  ) {
    let studentFile = undefined;
    if (
      AuthorizedParties.aest === userToken.authorizedParty &&
      userToken.groups?.some((group) => UserGroups.AESTUser === group)
    ) {
      studentFile = await this.fileService.getStudentFileByUniqueName(
        uniqueFileName,
      );
    } else {
      const student = await this.studentService.getStudentByUserId(
        userToken.userId,
      );

      if (!student) {
        throw new UnprocessableEntityException(
          "The user is not associated with a student.",
        );
      }

      studentFile = await this.fileService.getStudentFile(
        student.id,
        uniqueFileName,
      );
    }

    if (!studentFile) {
      throw new NotFoundException(
        "Requested file was not found or you do not have access to it.",
      );
    }

    response.setHeader(
      "Content-Disposition",
      `attachment; filename=${studentFile.fileName}`,
    );
    response.setHeader("Content-Type", studentFile.mimeType);
    response.setHeader("Content-Length", studentFile.fileContent.length);

    const stream = new Readable();
    stream.push(studentFile.fileContent);
    stream.push(null);

    stream.pipe(response);
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

  /**
   * API to fetch student details by studentId.
   * This API will be used by ministry users.
   * @param studentId
   * @returns Student Details
   */
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get(":studentId/aest")
  async getStudentDetails(
    @Param("studentId") studentId: number,
  ): Promise<StudentDetailAPIOutDTO> {
    const student = await this.studentService.findById(studentId);
    const studentRestrictionStatus =
      await this.studentRestrictionService.getStudentRestrictionsByUserId(
        student.user.id,
      );
    const address = student.contactInfo.address ?? ({} as AddressInfo);
    return {
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      gender: student.gender,
      dateOfBirth: student.birthDate,
      contact: {
        address: {
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          provinceState: address.provinceState,
          country: address.country,
          postalCode: address.postalCode,
        },
        phone: student.contactInfo.phone,
      },
      pdStatus: determinePDStatus(student),
      hasRestriction: studentRestrictionStatus.hasRestriction,
    } as StudentDetailAPIOutDTO;
  }

  /**
   * This controller save the student files submitted
   * via student uploader form.
   *  All the file uploaded are first saved as temporary
   * file in the db.when this controller/api is called
   * during form submission, the temporary files
   * (saved during the upload) are update to its proper
   * group,file_origin and add the metadata (if available).
   * @Body payload
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Patch("upload-files")
  async saveStudentUploadedFiles(
    @UserToken() userToken: IUserToken,
    @Body() payload: StudentFileUploaderDTO,
  ): Promise<void> {
    const existingStudent = await this.studentService.getStudentByUserId(
      userToken.userId,
    );
    if (!existingStudent) {
      throw new NotFoundException("Student Not found");
    }
    if (payload.submittedForm.applicationNumber) {
      // Here we are checking the existence of an application irrespective of its status
      const validApplication =
        await this.applicationService.doesApplicationExist(
          payload.submittedForm.applicationNumber,
          existingStudent.id,
        );

      if (!validApplication) {
        throw new UnprocessableEntityException(
          new ApiProcessError(
            "Application number not found",
            APPLICATION_NOT_FOUND,
          ),
        );
      }
    }
    // All the file uploaded are first saved as temporary file in the db.
    // when this controller/api is called during form submission, the temporary
    // files (saved during the upload) are update to its proper group,file_origin
    //  and add the metadata (if available)
    await this.fileService.updateStudentFiles(
      existingStudent,
      payload.associatedFiles,
      payload.submittedForm,
    );
  }
}
