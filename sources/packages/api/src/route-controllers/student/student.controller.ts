import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Get,
  Post,
  Patch,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { StudentService, AuthService } from '../../services';
import {
  CreateStudentDto,
  GetStudentContactDto,
  UpdateStudentContactDto,
} from './models/student.dto';
import { UserInfo } from '../../types';

@Controller('students')
export class StudentController {
  constructor(
    private readonly service: StudentService,
    private readonly authService: AuthService,
  ) {}

  @Get('contact')
  async getContactInfo(@Req() request: Request): Promise<GetStudentContactDto> {
    // TODOD: FIX with APP guard
    const userInfo: UserInfo = this.authService.parseAuthorizationHeader(
      request.headers.authorization,
    );
    if (
      !userInfo.userName ||
      !userInfo.email ||
      !userInfo.givenNames ||
      !userInfo.lastName
    ) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          message: 'Wrong token',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const student = await this.service.getStudentByUserName(userInfo.userName);
    if (!student) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          message: `No student was found with the user name ${userInfo.userName}`,
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
          message: `The requested student is missing required data. User name ${userInfo.userName}`,
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

  @Patch()
  async update(@Req() request: Request): Promise<UpdateStudentContactDto> {
    // TODOD: FIX with APP guard
    const userInfo: UserInfo = this.authService.parseAuthorizationHeader(
      request.headers.authorization,
    );
    if (
      !userInfo.userName ||
      !userInfo.email ||
      !userInfo.givenNames ||
      !userInfo.lastName
    ) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          message: 'Wrong token',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const student = await this.service.getStudentByUserName(userInfo.userName);
    if (!student) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          message: `No student was found with the user name ${userInfo.userName}`,
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
          message: `The requested student is missing required data. User name ${userInfo.userName}`,
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

  @Post()
  create(@Body() payload: CreateStudentDto, @Req() request: Request) {
    // TODOD: FIX with APP guard
    const userInfo: UserInfo = this.authService.parseAuthorizationHeader(
      request.headers.authorization,
    );
    if (
      !userInfo.userName ||
      !userInfo.email ||
      !userInfo.givenNames ||
      !userInfo.lastName
    ) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          message: 'Wrong token',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // Save student
    return this.service.createStudent(userInfo, payload);
  }
}
