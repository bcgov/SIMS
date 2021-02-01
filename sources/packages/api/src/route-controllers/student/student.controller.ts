import { Body, Controller, HttpException, HttpStatus, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import jwtDecode from 'jwt-decode';
import { StudentService, AuthService } from '../../services';
import { CreateStudentDto } from './models/student.dto';
import { UserInfo } from '../../types'

@Controller('students')
export class StudentController {

  constructor(
    private readonly service: StudentService,
    private readonly authService: AuthService
    ) {}

  @Post()
  create(@Body() payload: CreateStudentDto, @Req() request: Request) {
    // TODOD: FIX with APP guard
    const userInfo: UserInfo = this.authService.parseAuthorizationHeader(request.headers.authorization);
    if (!userInfo.userName || !userInfo.email || !userInfo.givenNames || !userInfo.lastName) {
      throw new HttpException({
        status: HttpStatus.FORBIDDEN,
        message: 'Wrong token'
      }, HttpStatus.FORBIDDEN);
    }

    // Save student
    return this.service.createStudent(userInfo, payload);
  }
}
