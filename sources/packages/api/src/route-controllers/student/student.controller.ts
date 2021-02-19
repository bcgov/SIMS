import {
  Body,
  Controller,
  HttpException,
  NotFoundException,
  HttpStatus,
  Get,
  Post,
  Patch,
} from "@nestjs/common";
import { StudentService, UserService } from "../../services";
import {
  CreateStudentDto,
  GetStudentContactDto,
  UpdateStudentContactDto,
  StudentInfo,
} from "./models/student.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import Helper from "../../helpers/utilfunctions";

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
        `No student was found with the student name ${userToken.userName}`,
      );
    }

    const studentInfo = new StudentInfo();
    studentInfo.firstName = existingUser.firstName;
    studentInfo.lastName = existingUser.lastName;
    studentInfo.email = existingUser.email;
    studentInfo.dateOfBirth = existingStudent.birthdate;
    studentInfo.gender = existingStudent.gender;
    studentInfo.contact.phone = existingStudent.contactInfo.phone;
    Helper.mapAddressAttributes(
      existingStudent.contactInfo.addresses[0],
      studentInfo,
    );

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
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          message: `No student was found with the user name ${userToken.userName}`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // The student will be created with one and only one
    // address for now. This address is also required.
    if (student.contactInfo.addresses.length == 0) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `The requested student is missing required data. User name ${userToken.userName}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
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
  ) {
    // Check user exists or not
    const existingUser = await this.userService.getUser(userToken.userName);
    if (existingUser) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message: "User already exists",
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Save student
    return this.studentService.createStudent(userToken, payload);
  }

  @Patch("/sync")
  async synchronizeFromUserInfo(
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    await this.studentService.synchronizeFromUserInfo(userToken);
  }
}
