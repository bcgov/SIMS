import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  NotFoundException,
  InternalServerErrorException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { StudentService, UserService } from "../../services";
import {
  CreateStudentDto,
  GetStudentContactDto,
  UpdateStudentContactDto,
} from "./models/student.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import { StudentInfo } from "../../types/studentInfo";
@Controller("students")
export class StudentController extends BaseController {
  constructor(
    private readonly userService: UserService,
    private readonly studentService: StudentService,
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
    const existingUser = await this.userService.getUser(userToken.userName);
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
}
