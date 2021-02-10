import {
  Body,
  Controller,
  HttpException,
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
} from "./models/student.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
@Controller("students")
export class StudentController {
  constructor(
    private readonly service: StudentService,
    private readonly userService: UserService,
    private readonly studentService: StudentService,
  ) {}

  @Get("contact")
  async getContactInfo(
    @UserToken() userToken: IUserToken,
  ): Promise<GetStudentContactDto> {
    const student = await this.service.getStudentByUserName(userToken.userName);
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
    this.service.updateStudentContactByUserName(userToken.userName, payload);
  }

  @Post()
  async create(
    @Body() payload: CreateStudentDto,
    @UserToken() userToken: IUserToken,
  ) {
    // Check user exists or not
    const existing = await this.userService.getUser(userToken.userName);
    if (existing) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message: "User already exists",
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Save student
    return this.service.createStudent(userToken, payload);
  }

  @Patch("/sync")
  async synchronizeFromUserInfo(
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    await this.studentService.synchronizeFromUserInfo(userToken);
  }
}
