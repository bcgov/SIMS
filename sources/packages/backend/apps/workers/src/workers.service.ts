import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkersService {
  getHello(): string {
    return 'Hello World!';
  }
}
