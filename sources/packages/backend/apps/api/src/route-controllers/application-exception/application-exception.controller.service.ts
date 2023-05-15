import { Injectable, NotFoundException } from "@nestjs/common";
import { ApplicationExceptionService } from "../../services";
import { getUserFullName } from "../../utilities";
import { ApplicationExceptionAPIOutDTO } from "./models/application-exception.dto";

@Injectable()
export class ApplicationExceptionControllerService {
  constructor(
    private readonly applicationExceptionService: ApplicationExceptionService,
  ) {}

  /**
   * Get a student application exception detected after the student application was
   * submitted, for instance, when there are documents to be reviewed.
   * @param exceptionId exception to be retrieved.
   * @param studentId student id.
   * @returns student application exception information.
   */
  async getExceptionDetails(
    exceptionId: number,
    studentId?: number,
  ): Promise<ApplicationExceptionAPIOutDTO> {
    const applicationException =
      await this.applicationExceptionService.getExceptionDetails(
        exceptionId,
        studentId,
      );
    if (!applicationException) {
      throw new NotFoundException("Student application exception not found.");
    }
    return {
      exceptionStatus: applicationException.exceptionStatus,
      submittedDate: applicationException.createdAt,
      noteDescription: applicationException.exceptionNote?.description,
      assessedByUserName: getUserFullName(applicationException.assessedBy),
      assessedDate: applicationException.assessedDate,
      exceptionRequests: applicationException.exceptionRequests.map(
        (request) => ({
          exceptionName: request.exceptionName,
        }),
      ),
    };
  }
}
