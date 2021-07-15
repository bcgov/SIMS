import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  NotFoundException,
  InternalServerErrorException,
  UnprocessableEntityException,
  NotAcceptableException,
} from "@nestjs/common";
import { StudentService, UserService, ATBCService } from "../../services";
import {
  CreateStudentDto,
  GetStudentContactDto,
  UpdateStudentContactDto,
} from "./models/student.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import { StudentInfo } from "../../types/studentInfo";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ATBCCreateClientPayload, ATBCPDCheckerPayload } from "../../types";

@AllowAuthorizedParty(AuthorizedParties.student)
@Controller("students")
export class StudentController extends BaseController {
  constructor(
    private readonly userService: UserService,
    private readonly studentService: StudentService,
    private readonly atbcService: ATBCService,
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
      sin: existingStudent.sin,
      pdVerified: existingStudent.studentPDVerified,
      validSin: existingStudent.validSIN ?? false,
      pdSentDate: existingStudent.StudentPDSentAt,
      pdUpdatedDate: existingStudent.StudentPDUpdateAt,
      pdStatus: existingStudent.StudentPDStatus,
    };
    return studentInfo;
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
    @Body() payload: UpdateStudentContactDto,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    this.studentService.updateStudentContactByUserName(
      userToken.userName,
      payload,
    );
  }

  @Post()
  async create(
    @Body() payload: CreateStudentDto,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    // Check user exists or not
    const existingUser = await this.userService.getUser(userToken.userName);
    if (existingUser) {
      throw new UnprocessableEntityException("User already exists");
    }

    // Save student
    await this.studentService.createStudent(userToken, payload);
  }

  @Patch("/sync")
  async synchronizeFromUserInfo(
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    await this.studentService.synchronizeFromUserInfo(userToken);
  }

  @Get("/apply-PD-status")
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
    //check pd status in db, student should only allowed to check PD status once
    // existingStudent?.StudentPDSentAt is set when student apply for PD Status first
    // StudentPDStatus is null  before PD checker update status
    // StudentPDStatus is true if PD Confirmed by ATBC
    // StudentPDStatus is false if PD Denied by ATBC
    // if student has a valid only, he/she should allow for a PD check

    if (
      (existingStudent?.validSIN ?? false) &&
      !existingStudent?.StudentPDSentAt &&
      existingStudent?.StudentPDStatus === null
    ) {
      // create client payload
      const payload: ATBCCreateClientPayload = {
        SIN: existingStudent?.sin,
        firstName: userToken?.givenNames,
        lastName: userToken?.lastName,
        birthDate: userToken?.birthdate,
        email: userToken?.email,
      };
      // api to create student profile in ATBC
      const response = await this.atbcService.ATBCcreateClient(payload);
      if (response?.code === 200) {
        //code to update PD Sent Date
        await this.studentService.updatePDSentDate(existingStudent?.id);
      }
    } else {
      let msg = "";
      if (!(existingStudent?.validSIN ?? false))
        msg = `${userToken.userName}'s sin is not valid`;
      if (existingStudent?.StudentPDSentAt)
        msg = `${userToken.userName}'s already applied for PD status`;
      if (!(existingStudent?.StudentPDStatus === null))
        msg = `${userToken.userName}'s PD status already captured`;
      throw new NotAcceptableException(msg);
    }
  }

  @Get("/PD-check")
  async PDCheck(@UserToken() userToken: IUserToken): Promise<void> {
    // Get student details
    const existingStudent = await this.studentService.getStudentByUserName(
      userToken.userName,
    );
    if (!existingStudent) {
      throw new NotFoundException(
        `No student was found with the student name ${userToken.userName}`,
      );
    }
    // if student has a valid only, he/she should allow for a PD check
    if (
      (existingStudent?.validSIN ?? false) &&
      existingStudent?.StudentPDSentAt &&
      existingStudent?.StudentPDStatus === null
    ) {
      // create PD checker payload
      const payload: ATBCPDCheckerPayload = {
        id: existingStudent?.sin,
      };
      // api to check the student PD status in ATBC
      const response = await this.atbcService.ATBCPDChecker(payload);

      let status = false;
      if (response?.e9yStatusId === 1) {
        // code to update PD Status and update date
        // code to set PD Status
        status = true;
      }
      await this.studentService.updatePDStatusNDate(
        existingStudent?.id,
        status,
      );
    } else {
      let msg = "";
      if (!(existingStudent?.validSIN ?? false))
        msg = `${userToken.userName}'s sin is not valid`;
      if (!existingStudent?.StudentPDSentAt)
        msg = `${userToken.userName}'s profile not created at ATBC`;
      if (!(existingStudent?.StudentPDStatus === null))
        msg = `${userToken.userName}'s PD status already captured`;
      throw new NotAcceptableException(msg);
    }
  }
}
