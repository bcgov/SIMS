import {
  NotFoundException,
  InternalServerErrorException,
  UnprocessableEntityException,
} from "@nestjs/common";

export default class ExceptionRaiser {
  static throwNotFoundException(exceptionMessage: string) {
    throw new NotFoundException(exceptionMessage);
  }

  static throwInternalServerErrorException(exceptionMessage: string) {
    throw new InternalServerErrorException(exceptionMessage);
  }

  static throwUnprocessableEntityException(exceptionMessage: string) {
    throw new UnprocessableEntityException(exceptionMessage);
  }
}
