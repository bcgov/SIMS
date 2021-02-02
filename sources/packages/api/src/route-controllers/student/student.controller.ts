import { Body, Controller, HttpException, HttpStatus, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import jwtDecode from 'jwt-decode';
import { StudentService, AuthService, UserService } from '../../services';
import { CreateStudentDto } from './models/student.dto';
import { UserInfo } from '../../types'

@Controller('students')
export class StudentController {

  constructor(
    private readonly service: StudentService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    ) {}

  @Post()
  create(@Body() payload: CreateStudentDto, @Req() request: Request) {
    // TODOD: FIX with APP guard
    if (!request.headers.authorization) {
      throw new HttpException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorize user'
      }, HttpStatus.UNAUTHORIZED);
    }
    const userInfo: UserInfo = this.authService.parseAuthorizationHeader(request.headers.authorization);
    if (!userInfo.userName || !userInfo.email || !userInfo.givenNames || !userInfo.lastName) {
      throw new HttpException({
        status: HttpStatus.FORBIDDEN,
        message: 'Wrong token'
      }, HttpStatus.FORBIDDEN);
    }

    // Check user exists or not
    const existing = this.userService.getUser(userInfo.userName);
    if (existing) {
      throw new HttpException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'User already exists'
      }, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    // Save student
    return this.service.createStudent(userInfo, payload);
  }
}
