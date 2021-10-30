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
} from "../../services";
import {
  FileCreateDto,
  GetStudentContactDto,
  StudentEducationProgramDto,
  SearchStudentRespDto,
  SaveStudentDto,
  StudentRestrictionDTO,
} from "./models/student.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import { StudentInfo } from "../../types/studentInfo";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ATBCCreateClientPayload } from "../../types";
import { FileInterceptor } from "@nestjs/platform-express";
import { Readable } from "stream";
import { StudentApplicationDTO } from "../application/models/application.model";
import { Application, Student } from "../../database/entities";
import {
  determinePDStatus,
  deliveryMethod,
  dateString,
  credentialTypeToDisplay,
  defaultFileFilter,
  uploadLimits,
} from "../../utilities";
import { UserGroups } from "../../auth/user-groups.enum";
import { Groups } from "../../auth/decorators";
import { FormNames } from "../../services/form/constants";

// For multipart forms, the max number of file fields.
const MAX_UPLOAD_FILES = 1;
// For multipart forms, the max number of parts (fields + files).
// 3 means 'the file' + uniqueFileName + group.
const MAX_UPLOAD_PARTS = 3;

@AllowAuthorizedParty(AuthorizedParties.student)
@Controller("students")
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
      dateOfBirth: existingStudent.birthdate,
      contact: {
        ...existingStudent.contactInfo.addresses[0],
        provinceState: existingStudent.contactInfo.addresses[0].province,
        phone: existingStudent.contactInfo.phone,
      },
      pdVerified: existingStudent.studentPDVerified,
      validSin: existingStudent.validSIN,
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
    if (student.contactInfo.addresses.length == 0) {
      throw new InternalServerErrorException(
        `The requested student is missing required data. User name ${userToken.userName}`,
      );
    }

    const address = student.contactInfo.addresses[0];

    return {
      phone: student.contactInfo.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      provinceState: address.province,
      country: address.country,
      postalCode: address.postalCode,
    };
  }

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
      payload,
    );
  }

  /**
   * This returns only a part of the EducationProgram details for the student
   * @param programId
   * @returns StudentEducationProgramDto
   */
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
      credentialTypeToDisplay: credentialTypeToDisplay(
        educationProgram.credentialType,
        educationProgram.credentialTypeOther,
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
      ...payload,
      sinNumber: payload.sinNumber,
    });
  }

  @Patch("/sync")
  async synchronizeFromUserInfo(
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    await this.studentService.synchronizeFromUserInfo(userToken);
  }

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
    //check pd status in db, student should only allowed to check PD status once
    // existingStudent?.studentPDSentAt is set when student apply for PD Status first
    // studentPDVerified is null  before PD checker update status
    // studentPDVerified is true if PD Confirmed by ATBC OR is true from `SFASDB
    // studentPDVerified is false if PD Denied by ATBC
    // if student has a SIN valid only, he/she should allow for a PD check

    if (
      existingStudent.validSIN &&
      !existingStudent.studentPDSentAt &&
      existingStudent.studentPDVerified === null
    ) {
      // create client payload
      const payload: ATBCCreateClientPayload = {
        SIN: existingStudent.sin,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        email: existingUser.email,
        birthDate: new Date(existingStudent.birthdate),
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
   * Gets a student file validating if the user has the access to it.
   * @param userToken authentication token.
   * @param uniqueFileName unique file name (name+guid).
   * @param response file content.
   */
  @Get("files/:uniqueFileName")
  async getUploadedFile(
    @UserToken() userToken: IUserToken,
    @Param("uniqueFileName") uniqueFileName: string,
    @Res() response: Response,
  ) {
    const student = await this.studentService.getStudentByUserId(
      userToken.userId,
    );

    if (!student) {
      throw new UnprocessableEntityException(
        "The user is not associated with a student.",
      );
    }

    const studentFile = await this.fileService.getStudentFile(
      student.id,
      uniqueFileName,
    );

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

  @Get("application-summary")
  async getStudentApplicationSummary(
    @UserToken() userToken: IUserToken,
  ): Promise<StudentApplicationDTO[]> {
    const existingStudent = await this.studentService.getStudentByUserId(
      userToken.userId,
    );
    if (!existingStudent) {
      throw new NotFoundException(
        `No student was found with the student id ${userToken.userId}`,
      );
    }
    const application = await this.applicationService.getAllStudentApplications(
      existingStudent.id,
    );
    return application.map((eachApplication: Application) => {
      return {
        applicationNumber: eachApplication.applicationNumber,
        id: eachApplication.id,
        studyStartPeriod: eachApplication.offering?.studyStartDate ?? "",
        studyEndPeriod: eachApplication.offering?.studyEndDate ?? "",
        // TODO: when application name is captured, update the below line
        applicationName: "Financial Aid Application",
        // TODO: when award is captured, update the below line
        award: "5500",
        status: eachApplication.applicationStatus,
      };
    }) as StudentApplicationDTO[];
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
      birthDate: dateString(eachStudent.birthdate),
    }));
  }
  /**
   * GET API which returns student restriction details.
   * @param userToken
   * @returns Student Restriction
   */
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
